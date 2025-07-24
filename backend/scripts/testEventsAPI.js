const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

async function testEventsAPI() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 === TEST DE L\'API ÉVÉNEMENTS ===\n');

    // 1. Vérifier tous les événements approuvés
    const allApprovedEvents = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName isVerified isActive')
      .lean();

    console.log(`📊 Total des événements approuvés: ${allApprovedEvents.length}`);

    allApprovedEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   - ID: ${event._id}`);
      console.log(`   - Statut: ${event.status}`);
      console.log(`   - Professionnel: ${event.professional ? `${event.professional.firstName} ${event.professional.lastName}` : 'NON TROUVÉ'}`);
      if (event.professional) {
        console.log(`   - Vérifié: ${event.professional.isVerified}`);
        console.log(`   - Actif: ${event.professional.isActive}`);
      }
    });

    // 2. Simuler exactement la requête de l'API
    console.log('\n🔍 === SIMULATION EXACTE DE L\'API ===\n');

    const apiEvents = await Event.find({ status: 'approved' })
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage',
        match: { isVerified: true, isActive: true }
      })
      .lean();

    console.log(`📊 Événements retournés par l'API: ${apiEvents.length}`);

    // 3. Vérifier pourquoi les événements sont filtrés
    console.log('\n🔍 === ANALYSE DU FILTRAGE ===\n');

    const eventsWithProfessional = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName isVerified isActive')
      .lean();

    eventsWithProfessional.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      
      if (!event.professional) {
        console.log(`   ❌ Problème: Professionnel non trouvé`);
        return;
      }

      const isVerified = event.professional.isVerified;
      const isActive = event.professional.isActive;
      const shouldShow = isVerified && isActive;

      console.log(`   - Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);
      console.log(`   - Vérifié: ${isVerified}`);
      console.log(`   - Actif: ${isActive}`);
      console.log(`   - Affiché: ${shouldShow ? 'OUI' : 'NON'}`);

      if (!shouldShow) {
        if (!isVerified) {
          console.log(`   ❌ Raison: Professionnel non vérifié`);
        }
        if (!isActive) {
          console.log(`   ❌ Raison: Professionnel inactif`);
        }
      }
    });

    // 4. Vérifier les professionnels directement
    console.log('\n👥 === VÉRIFICATION DES PROFESSIONNELS ===\n');

    const professionals = await User.find({ role: 'professional' })
      .select('firstName lastName email isVerified isActive')
      .lean();

    console.log(`📊 Total des professionnels: ${professionals.length}`);

    professionals.forEach((prof, index) => {
      console.log(`\n${index + 1}. ${prof.firstName} ${prof.lastName}`);
      console.log(`   - Email: ${prof.email}`);
      console.log(`   - Vérifié: ${prof.isVerified}`);
      console.log(`   - Actif: ${prof.isActive}`);
      console.log(`   - Éligible pour événements: ${prof.isVerified && prof.isActive ? 'OUI' : 'NON'}`);
    });

    // 5. Trouver les événements qui devraient s'afficher
    console.log('\n✅ === ÉVÉNEMENTS QUI DEVRAIENT S\'AFFICHER ===\n');

    const shouldShowEvents = eventsWithProfessional.filter(event => 
      event.professional && 
      event.professional.isVerified && 
      event.professional.isActive
    );

    console.log(`📊 Événements qui devraient s'afficher: ${shouldShowEvents.length}`);

    shouldShowEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   - Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);
      console.log(`   - Date: ${event.date}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
testEventsAPI(); 