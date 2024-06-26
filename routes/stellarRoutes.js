const express = require("express");
const stellarController = require("../controllers/stellarController.js");
const auth = require("../middleware/auth.js");
const authenticateToken = require("../middleware/auth.js");

const StellarRouter = express.Router();

//user
StellarRouter.get("/check-balance/:publicKey", stellarController.checkBalance);
StellarRouter.post(
  "/transfer",
  authenticateToken,
  stellarController.transferAsset
);
StellarRouter.get("/transactions/:userId", authenticateToken, stellarController.fetchTransactions);
StellarRouter.get("/wallet/:publicKey", stellarController.fetchWalletDetails);
StellarRouter.get(
  "/transactions/:publicKey",
  stellarController.fetchWalletTransactions
);

//admin
StellarRouter.post("/create-asset", stellarController.createAsset);
StellarRouter.post("/send-asset", stellarController.sendAsset);

module.exports = StellarRouter;
