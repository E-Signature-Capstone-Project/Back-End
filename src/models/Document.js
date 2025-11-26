const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Document = sequelize.define("Document", {
  document_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  file_path: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM("pending", "signed", "rejected"), defaultValue: "pending" },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Document;
