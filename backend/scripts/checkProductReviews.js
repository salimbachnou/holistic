const mongoose = require('mongoose');
require('../models');

const Product = mongoose.model('Product');
const Review = mongoose.model('Review');

const checkProductReviews = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connecté à MongoDB');

    // Get all active products
    const products = await Product.find({ 
      status: 'approved', 
      isActive: true 
    }).populate('professionalId', 'businessName name');

    console.log(`📦 ${products.length} produits actifs trouvés:`);

    for (const product of products) {
      const reviewCount = await Review.countDocuments({
        contentId: product._id,
        contentType: 'product',
        status: 'approved'
      });

      const professional = product.professionalId?.businessName || product.professionalId?.name || 'Professionnel inconnu';
      
      console.log(`  - ${product.name} (ID: ${product._id})`);
      console.log(`    👤 Professionnel: ${professional}`);
      console.log(`    ⭐ ${reviewCount} avis`);
      console.log(`    🔗 URL: https://holistic-maroc.vercel.app/products/${product._id}`);
      console.log('');
    }

    // Show reviews summary
    const totalReviews = await Review.countDocuments({
      contentType: 'product',
      status: 'approved'
    });

    console.log(`📊 Total: ${totalReviews} avis approuvés pour les produits`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

if (require.main === module) {
  checkProductReviews();
}

module.exports = checkProductReviews;
