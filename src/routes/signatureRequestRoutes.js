const express = require("express");
const {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  approveRequest,
  rejectRequest,
  getRequestSignature
} = require("../controllers/signatureRequestController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createRequest);
router.get("/incoming", authMiddleware, getIncomingRequests);
router.get("/outgoing", authMiddleware, getOutgoingRequests);
router.get("/:id/signature", authMiddleware, getRequestSignature);
router.post("/:id/approve", authMiddleware, approveRequest);
router.post("/:id/reject", authMiddleware, rejectRequest);

module.exports = router;
