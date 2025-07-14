const mongoose = require('mongoose');
require('../models');

const Product = mongoose.model('Product');
const Review = mongoose.model('Review');
const User = mongoose.model('User');

const createProductReviews = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Find a product to add reviews to - prefer "Centre Bien-être Harmonie" products
    const product = await Product.findOne({ 
      status: 'approved', 
      isActive: true,
      name: /lavande|méditation|stress|nutrition|yoga/i  // Target specific products
    }).populate('professionalId');
    
    if (!product) {
      console.log('❌ Aucun produit cible trouvé');
      return;
    }

    console.log(`📦 Produit trouvé: ${product.name} (${product._id})`);

    // Find some users to create reviews
    const users = await User.find({ role: 'client' }).limit(5);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur client trouvé. Veuillez créer des utilisateurs clients d\'abord.');
      return;
    }
    
    console.log(`✅ ${users.length} utilisateurs clients trouvés`);

    // Ensure we have at least 5 users (use same users multiple times if needed)
    while (users.length < 5) {
      users.push(users[0]);
    }

    // Check if reviews already exist for this product
    const existingReviews = await Review.find({
      contentId: product._id,
      contentType: 'product'
    });

    if (existingReviews.length > 0) {
      console.log(`✅ ${existingReviews.length} avis existent déjà pour ce produit`);
      return;
    }

    // Create reviews
    const reviewsData = [
      {
        rating: 5,
        comment: 'Produit excellent ! Je recommande vivement. La qualité est au rendez-vous et l\'effet est immédiat.',
        tags: ['qualité', 'service'],
        clientId: users[0]._id,
        professionalId: product.professionalId._id,
        contentId: product._id,
        contentType: 'product',
        contentTitle: product.name,
        status: 'approved'
      },
      {
        rating: 4,
        comment: 'Très bon produit, conforme à mes attentes. Livraison rapide et emballage soigné.',
        tags: ['livraison', 'qualité'],
        clientId: users[1]._id,
        professionalId: product.professionalId._id,
        contentId: product._id,
        contentType: 'product',
        contentTitle: product.name,
        status: 'approved'
      },
      {
        rating: 5,
        comment: 'Je suis absolument ravie de cet achat ! Le produit correspond parfaitement à la description et dépasse même mes attentes.',
        tags: ['qualité', 'service'],
        clientId: users[2]._id,
        professionalId: product.professionalId._id,
        contentId: product._id,
        contentType: 'product',
        contentTitle: product.name,
        status: 'approved',
        professionalResponse: 'Merci beaucoup pour ce retour positif ! Nous sommes ravis que le produit vous satisfasse.',
        respondedAt: new Date()
      },
      {
        rating: 4,
        comment: 'Bon rapport qualité-prix. Le produit est de bonne qualité et répond à mes besoins.',
        tags: ['prix', 'qualité'],
        clientId: users[3]._id,
        professionalId: product.professionalId._id,
        contentId: product._id,
        contentType: 'product',
        contentTitle: product.name,
        status: 'approved'
      },
      {
        rating: 3,
        comment: 'Produit correct sans plus. Il fait le travail mais rien d\'exceptionnel. Service client réactif.',
        tags: ['service', 'communication'],
        clientId: users[4]._id,
        professionalId: product.professionalId._id,
        contentId: product._id,
        contentType: 'product',
        contentTitle: product.name,
        status: 'approved'
      }
    ];

    const reviews = await Review.insertMany(reviewsData);
    console.log(`✅ ${reviews.length} avis créés pour le produit "${product.name}"`);

    // Calculate average rating and update product
    const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
    
    await Product.findByIdAndUpdate(product._id, {
      $set: {
        'rating.average': parseFloat(avgRating.toFixed(1)),
        'rating.totalReviews': reviewsData.length
      }
    });

    console.log(`✅ Note moyenne du produit mise à jour: ${avgRating.toFixed(1)}/5 (${reviewsData.length} avis)`);
    console.log(`🔗 URL du produit: http://hamza-aourass.ddns.net:3002/products/${product._id}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

if (require.main === module) {
  createProductReviews();
}

module.exports = createProductReviews;
