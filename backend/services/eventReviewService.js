const Event = require('../models/Event');
const NotificationService = require('./notificationService');

class EventReviewService {
  /**
   * Check for recently completed events and send review notifications
   */
  static async checkCompletedEvents() {
    try {
      // Check if MongoDB is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ [EVENT-REVIEW] Skipping - MongoDB not connected');
        return { eventsChecked: 0, notificationsSent: 0 };
      }

      console.log('🔍 [EVENT-REVIEW] Checking for completed events...');
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      
      // Find events that ended in the last 24 hours (but not older than 3 days to avoid spam)
      const completedEvents = await Event.find({
        status: 'approved',
        endDate: {
          $gte: threeDaysAgo, // Not older than 3 days
          $lt: now // Already ended
        },
        'participants.0': { $exists: true }
      }).populate('participants.user', 'firstName lastName email');
      
      console.log(`📅 [EVENT-REVIEW] Found ${completedEvents.length} recently completed events`);
      
      let totalNotificationsSent = 0;
      
      for (const event of completedEvents) {
        console.log(`\n🎯 [EVENT-REVIEW] Processing event: ${event.title}`);
        
        // Get confirmed participants who haven't left a review yet
        const confirmedParticipants = event.participants.filter(p => 
          p.status === 'confirmed'
        );
        
        console.log(`👥 [EVENT-REVIEW] ${confirmedParticipants.length} confirmed participants found`);
        
        for (const participant of confirmedParticipants) {
          try {
            // Check if user already left a review for this event
            const existingReview = event.reviews.find(review => 
              review.user.toString() === participant.user._id.toString()
            );
            
            if (!existingReview) {
              // Check if we already sent a review notification for this event/user combination
              // This prevents sending multiple notifications for the same event
              const existingNotification = await require('../models/Notification').findOne({
                userId: participant.user._id,
                type: 'event_review_request',
                'data.eventId': event._id
              });
              
              if (!existingNotification) {
                console.log(`📧 [EVENT-REVIEW] Sending review notification to ${participant.user.firstName} ${participant.user.lastName}`);
                
                // Send review notification
                const notificationResult = await NotificationService.createClientNotification(
                  participant.user._id,
                  'Partagez votre expérience',
                  `Comment s'est passé l'événement "${event.title}" ? Votre avis aidera d'autres participants.`,
                  'event_review_request',
                  `/events/${event._id}`,
                  {
                    eventId: event._id,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventEndDate: event.endDate,
                    canReview: true
                  }
                );
                
                if (notificationResult) {
                  totalNotificationsSent++;
                  console.log(`✅ [EVENT-REVIEW] Notification sent successfully`);
                } else {
                  console.log(`❌ [EVENT-REVIEW] Failed to send notification`);
                }
              } else {
                console.log(`📬 [EVENT-REVIEW] Review notification already sent to ${participant.user.firstName} ${participant.user.lastName}`);
              }
            } else {
              console.log(`✅ [EVENT-REVIEW] ${participant.user.firstName} ${participant.user.lastName} has already reviewed this event`);
            }
          } catch (participantError) {
            console.error(`❌ [EVENT-REVIEW] Error processing participant ${participant.user._id}:`, participantError);
          }
        }
      }
      
      console.log(`\n✅ [EVENT-REVIEW] Completed events check finished. ${totalNotificationsSent} notifications sent.`);
      return { eventsChecked: completedEvents.length, notificationsSent: totalNotificationsSent };
    } catch (error) {
      console.error('❌ [EVENT-REVIEW] Error checking completed events:', error);
      return { error: error.message };
    }
  }

  /**
   * Send a manual review notification to a specific user for an event
   */
  static async sendManualReviewNotification(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user participated and confirmed
      const participation = event.participants.find(p => 
        p.user.toString() === userId.toString() && p.status === 'confirmed'
      );

      if (!participation) {
        throw new Error('User did not participate in this event or participation not confirmed');
      }

      // Check if user already reviewed
      const existingReview = event.reviews.find(review => 
        review.user.toString() === userId.toString()
      );

      if (existingReview) {
        throw new Error('User has already reviewed this event');
      }

      // Send notification
      const result = await NotificationService.createClientNotification(
        userId,
        'Partagez votre expérience',
        `Comment s'est passé l'événement "${event.title}" ? Votre avis aidera d'autres participants.`,
        'event_review_request',
        `/events/${event._id}`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          canReview: true,
          manual: true
        }
      );

      return result;
    } catch (error) {
      console.error('Error sending manual review notification:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for an event
   */
  static async getEventReviewStats(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const confirmedParticipants = event.participants.filter(p => p.status === 'confirmed').length;
      const totalReviews = event.reviews.length;
      const reviewRate = confirmedParticipants > 0 ? (totalReviews / confirmedParticipants * 100).toFixed(1) : 0;

      return {
        confirmedParticipants,
        totalReviews,
        reviewRate: `${reviewRate}%`,
        averageRating: event.stats.averageRating,
        pendingReviews: confirmedParticipants - totalReviews
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      throw error;
    }
  }
}

module.exports = EventReviewService; 