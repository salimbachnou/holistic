const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic-platform';

async function createTestProfessional() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Créer un utilisateur de test
    const testUser = new User({
      email: 'test.professional@example.com',
      firstName: 'Test',
      lastName: 'Professional',
      name: 'Test Professional',
      password: 'testpassword123',
      role: 'professional',
      isVerified: true
    });

    await testUser.save();
    console.log('✅ Utilisateur de test créé:', testUser.email);

    // Créer un professionnel de test
    const testProfessional = new Professional({
      userId: testUser._id,
      businessName: 'Test Wellness Center',
      businessType: 'yoga',
      title: 'Professeur de Yoga',
      description: 'Professionnel de test pour les images de couverture',
      address: 'Casablanca, Morocco',
      contactInfo: {
        phone: '+212600000000',
        email: 'test.professional@example.com'
      },
      businessAddress: {
        street: '123 Test Street',
        city: 'Casablanca',
        country: 'Morocco',
        coordinates: {
          lat: 33.5731,
          lng: -7.5898
        }
      },
      isActive: true,
      isVerified: true,
      coverImages: [] // Commencer avec un tableau vide
    });

    await testProfessional.save();
    console.log('✅ Professionnel de test créé:', testProfessional.businessName);
    console.log('🆔 ID du professionnel:', testProfessional._id);

    console.log('\n✅ Professionnel de test créé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le script
createTestProfessional(); 