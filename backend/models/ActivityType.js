const mongoose = require('mongoose');

const activityTypeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['wellness', 'fitness', 'therapy', 'beauty', 'other'],
    default: 'wellness'
  },
  icon: {
    type: String,
    default: 'default'
  },
  color: {
    type: String,
    default: '#059669'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
activityTypeSchema.index({ value: 1 });
activityTypeSchema.index({ isActive: 1 });
activityTypeSchema.index({ order: 1 });

// Pre-save middleware to ensure value is lowercase and no spaces
activityTypeSchema.pre('save', function(next) {
  if (this.value) {
    this.value = this.value.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

// Static method to get all active activity types
activityTypeSchema.statics.getActiveTypes = function() {
  return this.find({ isActive: true }).sort({ order: 1, label: 1 });
};

// Static method to get activity types for dropdown
activityTypeSchema.statics.getForDropdown = function() {
  return this.find({ isActive: true })
    .sort({ order: 1, label: 1 })
    .select('value label category color');
};

module.exports = mongoose.model('ActivityType', activityTypeSchema); 