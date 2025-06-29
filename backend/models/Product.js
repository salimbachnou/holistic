const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    maxlength: 2000
  },
  images: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  composition: {
    type: String,
    maxlength: 1000
  },
  sizeInventory: [{
    size: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  sizeOptions: [{
    type: String
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  // Additional fields from previous structure
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'supplements', 'equipment', 'books', 'accessories', 'skincare', 'aromatherapy', 'other'
    ]
  },
  currency: {
    type: String,
    default: 'MAD'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  specifications: [{
    name: String,
    value: String
  }],
  tags: [String],
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Shipping and delivery info
  shippingInfo: {
    weight: Number, // in grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  },
  // Inventory management
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Auto-generate title from name if not provided
productSchema.pre('save', function(next) {
  if (!this.title && this.name) {
    this.title = this.name;
  }
  if (!this.name && this.title) {
    this.name = this.title;
  }
  
  // Synchroniser sizeOptions avec sizeInventory
  if (this.sizeInventory && this.sizeInventory.length > 0) {
    this.sizeOptions = this.sizeInventory.map(item => item.size);
  }
  
  // Calculer le stock total à partir des stocks par taille
  if (this.sizeInventory && this.sizeInventory.length > 0) {
    this.stock = this.sizeInventory.reduce((total, item) => total + item.stock, 0);
  }
  
  next();
});

// Méthode pour obtenir le stock d'une taille spécifique
productSchema.methods.getStockForSize = function(size) {
  if (!this.sizeInventory || this.sizeInventory.length === 0) {
    return this.stock; // Retourne le stock global si pas de gestion par taille
  }
  
  const sizeItem = this.sizeInventory.find(item => 
    item.size.toLowerCase() === size.toLowerCase()
  );
  return sizeItem ? sizeItem.stock : 0;
};

// Virtual pour vérifier si une taille est disponible
productSchema.methods.isSizeAvailable = function(size) {
  // Utiliser la méthode getStockForSize qui est maintenant insensible à la casse
  return this.getStockForSize(size) > 0;
};

// Virtual for isApproved (for admin page compatibility)
productSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

productSchema.virtual('isApproved').set(function(value) {
  this.status = value ? 'approved' : 'pending';
});

// Virtual for low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Virtual for out of stock
productSchema.virtual('isOutOfStock').get(function() {
  return this.stock === 0;
});

// Indexes for efficient searching
productSchema.index({ category: 1, status: 1 });
productSchema.index({ professionalId: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ sku: 1 });

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema); 