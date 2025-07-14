const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  serviceType: {
    type: String,
    enum: ['session', 'product', 'event'],
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  featured: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
testimonialSchema.index({ status: 1, featured: 1 });
testimonialSchema.index({ clientId: 1 });
testimonialSchema.index({ professionalId: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema); 