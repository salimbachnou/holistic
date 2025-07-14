const mongoose = require('mongoose');
require('../models');
const Product = mongoose.model('Product');
const Professional = mongoose.model('Professional');

async function createRealisticProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/holistic');
    console.log('MongoDB connected');

    // Trouver un professionnel existant
    const professional = await Professional.findOne({
      businessName: 'Centre Bien-être Harmonie'
    });

    if (!professional) {
      console.log('❌ Professionnel non trouvé');
      return;
    }

    // Créer des produits réalistes
    const products = [
      {
        name: 'Huile Essentielle de Lavande Bio',
        title: 'Huile Essentielle de Lavande Bio',
        description: 'Huile essentielle de lavande vraie (Lavandula angustifolia) 100% pure et naturelle. Idéale pour la relaxation, l\'amélioration du sommeil et la réduction du stress. Certifiée bio et distillée artisanalement en Provence. Utilisation : diffusion, massage dilué, bain relaxant.',
        price: 24.90,
        currency: 'EUR',
        category: 'aromatherapy',
        images: [
          'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        stock: 25,
        professionalId: professional._id,
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['bio', 'relaxation', 'sommeil', 'stress', 'provence'],
        rating: {
          average: 4.8,
          totalReviews: 23
        },
        specifications: [
          { name: 'Volume', value: '10ml' },
          { name: 'Origine', value: 'Provence, France' },
          { name: 'Certification', value: 'AB (Agriculture Biologique)' },
          { name: 'Méthode', value: 'Distillation à la vapeur d\'eau' },
          { name: 'Pureté', value: '100%' }
        ]
      },
      {
        name: 'Kit de Méditation Zen Complet',
        title: 'Kit de Méditation Zen Complet',
        description: 'Kit complet pour débuter ou approfondir votre pratique méditative. Comprend : un coussin de méditation ergonomique, un tapis de yoga antidérapant, un bol tibétain avec maillet, un guide de méditation illustré et un diffuseur d\'huiles essentielles. Parfait pour créer votre espace de sérénité.',
        price: 89.99,
        currency: 'EUR',
        category: 'meditation',
        images: [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        stock: 15,
        professionalId: professional._id,
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['méditation', 'zen', 'relaxation', 'bol tibétain', 'yoga'],
        rating: {
          average: 4.6,
          totalReviews: 18
        },
        specifications: [
          { name: 'Coussin', value: '33cm de diamètre, garnissage sarrasin' },
          { name: 'Tapis', value: '173 x 61 cm, épaisseur 6mm' },
          { name: 'Bol tibétain', value: 'Bronze, diamètre 10cm' },
          { name: 'Guide', value: '120 pages illustrées' },
          { name: 'Diffuseur', value: 'Ultrasonique 300ml' }
        ]
      },
      {
        name: 'Complément Alimentaire Anti-Stress Naturel',
        title: 'Complément Alimentaire Anti-Stress Naturel',
        description: 'Formule naturelle à base de plantes adaptogènes pour gérer le stress quotidien et retrouver l\'équilibre émotionnel. Contient de l\'ashwagandha, rhodiola, magnésium et vitamines B. 60 gélules végétales pour 2 mois de cure. Sans additifs chimiques, convient aux végétariens.',
        price: 32.50,
        currency: 'EUR',
        category: 'nutrition',
        images: [
          'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        stock: 40,
        professionalId: professional._id,
        status: 'approved',
        isActive: true,
        featured: false,
        tags: ['stress', 'adaptogène', 'naturel', 'magnésium', 'ashwagandha'],
        rating: {
          average: 4.4,
          totalReviews: 31
        },
        specifications: [
          { name: 'Conditionnement', value: '60 gélules végétales' },
          { name: 'Posologie', value: '2 gélules par jour' },
          { name: 'Durée', value: '1 mois de cure' },
          { name: 'Composition', value: 'Extraits végétaux titrés' },
          { name: 'Certification', value: 'Laboratoire français' }
        ]
      },
      {
        name: 'Livre "Guide Complet de la Nutrition Holistique"',
        title: 'Guide Complet de la Nutrition Holistique',
        description: 'Manuel complet de 350 pages écrit par notre équipe de nutritionnistes holistiques. Découvrez les principes d\'une alimentation consciente, les superaliments, les cures détox saisonnières et plus de 100 recettes santé. Inclus : planning de menus et carnet de suivi personnalisé.',
        price: 28.00,
        currency: 'EUR',
        category: 'books',
        images: [
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        stock: 30,
        professionalId: professional._id,
        status: 'approved',
        isActive: true,
        featured: false,
        tags: ['nutrition', 'alimentation', 'santé', 'recettes', 'détox'],
        rating: {
          average: 4.7,
          totalReviews: 42
        },
        specifications: [
          { name: 'Pages', value: '350 pages couleur' },
          { name: 'Format', value: '21 x 24 cm' },
          { name: 'Reliure', value: 'Broché avec rabats' },
          { name: 'Contenu', value: '100+ recettes' },
          { name: 'Bonus', value: 'Carnet de suivi détachable' }
        ]
      },
      {
        name: 'Tapis de Yoga Écologique Premium',
        title: 'Tapis de Yoga Écologique Premium',
        description: 'Tapis de yoga haut de gamme en caoutchouc naturel et liège, offrant une adhérence exceptionnelle et un confort optimal. Dimensions 183x68cm, épaisseur 6mm. Hypoallergénique, antibactérien naturellement et respectueux de l\'environnement. Livré avec sangle de transport en coton bio.',
        price: 75.00,
        currency: 'EUR',
        category: 'yoga',
        images: [
          'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        stock: 20,
        professionalId: professional._id,
        status: 'approved',
        isActive: true,
        featured: true,
        tags: ['yoga', 'écologique', 'liège', 'premium', 'antidérapant'],
        rating: {
          average: 4.9,
          totalReviews: 56
        },
        specifications: [
          { name: 'Dimensions', value: '183 x 68 cm' },
          { name: 'Épaisseur', value: '6mm optimale' },
          { name: 'Matières', value: 'Caoutchouc naturel + liège' },
          { name: 'Poids', value: '2.3 kg' },
          { name: 'Garantie', value: '2 ans' }
        ]
      }
    ];

    // Supprimer les anciens produits de test
    await Product.deleteMany({
      professionalId: professional._id,
      name: { $in: ['fz', 'dzadz', 'zddza', 'dza', 'dzad'] }
    });

    // Créer les nouveaux produits
    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Produit créé: ${product.name} (ID: ${product._id})`);
    }

    console.log(`🎉 SUCCÈS ! ${products.length} produits réalistes créés`);
    console.log(`🛍️ Testez maintenant : http://localhost:3000/products/[ID]`);
    
    mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');

  } catch (error) {
    console.error('❌ Erreur:', error);
    mongoose.disconnect();
  }
}

createRealisticProducts();
