const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['professional', 'information', 'general_contact']
  },
  // Common fields
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: function() { 
      return this.type === 'information' || this.type === 'general_contact';
    }
  },
  lastName: {
    type: String,
    required: function() {
      return this.type === 'information' || this.type === 'general_contact';
    }
  },
  phone: {
    type: String,
    required: function() {
      return this.type === 'professional';
    }
  },
  message: {
    type: String,
    required: function() {
      return this.type === 'information' || this.type === 'general_contact';
    },
    maxlength: 1000
  },
  subject: {
    type: String,
    required: function() {
      return this.type === 'general_contact';
    },
    maxlength: 200
  },
  
  // Read and processing status
  isRead: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  
  // For professional account requests
  businessName: {
    type: String,
    required: function() { return this.type === 'professional'; }
  },
  businessCreationDate: {
    type: Date,
    required: function() { return this.type === 'professional'; }
  },
  activityType: {
    type: String,
    required: function() { return this.type === 'professional'; }
  },
  selectedPlan: {
    type: String,
    required: function() { return this.type === 'professional'; },
    enum: ['basic', 'premium', 'enterprise']
  },
  
  // Admin notes and processing
  adminNotes: {
    type: String,
    maxlength: 500
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  
  // Contact response system
  responses: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    responseType: {
      type: String,
      enum: ['email', 'sms', 'internal_note'],
      default: 'email'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isSent: {
      type: Boolean,
      default: false
    },
    errorMessage: String
  }],
  
  // Contact source and metadata
  source: {
    type: String,
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  
}, {
  timestamps: true
});

// Index for efficient querying
contactSchema.index({ type: 1, isProcessed: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  if (this.type === 'information' || this.type === 'general_contact') {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.businessName;
});

// Virtual for last response
contactSchema.virtual('lastResponse').get(function() {
  if (this.responses && this.responses.length > 0) {
    return this.responses[this.responses.length - 1];
  }
  return null;
});

// Ensure virtual fields are serialized
contactSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Contact', contactSchema); 