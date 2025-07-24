const mongoose = require('mongoose');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');
const SessionService = require('../services/sessionService');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSessionAutoCompletion() {
  try {
    console.log('=== TESTING SESSION AUTO-COMPLETION ===');
    
    // Find a professional to create test sessions
    const professional = await Professional.findOne();
    if (!professional) {
      console.log('No professional found. Please create a professional first.');
      return;
    }
    
    console.log(`Using professional: ${professional.businessName}`);
    
    // Create test sessions with different end times
    const now = new Date();
    const testSessions = [
      {
        title: 'Test Session - Expired 1 hour ago',
        description: 'This session should be auto-completed',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        duration: 60, // 1 hour duration
        maxParticipants: 10,
        price: 50,
        category: 'individual',
        professionalId: professional._id,
        status: 'scheduled',
        confirmationStatus: 'approved'
      },
      {
        title: 'Test Session - Expired 30 minutes ago',
        description: 'This session should be auto-completed',
        startTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        duration: 60, // 1 hour duration
        maxParticipants: 10,
        price: 50,
        category: 'individual',
        professionalId: professional._id,
        status: 'scheduled',
        confirmationStatus: 'approved'
      },
      {
        title: 'Test Session - Still active',
        description: 'This session should NOT be auto-completed',
        startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        duration: 60, // 1 hour duration
        maxParticipants: 10,
        price: 50,
        category: 'individual',
        professionalId: professional._id,
        status: 'scheduled',
        confirmationStatus: 'approved'
      }
    ];
    
    console.log('Creating test sessions...');
    const createdSessions = [];
    for (const sessionData of testSessions) {
      const session = new Session(sessionData);
      await session.save();
      createdSessions.push(session);
      console.log(`Created session: ${session.title} (ID: ${session._id})`);
    }
    
    // Check initial status
    console.log('\n=== INITIAL STATUS ===');
    for (const session of createdSessions) {
      const endTime = new Date(session.startTime.getTime() + (session.duration * 60 * 1000));
      console.log(`${session.title}:`);
      console.log(`  - Status: ${session.status}`);
      console.log(`  - Start Time: ${session.startTime}`);
      console.log(`  - End Time: ${endTime}`);
      console.log(`  - Should be completed: ${endTime < now ? 'Yes' : 'No'}`);
    }
    
    // Run auto-completion
    console.log('\n=== RUNNING AUTO-COMPLETION ===');
    const result = await SessionService.autoCompleteExpiredSessions();
    console.log('Auto-completion result:', result);
    
    // Check final status
    console.log('\n=== FINAL STATUS ===');
    for (const session of createdSessions) {
      const updatedSession = await Session.findById(session._id);
      const endTime = new Date(updatedSession.startTime.getTime() + (updatedSession.duration * 60 * 1000));
      console.log(`${updatedSession.title}:`);
      console.log(`  - Status: ${updatedSession.status}`);
      console.log(`  - Start Time: ${updatedSession.startTime}`);
      console.log(`  - End Time: ${endTime}`);
      console.log(`  - Was completed: ${updatedSession.status === 'completed' ? 'Yes' : 'No'}`);
    }
    
    // Clean up test sessions
    console.log('\n=== CLEANING UP ===');
    for (const session of createdSessions) {
      await Session.findByIdAndDelete(session._id);
      console.log(`Deleted test session: ${session.title}`);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the test
testSessionAutoCompletion(); 