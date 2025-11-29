const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT (same as in authRoutes)
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role || 'user', // Use user's role from database
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/google - Handle Google OAuth callback
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Google ID, email, and name are required' 
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
      });
    }

    const token = generateToken(user);

    res.json({
      ok: true,
      message: 'Google login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/auth/apple - Handle Apple OAuth callback
router.post('/apple', async (req, res) => {
  try {
    const { appleId, email, name } = req.body;

    if (!appleId || !email || !name) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Apple ID, email, and name are required' 
      });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email },
        { appleId }
      ]
    });

    if (user) {
      // Update existing user with Apple ID if not set
      if (!user.appleId) {
        user.appleId = appleId;
        user.authProvider = 'apple';
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        appleId,
        authProvider: 'apple',
      });
    }

    const token = generateToken(user);

    res.json({
      ok: true,
      message: 'Apple login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        message: 'User not found' 
      });
    }

    res.json({
      ok: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;

