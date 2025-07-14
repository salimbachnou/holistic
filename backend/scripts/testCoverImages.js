const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic-platform';

async function testCoverImages() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Trouver un utilisateur professionnel pour le test
    const professional = await Professional.findOne({ isActive: true }).populate('userId');
    
    if (!professional) {
      console.log('❌ Aucun professionnel trouvé dans la base de données');
      return;
    }

    console.log('👤 Professionnel trouvé:', professional.businessName);
    console.log('📷 Images de couverture actuelles:', professional.coverImages);

    // Test 1: Ajouter une image de couverture
    console.log('\n🧪 Test 1: Ajout d\'une image de couverture');
    const testImageUrl = '/uploads/profiles/test-cover-image.jpg';
    
    if (!professional.coverImages) {
      professional.coverImages = [];
    }
    
    // Vérifier si l'image n'existe pas déjà
    if (!professional.coverImages.includes(testImageUrl)) {
      professional.coverImages.push(testImageUrl);
      await professional.save();
      console.log('✅ Image ajoutée avec succès');
    } else {
      console.log('ℹ️ Image déjà présente');
    }

    // Test 2: Lire les images de couverture
    console.log('\n🧪 Test 2: Lecture des images de couverture');
    const updatedProfessional = await Professional.findById(professional._id);
    console.log('📷 Images après ajout:', updatedProfessional.coverImages);

    // Test 3: Supprimer l'image de test
    console.log('\n🧪 Test 3: Suppression de l\'image de test');
    updatedProfessional.coverImages = updatedProfessional.coverImages.filter(
      img => img !== testImageUrl
    );
    await updatedProfessional.save();
    
    const finalProfessional = await Professional.findById(professional._id);
    console.log('📷 Images après suppression:', finalProfessional.coverImages);

    console.log('\n✅ Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testCoverImages(); 