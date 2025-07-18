const mongoose = require('mongoose');
require('../models');

const User = mongoose.model('User');

const checkUsers = async () => {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Get all users
    const users = await User.find({}, 'name email userType').limit(20);

    console.log(`📄 ${users.length} utilisateurs trouvés:`);
    
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || 'Sans nom'} (${user.email}) - Type: ${user.userType || 'Non spécifié'}`);
    });

    const clientCount = await User.countDocuments({ userType: 'client' });
    const professionalCount = await User.countDocuments({ userType: 'professional' });
    
    console.log(`\n📊 Résumé:`);
    console.log(`  - Clients: ${clientCount}`);
    console.log(`  - Professionnels: ${professionalCount}`);
    console.log(`  - Total: ${users.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

if (require.main === module) {
  checkUsers();
}

module.exports = checkUsers;
