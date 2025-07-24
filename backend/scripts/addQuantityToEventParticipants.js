const mongoose = require('mongoose');
const Event = require('../models/Event');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

const addQuantityToEventParticipants = async () => {
  try {
    console.log('🔍 Connexion à la base de données...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion réussie');

    console.log('🔍 Recherche des événements avec des participants...');
    const events = await Event.find({ 'participants.0': { $exists: true } });
    console.log(`✅ Trouvé ${events.length} événements avec des participants`);

    let updatedEvents = 0;
    let updatedParticipants = 0;

    for (const event of events) {
      let eventUpdated = false;
      
      for (const participant of event.participants) {
        // Vérifier si les champs quantity et note existent déjà
        if (participant.quantity === undefined) {
          participant.quantity = 1; // Valeur par défaut
          eventUpdated = true;
          updatedParticipants++;
        }
        
        if (participant.note === undefined) {
          participant.note = ''; // Valeur par défaut
          eventUpdated = true;
        }
      }
      
      if (eventUpdated) {
        await event.save();
        updatedEvents++;
        console.log(`✅ Événement "${event.title}" mis à jour avec ${event.participants.length} participants`);
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`- Événements traités: ${events.length}`);
    console.log(`- Événements mis à jour: ${updatedEvents}`);
    console.log(`- Participants mis à jour: ${updatedParticipants}`);

    console.log('\n✅ Migration terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de la base de données');
    process.exit(0);
  }
};

// Exécuter le script
addQuantityToEventParticipants(); 