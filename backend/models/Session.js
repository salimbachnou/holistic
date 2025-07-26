const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15, // minimum 15 minutes
    max: 480 // maximum 8 hours
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Additional fields for better functionality
  category: {
    type: String,
    enum: ['individual', 'group', 'online', 'workshop', 'retreat'],
    default: 'individual'
  },
  // Session categories (for filtering and searching)
  sessionCategories: [{
    type: String,
  }],
  location: {
    type: String,
    required: false
  },
  locationCoordinates: {
    lat: Number,
    lng: Number
  },
  meetingLink: {
    type: String,
    required: function() {
      return this.category === 'online';
    }
  },
  // Built-in video functionality removed - using external links only
  // Zoom specific fields
  zoomMeetingId: {
    type: String,
    sparse: true
  },
  zoomMeetingPassword: {
    type: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() {
        return this.isRecurring;
      }
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date
  },
  requirements: [{
    type: String
  }],
  materials: [{
    name: String,
    description: String,
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  // Review statistics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for date-based queries
sessionSchema.index({ startTime: 1 });

// Index for professional sessions
sessionSchema.index({ professionalId: 1, startTime: 1 });

// Index for status queries
sessionSchema.index({ status: 1 });

// Virtual for end time
sessionSchema.virtual('endTime').get(function() {
  return new Date(this.startTime.getTime() + (this.duration * 60000));
});

// Virtual for available spots
sessionSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.participants.length;
});

// Virtual for is full
sessionSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Method to check if session is in the past
sessionSchema.methods.isPast = function() {
  return this.startTime < new Date();
};

// Method to check if session can be booked
sessionSchema.methods.canBeBooked = function() {
  return !this.isPast() && !this.isFull && this.status === 'scheduled';
};

// Method to check if session is online
sessionSchema.methods.isOnline = function() {
  return this.category === 'online';
};

// Method to check if session has Zoom meeting
sessionSchema.methods.hasZoomMeeting = function() {
  return !!this.zoomMeetingId;
};

// Ensure virtual fields are serialized
sessionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Session', sessionSchema);