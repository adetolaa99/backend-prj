const express = require("express");
const stellarController = require("../controllers/stellarController.js");
const authenticateToken = require("../middleware/auth.js");

const StellarRouter = express.Router();

//user
StellarRouter.post(
  "/receive-asset",
  authenticateToken,
  stellarController.receiveAsset,
);

/**
 * @swagger
 * /api/stellar/check-balance/{publicKey}:
 *   get:
 *     summary: Check Stellar account balance
 *     tags: [Stellar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *         example: GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *     responses:
 *       200:
 *         description: Account balances (XLM and FUC)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balances:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       asset_type:
 *                         type: string
 *                       balance:
 *                         type: string
 */
StellarRouter.get(
  "/check-balance/:publicKey",
  authenticateToken,
  stellarController.checkBalance,
);

/**
 * @swagger
 * /api/stellar/transfer:
 *   post:
 *     summary: Transfer FUC tokens to another Stellar account
 *     tags: [Stellar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverPublicKey, amount]
 *             properties:
 *               receiverPublicKey:
 *                 type: string
 *                 example: GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *               amount:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Transaction successful
 *       400:
 *         description: Receiver account does not exist or transaction failed
 *       404:
 *         description: Sender user not found
 */
StellarRouter.post(
  "/transfer",
  authenticateToken,
  stellarController.transferAsset,
);

/**
 * @swagger
 * /api/stellar/transactions/{userId}:
 *   get:
 *     summary: Get authenticated user's transaction history
 *     tags: [Stellar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of transaction records, sorted newest first
 */
StellarRouter.get(
  "/transactions/:userId",
  authenticateToken,
  stellarController.fetchTransactions,
);

//needed?
StellarRouter.get(
  "/wallet/:publicKey",
  authenticateToken,
  stellarController.fetchWalletDetails,
);
StellarRouter.get(
  "/wallet-transactions/:publicKey",
  authenticateToken,
  stellarController.fetchWalletTransactions,
);

//admin

/**
 * @swagger
 * /api/stellar/create-asset:
 *   post:
 *     summary: (For Admin Use only) Issue new FUC tokens to the distribution account
 *     tags: [Stellar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetCode, amount]
 *             properties:
 *               assetCode:
 *                 type: string
 *                 example: FUC
 *               amount:
 *                 type: string
 *                 example: "1000000"
 *     responses:
 *       200:
 *         description: Tokens issued successfully
 *       400:
 *         description: Stellar transaction error
 */
StellarRouter.post(
  "/create-asset",
  authenticateToken,
  stellarController.createAsset,
);

/**
 * @swagger
 * /api/stellar/check-admin-balance/{publicKey}:
 *   get:
 *     summary: (For Admin Use only) Check issuing or distribution account balance
 *     tags: [Stellar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full balance breakdown including XLM and FUC
 */
StellarRouter.get(
  "/check-admin-balance/:publicKey",
  authenticateToken,
  stellarController.checkAdminBalance,
);

module.exports = StellarRouter;
