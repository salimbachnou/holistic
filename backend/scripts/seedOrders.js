const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Professional = require('../models/Professional');

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Fonction pour générer un ID de commande aléatoire
const generateOrderNumber = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Fonction pour générer une date aléatoire dans les 30 derniers jours
const randomDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  return date;
};

// Fonction principale pour créer des commandes
const seedOrders = async () => {
  try {
    // Supprimer les commandes existantes
    await Order.deleteMany({});
    console.log('Commandes existantes supprimées');

    // Récupérer des clients
    const clients = await User.find({ role: 'client' }).limit(5);
    if (clients.length === 0) {
      console.log('Aucun client trouvé. Création d\'un client de test...');
      const testClient = new User({
        email: 'client@test.com',
        password: 'password123',
        firstName: 'Client',
        lastName: 'Test',
        name: 'Client Test',
        role: 'client',
        isVerified: true
      });
      await testClient.save();
      clients.push(testClient);
    }

    // Récupérer des professionnels
    const professionals = await Professional.find({}).limit(3);
    if (professionals.length === 0) {
      console.log('Aucun professionnel trouvé. Veuillez d\'abord créer des professionnels.');
      return;
    }

    // Récupérer des produits
    const products = await Product.find({}).limit(10);
    if (products.length === 0) {
      console.log('Aucun produit trouvé. Veuillez d\'abord créer des produits.');
      return;
    }

    // Statuts possibles
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const paymentMethods = ['credit_card', 'cash_on_delivery', 'bank_transfer', 'other'];

    // Créer 20 commandes
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const professional = professionals[Math.floor(Math.random() * professionals.length)];
      
      // Générer 1-3 produits pour cette commande
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let totalAmount = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = {
          amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
          currency: 'MAD'
        };
        
        orderItems.push({
          product: product._id,
          professional: professional._id,
          quantity,
          price,
          options: {}
        });
        
        totalAmount += price.amount * quantity;
      }
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const createdAt = randomDate();
      
      const order = new Order({
        orderNumber: generateOrderNumber(),
        clientId: client._id,
        items: orderItems,
        totalAmount: {
          amount: parseFloat(totalAmount.toFixed(2)),
          currency: 'MAD'
        },
        status,
        paymentStatus,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        shippingAddress: {
          firstName: client.firstName,
          lastName: client.lastName,
          street: '123 Rue Test',
          city: 'Casablanca',
          postalCode: '20000',
          country: 'Morocco',
          phone: '+212600000000'
        },
        createdAt,
        updatedAt: createdAt
      });
      
      // Ajouter des entrées timeline en fonction du statut
      const timeline = [{
        status: 'pending',
        note: 'Commande créée',
        timestamp: createdAt
      }];
      
      // Si le statut n'est pas pending, ajouter des étapes intermédiaires
      if (status !== 'pending') {
        const processingDate = new Date(createdAt);
        processingDate.setHours(processingDate.getHours() + 2);
        timeline.push({
          status: 'processing',
          note: 'Commande en cours de traitement',
          timestamp: processingDate
        });
        
        if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
          const shippedDate = new Date(processingDate);
          shippedDate.setHours(shippedDate.getHours() + 24);
          
          if (status !== 'cancelled') {
            timeline.push({
              status: 'shipped',
              note: 'Commande expédiée',
              timestamp: shippedDate
            });
          }
          
          if (status === 'delivered') {
            const deliveredDate = new Date(shippedDate);
            deliveredDate.setHours(deliveredDate.getHours() + 48);
            timeline.push({
              status: 'delivered',
              note: 'Commande livrée',
              timestamp: deliveredDate
            });
          } else if (status === 'cancelled') {
            const cancelledDate = new Date(processingDate);
            cancelledDate.setHours(cancelledDate.getHours() + 4);
            timeline.push({
              status: 'cancelled',
              note: 'Commande annulée',
              timestamp: cancelledDate
            });
          } else if (status === 'refunded') {
            const shippedDate = new Date(processingDate);
            shippedDate.setHours(shippedDate.getHours() + 24);
            timeline.push({
              status: 'shipped',
              note: 'Commande expédiée',
              timestamp: shippedDate
            });
            
            const refundedDate = new Date(shippedDate);
            refundedDate.setHours(refundedDate.getHours() + 72);
            timeline.push({
              status: 'refunded',
              note: 'Commande remboursée',
              timestamp: refundedDate
            });
          }
        }
      }
      
      order.timeline = timeline;
      orders.push(order);
    }
    
    // Enregistrer toutes les commandes
    await Order.insertMany(orders);
    console.log(`${orders.length} commandes créées avec succès!`);
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Erreur lors de la création des commandes:', error);
    mongoose.connection.close();
  }
};

// Exécuter la fonction
seedOrders(); 