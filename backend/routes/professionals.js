const express = require('express');
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
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Middleware to require authentication
const requireAuth = passport.authenticate('jwt', { session: false });

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
router.get('/products', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/products/:id', requireAuth, requireProfessional, async (req, res) => {
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
router.post('/products', requireAuth, requireProfessional, [
  body('title').not().isEmpty().withMessage('Title is required'),
  body('name').not().isEmpty().withMessage('Name is required'),
  body('description').not().isEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').isIn(['supplements', 'equipment', 'books', 'accessories', 'skincare', 'aromatherapy', 'other'])
    .withMessage('Invalid category'),
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
router.put('/products/:id', requireAuth, requireProfessional, async (req, res) => {
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
router.delete('/products/:id', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/orders', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/orders/:id', requireAuth, requireProfessional, async (req, res) => {
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
router.patch('/orders/:id/status', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/me/profile', requireAuth, requireProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email profileImage');

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
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
router.get('/me/stats', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/dashboard-stats', requireAuth, requireProfessional, async (req, res) => {
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
      professionalId: professional._id,
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    const currentMonthClientIds = [...new Set(currentMonthBookings.map(booking => 
      booking.clientId.toString()
    ))];
    
    // Get unique clients who booked sessions last month
    const prevMonthBookings = await Booking.find({
      professionalId: professional._id,
      createdAt: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
    });
    
    const prevMonthClientIds = [...new Set(prevMonthBookings.map(booking => 
      booking.clientId.toString()
    ))];
    
    // Calculate new clients (clients this month who weren't present last month)
    const newClients = currentMonthClientIds.filter(id => !prevMonthClientIds.includes(id));
    
    // Calculate client trend
    const clientTrend = prevMonthClientIds.length > 0
      ? Math.round(((currentMonthClientIds.length - prevMonthClientIds.length) / prevMonthClientIds.length) * 100)
      : 0;
    
    // Calculate revenue for current month
    const currentMonthOrders = await Order.find({
      professionalId: professional._id,
      status: 'completed',
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    const currentMonthRevenue = currentMonthOrders.reduce((total, order) => 
      total + order.totalAmount, 0
    );
    
    // Calculate revenue for previous month
    const prevMonthOrders = await Order.find({
      professionalId: professional._id,
      status: 'completed',
      createdAt: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
    });
    
    const prevMonthRevenue = prevMonthOrders.reduce((total, order) => 
      total + order.totalAmount, 0
    );
    
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
        title: session.title,
        participants: session.maxParticipants
      };
    });
    
    // Get recent messages
    const recentMessages = await Message.find({
      receiverId: req.user._id
    })
    .sort({ timestamp: -1 })
    .limit(3)
    .populate('senderId', 'firstName lastName')
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
        name: `${message.senderId.firstName} ${message.senderId.lastName.charAt(0)}.`,
        message: message.text.length > 30 ? message.text.substring(0, 30) + '...' : message.text,
        time: timeDisplay
      };
    });
    
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
      rating: {
        total: professional.rating.average.toFixed(1),
        trend: 'up', // Placeholder - would need historical data for actual trend
        trendValue: '+0.1' // Placeholder
      },
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
router.get('/clients', requireAuth, requireProfessional, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'all',
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
      
    // Find all products for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(product => product._id);
    
    // Find all orders that include this professional's products
    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
    .populate('clientId', 'firstName lastName email phone profileImage')
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
          tags: [],
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
        clientData.totalSpent += booking.totalAmount.amount;
      }

      // Add to upcoming or past sessions
      const sessionInfo = {
        id: booking._id,
        date: booking.appointmentDate,
        time: booking.appointmentTime.start,
        service: booking.service.name,
        payment: booking.totalAmount.amount,
        status: booking.status
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
            tags: [],
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
          clientData.totalSpent += session.price;
        }

        // Add to upcoming or past sessions
        const sessionInfo = {
          id: session._id,
          date: session.startTime,
          time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          service: session.title,
          payment: session.price,
          status: session.status
        };

        if (new Date(session.startTime) > new Date()) {
          clientData.upcomingSessions.push(sessionInfo);
        } else {
          clientData.pastSessions.push(sessionInfo);
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
      const totalSpentOnProducts = professionalItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone || '',
          image: client.profileImage || '',
          lastVisit: order.createdAt,
          totalSessions: 0,
          totalSpent: totalSpentOnProducts,
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
        clientData.totalSpent += totalSpentOnProducts;
        
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
          price: item.price
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
router.get('/clients/:id', requireAuth, requireProfessional, async (req, res) => {
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
    
    // Find all products for this professional
    const products = await Product.find({ professionalId: professional._id });
    const productIds = products.map(product => product._id);
    
    // Find all orders from this client that include this professional's products
    const orders = await Order.find({
      clientId: clientId,
      'items.product': { $in: productIds }
    }).populate('items.product', 'name title price images').sort({ createdAt: -1 });

    // If no bookings, sessions, or orders, this client doesn't belong to this professional
    if (bookings.length === 0 && sessions.length === 0 && orders.length === 0) {
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
        totalSpent += booking.totalAmount.amount;
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
        payment: booking.totalAmount.amount,
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
        totalSpent += session.price;
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
        payment: session.price,
        status: session.status,
        location: session.isOnline() ? { type: 'online', onlineLink: session.meetingLink } : { type: 'in_person', address: { street: session.location } }
      };

      if (new Date(session.startTime) > new Date()) {
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
      const totalSpentOnProducts = professionalItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      // Add to total spent
      totalSpent += totalSpentOnProducts;
      
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
          price: item.price
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

// Create professional profile
router.post('/profile', requireAuth, [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessType').isIn([
    'yoga', 'meditation', 'naturopathy', 'massage', 'acupuncture',
    'osteopathy', 'chiropractic', 'nutrition', 'psychology', 'coaching',
    'reiki', 'aromatherapy', 'reflexology', 'ayurveda', 'hypnotherapy',
    'sophrology', 'spa', 'beauty', 'wellness', 'fitness', 'therapist',
    'nutritionist', 'other'
  ]).withMessage('Valid business type is required'),
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
router.put('/profile', requireAuth, requireProfessional, async (req, res) => {
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
      'businessAddress', 'contactInfo', 'businessHours', 'address', 'title', 'activities'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Ensure businessAddress has all required fields
    if (updateData.businessAddress) {
      // Keep existing fields if not provided in the update
      updateData.businessAddress = {
        ...professional.businessAddress,
        ...updateData.businessAddress,
        // Ensure country is always set
        country: updateData.businessAddress.country || professional.businessAddress?.country || 'Morocco'
      };
    }

    // Ensure contactInfo has required fields
    if (updateData.contactInfo) {
      updateData.contactInfo = {
        ...professional.contactInfo,
        ...updateData.contactInfo
      };
    }

    const updatedProfessional = await Professional.findByIdAndUpdate(
      professional._id,
      updateData,
      { new: true }
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
      message: 'Server error'
    });
  }
});

// Add/Update service
router.post('/services', requireAuth, requireProfessional, [
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
router.put('/services/:serviceId', requireAuth, requireProfessional, async (req, res) => {
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
router.delete('/services/:serviceId', requireAuth, requireProfessional, async (req, res) => {
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
router.post('/profile/photo', requireAuth, requireProfessional, profilePhotoUpload.single('profilePhoto'), async (req, res) => {
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
router.get('/user/:userId', requireAuth, async (req, res) => {
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
router.put('/me/notifications', requireAuth, requireProfessional, async (req, res) => {
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
router.get('/me/notifications', requireAuth, requireProfessional, async (req, res) => {
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

module.exports = router;