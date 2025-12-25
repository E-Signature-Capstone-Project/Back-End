const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const signatureRequestRoutes = require("./signatureRequestRoutes");
const logRoutes = require("./logRoutes");
const signatureBaselineRoutes = require("./signatureBaselineRoutes");
const webhookRoutes = require("./webhookRoutes");


router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/requests", signatureRequestRoutes);
router.use("/logs", logRoutes);
router.use("/signature_baseline", signatureBaselineRoutes);
router.use("/webhook", webhookRoutes);

module.exports = router;
