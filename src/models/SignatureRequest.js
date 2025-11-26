const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const SignatureRequest = sequelize.define("SignatureRequest", {
  request_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  requester_id: { type: DataTypes.INTEGER, allowNull: false },

  recipient_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
    set(v) { this.setDataValue("recipient_email", String(v).trim().toLowerCase()); }
  },

  signer_id: { type: DataTypes.INTEGER, allowNull: true },

  note: { type: DataTypes.TEXT, allowNull: true },

  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending"
  },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: "signature_requests",
  underscored: true
});

module.exports = SignatureRequest;
