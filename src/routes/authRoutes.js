const express = require("express");
const { register, login, getProfile } = require("../controllers/authController");
const { createAdmin, approveAdmin, rejectAdmin,  getPendingAdminRequests  } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);

// Create admin
router.post("/create-admin", createAdmin);

// Approve admin
router.put("/approve/:id", authMiddleware, isAdmin, approveAdmin);

// Reject admin
router.put("/reject/:id", authMiddleware, isAdmin, rejectAdmin);


router.get("/pending-admin-request", authMiddleware, isAdmin, getPendingAdminRequests); 

module.exports = router;
