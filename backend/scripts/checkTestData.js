const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Professional = require('../models/Professional');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function checkTestData() {
  try {
    console.log('🔍 Vérification des données de test...\n');

    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connexion à la base de données établie');

    // Vérifier l'utilisateur professionnel
    console.log('\n👤 Vérification de l\'utilisateur professionnel:');
    const professionalUser = await User.findOne({ email: 'professional@test.com' });
    if (professionalUser) {
      console.log('✅ Utilisateur professionnel trouvé:', professionalUser.name);
      console.log('   - Email:', professionalUser.email);
      console.log('   - Rôle:', professionalUser.role);
      console.log('   - Vérifié:', professionalUser.isVerified);
      console.log('   - Actif:', professionalUser.isActive);
    } else {
      console.log('❌ Utilisateur professionnel non trouvé');
    }

    // Vérifier le profil professionnel
    console.log('\n🏢 Vérification du profil professionnel:');
    let professional = null;
    if (professionalUser) {
      professional = await Professional.findOne({ userId: professionalUser._id });
      if (professional) {
        console.log('✅ Profil professionnel trouvé:', professional.businessName);
        console.log('   - Type:', professional.businessType);
        console.log('   - Vérifié:', professional.isVerified);
        console.log('   - Actif:', professional.isActive);
      } else {
        console.log('❌ Profil professionnel non trouvé');
      }
    }

    // Vérifier les clients de test
    console.log('\n👥 Vérification des clients de test:');
    const testClients = await User.find({
      email: { $in: ['client1@test.com', 'client2@test.com', 'client3@test.com'] }
    });
    console.log(`✅ ${testClients.length} clients de test trouvés:`);
    testClients.forEach(client => {
      console.log(`   - ${client.name} (${client.email})`);
    });

    // Vérifier les sessions
    console.log('\n📅 Vérification des sessions:');
    const sessions = await Session.find({});
    console.log(`✅ ${sessions.length} sessions trouvées:`);
    sessions.forEach(session => {
      console.log(`   - ${session.title} (${session.status}) - ${session.price} MAD`);
    });

    // Vérifier les événements
    console.log('\n🎪 Vérification des événements:');
    const events = await Event.find({});
    console.log(`✅ ${events.length} événements trouvés:`);
    events.forEach(event => {
      console.log(`   - ${event.title} (${event.status}) - ${event.price} MAD`);
    });

    // Vérifier les produits
    console.log('\n🛍️ Vérification des produits:');
    const products = await Product.find({});
    console.log(`✅ ${products.length} produits trouvés:`);
    products.forEach(product => {
      console.log(`   - ${product.title} - ${product.price} MAD`);
    });

    // Vérifier les commandes
    console.log('\n📦 Vérification des commandes:');
    const orders = await Order.find({});
    console.log(`✅ ${orders.length} commandes trouvées:`);
    orders.forEach(order => {
      console.log(`   - ${order.orderNumber} (${order.status}) - ${order.totalAmount} MAD`);
    });

    // Résumé
    console.log('\n📊 Résumé des données:');
    console.log(`   - Utilisateur professionnel: ${professionalUser ? '✅' : '❌'}`);
    console.log(`   - Profil professionnel: ${professional ? '✅' : '❌'}`);
    console.log(`   - Clients de test: ${testClients.length}/3`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Événements: ${events.length}`);
    console.log(`   - Produits: ${products.length}`);
    console.log(`   - Commandes: ${orders.length}`);

    if (professionalUser && professional && testClients.length > 0) {
      console.log('\n🎉 Données de test prêtes pour les tests API!');
      console.log('💡 Vous pouvez maintenant exécuter: node scripts/testClientsAPI.js');
    } else {
      console.log('\n⚠️  Données de test incomplètes.');
      console.log('💡 Exécutez d\'abord: node scripts/createTestData.js');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkTestData();
}

module.exports = { checkTestData }; 