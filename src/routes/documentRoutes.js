const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadDocumentImage = require("../middleware/uploadDocumentImage");
const { uploadPDF } = require("../middleware/uploadMiddleware");

const { 
  applySignature, 
  getDocuments, 
  getDocumentById, 
  uploadDocument,
  signDocumentExternally,
  verifyDocumentPublic,
} = require("../controllers/documentController");

// ✅ Route verifikasi publik (TANPA auth)
router.get("/public/verify/:id", verifyDocumentPublic);

// Daftar dokumen
router.get("/", authMiddleware, getDocuments);
router.get("/:id", authMiddleware, getDocumentById);

// Upload dokumen PDF
router.post("/upload", authMiddleware, uploadPDF.single("file"), uploadDocument);

// Apply tanda tangan biasa (dengan verifikasi AI)
router.post(
  "/:id/sign",
  authMiddleware,
  uploadDocumentImage.single("signatureImage"),
  applySignature
);

// ✅ Apply tanda tangan EKSTERNAL (tanpa verifikasi AI)
router.post(
  "/:id/sign/external",
  authMiddleware,
  uploadDocumentImage.none(),
  signDocumentExternally
);

module.exports = router;
