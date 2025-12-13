const express = require("express");
const router = express.Router();

// Auth controller
const {
  register,
  registerAdmin,
  login,
  getProfile,
  updateName
} = require("../controllers/authController");

// Admin controller
const {
  createAdmin,
  approveAdmin,
  rejectAdmin
} = require("../controllers/adminController");

// Middleware
const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

/* =======================
   AUTH ROUTES (PUBLIC)
======================= */
router.post("/register", register);
router.post("/login", login);

/* =======================
   AUTH ROUTES (PROTECTED)
======================= */
router.get("/profile", authMiddleware, getProfile);
router.put("/name", authMiddleware, updateName);

/* =======================
   ADMIN ROUTES
======================= */

router.post("/register-admin", registerAdmin); // admin (request)

// Dev / Super Admin
router.post("/create-admin", authMiddleware, isAdmin, createAdmin);

// Approve admin
router.put("/admin/approve/:id", authMiddleware, isAdmin, approveAdmin);

// Reject admin
router.put("/admin/reject/:id", authMiddleware, isAdmin, rejectAdmin);

module.exports = router;
