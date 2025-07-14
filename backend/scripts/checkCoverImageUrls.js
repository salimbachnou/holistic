const mongoose = require('mongoose');
const Professional = require('../models/Professional');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic-platform';

async function checkCoverImageUrls() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Trouver tous les professionnels avec des images de couverture
    const professionals = await Professional.find({ 
      coverImages: { $exists: true, $ne: [] } 
    });

    console.log(`📊 Trouvé ${professionals.length} professionnels avec des images de couverture`);

    professionals.forEach((prof, index) => {
      console.log(`\n👤 Professionnel ${index + 1}: ${prof.businessName}`);
      console.log('📷 Images de couverture:');
      prof.coverImages.forEach((img, imgIndex) => {
        console.log(`  ${imgIndex + 1}. ${img}`);
        console.log(`     Type: ${img.startsWith('http') ? 'URL complète' : 'URL relative'}`);
      });
    });

    // Test de conversion d'URL
    console.log('\n🧪 Test de conversion d\'URL:');
    const testUrls = [
      'http://hamza-aourass.ddns.net:5001/uploads/profiles/test.jpg',
      '/uploads/profiles/test.jpg',
      'https://example.com/uploads/profiles/test.jpg'
    ];

    testUrls.forEach(url => {
      const converted = url.startsWith('http') 
        ? url.replace(/^https?:\/\/[^\/]+/, '') 
        : url;
      console.log(`Original: ${url}`);
      console.log(`Converti: ${converted}`);
      console.log('---');
    });

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le script
checkCoverImageUrls(); 