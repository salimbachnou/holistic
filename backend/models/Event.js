const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    locationCoordinates: {
      lat: Number,
      lng: Number,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'MAD',
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    professional: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingType: {
      type: String,
      enum: ['message_only', 'in_person_payment', 'online_payment'],
      default: 'in_person_payment',
      required: true,
    },
    coverImages: [String],
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'cancelled'],
          default: 'pending',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reviews: [ReviewSchema],
    stats: {
      averageRating: {
        type: Number,
        default: 0
      },
      totalReviews: {
        type: Number,
        default: 0
      }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Méthode pour calculer et mettre à jour les statistiques des avis
EventSchema.methods.updateReviewStats = function() {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.stats.averageRating = Number((totalRating / this.reviews.length).toFixed(1));
    this.stats.totalReviews = this.reviews.length;
  } else {
    this.stats.averageRating = 0;
    this.stats.totalReviews = 0;
  }
};

module.exports = mongoose.model('Event', EventSchema); 