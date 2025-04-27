// File: routes/googleAuth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Initiate Google OAuth login
router.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      // User is authenticated, generate JWT
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Prepare user data to send to frontend
      const userData = {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        profileImage: req.user.profileImage
      };

      // Encode user data for URL
      const encodedUserData = encodeURIComponent(JSON.stringify(userData));

      // Redirect to frontend with token and user data
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/success?token=${token}&googleData=${encodedUserData}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error during Google authentication:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
);

module.exports = router;