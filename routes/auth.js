// File: routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');
const { sendActivationEmail, verifyOTP } = require('../utils/emailService');
const User = require('../models/User');

// Test email route
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Generate a test OTP
    const testOTP = '123456';
    
    // Send test email
    await sendActivationEmail({
      email: email,
      otp: testOTP
    });
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      otp: testOTP // Only for testing purposes
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Account verification route
router.post('/account-verified', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }
    
    // Verify OTP
    const isValid = await verifyOTP(userId, otp, 'activation');
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Activate user account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActivated = true;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Account activated.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActivated: user.isActivated
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// User registration with validation
router.post(
  '/register',
  [
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .trim(),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
  ],
  validateRequest,
  authController.register
);

// Get OTP verification page data
router.get(
  '/verify-otp/:userId',
  authController.getOTPVerificationData
);

// Activate account
router.post(
  '/activate',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers')
  ],
  validateRequest,
  authController.activateAccount
);

// User login
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateRequest,
  authController.login
);

// Google OAuth login/signup
router.post(
  '/google',
  [
    body('googleId')
      .notEmpty()
      .withMessage('Google ID is required'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('firstName')
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
  ],
  validateRequest,
  authController.googleAuth
);

// Request password reset OTP
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],
  validateRequest,
  authController.forgotPassword
);

// Verify OTP code
router.post(
  '/verify-otp',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers')
  ],
  validateRequest,
  authController.verifyOTPController
);

// Reset password with token
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
  ],
  validateRequest,
  authController.resetPassword
);

// Logout route
router.post('/logout', protect, authController.logout);

module.exports = router;