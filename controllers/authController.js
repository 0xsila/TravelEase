// File: controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  generateOTP,
  verifyOTP,
  sendOTPEmail,
  sendActivationEmail,
} = require("../utils/emailService");

// User Registration
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || "user",
      isActivated: false,
    });

    // Generate and send OTP for account activation
    const otp = await generateOTP(user._id, "activation");

    try {
      await sendActivationEmail({
        email: user.email,
        otp: otp,
      });

      // Return success message with redirect information
      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email for activation code.",
        userId: user._id,
        redirectTo: `/verify-otp/${user._id}`,
        email: user.email,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);

      // If email fails, we'll still create the account but notify the user
      res.status(201).json({
        success: true,
        message:
          "User registered successfully but activation email could not be sent. Please contact support.",
        userId: user._id,
        redirectTo: `/verify-otp/${user._id}`,
        email: user.email,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get OTP verification page data
exports.getOTPVerificationData = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId).select(
      "email firstName lastName isActivated"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already activated
    if (user.isActivated) {
      return res.status(400).json({
        success: false,
        message: "Account is already activated",
      });
    }

    // Return verification page data
    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Activate account with OTP
exports.activateAccount = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Verify OTP
    const isValid = await verifyOTP(userId, otp, "activation");

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation code",
      });
    }

    // Activate user account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActivated = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success with token and redirect URL
    res.status(200).json({
      success: true,
      message: "Account activated successfully",
      token,
      redirectTo: "/", // Redirect to homepage
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Login
// User Login - modify this function in authController.js
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is activated
    if (!user.isActivated) {
      // Generate new OTP for activation
      const otp = await generateOTP(user._id, "activation");

      try {
        await sendActivationEmail({
          email: user.email,
          otp: otp,
        });

        return res.status(202).json({
          success: true,
          message:
            "Account not activated. We have sent a new activation code to your email.",
          userId: user._id,
          redirectTo: `/verify-account/${user._id}`, // Changed to a more appropriate route
          requiresActivation: true, // Flag to indicate activation is needed
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send activation email. Please try again.",
          error: emailError.message,
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Forgot Password - Generate OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP for password reset
    const otp = await generateOTP(user._id, "passwordReset");

    try {
      // Send email with OTP
      await sendOTPEmail({
        email: user.email,
        otp: otp,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        userId: user._id,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOTPController = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Verify OTP
    const isValid = await verifyOTP(userId, otp, "passwordReset");

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Generate temporary token for password reset
    const tempToken = jwt.sign(
      { userId, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Return success with temporary token
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken: tempToken,
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with Token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is for password reset
      if (decoded.purpose !== "reset-password") {
        return res.status(400).json({
          success: false,
          message: "Invalid token purpose",
        });
      }

      // Find user by id
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Set new password
      user.password = password;
      await user.save();

      // Generate new JWT token
      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Return success with new token
      res.status(200).json({
        success: true,
        message: "Password reset successful",
        token: jwtToken,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Google OAuth login/signup
exports.googleAuth = async (req, res, next) => {
  try {
    const { googleId, email, firstName, lastName, profileImage } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        googleId,
        email,
        firstName,
        lastName,
        profileImage,
        isActivated: true, // Google accounts are pre-verified
        password: crypto.randomBytes(20).toString("hex"), // Random password for Google users
      });
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.isActivated = true; // Ensure account is activated
        if (!user.firstName) user.firstName = firstName;
        if (!user.lastName) user.lastName = lastName;
        if (!user.profileImage) user.profileImage = profileImage;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success with token
    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Clear the token from the client
    res.clearCookie("token");

    // If you're using JWT in Authorization header, the client should remove it
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
};
