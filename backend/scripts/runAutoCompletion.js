const mongoose = require('mongoose');
const SessionService = require('../services/sessionService');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function runAutoCompletion() {
  try {
    console.log('=== RUNNING SESSION AUTO-COMPLETION ===');
    
    const result = await SessionService.autoCompleteExpiredSessions();
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error running auto-completion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the auto-completion
runAutoCompletion(); 