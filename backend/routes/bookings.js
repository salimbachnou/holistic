const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const Session = require('../models/Session');
const User = require('../models/User');
const router = express.Router();

// Middleware to require authentication
const requireAuth = passport.authenticate('jwt', { session: false });

// Create a new booking
router.post('/', requireAuth, [
  body('professionalId').notEmpty().withMessage('Professional ID is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    console.log('=== CREATING NEW BOOKING ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);
    console.log('User role:', req.user.role);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { professionalId, sessionId, notes, bookingType } = req.body;

    // Vérifier que les IDs sont valides
    if (!professionalId || !sessionId) {
      console.log('Missing required IDs:', { professionalId, sessionId });
      return res.status(400).json({
        success: false,
        message: 'Professional ID and Session ID are required'
      });
    }

    // Verify professional exists
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      console.log('Professional not found:', professionalId);
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    console.log('Professional found:', {
      id: professional._id,
      businessName: professional.businessName,
      userId: professional.userId
    });

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('Session found:', {
      id: session._id,
      title: session.title,
      professionalId: session.professionalId,
      participants: session.participants?.length || 0,
      maxParticipants: session.maxParticipants,
      status: session.status,
      startTime: session.startTime
    });

    // Check if session belongs to professional
    if (session.professionalId.toString() !== professionalId) {
      console.log('Session does not belong to professional');
      console.log('Session professionalId:', session.professionalId);
      console.log('Request professionalId:', professionalId);
      return res.status(400).json({
        success: false,
        message: 'Session does not belong to this professional'
      });
    }

    // Check if session is available (not in the past and not full)
    if (!session.canBeBooked()) {
      console.log('Session is not available for booking');
      console.log('Session status:', session.status);
      console.log('Session is past:', session.isPast());
      console.log('Session is full:', session.isFull);
      console.log('Participants:', session.participants?.length || 0, '/', session.maxParticipants);
      return res.status(400).json({
        success: false,
        message: 'Session is not available for booking'
      });
    }

    // Check if user already booked this session
    const existingBooking = await Booking.findOne({
      client: req.user._id,
      'service.sessionId': sessionId,
      status: { $ne: 'cancelled' } // <-- Permet de réserver à nouveau si la précédente est annulée
    });

    if (existingBooking) {
      console.log('User already booked this session');
      return res.status(409).json({
        success: false,
        message: 'You have already booked this session'
      });
    }

    // Generate booking data
    const bookingData = {
      client: req.user._id,
      professional: professionalId,
      service: {
        name: session.title,
        description: session.description,
        duration: session.duration,
        price: {
          amount: session.price,
          currency: 'MAD'
        },
        sessionId: session._id
      },
      appointmentDate: session.startTime,
      appointmentTime: {
        start: session.startTime.toISOString().substring(11, 16),
        end: new Date(session.startTime.getTime() + session.duration * 60000)
          .toISOString()
          .substring(11, 16)
      },
      location: {
        type: session.category === 'online' ? 'online' : 'in_person',
        address: session.category !== 'online' ? {
          street: session.location,
          city: professional.businessAddress?.city || 'Casablanca',
          postalCode: professional.businessAddress?.postalCode || '20000',
          country: professional.businessAddress?.country || 'Morocco'
        } : undefined,
        onlineLink: session.category === 'online' ? session.meetingLink : undefined
      },
      status: bookingType === 'message' ? 'pending' : (professional.bookingMode === 'auto' ? 'confirmed' : 'pending'),
      paymentStatus: 'pending',
      totalAmount: {
        amount: session.price,
        currency: 'MAD'
      },
      clientNotes: notes
    };

    console.log('Booking data to save:', JSON.stringify(bookingData, null, 2));

    // Create booking
    const booking = new Booking(bookingData);
    
    // Manually generate booking number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last booking of the day to generate sequential number
    const lastBooking = await Booking.findOne({
      bookingNumber: new RegExp(`^BK${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    booking.bookingNumber = `BK${year}${month}${day}${String(sequence).padStart(4, '0')}`;
    
    await booking.save();
    console.log('Booking saved successfully:', booking._id);

    // Add user to session participants for direct session bookings
    // For session bookings, add participant immediately since it's a direct booking
    if (sessionId) {
      // Check if user is not already a participant
      if (!session.participants.includes(req.user._id)) {
        session.participants.push(req.user._id);
        await session.save();
        console.log('User added to session participants');
      } else {
        console.log('User already in session participants');
      }
    } else if (booking.status === 'confirmed') {
      // For regular bookings, only add if confirmed
      session.participants.push(req.user._id);
      await session.save();
    }

    // Get client data for email
    const client = await User.findById(req.user._id);

    // Send email notifications
    try {
      const EmailService = require('../services/emailService');
      
      // Send confirmation email to client
      await EmailService.sendSessionBookingConfirmationToClient(booking, client, professional, session);
      console.log('Session booking confirmation email sent to client');
      
      // Send notification email to professional
      await EmailService.sendSessionBookingNotificationToProfessional(booking, client, professional, session);
      console.log('Session booking notification email sent to professional');
    } catch (emailError) {
      console.error('Error sending session booking emails:', emailError);
      // Don't fail the booking if email sending fails
    }

    // Déclencher la notification pour le professionnel
    try {
      const NotificationService = require('../services/notificationService');
      // Populate client data for notification
      const populatedBooking = await Booking.findById(booking._id).populate('client', 'firstName lastName');
      await NotificationService.notifyNewBooking(populatedBooking);
      console.log('Notification sent to professional');
    } catch (error) {
      console.error('Erreur lors de la notification de nouvelle réservation:', error);
    }

    console.log('=== BOOKING CREATION COMPLETED ===');
    console.log('Booking ID:', booking._id);
    console.log('Booking Number:', booking.bookingNumber);
    console.log('Session ID:', sessionId);
    console.log('Client ID:', req.user._id);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('=== BOOKING CREATION ERROR ===');
    console.error('Error creating booking:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Debug route to check all bookings for a professional
router.get('/professional/debug', requireAuth, async (req, res) => {
  try {
    // Check if user is a professional
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Professional role required.'
      });
    }

    // Find professional profile
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    console.log('=== DEBUG PROFESSIONAL BOOKINGS ===');
    console.log('Professional ID:', professional._id);
    console.log('User ID:', req.user._id);

    // Get ALL bookings for this professional
    const allBookings = await Booking.find({ professional: professional._id })
      .populate('client', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 });

    console.log(`Found ${allBookings.length} total bookings for professional`);
    
    allBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        client: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown',
        service: {
          name: booking.service?.name,
          sessionId: booking.service?.sessionId,
          hasSessionId: !!booking.service?.sessionId
        },
        status: booking.status,
        appointmentDate: booking.appointmentDate,
        createdAt: booking.createdAt
      });
    });

    // Count bookings with and without sessionId
    const withSessionId = allBookings.filter(b => b.service?.sessionId);
    const withoutSessionId = allBookings.filter(b => !b.service?.sessionId);

    console.log(`Bookings with sessionId: ${withSessionId.length}`);
    console.log(`Bookings without sessionId: ${withoutSessionId.length}`);

    res.json({
      success: true,
      debug: {
        professionalId: professional._id,
        totalBookings: allBookings.length,
        withSessionId: withSessionId.length,
        withoutSessionId: withoutSessionId.length,
        bookings: allBookings.map(booking => ({
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          client: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown',
          serviceName: booking.service?.name,
          hasSessionId: !!booking.service?.sessionId,
          sessionId: booking.service?.sessionId,
          status: booking.status,
          appointmentDate: booking.appointmentDate,
          createdAt: booking.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all session bookings for a professional
router.get('/professional/sessions', requireAuth, async (req, res) => {
  try {
    // Check if user is a professional
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Professional role required.'
      });
    }

    // Find professional profile
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional profile not found'
      });
    }

    const { status, page = 1, limit = 100, sortBy = 'appointmentDate', sortOrder = 'desc', includeAll = 'false' } = req.query;
    
    // Build query for bookings
    const query = { 
      professional: professional._id
    };
    
    // If includeAll is false, only show bookings with sessionId (session-specific bookings)
    // If includeAll is true, show all bookings
    if (includeAll === 'false') {
      query['service.sessionId'] = { $exists: true, $ne: null };
    }
    
    if (status) {
      query.status = status;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    console.log('=== FETCHING BOOKINGS ===');
    console.log('Query:', JSON.stringify(query));
    console.log('Sort:', sort);
    console.log('Limit:', limit, 'Page:', page);

    const bookings = await Booking.find(query)
      .populate('client', 'firstName lastName email phone profileImage')
      .populate({
        path: 'service.sessionId',
        model: 'Session',
        select: 'title description startTime duration category location meetingLink price maxParticipants',
        // Add strictPopulate: false to handle cases where sessionId might not exist
        options: { strictPopulate: false }
      })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`Found ${bookings.length} bookings`);
      
    // Transform bookings to include session details at the root level
    const transformedBookings = bookings.map(booking => {
      const session = booking.service.sessionId;
      return {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        client: booking.client,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        appointmentDate: booking.appointmentDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        notes: booking.clientNotes,
        cancellation: booking.cancellation,
        paymentMethod: booking.paymentMethod,
        service: {
          sessionId: session?._id,
          title: session?.title || booking.service.name,
          description: session?.description || booking.service.description,
          startTime: session?.startTime || booking.appointmentDate,
          duration: session?.duration || booking.service.duration,
          category: session?.category || 'individual',
          location: session?.location,
          meetingLink: session?.meetingLink,
          price: session?.price || booking.service.price?.amount || booking.totalAmount?.amount,
          maxParticipants: session?.maxParticipants
        }
      };
    });
      
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      bookings: transformedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching professional session bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all bookings for the authenticated user
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { client: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('professional', 'businessName businessType businessAddress')
      .sort({ appointmentDate: 'desc' })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get a specific booking
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('professional', 'businessName businessType businessAddress contactInfo userId')
      .populate('client', 'firstName lastName email profileImage');
      
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the user is authorized to view this booking
    if (
      booking.client._id.toString() !== req.user._id.toString() && 
      !booking.professional.userId.equals(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    res.json({
      success: true,
      booking
    });
    
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel a booking
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('professional', 'userId');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the user is authorized to cancel this booking
    if (
      booking.client.toString() !== req.user._id.toString() && 
      booking.professional && 
      !booking.professional.userId.equals(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled (not completed or already cancelled)
    if (
      booking.status === 'completed' || 
      booking.status === 'cancelled' ||
      booking.status === 'no_show'
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status: ${booking.status}`
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancellation = {
      reason: req.body.reason || 'No reason provided',
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };
    
    await booking.save();
    
    // Déclencher les notifications d'annulation
    try {
      const NotificationService = require('../services/notificationService');
      // Populate client data for notification
      const populatedBooking = await Booking.findById(booking._id).populate('client', 'firstName lastName');
      
      if (booking.client.toString() === req.user._id.toString()) {
        // Si c'est le client qui annule, notifier le professionnel
        await NotificationService.notifyBookingCancelled(populatedBooking);
      } else {
        // Si c'est le professionnel qui annule, notifier le client
        await NotificationService.notifyClientBookingCancelled(populatedBooking, req.body.reason);
      }
    } catch (error) {
      console.error('Erreur lors des notifications d\'annulation:', error);
    }
    
    // Remove user from session participants if applicable
    if (booking.service.sessionId) {
      const session = await Session.findById(booking.service.sessionId);
      if (session) {
        session.participants = session.participants.filter(
          participantId => participantId.toString() !== booking.client.toString()
        );
        await session.save();
      }
    }
    
    // Process refund if applicable
    if (booking.paymentStatus === 'paid' && req.body.refund) {
      // TODO: Implement refund processing
      booking.paymentStatus = 'refunded';
      booking.cancellation.refundAmount = {
        amount: booking.totalAmount.amount,
        currency: booking.totalAmount.currency
      };
      
      await booking.save();
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Process payment for a booking
router.post('/:id/payment', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the user is authorized to pay for this booking
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }
    
    // Check if booking can be paid (not cancelled or already paid)
    if (
      booking.status === 'cancelled' ||
      booking.status === 'no_show' ||
      booking.paymentStatus === 'paid' ||
      booking.paymentStatus === 'refunded'
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for a booking with status: ${booking.status} and payment status: ${booking.paymentStatus}`
      });
    }
    
    // TODO: Implement actual payment processing with a payment gateway
    // This is a simplified placeholder for demonstration
    booking.paymentStatus = 'paid';
    booking.paymentMethod = req.body.paymentMethod || 'credit_card';
    
    // If booking was pending and professional allows auto-confirm with payment
    const professional = await Professional.findById(booking.professional);
    if (
      booking.status === 'pending' && 
      professional && 
      professional.bookingMode === 'auto'
    ) {
      booking.status = 'confirmed';
    }
    
    await booking.save();
    
    // Si la réservation a été confirmée, envoyer une notification
    if (booking.status === 'confirmed') {
      try {
        const NotificationService = require('../services/notificationService');
        const populatedBooking = await Booking.findById(booking._id).populate('client', 'firstName lastName');
        await NotificationService.notifyClientBookingConfirmed(populatedBooking);
      } catch (error) {
        console.error('Erreur lors de la notification de confirmation:', error);
      }
    }
    
    // Get client data for email
    const client = await User.findById(booking.client);

    // Payment confirmation email disabled - using in-app notifications only
    console.log('Payment confirmation email disabled. Using in-app notifications only.');
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      booking
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 