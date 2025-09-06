const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const analyticsRoutes = require("./routes/analytics");
const errorHandler = require("./middleware/errorHandler");
const session = require("express-session");
const passport = require("passport");

const app = express();

// Connect to database
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  `${process.env.FRONTEND_URL}`
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.send("Backend server is running!");
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});