const defineAssociations = (db) => {
  db.users.hasMany(db.transactions, { foreignKey: "userId" });
  db.transactions.belongsTo(db.users, { foreignKey: "userId" });
};

module.exports = defineAssociations;
