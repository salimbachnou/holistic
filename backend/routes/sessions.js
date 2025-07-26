const express = require('express');
const passport = require('passport');
const { validationResult } = require('express-validator');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { 
  createSessionValidation, 
  updateSessionValidation, 
  getSessionsValidation,
  sessionIdValidation,
  bookingIdValidation 
} = require('../validators/sessionValidators');

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
      .populate({
        path: 'professionalId',
        select: 'businessName businessType profileImage',
        match: { isVerified: true, isActive: true }
      })
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Filter out sessions with unverified professionals
    const filteredSessions = sessions.filter(session => session.professionalId);

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions: filteredSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredSessions.length,
        pages: Math.ceil(filteredSessions.length / parseInt(limit))
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

    // Get sessions without reviews first
    const sessions = await Session.find(query)
      .sort(sort);

    // Import Review model to get reviews for each session
    const Review = require('../models/Review');

    // Add reviews to each session
    const sessionsWithReviews = await Promise.all(
      sessions.map(async (session) => {
        // Get reviews for this session
        const reviews = await Review.find({
          contentId: session._id,
          contentType: 'session',
          status: 'approved' // Only get approved reviews
        })
        .populate('clientId', 'firstName lastName')
        .sort({ createdAt: -1 });

        // Convert session to object and add reviews
        const sessionObj = session.toObject();
        sessionObj.reviews = reviews.map(review => ({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          clientName: review.clientId ? `${review.clientId.firstName} ${review.clientId.lastName}` : 'Client anonyme',
          professionalResponse: review.professionalResponse,
          respondedAt: review.respondedAt
        }));

        return sessionObj;
      })
    );

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions: sessionsWithReviews,
      pagination: {
        page: parseInt(page),
        limit: sessionsWithReviews.length,
        total,
        pages: 1
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

// Get a specific session by ID (with participation check for reviews)
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

    // Check if user has a confirmed booking for this session (for review purposes)
    const Booking = require('../models/Booking');
    const hasBooking = await Booking.findOne({
      'service.sessionId': session._id,
      client: req.user._id,
      status: { $in: ['confirmed', 'completed'] }
    });

    // Only allow the professional who created the session, participants, users with bookings, or admins to view it
    if (!isProfessionalOwner && !isParticipant && !hasBooking && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add participation info for review purposes
    const responseData = {
      success: true,
      session: {
        ...session.toObject(),
        userParticipated: !!(isParticipant || hasBooking),
        canReview: !!(hasBooking && session.status === 'completed')
      }
    };

    // If user participated, also populate professional info for reviews
    if (hasBooking) {
      responseData.session.professional = {
        _id: session.professionalId._id,
        businessName: session.professionalId.businessName,
        userId: session.professionalId.userId
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new session using SessionService with improved validation
router.post('/', requireAuth, requireProfessional, createSessionValidation, async (req, res) => {
  try {
    console.log('=== BACKEND SESSION CREATION DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.email);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Import SessionService
    const SessionService = require('../services/sessionService');
    
    // Create session using service
    const result = await SessionService.createSession(req.body, req.user);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors || []
      });
    }

    console.log('Session created successfully:', result.session._id);

    res.status(201).json({
      success: true,
      message: result.message,
      session: result.session
    });
  } catch (error) {
    console.error('=== BACKEND SESSION CREATION ERROR ===');
    console.error('Error creating session:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a session using SessionService with improved validation
router.put('/:id', requireAuth, requireProfessional, sessionIdValidation, updateSessionValidation, async (req, res) => {
  try {
    console.log('=== BACKEND SESSION UPDATE DEBUG ===');
    console.log('Session ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.email);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Import SessionService
    const SessionService = require('../services/sessionService');
    
    // Update session using service
    const result = await SessionService.updateSession(req.params.id, req.body, req.user);
    
    if (!result.success) {
      console.log('SessionService update failed:', result.message);
      console.log('Errors:', result.errors);
      return res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors || []
      });
    }

    console.log('Session updated successfully:', result.session._id);
    console.log('Updated session data:', JSON.stringify(result.session, null, 2));

    res.json({
      success: true,
      message: result.message,
      session: result.session
    });
  } catch (error) {
    console.error('=== BACKEND SESSION UPDATE ERROR ===');
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Complete a session and send review requests
router.put('/:id/complete', requireAuth, requireProfessional, async (req, res) => {
  try {
    console.log('=== COMPLETING SESSION ===');
    console.log('Session ID:', req.params.id);
    console.log('User:', req.user.email);

    const SessionReviewService = require('../services/sessionReviewService');
    
    const result = await SessionReviewService.completeSession(req.params.id, req.user._id);
    
    res.json({
      success: true,
      message: result.message,
      session: result.session,
      reviewRequests: result.reviewRequests,
      totalParticipants: result.totalParticipants
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Get review statistics for professional
router.get('/review-stats', requireAuth, requireProfessional, async (req, res) => {
  try {
    const SessionReviewService = require('../services/sessionReviewService');
    
    const stats = await SessionReviewService.getReviewStats(req.user._id);
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Send review reminders
router.post('/send-review-reminders', requireAuth, requireProfessional, async (req, res) => {
  try {
    const SessionReviewService = require('../services/sessionReviewService');
    
    const result = await SessionReviewService.sendReviewReminders(req.user._id);
    
    res.json({
      success: true,
      message: result.message,
      reminders: result.reminders
    });

  } catch (error) {
    console.error('Error sending review reminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Auto-complete expired sessions (admin/cron job)
router.post('/auto-complete-expired', requireAuth, async (req, res) => {
  try {
    // Only allow admin or system calls
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const SessionReviewService = require('../services/sessionReviewService');
    
    const result = await SessionReviewService.autoCompleteExpiredSessions();
    
    res.json({
      success: true,
      message: result.message,
      results: result.results
    });

  } catch (error) {
    console.error('Error auto-completing expired sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Manual session auto-completion (admin only)
router.post('/manual-auto-complete', requireAuth, async (req, res) => {
  try {
    // Only allow admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const SessionService = require('../services/sessionService');
    
    const result = await SessionService.autoCompleteExpiredSessions();
    
    res.json({
      success: true,
      message: result.message,
      results: result.results
    });

  } catch (error) {
    console.error('Error in manual session auto-completion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
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
    console.log('=== FETCHING SESSION BOOKINGS ===');
    console.log('Session ID:', req.params.id);
    console.log('User ID:', req.user._id);

    const session = await Session.findById(req.params.id);
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      console.log('Access denied - not the owner of this session');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this session.'
      });
    }

    // Get all bookings for this session with more detailed query
    const bookings = await Booking.find({
      'service.sessionId': session._id
    })
    .populate('client', 'firstName lastName email')
    .sort({ createdAt: -1 }); // Trier par date de création, les plus récentes en premier

    console.log(`Found ${bookings.length} bookings for session ${session._id}`);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        status: booking.status,
        client: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown',
        createdAt: booking.createdAt,
        sessionId: booking.service?.sessionId
      });
    });

    res.json({
      success: true,
      bookings,
      sessionInfo: {
        id: session._id,
        title: session.title,
        participantsCount: session.participants?.length || 0,
        maxParticipants: session.maxParticipants
      }
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
router.put('/bookings/:bookingId', requireAuth, requireProfessional, bookingIdValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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