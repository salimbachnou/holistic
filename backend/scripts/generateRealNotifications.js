const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('../models/User');
require('../models/Professional');
require('../models/Order');
require('../models/Booking');
require('../models/Event');
require('../models/Notification');

const User = mongoose.model('User');
const Professional = mongoose.model('Professional');
const Order = mongoose.model('Order');
const Booking = mongoose.model('Booking');
const Event = mongoose.model('Event');
const Notification = mongoose.model('Notification');

const NotificationService = require('../services/notificationService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to generate notifications from real data
const generateRealNotifications = async () => {
  try {
    console.log('🚀 Génération de notifications basées sur les données réelles...');

    // Find all professionals
    const professionals = await Professional.find().populate('userId');
    
    if (professionals.length === 0) {
      console.log('❌ Aucun professionnel trouvé.');
      process.exit(1);
    }

    console.log(`✅ ${professionals.length} professionnels trouvés`);

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('🗑️  Notifications existantes supprimées');

    let notificationCount = 0;

    for (const professional of professionals) {
      const user = professional.userId;
      if (!user) continue;

      console.log(`\n👤 Génération de notifications pour ${user.firstName} ${user.lastName}`);

      // 1. Generate notifications from real orders
      const orders = await Order.find({
        $or: [
          { professionalId: professional._id },
          { 'items.professional': professional._id }
        ]
      }).populate('clientId', 'firstName lastName').limit(5).sort({ createdAt: -1 });

      for (const order of orders) {
        try {
          await NotificationService.notifyNewOrder(order);
          notificationCount++;
          console.log(`  💰 Notification commande créée: ${order.orderNumber}`);
        } catch (error) {
          console.error(`  ❌ Erreur notification commande ${order.orderNumber}:`, error.message);
        }
      }

      // 2. Generate notifications from real bookings
      const bookings = await Booking.find({
        professional: professional._id
      }).populate('client', 'firstName lastName').limit(5).sort({ createdAt: -1 });

      for (const booking of bookings) {
        try {
          if (booking.status === 'confirmed' || booking.status === 'pending') {
            await NotificationService.notifyNewBooking(booking);
            notificationCount++;
            console.log(`  📅 Notification réservation créée: ${booking.bookingNumber}`);
          } else if (booking.status === 'cancelled') {
            await NotificationService.notifyBookingCancelled(booking);
            notificationCount++;
            console.log(`  ❌ Notification annulation créée: ${booking.bookingNumber}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur notification réservation ${booking.bookingNumber}:`, error.message);
        }
      }

      // 3. Generate notifications from real events
      const events = await Event.find({
        professional: user._id
      }).limit(3).sort({ createdAt: -1 });

      for (const event of events) {
        try {
          await NotificationService.notifyNewEvent(event, professional._id);
          notificationCount++;
          console.log(`  🎉 Notification événement créée: ${event.title}`);
        } catch (error) {
          console.error(`  ❌ Erreur notification événement ${event.title}:`, error.message);
        }
      }

      // 4. Generate notifications for new clients (from recent bookings)
      const recentClients = await Booking.find({
        professional: professional._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).populate('client', 'firstName lastName email').distinct('client');

      for (const client of recentClients.slice(0, 3)) {
        if (client) {
          try {
            await NotificationService.notifyNewClient(client, professional._id);
            notificationCount++;
            console.log(`  👥 Notification nouveau client créée: ${client.firstName} ${client.lastName}`);
          } catch (error) {
            console.error(`  ❌ Erreur notification nouveau client:`, error.message);
          }
        }
      }

      // 5. Generate some additional notifications for variety
      try {
        // Payment notification
        await NotificationService.notifyPaymentReceived({
          _id: new mongoose.Types.ObjectId(),
          amount: 150,
          currency: 'MAD',
          clientName: 'Client Test'
        }, professional._id);
        notificationCount++;
        console.log(`  💳 Notification paiement créée`);

        // Message notification
        await NotificationService.notifyNewMessage({
          _id: new mongoose.Types.ObjectId(),
          text: 'Bonjour, j\'aimerais prendre rendez-vous pour une consultation...',
          senderName: 'Marie Dupont',
          senderId: new mongoose.Types.ObjectId()
        }, professional._id);
        notificationCount++;
        console.log(`  💬 Notification message créée`);

      } catch (error) {
        console.error(`  ❌ Erreur notifications additionnelles:`, error.message);
      }
    }

    console.log(`\n🎉 Génération terminée avec succès!`);
    console.log(`📊 Total des notifications créées: ${notificationCount}`);
    
    // Show final stats
    const totalNotifications = await Notification.countDocuments();
    console.log(`📈 Total des notifications en base: ${totalNotifications}`);

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des notifications:', error);
    process.exit(1);
  }
};

// Run the generation function
generateRealNotifications(); 