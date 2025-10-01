const sequelize = require("../../config/db");
const User = require("./User");
const Document = require("./Document");
const SignatureRequest = require("./SignatureRequest");
const LogVerification = require("./LogVerification");


User.hasMany(Document, { foreignKey: "user_id" });
Document.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(SignatureRequest, { foreignKey: "requester_id", as: "sentRequests" });
User.hasMany(SignatureRequest, { foreignKey: "signer_id", as: "receivedRequests" });
SignatureRequest.belongsTo(User, { foreignKey: "requester_id", as: "requester" });
SignatureRequest.belongsTo(User, { foreignKey: "signer_id", as: "signer" });

Document.hasMany(SignatureRequest, { foreignKey: "document_id" });
SignatureRequest.belongsTo(Document, { foreignKey: "document_id" });

User.hasMany(LogVerification, { foreignKey: "user_id" });
LogVerification.belongsTo(User, { foreignKey: "user_id" });

Document.hasMany(LogVerification, { foreignKey: "document_id" });
LogVerification.belongsTo(Document, { foreignKey: "document_id" });

module.exports = {
  sequelize,
  User,
  Document,
  SignatureRequest,
  LogVerification,
};
