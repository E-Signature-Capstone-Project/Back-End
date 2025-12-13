const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  createAdmin,
  updateName
} = require("../controllers/authController");

const { 
  createAdmin, 
  approveAdmin, 
  rejectAdmin  
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/profile", authMiddleware, getProfile);
router.put("/name", authMiddleware, updateName);

// Dev: create admin (optional protection if needed)
router.post("/create-admin", createAdmin);

// Approve admin
router.put("/approve/:id", authMiddleware, isAdmin, approveAdmin);

// Reject admin
router.put("/reject/:id", authMiddleware, isAdmin, rejectAdmin);


module.exports = router;
