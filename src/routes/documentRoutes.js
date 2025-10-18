const express = require("express");
const router = express.Router();

const { getDocuments, uploadDocument, getDocumentById } = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ ambil instance uploadPDF dari middleware (bukan seluruh object)
const { uploadPDF } = require("../middleware/uploadMiddleware");

// 🔹 Dapatkan semua dokumen user
router.get("/", authMiddleware, getDocuments);

// 🔹 Dapatkan dokumen berdasarkan ID
router.get("/:id", authMiddleware, getDocumentById);

// 🔹 Upload dokumen PDF
router.post(
  "/upload",
  authMiddleware,
  uploadPDF.single("file"), // ✅ gunakan uploadPDF bukan upload
  uploadDocument
);

module.exports = router;
