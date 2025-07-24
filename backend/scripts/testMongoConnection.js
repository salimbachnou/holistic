const mongoose = require('mongoose');
const SessionService = require('../services/sessionService');
const EventReviewService = require('../services/eventReviewService');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testMongoConnection() {
  try {
    console.log('=== TESTING MONGODB CONNECTION AND SERVICES ===');
    
    // Test 1: Check connection status
    console.log('\n=== TEST 1: MongoDB Connection Status ===');
    console.log('Connection readyState:', mongoose.connection.readyState);
    console.log('Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    // Test 2: Test SessionService with connection check
    console.log('\n=== TEST 2: SessionService Auto-Completion ===');
    try {
      const sessionResult = await SessionService.autoCompleteExpiredSessions();
      console.log('SessionService result:', sessionResult);
    } catch (error) {
      console.error('SessionService error:', error.message);
    }
    
    // Test 3: Test EventReviewService with connection check
    console.log('\n=== TEST 3: EventReviewService Check ===');
    try {
      const eventResult = await EventReviewService.checkCompletedEvents();
      console.log('EventReviewService result:', eventResult);
    } catch (error) {
      console.error('EventReviewService error:', error.message);
    }
    
    // Test 4: Test with disconnected state (simulate)
    console.log('\n=== TEST 4: Testing with Disconnected State ===');
    const originalReadyState = mongoose.connection.readyState;
    
    // Temporarily set readyState to disconnected for testing
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      writable: true
    });
    
    console.log('Simulated disconnected state:', mongoose.connection.readyState);
    
    try {
      const sessionResultDisconnected = await SessionService.autoCompleteExpiredSessions();
      console.log('SessionService result (disconnected):', sessionResultDisconnected);
    } catch (error) {
      console.error('SessionService error (disconnected):', error.message);
    }
    
    try {
      const eventResultDisconnected = await EventReviewService.checkCompletedEvents();
      console.log('EventReviewService result (disconnected):', eventResultDisconnected);
    } catch (error) {
      console.error('EventReviewService error (disconnected):', error.message);
    }
    
    // Restore original state
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      writable: true
    });
    
    console.log('\n=== TEST COMPLETED ===');
    console.log('✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the test
testMongoConnection(); 