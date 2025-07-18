const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Event = require('../models/Event');
const Product = require('../models/Product');

async function createEventsForProfessional() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    console.log('MongoDB connected');

    const professionalId = '684334cc016361b53a41404d';
    const professional = await Professional.findById(professionalId).populate('userId');
    
    if (!professional) {
      console.log('Professionnel non trouvé');
      return;
    }

    console.log(`Création d'événements pour: ${professional.businessName}`);
    console.log(`User ID: ${professional.userId._id}`);

    // Supprimer les anciens événements de ce professionnel
    await Event.deleteMany({ professional: professional.userId._id });
    await Product.deleteMany({ professionalId: professionalId });

    // Créer des événements de test
    const events = [
      {
        title: 'Séance de Yoga Matinale',
        description: 'Commencez votre journée en douceur avec cette séance de yoga accessible à tous les niveaux. Nous travaillerons sur la flexibilité, la force et la relaxation.',
        category: 'yoga',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // +1h30
        time: '08:00',
        address: 'Centre Bien-être Harmonie, Quartier Gauthier, Casablanca',
        eventType: 'in_person',
        price: 150,
        currency: 'MAD',
        maxParticipants: 15,
        professional: professional.userId._id,
        status: 'approved',
        featured: true,
        coverImages: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'],
        participants: []
      },
      {
        title: 'Atelier de Méditation Pleine Conscience',
        description: 'Apprenez les techniques de méditation pour réduire le stress et améliorer votre bien-être mental. Séance guidée pour débutants et intermédiaires.',
        category: 'meditation',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        time: '19:00',
        address: 'Centre Bien-être Harmonie, Quartier Gauthier, Casablanca',
        eventType: 'in_person',
        price: 200,
        currency: 'MAD',
        maxParticipants: 12,
        professional: professional.userId._id,
        status: 'approved',
        coverImages: ['https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=500'],
        participants: []
      },
      {
        title: 'Session d\'Aromathérapie en Ligne',
        description: 'Découvrez les bienfaits des huiles essentielles depuis chez vous. Nous explorerons les propriétés thérapeutiques et les applications pratiques.',
        category: 'aromatherapy',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        time: '20:00',
        eventType: 'online',
        onlineLink: 'https://zoom.us/j/example123',
        price: 120,
        currency: 'MAD',
        maxParticipants: 25,
        professional: professional.userId._id,
        status: 'approved',
        coverImages: ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500'],
        participants: []
      },
      {
        title: 'Retraite de Coaching Personnel',
        description: 'Une journée complète de coaching pour définir et atteindre vos objectifs de vie. Travail individuel et en groupe pour un développement personnel optimal.',
        category: 'coaching',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        time: '09:00',
        address: 'Centre Bien-être Harmonie, Quartier Gauthier, Casablanca',
        eventType: 'in_person',
        price: 800,
        currency: 'MAD',
        maxParticipants: 8,
        professional: professional.userId._id,
        status: 'approved',
        featured: true,
        coverImages: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=500'],
        participants: []
      },
      {
        title: 'Atelier Nutrition Holistique',
        description: 'Apprenez à adopter une alimentation saine selon les principes de la nutrition holistique. Conseils pratiques et recettes santé.',
        category: 'nutrition',
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        time: '14:00',
        address: 'Centre Bien-être Harmonie, Quartier Gauthier, Casablanca',
        eventType: 'in_person',
        price: 300,
        currency: 'MAD',
        maxParticipants: 20,
        professional: professional.userId._id,
        status: 'approved',
        coverImages: ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500'],
        participants: []
      }
    ];

    for (const eventData of events) {
      const event = new Event(eventData);
      await event.save();
      console.log(`✅ Événement créé: ${event.title}`);
    }

    // Créer des produits de test
    const products = [
      {
        professionalId: professionalId,
        name: 'Huile Essentielle de Lavande Bio',
        title: 'Huile Essentielle de Lavande Bio',
        description: 'Huile essentielle de lavande pure et biologique, parfaite pour la relaxation et le sommeil. Certifiée bio et 100% naturelle.',
        category: 'aromatherapy',
        price: 45,
        currency: 'MAD',
        stock: 25,
        images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500'],
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['bio', 'relaxation', 'sommeil', 'naturel']
      },
      {
        professionalId: professionalId,
        name: 'Kit de Méditation Complet',
        title: 'Kit de Méditation Complet',
        description: 'Ensemble complet pour débuter la méditation : coussin ergonomique, guide d\'exercices illustré et encens naturel.',
        category: 'meditation',
        price: 120,
        currency: 'MAD',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'],
        status: 'approved',
        isActive: true,
        tags: ['méditation', 'kit', 'débutant', 'coussin']
      },
      {
        professionalId: professionalId,
        name: 'Complément Alimentaire Stress & Anxiété',
        title: 'Complément Alimentaire Stress & Anxiété',
        description: 'Complément naturel à base de plantes adaptogènes pour gérer le stress et l\'anxiété au quotidien. Formule exclusive.',
        category: 'wellness',
        price: 80,
        currency: 'MAD',
        stock: 40,
        images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500'],
        status: 'approved',
        isActive: true,
        tags: ['stress', 'anxiété', 'naturel', 'plantes']
      },
      {
        professionalId: professionalId,
        name: 'Guide de Nutrition Holistique',
        title: 'Guide de Nutrition Holistique',
        description: 'Guide complet de 200 pages pour adopter une alimentation saine et équilibrée selon les principes holistiques. Avec plans de repas.',
        category: 'nutrition',
        price: 35,
        currency: 'MAD',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500'],
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['nutrition', 'guide', 'alimentation', 'santé']
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Produit créé: ${product.name}`);
    }

    console.log(`\n🎉 SUCCÈS ! ${events.length} événements et ${products.length} produits créés`);
    console.log(`\n📱 Testez maintenant :`);
    console.log(`- Événements: https://holistic-maroc.vercel.app/professionals/${professionalId}/events`);
    console.log(`- Produits: https://holistic-maroc.vercel.app/professionals/${professionalId}/products`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion de MongoDB');
  }
}

createEventsForProfessional();
