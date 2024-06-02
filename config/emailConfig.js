require("dotenv").config();

const emailConfig = {
  EMAIL: process.env.EMAIL,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};

module.exports = emailConfig;
