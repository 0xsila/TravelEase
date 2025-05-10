// CORS Configuration
const corsConfig = {
  origin: function (origin, callback) {
    callback(null, origin);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // Cache preflight requests for 10 minutes
};

exports.corsOptions = corsConfig;
