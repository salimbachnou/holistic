const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Booking = require('../models/Booking');
// VideoCallAccessLog removed - using external links only
const router = express.Router();
// JWT removed - no longer needed for video tokens

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
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all sessions (public)
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'startTime', 
      sortOrder = 'asc' 
    } = req.query;

    const query = {};

    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    } else {
      // Default to future sessions only if no date range specified
      query.startTime = { $gte: new Date() };
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default to only scheduled sessions
      query.status = 'scheduled';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await Session.find(query)
      .populate('professionalId', 'businessName businessType profileImage')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all sessions for a professional
router.get('/professional', requireAuth, requireProfessional, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { 
      startDate, 
      endDate, 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'startTime', 
      sortOrder = 'asc' 
    } = req.query;

    const query = { professionalId: professional._id };

    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await Session.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all sessions for the current user (client)
router.get('/my-sessions', requireAuth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'startTime', 
      sortOrder = 'asc' 
    } = req.query;

    // Find sessions where the user is a participant
    const query = { participants: req.user._id };

    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await Session.find(query)
      .populate('professionalId', 'businessName businessType profileImage')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get a specific session by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('professionalId', 'businessName userId')
      .populate('participants', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the user is the professional who created the session
    const professional = await Professional.findOne({ userId: req.user._id });
    const isProfessionalOwner = professional && 
      session.professionalId.equals(professional._id);

    // Check if the user is a participant
    const isParticipant = session.participants.some(
      participant => participant._id.equals(req.user._id)
    );

    // Only allow the professional who created the session, participants, or admins to view it
    if (!isProfessionalOwner && !isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new session
router.post('/', requireAuth, requireProfessional, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('maxParticipants').isNumeric().withMessage('Max participants must be a number'),
  body('price').isNumeric().withMessage('Price must be a number')
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

    const sessionData = {
      ...req.body,
      professionalId: professional._id
    };

    const session = new Session(sessionData);
    await session.save();

    // Add session reference to professional's sessions array
    professional.sessions.push(session._id);
    await professional.save();

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update a session
router.put('/:id', requireAuth, requireProfessional, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this session.'
      });
    }

    // Don't allow updating if the session is already in progress or completed
    if (session.status === 'in_progress' || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a session that is in progress or completed'
      });
    }

    const allowedFields = [
      'title', 'description', 'startTime', 'duration', 
      'maxParticipants', 'price', 'category', 'location', 
      'meetingLink', 'requirements', 'materials', 'notes'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // If the session time was updated, notify all participants
    if (req.body.startTime && req.body.startTime !== session.startTime.toISOString()) {
      // TODO: Implement notification logic here
      console.log('Session time updated, should notify participants');
    }

    res.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel a session
router.put('/:id/cancel', requireAuth, requireProfessional, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this session.'
      });
    }

    // Don't allow cancelling if the session is already completed
    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed session'
      });
    }

    // Update session status to cancelled
    session.status = 'cancelled';
    await session.save();

    // Notify all participants
    // TODO: Implement notification logic here
    console.log('Session cancelled, should notify participants');

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      session
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get session booking requests
router.get('/:id/bookings', requireAuth, requireProfessional, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this session.'
      });
    }

    // Get all bookings for this session
    const bookings = await Booking.find({
      'service.sessionId': session._id
    }).populate('client', 'firstName lastName email');

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching session bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Accept or decline a booking request
router.put('/bookings/:bookingId', requireAuth, requireProfessional, [
  body('status').isIn(['confirmed', 'cancelled']).withMessage('Status must be either confirmed or cancelled'),
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

    const { status } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !booking.professional.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this booking.'
      });
    }

    // Update booking status
    booking.status = status;
    
    if (status === 'confirmed') {
      // If the booking is for a session, add the client to session participants
      if (booking.service.sessionId) {
        const session = await Session.findById(booking.service.sessionId);
        if (session && !session.participants.includes(booking.client)) {
          session.participants.push(booking.client);
          await session.save();
        }
      }
    } else if (status === 'cancelled') {
      // If the booking is cancelled, update cancellation info
      booking.cancellation = {
        reason: req.body.reason || 'Cancelled by professional',
        cancelledBy: req.user._id,
        cancelledAt: new Date()
      };
      
      // If the booking is for a session, remove the client from session participants
      if (booking.service.sessionId) {
        const session = await Session.findById(booking.service.sessionId);
        if (session) {
          session.participants = session.participants.filter(
            participant => !participant.equals(booking.client)
          );
          await session.save();
        }
      }
    }

    await booking.save();

    // Notify the client
    try {
      const NotificationService = require('../services/notificationService');
      const populatedBooking = await Booking.findById(booking._id).populate('client', 'firstName lastName');
      
      if (status === 'confirmed') {
        await NotificationService.notifyClientBookingConfirmed(populatedBooking);
      } else if (status === 'cancelled') {
        await NotificationService.notifyClientBookingCancelled(populatedBooking, req.body.reason);
      }
    } catch (error) {
      console.error('Erreur lors de la notification client:', error);
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all sessions for a specific professional by ID (public)
router.get('/professional/:id', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      page = 1, 
      limit = 50, 
      sortBy = 'startTime', 
      sortOrder = 'asc' 
    } = req.query;

    // Check if professional exists
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    const query = { professionalId: req.params.id };

    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    } else {
      // Default to future sessions only if no date range specified
      query.startTime = { $gte: new Date() };
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default to only scheduled sessions
      query.status = 'scheduled';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await Session.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Video call routes removed - using external links only

module.exports = router; 