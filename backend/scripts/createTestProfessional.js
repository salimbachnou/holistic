const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Professional = require('../models/Professional');

const TEST_PROFESSIONAL = {
  email: 'professional@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Professional',
  phone: '0612345678',
  businessName: 'Test Business',
  businessType: 'wellness'
};

async function createTestProfessional() {
  try {
    console.log('🔧 Création d\'un compte professionnel de test...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: TEST_PROFESSIONAL.email });
    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      console.log('📧 Email:', TEST_PROFESSIONAL.email);
      console.log('🔑 Mot de passe:', TEST_PROFESSIONAL.password);
      console.log('👤 Nom:', `${TEST_PROFESSIONAL.firstName} ${TEST_PROFESSIONAL.lastName}`);
      
      // Vérifier si le profil professionnel existe
      const existingProfessional = await Professional.findOne({ userId: existingUser._id });
      if (existingProfessional) {
        console.log('✅ Profil professionnel existe déjà');
      } else {
        console.log('⚠️  Profil professionnel manquant, création...');
        const professional = new Professional({
          userId: existingUser._id,
          businessName: TEST_PROFESSIONAL.businessName,
          businessType: TEST_PROFESSIONAL.businessType,
          title: TEST_PROFESSIONAL.businessName,
          description: 'Compte de test pour les tests API',
          address: '123 Test Street, Test City',
          contactInfo: {
            email: TEST_PROFESSIONAL.email,
            phone: TEST_PROFESSIONAL.phone
          },
          isVerified: true,
          isActive: true
        });
        await professional.save();
        console.log('✅ Profil professionnel créé');
      }
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(TEST_PROFESSIONAL.password, 12);

    // Créer l'utilisateur
    const user = new User({
      email: TEST_PROFESSIONAL.email,
      password: hashedPassword,
      firstName: TEST_PROFESSIONAL.firstName,
      lastName: TEST_PROFESSIONAL.lastName,
      name: `${TEST_PROFESSIONAL.firstName} ${TEST_PROFESSIONAL.lastName}`,
      phone: TEST_PROFESSIONAL.phone,
      role: 'professional',
      isVerified: true,
      isActive: true
    });

    await user.save();
    console.log('✅ Utilisateur créé avec succès');

    // Créer le profil professionnel
    const professional = new Professional({
      userId: user._id,
      businessName: TEST_PROFESSIONAL.businessName,
      businessType: TEST_PROFESSIONAL.businessType,
      title: TEST_PROFESSIONAL.businessName,
      description: 'Compte de test pour les tests API',
      address: '123 Test Street, Test City',
      contactInfo: {
        email: TEST_PROFESSIONAL.email,
        phone: TEST_PROFESSIONAL.phone
      },
      isVerified: true,
      isActive: true
    });

    await professional.save();
    console.log('✅ Profil professionnel créé avec succès');

    console.log('\n🎉 Compte de test créé avec succès!');
    console.log('📧 Email:', TEST_PROFESSIONAL.email);
    console.log('🔑 Mot de passe:', TEST_PROFESSIONAL.password);
    console.log('👤 Nom:', `${TEST_PROFESSIONAL.firstName} ${TEST_PROFESSIONAL.lastName}`);
    console.log('\n💡 Vous pouvez maintenant utiliser ces identifiants dans le script de test');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte de test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTestProfessional();
}

module.exports = { createTestProfessional }; 
createTestProfessional(); 
createTestProfessional(); 