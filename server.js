// File: server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const paymentController = require('./controllers/paymentController');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || 
        // Allow all localhost origins in development
        (process.env.NODE_ENV === 'development' && origin.includes('localhost'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Routes
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/payment'); // Payment routes

// Special handling for Stripe webhook route - this needs raw body for signature verification
app.post(
  '/api/payment/webhook', 
  express.raw({ type: 'application/json' }), 
  (req, res, next) => {
    // Store raw body for Stripe webhook verification
    req.rawBody = req.body;
    next();
  },
  (req, res) => {
    // Parse the raw body as JSON for our handler
    if (req.rawBody) {
      // If rawBody exists, body will be used by the webhook handler
      try {
        req.body = JSON.parse(req.rawBody.toString());
      } catch (err) {
        console.error('Error parsing webhook payload', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
    
    // Process the webhook
    paymentController.handleStripeWebhook(req, res);
  }
);

// Regular middleware for all other routes
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Performance Middleware
app.use(compression());

// Set up session with secure configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Import passport configuration
require('./config/passport');

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth/google', googleAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes); // Add payment routes (except webhook which is handled separately above)

// 404 handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection with retry logic
const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
    .then(() => {
      console.log('Connected to MongoDB Atlas');
      // Start server after successful connection
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Stripe webhook endpoint: http://localhost:${PORT}/api/payment/webhook`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Start connection process
connectWithRetry();