const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Notification = require('../models/Notification');

const generateClientNotifications = async () => {
  try {
    const clientId = '683ad8aeab3eca1952a7a30e'; // Your client ID
    
    // Clear existing notifications for this user
    await Notification.deleteMany({ userId: clientId });
    console.log('Cleared existing notifications for client:', clientId);

    // Generate test notifications
    const testNotifications = [
      {
        userId: clientId,
        title: 'Commande confirmée',
        message: 'Votre commande #ORD-12345 a été confirmée - Produit Wellness (250 MAD)',
        type: 'order_placed',
        link: '/orders',
        data: {
          orderId: 'ORD-12345',
          orderNumber: 'ORD-12345',
          totalAmount: 250,
          itemsCount: 1,
          productNames: 'Produit Wellness'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        userId: clientId,
        title: 'Commande en cours',
        message: 'Votre commande #ORD-12345 est maintenant en cours de traitement',
        type: 'order_processing',
        link: '/orders',
        data: {
          orderId: 'ORD-12345',
          orderNumber: 'ORD-12345',
          newStatus: 'processing'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        userId: clientId,
        title: 'Commande expédiée',
        message: 'Votre commande #ORD-54321 a été expédiée et sera livrée prochainement',
        type: 'order_shipped',
        link: '/orders',
        data: {
          orderId: 'ORD-54321',
          orderNumber: 'ORD-54321',
          newStatus: 'shipped'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        userId: clientId,
        title: 'Rendez-vous confirmé',
        message: 'Votre rendez-vous avec Dr. Martin est confirmé pour le 15 juin à 14h00',
        type: 'appointment_scheduled',
        link: '/bookings',
        data: {
          bookingId: '123456',
          professionalName: 'Dr. Martin',
          appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
          appointmentTime: '14:00',
          serviceName: 'Consultation'
        },
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        userId: clientId,
        title: 'Commande livrée',
        message: 'Votre commande #ORD-98765 a été livrée avec succès',
        type: 'order_delivered',
        link: '/orders',
        data: {
          orderId: 'ORD-98765',
          orderNumber: 'ORD-98765',
          newStatus: 'delivered'
        },
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        userId: clientId,
        title: 'Commande annulée',
        message: 'Votre commande #ORD-11111 a été annulée. Nous sommes désolés pour ce désagrément.',
        type: 'order_cancelled',
        link: '/orders',
        data: {
          orderId: 'ORD-11111',
          orderNumber: 'ORD-11111',
          reason: 'Produit non disponible'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
      },
      {
        userId: clientId,
        title: 'Nouvel événement',
        message: 'Atelier bien-être - 20 juin 2024 à 10h00',
        type: 'new_event',
        link: '/events',
        data: {
          eventId: '345678',
          eventTitle: 'Atelier bien-être',
          eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
          eventLocation: 'Centre Wellness'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
      },
      {
        userId: clientId,
        title: 'Rendez-vous annulé',
        message: 'Votre rendez-vous avec Dr. Sophie du 18 juin a été annulé. Raison: Urgence médicale',
        type: 'appointment_cancelled',
        link: '/bookings',
        data: {
          bookingId: '789012',
          professionalName: 'Dr. Sophie',
          appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
          reason: 'Urgence médicale'
        },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      }
    ];

    // Insert notifications
    const insertedNotifications = await Notification.insertMany(testNotifications);
    console.log(`Generated ${insertedNotifications.length} test notifications for client:`, clientId);

    // Display summary
    console.log('\nNotifications summary:');
    const unreadCount = testNotifications.filter(n => !n.read).length;
    console.log(`- Total: ${testNotifications.length}`);
    console.log(`- Unread: ${unreadCount}`);
    console.log(`- Read: ${testNotifications.length - unreadCount}`);

    console.log('\nNotification types:');
    const typeCount = {};
    testNotifications.forEach(n => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error generating notifications:', error);
    mongoose.connection.close();
  }
};

generateClientNotifications(); 