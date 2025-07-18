const mongoose = require('mongoose');
require('../models');
const Product = mongoose.model('Product');
const Professional = mongoose.model('Professional');

async function checkProducts() {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    const professionalId = '684334cc016361b53a41404d';
    
    // Vérifier le professionnel
    const professional = await Professional.findById(professionalId);
    console.log('Professionnel trouvé:', professional ? professional.businessName : 'Non trouvé');
    
    // Vérifier les produits
    const products = await Product.find({ professionalId }).select('_id name status isActive');
    console.log('Produits trouvés:', products.length);
    products.forEach(p => console.log(`- ${p._id}: ${p.name} (status: ${p.status}, active: ${p.isActive})`));
    
    // Vérifier tous les produits
    const allProducts = await Product.find().select('_id name professionalId status isActive');
    console.log('\nTous les produits:', allProducts.length);
    allProducts.forEach(p => console.log(`- ${p._id}: ${p.name} (prof: ${p.professionalId})`));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
    mongoose.disconnect();
  }
}

checkProducts();
