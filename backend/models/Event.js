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
    category: {
      type: String,
      enum: [
        'yoga', 'meditation', 'aromatherapy', 'nutrition', 'massage', 'naturopathy',
        'psychology', 'coaching', 'workshop', 'retreat', 'fitness', 'dance', 'pilates',
        'mindfulness', 'acupuncture', 'homeopathy', 'physiotherapy', 'osteopathy',
        'art_therapy', 'music_therapy', 'hypnotherapy', 'reflexology', 'reiki',
        'ayurveda', 'chinese_medicine', 'herbal_medicine', 'sound_therapy',
        'energy_healing', 'other'
      ],
      default: 'other'
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      trim: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    images: [{
      url: String
    }],
    address: {
      type: String,
    },
    locationCoordinates: {
      lat: Number,
      lng: Number,
    },
    eventType: {
      type: String,
      enum: ['in_person', 'online'],
      default: 'in_person',
      required: true,
    },
    onlineLink: {
      type: String,
      required: function() {
        return this.eventType === 'online';
      },
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
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },
        note: {
          type: String,
          trim: true
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