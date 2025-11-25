const express = require("express");
const router = express.Router();
const { uploadImage } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { addBaseline, getBaselines, getBaselineById, updateBaselineById } = require("../controllers/signatureBaselineController");

// Tambah tanda tangan baseline
router.post("/add", authMiddleware, uploadImage.single("image"), addBaseline);

// Lihat semua baseline user
router.get("/", authMiddleware, getBaselines);

// Lihat baseline user by ID
router.get("/:id", authMiddleware, getBaselineById);

// Update baseline user by ID
router.put(
  "/:id",
  authMiddleware,
  uploadImage.single("image"),
  updateBaselineById
);

module.exports = router;
