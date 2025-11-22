const express = require("express");
const router = express.Router();
const { uploadImage } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { addBaseline, getBaselines, getBaselinesByUserId } = require("../controllers/signatureBaselineController");

// Tambah tanda tangan baseline
router.post("/add", authMiddleware, uploadImage.single("image"), addBaseline);

// Lihat semua baseline user
router.get("/", authMiddleware, getBaselines);

// Get baseline milik user lain jika request approved
router.get("/:user_id", authMiddleware, getBaselinesByUserId);

module.exports = router;
