const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Professional = require('../models/Professional');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function debugOrders() {
  try {
    console.log('🔍 Diagnostic des commandes...\n');

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
    products.forEach(product => {
      console.log(`   - ${product.name || product.title}: ${product.price} MAD`);
    });

    // Trouver les utilisateurs clients de test
    const testClients = await User.find({
      email: { $in: ['client1@test.com', 'client2@test.com', 'client3@test.com'] }
    });
    console.log('✅ Clients de test trouvés:', testClients.length);

    // Trouver toutes les commandes
    const allOrders = await Order.find({}).populate('clientId', 'firstName lastName email');
    console.log('✅ Toutes les commandes trouvées:', allOrders.length);

    allOrders.forEach(order => {
      console.log(`\n📦 Commande ${order.orderNumber}:`);
      console.log(`   Client: ${order.clientId ? `${order.clientId.firstName} ${order.clientId.lastName}` : 'N/A'}`);
      console.log(`   Statut: ${order.status}`);
      console.log(`   Montant total: ${order.totalAmount ? order.totalAmount.amount : 'N/A'} MAD`);
      console.log(`   Items: ${order.items.length}`);
      order.items.forEach((item, index) => {
        console.log(`     Item ${index + 1}: ${item.quantity}x - Prix: ${item.price ? (item.price.amount || item.price) : 'N/A'} MAD`);
      });
    });

    // Vérifier les commandes liées aux produits du professionnel
    const productIds = products.map(p => p._id);
    const professionalOrders = await Order.find({
      'items.product': { $in: productIds }
    }).populate('clientId', 'firstName lastName email');
    
    console.log(`\n🎯 Commandes liées aux produits du professionnel: ${professionalOrders.length}`);
    professionalOrders.forEach(order => {
      console.log(`   - ${order.orderNumber}: ${order.clientId ? `${order.clientId.firstName} ${order.clientId.lastName}` : 'N/A'}`);
    });

    // Test de la logique de filtrage
    console.log('\n🔍 Test de la logique de filtrage:');
    allOrders.forEach(order => {
      const professionalItems = order.items.filter(item => 
        productIds.some(id => id.toString() === item.product.toString())
      );
      console.log(`   Commande ${order.orderNumber}: ${professionalItems.length} items du professionnel`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  debugOrders();
}

module.exports = { debugOrders }; 