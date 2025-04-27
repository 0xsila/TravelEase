// File: routes/webhookRoute.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// This route should be used in server.js with express.raw middleware
router.post('/', paymentController.handleStripeWebhook);

module.exports = router;