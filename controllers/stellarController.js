const { server, StellarSdk } = require("../stellar/stellarConnect.js");
const stellarConfig = require("../config/stellarConfig.js");
const fetch = import("node-fetch");
const db = require("../models");
const TransactionModel = db.transactions;
const UserModel = db.users;

exports.checkBalance = async (req, res) => {
  try {
    const { publicKey } = req.params;
    const account = await server.loadAccount(publicKey);
    const balances = account.balances.map((balance) => ({
      asset_type: balance.asset_type,
      balance: balance.balance,
    }));
    res.json({ balances });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.receiveAsset = async (req, res) => {
  const { publicKey } = req.body;
  try {
    const distributorKeys = StellarSdk.Keypair.fromSecret(
      stellarConfig.DISTRIBUTION_ACCOUNT_SECRET
    );
    const issuingPublicKey = StellarSdk.Keypair.fromSecret(
      stellarConfig.ISSUING_ACCOUNT_SECRET
    ).publicKey();

    const assetCode = "FUC";
    const fucAsset = new StellarSdk.Asset(assetCode, issuingPublicKey);

    await server.loadAccount(publicKey);
    const distributorAccount = await server.loadAccount(
      distributorKeys.publicKey()
    );
    const transaction = new StellarSdk.TransactionBuilder(distributorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: publicKey,
          asset: fucAsset,
          amount: "50000", // Amount of FUC to send
        })
      )
      .addMemo(StellarSdk.Memo.text("FUC token"))
      .setTimeout(180)
      .build();

    transaction.sign(distributorKeys);
    const result = await server.submitTransaction(transaction);

    res.send({ message: "Success!", result: result });
  } catch (error) {
    if (error instanceof StellarSdk.NotFoundError) {
      res.status(400).send("The receiver account does not exist!");
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.extras
    ) {
      res
        .status(400)
        .send(
          `Transaction failed with error: ${JSON.stringify(
            error.response.data.extras.result_codes
          )}`
        );
    } else {
      res.status(400).send("Something went wrong: " + error.message);
    }
  }
};

exports.transferAsset = async (req, res) => {
  const { receiverPublicKey, amount } = req.body;
  try {
    const userId = req.user.userId;
    console.log("User ID from token:", userId);
    const user = await UserModel.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const issuingPublicKey = StellarSdk.Keypair.fromSecret(
      stellarConfig.ISSUING_ACCOUNT_SECRET
    ).publicKey();
    const senderKeys = StellarSdk.Keypair.fromSecret(user.stellarSecretKey);
    const fucAsset = new StellarSdk.Asset("FUC", issuingPublicKey);

    const account = await server.loadAccount(senderKeys.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: fucAsset,
          amount: amount.toString(),
        })
      )
      .setTimeout(100)
      .build();

    transaction.sign(senderKeys);
    const result = await server.submitTransaction(transaction);

    await TransactionModel.create({
      stellarTransactionId: result.id,
      from: senderKeys.publicKey(),
      to: receiverPublicKey,
      assetAmount: parseFloat(amount),
      assetCode: "FUC",
      userId: userId,
    });

    res.send({ message: "Transaction successful!", result });
  } catch (error) {
    if (error instanceof StellarSdk.NotFoundError) {
      res.status(400).send("The receiver account does not exist!");
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.extras
    ) {
      res
        .status(400)
        .send(
          `Transaction failed with error: ${JSON.stringify(
            error.response.data.extras.result_codes
          )}`
        );
    } else {
      res.status(500).send("Something went wrong: " + error.message);
    }
  }
};

exports.fetchTransactions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const transactions = await TransactionModel.findAll({
      where: { userId: userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// needed?
exports.fetchWalletDetails = async (req, res) => {
  const { publicKey } = req.params;
  try {
    const account = await server.loadAccount(publicKey);
    res.json(account);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.fetchWalletTransactions = async (req, res) => {
  const { publicKey } = req.params;
  try {
    const transactions = await server
      .transactions()
      .forAccount(publicKey)
      .call();
    res.json(transactions); //res.json(transactions);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

//admin
exports.createAsset = async (req, res) => {
  const { assetCode, amount } = req.body;
  const issuingKeys = StellarSdk.Keypair.fromSecret(
    stellarConfig.ISSUING_ACCOUNT_SECRET
  );
  const distributionKeys = StellarSdk.Keypair.fromSecret(
    stellarConfig.DISTRIBUTION_ACCOUNT_SECRET
  );
  const fuc = new StellarSdk.Asset("fuc", issuingKeys.publicKey());

  try {
    const distributionAccount = await server.loadAccount(
      distributionKeys.publicKey()
    );

    const transaction = new StellarSdk.TransactionBuilder(distributionAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: fuc,
          limit: amount.toString(),
          source: distributionKeys.publicKey(),
        })
      )
      .setTimeout(100)
      .build();

    transaction.sign(distributionKeys);
    await server.submitTransaction(transaction);

    const issuingAccount = await server.loadAccount(issuingKeys.publicKey());

    const paymentTransaction = new StellarSdk.TransactionBuilder(
      issuingAccount,
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      }
    )
      .addOperation(
        StellarSdk.Operation.payment({
          destination: distributionKeys.publicKey(),
          asset: fuc,
          amount: amount.toString(),
          source: issuingKeys.publicKey(),
        })
      )
      .setTimeout(100)
      .build();

    paymentTransaction.sign(issuingKeys);
    await server.submitTransaction(paymentTransaction);

    res.send("Custom token issued successfully!");
  } catch (error) {
    res.status(400).send(error.message);
  }
};
