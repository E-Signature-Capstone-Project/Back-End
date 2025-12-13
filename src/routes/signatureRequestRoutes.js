const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  approveRequest,
  rejectRequest,
  getRequestSignature,
  getRequestHistory,
  getPublicSignatureRequestsByDocument
} = require("../controllers/signatureRequestController");

/* =======================
   PROTECTED ROUTES
======================= */
router.post("/", authMiddleware, createRequest);
router.get("/incoming", authMiddleware, getIncomingRequests);
router.get("/outgoing", authMiddleware, getOutgoingRequests);
router.get("/history", authMiddleware, getRequestHistory);
router.get("/:id/signature", authMiddleware, getRequestSignature);
router.post("/:id/approve", authMiddleware, approveRequest);
router.post("/:id/reject", authMiddleware, rejectRequest);

/* =======================
   PUBLIC QR ROUTE
======================= */
router.get(
  "/public/:documentId",
  getPublicSignatureRequestsByDocument
);

module.exports = router;
