const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const Event = require('../models/Event');
const Product = require('../models/Product');
const User = require('../models/User');

async function createTestEventsAndProducts() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holisticcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Vérifier s'il y a des utilisateurs
    const users = await User.find({ role: 'professional' });
    console.log(`Trouvé ${users.length} utilisateurs professionnels`);

    // Trouver un professionnel existant
    const professionals = await Professional.find({}).populate('userId');
    
    let professional;
    if (professionals.length > 0) {
      professional = professionals[0]; // Utiliser le premier professionnel existant
      console.log(`Utilisation du professionnel existant: ${professional.businessName}`);
    } else {
      console.log('Aucun professionnel trouvé. Création d\'un professionnel de test...');
      
      // Créer un utilisateur test avec un email unique
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser = new User({
        firstName: 'Dr. Sarah',
        lastName: 'Benali',
        name: 'Dr. Sarah Benali', // Champ requis
        email: `test-pro-${Date.now()}@example.com`, // Email unique basé sur timestamp
        password: hashedPassword,
        role: 'professional',
        profileImage: 'default-avatar.jpg',
        isVerified: true,
      });

      await testUser.save();
      console.log('Utilisateur créé:', testUser.email);

      // Créer le profil professionnel
      professional = new Professional({
        userId: testUser._id,
        businessName: 'Centre de Bien-être Harmonie',
        businessType: 'wellness',
        title: 'Dr. Sarah Benali - Naturopathe & Coach Bien-être',
        description: 'Spécialiste en naturopathie et coaching bien-être avec plus de 10 ans d\'expérience.',
        address: 'Quartier Gauthier, Casablanca, Maroc',
        contactInfo: {
          email: testUser.email,
          phone: '+212 6 12 34 56 78'
        },
        isVerified: true,
        isActive: true
      });

      await professional.save();
      
      // Recharger avec population
      professional = await Professional.findById(professional._id).populate('userId');
      console.log('Professionnel créé:', professional.businessName);
    }

    console.log(`Création de données de test pour le professionnel: ${professional.businessName}`);

    // Créer des événements de test
    const events = [
      {
        title: 'Séance de Yoga Matinale',
        description: 'Commencez votre journée avec une séance de yoga revitalisante. Parfait pour tous les niveaux.',
        category: 'yoga',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1h30 plus tard
        time: '08:00',
        address: 'Studio Zen, Casablanca',
        eventType: 'in_person',
        price: 150,
        currency: 'MAD',
        maxParticipants: 15,
        professional: professional.userId._id,
        bookingType: 'in_person_payment',
        coverImages: ['event1.jpg'],
        featured: true,
        status: 'approved'
      },
      {
        title: 'Atelier de Méditation Pleine Conscience',
        description: 'Apprenez les techniques de méditation pour réduire le stress et améliorer votre bien-être.',
        category: 'meditation',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // 2h plus tard
        time: '14:00',
        address: 'Centre de Bien-être, Rabat',
        eventType: 'in_person',
        price: 200,
        currency: 'MAD',
        maxParticipants: 12,
        professional: professional.userId._id,
        bookingType: 'online_payment',
        coverImages: ['event2.jpg'],
        status: 'approved'
      },
      {
        title: 'Session d\'Aromathérapie en Ligne',
        description: 'Découvrez les bienfaits des huiles essentielles depuis chez vous.',
        category: 'aromatherapy',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1h plus tard
        time: '19:00',
        eventType: 'online',
        onlineLink: 'https://zoom.us/j/123456789',
        price: 0,
        currency: 'MAD',
        maxParticipants: 25,
        professional: professional.userId._id,
        bookingType: 'message_only',
        coverImages: ['event3.jpg'],
        status: 'approved'
      },
      {
        title: 'Retraite de Coaching Personnel',
        description: 'Une journée complète de coaching pour développer votre potentiel.',
        category: 'coaching',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Dans 21 jours
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8h plus tard
        time: '09:00',
        address: 'Resort Atlas, Marrakech',
        eventType: 'in_person',
        price: 800,
        currency: 'MAD',
        maxParticipants: 8,
        professional: professional.userId._id,
        bookingType: 'online_payment',
        coverImages: ['event4.jpg'],
        featured: true,
        status: 'approved'
      }
    ];

    // Créer des produits de test
    const products = [
      {
        professionalId: professional._id,
        name: 'Huile Essentielle de Lavande Bio',
        title: 'Huile Essentielle de Lavande Bio',
        description: 'Huile essentielle de lavande 100% pure et bio. Parfaite pour la relaxation et le sommeil.',
        category: 'aromatherapy',
        price: 89,
        currency: 'MAD',
        stock: 25,
        images: ['product1.jpg'],
        tags: ['bio', 'relaxation', 'sommeil', 'lavande'],
        status: 'approved',
        isActive: true,
        featured: true,
        specifications: [
          { name: 'Volume', value: '10ml' },
          { name: 'Origine', value: 'France' },
          { name: 'Certification', value: 'AB Bio' }
        ]
      },
      {
        professionalId: professional._id,
        name: 'Tapis de Yoga Écologique',
        title: 'Tapis de Yoga Écologique',
        description: 'Tapis de yoga en matériaux naturels, antidérapant et confortable.',
        category: 'yoga',
        price: 299,
        currency: 'MAD',
        stock: 15,
        images: ['product2.jpg'],
        tags: ['yoga', 'écologique', 'antidérapant', 'confort'],
        status: 'approved',
        isActive: true,
        sizeInventory: [
          { size: 'Standard', stock: 10 },
          { size: 'XL', stock: 5 }
        ],
        specifications: [
          { name: 'Matériau', value: 'Caoutchouc naturel' },
          { name: 'Dimensions', value: '183cm x 61cm' },
          { name: 'Épaisseur', value: '6mm' }
        ]
      },
      {
        professionalId: professional._id,
        name: 'Guide de Méditation pour Débutants',
        title: 'Guide de Méditation pour Débutants',
        description: 'Livre complet pour apprendre la méditation étape par étape.',
        category: 'books',
        price: 149,
        currency: 'MAD',
        stock: 30,
        images: ['product3.jpg'],
        tags: ['méditation', 'livre', 'débutant', 'guide'],
        status: 'approved',
        isActive: true,
        specifications: [
          { name: 'Pages', value: '200' },
          { name: 'Format', value: 'A5' },
          { name: 'Langue', value: 'Français' }
        ]
      },
      {
        professionalId: professional._id,
        name: 'Complément Alimentaire Stress & Anxiété',
        title: 'Complément Alimentaire Stress & Anxiété',
        description: 'Formule naturelle pour aider à gérer le stress et l\'anxiété au quotidien.',
        category: 'supplements',
        price: 179,
        currency: 'MAD',
        stock: 20,
        images: ['product4.jpg'],
        tags: ['stress', 'anxiété', 'naturel', 'bien-être'],
        status: 'approved',
        isActive: true,
        specifications: [
          { name: 'Gélules', value: '60 gélules' },
          { name: 'Posologie', value: '2 gélules/jour' },
          { name: 'Composition', value: 'Ashwagandha, Magnésium, Vitamine B' }
        ]
      }
    ];

    // Insérer les événements
    console.log('Création des événements...');
    await Event.deleteMany({ professional: professional.userId._id }); // Nettoyer les anciens
    const createdEvents = await Event.insertMany(events);
    console.log(`${createdEvents.length} événements créés`);

    // Insérer les produits
    console.log('Création des produits...');
    await Product.deleteMany({ professionalId: professional._id }); // Nettoyer les anciens
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} produits créés`);

    console.log('\n✅ Données de test créées avec succès !');
    console.log(`Professionnel ID: ${professional._id}`);
    console.log(`User ID du professionnel: ${professional.userId._id}`);
    console.log('Vous pouvez maintenant tester les pages:');
    console.log(`- Événements: http://localhost:3000/professionals/${professional._id}/events`);
    console.log(`- Produits: http://localhost:3000/professionals/${professional._id}/products`);

  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTestEventsAndProducts();
}

module.exports = createTestEventsAndProducts;
