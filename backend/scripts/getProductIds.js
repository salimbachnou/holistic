const mongoose = require('mongoose');
require('../models');
const Product = mongoose.model('Product');

async function getProducts() {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    const products = await Product.find().limit(10).select('_id name').lean();
    console.log('Produits disponibles:');
    products.forEach(p => console.log(`- ${p._id}: ${p.name}`));
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

getProducts();
