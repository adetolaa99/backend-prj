const db = require("../models/index.js");
const UserModel = db.users;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const tokenConfig = require("../config/tokenConfig.js");

exports.generateResetToken = async (email) => {
  const user = await UserModel.findOne({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  const token = jwt.sign({ id: user.id }, tokenConfig.JWT_SECRET, {
    expiresIn: "1h",
  });
  return { user, token };
};

exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, tokenConfig.JWT_SECRET);
    const userId = decoded.id;

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw error;
  }
};

exports.resetPassword = async (user, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return user;
};
