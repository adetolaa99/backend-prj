const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const AdminModel = db.admins;
const UserModel = db.users;
const TransactionModel = db.transactions;
const tokenConfig = require("../config/tokenConfig.js");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await AdminModel.findOne({ where: { email } });
    if (!admin)
      return res.status(404).json({ message: "Invalid Admin details" });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Password is invalid!" });

    const token = jwt.sign({ adminId: admin.id }, tokenConfig.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewAllUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const {
    username,
    email,
    stellarPublicKey,
    stellarSecretKey,
    firstName,
    lastName,
  } = req.body;
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (stellarPublicKey) user.stellarPublicKey = stellarPublicKey;
    if (stellarSecretKey) user.stellarSecretKey = stellarSecretKey;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    await UserModel.destroy({
      where: { id: userId },
    });
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({
      message: "An error occured while deleting user",
      error: error.message,
    });
  }
};

exports.viewUserWalletDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      stellarPublicKey: user.stellarPublicKey,
      stellarSecretKey: user.stellarSecretKey,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.viewAllTransactions = async (req, res) => {
  try {
    const transactions = await db.transactions.findAll({
      include: {
        model: db.users,
        attributes: ["username", "email"],
      },
    });
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.viewUserTransactions = async (req, res) => {
  const { userId } = req.params;
  try {
    const transactions = await TransactionModel.findAll({
      where: { userId: userId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createAdminAccount = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await AdminModel.create({ email, password: hashedPassword });
    res.status(201).json({
      message: "Admin account created successfully",
      adminId: admin.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
