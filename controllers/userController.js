const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const { Op } = require("sequelize");
const UserModel = db.users;
const tokenConfig = require("../config/tokenConfig.js");
const sendEmail = require("../utils/sendEmail.js");
const userService = require("../services/userService.js");
const { server, StellarSdk } = require("../stellar/stellarConnect.js");
const stellarConfig = require("../config/stellarConfig.js");
const fetch = require("node-fetch");

exports.signUp = async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  try {
    const existingUser = await UserModel.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: "You've already signed up!" });
    }

    // Generate Stellar key pair for new account
    const pair = StellarSdk.Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();

    // Funding the new account with XLM to activate it
    const distributorKeys = StellarSdk.Keypair.fromSecret(
      stellarConfig.DISTRIBUTION_ACCOUNT_SECRET
    );
    const distributorAccount = await server.loadAccount(
      distributorKeys.publicKey()
    );
    const fee = await server.fetchBaseFee();

    const transaction = new StellarSdk.TransactionBuilder(distributorAccount, {
      fee,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: publicKey,
          startingBalance: "20",
        })
      )
      .setTimeout(100)
      .build();

    transaction.sign(distributorKeys);
    await server.submitTransaction(transaction);

    // Setting up a trustline for the custom asset
    const issuingPublicKey = StellarSdk.Keypair.fromSecret(
      stellarConfig.ISSUING_ACCOUNT_SECRET
    ).publicKey();
    const assetCode = "FUC";
    const fucAsset = new StellarSdk.Asset(assetCode, issuingPublicKey);
    const newAccount = await server.loadAccount(publicKey);
    const trustlineTransaction = new StellarSdk.TransactionBuilder(newAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: fucAsset,
        })
      )
      .setTimeout(180)
      .build();

    trustlineTransaction.sign(pair);
    await server.submitTransaction(trustlineTransaction);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      username,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      stellarPublicKey: publicKey,
      stellarSecretKey: secretKey,
    });

    res
      .status(201)
      .json({ message: "You signed up successfully! :)", userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await UserModel.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found! Please check your details and try again",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "The password provided is invalid! Please try again",
      });
    }

    const token = jwt.sign({ userId: user.id }, tokenConfig.JWT_SECRET, {
      expiresIn: "1h",
    });

    const profile = {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      stellarPublicKey: user.stellarPublicKey,
    };

    res.status(200).json({ message: "Login successful", token, profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.fetchProfile = async (req, res) => {
  const userId = req.user.userId;
  console.log(`Fetching profile for userId: ${userId}`);
  try {
    const user = await UserModel.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    console.log(`User found: ${user}`);
    if (!user) {
      return res.status(404).json({ message: "User details not found" });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      stellarPublicKey: user.stellarPublicKey,
      stellarSecretKey: user.stellarSecretKey,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendResetPasswordMail = async (req, res) => {
  const { email } = req.body;
  try {
    const { user, token } = await userService.generateResetToken(email);

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const message = `You're receiving this mail because there was recently a request to change the password on your user account at FUO Wallet app. If you requested this password change, please click the link below to set a new password within 1 hour.\n\nIf the button above isn’t working, paste the link below into your browser:\n\n${resetURL}\n\nIf you did not request to change your password, you can safely ignore this email. Thank you.`;
    const htmlMessage = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Reset Your Password - FUO Wallet</title>
                            <style>
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                line-height: 1.6;
                                margin: 0;
                                padding: 0;
                                background-color: #f5f5f5;
                              }
                              .container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: white;
                                border-radius: 12px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                                overflow: hidden;
                              }
                              .header {
                                background: linear-gradient(135deg, #006400 0%, #228B22 100%);
                                color: white;
                                padding: 2rem;
                                text-align: center;
                              }
                              .header h1 {
                                margin: 0;
                                font-size: 1.8rem;
                                font-weight: bold;
                              }
                              .header p {
                                margin: 0.5rem 0 0 0;
                                opacity: 0.9;
                              }
                              .content {
                                padding: 2rem;
                              }
                              .content p {
                                color: #333;
                                margin-bottom: 1rem;
                              }
                              .reset-button {
                                display: inline-block;
                                background: #006400;
                                color: white;
                                text-decoration: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-weight: 600;
                                margin: 1rem 0;
                                transition: background-color 0.2s;
                              }
                              .reset-button:hover {
                                background: #005000;
                              }
                              .url-fallback {
                                background-color: #f8f9fa;
                                padding: 1rem;
                                border-radius: 8px;
                                border: 1px solid #e9ecef;
                                word-break: break-all;
                                font-family: monospace;
                                font-size: 0.9rem;
                                margin: 1rem 0;
                              }
                              .footer {
                                background-color: #f8f9fa;
                                padding: 1.5rem 2rem;
                                text-align: center;
                                color: #666;
                                font-size: 0.9rem;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                              <div class="header">
                                <h1>FUO Wallet</h1>
                                <p>Password Reset Request</p>
                              </div>
                              <div class="content">
                                <p>Hello,</p>
                                <p>You're receiving this mail because there was recently a request to change the password on your FUO Wallet account.</p>
                                <p>If you requested this password change, please click the button below to set a new password within 1 hour:</p>
                                <div style="text-align: center;">
                                  <a href="${resetURL}" class="reset-button">Reset My Password</a>
                                </div>
                                <p>If the button above isn't working, copy and paste the link below into your browser:</p>
                                <div class="url-fallback">${resetURL}</div>
                                <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                              </div>
                              <div class="footer">
                                <p>If you did not request to change your password, you can safely ignore this email.</p>
                                <p>Thank you,<br>The FUO Wallet Team</p>
                              </div>
                            </div>
                          </body>
                          </html>`;

    await sendEmail({
      email,
      subject: "Reset Your Password",
      message,
      html: htmlMessage,
    });

    res.json({
      message: "Check your e-mail, a password reset link has been sent",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }
  try {
    const user = await userService.verifyToken(token);
    await userService.resetPassword(user, newPassword);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Invalid token" });
    } else {
      return res.status(500).json({ error: "An error occurred" });
    }
  }
};
