const express = require("express");
const router = express.Router();
const { uploadImage } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { addBaseline, getBaselines, getBaselineById, updateBaselineById } = require("../controllers/signatureBaselineController");

// Signwell session + completion endpoints
const { createSignwellSessionForBaseline, completeBaselineFromSignwell } = require("../controllers/signatureBaselineController");

// Tambah tanda tangan baseline
router.post("/add", authMiddleware, uploadImage.single("image"), addBaseline);

// Create Signwell session (returns URL) for drawing baseline
router.post('/signwell-session', authMiddleware, createSignwellSessionForBaseline);

// Complete baseline: frontend posts { image_url }
router.post('/complete-from-signwell', authMiddleware, express.json(), completeBaselineFromSignwell);

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
