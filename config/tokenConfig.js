require("dotenv").config();

const tokenConfig = {
  JWT_SECRET: process.env.JWT_SECRET,
};

module.exports = tokenConfig;
