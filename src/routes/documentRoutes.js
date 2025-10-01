const express = require("express");
const { getDocuments, uploadDocument, getDocumentById } = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getDocuments);

router.get("/:id", authMiddleware, getDocumentById);

router.post("/upload", authMiddleware, upload.single("file"), uploadDocument);

module.exports = router;
