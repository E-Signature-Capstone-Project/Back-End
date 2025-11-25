const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const { getLogs } = require("../controllers/logController");

// Admin → lihat semua log
router.get("/all", authMiddleware, isAdmin, getLogs);

// User → lihat log miliknya sendiri
router.get("/", authMiddleware, getLogs);

module.exports = router;
