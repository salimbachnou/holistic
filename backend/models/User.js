const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google auth
    },
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    sparse: true
  },
  address: {
    type: String,
    default: ''
  },
  birthDate: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['client', 'professional', 'admin'],
    default: 'client'
  },
  location: {
    type: String,
    required: false
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  preferences: {
    language: {
      type: String,
      default: 'fr'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  coordinates: {
    city: String,
    country: String,
    lat: Number,
    lng: Number
  },
  // Favourites (professionals or products)
  favourites: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'favouriteType'
  }],
  favouriteType: {
    type: String,
    enum: ['Professional', 'Product']
  },
  // Favorites (US spelling for compatibility)
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  }],
  // Booking and order references
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving (if using password authentication)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update name field when firstName or lastName changes
userSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 