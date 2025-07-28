const express = require("express");
const stellarController = require("../controllers/stellarController.js");
const authenticateToken = require("../middleware/auth.js");

const StellarRouter = express.Router();

//user
StellarRouter.post(
  "/receive-asset",
  authenticateToken,
  stellarController.receiveAsset
);
StellarRouter.get(
  "/check-balance/:publicKey",
  authenticateToken,
  stellarController.checkBalance
);
StellarRouter.post(
  "/transfer",
  authenticateToken,
  stellarController.transferAsset
);
StellarRouter.get(
  "/transactions/:userId",
  authenticateToken,
  stellarController.fetchTransactions
);

//needed?
StellarRouter.get(
  "/wallet/:publicKey",
  authenticateToken,
  stellarController.fetchWalletDetails
);
StellarRouter.get(
  "/wallet-transactions/:publicKey",
  authenticateToken,
  stellarController.fetchWalletTransactions
);

//admin
StellarRouter.post(
  "/create-asset",
  authenticateToken,
  stellarController.createAsset
);
StellarRouter.get(
  "/check-admin-balance/:publicKey",
  authenticateToken,
  stellarController.checkAdminBalance
);

module.exports = StellarRouter;
