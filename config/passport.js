// File: config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

// Serialize user to the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5173'}/auth/google/callback`,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our database
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (!user) {
          // If not, create a new user
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profileImage: profile.photos[0]?.value,
            isActivated: true, // Google accounts are pre-verified
            password: crypto.randomBytes(20).toString('hex') // Random password for Google users
          });
        } else if (!user.googleId) {
          // If user exists but doesn't have googleId, update it
          user.googleId = profile.id;
          user.isActivated = true; // Ensure account is activated
          if (!user.profileImage && profile.photos[0]?.value) {
            user.profileImage = profile.photos[0].value;
          }
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);