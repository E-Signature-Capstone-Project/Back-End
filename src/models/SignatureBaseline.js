const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const SignatureBaseline = sequelize.define("SignatureBaseline", {
  baseline_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  sign_image: { type: DataTypes.STRING, allowNull: false },
  feature_vector: { type: DataTypes.JSON, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = SignatureBaseline;
