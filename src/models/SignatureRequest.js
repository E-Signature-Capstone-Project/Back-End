const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const SignatureRequest = sequelize.define(
  "SignatureRequest",
  {
    request_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    document_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    signer_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    recipient_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
      set(v) {
        this.setDataValue(
          "recipient_email",
          String(v).trim().toLowerCase()
        );
      }
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
      defaultValue: "pending"
    }
  },
  {
    tableName: "signature_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true
  }
);

// 🔥 PENTING: MATIKAN id DEFAULT
SignatureRequest.removeAttribute("id");

module.exports = SignatureRequest;
