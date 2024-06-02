const express = require("express");
const adminController = require("../controllers/adminController.js");
const authenticateToken = require("../middleware/auth.js");

const AdminRouter = express.Router();

AdminRouter.post("/login", adminController.login);
AdminRouter.get("/users", authenticateToken, adminController.viewAllUsers);
AdminRouter.put(
  "/users/:userId",
  authenticateToken,
  adminController.updateUser
);
AdminRouter.delete(
  "/users/:userId",
  authenticateToken,
  adminController.deleteUser
);
AdminRouter.get(
  "/users/:userId/wallet",
  authenticateToken,
  adminController.viewUserWalletAddress
);
AdminRouter.get(
  "/transactions",
  authenticateToken,
  adminController.viewAllTransactions
);
AdminRouter.post(
  "/provision",
  authenticateToken,
  adminController.createAdminAccount
);

module.exports = AdminRouter;
