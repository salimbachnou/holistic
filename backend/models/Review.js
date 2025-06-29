const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    required: true,
    enum: ['Product', 'Professional']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Additional fields for better functionality
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  images: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reply: {
    text: String,
    date: Date,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  // For product reviews
  purchaseVerified: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  // For professional reviews
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate reviews
reviewSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// Index for target queries
reviewSchema.index({ targetId: 1, targetType: 1, status: 1 });

// Index for user reviews
reviewSchema.index({ userId: 1 });

// Index for rating-based queries
reviewSchema.index({ rating: 1 });

// Index for date-based queries
reviewSchema.index({ createdAt: -1 });

// Virtual for days since creation
reviewSchema.virtual('daysAgo').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if review can be edited
reviewSchema.methods.canBeEdited = function(userId) {
  return this.userId.toString() === userId.toString() && 
         this.daysAgo <= 7 && 
         this.status === 'approved';
};

// Method to check if user found review helpful
reviewSchema.methods.isHelpfulForUser = function(userId) {
  return this.helpfulVotes.users.includes(userId);
};

// Static method to get average rating for target
reviewSchema.statics.getAverageRating = async function(targetId, targetType) {
  const result = await this.aggregate([
    {
      $match: {
        targetId: new mongoose.Types.ObjectId(targetId),
        targetType: targetType,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};

// Middleware to update target rating after save
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Model = mongoose.model(this.targetType);
    const stats = await this.constructor.getAverageRating(this.targetId, this.targetType);
    
    await Model.findByIdAndUpdate(this.targetId, {
      'rating.average': stats.averageRating,
      'rating.totalReviews': stats.totalReviews
    });
  }
});

// Middleware to update target rating after remove
reviewSchema.post('remove', async function() {
  const Model = mongoose.model(this.targetType);
  const stats = await this.constructor.getAverageRating(this.targetId, this.targetType);
  
  await Model.findByIdAndUpdate(this.targetId, {
    'rating.average': stats.averageRating,
    'rating.totalReviews': stats.totalReviews
  });
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Review', reviewSchema); 