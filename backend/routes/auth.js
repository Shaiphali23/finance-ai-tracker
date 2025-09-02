const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const {
  googleLogin,
  refreshToken,
  getProfile,
  logout,
} = require("../controllers/authController");

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      (process.env.FRONTEND_URL || "http://localhost:5173") +
      "/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to the FRONTEND'S callback handler, not the dashboard
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/callback?token=${token}`
    );
  }
);

// API Google login (for frontend token-based auth)
router.post("/google", googleLogin);

// Refresh JWT token
router.post("/refresh", refreshToken);

// Logout
router.post("/logout", auth, logout);

// Get user profile
router.get("/profile", auth, getProfile);

module.exports = router;
    