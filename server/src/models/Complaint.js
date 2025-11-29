const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  authorType: {
    type: String,
    enum: ['user', 'support_agent'],
    default: 'user',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
});

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'billing', 'general', 'other'],
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new',
  },
  attachment: {
    filename: String,
    path: String,
    mimetype: String,
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  satisfactionPending: {
    type: Boolean,
    default: false,
  },
});

// Update updatedAt before saving
complaintSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);

