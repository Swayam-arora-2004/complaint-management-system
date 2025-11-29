const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, isSupportAgent } = require('../middleware/auth');
const { sendEmail } = require('../config/mailer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/complaints';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

// All complaint routes require authentication
router.use(authenticate);

// GET /api/complaints - Get all complaints for the logged-in user
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      ok: true,
      data: complaints,
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/complaints/:id - Get a specific complaint
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.userId, // Ensure user can only access their own complaints
    }).populate('userId', 'name email');

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

// POST /api/complaints - Create a new complaint
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;

    if (!subject || !category || !priority || !description) {
      return res.status(400).json({ 
        ok: false, 
        message: 'All required fields must be provided' 
      });
    }

    const complaintData = {
      userId: req.userId,
      subject,
      category,
      priority,
      description,
      status: 'new',
    };

    // Add attachment if provided
    if (req.file) {
      complaintData.attachment = {
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
      };
    }

    const complaint = await Complaint.create(complaintData);

    // Send acknowledgement email
    try {
      const user = req.user;
      const emailHtml = `
        <h2>Complaint Submitted Successfully</h2>
        <p>Dear ${user.name},</p>
        <p>Your complaint has been received and assigned the following ID: <strong>${complaint._id}</strong></p>
        <p><strong>Subject:</strong> ${complaint.subject}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Priority:</strong> ${complaint.priority}</p>
        <p>We will review your complaint and get back to you soon.</p>
        <p>Thank you for your patience.</p>
      `;

      await sendEmail(
        user.email,
        'Complaint Submitted - ' + complaint._id,
        `Your complaint ${complaint._id} has been submitted successfully.`,
        emailHtml
      );
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      ok: true,
      message: 'Complaint created successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// PATCH /api/complaints/:id/status - Update complaint status
// Users can update their own complaints, support agents can update any complaint
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['new', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Valid status is required' 
      });
    }

    // Find complaint - users can only update their own, support agents can update any
    const query = { _id: id };
    if (req.user.role !== 'support_agent' && req.user.role !== 'admin') {
      query.userId = req.userId;
    }

    const complaint = await Complaint.findOne(query).populate('userId', 'name email');

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
            <p>Your complaint <strong>${complaint._id}</strong> has been marked as resolved.</p>
            <p>Please log in to confirm if you are satisfied with the resolution. If yes, the complaint will be closed. If no, you can continue the conversation with our support team.</p>
            <p>Thank you for your patience.</p>
          `;
        } else {
          emailHtml = `
            <h2>Complaint Status Updated</h2>
            <p>Dear ${complaintOwner.name},</p>
            <p>Your complaint <strong>${complaint._id}</strong> status has been updated.</p>
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

// POST /api/complaints/:id/confirm-satisfaction - User confirms satisfaction and closes complaint
router.post('/:id/confirm-satisfaction', async (req, res) => {
  try {
    const { satisfied } = req.body;
    const { id } = req.params;

    if (typeof satisfied !== 'boolean') {
      return res.status(400).json({ 
        ok: false, 
        message: 'satisfied field (true/false) is required' 
      });
    }

    const complaint = await Complaint.findOne({
      _id: id,
      userId: req.userId, // Users can only confirm their own complaints
    }).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ 
        ok: false, 
        message: 'Complaint must be resolved before confirming satisfaction' 
      });
    }

    if (satisfied) {
      // User is satisfied, close the complaint
      complaint.status = 'closed';
      complaint.satisfactionPending = false;
      await complaint.save();

      // Send confirmation email
      try {
        const complaintOwner = complaint.userId;
        const emailHtml = `
          <h2>Complaint Closed</h2>
          <p>Dear ${complaintOwner.name},</p>
          <p>Thank you for confirming your satisfaction. Your complaint <strong>${complaint._id}</strong> has been closed.</p>
          <p>We appreciate your feedback!</p>
        `;

        await sendEmail(
          complaintOwner.email,
          `Complaint Closed - ${complaint._id}`,
          `Your complaint ${complaint._id} has been closed.`,
          emailHtml
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    } else {
      // User is not satisfied, keep it resolved but allow conversation to continue
      complaint.satisfactionPending = false;
      await complaint.save();
    }

    res.json({
      ok: true,
      message: satisfied ? 'Complaint closed successfully' : 'You can continue the conversation',
      data: complaint,
    });
  } catch (error) {
    console.error('Confirm satisfaction error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST /api/complaints/:id/comments - Add a comment to a complaint
// Users can comment on their own complaints, support agents can comment on any complaint
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Comment text is required' 
      });
    }

    // Find complaint - users can only comment on their own, support agents can comment on any
    const query = { _id: id };
    if (req.user.role !== 'support_agent' && req.user.role !== 'admin') {
      query.userId = req.userId;
    }

    const complaint = await Complaint.findOne(query).populate('userId', 'name email');

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    // Determine author type based on user role
    const authorType = (req.user.role === 'support_agent' || req.user.role === 'admin') 
      ? 'support_agent' 
      : 'user';

    // Add comment
    const comment = {
      text: text.trim(),
      author: req.user.name,
      authorType: authorType,
      timestamp: new Date(),
    };

    complaint.comments.push(comment);
    await complaint.save();

    // Send email notification to complaint owner if support agent commented
    if (authorType === 'support_agent' && complaint.userId) {
      try {
        const complaintOwner = complaint.userId;
        const emailHtml = `
          <h2>New Reply on Your Complaint</h2>
          <p>Dear ${complaintOwner.name},</p>
          <p>A support agent has replied to your complaint <strong>${complaint._id}</strong>.</p>
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

// DELETE /api/complaints/:id - Delete a complaint
router.delete('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId, // Ensure user can only delete their own complaints
    });

    if (!complaint) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Complaint not found' 
      });
    }

    // Delete attachment file if exists
    if (complaint.attachment && complaint.attachment.path) {
      try {
        fs.unlinkSync(complaint.attachment.path);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
      }
    }

    res.json({
      ok: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// GET /api/complaints/:id/attachments/:filename - Download attachment
router.get('/:id/attachments/:filename', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

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

