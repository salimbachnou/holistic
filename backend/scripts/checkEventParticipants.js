const mongoose = require('mongoose');
const Event = require('../models/Event');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

const checkEventParticipants = async () => {
  try {
    console.log('🔍 Connexion à la base de données...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion réussie');

    // Trouver un événement avec des participants
    const event = await Event.findOne({ 'participants.0': { $exists: true } })
      .populate('participants.user', 'firstName lastName email');

    if (!event) {
      console.log('❌ Aucun événement avec des participants trouvé');
      return;
    }

    console.log(`\n📋 Événement: "${event.title}"`);
    console.log(`📊 Capacité: ${event.maxParticipants} places`);
    console.log(`📊 Participants: ${event.participants.length} inscriptions`);

    // Calculer les statistiques
    const confirmedParticipants = event.participants
      .filter(p => p.status === 'confirmed')
      .reduce((total, p) => total + (p.quantity || 1), 0);
    
    const pendingParticipants = event.participants
      .filter(p => p.status === 'pending')
      .reduce((total, p) => total + (p.quantity || 1), 0);
    
    const cancelledParticipants = event.participants
      .filter(p => p.status === 'cancelled')
      .reduce((total, p) => total + (p.quantity || 1), 0);

    console.log(`\n📊 Statistiques des places:`);
    console.log(`- Confirmées: ${confirmedParticipants} places`);
    console.log(`- En attente: ${pendingParticipants} places`);
    console.log(`- Annulées: ${cancelledParticipants} places`);
    console.log(`- Total occupées: ${confirmedParticipants + pendingParticipants} places`);
    console.log(`- Places restantes: ${event.maxParticipants - (confirmedParticipants + pendingParticipants)} places`);

    console.log(`\n👥 Détails des participants:`);
    event.participants.forEach((participant, index) => {
      const user = participant.user;
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - Statut: ${participant.status}`);
      console.log(`   - Quantité: ${participant.quantity || 1} place${participant.quantity > 1 ? 's' : ''}`);
      console.log(`   - Note: ${participant.note || 'Aucune'}`);
      console.log(`   - Inscrit le: ${new Date(participant.createdAt).toLocaleString('fr-FR')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de la base de données');
    process.exit(0);
  }
};

// Exécuter le script
checkEventParticipants(); 