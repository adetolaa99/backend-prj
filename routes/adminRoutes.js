const express = require("express");
const adminController = require("../controllers/adminController.js");
const authenticateToken = require("../middleware/auth.js");

const AdminRouter = express.Router();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@fuowallet.com
 *               password:
 *                 type: string
 *                 example: adminpassword
 *     responses:
 *       200:
 *         description: Login successful, returns JWT (valid 2 hours)
 *       404:
 *         description: Invalid admin details
 *       401:
 *         description: Invalid password
 */
AdminRouter.post("/login", adminController.login);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all user objects
 */
AdminRouter.get("/users", authenticateToken, adminController.viewAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   put:
 *     summary: Update a user's details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               stellarPublicKey:
 *                 type: string
 *               stellarSecretKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
AdminRouter.put(
  "/users/:userId",
  authenticateToken,
  adminController.updateUserDetails
);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
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
 *         description: User deleted successfully
 *       500:
 *         description: Error deleting user
 */
AdminRouter.delete(
  "/users/:userId",
  authenticateToken,
  adminController.deleteUser
);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions across all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of transactions with nested user data
 */
AdminRouter.get(
  "/transactions",
  authenticateToken,
  adminController.viewAllTransactions
);

/**
 * @swagger
 * /api/admin/users/{userId}/transactions:
 *   get:
 *     summary: Get all transactions for a specific user
 *     tags: [Admin]
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
AdminRouter.get(
  "/users/:userId/transactions",
  authenticateToken,
  adminController.viewUserTransactions
);

/**
 * @swagger
 * /api/admin/provision:
 *   post:
 *     summary: Create a new admin account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: newadmin@fuowallet.com
 *               password:
 *                 type: string
 *                 example: adminpassword
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       400:
 *         description: Validation error
 */
AdminRouter.post(
  "/provision",
  authenticateToken,
  adminController.createAdminAccount
);

/**
 * @swagger
 * /api/admin/users/{userId}/wallet:
 *   get:
 *     summary: Get a user's Stellar wallet keys
 *     description: "NOTE: ⚠️ This returns the Stellar Secret Key. Only transmit over HTTPS."
 *     tags: [Admin]
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
 *         description: Wallet keys returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stellarPublicKey:
 *                   type: string
 *                 stellarSecretKey:
 *                   type: string
 *       404:
 *         description: User not found
 */
AdminRouter.get(
  "/users/:userId/wallet",
  authenticateToken,
  adminController.viewUserWalletDetails
);

module.exports = AdminRouter;
