const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const SignatureRequest = sequelize.define("SignatureRequest", {
  request_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  requester_id: { type: DataTypes.INTEGER, allowNull: false },
  signer_id: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending" },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = SignatureRequest;
