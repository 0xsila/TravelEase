// File: routes/payment.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const paymentController = require('../controllers/paymentController');

// Rate limit protection for payment routes
router.use(authLimiter);

// Create a checkout session
router.post(
  '/create-checkout',
  protect,
  [
    body('rentalType')
      .isIn(['house', 'hotel', 'car'])
      .withMessage('Invalid rental type'),
    body('rentalId')
      .isMongoId()
      .withMessage('Invalid rental ID'),
    body('startDate')
      .isISO8601()
      .withMessage('Invalid start date'),
    body('endDate')
      .isISO8601()
      .withMessage('Invalid end date')
      .custom((endDate, { req }) => {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        return end > start;
      })
      .withMessage('End date must be after start date'),
    body('guests')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Number of guests must be a positive integer')
  ],
  validateRequest,
  paymentController.createCheckoutSession
);

// Verify payment status
router.get(
  '/verify/:sessionId',
  protect,
  paymentController.verifyPaymentStatus
);

// Get user bookings
router.get(
  '/bookings',
  protect,
  paymentController.getUserBookings
);

// Cancel booking
router.post(
  '/cancel/:bookingId',
  protect,
  paymentController.cancelBooking
);

// Note: Stripe webhook handler is now handled directly in server.js with raw body parsing
// to ensure the raw request body is available for signature verification

module.exports = router;