const Session = require('../models/Session');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Professional = require('../models/Professional');
const NotificationService = require('./notificationService');

class SessionReviewService {
  /**
   * Mark session as completed and trigger review requests
   * @param {string} sessionId - Session ID
   * @param {string} professionalUserId - Professional user ID
   */
  static async completeSession(sessionId, professionalUserId) {
    try {
      console.log('=== COMPLETING SESSION ===');
      console.log('Session ID:', sessionId);
      console.log('Professional User ID:', professionalUserId);

      // Find the session
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Verify professional ownership
      const professional = await Professional.findOne({ userId: professionalUserId });
      if (!professional || !session.professionalId.equals(professional._id)) {
        throw new Error('Access denied. You are not the owner of this session.');
      }

      // Update session status
      session.status = 'completed';
      await session.save();

      console.log('Session marked as completed');

      // Find all confirmed bookings for this session
      const confirmedBookings = await Booking.find({
        'service.sessionId': sessionId,
        status: 'confirmed'
      }).populate('client', 'firstName lastName email');

      console.log(`Found ${confirmedBookings.length} confirmed bookings to process`);

      // Update booking statuses and send review requests
      const reviewRequests = [];
      for (const booking of confirmedBookings) {
        try {
          // Update booking status to completed
          booking.status = 'completed';
          await booking.save();

          // Send review request notification
          await this.sendReviewRequest(booking, session, professional);
          reviewRequests.push({
            bookingId: booking._id,
            clientId: booking.client._id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            status: 'sent'
          });

          console.log(`Review request sent to ${booking.client.firstName} ${booking.client.lastName}`);
        } catch (error) {
          console.error(`Error processing booking ${booking._id}:`, error);
          reviewRequests.push({
            bookingId: booking._id,
            clientId: booking.client._id,
            clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown',
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: 'Session completed and review requests sent',
        session: session,
        reviewRequests: reviewRequests,
        totalParticipants: confirmedBookings.length
      };

    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  /**
   * Send review request notification to a client
   * @param {Object} booking - Booking object
   * @param {Object} session - Session object
   * @param {Object} professional - Professional object
   */
  static async sendReviewRequest(booking, session, professional) {
    try {
      // Create notification for the client
      await NotificationService.notifySessionReviewRequest(booking, session, professional);

      // Optional: Send email notification (if email service is available)
      // await EmailService.sendSessionReviewRequest(booking.client.email, session, professional);

      console.log(`Review request notification sent to client ${booking.client._id}`);
    } catch (error) {
      console.error('Error sending review request:', error);
      throw error;
    }
  }

  /**
   * Send review requests for a specific session (used by auto-completion)
   * @param {string} sessionId - Session ID
   * @param {string} professionalUserId - Professional user ID
   */
  static async sendReviewRequestsForSession(sessionId, professionalUserId) {
    try {
      console.log('=== SENDING REVIEW REQUESTS FOR SESSION ===');
      console.log('Session ID:', sessionId);
      console.log('Professional User ID:', professionalUserId);

      // Find the session
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Verify professional ownership
      const professional = await Professional.findOne({ userId: professionalUserId });
      if (!professional || !session.professionalId.equals(professional._id)) {
        throw new Error('Access denied. You are not the owner of this session.');
      }

      // Find all confirmed bookings for this session
      const confirmedBookings = await Booking.find({
        'service.sessionId': sessionId,
        status: 'confirmed'
      }).populate('client', 'firstName lastName email');

      console.log(`Found ${confirmedBookings.length} confirmed bookings to process`);

      // Update booking statuses and send review requests
      const reviewRequests = [];
      for (const booking of confirmedBookings) {
        try {
          // Update booking status to completed
          booking.status = 'completed';
          await booking.save();

          // Send review request notification
          await this.sendReviewRequest(booking, session, professional);
          reviewRequests.push({
            bookingId: booking._id,
            clientId: booking.client._id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            status: 'sent'
          });

          console.log(`Review request sent to ${booking.client.firstName} ${booking.client.lastName}`);
        } catch (error) {
          console.error(`Error processing booking ${booking._id}:`, error);
          reviewRequests.push({
            bookingId: booking._id,
            clientId: booking.client._id,
            clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown',
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: 'Review requests sent for session',
        reviewRequests: reviewRequests,
        totalParticipants: confirmedBookings.length
      };

    } catch (error) {
      console.error('Error sending review requests for session:', error);
      throw error;
    }
  }

  /**
   * Automatically complete sessions that have passed their end time
   */
  static async autoCompleteExpiredSessions() {
    try {
      // Check if MongoDB is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ [SESSION-REVIEW-AUTO-COMPLETE] Skipping - MongoDB not connected');
        return {
          success: true,
          message: 'MongoDB not connected',
          results: []
        };
      }

      console.log('=== AUTO COMPLETING EXPIRED SESSIONS ===');
      
      const now = new Date();
      
      // Find sessions that should be completed (past end time and still scheduled)
      const expiredSessions = await Session.find({
        status: 'scheduled',
        startTime: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } // 1 hour ago
      }).populate('professionalId', 'userId businessName');

      console.log(`Found ${expiredSessions.length} expired sessions to auto-complete`);

      const results = [];
      
      for (const session of expiredSessions) {
        try {
          // Calculate session end time
          const sessionEndTime = new Date(session.startTime.getTime() + (session.duration * 60 * 1000));
          
          // Only complete if session has actually ended
          if (sessionEndTime < now) {
            const result = await this.completeSession(session._id, session.professionalId.userId);
            results.push({
              sessionId: session._id,
              sessionTitle: session.title,
              status: 'completed',
              reviewRequestsSent: result.reviewRequests.length
            });
          }
        } catch (error) {
          console.error(`Error auto-completing session ${session._id}:`, error);
          results.push({
            sessionId: session._id,
            sessionTitle: session.title,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Auto-completed ${results.filter(r => r.status === 'completed').length} sessions`,
        results: results
      };

    } catch (error) {
      console.error('Error in auto-complete expired sessions:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a professional
   * @param {string} professionalUserId - Professional user ID
   */
  static async getReviewStats(professionalUserId) {
    try {
      const professional = await Professional.findOne({ userId: professionalUserId });
      if (!professional) {
        throw new Error('Professional not found');
      }

      // Get completed sessions count
      const completedSessions = await Session.countDocuments({
        professionalId: professional._id,
        status: 'completed'
      });

      // Get bookings with reviews
      const Review = require('../models/Review');
      const reviewsReceived = await Review.countDocuments({
        professionalId: professional._id,
        contentType: 'session'
      });

      // Get pending review requests (completed bookings without reviews)
      const completedBookings = await Booking.find({
        professional: professional._id,
        status: 'completed',
        'service.sessionId': { $exists: true }
      });

      let pendingReviews = 0;
      for (const booking of completedBookings) {
        const existingReview = await Review.findOne({
          clientId: booking.client,
          contentId: booking.service.sessionId,
          contentType: 'session'
        });
        if (!existingReview) {
          pendingReviews++;
        }
      }

      return {
        completedSessions,
        reviewsReceived,
        pendingReviews,
        reviewRate: completedSessions > 0 ? Math.round((reviewsReceived / completedSessions) * 100) : 0
      };

    } catch (error) {
      console.error('Error getting review stats:', error);
      throw error;
    }
  }

  /**
   * Send reminder for pending reviews
   * @param {string} professionalUserId - Professional user ID
   */
  static async sendReviewReminders(professionalUserId) {
    try {
      const professional = await Professional.findOne({ userId: professionalUserId });
      if (!professional) {
        throw new Error('Professional not found');
      }

      // Find completed bookings from the last 7 days without reviews
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const completedBookings = await Booking.find({
        professional: professional._id,
        status: 'completed',
        updatedAt: { $gte: oneWeekAgo },
        'service.sessionId': { $exists: true }
      }).populate('client', 'firstName lastName email')
        .populate('service.sessionId', 'title');

      const Review = require('../models/Review');
      const reminders = [];

      for (const booking of completedBookings) {
        // Check if review already exists
        const existingReview = await Review.findOne({
          clientId: booking.client._id,
          contentId: booking.service.sessionId,
          contentType: 'session'
        });

        if (!existingReview) {
          // Send reminder
          await NotificationService.notifySessionReviewReminder(booking, professional);
          reminders.push({
            clientId: booking.client._id,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`,
            sessionTitle: booking.service.sessionId.title
          });
        }
      }

      return {
        success: true,
        message: `Sent ${reminders.length} review reminders`,
        reminders: reminders
      };

    } catch (error) {
      console.error('Error sending review reminders:', error);
      throw error;
    }
  }
}

module.exports = SessionReviewService; 