const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'message', 
      'order_placed',
      'order_confirmed',
      'order_processing',
      'order_shipped', 
      'order_delivered', 
      'order_cancelled',
      'payment_received', 
      'appointment_scheduled', 
      'appointment_cancelled',
      'new_professional',
      'new_client',
      'new_contact',
      'new_order',
      'new_event',
      'event_updated',
      'event_approved',
      'event_rejected',
      'event_confirmed',
      'event_cancelled',
      'event_review_request',
      'session_cancelled',
      'session_review_request',
      'session_review_reminder',
      'new_review',
      'system'
    ],
    default: 'system'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 