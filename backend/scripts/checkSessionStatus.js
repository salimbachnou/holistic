const mongoose = require('mongoose');
const Session = require('../models/Session');
const Professional = require('../models/Professional');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkSessionStatus() {
  try {
    console.log('=== CHECKING SESSION STATUS ===');
    
    const now = new Date();
    
    // Get all sessions
    const sessions = await Session.find()
      .populate('professionalId', 'businessName')
      .sort({ startTime: -1 });
    
    console.log(`Total sessions found: ${sessions.length}`);
    
    // Group by status
    const statusCounts = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
    
    const expiredSessions = [];
    const activeSessions = [];
    const futureSessions = [];
    
    for (const session of sessions) {
      statusCounts[session.status]++;
      
      const endTime = new Date(session.startTime.getTime() + (session.duration * 60 * 1000));
      const isExpired = endTime < now;
      
      if (isExpired && session.status === 'scheduled') {
        expiredSessions.push({
          id: session._id,
          title: session.title,
          professional: session.professionalId?.businessName || 'Unknown',
          startTime: session.startTime,
          endTime: endTime,
          duration: session.duration
        });
      } else if (session.status === 'scheduled' && session.startTime > now) {
        futureSessions.push({
          id: session._id,
          title: session.title,
          professional: session.professionalId?.businessName || 'Unknown',
          startTime: session.startTime,
          endTime: endTime,
          duration: session.duration
        });
      } else if (session.status === 'scheduled') {
        activeSessions.push({
          id: session._id,
          title: session.title,
          professional: session.professionalId?.businessName || 'Unknown',
          startTime: session.startTime,
          endTime: endTime,
          duration: session.duration
        });
      }
    }
    
    console.log('\n=== STATUS BREAKDOWN ===');
    console.log(`Scheduled: ${statusCounts.scheduled}`);
    console.log(`In Progress: ${statusCounts.in_progress}`);
    console.log(`Completed: ${statusCounts.completed}`);
    console.log(`Cancelled: ${statusCounts.cancelled}`);
    
    console.log('\n=== EXPIRED SESSIONS (should be auto-completed) ===');
    if (expiredSessions.length === 0) {
      console.log('No expired sessions found');
    } else {
      expiredSessions.forEach(session => {
        console.log(`- ${session.title} (${session.professional})`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Start: ${session.startTime}`);
        console.log(`  End: ${session.endTime}`);
        console.log(`  Duration: ${session.duration} minutes`);
      });
    }
    
    console.log('\n=== ACTIVE SESSIONS (currently running) ===');
    if (activeSessions.length === 0) {
      console.log('No active sessions found');
    } else {
      activeSessions.forEach(session => {
        console.log(`- ${session.title} (${session.professional})`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Start: ${session.startTime}`);
        console.log(`  End: ${session.endTime}`);
        console.log(`  Duration: ${session.duration} minutes`);
      });
    }
    
    console.log('\n=== FUTURE SESSIONS (upcoming) ===');
    if (futureSessions.length === 0) {
      console.log('No future sessions found');
    } else {
      futureSessions.slice(0, 5).forEach(session => {
        console.log(`- ${session.title} (${session.professional})`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Start: ${session.startTime}`);
        console.log(`  End: ${session.endTime}`);
        console.log(`  Duration: ${session.duration} minutes`);
      });
      if (futureSessions.length > 5) {
        console.log(`... and ${futureSessions.length - 5} more future sessions`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total sessions: ${sessions.length}`);
    console.log(`Expired sessions needing completion: ${expiredSessions.length}`);
    console.log(`Active sessions: ${activeSessions.length}`);
    console.log(`Future sessions: ${futureSessions.length}`);
    
  } catch (error) {
    console.error('Error checking session status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkSessionStatus(); 