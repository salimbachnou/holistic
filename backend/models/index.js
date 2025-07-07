const mongoose = require('mongoose');

// Import all models
const User = require('./User');
const Professional = require('./Professional');
const Product = require('./Product');
const Event = require('./Event');
const Booking = require('./Booking');
const Session = require('./Session');
const Review = require('./Review');
const Order = require('./Order');
const Contact = require('./Contact');
const Message = require('./Message');
const Notification = require('./Notification');

// Video Call Access Log Schema
const videoCallAccessLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['client', 'professional', 'admin'],
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  accessType: {
    type: String,
    enum: ['join', 'leave', 'denied', 'security_violation'],
    required: true
  },
  ipAddress: String,
  userAgent: String,
  tokenUsed: String, // Last 10 characters of token for tracking
  securityFlags: {
    tokenValid: Boolean,
    sessionActive: Boolean,
    userAuthorized: Boolean,
    timeWithinWindow: Boolean
  },
  errorMessage: String,
  metadata: {
    sessionTitle: String,
    sessionStartTime: Date,
    accessDuration: Number, // in seconds
    browserInfo: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
videoCallAccessLogSchema.index({ sessionId: 1, createdAt: -1 });
videoCallAccessLogSchema.index({ userId: 1, createdAt: -1 });
videoCallAccessLogSchema.index({ accessType: 1, createdAt: -1 });

const VideoCallAccessLog = mongoose.model('VideoCallAccessLog', videoCallAccessLogSchema);

// Export all models
module.exports = {
  User,
  Professional,
  Product,
  Event,
  Booking,
  Session,
  Review,
  Order,
  Contact,
  Message,
  Notification,
  VideoCallAccessLog
}; 