const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadDocumentImage = require("../middleware/uploadDocumentImage");
const { applySignature, getDocuments, getDocumentById, uploadDocument } = require("../controllers/documentController");
const { uploadPDF } = require("../middleware/uploadMiddleware");

// Daftar dokumen
router.get("/", authMiddleware, getDocuments);
router.get("/:id", authMiddleware, getDocumentById);

// Upload dokumen PDF
router.post("/upload", authMiddleware, uploadPDF.single("file"), uploadDocument);

// Apply tanda tangan
router.post(
  "/:id/sign",
  authMiddleware,
  uploadDocumentImage.single("signatureImage"), // field name Postman harus sama
  applySignature
);

module.exports = router;
