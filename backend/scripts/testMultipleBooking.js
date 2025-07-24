const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

const testMultipleBooking = async () => {
  try {
    console.log('🔍 Connexion à la base de données...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion réussie');

    // Trouver un événement existant
    const event = await Event.findOne({ status: 'approved' });
    if (!event) {
      console.log('❌ Aucun événement approuvé trouvé');
      return;
    }

    console.log(`✅ Événement trouvé: "${event.title}"`);
    console.log(`📊 Participants actuels: ${event.participants.length}`);
    console.log(`📊 Places occupées: ${event.participants.filter(p => p.status !== 'cancelled').reduce((total, p) => total + (p.quantity || 1), 0)}/${event.maxParticipants}`);

    // Trouver un utilisateur pour la simulation
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.firstName} ${user.lastName}`);

    // Simuler une réservation de 3 places
    const quantity = 3;
    const note = 'Test de réservation multiple';

    console.log(`\n🔍 Simulation d'une réservation de ${quantity} places...`);

    // Vérifier si l'utilisateur est déjà inscrit
    const existingParticipation = event.participants.find(p => 
      p.user.toString() === user._id.toString() && p.status !== 'cancelled'
    );

    if (existingParticipation) {
      console.log('⚠️ L\'utilisateur est déjà inscrit, on va modifier sa participation');
      existingParticipation.quantity = quantity;
      existingParticipation.note = note;
    } else {
      console.log('➕ Ajout d\'une nouvelle participation');
      event.participants.push({
        user: user._id,
        status: 'pending',
        quantity: quantity,
        note: note
      });
    }

    await event.save();

    console.log(`✅ Réservation simulée avec succès!`);
    console.log(`📊 Nouveaux participants: ${event.participants.length}`);
    console.log(`📊 Places occupées: ${event.participants.filter(p => p.status !== 'cancelled').reduce((total, p) => total + (p.quantity || 1), 0)}/${event.maxParticipants}`);

    // Afficher les détails de la participation
    const participation = event.participants.find(p => p.user.toString() === user._id.toString());
    if (participation) {
      console.log(`\n📋 Détails de la participation:`);
      console.log(`- Utilisateur: ${user.firstName} ${user.lastName}`);
      console.log(`- Quantité: ${participation.quantity} places`);
      console.log(`- Statut: ${participation.status}`);
      console.log(`- Note: ${participation.note || 'Aucune'}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de la base de données');
    process.exit(0);
  }
};

// Exécuter le script
testMultipleBooking(); 