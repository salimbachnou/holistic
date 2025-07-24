const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic';

async function debugEvents() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n📊 === DIAGNOSTIC DES ÉVÉNEMENTS ===\n');

    // 1. Compter tous les événements
    const totalEvents = await Event.countDocuments();
    console.log(`📈 Total des événements dans la base: ${totalEvents}`);

    // 2. Compter les événements par statut
    const eventsByStatus = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\n📋 Événements par statut:');
    eventsByStatus.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count}`);
    });

    // 3. Récupérer tous les événements avec leurs professionnels
    const allEvents = await Event.find({})
      .populate('professional', 'firstName lastName email isVerified isActive')
      .lean();

    console.log('\n🔍 Détails des événements:');
    allEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. Événement: "${event.title}"`);
      console.log(`   - ID: ${event._id}`);
      console.log(`   - Statut: ${event.status}`);
      console.log(`   - Date: ${event.date}`);
      console.log(`   - Professionnel: ${event.professional ? `${event.professional.firstName} ${event.professional.lastName}` : 'NON TROUVÉ'}`);
      if (event.professional) {
        console.log(`   - Professionnel vérifié: ${event.professional.isVerified}`);
        console.log(`   - Professionnel actif: ${event.professional.isActive}`);
      }
    });

    // 4. Vérifier les professionnels
    console.log('\n👥 === DIAGNOSTIC DES PROFESSIONNELS ===\n');

    const professionals = await Professional.find({})
      .populate('userId', 'firstName lastName email isVerified isActive')
      .lean();

    console.log(`📈 Total des professionnels: ${professionals.length}`);

    professionals.forEach((prof, index) => {
      console.log(`\n${index + 1}. Professionnel: ${prof.userId ? `${prof.userId.firstName} ${prof.userId.lastName}` : 'NON TROUVÉ'}`);
      console.log(`   - ID: ${prof._id}`);
      console.log(`   - User ID: ${prof.userId}`);
      if (prof.userId) {
        console.log(`   - Vérifié: ${prof.userId.isVerified}`);
        console.log(`   - Actif: ${prof.userId.isActive}`);
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

    // 6. Vérifier pourquoi les événements sont filtrés
    console.log('\n🔍 === ANALYSE DU FILTRAGE ===\n');

    const approvedEvents = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName isVerified isActive')
      .lean();

    console.log(`📊 Événements approuvés: ${approvedEvents.length}`);

    approvedEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. Événement approuvé: "${event.title}"`);
      console.log(`   - Professionnel: ${event.professional ? `${event.professional.firstName} ${event.professional.lastName}` : 'NON TROUVÉ'}`);
      if (event.professional) {
        console.log(`   - Vérifié: ${event.professional.isVerified}`);
        console.log(`   - Actif: ${event.professional.isActive}`);
        console.log(`   - Affiché côté client: ${event.professional.isVerified && event.professional.isActive ? 'OUI' : 'NON'}`);
      } else {
        console.log(`   - Affiché côté client: NON (professionnel non trouvé)`);
      }
    });

    // 7. Suggestions de correction
    console.log('\n💡 === SUGGESTIONS DE CORRECTION ===\n');

    const eventsToFix = approvedEvents.filter(event => 
      !event.professional || 
      !event.professional.isVerified || 
      !event.professional.isActive
    );

    if (eventsToFix.length > 0) {
      console.log(`⚠️  ${eventsToFix.length} événements approuvés ne s'affichent pas côté client:`);
      eventsToFix.forEach((event, index) => {
        console.log(`\n${index + 1}. "${event.title}"`);
        if (!event.professional) {
          console.log(`   ❌ Problème: Professionnel non trouvé`);
          console.log(`   💡 Solution: Vérifier que le professionnel existe dans la base`);
        } else {
          if (!event.professional.isVerified) {
            console.log(`   ❌ Problème: Professionnel non vérifié`);
            console.log(`   💡 Solution: Vérifier le professionnel dans l'admin`);
          }
          if (!event.professional.isActive) {
            console.log(`   ❌ Problème: Professionnel inactif`);
            console.log(`   💡 Solution: Activer le professionnel`);
          }
        }
      });
    } else {
      console.log('✅ Tous les événements approuvés devraient s\'afficher côté client');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
debugEvents(); 