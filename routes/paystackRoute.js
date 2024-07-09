const express = require("express");
const paystackController = require("../controllers/paystackController.js");
const auth = require("../middleware/auth.js");
const authenticateToken = require("../middleware/auth.js");

const PaystackRouter = express.Router();

PaystackRouter.post(
  "/create-payment-intent", authenticateToken,
  paystackController.createPaymentIntent
);
PaystackRouter.post("/verify-payment", authenticateToken, paystackController.verifyPayment);
PaystackRouter.post("/mint-tokens", authenticateToken, paystackController.mintTokens);
PaystackRouter.get("/callback", authenticateToken, paystackController.handleCallback)

//needed?
PaystackRouter.post(
  "/create-withdraw-intent",
  paystackController.createWithdrawIntent
);
PaystackRouter.post(
  "/create-withdraw-intent",
  paystackController.processWithdrawal
);

module.exports = PaystackRouter;
