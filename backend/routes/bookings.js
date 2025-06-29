const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const Session = require('../models/Session');
const User = require('../models/User');
const emailService = require('../services/emailService');
const router = express.Router();

// Middleware to require authentication
const requireAuth = passport.authenticate('jwt', { session: false });

// Create a new booking
router.post('/', requireAuth, [
  body('professionalId').notEmpty().withMessage('Professional ID is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required')
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

    const { professionalId, sessionId, notes, bookingType } = req.body;

    // Verify professional exists
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session belongs to professional
    if (session.professionalId.toString() !== professionalId) {
      return res.status(400).json({
        success: false,
        message: 'Session does not belong to this professional'
      });
    }

    // Check if session is available (not in the past and not full)
    if (!session.canBeBooked()) {
      return res.status(400).json({
        success: false,
        message: 'Session is not available for booking'
      });
    }

    // Check if user already booked this session
    const existingBooking = await Booking.findOne({
      client: req.user._id,
      'service.sessionId': sessionId
    });

    if (existingBooking) {
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
          city: professional.businessAddress.city,
          postalCode: professional.businessAddress.postalCode,
          country: professional.businessAddress.country
        } : undefined,
        onlineLink: session.category === 'online' ? session.meetingLink : undefined
      },
      status: bookingType === 'message' ? 'pending' : 
             (professional.bookingMode === 'auto' ? 'confirmed' : 'pending'),
      paymentStatus: 'pending',
      totalAmount: {
        amount: session.price,
        currency: 'MAD'
      },
      clientNotes: notes
    };

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

    // Add user to session participants
    session.participants.push(req.user._id);
    await session.save();

    // Get client data for email
    const client = await User.findById(req.user._id);

    // Send email notifications
    try {
      // Send confirmation to client
      await emailService.sendBookingConfirmationToClient(booking, client, professional);
      
      // Send notification to professional
      await emailService.sendBookingNotificationToProfessional(booking, client, professional);
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
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
      .populate('professional', 'businessName businessType businessAddress contactInfo')
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
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if the user is authorized to cancel this booking
    if (
      booking.client.toString() !== req.user._id.toString() && 
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
    
    // Get client data for email
    const client = await User.findById(booking.client);

    // Send payment confirmation email
    try {
      await emailService.sendPaymentConfirmationEmail(booking, client, professional);
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Continue even if email fails
    }
    
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