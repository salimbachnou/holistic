const mongoose = require('mongoose');
require('dotenv').config();

// Import models
require('../models/User');
require('../models/Professional');
require('../models/Notification');

const User = mongoose.model('User');
const Professional = mongoose.model('Professional');
const Notification = mongoose.model('Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to create a notification
const createNotification = async (userId, title, message, type, link, data = {}) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      link,
      data,
      read: Math.random() > 0.5 // Randomly mark some as read
    });
    
    await notification.save();
    console.log(`Created notification: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Main function to seed notifications
const seedNotifications = async () => {
  try {
    // Find professionals
    const professionals = await Professional.find();
    
    if (professionals.length === 0) {
      console.log('No professionals found. Please run the main seed script first.');
      process.exit(1);
    }
    
    console.log(`Found ${professionals.length} professionals`);
    
    // For each professional, create various notifications
    for (const professional of professionals) {
      const user = await User.findById(professional.userId);
      if (!user) continue;
      
      console.log(`Creating notifications for ${user.firstName} ${user.lastName}`);
      
      // Create message notification
      await createNotification(
        user._id,
        'Nouveau message',
        'Vous avez reçu un nouveau message de Marie Dupont',
        'message',
        '/dashboard/professional/messages',
        { senderId: '60d5ec9af682fbd12a0f9a01', senderName: 'Marie Dupont' }
      );
      
      // Create appointment notification
      await createNotification(
        user._id,
        'Nouvelle réservation',
        'Jean Martin a réservé une session le 15 juin à 14h00',
        'appointment_scheduled',
        '/dashboard/professional/sessions',
        { 
          clientId: '60d5ec9af682fbd12a0f9a02', 
          clientName: 'Jean Martin',
          sessionDate: '2023-06-15T14:00:00Z',
          sessionId: '60d5ec9af682fbd12a0f9a10'
        }
      );
      
      // Create payment notification
      await createNotification(
        user._id,
        'Paiement reçu',
        'Vous avez reçu un paiement de 75 MAD pour une session de coaching',
        'payment_received',
        '/dashboard/professional/sessions',
        { 
          amount: 75,
          currency: 'MAD',
          clientId: '60d5ec9af682fbd12a0f9a03',
          clientName: 'Sophie Leclerc',
          sessionId: '60d5ec9af682fbd12a0f9a11'
        }
      );
      
      // Create new client notification
      await createNotification(
        user._id,
        'Nouveau client',
        'Ahmed Benani a rejoint votre liste de clients',
        'new_client',
        '/dashboard/professional/clients',
        { 
          clientId: '60d5ec9af682fbd12a0f9a04',
          clientName: 'Ahmed Benani'
        }
      );
      
      // Create order notification
      await createNotification(
        user._id,
        'Nouvelle commande',
        'Commande #1234 pour Huile essentielle de lavande',
        'new_order',
        '/dashboard/professional/products',
        { 
          orderId: '60d5ec9af682fbd12a0f9a20',
          orderNumber: '1234',
          productId: '60d5ec9af682fbd12a0f9a30',
          productName: 'Huile essentielle de lavande',
          clientId: '60d5ec9af682fbd12a0f9a05',
          clientName: 'Fatima Zahra'
        }
      );
      
      // Create order shipped notification
      await createNotification(
        user._id,
        'Commande expédiée',
        'La commande #1234 a été expédiée',
        'order_shipped',
        '/dashboard/professional/products',
        { 
          orderId: '60d5ec9af682fbd12a0f9a20',
          orderNumber: '1234',
          trackingNumber: 'TRK123456789'
        }
      );
      
      // Create session cancelled notification
      await createNotification(
        user._id,
        'Session annulée',
        'La session avec Karim Alaoui du 20 juin a été annulée',
        'session_cancelled',
        '/dashboard/professional/sessions',
        { 
          clientId: '60d5ec9af682fbd12a0f9a06',
          clientName: 'Karim Alaoui',
          sessionDate: '2023-06-20T10:00:00Z',
          sessionId: '60d5ec9af682fbd12a0f9a12',
          reason: 'Client unavailable'
        }
      );
      
      // Create new event notification
      await createNotification(
        user._id,
        'Nouvel événement',
        'Atelier de méditation créé pour le 25 juin',
        'new_event',
        '/dashboard/professional/events',
        { 
          eventId: '60d5ec9af682fbd12a0f9a40',
          eventName: 'Atelier de méditation',
          eventDate: '2023-06-25T16:00:00Z'
        }
      );
      
      // Create system notification
      await createNotification(
        user._id,
        'Mise à jour du système',
        'Nouvelles fonctionnalités disponibles dans votre espace professionnel',
        'system',
        '/dashboard/professional/settings',
        { 
          features: ['Nouvelle interface de gestion des événements', 'Amélioration des statistiques']
        }
      );
    }
    
    console.log('Notifications seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

// Run the seed function
seedNotifications(); 