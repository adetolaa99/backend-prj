const express = require("express");
const userController = require("../controllers/userController.js");
const authenticateToken = require("../middleware/auth.js");

const UserRouter = express.Router();

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and automatically provisions a Stellar wallet, funds it with 20 XLM and sets up a FUC trustline.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, firstName, lastName]
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *               firstName:
 *                 type: string
 *                 example: Test
 *               lastName:
 *                 type: string
 *                 example: User
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You signed up successfully! :)"
 *                 userId:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       400:
 *         description: Email or username already exists
 */
UserRouter.post("/signup", userController.signUp);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user by username or email and returns a JWT (valid for 1 hour).
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email address
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 profile:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     stellarPublicKey:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 */
UserRouter.post("/login", userController.login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 stellarPublicKey:
 *                   type: string
 *                 stellarSecretKey:
 *                   type: string
 *                   description: "⚠️ Sensitive - only transmit over HTTPS"
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 */
UserRouter.get("/profile", authenticateToken, userController.fetchProfile);

/**
 * @swagger
 * /api/users/register-device:
 *   post:
 *     summary: Register device for push notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceToken, platform]
 *             properties:
 *               deviceToken:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [android, ios]
 *     responses:
 *       200:
 *         description: Device registered successfully
 */
UserRouter.post(
  "/register-device",
  authenticateToken,
  userController.registerDevice,
);

/**
 * @swagger
 * /api/users/send-reset-password-email:
 *   post:
 *     summary: Request a password reset email
 *     description: Sends a password reset link to the user's email. The link expires after 1 hour.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *     responses:
 *       200:
 *         description: Reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Check your e-mail, a password reset link has been sent"
 *       500:
 *         description: Failed to send email
 */
UserRouter.post(
  "/send-reset-password-email",
  userController.sendResetPasswordMail,
);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Resets the user's password using the token received in the reset email.
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 example: newSecurePassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Token and new password are required
 *       401:
 *         description: Token expired
 *       403:
 *         description: Invalid token
 */
UserRouter.post("/reset-password", userController.resetPassword);

module.exports = UserRouter;
