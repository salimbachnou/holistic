const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User'); // Ajouter le modèle User

async function listProfessionals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holisticcare');
    console.log('MongoDB connected');

    const professionals = await Professional.find({}).populate('userId', 'firstName lastName email');
    console.log('Professionnels existants:');
    professionals.forEach(p => {
      console.log(`ID: ${p._id}`);
      console.log(`Business: ${p.businessName}`);
      console.log(`User: ${p.userId?.email}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listProfessionals();
