const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');

const TEST_CREDENTIALS = {
  email: 'professional@test.com',
  password: 'password123'
};

async function fixTestPassword() {
  try {
    console.log('🔧 Vérification et correction du mot de passe de test...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connexion à la base de données établie');

    // Trouver l'utilisateur
    const user = await User.findOne({ email: TEST_CREDENTIALS.email });
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Mot de passe actuel:', user.password.substring(0, 20) + '...');

    // Vérifier si le mot de passe actuel correspond
    const isValidPassword = await bcrypt.compare(TEST_CREDENTIALS.password, user.password);
    console.log('🔍 Mot de passe valide:', isValidPassword);

    if (!isValidPassword) {
      console.log('⚠️  Mot de passe incorrect, mise à jour...');
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(TEST_CREDENTIALS.password, 12);
      
      // Mettre à jour le mot de passe
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      console.log('✅ Mot de passe mis à jour');
    } else {
      console.log('✅ Mot de passe déjà correct');
    }

    console.log('\n🎉 Vérification terminée!');
    console.log('📧 Email:', TEST_CREDENTIALS.email);
    console.log('🔑 Mot de passe:', TEST_CREDENTIALS.password);
    console.log('\n💡 Vous pouvez maintenant tester l\'authentification');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixTestPassword();
}

module.exports = { fixTestPassword }; 