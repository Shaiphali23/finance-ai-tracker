// controllers/authController.js
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Validate request
    if (!token) {
      return res.status(400).json({ 
        message: "Google token is required" 
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Validate payload
    if (!payload || !payload.sub) {
      return res.status(401).json({ 
        message: "Invalid Google token payload" 
      });
    }

    const { sub, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId: sub });
    
    if (!user) {
      // Create new user
      user = new User({
        googleId: sub,
        email: email || '',
        name: name || '',
        picture: picture || '',
        createdAt: new Date(),
      });
      
      await user.save();
    } else {
      // Update existing user's profile if needed
      user.email = email || user.email;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token with more secure options
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        googleId: user.googleId 
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: "7d",
        issuer: "your-app-name",
        audience: "your-app-client",
      }
    );

    // Secure response with user data
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("Google auth error:", error);
    
    // More specific error responses
    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ 
        success: false,
        message: "Expired Google token" 
      });
    }
    
    if (error.message.includes('Invalid token signature')) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid Google token" 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh JWT token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user by ID and check if refresh token matches
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: refreshToken,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        preferences: req.user.preferences,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Remove refresh token from user document
    req.user.refreshToken = undefined;
    await req.user.save();

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  googleLogin,
  refreshToken,
  getProfile,
  logout,
};
