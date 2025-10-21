const express = require("express");
const router = express.Router();
const { uploadImage } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { addBaseline, getBaselines } = require("../controllers/signatureBaselineController");

// Tambah tanda tangan baseline
router.post("/add", authMiddleware, uploadImage.single("image"), addBaseline);

// Lihat semua baseline user
router.get("/", authMiddleware, getBaselines);

module.exports = router;
