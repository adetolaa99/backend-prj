const express = require("express");
const adminController = require("../controllers/adminController.js");
const authenticateToken = require("../middleware/auth.js");

const AdminRouter = express.Router();

AdminRouter.post("/login", adminController.login);
AdminRouter.get("/users", authenticateToken, adminController.viewAllUsers);
AdminRouter.put(
  "/users/:userId",
  authenticateToken,
  adminController.updateUserDetails
);
AdminRouter.delete(
  "/users/:userId",
  authenticateToken,
  adminController.deleteUser
);
AdminRouter.get(
  "/transactions",
  authenticateToken,
  adminController.viewAllTransactions
);
AdminRouter.get(
  "/users/:userId/transactions",
  authenticateToken,
  adminController.viewUserTransactions
);
AdminRouter.post(
  "/provision",
  authenticateToken,
  adminController.createAdminAccount
);

AdminRouter.get(
  "/users/:userId/wallet",
  authenticateToken,
  adminController.viewUserWalletDetails
);

module.exports = AdminRouter;
