const mongoose = require('mongoose');
const Session = require('../models/Session');

async function checkSessions() {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic_app');
    
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