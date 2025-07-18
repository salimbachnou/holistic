require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/**
 * Send review notifications for past events
 */
async function sendEventReviewNotifications() {
  try {
    console.log('=== Starting Event Review Notifications ===');
    
    // Get events that ended in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();
    
    // Find events that ended between yesterday and today
    const pastEvents = await Event.find({
      $or: [
        { endDate: { $gte: yesterday, $lt: today } },
        { date: { $gte: yesterday, $lt: today }, endDate: { $exists: false } }
      ],
      status: 'approved',
      'participants.0': { $exists: true } // Has at least one participant
    }).populate('participants.user', 'firstName lastName email');
    
    console.log(`Found ${pastEvents.length} events that ended recently`);
    
    for (const event of pastEvents) {
      console.log(`\nProcessing event: ${event.title}`);
      
      // Get confirmed participants who haven't reviewed yet
      const confirmedParticipants = event.participants.filter(p => p.status === 'confirmed');
      console.log(`- ${confirmedParticipants.length} confirmed participants`);
      
      for (const participant of confirmedParticipants) {
        if (!participant.user) continue;
        
        // Check if user already reviewed this event
        const hasReviewed = event.reviews.some(
          review => review.user.toString() === participant.user._id.toString()
        );
        
        if (hasReviewed) {
          console.log(`  - ${participant.user.firstName} ${participant.user.lastName} already reviewed`);
          continue;
        }
        
        // Check if we already sent a review notification
        const existingNotification = await Notification.findOne({
          userId: participant.user._id,
          type: 'event_review_request',
          'data.eventId': event._id
        });
        
        if (existingNotification) {
          console.log(`  - Notification already sent to ${participant.user.firstName} ${participant.user.lastName}`);
          continue;
        }
        
        // Send notification
        try {
          await NotificationService.createClientNotification(
            participant.user._id,
            'Partagez votre expérience',
            `Comment s'est passé l'événement "${event.title}" ? Votre avis aide la communauté.`,
            'event_review_request',
            `/events/${event._id}`,
            {
              eventId: event._id,
              eventTitle: event.title,
              eventDate: event.date,
              canReview: true
            }
          );
          
          console.log(`  ✓ Notification sent to ${participant.user.firstName} ${participant.user.lastName}`);
        } catch (error) {
          console.error(`  ✗ Error sending notification to ${participant.user.firstName}:`, error.message);
        }
      }
    }
    
    console.log('\n=== Event Review Notifications Complete ===');
    
  } catch (error) {
    console.error('Error in sendEventReviewNotifications:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
sendEventReviewNotifications(); 