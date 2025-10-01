const express = require("express");
const { getLogs } = require("../controllers/logController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Log routes
router.get("/", authMiddleware, getLogs);

module.exports = router;
