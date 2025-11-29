const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware to protect routes
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        ok: false, 
        message: 'No token provided. Authorization required.' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ 
        ok: false, 
        message: 'User not found. Token invalid.' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user is a support agent or admin
const isSupportAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      ok: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role === 'support_agent' || req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    ok: false, 
    message: 'Access denied. Support agent privileges required.' 
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      ok: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    ok: false, 
    message: 'Access denied. Admin privileges required.' 
  });
};

module.exports = { authenticate, isSupportAgent, isAdmin };

