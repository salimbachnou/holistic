const mongoose = require('mongoose');
require('../models');

const User = mongoose.model('User');

const createAdminAccount = async () => {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Check if admin account already exists
    const existingAdmin = await User.findOne({ email: 'admin@holistic.ma' });
    
    if (existingAdmin) {
      console.log('⚠️  Le compte admin existe déjà:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.name}`);
      console.log(`   Rôle: ${existingAdmin.role}`);
      console.log(`   Créé le: ${existingAdmin.createdAt}`);
      return;
    }

    // Create admin account
    const adminData = {
      email: 'admin@holistic.ma',
      password: 'holisticadmin',
      firstName: 'Admin',
      lastName: 'Holistic',
      name: 'Admin Holistic',
      role: 'admin',
      isVerified: true,
      verifiedAt: new Date(),
      provider: 'local'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Compte admin créé avec succès:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nom: ${admin.name}`);
    console.log(`   Rôle: ${admin.role}`);
    console.log(`   Vérifié: ${admin.isVerified}`);

    // Verify admin account exists
    const createdAdmin = await User.findOne({ email: 'admin@holistic.ma' });
    if (createdAdmin) {
      console.log('\n✅ Vérification: Le compte admin a été créé et peut être utilisé pour se connecter.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

if (require.main === module) {
  createAdminAccount();
}

module.exports = createAdminAccount; 