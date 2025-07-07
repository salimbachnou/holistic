const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { VideoCallAccessLog } = require('../models');
const router = express.Router();
const jwt = require('jsonwebtoken');

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

// Secure video call access route
router.get('/:id/video-access', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user._id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  try {
    // Find the session and populate necessary fields
    const session = await Session.findById(sessionId)
      .populate('professionalId', 'userId businessName')
      .populate('participants', 'firstName lastName');

    if (!session) {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: false,
          userAuthorized: false,
          timeWithinWindow: false
        },
        errorMessage: 'Session not found'
      });

      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the session is configured for built-in video
    if (!session.useBuiltInVideo) {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: false,
          userAuthorized: false,
          timeWithinWindow: false
        },
        errorMessage: 'Session not configured for built-in video',
        metadata: {
          sessionTitle: session.title,
          sessionStartTime: session.startTime
        }
      });

      return res.status(403).json({
        success: false,
        message: 'This session is not configured for built-in video calls'
      });
    }

    // Check if the session is active (within 30 minutes of start time)
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date(sessionStart.getTime() + (session.duration * 60000));
    const earlyJoinTime = new Date(sessionStart.getTime() - (30 * 60000)); // 30 minutes before

    const timeWithinWindow = now >= earlyJoinTime && now <= sessionEnd;
    const sessionActive = session.status === 'scheduled' || session.status === 'in_progress';

    if (now < earlyJoinTime) {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: sessionActive,
          userAuthorized: false,
          timeWithinWindow: false
        },
        errorMessage: 'Session not yet available',
        metadata: {
          sessionTitle: session.title,
          sessionStartTime: session.startTime
        }
      });

      return res.status(403).json({
        success: false,
        message: 'Session is not yet available. You can join 30 minutes before the start time.'
      });
    }

    if (now > sessionEnd) {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: false,
          userAuthorized: false,
          timeWithinWindow: false
        },
        errorMessage: 'Session has ended',
        metadata: {
          sessionTitle: session.title,
          sessionStartTime: session.startTime
        }
      });

      return res.status(403).json({
        success: false,
        message: 'This session has already ended'
      });
    }

    // Check if the session is cancelled
    if (session.status === 'cancelled') {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: false,
          userAuthorized: false,
          timeWithinWindow: timeWithinWindow
        },
        errorMessage: 'Session has been cancelled',
        metadata: {
          sessionTitle: session.title,
          sessionStartTime: session.startTime
        }
      });

      return res.status(403).json({
        success: false,
        message: 'This session has been cancelled'
      });
    }

    // Verify user authorization
    let isAuthorized = false;
    let userRole = 'client';
    let userName = `${req.user.firstName} ${req.user.lastName}`;

    // Check if user is the professional
    if (session.professionalId && 
        (session.professionalId.userId?.toString() === userId.toString() || 
         session.professionalId._id?.toString() === userId.toString())) {
      isAuthorized = true;
      userRole = 'professional';
      userName = session.professionalId.businessName || 'Professional';
    }

    // Check if user is a participant
    if (!isAuthorized) {
      const isParticipant = session.participants.some(participant => {
        const participantId = participant._id || participant;
        return participantId.toString() === userId.toString();
      });
      
      if (isParticipant) {
        isAuthorized = true;
        userRole = 'client';
      }
    }

    // Check if user is admin
    if (!isAuthorized && req.user.role === 'admin') {
      isAuthorized = true;
      userRole = 'admin';
      userName = 'Administrator';
    }

    if (!isAuthorized) {
      // Log access denied
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user.role,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        accessType: 'denied',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: true,
          sessionActive: sessionActive,
          userAuthorized: false,
          timeWithinWindow: timeWithinWindow
        },
        errorMessage: 'User not authorized for this session',
        metadata: {
          sessionTitle: session.title,
          sessionStartTime: session.startTime
        }
      });

      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this video call'
      });
    }

    // Generate a temporary access token for this video call session
    const videoAccessToken = jwt.sign(
      {
        sessionId: session._id,
        userId: userId,
        userRole: userRole,
        userName: userName,
        exp: Math.floor(sessionEnd.getTime() / 1000) // Token expires when session ends
      },
      process.env.JWT_SECRET || 'your_jwt_secret'
    );

    // Log successful access
    await VideoCallAccessLog.create({
      sessionId: sessionId,
      userId: userId,
      userRole: userRole,
      userName: userName,
      accessType: 'join',
      ipAddress,
      userAgent,
      tokenUsed: videoAccessToken.slice(-10), // Last 10 characters
      securityFlags: {
        tokenValid: true,
        sessionActive: sessionActive,
        userAuthorized: true,
        timeWithinWindow: timeWithinWindow
      },
      metadata: {
        sessionTitle: session.title,
        sessionStartTime: session.startTime,
        browserInfo: userAgent
      }
    });

    // Log the video call access
    console.log(`✅ Video call access granted: User ${userId} (${userRole}) joined session ${sessionId}`);

    // Return session data and access token
    res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        endTime: sessionEnd,
        duration: session.duration,
        professional: {
          id: session.professionalId.userId || session.professionalId._id,
          name: session.professionalId.businessName || 'Professional'
        },
        maxParticipants: session.maxParticipants,
        currentParticipants: session.participants.length
      },
      user: {
        id: userId,
        role: userRole,
        name: userName
      },
      videoAccessToken
    });

  } catch (error) {
    console.error('Error in video call access:', error);
    
    // Log security violation
    try {
      await VideoCallAccessLog.create({
        sessionId: sessionId,
        userId: userId,
        userRole: req.user?.role || 'unknown',
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        accessType: 'security_violation',
        ipAddress,
        userAgent,
        securityFlags: {
          tokenValid: false,
          sessionActive: false,
          userAuthorized: false,
          timeWithinWindow: false
        },
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log security violation:', logError);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while verifying video call access'
    });
  }
});

// Verify video call token route
router.post('/video-verify-token', async (req, res) => {
  try {
    const { videoAccessToken } = req.body;
    
    if (!videoAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Video access token is required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(videoAccessToken, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Check if the session still exists and is valid
    const session = await Session.findById(decoded.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is still active
    const now = new Date();
    const sessionEnd = new Date(new Date(session.startTime).getTime() + (session.duration * 60000));
    
    if (now > sessionEnd) {
      return res.status(403).json({
        success: false,
        message: 'Session has ended'
      });
    }

    if (session.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Session has been cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Video access token is valid',
      sessionId: decoded.sessionId,
      userId: decoded.userId,
      userRole: decoded.userRole,
      userName: decoded.userName
    });

  } catch (error) {
    console.error('Error verifying video token:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired video access token'
    });
  }
});

// Get video call access logs (admin only)
router.get('/video-access-logs', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      sessionId, 
      userId, 
      accessType,
      startDate,
      endDate 
    } = req.query;

    const query = {};
    
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;
    if (accessType) query.accessType = accessType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await VideoCallAccessLog.find(query)
      .populate('sessionId', 'title startTime duration')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await VideoCallAccessLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching video access logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 