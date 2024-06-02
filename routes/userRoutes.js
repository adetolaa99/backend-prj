const express = require("express");
const userController = require("../controllers/userController.js");
const authenticateToken = require("../middleware/auth.js");

const UserRouter = express.Router();

UserRouter.post("/signup", userController.signUp);
UserRouter.post("/login", userController.login);
UserRouter.put("/profile", authenticateToken, userController.updateProfile);
UserRouter.get("/profile", authenticateToken, userController.fetchProfile);

UserRouter.get("/reset-password", userController.viewResetPasswordPage);
UserRouter.post("/reset-password", userController.resetPassword);
UserRouter.post(
  "/send-reset-password-email",
  userController.sendResetPasswordMail
);

module.exports = UserRouter;
