const axios = require("axios");
const paystackConfig = require("../config/paystackConfig.js");

const { server, StellarSdk } = require("../stellar/stellarConnect.js");
const stellarConfig = require("../config/stellarConfig.js");
const fetch = import("node-fetch");

const db = require("../models");
const UserModel = db.users;

const fs = require("fs").promises;
const path = require("path");

// Track processed references to prevent duplicates
const processedReferences = new Set();

exports.createPaymentIntent = async (req, res) => {
  const userId = req.user.userId;
  console.log(`Fetching profile details for userId: ${userId}`);

  const { amount } = req.body;

  try {
    // Fetching the user's profile from the database
    const user = await UserModel.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User details not found!" });
    }

    const userEmail = user.email;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: amount * 100,
        email: userEmail,
        callback_url: `${process.env.BASE_URL}/api/paystack/callback`,
        metadata: {
          userId: userId,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error creating Paystack payment intent:", error);
    res.status(500).json({ error: "Failed to create Paystack payment intent" });
  }
};

exports.verifyPayment = async (req, res) => {
  const { reference } = req.body;

  // Check if reference has already been processed
  if (processedReferences.has(reference)) {
    return res.json({
      success: false,
      message: "Payment reference has already been processed",
    });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Paystack response:", response.data);

    if (response.data.status && response.data.data.status === "success") {
      // Add reference to processed set
      processedReferences.add(reference);

      res.json({
        success: true,
        amount: response.data.data.amount / 100,
        userId: response.data.data.customer.id,
      });
    } else {
      res.json({
        success: false,
        message: response.data.data.gateway_response,
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send({ success: false, error: "Failed to verify payment" });
  }
};

exports.mintTokens = async (req, res) => {
  const { userId, amount } = req.body;
  console.log(`Minting tokens for userId: ${userId} with amount: ${amount}`);

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      console.error("User not found for userId:", userId);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const issuingPublicKey = StellarSdk.Keypair.fromSecret(
      stellarConfig.ISSUING_ACCOUNT_SECRET
    ).publicKey();
    const distributionKeys = StellarSdk.Keypair.fromSecret(
      stellarConfig.DISTRIBUTION_ACCOUNT_SECRET
    );
    const fucAsset = new StellarSdk.Asset("FUC", issuingPublicKey);

    // Ensuring Distribution Account Trustline
    console.log("Loading distribution account");
    const distributionAccount = await server.loadAccount(
      distributionKeys.publicKey()
    );

    const distributionTrustlineExists = distributionAccount.balances.some(
      (balance) =>
        balance.asset_code === "FUC" &&
        balance.asset_issuer === issuingPublicKey
    );

    if (!distributionTrustlineExists) {
      console.log("Creating trustline for the distribution account");
      const trustlineTransaction = new StellarSdk.TransactionBuilder(
        distributionAccount,
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        }
      )
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: fucAsset,
          })
        )
        .setTimeout(100)
        .build();

      trustlineTransaction.sign(distributionKeys);
      console.log("Submitting distribution trustline transaction");
      await server.submitTransaction(trustlineTransaction);
      console.log("Trustline created for the distribution account");
    } else {
      console.log("Distribution account trustline already exists");
    }

    // Loading user account to check trustline
    console.log("Loading user account");
    const userAccount = await server.loadAccount(user.stellarPublicKey);
    const userHasTrustline = userAccount.balances.some(
      (balance) =>
        balance.asset_code === "FUC" &&
        balance.asset_issuer === issuingPublicKey
    );

    if (!userHasTrustline) {
      console.log(`Creating trustline for user: ${user.stellarPublicKey}`);

      const trustlineTransaction = new StellarSdk.TransactionBuilder(
        userAccount,
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        }
      )
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: fucAsset,
          })
        )
        .setTimeout(100)
        .build();

      trustlineTransaction.sign(
        StellarSdk.Keypair.fromSecret(user.stellarSecretKey)
      );
      await server.submitTransaction(trustlineTransaction);
      console.log(`Trustline created for user: ${user.stellarPublicKey}`);
    }

    // Loading distribution account again to ensure it's up-to-date
    const updatedDistributionAccount = await server.loadAccount(
      distributionKeys.publicKey()
    );

    const paymentTransaction = new StellarSdk.TransactionBuilder(
      updatedDistributionAccount,
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      }
    )
      .addOperation(
        StellarSdk.Operation.payment({
          destination: user.stellarPublicKey,
          asset: fucAsset,
          amount: amount.toString(),
        })
      )
      .setTimeout(100)
      .build();

    console.log("Payment transaction built");
    paymentTransaction.sign(distributionKeys);
    console.log("Payment transaction signed");

    const result = await server.submitTransaction(paymentTransaction);
    console.log("Payment transaction submitted", result);

    res.json({ success: true, message: "Tokens minted successfully" });
  } catch (error) {
    console.error("Mint tokens error:", error.response?.data || error);

    if (error.response) {
      console.error("Response error data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);

      const extras = error.response.data.extras;
      if (extras) {
        const resultCodes = extras.result_codes;
        console.error("Transaction result codes:", resultCodes);
        if (resultCodes.operations) {
          resultCodes.operations.forEach((operation, index) => {
            console.error(`Operation ${index + 1} result code:`, operation);
          });
        }
      }
    } else if (error.request) {
      console.error("Request error:", error.request);
    } else {
      console.error("General error message:", error.message);
    }

    res.status(500).json({ success: false, message: "Mint tokens failed" });
  }
};

exports.handleCallback = async (req, res) => {
  const { reference, trxref } = req.query;
  const paymentReference = reference || trxref;

  // Check if reference has already been processed
  if (processedReferences.has(paymentReference)) {
    const alreadyProcessedHtml = await renderTemplate(
      "payment-already-processed"
    );
    return res.send(alreadyProcessedHtml);
  }

  try {
    console.log("Callback received for reference:", paymentReference);

    // Verify payment
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      verifyResponse.data.status &&
      verifyResponse.data.data.status === "success"
    ) {
      const paymentData = verifyResponse.data.data;
      const userId =
        paymentData.metadata.userId ||
        paymentData.metadata.custom_fields?.find(
          (f) => f.variable_name === "user_id"
        )?.value;
      const amount = paymentData.amount / 100;

      if (userId) {
        // Mark reference as processed
        processedReferences.add(paymentReference);

        // Call mintTokens
        try {
          const mockReq = { body: { userId: userId, amount: amount } };
          const mockRes = {
            json: (data) => console.log("Mint result:", data),
            status: (code) => ({
              json: (data) => console.log("Mint error:", code, data),
            }),
          };

          await exports.mintTokens(mockReq, mockRes);

          console.log("Tokens minted successfully for user:", userId);

          // Success response
          const successHtml = await renderTemplate("payment-success", {
            amount,
          });
          res.send(successHtml);
        } catch (mintError) {
          console.error("Token minting failed:", mintError);
          const mintErrorHtml = await renderTemplate("payment-error", {
            title: "Token Minting Failed",
            message:
              "Payment was successful but token minting failed. Please contact support.",
          });
          res.status(500).send(mintErrorHtml);
        }
      } else {
        console.error("No userId found in payment metadata");
        const userErrorHtml = await renderTemplate("payment-error", {
          title: "User Data Missing",
          message: "User ID not found in payment data. Please contact support.",
        });
        res.status(400).send(userErrorHtml);
      }
    } else {
      console.log("Payment verification failed");
      const verificationErrorHtml = await renderTemplate("payment-error", {
        title: "Payment Verification Failed",
        message:
          "We could not verify your payment. Please contact support if you believe this is an error.",
      });
      res.status(400).send(verificationErrorHtml);
    }
  } catch (error) {
    console.error("Callback error:", error);
    const generalErrorHtml = await renderTemplate("payment-error", {
      title: "Payment Processing Error",
      message:
        "An error occurred while processing your payment. Please contact support.",
    });
    res.status(500).send(generalErrorHtml);
  }
};

const renderTemplate = async (templateName, data = {}) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      `${templateName}.html`
    );
    let html = await fs.readFile(templatePath, "utf8");

    // Template replacement
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, data[key]);
    });

    return html;
  } catch (error) {
    console.error("Template rendering error:", error);
    return "<html><body><h2>Error loading page</h2></body></html>";
  }
};

//needed?
exports.createWithdrawIntent = async (req, res) => {
  const { userId, amount, bankDetails } = req.body;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).send({ error: "Insufficient balance" });
    }

    const withdrawIntent = {
      userId: userId,
      amount: amount,
      bankDetails: bankDetails,
    };

    // await WithdrawIntentModel.create(withdrawIntent);

    res.send({ message: "Withdraw intent created", withdrawIntent });
  } catch (error) {
    res.status(500).send({ error: "Error creating withdraw intent" });
  }
};

exports.processWithdrawal = async (req, res) => {
  const { userId, amount, bankDetails } = req.body;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).send({ error: "Insufficient balance" });
    }

    wallet.balance -= parseFloat(amount);
    await wallet.save();

    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100, // Paystack expects amount in kobo
        recipient: bankDetails.recipientCode,
        reason: "Withdrawal from wallet",
      },
      {
        headers: {
          Authorization: `Bearer ${withdrawSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      res.send({ message: "Withdrawal successful", data: response.data });
    } else {
      wallet.balance += parseFloat(amount);
      await wallet.save();
      res.status(400).send({ error: "Withdrawal failed", data: response.data });
    }
  } catch (error) {
    wallet.balance += parseFloat(amount);
    await wallet.save();
    res
      .status(500)
      .send({ error: "Error processing withdrawal", details: error.message });
  }
};
