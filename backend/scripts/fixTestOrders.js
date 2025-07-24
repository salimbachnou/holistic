const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Professional = require('../models/Professional');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function fixTestOrders() {
  try {
    console.log('🔧 Correction des commandes de test...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connexion à la base de données établie');

    // Trouver le professionnel de test
    const professional = await Professional.findOne({ businessName: 'Test Business' });
    if (!professional) {
      console.log('❌ Professionnel de test non trouvé');
      return;
    }
    console.log('✅ Professionnel trouvé:', professional.businessName);

    // Trouver les produits du professionnel
    const products = await Product.find({ professionalId: professional._id });
    console.log('✅ Produits trouvés:', products.length);

    if (products.length === 0) {
      console.log('❌ Aucun produit trouvé pour ce professionnel');
      return;
    }

    // Trouver les utilisateurs clients de test
    const testClients = await User.find({
      email: { $in: ['client1@test.com', 'client2@test.com', 'client3@test.com'] }
    });
    console.log('✅ Clients de test trouvés:', testClients.length);

    // Supprimer les anciennes commandes de test
    await Order.deleteMany({ orderNumber: { $in: ['ORD-001', 'ORD-002'] } });
    console.log('✅ Anciennes commandes supprimées');

    // Créer de nouvelles commandes avec les bons produits
    const order1 = new Order({
      orderNumber: 'ORD-001',
      clientId: testClients[0]._id,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      totalAmount: {
        amount: 80,
        currency: 'MAD'
      },
      items: [
        {
          product: products[0]._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 45,
            currency: 'MAD'
          }
        },
        {
          product: products[1]._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 35,
            currency: 'MAD'
          }
        }
      ],
      shippingAddress: {
        firstName: testClients[0].firstName,
        lastName: testClients[0].lastName,
        street: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Morocco',
        phone: testClients[0].phone
      }
    });
    await order1.save();
    console.log('✅ Commande 1 créée avec les bons produits');

    const order2 = new Order({
      orderNumber: 'ORD-002',
      clientId: testClients[1]._id,
      status: 'processing',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      totalAmount: {
        amount: 45,
        currency: 'MAD'
      },
      items: [
        {
          product: products[0]._id,
          professional: professional._id,
          quantity: 1,
          price: {
            amount: 45,
            currency: 'MAD'
          }
        }
      ],
      shippingAddress: {
        firstName: testClients[1].firstName,
        lastName: testClients[1].lastName,
        street: '456 Test Avenue',
        city: 'Test City',
        postalCode: '12345',
        country: 'Morocco',
        phone: testClients[1].phone
      }
    });
    await order2.save();
    console.log('✅ Commande 2 créée avec les bons produits');

    console.log('\n🎉 Commandes de test corrigées!');
    console.log('📦 Commandes créées: 2');
    console.log('💡 Les commandes sont maintenant liées aux produits du professionnel de test');

  } catch (error) {
    console.error('❌ Erreur lors de la correction des commandes:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixTestOrders();
}

module.exports = { fixTestOrders }; 