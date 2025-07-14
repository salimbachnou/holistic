const mongoose = require('mongoose');
const Professional = require('../models/Professional');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic-platform';

async function testCoverImageReplace() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Trouver le professionnel de test
    const professional = await Professional.findOne({ businessName: 'Test Wellness Center' });
    
    if (!professional) {
      console.log('❌ Professionnel de test non trouvé');
      return;
    }

    console.log('👤 Professionnel trouvé:', professional.businessName);
    console.log('📷 Images de couverture actuelles:', professional.coverImages);

    // Test 1: Ajouter une première image
    console.log('\n🧪 Test 1: Ajout d\'une première image');
    professional.coverImages = ['/uploads/profiles/image1.jpg'];
    await professional.save();
    console.log('✅ Première image ajoutée:', professional.coverImages);

    // Test 2: Remplacer par une nouvelle image
    console.log('\n🧪 Test 2: Remplacement par une nouvelle image');
    professional.coverImages = ['/uploads/profiles/image2.jpg'];
    await professional.save();
    console.log('✅ Image remplacée:', professional.coverImages);

    // Test 3: Vérifier que l'ancienne image n'est plus là
    console.log('\n🧪 Test 3: Vérification du remplacement');
    const updatedProfessional = await Professional.findById(professional._id);
    const hasOldImage = updatedProfessional.coverImages.includes('/uploads/profiles/image1.jpg');
    const hasNewImage = updatedProfessional.coverImages.includes('/uploads/profiles/image2.jpg');
    
    console.log('🔍 Ancienne image présente:', hasOldImage);
    console.log('🔍 Nouvelle image présente:', hasNewImage);
    console.log('📷 Images finales:', updatedProfessional.coverImages);

    if (!hasOldImage && hasNewImage) {
      console.log('✅ Remplacement réussi !');
    } else {
      console.log('❌ Problème avec le remplacement');
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage');
    professional.coverImages = [];
    await professional.save();
    console.log('✅ Images nettoyées');

    console.log('\n✅ Tous les tests sont terminés !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testCoverImageReplace(); 