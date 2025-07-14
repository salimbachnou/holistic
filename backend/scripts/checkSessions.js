const mongoose = require('mongoose');
const Session = require('../models/Session');

async function checkSessions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/holistic_app');
    
    const sessions = await Session.find({}).populate('professionalId', 'businessName');
    console.log('Sessions trouvées:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title} - ${session.status} - ${session.startTime} - Prof: ${session.professionalId?.businessName || 'Unknown'}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkSessions(); 