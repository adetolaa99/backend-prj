const StellarSdk = require("@stellar/stellar-sdk");
const stellarConfig = require("../config/stellarConfig.js");

const server = new StellarSdk.Horizon.Server(stellarConfig.STELLAR_NETWORK);

module.exports = {
  StellarSdk,
  server,
};
