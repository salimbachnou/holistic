const mongoose = require('mongoose');
const Session = require('../models/Session');

async function markSessionsAsCompleted() {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    // Marquer toutes les sessions existantes comme terminées
    const result = await Session.updateMany(
      {},
      { status: 'completed' }
    );
    
    console.log('Sessions marquées comme terminées:', result.modifiedCount);
    
    // Vérifier les sessions
    const sessions = await Session.find({});
    console.log('Total sessions:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title} - ${session.status}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

markSessionsAsCompleted(); 