const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/dbConfig.js");
const defineAssociations = require("./associations.js");

const UserModel = require("./user.js");
const TransactionModel = require("./transaction.js");
const AdminModel = require("./admin.js");

const sequelize = new Sequelize(
  dbConfig.DB_NAME,
  dbConfig.DB_USER,
  dbConfig.DB_PASSWORD,
  {
    host: dbConfig.DB_HOST,
    port: dbConfig.DB_PORT,
    dialect: dbConfig.DB_DIALECT,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, //for render
      },
    },
    logging: false,
  }
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//add all models
db.users = UserModel(sequelize, DataTypes);
db.transactions = TransactionModel(sequelize, DataTypes);
db.admins = AdminModel(sequelize, DataTypes);

defineAssociations(db);

module.exports = db;