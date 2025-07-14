const mongoose = require('mongoose');

const orderReviewSchema = new mongoose.Schema({
  // Client qui a laissé l'avis
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Commande concernée
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // Professionnel concerné
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true,
    index: true
  },
  
  // Note globale de la commande (1-5 étoiles)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  
  // Commentaire principal
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Avis détaillés par produit
  productReviews: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productTitle: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    tags: [{
      type: String,
      enum: ['qualité', 'service', 'livraison', 'prix', 'communication', 'ponctualité', 'expertise', 'ambiance']
    }]
  }],
  
  // Tags pour catégoriser l'avis global
  tags: [{
    type: String,
    enum: ['qualité', 'service', 'livraison', 'prix', 'communication', 'ponctualité', 'expertise', 'ambiance']
  }],
  
  // Statut de l'avis (approuvé, en attente, rejeté)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Réponse du professionnel (optionnel)
  professionalResponse: {
    type: String,
    maxlength: 1000
  },
  
  // Date de réponse du professionnel
  respondedAt: {
    type: Date
  },
  
  // Images associées (optionnel)
  images: [{
    type: String
  }],
  
  // Données supplémentaires
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes pour optimiser les requêtes
orderReviewSchema.index({ clientId: 1, orderId: 1 }, { unique: true }); // Un seul avis par client par commande
orderReviewSchema.index({ professionalId: 1, status: 1 });
orderReviewSchema.index({ orderId: 1 });
orderReviewSchema.index({ rating: 1, status: 1 });

// Méthodes statiques
orderReviewSchema.statics.getByOrder = function(orderId) {
  return this.findOne({ orderId: orderId })
    .populate('clientId', 'firstName lastName email')
    .populate('professionalId', 'businessName name')
    .populate('orderId', 'orderNumber totalAmount');
};

orderReviewSchema.statics.getByProfessional = function(professionalId, options = {}) {
  const match = { professionalId: professionalId };
  
  if (options.status) {
    match.status = options.status;
  }
  
  return this.find(match)
    .populate('clientId', 'firstName lastName email')
    .populate('orderId', 'orderNumber totalAmount')
    .sort({ createdAt: -1 });
};

// Méthodes d'instance
orderReviewSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    rating: this.rating,
    comment: this.comment,
    productReviews: this.productReviews,
    tags: this.tags,
    createdAt: this.createdAt,
    professionalResponse: this.professionalResponse,
    respondedAt: this.respondedAt,
    client: {
      firstName: this.clientId?.firstName,
      lastName: this.clientId?.lastName
    }
  };
};

const OrderReview = mongoose.model('OrderReview', orderReviewSchema);

module.exports = OrderReview; 