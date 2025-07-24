const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

async function debugEventFiltering() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 === DIAGNOSTIC DU FILTRAGE DES ÉVÉNEMENTS ===\n');

    // 1. Récupérer tous les événements approuvés
    const allApprovedEvents = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName isVerified isActive')
      .lean();

    console.log(`📊 Total des événements approuvés: ${allApprovedEvents.length}`);

    // 2. Simuler exactement la requête de l'API
    console.log('\n🔍 === SIMULATION DE LA REQUÊTE API ===\n');

    const apiQuery = await Event.find({ status: 'approved' })
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage',
        match: { isVerified: true, isActive: true }
      })
      .sort({ date: 1 })
      .lean();

    console.log(`📊 Événements après populate avec match: ${apiQuery.length}`);

    // 3. Analyser chaque événement
    console.log('\n🔍 === ANALYSE DÉTAILLÉE ===\n');

    allApprovedEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   - ID: ${event._id}`);
      console.log(`   - Statut: ${event.status}`);
      
      if (event.professional) {
        console.log(`   - Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);
        console.log(`   - Vérifié: ${event.professional.isVerified}`);
        console.log(`   - Actif: ${event.professional.isActive}`);
        console.log(`   - Éligible: ${event.professional.isVerified && event.professional.isActive ? 'OUI' : 'NON'}`);
      } else {
        console.log(`   ❌ Problème: Professionnel non trouvé`);
      }
    });

    // 4. Tester la requête sans match pour voir si le problème vient du match
    console.log('\n🔍 === TEST SANS MATCH ===\n');

    const eventsWithoutMatch = await Event.find({ status: 'approved' })
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage isVerified isActive'
      })
      .sort({ date: 1 })
      .lean();

    console.log(`📊 Événements sans match: ${eventsWithoutMatch.length}`);

    // 5. Filtrer manuellement pour simuler ce que devrait faire le match
    console.log('\n🔍 === FILTRAGE MANUEL ===\n');

    const manuallyFiltered = eventsWithoutMatch.filter(event => 
      event.professional && 
      event.professional.isVerified && 
      event.professional.isActive
    );

    console.log(`📊 Événements après filtrage manuel: ${manuallyFiltered.length}`);

    manuallyFiltered.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   - Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);
      console.log(`   - Vérifié: ${event.professional.isVerified}`);
      console.log(`   - Actif: ${event.professional.isActive}`);
    });

    // 6. Problème identifié et solution
    console.log('\n💡 === PROBLÈME IDENTIFIÉ ===\n');
    
    if (manuallyFiltered.length > 0 && apiQuery.length === 0) {
      console.log('❌ PROBLÈME: Le match dans populate ne fonctionne pas correctement');
      console.log('💡 SOLUTION: Utiliser un filtre manuel au lieu du match dans populate');
      
      console.log('\n🔧 === SOLUTION PROPOSÉE ===\n');
      console.log('Modifier la route GET / dans events.js:');
      console.log('1. Enlever le match du populate');
      console.log('2. Ajouter un filtre manuel après le populate');
      console.log('3. Ou utiliser une agrégation MongoDB');
    } else if (manuallyFiltered.length === 0) {
      console.log('❌ PROBLÈME: Aucun événement ne passe les critères de filtrage');
      console.log('💡 SOLUTION: Vérifier les données des professionnels');
    } else {
      console.log('✅ Le filtrage fonctionne correctement');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
debugEventFiltering(); 