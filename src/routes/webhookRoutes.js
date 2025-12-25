const express = require('express');
const router = express.Router();
const { signwellWebhook } = require('../controllers/webhookController');

// Usually webhooks are public POST endpoints
router.post('/signwell', express.json({ limit: '1mb' }), signwellWebhook);

module.exports = router;
