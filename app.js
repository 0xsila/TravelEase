const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const corsConfig = require("./config/cors");
const { connectDB } = require("./Database/db");
const passport = require("passport");
const session = require("express-session");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const { errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const rateLimit = require("express-rate-limit");
//file upload
const multer = require("multer");
///
///----------
///------------------> Adding Images to the cars,homes,hotels require changing the body type into multipart/form-data check create car in postman
///------------------> also when they are linking they need to know that the body type is form-data
///------------------> everything workd fine but i didn't check the authentification
///------------------> changed postman ports to 5000

// error handler
const notFoundMiddleware = require("./middleware/not-found");

//Routes
const authRoutes = require("./routes/auth");
const googleAuthRoutes = require("./routes/googleAuth");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/payment");

const hotelsRouter = require("./routes/hotels");
const homesRouter = require("./routes/homes");
const carsRouter = require("./routes/cars");
const generalRouter = require("./routes/general");
const bookingRouter = require("./routes/booking");
const notificationRouter = require("./routes/notifications");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(cors(corsConfig));

// Regular middleware for all other routes
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Performance Middleware
app.use(compression());
// Set up session with secure configuration

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    },
  })
);

app.set("trust proxy", 1);

//rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Import passport configuration
require("./config/passport");

// Routes
app.use("/api/auth", authRoutes);
app.use("/auth/google", googleAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/api/v1/homes", homesRouter);
app.use("/api/v1", generalRouter);
app.use("/api/v1/cars", carsRouter);
app.use("/api/v1/hotels", hotelsRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/notifications", notificationRouter);

//make uploads folder public
app.use("/uploads", express.static("uploads"));

// Global error handler
app.use(notFoundMiddleware);
app.use(errorHandler);

const connect = () => {
  console.log("Attempting MongoDB connection...");
  connectDB().then(() => {
    console.log("Connected to MongoDB Atlas");
    // Start server after successful connection
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Stripe webhook endpoint: http://localhost:${PORT}/api/payment/webhook`
      );
    });
  });
};

connect();
