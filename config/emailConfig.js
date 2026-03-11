require("dotenv").config();

const emailConfig = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};

module.exports = emailConfig;
