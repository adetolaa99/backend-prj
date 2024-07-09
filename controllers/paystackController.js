const axios = require("axios");
const paystackConfig = require("../config/paystackConfig.js");

const { server, StellarSdk } = require("../stellar/stellarConnect.js");
const stellarConfig = require("../config/stellarConfig.js");
const fetch = import("node-fetch");

const db = require("../models");
const UserModel = db.users;

exports.createPaymentIntent = async (req, res) => {
  const userId = req.user.userId;
  console.log(`Fetching profile details for userId: ${userId}`);

  const { amount } = req.body;

  try {
    // Fetch the user's profile from the database
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
    const distributionAccount = await server.loadAccount(
      distributionKeys.publicKey()
    );

    const transaction = new StellarSdk.TransactionBuilder(distributionAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: user.stellarPublicKey,
          asset: fucAsset,
          amount: amount.toString(),
        })
      )
      .setTimeout(100)
      .build();
    transaction.sign(distributionKeys);
    await server.submitTransaction(transaction);

    res.json({ success: true, message: "Tokens minted successfully" });
  } catch (error) {
    console.error("Mint tokens error:", error.response?.data || error);
    res.status(500).json({ success: false, message: "Mint tokens failed" });
  }
};

exports.handleCallback = async (req, res) => {
  const reference = req.query.reference;

  try {
    const response = await axios.post(
      "http://172.20.10.5:8080/api/paystack/verify-payment",
      { reference: reference }
    );

    if (response.data.success) {
      await axios.post("http://172.20.10.5:8080/api/paystack/mint-tokens", {
        userId: response.data.userId,
        amount: response.data.amount,
      });
      res.send("Payment verification and token minting successful");
    } else {
      res.status(400).send("Payment verification failed");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error verifying payment");
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
