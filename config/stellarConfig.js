require("dotenv").config();

const stellarConfig = {
  STELLAR_NETWORK: process.env.STELLAR_NETWORK,
  ISSUING_ACCOUNT_SECRET: process.env.ISSUING_ACCOUNT_SECRET,
  DISTRIBUTION_ACCOUNT_SECRET: process.env.DISTRIBUTION_ACCOUNT_SECRET,
};

module.exports = stellarConfig;
