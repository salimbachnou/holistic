const mongoose = require('mongoose');
const NotificationService = require('../services/notificationService');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

async function simpleNotificationTest() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔔 === TEST SIMPLE DE NOTIFICATION ===\n');

    // Test avec un userId direct
    const testUserId = '687f4021ba451bc1ba3c9a1c'; // ID du professionnel dz dza
    
    console.log(`📊 Test avec userId: ${testUserId}`);

    try {
      const notification = await NotificationService.createClientNotification(
        testUserId,
        'Test de notification d\'événement',
        'Ceci est un test de notification pour un événement.',
        'event_booking_request',
        '/dashboard/professional/events/test',
        {
          eventId: 'test-event-id',
          eventTitle: 'Test Event',
          clientName: 'Test Client'
        }
      );

      if (notification) {
        console.log('✅ Notification créée avec succès !');
        console.log(`   - ID: ${notification._id}`);
        console.log(`   - Titre: ${notification.title}`);
        console.log(`   - Message: ${notification.message}`);
        console.log(`   - Type: ${notification.type}`);
        console.log(`   - UserId: ${notification.userId}`);
      } else {
        console.log('❌ Échec de la création de la notification');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
    }

    // Vérifier les notifications créées
    console.log('\n📊 === VÉRIFICATION DES NOTIFICATIONS ===\n');

    const Notification = require('../models/Notification');
    const notifications = await Notification.find({
      userId: testUserId
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`📊 Notifications trouvées: ${notifications.length}`);
    notifications.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   - Message: ${notif.message}`);
      console.log(`   - Type: ${notif.type}`);
      console.log(`   - Créée: ${notif.createdAt}`);
      console.log(`   - Lu: ${notif.read ? 'OUI' : 'NON'}`);
    });

    console.log('\n✅ Test terminé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
simpleNotificationTest(); 