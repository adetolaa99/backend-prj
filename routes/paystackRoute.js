const express = require("express");
const paystackController = require("../controllers/paystackController.js");
const auth = require("../middleware/auth.js");
const authenticateToken = require("../middleware/auth.js");

const PaystackRouter = express.Router();

/**
 * @swagger
 * /api/paystack/create-payment-intent:
 *   post:
 *     summary: Initialize a Paystack payment
 *     description: Creates a Paystack transaction and returns a checkout URL. Amount is in Naira.
 *     tags: [Paystack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in Naira
 *                 example: 500
 *     responses:
 *       200:
 *         description: Paystack initialization object with authorization_url and reference
 *       500:
 *         description: Failed to create payment intent
 */
PaystackRouter.post(
  "/create-payment-intent",
  authenticateToken,
  paystackController.createPaymentIntent
);

/**
 * @swagger
 * /api/paystack/verify-payment:
 *   post:
 *     summary: Verify a completed Paystack payment
 *     description: Each reference can only be verified once.
 *     tags: [Paystack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reference]
 *             properties:
 *               reference:
 *                 type: string
 *                 example: paystack_reference_here
 *     responses:
 *       200:
 *         description: Verification result (success or already processed)
 *       500:
 *         description: Failed to verify payment
 */
PaystackRouter.post(
  "/verify-payment",
  authenticateToken,
  paystackController.verifyPayment
);

/**
 * @swagger
 * /api/paystack/mint-tokens:
 *   post:
 *     summary: Mint FUC tokens to a user's Stellar wallet
 *     description: Called automatically after payment verification. Also exposed for manual admin use.
 *     tags: [Paystack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount]
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Tokens minted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Minting failed
 */
PaystackRouter.post(
  "/mint-tokens",
  authenticateToken,
  paystackController.mintTokens
);

/**
 * @swagger
 * /api/paystack/callback:
 *   get:
 *     summary: Paystack payment callback
 *     description: Paystack redirects here after payment. Verifies the payment, mints FUC tokens and returns an HTML page. No auth is required. This is called by Paystack directly.
 *     tags: [Paystack]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *       - in: query
 *         name: trxref
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML page (success, error, or already-processed)
 */
PaystackRouter.get("/callback", paystackController.handleCallback);

//needed?
PaystackRouter.post(
  "/create-withdraw-intent",
  paystackController.createWithdrawIntent
);
PaystackRouter.post(
  "/process-withdrawal",
  paystackController.processWithdrawal
);

module.exports = PaystackRouter;
