const express = require('express');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, isSupportAgent } = require('../middleware/auth');
const { sendEmail } = require('../config/mailer');

const router = express.Router();

// All admin routes require authentication and support agent role
router.use(authenticate);
router.use(isSupportAgent);

// GET /api/admin/complaints - Get all complaints (for support agents)
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      ok: true,
      data: complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/admin/complaints/:id - Get any complaint by ID (for support agents)
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    res.json({
      ok: true,
      data: complaint,
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PATCH /api/admin/complaints/:id/status - Update any complaint status (for support agents)
router.patch('/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['new', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Valid status is required' 
      });
    }

    const complaint = await Complaint.findById(id).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    
    // Mark that user needs to confirm satisfaction when status changes to resolved
    if (status === 'resolved' && oldStatus !== 'resolved') {
      complaint.satisfactionPending = true;
    } else if (status !== 'resolved') {
      // Reset satisfactionPending if status is changed away from resolved
      complaint.satisfactionPending = false;
    }
    
    await complaint.save();

    // Send email notification if status changed
    if (oldStatus !== status && complaint.userId) {
      try {
        const complaintOwner = complaint.userId;
        let emailHtml = '';
        
        if (status === 'resolved') {
          emailHtml = `
            <h2>Complaint Resolved</h2>
            <p>Dear ${complaintOwner.name},</p>
            <p>Your complaint <strong>${complaint._id}</strong> has been marked as resolved by our support team.</p>
            <p>Please log in to confirm if you are satisfied with the resolution. If yes, the complaint will be closed. If no, you can continue the conversation with our support team.</p>
            <p>Thank you for your patience.</p>
          `;
        } else {
          emailHtml = `
            <h2>Complaint Status Updated</h2>
            <p>Dear ${complaintOwner.name},</p>
            <p>Your complaint <strong>${complaint._id}</strong> status has been updated by a support agent.</p>
            <p><strong>Previous Status:</strong> ${oldStatus}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p>Thank you for your patience.</p>
          `;
        }

        await sendEmail(
          complaintOwner.email,
          `Complaint Status Updated - ${complaint._id}`,
          `Your complaint ${complaint._id} status has been updated to ${status}.`,
          emailHtml
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    res.json({
      ok: true,
      message: 'Status updated successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/admin/complaints/:id/comments - Add support agent comment to any complaint
router.post('/complaints/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Comment text is required' 
      });
    }

    const complaint = await Complaint.findById(id).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    // Add support agent comment
    const comment = {
      text: text.trim(),
      author: req.user.name,
      authorType: 'support_agent',
      timestamp: new Date(),
    };

    complaint.comments.push(comment);
    await complaint.save();

    // Send email notification to complaint owner
    if (complaint.userId) {
      try {
        const complaintOwner = complaint.userId;
        const emailHtml = `
          <h2>New Reply on Your Complaint</h2>
          <p>Dear ${complaintOwner.name},</p>
          <p>A support agent has replied to your complaint <strong>${complaint._id}</strong>.</p>
          <p><strong>Subject:</strong> ${complaint.subject}</p>
          <p><strong>Reply:</strong> ${text.trim()}</p>
          <p>Please check your dashboard for more details.</p>
        `;

        await sendEmail(
          complaintOwner.email,
          `New Reply on Complaint - ${complaint._id}`,
          `A support agent has replied to your complaint ${complaint._id}.`,
          emailHtml
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    res.status(201).json({
      ok: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/admin/users - Get all users (for admin only, but accessible to support agents for now)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');

    res.json({
      ok: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role (for admin only)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!role || !['user', 'support_agent', 'admin'].includes(role)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Valid role is required' 
      });
    }

    // Only admins can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        ok: false, 
        message: 'Only admins can change user roles' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        message: 'User not found' 
      });
    }

    res.json({
      ok: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/admin/complaints/:id/attachments/:filename - Get attachment (admin can access any complaint's attachment)
router.get('/complaints/:id/attachments/:filename', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    if (!complaint.attachment) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Attachment not found' 
      });
    }

    // Verify filename matches
    if (complaint.attachment.filename !== req.params.filename) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Attachment filename mismatch' 
      });
    }

    const filePath = complaint.attachment.path;
    
    if (!filePath) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Attachment path not found' 
      });
    }
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ 
        ok: false, 
        message: 'File not found on server' 
      });
    }

    // Set proper headers for file serving
    res.setHeader('Content-Type', complaint.attachment.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${complaint.attachment.filename}"`);
    
    // Send file
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ ok: false, message: 'Error sending file' });
        }
      }
    });
  } catch (error) {
    console.error('Download attachment error:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  }
});

module.exports = router;

