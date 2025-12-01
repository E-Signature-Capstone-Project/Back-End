const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  createAdmin,
  updateName
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/profile", authMiddleware, getProfile);
router.put("/name", authMiddleware, updateName);

// Dev: create admin (optional protection if needed)
router.post("/create-admin", createAdmin);

module.exports = router;
