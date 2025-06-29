const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Additional fields for better functionality
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'booking_request', 'booking_response', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio', 'video']
    },
    url: String,
    filename: String,
    size: Number, // in bytes
    mimetype: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  originalText: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  // For booking-related messages
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  // For conversation management
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  // For message status
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // For system messages
  systemMessageType: {
    type: String,
    enum: ['booking_confirmed', 'booking_cancelled', 'payment_received', 'session_reminder', 'welcome']
  },
  // Champs pour le traitement des commandes
  orderProcessed: {
    type: Boolean,
    default: false
  },
  orderRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Generate conversation ID before saving
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    // Create a consistent conversation ID regardless of sender/receiver order
    const sortedIds = [this.senderId.toString(), this.receiverId.toString()].sort();
    this.conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
  }
  next();
});

// Update read status
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Edit message
messageSchema.methods.editMessage = function(newText) {
  this.originalText = this.text;
  this.text = newText;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Index for conversation queries
messageSchema.index({ conversationId: 1, timestamp: -1 });

// Index for sender queries
messageSchema.index({ senderId: 1, timestamp: -1 });

// Index for receiver queries
messageSchema.index({ receiverId: 1, timestamp: -1 });

// Index for unread messages
messageSchema.index({ receiverId: 1, isRead: 1, timestamp: -1 });

// Index for booking-related messages
messageSchema.index({ bookingId: 1 });
messageSchema.index({ sessionId: 1 });

// Compound index for conversation participants
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  const conversationId = `${ids[0]}_${ids[1]}`;
  
  return this.find({
    conversationId: conversationId,
    isDeleted: false
  })
  .populate('senderId', 'name firstName lastName profileImage')
  .populate('receiverId', 'name firstName lastName profileImage')
  .sort({ timestamp: 1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get unread count for user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to get conversations list for user
messageSchema.statics.getConversationsList = async function(userId, limit = 20) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.timestamp': -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.senderId',
        foreignField: '_id',
        as: 'sender'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.receiverId',
        foreignField: '_id',
        as: 'receiver'
      }
    }
  ]);

  return conversations;
};

// Virtual for time since message
messageSchema.virtual('timeAgo').get(function() {
  const diffTime = Math.abs(new Date() - this.timestamp);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema); 