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
    dialect: dbConfig.DB_DIALECT,
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the database has been established successfully."
    );
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//add all models
db.users = UserModel(sequelize, DataTypes);
db.transactions = TransactionModel(sequelize, DataTypes);
db.admins = AdminModel(sequelize, DataTypes);

defineAssociations(db);

// sync all models
// force: false will not drop the table if it already exists
db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database and tables synced successfully!");
  })
  .catch((err) => {
    console.log(
      err,
      "Error occured while attempting to sync database and tables"
    );
  });

module.exports = db;