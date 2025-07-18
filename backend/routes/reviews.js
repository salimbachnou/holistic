const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Event = require('../models/Event');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const { isAuthenticated } = require('../middleware/auth');
const professionalAuth = require('../middleware/professionalAuth');

// Créer un nouvel avis
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { contentType, contentId, rating, comment, orderId, tags } = req.body;

    console.log('Creating review:', {
      userId: req.user._id,
      userRole: req.user.role,
      contentType,
      contentId,
      rating,
      orderId,
      tags
    });

    // Vérifier que l'utilisateur est bien un client
    if (req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        message: 'Seuls les clients peuvent laisser des avis' 
      });
    }

    // Validation des données requises
    if (!contentType || !contentId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes: contentType, contentId, rating et comment sont requis'
      });
    }

    // Vérifier que le contenu existe et récupérer les informations
    let content;
    let professionalId;
    let contentTitle;

    switch (contentType) {
      case 'product':
        content = await Product.findById(contentId);
        if (!content) {
          console.error('Product not found:', contentId);
          return res.status(404).json({ 
            success: false,
            message: 'Produit non trouvé' 
          });
        }
        professionalId = content.professionalId;
        contentTitle = content.title;
        break;

      case 'event':
        content = await Event.findById(contentId);
        if (!content) {
          console.error('Event not found:', contentId);
          return res.status(404).json({ 
            success: false,
            message: 'Événement non trouvé' 
          });
        }
        professionalId = content.professionalId;
        contentTitle = content.title;
        break;

      case 'session':
        content = await Session.findById(contentId);
        if (!content) {
          console.error('Session not found:', contentId);
          return res.status(404).json({ 
            success: false,
            message: 'Session non trouvée' 
          });
        }
        professionalId = content.professionalId;
        contentTitle = content.title || `Session du ${new Date(content.startTime).toLocaleDateString('fr-FR')}`;
        break;

      default:
        return res.status(400).json({ 
          success: false,
          message: 'Type de contenu invalide' 
        });
    }

    console.log('Content found:', {
      contentType,
      contentId,
      professionalId,
      contentTitle
    });

    // Si un orderId est fourni, vérifier que la commande existe et appartient à l'utilisateur
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ 
          success: false,
          message: 'Commande non trouvée' 
        });
      }
      if (order.clientId.toString() !== req.user._id.toString()) {
        console.error('Order does not belong to user:', {
          orderId,
          orderClientId: order.clientId.toString(),
          userId: req.user._id.toString()
        });
        return res.status(403).json({ 
          success: false,
          message: 'Cette commande ne vous appartient pas' 
        });
      }
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce contenu
    const existingReview = await Review.findOne({
      clientId: req.user._id,
      contentId: contentId,
      contentType: contentType
    });

    if (existingReview) {
      console.log('User already reviewed this content:', {
        userId: req.user._id,
        contentId,
        existingReviewId: existingReview._id
      });
      return res.status(400).json({ 
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce contenu' 
      });
    }

    // Créer le nouvel avis
    const review = new Review({
      clientId: req.user._id,
      professionalId: professionalId,
      contentType: contentType,
      contentId: contentId,
      contentTitle: contentTitle,
      rating: rating,
      comment: comment,
      orderId: orderId,
      tags: tags || [],
      status: 'approved' // Auto-approuver pour l'instant
    });

    console.log('Review object created:', review);

    await review.save();
    console.log('Review saved successfully:', review._id);

    // Peupler les références pour la réponse
    await review.populate('clientId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Avis créé avec succès',
      review: review
    });

  } catch (error) {
    console.error('Erreur détaillée lors de la création de l\'avis:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?._id
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la création de la note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les avis d'un produit
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({
      contentId: productId,
      contentType: 'product',
      status: 'approved'
    })
    .populate('clientId', 'firstName lastName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des avis' 
    });
  }
});

// Récupérer les avis pour un professionnel (avec authentification)
router.get('/professional', isAuthenticated, professionalAuth, async (req, res) => {
  try {
    const { contentType, status, page = 1, limit = 10 } = req.query;
    
    let allReviews = [];
    
    // Si on filtre par contentType 'event' ou qu'on veut tous les types
    if (!contentType || contentType === 'event') {
      // Récupérer les avis d'événements depuis le modèle Event
      const events = await Event.find({
        professional: req.professional.userId, // Les événements utilisent userId du professionnel
        'reviews.0': { $exists: true } // Qui ont au moins un avis
      }).populate('reviews.user', 'firstName lastName email');

      // Transformer les avis d'événements pour correspondre au format attendu
      for (const event of events) {
        for (const review of event.reviews) {
          if (review.user) {
            allReviews.push({
              _id: review._id,
              clientId: review.user,
              professionalId: req.professional._id,
              contentType: 'event',
              contentId: event._id,
              contentTitle: event.title,
              rating: review.rating,
              comment: review.comment || '',
              status: 'approved', // Les avis d'événements sont auto-approuvés
              createdAt: review.createdAt,
              tags: [],
              professionalResponse: null,
              respondedAt: null
            });
          }
        }
      }
    }

    // Si on filtre par contentType différent de 'event' ou qu'on veut tous les types
    if (!contentType || contentType !== 'event') {
      // Construire le filtre pour les avis du modèle Review
      const filter = {
        professionalId: req.professional._id
      };

      if (contentType && contentType !== 'event') {
        filter.contentType = contentType;
      }

      if (status) {
        filter.status = status;
      }

      // Récupérer les avis du modèle Review
      const reviewsFromModel = await Review.find(filter)
        .populate('clientId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      allReviews = allReviews.concat(reviewsFromModel);
    }

    // Filtrer par statut si spécifié (pour les avis d'événements)
    if (status) {
      allReviews = allReviews.filter(review => review.status === status);
    }

    // Trier tous les avis par date de création (plus récent d'abord)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Appliquer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = allReviews.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      reviews: paginatedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allReviews.length,
        pages: Math.ceil(allReviews.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des avis' 
    });
  }
});

// Mettre à jour le statut d'un avis
router.put('/:reviewId/status', isAuthenticated, professionalAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Statut invalide' 
      });
    }

    const review = await Review.findOne({
      _id: reviewId,
      professionalId: req.professional._id
    });

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Avis non trouvé' 
      });
    }

    review.status = status;
    await review.save();

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      review: review
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour du statut' 
    });
  }
});

// Répondre à un avis
router.put('/:reviewId/response', isAuthenticated, professionalAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || response.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'La réponse ne peut pas être vide' 
      });
    }

    const review = await Review.findOne({
      _id: reviewId,
      professionalId: req.professional._id
    });

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Avis non trouvé' 
      });
    }

    review.professionalResponse = response.trim();
    review.respondedAt = new Date();
    await review.save();

    res.json({
      success: true,
      message: 'Réponse envoyée avec succès',
      review: review
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la réponse:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'envoi de la réponse' 
    });
  }
});

// Récupérer les statistiques des avis d'un professionnel
router.get('/professional/stats', isAuthenticated, professionalAuth, async (req, res) => {
  try {
    // Récupérer les avis du modèle Review
    const reviewStats = await Review.aggregate([
      { $match: { professionalId: req.professional._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Récupérer les avis d'événements depuis le modèle Event
    const events = await Event.find({
      professional: req.professional.userId,
      'reviews.0': { $exists: true }
    });

    // Extraire tous les ratings des avis d'événements
    let eventRatings = [];
    for (const event of events) {
      for (const review of event.reviews) {
        eventRatings.push(review.rating);
      }
    }

    // Combiner les statistiques
    let allRatings = [];
    let totalReviews = 0;

    // Ajouter les ratings du modèle Review
    if (reviewStats.length > 0) {
      allRatings = allRatings.concat(reviewStats[0].ratings);
      totalReviews += reviewStats[0].totalReviews;
    }

    // Ajouter les ratings des événements
    allRatings = allRatings.concat(eventRatings);
    totalReviews += eventRatings.length;

    if (totalReviews === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      });
    }

    // Calculer la moyenne générale
    const averageRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;

    // Calculer la distribution des notes
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach(rating => {
      distribution[rating]++;
    });

    res.json({
      totalReviews: totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      distribution: distribution
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// Create a session review
router.post('/session', isAuthenticated, async (req, res) => {
  try {
    const { sessionId, rating, comment, wouldRecommend, aspects } = req.body;

    // Validate input
    if (!sessionId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and valid rating (1-5) are required'
      });
    }

    // Check if session exists and user participated
    const Booking = require('../models/Booking');
    
    const session = await Session.findById(sessionId).populate('professionalId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user has a confirmed booking for this session
    const booking = await Booking.findOne({
      'service.sessionId': sessionId,
      client: req.user._id,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You must have participated in this session to leave a review'
      });
    }

    // Check if user already reviewed this session
    const existingReview = await Review.findOne({
      clientId: req.user._id,
      contentId: sessionId,
      contentType: 'session'
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this session'
      });
    }

    // Create review
    const review = new Review({
      clientId: req.user._id,
      professionalId: session.professionalId._id,
      contentId: sessionId,
      contentType: 'session',
      contentTitle: session.title,
      rating,
      comment: comment || '',
      wouldRecommend: wouldRecommend !== false,
      aspects: aspects || {},
      status: 'approved', // Auto-approve since we verified the booking
      tags: []
    });

    await review.save();

    // Update session average rating
    await updateSessionAverageRating(sessionId);

    // Notify professional
    const NotificationService = require('../services/notificationService');
    await NotificationService.notifyProfessionalNewReview(review, session);

    res.json({
      success: true,
      message: 'Review created successfully',
      review
    });

  } catch (error) {
    console.error('Error creating session review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's review for a specific session
router.get('/session/:sessionId/user', isAuthenticated, async (req, res) => {
  try {
    const review = await Review.findOne({
      clientId: req.user._id,
      contentId: req.params.sessionId,
      contentType: 'session'
    }).populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('Error fetching user session review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get reviews for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate sessionId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    // Find reviews for the session
    const reviews = await Review.find({
      contentId: sessionId,
      contentType: 'session',
      status: 'approved'
    })
    .populate('clientId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance

    // Count total reviews
    const total = await Review.countDocuments({
      contentId: sessionId,
      contentType: 'session',
      status: 'approved'
    });

    // Calculate average rating using the corrected syntax
    const avgRatingResult = await Review.aggregate([
      { 
        $match: { 
          contentId: new mongoose.Types.ObjectId(sessionId), 
          contentType: 'session', 
          status: 'approved' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const averageRating = avgRatingResult[0]?.avgRating || 0;
    const totalReviews = avgRatingResult[0]?.count || 0;

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews
    });

  } catch (error) {
    console.error('Error fetching session reviews:', error);
    
    // More detailed error logging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des avis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Get reviews for a session (professional access only)
router.get('/session/:sessionId/professional', isAuthenticated, professionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate sessionId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    // Verify that the session belongs to the authenticated professional
    const session = await Session.findOne({
      _id: sessionId,
      professionalId: req.professional._id
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to reviews for this session'
      });
    }

    // Find all reviews for the session (including pending ones for professional view)
    const reviews = await Review.find({
      contentId: sessionId,
      contentType: 'session'
    })
    .populate('clientId', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Count total reviews
    const total = await Review.countDocuments({
      contentId: sessionId,
      contentType: 'session'
    });

    // Calculate average rating for approved reviews only
    const avgRatingResult = await Review.aggregate([
      { 
        $match: { 
          contentId: new mongoose.Types.ObjectId(sessionId), 
          contentType: 'session', 
          status: 'approved' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const averageRating = avgRatingResult[0]?.avgRating || 0;
    const approvedReviews = avgRatingResult[0]?.count || 0;

    // Count reviews by status
    const statusCounts = await Review.aggregate([
      { 
        $match: { 
          contentId: new mongoose.Types.ObjectId(sessionId), 
          contentType: 'session' 
        } 
      },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      averageRating: Math.round(averageRating * 10) / 10,
      approvedReviews,
      statusStats: {
        approved: statusStats.approved || 0,
        pending: statusStats.pending || 0,
        rejected: statusStats.rejected || 0
      },
      session: {
        id: session._id,
        title: session.title,
        startTime: session.startTime
      }
    });

  } catch (error) {
    console.error('Error fetching professional session reviews:', error);
    
    // Detailed error logging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sessionId: req.params.sessionId,
      professionalId: req.professional._id
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des avis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// Update a session review
router.put('/:reviewId', isAuthenticated, async (req, res) => {
  try {
    const { rating, comment, wouldRecommend, aspects } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating (1-5) is required'
      });
    }

    const review = await Review.findOne({
      _id: req.params.reviewId,
      clientId: req.user._id,
      contentType: 'session'
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    // Update review
    review.rating = rating;
    review.comment = comment || '';
    review.wouldRecommend = wouldRecommend !== false;
    review.aspects = aspects || {};
    review.updatedAt = new Date();

    await review.save();

    // Update session average rating
    await updateSessionAverageRating(review.contentId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });

  } catch (error) {
    console.error('Error updating session review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to update session average rating
async function updateSessionAverageRating(sessionId) {
  try {
    const mongoose = require('mongoose');
    
    // Validate sessionId format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error('Invalid session ID format:', sessionId);
      return;
    }
    
    const avgRating = await Review.aggregate([
      { $match: { contentId: new mongoose.Types.ObjectId(sessionId), contentType: 'session', status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const rating = avgRating[0]?.avgRating || 0;
    const reviewCount = avgRating[0]?.count || 0;

    await Session.findByIdAndUpdate(sessionId, {
      averageRating: Math.round(rating * 10) / 10, // Round to 1 decimal
      reviewCount: reviewCount
    });

    console.log(`Updated session ${sessionId} average rating: ${rating}, count: ${reviewCount}`);

  } catch (error) {
    console.error('Error updating session average rating:', error);
    console.error('Session ID:', sessionId);
    console.error('Error details:', error.message);
  }
}

module.exports = router;
