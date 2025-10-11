const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const signatureRequestRoutes = require("./signatureRequestRoutes");
const logRoutes = require("./logRoutes");
const signatureBaselineRoutes = require("./signatureBaselineRoutes");

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/requests", signatureRequestRoutes);
router.use("/logs", logRoutes);
router.use("/baseline", signatureBaselineRoutes);
module.exports = router;
