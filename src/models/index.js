const sequelize = require("../../config/db");
const User = require("./User");
const Document = require("./Document");
const SignatureRequest = require("./SignatureRequest");
const LogVerification = require("./LogVerification");
const SignatureBaseline = require("./SignatureBaseline");

// User ↔ Document
User.hasMany(Document, { foreignKey: "user_id" });
Document.belongsTo(User, { foreignKey: "user_id" });

// User ↔ SignatureRequest
User.hasMany(SignatureRequest, { foreignKey: "requester_id", as: "sentRequests" });
User.hasMany(SignatureRequest, { foreignKey: "signer_id", as: "receivedRequests" });
SignatureRequest.belongsTo(User, { foreignKey: "requester_id", as: "requester" });
SignatureRequest.belongsTo(User, { foreignKey: "signer_id", as: "signer" });

// Document ↔ SignatureRequest
Document.hasMany(SignatureRequest, { foreignKey: "document_id" });
SignatureRequest.belongsTo(Document, { foreignKey: "document_id" });

// User ↔ LogVerification
User.hasMany(LogVerification, { foreignKey: "user_id" });
LogVerification.belongsTo(User, { foreignKey: "user_id" });

// Document ↔ LogVerification
Document.hasMany(LogVerification, { foreignKey: "document_id" });
LogVerification.belongsTo(Document, { foreignKey: "document_id" });
// User ↔ Document (OWNER)
User.hasMany(Document, {
  foreignKey: "user_id",
  as: "documents"
});

Document.belongsTo(User, {
  foreignKey: "user_id",
  as: "owner"
});


// User ↔ SignatureBaseline
User.hasMany(SignatureBaseline, { foreignKey: "user_id" });
SignatureBaseline.belongsTo(User, { foreignKey: "user_id" });



module.exports = {
  sequelize,
  User,
  Document,
  SignatureRequest,
  LogVerification,
  SignatureBaseline,
};
