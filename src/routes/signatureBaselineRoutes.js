const express = require("express");
const router = express.Router();
const signatureBaselineController = require("../controllers/signatureBaselineController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  signatureBaselineController.uploadBaseline
);

router.get(
  "/",
  authMiddleware,
  signatureBaselineController.getBaselines
);

module.exports = router;
