const express = require("express");
const userController = require("../controllers/userController.js");
const authenticateToken = require("../middleware/auth.js");

const UserRouter = express.Router();

UserRouter.post("/signup", userController.signUp);

UserRouter.post("/login", userController.login);

UserRouter.get("/profile", authenticateToken, userController.fetchProfile);

UserRouter.post(
  "/send-reset-password-email",
  userController.sendResetPasswordMail
);

UserRouter.post("/reset-password", userController.resetPassword);

module.exports = UserRouter;
