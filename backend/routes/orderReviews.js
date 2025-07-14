const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { isAuthenticated } = require('../middleware/auth');

// Récupérer les avis existants pour les produits d'une commande
router.get('/products-for-order/:orderId', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Récupérer la commande
    const order = await Order.findById(orderId)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier que la commande appartient à l'utilisateur
    if (order.clientId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Accès non autorisé à cette commande' 
      });
    }

    // Extraire tous les IDs de produits de la commande
    const productIds = order.items
      .map(item => item.product?._id || item.product)
      .filter(id => id);

    // Récupérer tous les avis de l'utilisateur pour ces produits
    const userReviews = await Review.find({
      clientId: userId,
      contentType: 'product',
      contentId: { $in: productIds }
    });

    // Créer une map des avis existants
    const existingReviews = {};
    let reviewedInThisOrderCount = 0;
    let reviewedInOtherOrdersCount = 0;

    userReviews.forEach(review => {
      const productId = review.contentId.toString();
      const isForThisOrder = review.orderId && review.orderId.toString() === orderId;
      
      existingReviews[productId] = {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        tags: review.tags,
        createdAt: review.createdAt,
        forThisOrder: isForThisOrder,
        orderId: review.orderId
      };

      if (isForThisOrder) {
        reviewedInThisOrderCount++;
      } else {
        reviewedInOtherOrdersCount++;
      }

      // Ajouter un message personnalisé pour les avis d'autres commandes
      if (!isForThisOrder && review.orderId) {
        existingReviews[productId].message = `Déjà évalué dans la commande #${review.orderId.toString().slice(-6)}`;
      } else if (!isForThisOrder) {
        existingReviews[productId].message = 'Déjà évalué individuellement';
      }
    });

    // Calculer les statistiques
    const totalProductsCount = productIds.length;
    const totalReviewedCount = Object.keys(existingReviews).length;
    const reviewableProductsCount = totalProductsCount - reviewedInOtherOrdersCount;
    const allProductsReviewed = totalReviewedCount === totalProductsCount;

    res.json({
      success: true,
      existingReviews: existingReviews,
      stats: {
        reviewableProductsCount,
        totalProductsCount,
        reviewedInThisOrderCount,
        reviewedInOtherOrdersCount,
        allProductsReviewed
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des avis existants:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des avis existants' 
    });
  }
});

module.exports = router;
