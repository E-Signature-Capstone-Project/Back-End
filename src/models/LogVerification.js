const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const LogVerification = sequelize.define("LogVerification", {
  log_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  verification_result: { type: DataTypes.ENUM("valid", "invalid"), allowNull: false },
  similarity_score: { type: DataTypes.FLOAT },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = LogVerification;
