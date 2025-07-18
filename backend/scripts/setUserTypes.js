const mongoose = require('mongoose');
require('../models');

const User = mongoose.model('User');

const setUserTypes = async () => {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Update users with @example.com emails to be clients
    const clientEmails = [
      'marie.dupont@example.com',
      'jean.martin@example.com', 
      'sophie.bernard@example.com',
      'pierre.leroy@example.com',
      'julie.moreau@example.com',
      'marie.dupont.reviews@example.com',
      'jean.martin.reviews@example.com',
      'sophie.bernard.reviews@example.com',
      'pierre.leroy.reviews@example.com',
      'julie.moreau.reviews@example.com',
      'client@test.com'
    ];

    const result = await User.updateMany(
      { email: { $in: clientEmails } },
      { $set: { role: 'client' } }
    );

    console.log(`✅ ${result.modifiedCount} utilisateurs mis à jour comme clients`);

    // Verify the updates
    const clients = await User.find({ role: 'client' }, 'name email role');
    console.log(`\n📄 ${clients.length} clients trouvés:`);
    
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name} (${client.email})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

if (require.main === module) {
  setUserTypes();
}

module.exports = setUserTypes;
