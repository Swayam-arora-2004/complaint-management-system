const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../config/mailer');

const router = express.Router();

// helper: generate JWT
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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local',
    });

    const token = generateToken(user);

    res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password required' });
    }

    // Handle admin login with fixed credentials
    if (email.toLowerCase() === 'admin' && password === 'admin123') {
      // Find or create admin user
      let adminUser = await User.findOne({ email: 'admin@system.local' });
      
      if (!adminUser) {
        // Create admin user if doesn't exist
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        adminUser = await User.create({
          name: 'Admin',
          email: 'admin@system.local',
          passwordHash: adminPasswordHash,
          authProvider: 'local',
          role: 'admin',
        });
      } else {
        // Ensure admin user has admin role
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          await adminUser.save();
        }
      }

      const token = generateToken(adminUser);

      return res.json({
        ok: true,
        message: 'Admin login successful',
        data: {
          token,
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
          },
        },
      });
    }

    // Regular user login
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ ok: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ ok: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      ok: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 Password reset requested for:', email);

    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      console.log('❌ User not found:', email);
      return res.json({
        ok: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    console.log('✅ User found:', {
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
      hasPassword: !!user.passwordHash
    });

    // Only allow password reset for local auth users
    if (user.authProvider !== 'local' || !user.passwordHash) {
      console.log('⚠️  User is not a local auth user or has no password');
      return res.json({
        ok: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL - encode the token to handle special characters
    const encodedToken = encodeURIComponent(resetToken);
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${encodedToken}`;

    console.log('🔗 Reset URL generated:', resetUrl.substring(0, 50) + '...');

    // Send email
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Dear ${user.name},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    console.log('📧 Sending password reset email to:', user.email);
    const emailResult = await sendEmail(
      user.email,
      'Password Reset Request',
      `You requested to reset your password. Click this link: ${resetUrl}`,
      emailHtml
    );

    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email!');
      console.error('   Error:', emailResult.error);
      console.log('🔗 Reset URL for manual use:', resetUrl);
      // Still return success to user, but log the error
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('   To:', user.email);
      console.log('   Message ID:', emailResult.messageId);
    }

    res.json({
      ok: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Token and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      console.error('❌ Invalid or expired reset token');
      return res.status(400).json({ 
        ok: false, 
        message: 'Invalid or expired reset token. Please request a new password reset link.' 
      });
    }

    console.log('✅ Valid reset token found for user:', user.email);

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('✅ Password reset successfully for user:', user.email);

    res.json({
      ok: true,
      message: 'Password has been reset successfully',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Export generateToken for use in oauthRoutes
module.exports = router;
module.exports.generateToken = generateToken;

