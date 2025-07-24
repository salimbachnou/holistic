const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

async function testEventNotifications() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔔 === TEST DES NOTIFICATIONS D\'ÉVÉNEMENTS ===\n');

    // 1. Récupérer un événement existant
    const event = await Event.findOne({ status: 'approved' })
      .populate('professional', 'firstName lastName')
      .lean();

    if (!event) {
      console.log('❌ Aucun événement approuvé trouvé');
      return;
    }

    console.log(`📊 Événement trouvé: "${event.title}"`);
    console.log(`👤 Professionnel: ${event.professional.firstName} ${event.professional.lastName}`);

    // 2. Récupérer un utilisateur client
    const client = await User.findOne({ role: 'client' });
    if (!client) {
      console.log('❌ Aucun client trouvé');
      return;
    }

    console.log(`👤 Client: ${client.firstName} ${client.lastName}`);

    // 3. Tester la notification de nouvelle réservation
    console.log('\n🔔 === TEST NOTIFICATION NOUVELLE RÉSERVATION ===\n');

    const clientName = `${client.firstName} ${client.lastName}`;
    
    try {
      const notification = await NotificationService.createNotification(
        event.professional._id,
        'Nouvelle réservation d\'événement',
        `${clientName} s'est inscrit(e) à votre événement "${event.title}".`,
        'event_booking_request',
        `/dashboard/professional/events/${event._id}`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          clientId: client._id,
          clientName: clientName,
          clientEmail: client.email
        }
      );

      if (notification) {
        console.log('✅ Notification de nouvelle réservation créée avec succès');
        console.log(`   - ID: ${notification._id}`);
        console.log(`   - Titre: ${notification.title}`);
        console.log(`   - Message: ${notification.message}`);
        console.log(`   - Type: ${notification.type}`);
      } else {
        console.log('❌ Échec de la création de la notification');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
    }

    // 4. Tester la notification d'annulation
    console.log('\n🔔 === TEST NOTIFICATION ANNULATION ===\n');

    try {
      const cancelNotification = await NotificationService.createNotification(
        event.professional._id,
        'Annulation de réservation d\'événement',
        `${clientName} a annulé son inscription à votre événement "${event.title}".`,
        'event_booking_cancelled',
        `/dashboard/professional/events/${event._id}`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          clientId: client._id,
          clientName: clientName,
          clientEmail: client.email
        }
      );

      if (cancelNotification) {
        console.log('✅ Notification d\'annulation créée avec succès');
        console.log(`   - ID: ${cancelNotification._id}`);
        console.log(`   - Titre: ${cancelNotification.title}`);
        console.log(`   - Message: ${cancelNotification.message}`);
        console.log(`   - Type: ${cancelNotification.type}`);
      } else {
        console.log('❌ Échec de la création de la notification d\'annulation');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification d\'annulation:', error);
    }

    // 5. Vérifier les notifications créées
    console.log('\n📊 === VÉRIFICATION DES NOTIFICATIONS ===\n');

    const Notification = require('../models/Notification');
    const notifications = await Notification.find({
      userId: event.professional._id,
      type: { $in: ['event_booking_request', 'event_booking_cancelled'] }
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`📊 Notifications trouvées: ${notifications.length}`);
    notifications.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   - Message: ${notif.message}`);
      console.log(`   - Type: ${notif.type}`);
      console.log(`   - Créée: ${notif.createdAt}`);
      console.log(`   - Lu: ${notif.read ? 'OUI' : 'NON'}`);
    });

    console.log('\n✅ Test des notifications terminé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
testEventNotifications(); 