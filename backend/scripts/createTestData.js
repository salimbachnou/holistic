const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Professional = require('../models/Professional');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Booking = require('../models/Booking');

const TEST_PROFESSIONAL = {
  email: 'professional@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Professional',
  phone: '0612345678',
  businessName: 'Test Business',
  businessType: 'wellness'
};

const TEST_CLIENTS = [
  {
    email: 'client1@test.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Martin',
    phone: '0611111111'
  },
  {
    email: 'client2@test.com',
    password: 'password123',
    firstName: 'Bob',
    lastName: 'Dubois',
    phone: '0622222222'
  },
  {
    email: 'client3@test.com',
    password: 'password123',
    firstName: 'Claire',
    lastName: 'Bernard',
    phone: '0633333333'
  }
];

async function createTestData() {
  try {
    console.log('🔧 Création de données de test...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si le professionnel existe
    let professional = await Professional.findOne({ 'contactInfo.email': TEST_PROFESSIONAL.email });
    if (!professional) {
      // Essayer de trouver par l'utilisateur
      const user = await User.findOne({ email: TEST_PROFESSIONAL.email });
      if (user) {
        professional = await Professional.findOne({ userId: user._id });
      }
    }
    
    if (!professional) {
      console.log('❌ Professionnel de test non trouvé. Créez-le d\'abord avec createTestProfessional.js');
      return;
    }

    console.log('✅ Professionnel trouvé:', professional.businessName);

    // Créer les clients de test
    const createdClients = [];
    for (const clientData of TEST_CLIENTS) {
      let client = await User.findOne({ email: clientData.email });
      
      if (!client) {
        const hashedPassword = await bcrypt.hash(clientData.password, 12);
        client = new User({
          email: clientData.email,
          password: hashedPassword,
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          name: `${clientData.firstName} ${clientData.lastName}`,
          phone: clientData.phone,
          role: 'client',
          isVerified: true,
          isActive: true
        });
        await client.save();
        console.log(`✅ Client créé: ${client.name}`);
      } else {
        console.log(`⚠️  Client existant: ${client.name}`);
      }
      createdClients.push(client);
    }

    // Créer des sessions de test
    console.log('\n📅 Création de sessions de test...');
    const sessions = [];
    
    // Session passée
    const pastSession = new Session({
      professionalId: professional._id,
      title: 'Yoga pour débutants',
      description: 'Session de yoga doux pour débutants',
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours ago
      duration: 60,
      maxParticipants: 10,
      price: 150,
      participants: [createdClients[0]._id, createdClients[1]._id],
      category: 'individual',
      location: 'Studio de yoga',
      status: 'completed'
    });
    await pastSession.save();
    sessions.push(pastSession);
    console.log('✅ Session passée créée');

    // Session à venir
    const upcomingSession = new Session({
      professionalId: professional._id,
      title: 'Méditation guidée',
      description: 'Session de méditation pour tous niveaux',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours from now
      duration: 45,
      maxParticipants: 15,
      price: 120,
      participants: [createdClients[0]._id, createdClients[2]._id],
      category: 'group',
      location: 'Salle de méditation',
      status: 'scheduled'
    });
    await upcomingSession.save();
    sessions.push(upcomingSession);
    console.log('✅ Session à venir créée');

    // Créer des événements de test
    console.log('\n🎪 Création d\'événements de test...');
    const events = [];
    
    // Événement passé
    const pastEvent = new Event({
      title: 'Atelier bien-être',
      description: 'Atelier complet de bien-être',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 jours ago
      endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4h duration
      time: '14:00',
      price: 200,
      maxParticipants: 20,
      professional: professional.userId,
      eventType: 'in_person',
      address: 'Centre de bien-être',
      status: 'approved',
      participants: [
        {
          user: createdClients[0]._id,
          status: 'confirmed',
          quantity: 1
        },
        {
          user: createdClients[1]._id,
          status: 'confirmed',
          quantity: 2
        }
      ]
    });
    await pastEvent.save();
    events.push(pastEvent);
    console.log('✅ Événement passé créé');

    // Événement à venir
    const upcomingEvent = new Event({
      title: 'Retraite zen',
      description: 'Retraite de 2 jours pour se ressourcer',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours from now
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 jours from now
      time: '09:00',
      price: 500,
      maxParticipants: 12,
      professional: professional.userId,
      eventType: 'in_person',
      address: 'Centre de retraite',
      status: 'approved',
      participants: [
        {
          user: createdClients[2]._id,
          status: 'confirmed',
          quantity: 1
        }
      ]
    });
    await upcomingEvent.save();
    events.push(upcomingEvent);
    console.log('✅ Événement à venir créé');

    // Créer des produits de test
    console.log('\n🛍️ Création de produits de test...');
    const products = [];
    
    const product1 = new Product({
      professionalId: professional._id,
      title: 'Huile essentielle de lavande',
      name: 'Huile essentielle de lavande',
      description: 'Huile essentielle 100% naturelle pour la relaxation',
      price: 45,
      stock: 50,
      category: 'aromathérapie',
      status: 'approved'
    });
    await product1.save();
    products.push(product1);
    console.log('✅ Produit 1 créé');

    const product2 = new Product({
      professionalId: professional._id,
      title: 'Coussin de méditation',
      name: 'Coussin de méditation',
      description: 'Coussin confortable pour la méditation',
      price: 35,
      stock: 25,
      category: 'accessoires',
      status: 'approved'
    });
    await product2.save();
    products.push(product2);
    console.log('✅ Produit 2 créé');

    // Créer des commandes de test
    console.log('\n📦 Création de commandes de test...');
    
    const order1 = new Order({
      orderNumber: 'ORD-001',
      clientId: createdClients[0]._id,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      totalAmount: {
        amount: 80,
        currency: 'MAD'
      },
      items: [
        {
          product: product1._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 45,
            currency: 'MAD'
          }
        },
        {
          product: product2._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 35,
            currency: 'MAD'
          }
        }
      ],
      shippingAddress: {
        firstName: createdClients[0].firstName,
        lastName: createdClients[0].lastName,
        street: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Morocco',
        phone: createdClients[0].phone
      }
    });
    await order1.save();
    console.log('✅ Commande 1 créée');

    const order2 = new Order({
      orderNumber: 'ORD-002',
      clientId: createdClients[1]._id,
      status: 'processing',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      totalAmount: {
        amount: 45,
        currency: 'MAD'
      },
      items: [
        {
          product: product1._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 45,
            currency: 'MAD'
          }
        }
      ],
      shippingAddress: {
        firstName: createdClients[1].firstName,
        lastName: createdClients[1].lastName,
        street: '456 Test Avenue',
        city: 'Test City',
        postalCode: '12345',
        country: 'Morocco',
        phone: createdClients[1].phone
      }
    });
    await order2.save();
    console.log('✅ Commande 2 créée');

    console.log('\n🎉 Données de test créées avec succès!');
    console.log(`📊 Résumé:`);
    console.log(`   - ${createdClients.length} clients créés`);
    console.log(`   - ${sessions.length} sessions créées`);
    console.log(`   - ${events.length} événements créés`);
    console.log(`   - ${products.length} produits créés`);
    console.log(`   - 2 commandes créées`);
    console.log('\n💡 Vous pouvez maintenant tester l\'API avec: node scripts/testClientsAPI.js');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData }; 