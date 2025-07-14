const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Client qui a laissé la note
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  
  // Type de contenu noté (produit, événement, session)
  contentType: {
    type: String,
    enum: ['product', 'event', 'session'],
    required: true,
    index: true
  },
  
  // ID du contenu noté (produit, événement ou session)
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Titre du contenu noté (pour référence)
  contentTitle: {
    type: String,
    required: true
  },
  
  // Note (1-5 étoiles)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  
  // Commentaire
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Commande associée (optionnel)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Statut de la note (approuvé, en attente, rejeté)
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
  
  // Tags pour catégoriser la note
  tags: [{
    type: String,
    enum: ['qualité', 'service', 'livraison', 'prix', 'communication', 'ponctualité', 'expertise', 'ambiance']
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
reviewSchema.index({ clientId: 1, contentType: 1, createdAt: -1 });
reviewSchema.index({ professionalId: 1, contentType: 1, status: 1 });
reviewSchema.index({ contentId: 1, contentType: 1 });
reviewSchema.index({ rating: 1, status: 1 });

// Index unique pour empêcher les doublons d'avis
// Un client ne peut laisser qu'un seul avis par contenu
reviewSchema.index(
  { clientId: 1, contentId: 1, contentType: 1 }, 
  { unique: true }
);

// Méthodes statiques
reviewSchema.statics.getAverageRating = function(contentId, contentType) {
  return this.aggregate([
    { $match: { contentId: contentId, contentType: contentType, status: 'approved' } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
};

reviewSchema.statics.getReviewsByProfessional = function(professionalId, options = {}) {
  const match = { professionalId: professionalId };
  
  if (options.status) {
    match.status = options.status;
  }
  
  if (options.contentType) {
    match.contentType = options.contentType;
  }
  
  return this.find(match)
    .populate('clientId', 'firstName lastName email')
    .populate('contentId', 'title name')
    .sort({ createdAt: -1 });
};

// Méthodes d'instance
reviewSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    rating: this.rating,
    comment: this.comment,
    contentType: this.contentType,
    contentTitle: this.contentTitle,
    createdAt: this.createdAt,
    tags: this.tags,
    images: this.images,
    professionalResponse: this.professionalResponse,
    respondedAt: this.respondedAt,
    client: {
      firstName: this.clientId.firstName,
      lastName: this.clientId.lastName
    }
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 