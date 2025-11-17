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

// Ambil semua request masuk (user sebagai signer yang dimintai)
router.get("/incoming", authMiddleware, getIncomingRequests);

// Ambil semua request keluar (user sebagai peminta)
router.get("/outgoing", authMiddleware, getOutgoingRequests);

// Setujui permintaan tanda tangan
router.post("/:id/approve", authMiddleware, approveRequest);

// Tolak permintaan tanda tangan
router.post("/:id/reject", authMiddleware, rejectRequest);

module.exports = router;
