const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Event = require('../models/Event');
const Product = require('../models/Product');

async function createTestDataForSpecificProfessional() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holisticcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Utiliser le professionnel "Centre Bien-être Harmonie"
    const professionalId = '684334cc016361b53a41404d';
    const professional = await Professional.findById(professionalId).populate('userId');
    
    if (!professional) {
      console.log('Professionnel non trouvé avec l\'ID:', professionalId);
      return;
    }

    console.log(`Création de données de test pour: ${professional.businessName}`);
    console.log(`User ID: ${professional.userId._id}`);

    // Supprimer les anciens événements et produits de ce professionnel
    await Event.deleteMany({ professional: professional.userId._id });
    await Product.deleteMany({ professionalId: professionalId });

    // Créer des événements de test
    const events = [
      {
        title: 'Séance de Yoga Matinale',
        description: 'Commencez votre journée en douceur avec cette séance de yoga accessible à tous les niveaux.',
        category: 'yoga',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
        time: '08:00',
        address: 'Centre Bien-être Harmonie, Casablanca',
        eventType: 'in_person',
        price: 150,
        currency: 'MAD',
        maxParticipants: 15,
        professional: professional.userId._id,
        status: 'approved',
        featured: true,
        coverImages: ['event-yoga.jpg']
      },
      {
        title: 'Atelier de Méditation Pleine Conscience',
        description: 'Apprenez les techniques de méditation pour réduire le stress et améliorer votre bien-être.',
        category: 'meditation',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
        time: '19:00',
        address: 'Centre Bien-être Harmonie, Casablanca',
        eventType: 'in_person',
        price: 200,
        currency: 'MAD',
        maxParticipants: 12,
        professional: professional.userId._id,
        status: 'approved',
        coverImages: ['event-meditation.jpg']
      },
      {
        title: 'Session d\'Aromathérapie en Ligne',
        description: 'Découvrez les bienfaits des huiles essentielles depuis chez vous.',
        category: 'aromatherapy',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        time: '20:00',
        eventType: 'online',
        onlineLink: 'https://zoom.us/j/example',
        price: 120,
        currency: 'MAD',
        maxParticipants: 25,
        professional: professional.userId._id,
        status: 'approved',
        coverImages: ['event-aromatherapy.jpg']
      },
      {
        title: 'Retraite de Coaching Personnel',
        description: 'Une journée complète de coaching pour définir et atteindre vos objectifs de vie.',
        category: 'coaching',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        time: '09:00',
        address: 'Centre Bien-être Harmonie, Casablanca',
        eventType: 'in_person',
        price: 800,
        currency: 'MAD',
        maxParticipants: 8,
        professional: professional.userId._id,
        status: 'approved',
        featured: true,
        coverImages: ['event-coaching.jpg']
      }
    ];

    for (const eventData of events) {
      const event = new Event(eventData);
      await event.save();
    }
    console.log(`${events.length} événements créés`);

    // Créer des produits de test
    const products = [
      {
        professionalId: professionalId,
        name: 'Huile Essentielle de Lavande Bio',
        title: 'Huile Essentielle de Lavande Bio',
        description: 'Huile essentielle de lavande pure et biologique, parfaite pour la relaxation et le sommeil.',
        category: 'aromatherapy',
        price: 45,
        currency: 'MAD',
        stock: 25,
        images: ['product-lavender.jpg'],
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['bio', 'relaxation', 'sommeil', 'naturel']
      },
      {
        professionalId: professionalId,
        name: 'Kit de Méditation Complet',
        title: 'Kit de Méditation Complet',
        description: 'Ensemble complet pour débuter la méditation : coussin, guide d\'exercices et encens.',
        category: 'meditation',
        price: 120,
        currency: 'MAD',
        stock: 15,
        images: ['product-meditation-kit.jpg'],
        status: 'approved',
        isActive: true,
        tags: ['méditation', 'kit', 'débutant', 'coussin']
      },
      {
        professionalId: professionalId,
        name: 'Complément Alimentaire Stress & Anxiété',
        title: 'Complément Alimentaire Stress & Anxiété',
        description: 'Complément naturel à base de plantes pour gérer le stress et l\'anxiété au quotidien.',
        category: 'wellness',
        price: 80,
        currency: 'MAD',
        stock: 40,
        images: ['product-supplement.jpg'],
        status: 'approved',
        isActive: true,
        tags: ['stress', 'anxiété', 'naturel', 'plantes']
      },
      {
        professionalId: professionalId,
        name: 'Guide de Nutrition Holistique',
        title: 'Guide de Nutrition Holistique',
        description: 'Guide complet pour adopter une alimentation saine et équilibrée selon les principes holistiques.',
        category: 'nutrition',
        price: 35,
        currency: 'MAD',
        stock: 50,
        images: ['product-nutrition-guide.jpg'],
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['nutrition', 'guide', 'alimentation', 'santé']
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
    }
    console.log(`${products.length} produits créés`);

    console.log('✅ Données de test créées avec succès !');
    console.log(`Professionnel ID: ${professionalId}`);
    console.log(`User ID du professionnel: ${professional.userId._id}`);
    console.log('Vous pouvez maintenant tester les pages:');
    console.log(`- Événements: http://localhost:3000/professionals/${professionalId}/events`);
    console.log(`- Produits: http://localhost:3000/professionals/${professionalId}/products`);

  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
}

createTestDataForSpecificProfessional();
