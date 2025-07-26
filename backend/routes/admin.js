const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Import models
const User = require('../models/User');
const Professional = require('../models/Professional');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const ActivityType = require('../models/ActivityType');

// Import middleware
const { isAuthenticated } = require('../middleware/auth');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// ===================== AUTH ROUTES =====================

// Create default admin (run once)
router.post('/create-default', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Create default admin
    const admin = new User({
      email: 'admin@holistic.ma',
      password: 'admin123', // Will be hashed by pre-save hook
      firstName: 'Admin',
      lastName: 'Holistic',
      name: 'Admin Holistic',
      role: 'admin',
      isVerified: true
    });

    await admin.save();

    res.json({ 
      message: 'Default admin created successfully',
      email: 'admin@holistic.ma',
      password: 'admin123'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== DASHBOARD STATS =====================

router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfessionals,
      totalOrders,
      totalBookings,
      totalEvents,
      pendingContacts,
      monthlyRevenue,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Professional.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Booking.countDocuments(),
      Event.countDocuments(),
      Contact.countDocuments({ status: 'pending' }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount.amount' } } }
      ]),
      Order.find()
        .populate('clientId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      totalUsers,
      totalProfessionals,
      totalOrders,
      totalBookings,
      totalEvents,
      pendingContacts,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== ANALYTICS DATA =====================

// Get analytics data for admin dashboard
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    // Determine date range based on timeRange
    const endDate = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'quarter':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Generate date labels for the charts
    const dateLabels = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateLabels.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get user registration data
    const userRegistrationData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          role: 'client'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get booking data
    const bookingData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get order data
    const orderData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get event data
    const eventData = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get professional data by category
    const professionalData = await Professional.aggregate([
      {
        $match: {
          isActive: true,
          isVerified: true
        }
      },
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Format data for charts
    const formatChartData = (data, labels) => {
      const dataMap = new Map(data.map(item => [item._id, item]));
      
      return labels.map(date => {
        const entry = dataMap.get(date);
        return entry ? entry.count : 0;
      });
    };
    
    // Format revenue data
    const formatRevenueData = (data, labels) => {
      const dataMap = new Map(data.map(item => [item._id, item]));
      
      return labels.map(date => {
        const entry = dataMap.get(date);
        return entry ? entry.revenue : 0;
      });
    };
    
    // Prepare response
    const analyticsData = {
      userStats: {
        labels: dateLabels.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: 'Nouveaux utilisateurs',
            data: formatChartData(userRegistrationData, dateLabels),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      bookingStats: {
        labels: dateLabels.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: 'Réservations',
            data: formatChartData(bookingData, dateLabels),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          },
        ],
      },
      revenueStats: {
        labels: dateLabels.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: 'Revenus (MAD)',
            data: formatRevenueData([...bookingData, ...orderData], dateLabels),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      orderStats: {
        labels: dateLabels.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: 'Commandes',
            data: formatChartData(orderData, dateLabels),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
          },
        ],
      },
      eventStats: {
        labels: dateLabels.map(date => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: 'Événements',
            data: formatChartData(eventData, dateLabels),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      professionalStats: {
        labels: professionalData.map(item => {
          // Convert businessType to more readable format
          const typeMap = {
            'yoga': 'Yoga',
            'meditation': 'Méditation',
            'naturopathy': 'Naturopathie',
            'massage': 'Massage',
            'acupuncture': 'Acupuncture',
            'osteopathy': 'Ostéopathie',
            'chiropractic': 'Chiropratique',
            'nutrition': 'Nutrition',
            'psychology': 'Psychologie',
            'coaching': 'Coaching',
            'reiki': 'Reiki',
            'aromatherapy': 'Aromathérapie',
            'reflexology': 'Réflexologie',
            'ayurveda': 'Ayurveda',
            'hypnotherapy': 'Hypnothérapie',
            'other': 'Autre'
          };
          return typeMap[item._id] || item._id;
        }),
        datasets: [
          {
            label: 'Professionnels par catégorie',
            data: professionalData.map(item => item.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
    };
    
    // Get overall stats for the period
    const [
      totalUsers,
      totalProfessionals,
      totalOrders,
      totalBookings,
      totalEvents,
      monthlyRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Professional.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Booking.countDocuments(),
      Event.countDocuments(),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount.amount' } } }
      ])
    ]);
    
    // Calculate growth percentages (mock for now, could be calculated from historical data)
    const calculateGrowth = () => {
      return `+${Math.floor(Math.random() * 15) + 5}%`;
    };
    
    const stats = {
      totalUsers,
      totalProfessionals,
      totalOrders,
      totalBookings,
      totalEvents,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      userGrowth: calculateGrowth(),
      professionalGrowth: calculateGrowth(),
      orderGrowth: calculateGrowth(),
      bookingGrowth: calculateGrowth(),
      revenueGrowth: calculateGrowth(),
    };
    
    res.json({
      analyticsData,
      stats
    });
  } catch (error) {
    console.error('Analytics data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== PROFESSIONAL MANAGEMENT =====================

// Get all professionals with filters
router.get('/professionals', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      businessType,
      isVerified,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }
    if (businessType) query.businessType = businessType;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone createdAt'
      }
    };

    const professionals = await Professional.paginate(query, options);
    res.json(professionals);
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create professional account
router.post('/professionals', requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('businessName').notEmpty().trim(),
  body('businessType').notEmpty().trim(),
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email, firstName, lastName, password, businessName, 
      businessType, phone, description
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user account
    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: password || 'holistic123', // Default password if none provided
      phone,
      role: 'professional',
      isVerified: true
    });

    await user.save();

    // Create professional profile
    const professional = new Professional({
      userId: user._id,
      businessName,
      businessType,
      title: businessName,
      description,
      address: "À définir",
      contactInfo: { phone },
      isVerified: true,
      isActive: true
    });

    await professional.save();

    // Populate user data
    await professional.populate('userId', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Professional account created successfully',
      professional,
      credentials: {
        email,
        password: password || 'holistic123'
      }
    });
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update professional
router.put('/professionals/:id', requireAdmin, async (req, res) => {
  try {
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    res.json(professional);
  } catch (error) {
    console.error('Update professional error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete professional
router.delete('/professionals/:id', requireAdmin, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Also delete the associated user account
    await User.findByIdAndDelete(professional.userId);
    await Professional.findByIdAndDelete(req.params.id);

    res.json({ message: 'Professional account deleted successfully' });
  } catch (error) {
    console.error('Delete professional error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== CLIENT MANAGEMENT =====================

// Get all clients with filters
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role = 'client',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { role };
    
    // Apply filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [clients, totalClients, verified, unverified, newThisMonth] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('bookings', 'bookingNumber status appointmentDate totalAmount')
        .populate('orders', 'orderNumber status totalAmount'),
      User.countDocuments(query),
      User.countDocuments({ ...query, isVerified: true }),
      User.countDocuments({ ...query, isVerified: false }),
      User.countDocuments({ 
        ...query, 
        createdAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        } 
      })
    ]);

    const stats = {
      total: totalClients,
      verified,
      unverified,
      newThisMonth
    };

    res.json({
      clients,
      totalPages: Math.ceil(totalClients / limit),
      currentPage: parseInt(page),
      stats
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle client verification status
router.patch('/clients/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const client = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'client' },
      { isVerified },
      { new: true }
    ).select('-password');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client verification status updated', client });
  } catch (error) {
    console.error('Update client verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
router.delete('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const client = await User.findOneAndDelete({ _id: req.params.id, role: 'client' });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get client details by ID
router.get('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const client = await User.findOne({ _id: req.params.id, role: 'client' })
      .select('-password')
      .populate('bookings', 'bookingNumber status appointmentDate totalAmount')
      .populate('orders', 'orderNumber status totalAmount');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== CONTACT MANAGEMENT =====================

// Get all contacts with filters and stats
router.get('/contacts', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status === 'pending') query.isProcessed = false;
    if (status === 'processed') query.isProcessed = true;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [contacts, totalContacts, professional, information, pending, processed] = await Promise.all([
      Contact.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('processedBy', 'firstName lastName'),
      Contact.countDocuments(query),
      Contact.countDocuments({ type: 'professional' }),
      Contact.countDocuments({ type: 'information' }),
      Contact.countDocuments({ isProcessed: false }),
      Contact.countDocuments({ isProcessed: true })
    ]);

    const stats = {
      total: totalContacts,
      professional,
      information,
      pending,
      processed
    };

    res.json({
      contacts,
      totalPages: Math.ceil(totalContacts / limit),
      currentPage: parseInt(page),
      stats
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark contact as read
router.patch('/contacts/:id/read', requireAdmin, async (req, res) => {
  try {
    const { isRead } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact read status updated', contact });
  } catch (error) {
    console.error('Update contact read status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark contact as processed/unprocessed
router.patch('/contacts/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isProcessed } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        isProcessed,
        processedBy: isProcessed ? req.user._id : null,
        processedAt: isProcessed ? new Date() : null
      },
      { new: true }
    ).populate('processedBy', 'firstName lastName');

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact status updated', contact });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact
router.delete('/contacts/:id', requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to contact
router.post('/contacts/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { message, responseType = 'email' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Create response object
    const response = {
      adminId: req.user._id,
      message: message.trim(),
      responseType,
      sentAt: new Date(),
      isSent: false
    };

    // Add response to contact
    contact.responses.push(response);
    
    // Mark as processed if not already
    if (!contact.isProcessed) {
      contact.isProcessed = true;
      contact.processedBy = req.user._id;
      contact.processedAt = new Date();
    }

    await contact.save();

    // Send email if response type is email
    if (responseType === 'email') {
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: contact.email,
          subject: `Réponse à votre demande - Holistic.ma`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d5a87;">Réponse à votre demande</h2>
              <p>Bonjour ${contact.type === 'professional' ? contact.businessName : `${contact.firstName} ${contact.lastName}`},</p>
              <p>Nous avons bien reçu votre demande et nous vous répondons ci-dessous :</p>
              <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2d5a87; margin: 15px 0;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
              <p>Si vous avez d'autres questions, n'hésitez pas à nous contacter.</p>
              <p>Cordialement,<br/>L'équipe Holistic.ma</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        
        // Update response as sent
        const lastResponse = contact.responses[contact.responses.length - 1];
        lastResponse.isSent = true;
        lastResponse.sentAt = new Date();
        await contact.save();
        
      } catch (emailError) {
        console.error('Error sending email response:', emailError);
        response.errorMessage = emailError.message;
        await contact.save();
      }
    }

    // Create notification for the user if they have an account
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      
      // Find user by email
      const user = await User.findOne({ email: contact.email });
      
      if (user) {
        // Create notification
        const notification = new Notification({
          userId: user._id,
          title: 'Réponse à votre demande',
          message: `L'équipe Holistic.ma a répondu à votre demande de contact.`,
          type: 'contact_response',
          data: {
            contactId: contact._id,
            adminResponse: message.trim(),
            responseType: responseType,
            originalMessage: contact.message || contact.activityType || 'Pas de message'
          },
          link: '/contact'
        });
        
        await notification.save();
        
        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user._id}`).emit('receive-notification', {
            type: 'contact_response',
            title: 'Réponse à votre demande',
            message: `L'équipe Holistic.ma a répondu à votre demande de contact.`,
            data: notification.data
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Populate the response with admin info
    await contact.populate('responses.adminId', 'firstName lastName');

    res.json({ 
      message: 'Response sent successfully', 
      contact,
      response: contact.responses[contact.responses.length - 1]
    });
  } catch (error) {
    console.error('Respond to contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contact responses
router.get('/contacts/:id/responses', requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('responses.adminId', 'firstName lastName');
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ responses: contact.responses });
  } catch (error) {
    console.error('Get contact responses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== PRODUCT MANAGEMENT =====================

// Get all products with filters and stats
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
      if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
      const [products, totalProducts, approved, pending, rejected] = await Promise.all([
      Product.find(query)
        .populate('professionalId', 'businessName userId')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
      Product.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'rejected' })
    ]);

    const stats = {
      total: totalProducts,
      approved,
      pending,
      rejected: 0 // We don't have a rejected field in our model, so keeping it 0
    };

    res.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      stats
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product details
router.get('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('professionalId', 'businessName userId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    await product.populate('professionalId', 'businessName userId');
    
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('professionalId', 'businessName userId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle product approval status
router.patch('/products/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('professionalId', 'businessName userId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product approval status updated', product });
  } catch (error) {
    console.error('Update product approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== ORDER MANAGEMENT =====================

// Get all orders with filters
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate('clientId', 'firstName lastName email phone')
        .populate('items.product', 'name')
        .populate('items.professional', 'businessName')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      totalOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, tracking } = req.body;
    
    const updateData = { status };
    if (adminNotes) updateData['notes.admin'] = adminNotes;
    if (tracking) updateData.tracking = tracking;
    
    // Add to timeline
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.timeline.push({
      status,
      note: adminNotes,
      updatedBy: req.user._id
    });
    
    Object.assign(order, updateData);
    await order.save();
    
    await order.populate('clientId', 'firstName lastName email phone');
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== BOOKING MANAGEMENT =====================

// Get all bookings with filters
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      professional,
      dateFrom,
      dateTo,
      sortBy = 'appointmentDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (professional) query.professional = professional;
    
    if (dateFrom || dateTo) {
      query.appointmentDate = {};
      if (dateFrom) query.appointmentDate.$gte = new Date(dateFrom);
      if (dateTo) query.appointmentDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    
    const [bookings, totalBookings, pendingCount, confirmedCount, completedCount, cancelledCount] = await Promise.all([
      Booking.find(query)
        .populate('client', 'firstName lastName email phone')
        .populate('professional', 'businessName userId businessType')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
      Booking.countDocuments({ ...query, status: 'pending' }),
      Booking.countDocuments({ ...query, status: 'confirmed' }),
      Booking.countDocuments({ ...query, status: 'completed' }),
      Booking.countDocuments({ ...query, status: 'cancelled' })
    ]);

    const stats = {
      total: totalBookings,
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount
    };

    res.json({
      bookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: parseInt(page),
      totalBookings,
      stats
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking details
router.get('/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'firstName lastName email phone')
      .populate('professional', 'businessName userId businessType');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
router.put('/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    
    await booking.save();
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a booking (admin only)
router.put('/bookings/:bookingId/cancel', requireAdmin, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Session = require('../models/Session');
    
    const booking = await Booking.findById(req.params.bookingId)
      .populate('client', 'firstName lastName email')
      .populate('professional', 'businessName');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Réservation non trouvée' 
      });
    }
    
    // Update booking status to cancelled
    booking.status = 'cancelled';
    booking.cancellation = {
      reason: req.body.reason || 'Annulée par l\'administrateur',
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };
    
    await booking.save();
    
    // If the booking is for a session, remove the client from session participants
    if (booking.service.sessionId) {
      const session = await Session.findById(booking.service.sessionId);
      if (session) {
        session.participants = session.participants.filter(
          participant => !participant.equals(booking.client._id)
        );
        await session.save();
      }
    }
    
    // Send notification to client about cancellation
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyClientBookingCancelled(booking, req.body.reason);
    } catch (error) {
      console.error('Erreur lors de la notification client:', error);
    }
    
    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'annulation de la réservation' 
    });
  }
});

// ===================== EVENT MANAGEMENT =====================

// Fetch events for admin
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    // Populate professional details
    const events = await Event.find(query)
      .populate('professional', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Count total events for pagination
    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
      },
    });
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

// ===================== SESSION MANAGEMENT =====================

// Fetch sessions for admin
router.get('/sessions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', status = '', category = '' } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }

    // Import Session model
    const Session = require('../models/Session');
    
    // Populate professional details
    const sessions = await Session.find(query)
      .populate('professionalId', 'businessName firstName lastName email userId')
      .populate('participants', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Count total sessions for pagination
    const total = await Session.countDocuments(query);

    // Get stats
    const [scheduled, completed, cancelled, inProgress] = await Promise.all([
      Session.countDocuments({ status: 'scheduled' }),
      Session.countDocuments({ status: 'completed' }),
      Session.countDocuments({ status: 'cancelled' }),
      Session.countDocuments({ status: 'in_progress' })
    ]);

    res.json({
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
      },
      stats: {
        total,
        scheduled,
        completed,
        cancelled,
        inProgress
      }
    });
  } catch (error) {
    console.error('Error fetching admin sessions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des sessions' });
  }
});

// Update session status
router.put('/sessions/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const Session = require('../models/Session');
    
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.status = status;
    await session.save();
    
    await session.populate('professionalId', 'businessName firstName lastName email');
    
    res.json({
      success: true,
      message: `Session ${status} successfully`,
      session
    });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve a session (admin)
// router.put('/sessions/:id/approve', requireAdmin, async (req, res) => {
//   try {
//     const Session = require('../models/Session');
//     const session = await Session.findById(req.params.id);
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }
//     session.confirmationStatus = 'approved';
//     await session.save();
//     res.json({ success: true, message: 'Session approved', session });
//   } catch (error) {
//     console.error('Approve session error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Reject a session (admin)
// router.put('/sessions/:id/reject', requireAdmin, async (req, res) => {
//   try {
//     const Session = require('../models/Session');
//     const session = await Session.findById(req.params.id);
//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }
//     session.confirmationStatus = 'rejected';
//     await session.save();
//     res.json({ success: true, message: 'Session rejected', session });
//   } catch (error) {
//     console.error('Reject session error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Get bookings for a session
router.get('/sessions/:id/bookings', requireAdmin, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const Booking = require('../models/Booking');
    
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Get all bookings for this session (including cancelled for display)
    const allBookings = await Booking.find({ 'service.sessionId': session._id })
      .populate('client', 'firstName lastName email')
      .populate('professional', 'businessName firstName lastName');
    
    // Get only active bookings (excluding cancelled)
    const activeBookings = allBookings.filter(booking => booking.status !== 'cancelled');
    
    const bookings = allBookings; // Show all bookings in modal for transparency
    
    res.json({
      success: true,
      bookings: bookings,
      count: bookings.length,
      activeCount: activeBookings.length
    });
  } catch (error) {
    console.error('Get session bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete session
router.delete('/sessions/:id', requireAdmin, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const Booking = require('../models/Booking');
    
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Session non trouvée' 
      });
    }
    
    // Check if there are any active bookings for this session (excluding cancelled)
    const activeBookings = await Booking.find({ 
      'service.sessionId': session._id,
      status: { $ne: 'cancelled' }
    }).populate('client', 'firstName lastName');
    
    if (activeBookings.length > 0) {
      const bookingDetails = activeBookings.map(booking => ({
        id: booking._id,
        clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Client inconnu',
        status: booking.status,
        createdAt: booking.createdAt
      }));
      
      return res.status(400).json({ 
        success: false,
        message: `Impossible de supprimer cette session. Elle a ${activeBookings.length} réservation(s) active(s). Veuillez d'abord annuler toutes les réservations.`,
        activeBookings: bookingDetails,
        sessionTitle: session.title
      });
    }
    
    await Session.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Session supprimée avec succès'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la suppression de la session' 
    });
  }
});

// Approve an event
router.put('/events/:id/approve', requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // TODO: Send notification to professional about event approval

    res.json({ message: 'Événement approuvé avec succès', event });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ message: 'Erreur lors de l\'approbation de l\'événement' });
  }
});

// Reject an event
router.put('/events/:id/reject', requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // TODO: Send notification to professional about event rejection

    res.json({ message: 'Événement rejeté avec succès', event });
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ message: 'Erreur lors du rejet de l\'événement' });
  }
});

// ===================== CLIENT VERIFICATION =====================

// Verify a client
router.put('/verify-client/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Find the user and update verification status
    const user = await User.findByIdAndUpdate(
      clientId, 
      { 
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user._id // The admin who verified
      }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    res.json({
      success: true,
      message: 'Client verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Client verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during client verification' 
    });
  }
});

// Get unverified clients
router.get('/unverified-clients', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    const query = { 
      role: 'client', 
      isVerified: false 
    };

    // Optional search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-password', // Exclude password
      sort: { createdAt: -1 }
    };

    const unverifiedClients = await User.paginate(query, options);
    
    res.json({
      success: true,
      ...unverifiedClients
    });
  } catch (error) {
    console.error('Fetch unverified clients error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching unverified clients' 
    });
  }
});

// ===================== SETTINGS MANAGEMENT =====================

// Get admin settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settingsDoc = await Settings.getSettings();
    
    res.json({
      success: true,
      settings: settingsDoc.settings
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update admin settings
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required'
      });
    }
    
    const updatedSettings = await Settings.updateSettings(settings);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings.settings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ===================== NOTIFICATIONS =====================

// Get admin notifications
router.get('/notifications', requireAdmin, async (req, res) => {
  try {
    // Extraire l'ID utilisateur du token JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId || decoded.sub || decoded.id;
    
    console.log('Admin notifications API: User ID from token:', userId);
    
    // Récupérer les notifications existantes
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('Admin notifications API: Found notifications:', notifications.length);
    
    // Si aucune notification n'existe, générer des notifications basées sur les données réelles
    if (notifications.length === 0) {
      // Récupérer les dernières commandes
      const recentOrders = await Order.find()
        .populate('clientId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5);
      
      // Récupérer les derniers professionnels inscrits
      const recentProfessionals = await Professional.find()
        .populate('userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(3);
      
      // Récupérer les derniers contacts
      const recentContacts = await Contact.find()
        .sort({ createdAt: -1 })
        .limit(3);
      
      // Récupérer les dernières réservations annulées
      const cancelledBookings = await Booking.find({ status: 'cancelled' })
        .populate('client', 'firstName lastName')
        .populate('professional', 'businessName')
        .sort({ 'cancellation.cancelledAt': -1 })
        .limit(3);
      
      console.log('Admin notifications API: Generating notifications from data');
      console.log('Admin notifications API: Recent orders:', recentOrders.length);
      console.log('Admin notifications API: Recent professionals:', recentProfessionals.length);
      console.log('Admin notifications API: Recent contacts:', recentContacts.length);
      console.log('Admin notifications API: Cancelled bookings:', cancelledBookings.length);
      
      // Créer des notifications pour les commandes récentes
      for (const order of recentOrders) {
        const clientName = order.clientId ? `${order.clientId.firstName} ${order.clientId.lastName}` : 'Un client';
        await createAdminNotification(
          'Nouvelle commande',
          `${clientName} a passé une nouvelle commande #${order.orderNumber}.`,
          'new_order',
          '/admin/orders',
          { orderId: order._id }
        );
      }
      
      // Créer des notifications pour les professionnels récents
      for (const professional of recentProfessionals) {
        const professionalName = professional.userId ? `${professional.userId.firstName} ${professional.userId.lastName}` : 'Un nouveau professionnel';
        await createAdminNotification(
          'Nouveau professionnel',
          `${professionalName} s'est inscrit et attend validation.`,
          'new_professional',
          '/admin/professionals',
          { professionalId: professional._id }
        );
      }
      
      // Créer des notifications pour les contacts récents
      for (const contact of recentContacts) {
        await createAdminNotification(
          'Nouveau message de contact',
          `Un nouveau message de contact a été reçu de ${contact.name}.`,
          'new_contact',
          '/admin/contacts',
          { contactId: contact._id }
        );
      }
      
      // Créer des notifications pour les réservations annulées
      for (const booking of cancelledBookings) {
        const clientName = booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Un client';
        const professionalName = booking.professional ? booking.professional.businessName : 'un professionnel';
        await createAdminNotification(
          'Session annulée',
          `Une session entre ${clientName} et ${professionalName} a été annulée.`,
          'session_cancelled',
          '/admin/bookings',
          { bookingId: booking._id }
        );
      }
      
      // Récupérer les nouvelles notifications créées
      const newNotifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      
      console.log('Admin notifications API: Generated notifications:', newNotifications.length);
      
      return res.json({
        success: true,
        notifications: newNotifications
      });
    }
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark admin notification as read
router.post('/notifications/:id/mark-read', requireAdmin, async (req, res) => {
  try {
    // Extraire l'ID utilisateur du token JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId || decoded.sub || decoded.id;
    
    console.log('Admin mark-read API: User ID from token:', userId);
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Mark all admin notifications as read
router.post('/notifications/mark-all-read', requireAdmin, async (req, res) => {
  try {
    // Extraire l'ID utilisateur du token JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId || decoded.sub || decoded.id;
    
    console.log('Admin mark-all-read API: User ID from token:', userId);
    
    await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create admin notification (utility function for the server)
const createAdminNotification = async (title, message, type, link = null, data = {}) => {
  try {
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    // Create a notification for each admin
    const notifications = [];
    for (const admin of adminUsers) {
      const notification = new Notification({
        userId: admin._id,
        title,
        message,
        type,
        link,
        data,
        read: false
      });
      
      await notification.save();
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return null;
  }
};

// Utility functions for specific notification types

// Notify admins about new orders
const notifyNewOrder = async (order) => {
  try {
    const client = await User.findById(order.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Un client';
    
    return await createAdminNotification(
      'Nouvelle commande',
      `${clientName} a passé une nouvelle commande #${order.orderNumber}.`,
      'new_order',
      '/admin/orders',
      { orderId: order._id }
    );
  } catch (error) {
    console.error('Error creating new order notification:', error);
  }
};

// Notify admins about cancelled orders
const notifyOrderCancelled = async (order) => {
  try {
    return await createAdminNotification(
      'Commande annulée',
      `La commande #${order.orderNumber} a été annulée.`,
      'order_cancelled',
      '/admin/orders',
      { orderId: order._id }
    );
  } catch (error) {
    console.error('Error creating order cancelled notification:', error);
  }
};

// Notify admins about cancelled sessions
const notifySessionCancelled = async (booking) => {
  try {
    const client = await User.findById(booking.clientId);
    const professional = await Professional.findById(booking.professionalId);
    
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Un client';
    const professionalName = professional ? professional.businessName : 'un professionnel';
    
    return await createAdminNotification(
      'Session annulée',
      `Une session entre ${clientName} et ${professionalName} a été annulée.`,
      'session_cancelled',
      '/admin/bookings',
      { bookingId: booking._id }
    );
  } catch (error) {
    console.error('Error creating session cancelled notification:', error);
  }
};

// Notify admins about new events
const notifyNewEvent = async (event) => {
  try {
    const professional = await Professional.findById(event.professionalId);
    const professionalName = professional ? professional.businessName : 'Un professionnel';
    
    return await createAdminNotification(
      'Nouvel événement créé',
      `${professionalName} a créé un nouvel événement "${event.title}".`,
      'new_event',
      '/admin/events',
      { eventId: event._id }
    );
  } catch (error) {
    console.error('Error creating new event notification:', error);
  }
};

// Notify admins about new contact messages
const notifyNewContact = async (contact) => {
  try {
    return await createAdminNotification(
      'Nouveau message de contact',
      `Un nouveau message de contact a été reçu de ${contact.name}.`,
      'new_contact',
      '/admin/contacts',
      { contactId: contact._id }
    );
  } catch (error) {
    console.error('Error creating new contact notification:', error);
  }
};

// Notify admins about new professional registrations
const notifyNewProfessional = async (professional) => {
  try {
    const user = await User.findById(professional.userId);
    const professionalName = user ? `${user.firstName} ${user.lastName}` : 'Un nouveau professionnel';
    
    return await createAdminNotification(
      'Nouveau professionnel',
      `${professionalName} s'est inscrit et attend validation.`,
      'new_professional',
      '/admin/professionals',
      { professionalId: professional._id }
    );
  } catch (error) {
    console.error('Error creating new professional notification:', error);
  }
};

// Route pour déclencher manuellement la vérification des événements terminés
router.post('/check-completed-events', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 [ADMIN] Manual check for completed events triggered by:', req.user.email);
    
    const EventReviewService = require('../services/eventReviewService');
    const result = await EventReviewService.checkCompletedEvents();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des événements terminés',
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Vérification des événements terminés effectuée avec succès',
      data: {
        eventsChecked: result.eventsChecked,
        notificationsSent: result.notificationsSent
      }
    });
  } catch (error) {
    console.error('Error in manual completed events check:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur du serveur lors de la vérification'
    });
  }
});

// Route pour obtenir les statistiques d'avis d'un événement
router.get('/events/:eventId/review-stats', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const EventReviewService = require('../services/eventReviewService');
    const stats = await EventReviewService.getEventReviewStats(req.params.eventId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting event review stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===================== ACTIVITY TYPES MANAGEMENT =====================

// Get all activity types
router.get('/activity-types', requireAdmin, async (req, res) => {
  try {
    const activityTypes = await ActivityType.find().sort({ order: 1, label: 1 });
    
    res.json({
      success: true,
      data: activityTypes
    });
  } catch (error) {
    console.error('Error fetching activity types:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types d\'activité'
    });
  }
});

// Create new activity type
router.post('/activity-types', requireAdmin, [
  body('value').notEmpty().withMessage('La valeur est requise'),
  body('label').notEmpty().withMessage('Le libellé est requis'),
  body('description').optional(),
  body('category').optional().isIn(['wellness', 'fitness', 'therapy', 'beauty', 'other']).withMessage('Catégorie invalide'),
  body('color').optional(),
  body('icon').optional(),
  body('order').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { value, label, description, category, color, icon, order } = req.body;

    // Check if activity type already exists
    const existingType = await ActivityType.findOne({ value: value.toLowerCase() });
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Un type d\'activité avec cette valeur existe déjà'
      });
    }

    const activityType = new ActivityType({
      value,
      label,
      description: description || '',
      category: category || 'wellness',
      color: color || '#059669',
      icon: icon || 'default',
      order: order || 0,
      createdBy: req.user._id
    });

    await activityType.save();

    res.status(201).json({
      success: true,
      message: 'Type d\'activité créé avec succès',
      data: activityType
    });
  } catch (error) {
    console.error('Error creating activity type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du type d\'activité'
    });
  }
});

// Update activity type
router.put('/activity-types/:id', requireAdmin, [
  body('label').optional().notEmpty().withMessage('Le libellé ne peut pas être vide'),
  body('description').optional(),
  body('category').optional().isIn(['wellness', 'fitness', 'therapy', 'beauty', 'other']).withMessage('Catégorie invalide'),
  body('color').optional(),
  body('icon').optional(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const activityType = await ActivityType.findById(req.params.id);
    if (!activityType) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'activité non trouvé'
      });
    }

    const updateData = { ...req.body };
    delete updateData.value; // Don't allow updating the value field

    Object.assign(activityType, updateData);
    await activityType.save();

    res.json({
      success: true,
      message: 'Type d\'activité mis à jour avec succès',
      data: activityType
    });
  } catch (error) {
    console.error('Error updating activity type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du type d\'activité'
    });
  }
});

// Delete activity type
router.delete('/activity-types/:id', requireAdmin, async (req, res) => {
  try {
    const activityType = await ActivityType.findById(req.params.id);
    if (!activityType) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'activité non trouvé'
      });
    }

    // Check if this activity type is being used by any professionals
    const professionalsUsingType = await Professional.countDocuments({ businessType: activityType.value });
    if (professionalsUsingType > 0) {
      return res.status(400).json({
        success: false,
        message: `Ce type d'activité est utilisé par ${professionalsUsingType} professionnel(s). Impossible de le supprimer.`
      });
    }

    await ActivityType.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Type d\'activité supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting activity type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du type d\'activité'
    });
  }
});

// Toggle activity type status
router.patch('/activity-types/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const activityType = await ActivityType.findById(req.params.id);
    if (!activityType) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'activité non trouvé'
      });
    }

    activityType.isActive = !activityType.isActive;
    await activityType.save();

    res.json({
      success: true,
      message: `Type d'activité ${activityType.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: activityType
    });
  } catch (error) {
    console.error('Error toggling activity type status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
});

module.exports = router;
module.exports.createAdminNotification = createAdminNotification;
module.exports.notifyNewOrder = notifyNewOrder;
module.exports.notifyOrderCancelled = notifyOrderCancelled;
module.exports.notifySessionCancelled = notifySessionCancelled;
module.exports.notifyNewEvent = notifyNewEvent;
module.exports.notifyNewContact = notifyNewContact;
module.exports.notifyNewProfessional = notifyNewProfessional; 