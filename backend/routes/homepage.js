const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const Product = require('../models/Product');
const Event = require('../models/Event');
const User = require('../models/User');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Review = require('../models/Review');

// @route   GET /api/homepage/featured-professionals
// @desc    Get featured professionals for homepage
// @access  Public
router.get('/featured-professionals', async (req, res) => {
  try {
    const professionals = await Professional.find({
      isActive: true,
      isVerified: true,
      featured: true
    })
    .populate('userId', 'firstName lastName email profileImage')
    .limit(4)
    .sort({ 'rating.average': -1, createdAt: -1 });

    // If no featured professionals, get top-rated ones
    if (professionals.length === 0) {
      const topProfessionals = await Professional.find({
        isActive: true,
        isVerified: true
      })
      .populate('userId', 'firstName lastName email profileImage')
      .limit(4)
      .sort({ 'rating.average': -1, createdAt: -1 });

      return res.json({
        success: true,
        professionals: topProfessionals.map(prof => ({
          id: prof._id,
          name: prof.businessName,
          description: prof.description || `Expert en ${prof.businessType}`,
          image: prof.profilePhoto || prof.userId?.profileImage || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
          rating: prof.rating?.average || 0,
          businessType: prof.businessType,
          location: prof.businessAddress?.city || prof.address
        }))
      });
    }

    res.json({
      success: true,
      professionals: professionals.map(prof => ({
        id: prof._id,
        name: prof.businessName,
        description: prof.description || `Expert en ${prof.businessType}`,
        image: prof.profilePhoto || prof.userId?.profileImage || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        rating: prof.rating?.average || 0,
        businessType: prof.businessType,
        location: prof.businessAddress?.city || prof.address
      }))
    });
  } catch (error) {
    console.error('Error fetching featured professionals:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des professionnels'
    });
  }
});

// @route   GET /api/homepage/featured-products
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured-products', async (req, res) => {
  try {
    const products = await Product.find({
      status: 'approved',
      isActive: true,
      featured: true
    })
    .populate('professionalId', 'businessName location')
    .limit(3)
    .sort({ 'rating.average': -1, createdAt: -1 });

    // If no featured products, get top-rated ones
    if (products.length === 0) {
      const topProducts = await Product.find({
        status: 'approved',
        isActive: true
      })
      .populate('professionalId', 'businessName location')
      .limit(3)
      .sort({ 'rating.average': -1, createdAt: -1 });

      return res.json({
        success: true,
        products: topProducts.map(product => ({
          id: product._id,
          name: product.name || product.title,
          description: product.description.substring(0, 100) + '...',
          image: product.images?.[0] || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
          price: product.price,
          currency: product.currency || 'MAD',
          rating: product.rating?.average || 0,
          category: product.category,
          professional: product.professionalId?.businessName
        }))
      });
    }

    res.json({
      success: true,
      products: products.map(product => ({
        id: product._id,
        name: product.name || product.title,
        description: product.description.substring(0, 100) + '...',
        image: product.images?.[0] || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        price: product.price,
        currency: product.currency || 'MAD',
        rating: product.rating?.average || 0,
        category: product.category,
        professional: product.professionalId?.businessName
      }))
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

// @route   GET /api/homepage/upcoming-events
// @desc    Get upcoming events for homepage
// @access  Public
router.get('/upcoming-events', async (req, res) => {
  try {
    const events = await Event.find({
      status: 'approved',
      date: { $gte: new Date() }
    })
    .populate('professional', 'firstName lastName businessName')
    .limit(3)
    .sort({ date: 1 });

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        name: event.title,
        date: event.date,
        location: event.address,
        image: event.coverImages?.[0] || 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        price: event.price,
        currency: event.currency || 'MAD',
        professional: event.professional?.businessName || `${event.professional?.firstName} ${event.professional?.lastName}`,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.participants?.filter(p => p.status === 'confirmed').length || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// @route   GET /api/homepage/testimonials
// @desc    Get testimonials for homepage
// @access  Public
router.get('/testimonials', async (req, res) => {
  try {
    // Get approved reviews with high ratings
    const reviews = await Review.find({
      status: 'approved',
      rating: { $gte: 4 }
    })
    .populate('clientId', 'firstName lastName')
    .populate('professionalId', 'businessName businessAddress')
    .limit(3)
    .sort({ createdAt: -1 });

    const testimonials = reviews.map(review => ({
      id: review._id,
      text: review.comment,
      author: `${review.clientId?.firstName} ${review.clientId?.lastName?.charAt(0)}.`,
      location: review.professionalId?.businessAddress?.city || 'Maroc',
      rating: review.rating,
      service: review.contentTitle || review.professionalId?.businessName
    }));

    // If no reviews, return default testimonials
    if (testimonials.length === 0) {
      const defaultTestimonials = [
        {
          id: 1,
          text: "Holistic.ma m'a permis de trouver une coach de yoga exceptionnelle qui m'a aidée à surmonter mon stress. L'accompagnement personnalisé fait toute la différence !",
          author: 'Salma K.',
          location: 'Casablanca',
          rating: 5,
        },
        {
          id: 2,
          text: "J'ai découvert des produits naturels de qualité grâce à la marketplace. La livraison a été rapide et les produits sont conformes à la description.",
          author: 'Ahmed M.',
          location: 'Rabat',
          rating: 4,
        },
        {
          id: 3,
          text: "Les ateliers de méditation auxquels j'ai participé via Holistic.ma ont transformé ma routine quotidienne. Une communauté bienveillante et des professionnels à l'écoute.",
          author: 'Leila B.',
          location: 'Marrakech',
          rating: 5,
        }
      ];

      return res.json({
        success: true,
        testimonials: defaultTestimonials
      });
    }

    res.json({
      success: true,
      testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des témoignages'
    });
  }
});

// @route   GET /api/homepage/stats
// @desc    Get platform statistics for homepage
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProfessionals,
      totalUsers,
      totalSessions,
      totalEvents,
      totalProducts,
      totalOrders,
      avgRating
    ] = await Promise.all([
      Professional.countDocuments({ isActive: true, isVerified: true }),
      User.countDocuments({ role: 'client' }),
      Session.countDocuments({ status: 'completed' }),
      Event.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'approved', isActive: true }),
      Order.countDocuments({ status: 'completed' }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    // Get unique cities from professionals
    const cities = await Professional.distinct('businessAddress.city', {
      isActive: true,
      isVerified: true,
      'businessAddress.city': { $ne: null, $ne: '' }
    });

    const stats = {
      professionals: totalProfessionals || 500,
      cities: cities.length || 15,
      clients: totalUsers || 1000,
      sessions: totalSessions || 2500,
      events: totalEvents || 150,
      products: totalProducts || 300,
      orders: totalOrders || 800,
      satisfaction: avgRating[0]?.avgRating ? Math.round(avgRating[0].avgRating * 10) / 10 : 4.8
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   POST /api/homepage/newsletter
// @desc    Subscribe to newsletter
// @access  Public
router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Update preferences to include newsletter
      existingUser.preferences.notifications.email = true;
      await existingUser.save();
      
      return res.json({
        success: true,
        message: 'Vous êtes déjà inscrit à notre newsletter !'
      });
    }

    // Create a new user record for newsletter subscription
    const newsletterUser = new User({
      email: email.toLowerCase(),
      firstName: 'Abonné',
      lastName: 'Newsletter',
      name: 'Abonné Newsletter',
      password: 'temp_newsletter_password',
      role: 'client',
      preferences: {
        notifications: {
          email: true,
          push: false
        }
      }
    });

    await newsletterUser.save();

    res.json({
      success: true,
      message: 'Inscription réussie ! Vous recevrez bientôt nos conseils bien-être.'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà inscrit'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

module.exports = router; 