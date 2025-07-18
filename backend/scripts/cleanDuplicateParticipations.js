const mongoose = require('mongoose');
const Event = require('../models/Event');

// Connect to MongoDB
mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const cleanDuplicateParticipations = async () => {
  try {
    console.log('🔍 Starting cleanup of duplicate participations...');
    
    const events = await Event.find({});
    let totalCleaned = 0;
    
    for (const event of events) {
      const participantMap = new Map();
      const participationsToKeep = [];
      
      // Group participations by user
      for (const participation of event.participants) {
        const userId = participation.user.toString();
        
        if (!participantMap.has(userId)) {
          participantMap.set(userId, []);
        }
        participantMap.get(userId).push(participation);
      }
      
      // For each user, keep only the most recent non-cancelled participation
      for (const [userId, participations] of participantMap) {
        if (participations.length > 1) {
          console.log(`🔍 User ${userId} has ${participations.length} participations in event ${event.title}`);
          
          // Sort by creation date (most recent first)
          participations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Find the most recent non-cancelled participation
          const activeParticipation = participations.find(p => p.status !== 'cancelled');
          
          if (activeParticipation) {
            // Keep the active participation
            participationsToKeep.push(activeParticipation);
            console.log(`✅ Keeping active participation with status: ${activeParticipation.status}`);
          } else {
            // Keep the most recent cancelled participation
            participationsToKeep.push(participations[0]);
            console.log(`✅ Keeping most recent cancelled participation`);
          }
          
          totalCleaned += participations.length - 1;
        } else {
          // Only one participation, keep it
          participationsToKeep.push(participations[0]);
        }
      }
      
      // Update the event with cleaned participations
      if (event.participants.length !== participationsToKeep.length) {
        console.log(`🔄 Updating event ${event.title}: ${event.participants.length} -> ${participationsToKeep.length} participations`);
        event.participants = participationsToKeep;
        await event.save();
      }
    }
    
    console.log(`✅ Cleanup completed! Removed ${totalCleaned} duplicate participations`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
  }
};

cleanDuplicateParticipations(); 