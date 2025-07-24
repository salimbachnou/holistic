const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const professionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  address: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String
  },
  coverImages: [{
    type: String
  }],
  activities: [{
    type: String
  }], // e.g. ["Yoga", "Maternity"]
  // Professional's own categories for sessions
  categories: [{
    type: String,
    trim: true
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  paymentEnabled: {
    type: Boolean,
    default: false
  },
  bookingMode: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'manual'
  },
  // Additional fields from previous structure
  businessName: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    required: true
  },
  certifications: [{
    name: String,
    issuingOrganization: String,
    dateObtained: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  services: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    duration: Number, // in minutes
    price: {
      amount: Number,
      currency: {
        type: String,
        default: 'MAD'
      }
    },
    category: {
      type: String,
      enum: ['individual', 'group', 'online', 'workshop', 'retreat']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  businessAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Morocco'
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: false
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      linkedin: String
    }
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    openTime: String, // HH:MM format
    closeTime: String, // HH:MM format
    breaks: [{
      startTime: String,
      endTime: String
    }]
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for location-based searches
professionalSchema.index({ 'businessAddress.coordinates': '2dsphere' });

// Index for business type searches
professionalSchema.index({ businessType: 1 });

// Index for active professionals
professionalSchema.index({ isActive: 1, isVerified: 1 });

// Add pagination plugin
professionalSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Professional', professionalSchema); 