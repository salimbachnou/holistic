const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  service: {
    name: String,
    description: String,
    duration: Number, // in minutes
    price: {
      amount: Number,
      currency: { type: String, default: 'MAD' }
    }
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    start: {
      type: String, // HH:MM format
      required: true
    },
    end: {
      type: String, // HH:MM format
      required: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['in_person', 'online', 'home_visit'],
      required: true
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'Morocco' }
    },
    onlineLink: String, // For online sessions
    notes: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'cash', 'bank_transfer', 'online']
  },
  totalAmount: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'MAD'
    }
  },
  clientNotes: {
    type: String,
    maxlength: 500
  },
  professionalNotes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: {
      amount: Number,
      currency: { type: String, default: 'MAD' }
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    timeBeforeAppointment: Number // in minutes
  }],
  followUp: {
    completed: { type: Boolean, default: false },
    notes: String,
    nextAppointmentSuggested: Date
  }
}, {
  timestamps: true
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last booking of the day to generate sequential number
    const lastBooking = await this.constructor.findOne({
      bookingNumber: new RegExp(`^BK${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.bookingNumber = `BK${year}${month}${day}${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Indexes
bookingSchema.index({ client: 1, appointmentDate: -1 });
bookingSchema.index({ professional: 1, appointmentDate: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ appointmentDate: 1, 'appointmentTime.start': 1 });

module.exports = mongoose.model('Booking', bookingSchema); 