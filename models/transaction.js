const TransactionModel = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      transactionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stellarTransactionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      from: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      to: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      assetAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      assetCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "transactions",
      timestamps: true,
    }
  );
  return Transaction;
};

module.exports = TransactionModel;
