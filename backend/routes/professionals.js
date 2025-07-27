const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Event = require('../models/Event');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { isAuthenticated, isProfessional } = require('../middleware/auth');

// Middleware to check if user is a professional
const requireProfessional = async (req, res, next) => {
  try {
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Professional role required.'
      });
    }
    
    // Check if professional profile exists, if not create one
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional && req.user.role === 'professional') {
      // Create a default professional profile
      const newProfessional = new Professional({
        userId: req.user._id,
        businessName: `${req.user.firstName} ${req.user.lastName}`,
        businessType: 'other', // Default business type
        title: `${req.user.firstName} ${req.user.lastName}`,
        description: '',
        address: "À définir",
        contactInfo: { 
          email: req.user.email,
          phone: '0000000000' // Valeur par défaut pour éviter l'erreur de validation
        },
        isVerified: true,
        isActive: true
      });
      
      try {
        await newProfessional.save();
        console.log('Created professional profile for user:', req.user._id);
      } catch (err) {
        console.error('Error creating professional profile:', err);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in requireProfessional middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Configure storage for profile photos
const profilePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + '-' + uniqueSuffix + ext);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const profilePhotoUpload = multer({ 
  storage: profilePhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET All Professionals (Public route)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      businessType, 
      lat, 
      lng, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query
    const query = { isActive: true, isVerified: true };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'services.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add business type filter if provided
    if (businessType) {
      query.businessType = businessType;
    }
    
    // Location filtering would be handled here with MongoDB's geospatial queries
    // but we'll skip that for now
    
    // Execute query with pagination
    const professionals = await Professional.find(query)
      .populate('userId', 'firstName lastName email profileImage')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Professional.countDocuments(query);
    
    res.json({
      success: true,
      professionals,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===================== PRODUCTS MANAGEMENT =====================

// Get all products for the current professional
router.get('/products', isAuthenticated, isProfessional, async (req, res) => {
  try {
    
    
    // Check if Product model is correctly loaded
    if (!Product || typeof Product.find !== 'function') {
      console.error("Product model is not correctly loaded:", Product);
      return res.status(500).json({
        success: false,
        message: 'Product model not available - please contact administrator'
      });
    }
    
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Find the professional ID for the current user
    
    const professional = await Professional.findOne({ userId: req.user._id });
    
    if (!professional) {
      
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }
    
    

    // Build query
    const query = { professionalId: professional._id };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (page - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    
    
    try {
      const [products, totalProducts] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Product.countDocuments(query)
      ]);
      
      
  
      // Get product stats
      const [pending, approved, rejected, inactive] = await Promise.all([
        Product.countDocuments({ professionalId: professional._id, status: 'pending' }),
        Product.countDocuments({ professionalId: professional._id, status: 'approved' }),
        Product.countDocuments({ professionalId: professional._id, status: 'rejected' }),
        Product.countDocuments({ professionalId: professional._id, status: 'inactive' })
      ]);
  
      res.json({
        success: true,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalProducts,
          pages: Math.ceil(totalProducts / parseInt(limit))
        },
        stats: {
          pending,
          approved,
          rejected,
          inactive,
          total: totalProducts
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching professional products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get product details
router.get('/products/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find the product and ensure it belongs to this professional
    const product = await Product.findOne({
      _id: req.params.id,
      professionalId: professional._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to you'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new product request
router.post('/products', isAuthenticated, isProfessional, [
  body('title').not().isEmpty().withMessage('Title is required'),
  body('name').not().isEmpty().withMessage('Name is required'),
  body('description').not().isEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').not().isEmpty().trim().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive number')
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Create new product
    const product = new Product({
      ...req.body,
      professionalId: professional._id,
      status: 'pending' // All new products start as pending
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product request submitted successfully. It will be reviewed by an administrator.',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update a product request
router.put('/products/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find the product and ensure it belongs to this professional
    const product = await Product.findOne({
      _id: req.params.id,
      professionalId: professional._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to you'
      });
    }

    // If product is already approved, updating it will set status back to pending
    const wasApproved = product.status === 'approved';
    
    // Update product fields
    const updateData = { 
      ...req.body,
      status: wasApproved ? 'pending' : product.status // Set back to pending if it was approved
    };
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: wasApproved ? 
        'Product updated successfully and submitted for review.' : 
        'Product updated successfully.',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete/deactivate a product
router.delete('/products/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find the product and ensure it belongs to this professional
    const product = await Product.findOne({
      _id: req.params.id,
      professionalId: professional._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to you'
      });
    }

    // Instead of hard delete, we'll set the status to inactive
    product.status = 'inactive';
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product removed successfully'
    });
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get orders for a professional's products
router.get('/orders', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find all product IDs for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(p => p._id);

    // Build query for orders containing the professional's products
    const query = {
      $or: [
        { 'items.professional': professional._id },
        { 'items.product': { $in: productIds } }
      ]
    };
    
    if (status) query.status = status;

    const skip = (page - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate('clientId', 'firstName lastName email phone')
        .populate('items.product', 'title name price images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    // Get order stats
    const [pending, shipped, delivered] = await Promise.all([
      Order.countDocuments({ ...query, status: 'pending' }),
      Order.countDocuments({ ...query, status: 'shipped' }),
      Order.countDocuments({ ...query, status: 'delivered' })
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / parseInt(limit))
      },
      stats: {
        pending,
        shipped,
        delivered,
        total: totalOrders
      }
    });
  } catch (error) {
    console.error('Error fetching professional orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get order details
router.get('/orders/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find all product IDs for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(p => p._id);

    // Find the order and ensure it contains products from this professional
    const order = await Order.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('items.product', 'title name price images')
      .populate('items.professional', 'businessName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order contains any of this professional's products
    const hasProducts = order.items.some(item => 
      (item.professional && item.professional.equals(professional._id)) ||
      (item.product && productIds.some(id => id.equals(item.product._id)))
    );

    if (!hasProducts) {
      return res.status(403).json({
        success: false,
        message: 'This order does not contain any of your products'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update order status (only for the professional's items)
router.patch('/orders/:id/status', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    if (!['pending', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find all product IDs for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(p => p._id);

    // Find the order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order contains any of this professional's products
    const hasProducts = order.items.some(item => 
      (item.professional && item.professional.equals(professional._id)) ||
      (item.product && productIds.some(id => id.equals(item.product)))
    );

    if (!hasProducts) {
      return res.status(403).json({
        success: false,
        message: 'This order does not contain any of your products'
      });
    }

    // Add to timeline
    order.timeline.push({
      status,
      note,
      updatedBy: req.user._id
    });

    // Update status if all items are in the same status
    if (order.items.every(item => 
      !item.professional || item.professional.equals(professional._id) ||
      !item.product || productIds.some(id => id.equals(item.product))
    )) {
      order.status = status;
    }

    await order.save();

    await order.populate('clientId', 'firstName lastName email phone');
    await order.populate('items.product', 'title name price images');
    await order.populate('items.professional', 'businessName');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get current professional profile
router.get('/me/profile', isAuthenticated, isProfessional, async (req, res) => {
  try {
    console.log('🔍 Professional Profile Route - User ID:', req.user._id);
    console.log('🔍 Professional Profile Route - User role:', req.user.role);
    
    const professional = await Professional.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email profileImage');

    console.log('🔍 Professional Profile Route - Found professional:', professional ? 'Yes' : 'No');

    if (!professional) {
      console.log('🔍 Professional Profile Route - Profile not found, creating one...');
      
      // Create professional profile if it doesn't exist
      const newProfessional = new Professional({
        userId: req.user._id,
        businessName: `${req.user.firstName} ${req.user.lastName}`,
        businessType: 'other',
        title: `${req.user.firstName} ${req.user.lastName}`,
        description: '',
        address: "À définir",
        contactInfo: { 
          email: req.user.email,
          phone: ''
        },
        isVerified: false,
        isActive: false
      });
      
      await newProfessional.save();
      console.log('🔍 Professional Profile Route - Created new profile for user:', req.user._id);
      
      // Return the newly created profile
      const createdProfessional = await Professional.findOne({ userId: req.user._id })
        .populate('userId', 'firstName lastName email profileImage');
        
      return res.json({
        success: true,
        professional: createdProfessional
      });
    }

    res.json({
      success: true,
      professional
    });

  } catch (error) {
    console.error('Error fetching professional profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get professional statistics
router.get('/me/stats', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const stats = {
      totalServices: professional.services.length,
      activeServices: professional.services.filter(service => service.isActive).length,
      rating: professional.rating,
      isVerified: professional.isVerified,
      subscriptionPlan: professional.subscription.plan,
      profileViews: 0, // Placeholder for future implementation
      totalBookings: 0, // Placeholder for future implementation
      monthlyRevenue: 0 // Placeholder for future implementation
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching professional stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get dashboard statistics
router.get('/dashboard-stats', isAuthenticated, isProfessional, async (req, res) => {
  try {
    // Find the professional profile for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }
    
    // Get current date info for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Get previous month for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const firstDayOfPrevMonth = new Date(prevMonthYear, prevMonth, 1);
    const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0);
    
    // Get sessions count for current month
    const currentMonthSessions = await Session.countDocuments({
      professionalId: professional._id,
      startTime: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    // Get sessions count for previous month
    const prevMonthSessions = await Session.countDocuments({
      professionalId: professional._id,
      startTime: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
    });
    
    // Calculate session trend
    const sessionTrend = prevMonthSessions > 0 
      ? Math.round(((currentMonthSessions - prevMonthSessions) / prevMonthSessions) * 100) 
      : 0;
    
    // Get unique clients who booked sessions this month
    const currentMonthBookings = await Booking.find({
      professional: professional._id,
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    const currentMonthClientIds = [...new Set(currentMonthBookings.map(booking => 
      booking.client ? booking.client.toString() : null
    ).filter(id => id !== null))];
    
    // Get unique clients who booked sessions last month
    const prevMonthBookings = await Booking.find({
      professional: professional._id,
      createdAt: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
    });
    
    const prevMonthClientIds = [...new Set(prevMonthBookings.map(booking => 
      booking.client ? booking.client.toString() : null
    ).filter(id => id !== null))];
    
    // Calculate new clients (clients this month who weren't present last month)
    const newClients = currentMonthClientIds.filter(id => !prevMonthClientIds.includes(id));
    
    // Calculate client trend
    const clientTrend = prevMonthClientIds.length > 0
      ? Math.round(((currentMonthClientIds.length - prevMonthClientIds.length) / prevMonthClientIds.length) * 100)
      : 0;
    
    // Calculate revenue from bookings for current month
    const currentMonthBookingRevenue = currentMonthBookings.reduce((total, booking) => {
      const amount = booking.totalAmount && booking.totalAmount.amount ? booking.totalAmount.amount : 0;
      return total + amount;
    }, 0);
    
    // Calculate revenue from bookings for previous month
    const prevMonthBookingRevenue = prevMonthBookings.reduce((total, booking) => {
      const amount = booking.totalAmount && booking.totalAmount.amount ? booking.totalAmount.amount : 0;
      return total + amount;
    }, 0);
    
    // Calculate revenue from sessions for current month
    const currentMonthSessionRevenue = await Session.aggregate([
      { 
        $match: { 
          professionalId: professional._id,
          startTime: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$price' }
        } 
      }
    ]);
    
    const sessionRevenueCurrent = currentMonthSessionRevenue[0]?.total || 0;
    
    // Calculate revenue from sessions for previous month
    const prevMonthSessionRevenue = await Session.aggregate([
      { 
        $match: { 
          professionalId: professional._id,
          startTime: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$price' }
        } 
      }
    ]);
    
    const sessionRevenuePrev = prevMonthSessionRevenue[0]?.total || 0;
    
    // Total revenue calculation
    const currentMonthRevenue = currentMonthBookingRevenue + sessionRevenueCurrent;
    const prevMonthRevenue = prevMonthBookingRevenue + sessionRevenuePrev;
    
    // Calculate revenue trend
    const revenueTrend = prevMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;
    
    // Get upcoming sessions (next 3 sessions)
    const upcomingSessions = await Session.find({
      professionalId: professional._id,
      startTime: { $gte: now }
    })
    .sort({ startTime: 1 })
    .limit(3)
    .lean();
    
    // Format upcoming sessions
    const formattedUpcomingSessions = upcomingSessions.map(session => {
      const time = new Date(session.startTime).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return {
        id: session._id,
        time,
        date: session.startTime,
        title: session.title,
        participants: session.maxParticipants || 0
      };
    });
    
    // Get recent messages (messages received by the professional)
    const recentMessages = await Message.find({
      receiverId: req.user._id,
      isDeleted: { $ne: true }
    })
    .sort({ timestamp: -1 })
    .limit(3)
    .populate('senderId', 'firstName lastName profileImage')
    .lean();
    
    // Format recent messages
    const formattedRecentMessages = recentMessages.map(message => {
      const timeDiff = Math.floor((now - new Date(message.timestamp)) / (1000 * 60)); // minutes
      let timeDisplay;
      
      if (timeDiff < 60) {
        timeDisplay = `${timeDiff}m`;
      } else if (timeDiff < 1440) {
        timeDisplay = `${Math.floor(timeDiff / 60)}h`;
      } else {
        timeDisplay = `${Math.floor(timeDiff / 1440)}j`;
      }
      
      return {
        id: message._id,
        senderName: message.senderId ? `${message.senderId.firstName} ${message.senderId.lastName}` : 'Utilisateur inconnu',
        content: message.text && message.text.length > 30 ? message.text.substring(0, 30) + '...' : message.text || 'Message sans contenu',
        timeAgo: timeDisplay,
        avatar: message.senderId?.profileImage || null,
        senderId: message.senderId?._id
      };
    });
    
    // Calculate real average rating from all sources using RatingService
    const RatingService = require('../services/ratingService');
    const ratingStats = await RatingService.getDashboardRatingStats(professional._id, req.user._id);

    // Prepare response data
    const dashboardStats = {
      sessions: {
        total: currentMonthSessions,
        trend: sessionTrend >= 0 ? 'up' : 'down',
        trendValue: `${sessionTrend >= 0 ? '+' : ''}${sessionTrend}%`
      },
      clients: {
        total: newClients.length,
        trend: clientTrend >= 0 ? 'up' : 'down',
        trendValue: `${clientTrend >= 0 ? '+' : ''}${clientTrend}%`
      },
      revenue: {
        total: Math.round(currentMonthRevenue).toLocaleString('fr-FR'),
        trend: revenueTrend >= 0 ? 'up' : 'down',
        trendValue: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}%`
      },
      rating: ratingStats,
      upcomingSessions: formattedUpcomingSessions,
      recentMessages: formattedRecentMessages
    };
    
    res.json({
      success: true,
      stats: dashboardStats
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===================== CLIENTS MANAGEMENT =====================

// Get all clients for the current professional
router.get('/clients', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'all',
      type = 'all',
      sortBy = 'lastVisit',
      sortOrder = 'desc'
    } = req.query;

    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find all bookings for this professional
    const bookings = await Booking.find({ professional: professional._id })
      .populate('client', 'firstName lastName email phone profileImage')
      .sort({ appointmentDate: -1 });

    // Find all sessions for this professional
    const sessions = await Session.find({ professionalId: professional._id })
      .populate('participants', 'firstName lastName email phone profileImage')
      .sort({ startTime: -1 });
      
    // Find all events for this professional
    const events = await Event.find({ professional: req.user._id })
      .populate('participants.user', 'firstName lastName email phone profileImage')
      .sort({ date: -1 });
      
    // Find all products for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(product => product._id);
    
    // Find all orders that include this professional's products
    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
    .populate('clientId', 'firstName lastName email phone profileImage')
    .populate('items.product', 'name title price images')
    .sort({ createdAt: -1 });

    // Create a map of clients with their booking/session/order history
    const clientsMap = new Map();

    // Process bookings
    bookings.forEach(booking => {
      const clientId = booking.client._id.toString();
      const client = booking.client;
      
              if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            name: `${client.firstName} ${client.lastName}`,
            email: client.email,
            phone: client.phone || '',
            image: client.profileImage || '',
            lastVisit: booking.appointmentDate,
            totalSessions: 0,
            totalSpent: 0,
            status: booking.status === 'cancelled' || booking.status === 'no_show' ? 'inactive' : 'active',
            tags: ['Client Réservation'],
            notes: booking.clientNotes || '',
            upcomingSessions: [],
            pastSessions: [],
            orders: []
          });
        }

              const clientData = clientsMap.get(clientId);
        
        // Update last visit if this booking is more recent
        if (new Date(booking.appointmentDate) > new Date(clientData.lastVisit)) {
          clientData.lastVisit = booking.appointmentDate;
        }

        // Increment total sessions and spent amount
        if (booking.status === 'completed') {
          clientData.totalSessions += 1;
          clientData.totalSpent += booking.totalAmount ? booking.totalAmount.amount || 0 : 0;
        }

        // Add tag if not already present
        if (!clientData.tags.includes('Client Réservation')) {
          clientData.tags.push('Client Réservation');
        }

      // Add to upcoming or past sessions
      const sessionInfo = {
        id: booking._id,
        type: 'booking',
        date: booking.appointmentDate,
        time: booking.appointmentTime.start,
        service: booking.service.name,
        payment: booking.totalAmount ? booking.totalAmount.amount || 0 : 0,
        status: booking.status,
        location: booking.location
      };

      if (new Date(booking.appointmentDate) > new Date()) {
        clientData.upcomingSessions.push(sessionInfo);
      } else {
        clientData.pastSessions.push(sessionInfo);
      }
    });

    // Process sessions
    sessions.forEach(session => {
      session.participants.forEach(participant => {
        const clientId = participant._id.toString();
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            name: `${participant.firstName} ${participant.lastName}`,
            email: participant.email,
            phone: participant.phone || '',
            image: participant.profileImage || '',
            lastVisit: session.startTime,
            totalSessions: 0,
            totalSpent: 0,
            status: 'active',
            tags: ['Client Session'],
            notes: '',
            upcomingSessions: [],
            pastSessions: [],
            orders: []
          });
        }

        const clientData = clientsMap.get(clientId);
        
        // Update last visit if this session is more recent
        if (new Date(session.startTime) > new Date(clientData.lastVisit)) {
          clientData.lastVisit = session.startTime;
        }

        // Increment total sessions and spent amount
        if (session.status === 'completed') {
          clientData.totalSessions += 1;
          clientData.totalSpent += session.price || 0;
        }

        // Add tag if not already present
        if (!clientData.tags.includes('Client Session')) {
          clientData.tags.push('Client Session');
        }

        // Add to upcoming or past sessions
        const sessionInfo = {
          id: session._id,
          type: 'session',
          date: session.startTime,
          time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          service: session.title,
          payment: session.price || 0,
          status: session.status,
          location: session.isOnline() ? { type: 'online', onlineLink: session.meetingLink } : { type: 'in_person', address: { street: session.location } }
        };

        if (new Date(session.startTime) > new Date()) {
          clientData.upcomingSessions.push(sessionInfo);
        } else {
          clientData.pastSessions.push(sessionInfo);
        }
      });
    });

    // Process events
    events.forEach(event => {
      event.participants.forEach(participant => {
        const clientId = participant.user._id.toString();
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            name: `${participant.user.firstName} ${participant.user.lastName}`,
            email: participant.user.email,
            phone: participant.user.phone || '',
            image: participant.user.profileImage || '',
            lastVisit: event.date,
            totalSessions: 0,
            totalSpent: 0,
            status: participant.status === 'cancelled' ? 'inactive' : 'active',
            tags: ['Client Événement'],
            notes: '',
            upcomingSessions: [],
            pastSessions: [],
            orders: []
          });
        }

        const clientData = clientsMap.get(clientId);
        
        // Update last visit if this event is more recent
        if (new Date(event.date) > new Date(clientData.lastVisit)) {
          clientData.lastVisit = event.date;
        }

        // Increment total sessions and spent amount
        if (participant.status === 'confirmed') {
          clientData.totalSessions += 1;
          clientData.totalSpent += (event.price || 0) * (participant.quantity || 1);
        }

        // Add to upcoming or past sessions
        const sessionInfo = {
          id: event._id,
          type: 'event',
          date: event.date,
          time: event.time || new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          service: event.title,
          payment: (event.price || 0) * (participant.quantity || 1),
          status: participant.status,
          location: event.eventType === 'online' ? { type: 'online', onlineLink: event.onlineLink } : { type: 'in_person', address: { street: event.address } }
        };

        if (new Date(event.date) > new Date()) {
          clientData.upcomingSessions.push(sessionInfo);
        } else {
          clientData.pastSessions.push(sessionInfo);
        }

        // Add tag if not already present
        if (!clientData.tags.includes('Client Événement')) {
          clientData.tags.push('Client Événement');
        }
      });
    });
    
    // Process orders
    orders.forEach(order => {
      if (!order.clientId) return; // Skip orders without client info
      
      const clientId = order.clientId._id.toString();
      const client = order.clientId;
      
      // Filter items to only include products from this professional
      const professionalItems = order.items.filter(item => 
        productIds.some(id => id.toString() === item.product.toString())
      );
      
      if (professionalItems.length === 0) return; // Skip if no items from this professional
      
      // Calculate total spent on this professional's products
      const totalSpentOnProducts = professionalItems.reduce((sum, item) => {
        const itemPrice = item.price && item.price.amount ? item.price.amount : (item.price || 0);
        return sum + (itemPrice * (item.quantity || 1));
      }, 0);
      
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone || '',
          image: client.profileImage || '',
          lastVisit: order.createdAt,
          totalSessions: 0,
          totalSpent: totalSpentOnProducts || 0,
          status: 'active',
          tags: ['Client Boutique'],
          notes: '',
          upcomingSessions: [],
          pastSessions: [],
          orders: []
        });
      } else {
        const clientData = clientsMap.get(clientId);
        
        // Update last visit if this order is more recent
        if (new Date(order.createdAt) > new Date(clientData.lastVisit)) {
          clientData.lastVisit = order.createdAt;
        }
        
        // Add to total spent
        clientData.totalSpent += totalSpentOnProducts || 0;
        
        // Add tag if not already present
        if (!clientData.tags.includes('Client Boutique')) {
          clientData.tags.push('Client Boutique');
        }
      }
      
      // Add order to client's orders
      const clientData = clientsMap.get(clientId);
      clientData.orders.push({
        id: order._id,
        date: order.createdAt,
        status: order.status,
        total: totalSpentOnProducts,
        items: professionalItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price && item.price.amount ? item.price.amount : (item.price || 0)
        }))
      });
    });

    // Convert map to array
    let clients = Array.from(clientsMap.values());

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client.tags && client.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Apply status filter if provided
    if (status !== 'all') {
      clients = clients.filter(client => client.status === status);
    }

    // Apply type filter if provided
    if (type !== 'all') {
      clients = clients.filter(client => {
        const hasSessions = client.tags.some(tag => tag === 'Client Session' || client.totalSessions > 0);
        const hasEvents = client.tags.some(tag => tag === 'Client Événement');
        const hasBoutique = client.tags.some(tag => tag === 'Client Boutique');
        
        switch (type) {
          case 'session':
            return hasSessions && !hasEvents && !hasBoutique;
          case 'event':
            return hasEvents && !hasSessions && !hasBoutique;
          case 'boutique':
            return hasBoutique && !hasSessions && !hasEvents;
          case 'mixed':
            const activityTypes = [hasSessions, hasEvents, hasBoutique].filter(Boolean);
            return activityTypes.length > 1;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    clients.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'lastVisit') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalClients = clients.length;
    const startIndex = (page - 1) * limit;
    clients = clients.slice(startIndex, startIndex + parseInt(limit));

    // Get client statistics
    const activeClients = Array.from(clientsMap.values()).filter(client => client.status === 'active').length;
    const inactiveClients = Array.from(clientsMap.values()).filter(client => client.status === 'inactive').length;
    
    // Calculate total revenue
    const totalRevenue = Array.from(clientsMap.values()).reduce((sum, client) => sum + client.totalSpent, 0);
    
    // Calculate average revenue per client
    const averageRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;

    res.json({
      success: true,
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalClients,
        pages: Math.ceil(totalClients / parseInt(limit))
      },
      stats: {
        totalClients,
        activeClients,
        inactiveClients,
        totalRevenue,
        averageRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching professional clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get client details
router.get('/clients/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Find the professional ID for the current user
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Find the client
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if this client has bookings with this professional
    const bookings = await Booking.find({ 
      professional: professional._id,
      client: clientId
    }).sort({ appointmentDate: -1 });

    // Check if this client has participated in sessions with this professional
    const sessions = await Session.find({
      professionalId: professional._id,
      participants: { $in: [clientId] }
    }).sort({ startTime: -1 });

    // Check if this client has participated in events with this professional
    const events = await Event.find({
      professional: req.user._id,
      'participants.user': clientId
    }).sort({ date: -1 });
    
    // Find all products for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(product => product._id);
    
    // Find all orders from this client that include this professional's products
    const orders = await Order.find({
      clientId: clientId,
      'items.product': { $in: productIds }
    }).populate('items.product', 'name title price images').sort({ createdAt: -1 });

    // If no bookings, sessions, events, or orders, this client doesn't belong to this professional
    if (bookings.length === 0 && sessions.length === 0 && events.length === 0 && orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'This client has no history with you'
      });
    }

    // Calculate client statistics
    let totalSessions = 0;
    let totalSpent = 0;
    let lastVisit = null;
    const upcomingSessions = [];
    const pastSessions = [];
    const clientOrders = [];
    const tags = [];

    // Process bookings
    bookings.forEach(booking => {
      if (booking.status === 'completed') {
        totalSessions += 1;
        totalSpent += booking.totalAmount ? booking.totalAmount.amount || 0 : 0;
      }

      if (!lastVisit || new Date(booking.appointmentDate) > new Date(lastVisit)) {
        lastVisit = booking.appointmentDate;
      }

      const sessionInfo = {
        id: booking._id,
        type: 'booking',
        date: booking.appointmentDate,
        time: booking.appointmentTime.start,
        service: booking.service.name,
        payment: booking.totalAmount ? booking.totalAmount.amount || 0 : 0,
        status: booking.status,
        location: booking.location
      };

      if (new Date(booking.appointmentDate) > new Date()) {
        upcomingSessions.push(sessionInfo);
      } else {
        pastSessions.push(sessionInfo);
      }
    });

    // Process sessions
    sessions.forEach(session => {
      if (session.status === 'completed') {
        totalSessions += 1;
        totalSpent += session.price || 0;
      }

      if (!lastVisit || new Date(session.startTime) > new Date(lastVisit)) {
        lastVisit = session.startTime;
      }

      const sessionInfo = {
        id: session._id,
        type: 'session',
        date: session.startTime,
        time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        service: session.title,
        payment: session.price || 0,
        status: session.status,
        location: session.isOnline() ? { type: 'online', onlineLink: session.meetingLink } : { type: 'in_person', address: { street: session.location } }
      };

      if (new Date(session.startTime) > new Date()) {
        upcomingSessions.push(sessionInfo);
      } else {
        pastSessions.push(sessionInfo);
      }
    });

    // Process events
    events.forEach(event => {
      const participant = event.participants.find(p => p.user.toString() === clientId);
      if (!participant) return;

      if (participant.status === 'confirmed') {
        totalSessions += 1;
        totalSpent += (event.price || 0) * (participant.quantity || 1);
      }

      if (!lastVisit || new Date(event.date) > new Date(lastVisit)) {
        lastVisit = event.date;
      }

      const sessionInfo = {
        id: event._id,
        type: 'event',
        date: event.date,
        time: event.time || new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        service: event.title,
        payment: (event.price || 0) * (participant.quantity || 1),
        status: participant.status,
        location: event.eventType === 'online' ? { type: 'online', onlineLink: event.onlineLink } : { type: 'in_person', address: { street: event.address } }
      };

      if (new Date(event.date) > new Date()) {
        upcomingSessions.push(sessionInfo);
      } else {
        pastSessions.push(sessionInfo);
      }
    });
    
    // Process orders
    orders.forEach(order => {
      // Filter items to only include products from this professional
      const professionalItems = order.items.filter(item => 
        productIds.some(id => id.toString() === item.product._id.toString())
      );
      
      if (professionalItems.length === 0) return; // Skip if no items from this professional
      
      // Calculate total spent on this professional's products
      const totalSpentOnProducts = professionalItems.reduce((sum, item) => {
        const itemPrice = item.price && item.price.amount ? item.price.amount : (item.price || 0);
        return sum + (itemPrice * (item.quantity || 1));
      }, 0);
      
      // Add to total spent
      totalSpent += totalSpentOnProducts || 0;
      
      // Update last visit if this order is more recent
      if (!lastVisit || new Date(order.createdAt) > new Date(lastVisit)) {
        lastVisit = order.createdAt;
      }
      
      // Add order to client's orders
      clientOrders.push({
        id: order._id,
        date: order.createdAt,
        status: order.status,
        total: totalSpentOnProducts,
        items: professionalItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price && item.price.amount ? item.price.amount : (item.price || 0)
        }))
      });
    });
    
    // Add Client Boutique tag if they have orders
    if (clientOrders.length > 0 && !tags.includes('Client Boutique')) {
      tags.push('Client Boutique');
    }

    // Sort upcoming and past sessions
    upcomingSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    pastSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Sort orders by date
    clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const clientData = {
      id: client._id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone || '',
      image: client.profileImage || '',
      lastVisit,
      totalSessions,
      totalSpent,
      status: (bookings.some(b => b.status !== 'cancelled' && b.status !== 'no_show') || orders.length > 0) ? 'active' : 'inactive',
      tags: [...tags, ...(client.tags || [])],
      notes: client.notes || '',
      upcomingSessions,
      pastSessions,
      orders: clientOrders
    };

    res.json({
      success: true,
      client: clientData
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get professional analytics data
router.get('/analytics', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Find the professional profile first
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const professionalId = professional._id;
    console.log('Fetching analytics for professional:', professionalId);

    // Calculate date ranges for period comparison
    const now = new Date();
    let currentPeriodStart, previousPeriodStart, previousPeriodEnd;
    
    switch (period) {
      case 'week':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'quarter':
        currentPeriodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'year':
        currentPeriodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      default: // month
        currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
    }

    // Get sessions data for current period
    const sessionsData = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          createdAt: { $gte: currentPeriodStart }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          avgDuration: { $avg: '$duration' }
        } 
      }
    ]);

    // Get sessions data for previous period
    const previousSessionsData = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    // Get unique clients from sessions
    const clientsFromSessions = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          createdAt: { $gte: currentPeriodStart }
        } 
      },
      { $unwind: '$participants' },
      { $group: { _id: '$participants' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    // Get unique clients from bookings
    const clientsFromBookings = await Booking.aggregate([
      { 
        $match: { 
          professional: professionalId,
          createdAt: { $gte: currentPeriodStart }
        } 
      },
      { $group: { _id: '$client' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    // Get products data - count orders with this professional's products
    const products = await Product.find({ professionalId: professionalId });
    const productIds = products.map(p => p._id);
    
    const productsData = await Order.aggregate([
      { 
        $match: { 
          'items.product': { $in: productIds },
          createdAt: { $gte: currentPeriodStart }
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds } } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price.amount', '$items.quantity'] } }
        } 
      }
    ]);

    // Get bookings revenue
    const bookingsRevenue = await Booking.aggregate([
      { 
        $match: { 
          professional: professionalId,
          status: 'completed',
          createdAt: { $gte: currentPeriodStart }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount.amount' }
        } 
      }
    ]);

    // Get reviews/ratings
    const reviewsData = await Review.aggregate([
      { 
        $match: { 
          targetId: professionalId,
          targetType: 'Professional'
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        } 
      }
    ]);

    // Calculate return rate
    const returnClientsData = await Session.aggregate([
      { $match: { professionalId: professionalId } },
      { $unwind: '$participants' },
      { $group: { _id: '$participants', sessionCount: { $sum: 1 } } },
      { $match: { sessionCount: { $gt: 1 } } },
      { $group: { _id: null, returnClients: { $sum: 1 } } }
    ]);

    const totalClientsData = await Session.aggregate([
      { $match: { professionalId: professionalId } },
      { $unwind: '$participants' },
      { $group: { _id: '$participants' } },
      { $group: { _id: null, totalClients: { $sum: 1 } } }
    ]);

    // Get top services
    const topServices = await Session.aggregate([
      { $match: { professionalId: professionalId } },
      { 
        $group: { 
          _id: '$title',
          sessions: { $sum: 1 },
          revenue: { $sum: '$price' }
        } 
      },
      { $sort: { sessions: -1 } },
      { $limit: 5 }
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      { $match: { 'items.product': { $in: productIds } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds } } },
      { 
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { 
        $group: { 
          _id: '$items.product',
          name: { $first: '$productInfo.title' },
          sales: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price.amount', '$items.quantity'] } }
        } 
      },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    // Get client demographics from all clients who have interacted with this professional
    // First, get all unique client IDs from sessions, bookings, and orders
    const allClientIds = new Set();

    // Add clients from sessions
    const sessionClients = await Session.find({ professionalId: professionalId }).distinct('participants');
    sessionClients.forEach(clientId => allClientIds.add(clientId.toString()));

    // Add clients from bookings
    const bookingClients = await Booking.find({ professional: professionalId }).distinct('client');
    bookingClients.forEach(clientId => allClientIds.add(clientId.toString()));

    // Add clients from orders
    const orderClients = await Order.find({ 'items.product': { $in: productIds } }).distinct('clientId');
    orderClients.forEach(clientId => allClientIds.add(clientId.toString()));

    // Convert Set to Array and get client details
    const clientIdsArray = Array.from(allClientIds).map(id => new mongoose.Types.ObjectId(id));
    
    // Get age demographics
    const ageDemographics = await User.aggregate([
      { $match: { _id: { $in: clientIdsArray } } },
      {
        $addFields: {
          age: {
            $cond: {
              if: { $ne: ['$birthDate', null] },
              then: {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), '$birthDate'] },
                    365.25 * 24 * 60 * 60 * 1000
                  ]
                }
              },
              else: null
            }
          }
        }
      },
      {
        $addFields: {
          ageGroup: {
            $cond: {
              if: { $ne: ['$age', null] },
              then: {
                $switch: {
                  branches: [
                    { case: { $and: [{ $gte: ['$age', 18] }, { $lt: ['$age', 26] }] }, then: '18-25' },
                    { case: { $and: [{ $gte: ['$age', 26] }, { $lt: ['$age', 36] }] }, then: '26-35' },
                    { case: { $and: [{ $gte: ['$age', 36] }, { $lt: ['$age', 46] }] }, then: '36-45' },
                    { case: { $and: [{ $gte: ['$age', 46] }, { $lt: ['$age', 56] }] }, then: '46-55' },
                    { case: { $gte: ['$age', 56] }, then: '55+' }
                  ],
                  default: 'Non spécifié'
                }
              },
              else: 'Non spécifié'
            }
          }
        }
      },
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get gender demographics
    const genderDemographics = await User.aggregate([
      { $match: { _id: { $in: clientIdsArray } } },
      {
        $addFields: {
          genderGroup: {
            $cond: {
              if: { $ne: ['$gender', null] },
              then: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$gender', 'female'] }, then: 'Femmes' },
                    { case: { $eq: ['$gender', 'male'] }, then: 'Hommes' },
                    { case: { $eq: ['$gender', 'other'] }, then: 'Autre' },
                    { case: { $eq: ['$gender', 'prefer_not_to_say'] }, then: 'Autre' }
                  ],
                  default: 'Non spécifié'
                }
              },
              else: 'Non spécifié'
            }
          }
        }
      },
      { $group: { _id: '$genderGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Calculate total clients for percentage calculation
    const totalClientsForDemo = clientIdsArray.length;

    // Convert demographics to percentages
    const ageGroups = ageDemographics.map(group => ({
      group: group._id,
      percentage: totalClientsForDemo > 0 ? Math.round((group.count / totalClientsForDemo) * 100) : 0
    }));

    const genderGroups = genderDemographics.map(group => ({
      group: group._id,
      percentage: totalClientsForDemo > 0 ? Math.round((group.count / totalClientsForDemo) * 100) : 0
    }));

    // Ensure all age groups are represented
    const allAgeGroups = ['18-25', '26-35', '36-45', '46-55', '55+'];
    const completeAgeGroups = allAgeGroups.map(group => {
      const found = ageGroups.find(ag => ag.group === group);
      return found || { group, percentage: 0 };
    });

    // Ensure all gender groups are represented
    const allGenderGroups = ['Femmes', 'Hommes', 'Autre'];
    const completeGenderGroups = allGenderGroups.map(group => {
      const found = genderGroups.find(gg => gg.group === group);
      return found || { group, percentage: 0 };
    });

    // If no clients found, provide default demographics
    if (totalClientsForDemo === 0) {
      completeAgeGroups.forEach(group => group.percentage = 0);
      completeGenderGroups.forEach(group => group.percentage = 0);
      // Add a message for "Non spécifié" if no data
      completeAgeGroups.push({ group: 'Données insuffisantes', percentage: 100 });
      completeGenderGroups.push({ group: 'Données insuffisantes', percentage: 100 });
    }

    // Calculate totals
    const totalSessions = sessionsData[0]?.total || 0;
    const previousTotalSessions = previousSessionsData[0]?.total || 0;
    const totalClients = Math.max(
      clientsFromSessions[0]?.total || 0,
      clientsFromBookings[0]?.total || 0
    );
    const totalSessionRevenue = sessionsData[0]?.totalRevenue || 0;
    const totalBookingRevenue = bookingsRevenue[0]?.total || 0;
    const totalProductRevenue = productsData[0]?.revenue || 0;
    const totalRevenue = totalSessionRevenue + totalBookingRevenue + totalProductRevenue;
    const totalProducts = productsData[0]?.total || 0;
    const avgSessionLength = Math.round(sessionsData[0]?.avgDuration || 60); // Default 60 minutes
    const returnRate = totalClientsData[0]?.totalClients > 0 
      ? Math.round((returnClientsData[0]?.returnClients || 0) / totalClientsData[0].totalClients * 100)
      : 0;

    const analyticsData = {
      overview: {
        sessions: {
          total: totalSessions,
          previousTotal: previousTotalSessions,
          percentChange: calculatePercentChange(totalSessions, previousTotalSessions),
          trend: calculateTrend(totalSessions, previousTotalSessions)
        },
        clients: {
          total: totalClients,
          previousTotal: 0, // Would need similar calculation for previous period
          percentChange: 15, // Placeholder
          trend: 'up'
        },
        revenue: {
          total: Math.round(totalRevenue),
          previousTotal: 0, // Would need similar calculation
          percentChange: 12, // Placeholder
          trend: 'up'
        },
        products: {
          total: totalProducts,
          previousTotal: 0, // Would need similar calculation
          percentChange: 8, // Placeholder
          trend: 'up'
        }
      },
      performance: {
        avgRating: Math.round((reviewsData[0]?.avgRating || 0) * 10) / 10,
        totalReviews: reviewsData[0]?.totalReviews || 0,
        avgSessionLength: avgSessionLength,
        returnRate: returnRate
      },
      topServices: topServices.map(service => ({
        name: service._id || 'Service sans nom',
        sessions: service.sessions || 0,
        revenue: Math.round(service.revenue || 0)
      })),
      topProducts: topProducts.map(product => ({
        name: product.name || 'Produit sans nom',
        sales: product.sales || 0,
        revenue: Math.round(product.revenue || 0)
      })),
      clientDemographics: {
        ageGroups: completeAgeGroups,
        gender: completeGenderGroups
      },
      monthlySessions: [
        { month: 'Jan', sessions: 12 },
        { month: 'Fév', sessions: 18 },
        { month: 'Mar', sessions: 15 },
        { month: 'Avr', sessions: 22 },
        { month: 'Mai', sessions: 28 },
        { month: 'Juin', sessions: 25 }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 2400 },
        { month: 'Fév', revenue: 3600 },
        { month: 'Mar', revenue: 3000 },
        { month: 'Avr', revenue: 4400 },
        { month: 'Mai', revenue: 5600 },
        { month: 'Juin', revenue: 5000 }
      ]
    };

    // Get monthly sessions data from sessions
    const monthlySessionsData = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      { 
        $group: { 
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sessions: { $sum: 1 }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get monthly sessions data from bookings
    const monthlyBookingsData = await Booking.aggregate([
      { 
        $match: { 
          professional: professionalId,
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      { 
        $group: { 
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sessions: { $sum: 1 }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Combine sessions and bookings
    const monthlySessionsMap = new Map();
    
    // Add sessions
    monthlySessionsData.forEach(data => {
      const key = `${data._id.year}-${data._id.month}`;
      monthlySessionsMap.set(key, (monthlySessionsMap.get(key) || 0) + (data.sessions || 0));
    });
    
    // Add bookings
    monthlyBookingsData.forEach(data => {
      const key = `${data._id.year}-${data._id.month}`;
      monthlySessionsMap.set(key, (monthlySessionsMap.get(key) || 0) + (data.sessions || 0));
    });

    // Convert to array and sort
    const monthlySessionsDataCombined = Array.from(monthlySessionsMap.entries())
      .map(([key, sessions]) => {
        const [year, month] = key.split('-');
        return {
          _id: { year: parseInt(year), month: parseInt(month) },
          sessions: sessions
        };
      })
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
      })
      .slice(-6); // Get last 6 months

    // Get monthly revenue data from sessions
    const monthlySessionRevenueData = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      { 
        $group: { 
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$price' }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get monthly revenue data from orders (products)
    const monthlyOrderRevenueData = await Order.aggregate([
      { 
        $match: { 
          'items.product': { $in: productIds },
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) },
          status: { $in: ['completed', 'delivered'] }
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: productIds } } },
      { 
        $group: { 
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: { $multiply: ['$items.price.amount', '$items.quantity'] } }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get monthly revenue data from bookings
    const monthlyBookingRevenueData = await Booking.aggregate([
      { 
        $match: { 
          professional: professionalId,
          status: 'completed',
          createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      { 
        $group: { 
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount.amount' }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Combine all revenue sources
    const monthlyRevenueMap = new Map();
    
    // Add session revenue
    monthlySessionRevenueData.forEach(data => {
      const key = `${data._id.year}-${data._id.month}`;
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (data.revenue || 0));
    });
    
    // Add order revenue
    monthlyOrderRevenueData.forEach(data => {
      const key = `${data._id.year}-${data._id.month}`;
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (data.revenue || 0));
    });
    
    // Add booking revenue
    monthlyBookingRevenueData.forEach(data => {
      const key = `${data._id.year}-${data._id.month}`;
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + (data.revenue || 0));
    });

    // Convert to array and sort
    const monthlyRevenueData = Array.from(monthlyRevenueMap.entries())
      .map(([key, revenue]) => {
        const [year, month] = key.split('-');
        return {
          _id: { year: parseInt(year), month: parseInt(month) },
          revenue: revenue
        };
      })
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
      })
      .slice(-6); // Get last 6 months

    // Format monthly data
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlySessions = monthlySessionsDataCombined.map(data => ({
      month: monthNames[data._id.month - 1],
      sessions: data.sessions
    }));

    const monthlyRevenue = monthlyRevenueData.map(data => ({
      month: monthNames[data._id.month - 1],
      revenue: Math.round(data.revenue || 0)
    }));

    // Fill empty months with 0 if needed
    const fillEmptyMonths = (data, monthsCount = 6) => {
      const currentMonth = now.getMonth();
      const filledData = [];
      
      // Create a map of existing months
      const existingMonths = new Map();
      data.forEach(item => {
        existingMonths.set(item.month, item);
      });
      
      // Fill missing months
      for (let i = monthsCount - 1; i >= 0; i--) {
        const targetMonth = (currentMonth - i + 12) % 12;
        const monthName = monthNames[targetMonth];
        
        if (existingMonths.has(monthName)) {
          filledData.push(existingMonths.get(monthName));
        } else {
          // Determine if this is sessions or revenue data
          const isSessionsData = data.length > 0 && 'sessions' in data[0];
          filledData.push({
            month: monthName,
            ...(isSessionsData ? { sessions: 0 } : { revenue: 0 })
          });
        }
      }
      
      return filledData;
    };

    const monthlySessionsFilled = fillEmptyMonths(monthlySessions);
    const monthlyRevenueFilled = fillEmptyMonths(monthlyRevenue);

    // Update the analytics data with real monthly data
    analyticsData.monthlySessions = monthlySessionsFilled.length > 0 ? monthlySessionsFilled : [
      { month: 'Jan', sessions: 0 },
      { month: 'Fév', sessions: 0 },
      { month: 'Mar', sessions: 0 },
      { month: 'Avr', sessions: 0 },
      { month: 'Mai', sessions: 0 },
      { month: 'Juin', sessions: 0 }
    ];
    analyticsData.monthlyRevenue = monthlyRevenueFilled.length > 0 ? monthlyRevenueFilled : [
      { month: 'Jan', revenue: 0 },
      { month: 'Fév', revenue: 0 },
      { month: 'Mar', revenue: 0 },
      { month: 'Avr', revenue: 0 },
      { month: 'Mai', revenue: 0 },
      { month: 'Juin', revenue: 0 }
    ];

    // Ensure topServices and topProducts have at least empty arrays
    if (!analyticsData.topServices || analyticsData.topServices.length === 0) {
      analyticsData.topServices = [
        { name: 'Aucun service', sessions: 0, revenue: 0 }
      ];
    }

    if (!analyticsData.topProducts || analyticsData.topProducts.length === 0) {
      analyticsData.topProducts = [
        { name: 'Aucun produit', sales: 0, revenue: 0 }
      ];
    }

    console.log('Final analytics data:', analyticsData);

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching professional analytics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching analytics data',
      error: error.message 
    });
  }
});

// Get professional by ID (public)
router.get('/:id', async (req, res) => {
  try {
    // First try to find by professional ID

    let professional = await Professional.findById(req.params.id)
      .populate('userId', 'firstName lastName email profileImage');
    
    // If not found, try to find by user ID
    if (!professional) {
      professional = await Professional.findOne({ userId: req.params.id })
        .populate('userId', 'firstName lastName email profileImage');
    }

    if (!professional || !professional.isActive || !professional.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Convert relative image paths to absolute URLs
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // Convert profile photo URL if it exists
    if (professional.profilePhoto && !professional.profilePhoto.startsWith('http')) {
      professional.profilePhoto = `${baseUrl}${professional.profilePhoto}`;
    }
    
    // Convert cover images URLs if they exist
    if (professional.coverImages && professional.coverImages.length > 0) {
      professional.coverImages = professional.coverImages.map(img => 
        img.startsWith('http') ? img : `${baseUrl}${img}`
      );
    }

    // If businessAddress is missing or incomplete, create a default one
    if (!professional.businessAddress) {
      professional.businessAddress = {
        street: professional.address || '',
        city: '',
        postalCode: '',
        country: 'Morocco'
      };
    }

    // Calculate statistics for this professional
    const professionalId = professional._id;
    
    // Get total sessions count
    const totalSessions = await Session.countDocuments({
      professionalId: professionalId
    });

    // Get unique clients count from sessions and bookings
    const sessionClients = await Session.distinct('participants', {
      professionalId: professionalId
    });
    
    const bookingClients = await Booking.distinct('client', {
      professional: professionalId
    });
    
    // Combine and count unique clients
    const allClientIds = new Set([
      ...sessionClients.map(id => id.toString()),
      ...bookingClients.map(id => id.toString())
    ]);
    const totalClients = allClientIds.size;

    // Get products count
    const productsCount = await Product.countDocuments({
      professionalId: professionalId,
      status: 'approved'
    });

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      professional: professional.userId,
      eventDate: { $gte: new Date() },
      status: 'active'
    });

    // Add calculated stats to professional object
    professional = professional.toObject();
    professional.stats = {
      totalSessions,
      totalClients,
      productsCount,
      upcomingEvents
    };

    res.json({
      success: true,
      professional
    });

  } catch (error) {
    console.error('Error fetching professional:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get professional statistics by ID (public)
router.get('/:id/stats', async (req, res) => {
  try {
    // First try to find by professional ID
    let professional = await Professional.findById(req.params.id);
    
    // If not found, try to find by user ID
    if (!professional) {
      professional = await Professional.findOne({ userId: req.params.id });
    }

    if (!professional || !professional.isActive || !professional.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    const professionalId = professional._id;
    
    // Get total sessions count
    const totalSessions = await Session.countDocuments({
      professionalId: professionalId
    });

    // Get unique clients count from sessions and bookings
    const sessionClients = await Session.distinct('participants', {
      professionalId: professionalId
    });
    
    const bookingClients = await Booking.distinct('client', {
      professional: professionalId
    });
    
    // Combine and count unique clients
    const allClientIds = new Set([
      ...sessionClients.map(id => id.toString()),
      ...bookingClients.map(id => id.toString())
    ]);
    const totalClients = allClientIds.size;

    // Get products count
    const productsCount = await Product.countDocuments({
      professionalId: professionalId,
      status: 'approved'
    });

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      professional: professional.userId,
      eventDate: { $gte: new Date() },
      status: 'active'
    });

    // Get completed sessions count (for more detailed stats)
    const completedSessions = await Session.countDocuments({
      professionalId: professionalId,
      status: 'completed'
    });

    // Get total revenue from sessions
    const sessionRevenue = await Session.aggregate([
      { 
        $match: { 
          professionalId: professionalId,
          status: 'completed'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$price' }
        } 
      }
    ]);

    // Get total revenue from bookings
    const bookingRevenue = await Booking.aggregate([
      { 
        $match: { 
          professional: professionalId,
          status: 'completed'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount.amount' }
        } 
      }
    ]);

    const stats = {
      totalSessions,
      completedSessions,
      totalClients,
      productsCount,
      upcomingEvents,
      totalRevenue: (sessionRevenue[0]?.total || 0) + (bookingRevenue[0]?.total || 0),
      sessionRevenue: sessionRevenue[0]?.total || 0,
      bookingRevenue: bookingRevenue[0]?.total || 0,
      rating: professional.rating || { average: 0, totalReviews: 0 }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching professional stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create professional profile
router.post('/profile', isAuthenticated, [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessType').notEmpty().withMessage('Valid business type is required'),
  body('contactInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('businessAddress.city').notEmpty().withMessage('City is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if professional profile already exists
    const existingProfessional = await Professional.findOne({ userId: req.user._id });
    if (existingProfessional) {
      return res.status(409).json({
        success: false,
        message: 'Professional profile already exists'
      });
    }

    // Update user role to professional
    await User.findByIdAndUpdate(req.user._id, { role: 'professional' });

    // Create professional profile
    const professionalData = {
      userId: req.user._id,
      ...req.body
    };

    // Handle coordinates validation - prevent null values
    if (professionalData.businessAddress && professionalData.businessAddress.coordinates) {
      const coords = professionalData.businessAddress.coordinates;
      
      // If both lat and lng are null, remove the coordinates object entirely
      if (coords.lat === null && coords.lng === null) {
        delete professionalData.businessAddress.coordinates;
      } else if (coords.lat === null || coords.lng === null) {
        // If only one coordinate is null, remove the null one
        if (coords.lat === null) {
          delete professionalData.businessAddress.coordinates.lat;
        }
        if (coords.lng === null) {
          delete professionalData.businessAddress.coordinates.lng;
        }
        
        // If we removed one coordinate, remove the entire coordinates object
        if (!professionalData.businessAddress.coordinates.lat || !professionalData.businessAddress.coordinates.lng) {
          delete professionalData.businessAddress.coordinates;
        }
      }
    }

    const professional = new Professional(professionalData);
    await professional.save();

    await professional.populate('userId', 'firstName lastName email profileImage');

    res.status(201).json({
      success: true,
      message: 'Professional profile created successfully',
      professional
    });

  } catch (error) {
    console.error('Error creating professional profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update professional profile
router.put('/profile', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const allowedFields = [
      'businessName', 'businessType', 'description', 'certifications',
      'businessAddress', 'contactInfo', 'businessHours', 'address', 'title', 'activities',
      'coverImages', 'categories', 'bookingMode'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Handle business hours update
    if (updateData.businessHours) {
      // Validate business hours format
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const validatedHours = updateData.businessHours.filter(schedule => {
        return validDays.includes(schedule.day) && 
               typeof schedule.isOpen === 'boolean' &&
               (schedule.isOpen === false || (schedule.openTime && schedule.closeTime));
      });
      
      updateData.businessHours = validatedHours;
    }

    // Handle cover images update
    if (updateData.coverImages) {
      // Validate cover images (should be array of URLs)
      if (Array.isArray(updateData.coverImages)) {
        updateData.coverImages = updateData.coverImages.filter(img => 
          typeof img === 'string' && img.length > 0
        );
      } else {
        delete updateData.coverImages; // Remove invalid data
      }
    }

    // Ensure businessAddress has all required fields
    if (updateData.businessAddress) {
      // Keep existing fields if not provided in the update
      updateData.businessAddress = {
        ...professional.businessAddress,
        ...updateData.businessAddress,
        // Ensure country is always set
        country: updateData.businessAddress.country || professional.businessAddress?.country || 'Morocco'
      };
      
      // Handle coordinates validation - prevent null values
      if (updateData.businessAddress.coordinates) {
        const coords = updateData.businessAddress.coordinates;
        
        // If both lat and lng are null, remove the coordinates object entirely
        if (coords.lat === null && coords.lng === null) {
          delete updateData.businessAddress.coordinates;
        } else if (coords.lat === null || coords.lng === null) {
          // If only one coordinate is null, remove the null one
          if (coords.lat === null) {
            delete updateData.businessAddress.coordinates.lat;
          }
          if (coords.lng === null) {
            delete updateData.businessAddress.coordinates.lng;
          }
          
          // If we removed one coordinate, remove the entire coordinates object
          if (!updateData.businessAddress.coordinates.lat || !updateData.businessAddress.coordinates.lng) {
            delete updateData.businessAddress.coordinates;
          }
        }
      }
    }

    // Ensure contactInfo has required fields
    if (updateData.contactInfo) {
      updateData.contactInfo = {
        ...professional.contactInfo,
        ...updateData.contactInfo
      };
    }

    // Handle categories update
    if (updateData.categories) {
      if (Array.isArray(updateData.categories)) {
        // Clean and validate categories
        updateData.categories = updateData.categories
          .filter(cat => typeof cat === 'string' && cat.trim().length > 0)
          .map(cat => cat.trim())
          .filter((cat, index, arr) => arr.indexOf(cat) === index); // Remove duplicates
      } else {
        delete updateData.categories; // Remove invalid data
      }
    }

    const updatedProfessional = await Professional.findByIdAndUpdate(
      professional._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email profileImage');

    res.json({
      success: true,
      message: 'Professional profile updated successfully',
      professional: updatedProfessional
    });

  } catch (error) {
    console.error('Error updating professional profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ===================== BUSINESS HOURS MANAGEMENT =====================

// Get business hours
router.get('/me/business-hours', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    res.json({
      success: true,
      businessHours: professional.businessHours || []
    });

  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update business hours
router.put('/me/business-hours', isAuthenticated, isProfessional, [
  body('businessHours').isArray().withMessage('Business hours must be an array'),
  body('businessHours.*.day').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid day'),
  body('businessHours.*.isOpen').isBoolean().withMessage('isOpen must be a boolean'),
  body('businessHours.*.openTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid open time format (HH:MM)'),
  body('businessHours.*.closeTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid close time format (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { businessHours } = req.body;

    // Validate that open hours have both openTime and closeTime
    for (const schedule of businessHours) {
      if (schedule.isOpen && (!schedule.openTime || !schedule.closeTime)) {
        return res.status(400).json({
          success: false,
          message: 'Open days must have both openTime and closeTime'
        });
      }
    }

    // Update business hours
    professional.businessHours = businessHours;
    await professional.save();

    res.json({
      success: true,
      message: 'Business hours updated successfully',
      businessHours: professional.businessHours
    });

  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===================== COVER IMAGES MANAGEMENT =====================

// Get cover images
router.get('/me/cover-images', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Convert relative URLs to absolute URLs
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const coverImages = (professional.coverImages || []).map(img => 
      img.startsWith('http') ? img : `${baseUrl}${img}`
    );

    res.json({
      success: true,
      coverImages
    });

  } catch (error) {
    console.error('Error fetching cover images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add cover image
router.post('/me/cover-images', isAuthenticated, isProfessional, [
  body('imageUrl').notEmpty().withMessage('Image URL is required').custom((value) => {
    console.log('Validating imageUrl:', value);
    // Accept both absolute URLs and relative paths starting with /uploads/
    if (value.startsWith('http') || value.startsWith('/uploads/')) {
      console.log('Validation passed for imageUrl:', value);
      return true;
    }
    console.log('Validation failed for imageUrl:', value);
    throw new Error('Image URL must be a valid URL or relative path starting with /uploads/');
  })
], async (req, res) => {
  try {
    console.log('Add cover image request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { imageUrl } = req.body;

    // Check if image already exists
    if (professional.coverImages && professional.coverImages.includes(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Image already exists'
      });
    }

    // Add image to cover images
    if (!professional.coverImages) {
      professional.coverImages = [];
    }
    professional.coverImages.push(imageUrl);
    await professional.save();

    console.log('Cover image added successfully:', imageUrl);
    console.log('Updated cover images:', professional.coverImages);

    res.json({
      success: true,
      message: 'Cover image added successfully',
      coverImages: professional.coverImages
    });

  } catch (error) {
    console.error('Error adding cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove cover image
router.delete('/me/cover-images', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Get imageUrl from query params or body
    const imageUrl = req.query.imageUrl || req.body.imageUrl;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    console.log('Attempting to remove cover image:', imageUrl);
    console.log('Current cover images:', professional.coverImages);

    // Check if image exists (check both exact match and relative path)
    const imageExists = professional.coverImages && (
      professional.coverImages.includes(imageUrl) ||
      professional.coverImages.some(img => img.endsWith(imageUrl.replace(/^.*\/uploads/, '/uploads')))
    );

    if (!imageExists) {
      console.log('Image not found in cover images:', {
        searchingFor: imageUrl,
        availableImages: professional.coverImages
      });
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Remove image from cover images (handle both exact match and relative path)
    professional.coverImages = professional.coverImages.filter(img => 
      img !== imageUrl && !img.endsWith(imageUrl.replace(/^.*\/uploads/, '/uploads'))
    );
    await professional.save();

    // Try to delete the physical file if it's a local upload
    if (imageUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', imageUrl);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully:', filePath);
        }
      });
    }

    res.json({
      success: true,
      message: 'Cover image removed successfully',
      coverImages: professional.coverImages
    });

  } catch (error) {
    console.error('Error removing cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Replace cover image (remove old, add new)
router.put('/me/cover-images/replace', isAuthenticated, isProfessional, [
  body('newImageUrl').notEmpty().withMessage('New image URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { newImageUrl } = req.body;

    // Replace all cover images with the new one (for single cover image)
    professional.coverImages = [newImageUrl];
    await professional.save();

    console.log('Cover image replaced successfully:', {
      oldImages: professional.coverImages,
      newImage: newImageUrl
    });

    res.json({
      success: true,
      message: 'Cover image replaced successfully',
      coverImages: professional.coverImages
    });

  } catch (error) {
    console.error('Error replacing cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update all cover images
router.put('/me/cover-images', isAuthenticated, isProfessional, [
  body('coverImages').isArray().withMessage('Cover images must be an array'),
  body('coverImages.*').isString().withMessage('Each cover image must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { coverImages } = req.body;

    // Validate and clean cover images
    const validImages = coverImages.filter(img => 
      typeof img === 'string' && img.trim().length > 0
    );

    // Remove duplicates
    const uniqueImages = [...new Set(validImages)];

    professional.coverImages = uniqueImages;
    await professional.save();

    res.json({
      success: true,
      message: 'Cover images updated successfully',
      coverImages: professional.coverImages
    });

  } catch (error) {
    console.error('Error updating cover images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add/Update service
router.post('/services', isAuthenticated, isProfessional, [
  body('name').notEmpty().withMessage('Service name is required'),
  body('category').isIn(['individual', 'group', 'online', 'workshop', 'retreat']).withMessage('Valid category is required'),
  body('price.amount').isNumeric().withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const serviceData = {
      ...req.body,
      _id: undefined // Let MongoDB generate the ID
    };

    professional.services.push(serviceData);
    await professional.save();

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      service: professional.services[professional.services.length - 1]
    });

  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update service
router.put('/services/:serviceId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const service = professional.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const allowedFields = ['name', 'description', 'duration', 'price', 'category', 'isActive'];
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        service[key] = req.body[key];
      }
    });

    await professional.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete service
router.delete('/services/:serviceId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    professional.services.id(req.params.serviceId).remove();
    await professional.save();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upload profile photo
router.post('/profile/photo', isAuthenticated, isProfessional, profilePhotoUpload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Get the file path relative to the server
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    // Update professional's profile photo
    await Professional.findByIdAndUpdate(
      professional._id,
      { profilePhoto: photoUrl }
    );
    
    // Also update the user's profile image if needed
    await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: photoUrl }
    );

    // Reload the professional data with the update
    const updatedProfessional = await Professional.findById(professional._id);

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl: photoUrl,
      professional: updatedProfessional
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get professional by user ID
router.get('/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.params.userId })
      .populate('userId', 'firstName lastName email profileImage');

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Check if the requesting user is the owner or an admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      professional
    });

  } catch (error) {
    console.error('Error fetching professional by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update notification settings
router.put('/me/notifications', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    // Update notification settings
    const notificationSettings = req.body;
    
    // Initialize notifications object if it doesn't exist
    if (!professional.settings) {
      professional.settings = {};
    }
    
    professional.settings.notifications = {
      ...professional.settings.notifications,
      ...notificationSettings
    };

    await professional.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      notifications: professional.settings.notifications
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get notification settings
router.get('/me/notifications', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const defaultNotifications = {
      emailBookings: true,
      emailMessages: true,
      emailMarketing: false,
      pushBookings: true,
      pushMessages: true,
      smsBookings: false,
    };

    const notifications = professional.settings?.notifications || defaultNotifications;

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions for analytics calculations
function calculatePercentChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateTrend(current, previous) {
  return current >= previous ? 'up' : 'down';
}

// ===================== CATEGORIES MANAGEMENT =====================

// Get professional's categories
router.get('/me/categories', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    res.json({
      success: true,
      categories: professional.categories || []
    });

  } catch (error) {
    console.error('Error fetching professional categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add a new category
router.post('/me/categories', isAuthenticated, isProfessional, [
  body('category').notEmpty().trim().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { category } = req.body;
    const trimmedCategory = category.trim();

    // Check if category already exists
    if (professional.categories && professional.categories.includes(trimmedCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // Add category
    if (!professional.categories) {
      professional.categories = [];
    }
    professional.categories.push(trimmedCategory);
    await professional.save();

    res.json({
      success: true,
      message: 'Category added successfully',
      categories: professional.categories
    });

  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a category
router.delete('/me/categories/:category', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const categoryToDelete = req.params.category;

    // Check if category exists
    if (!professional.categories || !professional.categories.includes(categoryToDelete)) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Remove category
    professional.categories = professional.categories.filter(cat => cat !== categoryToDelete);
    await professional.save();

    res.json({
      success: true,
      message: 'Category deleted successfully',
      categories: professional.categories
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update all categories
router.put('/me/categories', isAuthenticated, isProfessional, [
  body('categories').isArray().withMessage('Categories must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { categories } = req.body;
    
    // Trim and validate categories
    const trimmedCategories = categories
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    // Remove duplicates
    const uniqueCategories = [...new Set(trimmedCategories)];

    professional.categories = uniqueCategories;
    await professional.save();

    res.json({
      success: true,
      message: 'Categories updated successfully',
      categories: professional.categories
    });

  } catch (error) {
    console.error('Error updating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===================== PUBLIC PROFESSIONAL EVENTS & PRODUCTS =====================

// GET /api/professionals/:id/events?filter=upcoming|expired|all&search=&category=&page=&limit=
router.get('/:id/events', async (req, res) => {
  try {
    const { 
      filter = 'upcoming', 
      search = '', 
      category = '', 
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Vérifier la validité de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID professionnel invalide' 
      });
    }

    // Vérifier que le professionnel existe
    const professional = await Professional.findById(req.params.id);
    console.log('Professional lookup result:', professional ? 'Found' : 'Not found', 'for ID:', req.params.id);
    
    if (!professional) {
      return res.status(404).json({ 
        success: false, 
        message: 'Professionnel non trouvé' 
      });
    }

    const now = new Date();
    const query = { professional: professional.userId, status: 'approved' };

    // Filtrer par statut (upcoming/expired/all)
    if (filter === 'upcoming') {
      query.$or = [
        { date: { $gte: now } },
        { endDate: { $gte: now } }
      ];
    } else if (filter === 'expired') {
      query.date = { $lt: now };
      query.endDate = { $lt: now };
    }

    // Filtrer par recherche
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filtrer par catégorie
    if (category) {
      query.category = category;
    }

    // Options de tri
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Exécuter la requête avec pagination
    const events = await Event.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('professional', 'businessName title')
      .lean();

    // Compter le total pour la pagination
    const total = await Event.countDocuments(query);

    // Enrichir les données
    const enrichedEvents = events.map(event => ({
      ...event,
      // Ajouter des champs calculés
      isExpired: new Date(event.date || event.endDate) < now,
      availableSpots: event.maxParticipants - (event.participants?.length || 0),
      // Formater les images
      images: event.coverImages?.map(img => ({
        url: img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}/uploads/events/${img}`
      })) || [],
      // Informations de localisation formatées
      location: {
        type: event.eventType,
        venue: event.eventType === 'in_person' ? {
          address: { city: event.address },
          name: event.address
        } : null
      },
      // Informations de prix formatées
      pricing: {
        type: event.price === 0 ? 'free' : 'paid',
        amount: event.price,
        currency: event.currency || 'MAD'
      },
      // Capacité formatée
      capacity: {
        current: event.participants?.length || 0,
        maximum: event.maxParticipants
      }
    }));

    res.json({
      success: true,
      events: enrichedEvents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        category,
        filter
      }
    });
  } catch (err) {
    console.error('Error fetching professional events:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des événements' 
    });
  }
});

// GET /api/professionals/:id/products?search=&category=&page=&limit=&sortBy=&sortOrder=
router.get('/:id/products', async (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice
    } = req.query;

    // Vérifier la validité de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID professionnel invalide' 
      });
    }

    // Vérifier que le professionnel existe
    const professional = await Professional.findById(req.params.id);
    console.log('Professional lookup result for products:', professional ? 'Found' : 'Not found', 'for ID:', req.params.id);
    
    if (!professional) {
      return res.status(404).json({ 
        success: false, 
        message: 'Professionnel non trouvé' 
      });
    }

    const query = { 
      professionalId: req.params.id, 
      status: 'approved',
      isActive: true 
    };

    // Filtrer par recherche
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filtrer par catégorie
    if (category) {
      query.category = category;
    }

    // Filtrer par prix
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Options de tri
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Exécuter la requête avec pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('professionalId', 'businessName title')
      .lean();

    // Compter le total pour la pagination
    const total = await Product.countDocuments(query);

    // Enrichir les données
    const enrichedProducts = products.map(product => ({
      ...product,
      // Formater les images
      images: product.images?.map(img => ({
        url: img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}/uploads/products/${img}`
      })) || [],
      // Informations de stock formatées
      isInStock: product.stock > 0,
      isLowStock: product.stock <= (product.lowStockThreshold || 5),
      // Informations de prix formatées
      isFree: product.price === 0,
      // Nom unifié (utilise name ou title)
      name: product.name || product.title,
      // Marquer comme populaire si featured
      isFeatured: product.featured || false
    }));

    res.json({
      success: true,
      products: enrichedProducts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice
      }
    });
  } catch (err) {
    console.error('Error fetching professional products:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des produits' 
    });
  }
});

// Route de debug pour lister les professionnels
router.get('/debug/list', async (req, res) => {
  try {
    const professionals = await Professional.find({}).populate('userId', 'firstName lastName email');
    res.json({
      success: true,
      count: professionals.length,
      professionals: professionals.map(p => ({
        id: p._id,
        businessName: p.businessName,
        userId: p.userId?._id,
        userEmail: p.userId?.email
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get professional profile statistics
router.get('/me/profile-stats', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const professionalId = professional._id;
    
    // Get total sessions count
    const totalSessions = await Session.countDocuments({
      professionalId: professionalId
    });

    // Get unique clients count from sessions and bookings
    const sessionClients = await Session.distinct('participants', {
      professionalId: professionalId
    });
    
    const bookingClients = await Booking.distinct('client', {
      professional: professionalId
    });
    
    // Combine and count unique clients
    const allClientIds = new Set([
      ...sessionClients.map(id => id.toString()),
      ...bookingClients.map(id => id.toString())
    ]);
    const totalClients = allClientIds.size;

    // Get products count
    const productsCount = await Product.countDocuments({
      professionalId: professionalId,
      status: 'approved'
    });

    // Get upcoming events count
    const upcomingEvents = await Event.countDocuments({
      professional: professional.userId,
      eventDate: { $gte: new Date() },
      status: 'active'
    });

    const stats = {
      totalSessions,
      totalClients,
      productsCount,
      upcomingEvents
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching professional profile stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;