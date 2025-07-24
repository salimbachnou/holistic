const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

async function fixUserIsActive() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔧 === CORRECTION DU CHAMP ISACTIVE ===\n');

    // 1. Ajouter le champ isActive au schéma User s'il n'existe pas
    if (!User.schema.paths.isActive) {
      console.log('➕ Ajout du champ isActive au schéma User...');
      User.schema.add({
        isActive: {
          type: Boolean,
          default: true
        }
      });
      console.log('✅ Champ isActive ajouté au schéma');
    }

    // 2. Mettre à jour tous les utilisateurs qui n'ont pas le champ isActive
    const usersWithoutIsActive = await User.find({
      $or: [
        { isActive: { $exists: false } },
        { isActive: null }
      ]
    });

    console.log(`📊 Utilisateurs sans champ isActive: ${usersWithoutIsActive.length}`);

    if (usersWithoutIsActive.length > 0) {
      console.log('\n🔧 Mise à jour des utilisateurs...');
      
      for (const user of usersWithoutIsActive) {
        console.log(`  - Mise à jour: ${user.firstName} ${user.lastName} (${user.email})`);
        
        // Définir isActive à true par défaut pour tous les utilisateurs
        user.isActive = true;
        await user.save();
      }
      
      console.log('✅ Tous les utilisateurs ont été mis à jour');
    } else {
      console.log('✅ Tous les utilisateurs ont déjà le champ isActive');
    }

    // 3. Vérifier les professionnels spécifiquement
    console.log('\n👥 === VÉRIFICATION DES PROFESSIONNELS ===\n');
    
    const professionals = await User.find({ role: 'professional' });
    console.log(`📊 Total des professionnels: ${professionals.length}`);
    
    professionals.forEach((prof, index) => {
      console.log(`\n${index + 1}. ${prof.firstName} ${prof.lastName}`);
      console.log(`   - Email: ${prof.email}`);
      console.log(`   - Vérifié: ${prof.isVerified}`);
      console.log(`   - Actif: ${prof.isActive}`);
      console.log(`   - Rôle: ${prof.role}`);
    });

    // 4. Vérifier que les événements s'affichent maintenant
    console.log('\n🔍 === VÉRIFICATION DES ÉVÉNEMENTS ===\n');
    
    const Event = require('../models/Event');
    const approvedEvents = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName isVerified isActive')
      .lean();

    console.log(`📊 Événements approuvés: ${approvedEvents.length}`);
    
    approvedEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   - Professionnel: ${event.professional ? `${event.professional.firstName} ${event.professional.lastName}` : 'NON TROUVÉ'}`);
      if (event.professional) {
        console.log(`   - Vérifié: ${event.professional.isVerified}`);
        console.log(`   - Actif: ${event.professional.isActive}`);
        console.log(`   - Affiché côté client: ${event.professional.isVerified && event.professional.isActive ? 'OUI' : 'NON'}`);
      }
    });

    // 5. Simuler la requête côté client
    console.log('\n🔍 === SIMULATION REQUÊTE CLIENT ===\n');
    
    const clientEvents = await Event.find({ status: 'approved' })
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage',
        match: { isVerified: true, isActive: true }
      })
      .lean();

    console.log(`📊 Événements trouvés côté client: ${clientEvents.length}`);
    
    if (clientEvents.length > 0) {
      console.log('✅ Les événements devraient maintenant s\'afficher côté client !');
      clientEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. "${event.title}"`);
        console.log(`   - Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);
      });
    } else {
      console.log('❌ Aucun événement trouvé côté client. Vérifiez les critères de filtrage.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
fixUserIsActive(); 