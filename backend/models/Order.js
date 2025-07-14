const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'MAD'
      }
    },
    size: String,
    options: Object
  }],
  totalAmount: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'MAD'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'cash_on_delivery', 'bank_transfer', 'other'],
    required: true
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'Morocco' },
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'Morocco' },
    phone: String
  },
  tracking: {
    number: String,
    carrier: String,
    url: String
  },
  notes: {
    client: String,
    admin: String,
    internal: String
  },
  timeline: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      required: true
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Pre-save hook to add timeline entry
orderSchema.pre('save', function(next) {
  // If this is a new order, add the initial status to the timeline
  if (this.isNew) {
    this.timeline = [{
      status: this.status,
      note: 'Order created',
      timestamp: new Date()
    }];
  }
  
  // If status changed, update the corresponding timestamp
  if (this.isModified('status')) {
    const status = this.status;
    
    if (status === 'shipped' && !this.shippedAt) {
      this.shippedAt = new Date();
    } else if (status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    } else if (status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = new Date();
    } else if (status === 'refunded' && !this.refundedAt) {
      this.refundedAt = new Date();
    }
  }
  
  next();
});

// Indexes
orderSchema.index({ clientId: 1, createdAt: -1 });
orderSchema.index({ 'items.professional': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema); 