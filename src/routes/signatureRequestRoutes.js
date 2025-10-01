const express = require("express");
const {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/signatureRequestController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Buat request tanda tangan
router.post("/", authMiddleware, createRequest);

// Ambil semua request masuk
router.get("/incoming", authMiddleware, getIncomingRequests);

// Ambil semua request keluar
router.get("/outgoing", authMiddleware, getOutgoingRequests);

// Approve request
router.post("/:id/approve", authMiddleware, approveRequest);

// Reject request
router.post("/:id/reject", authMiddleware, rejectRequest);

module.exports = router;
