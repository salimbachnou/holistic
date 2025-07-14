const mongoose = require('mongoose');
require('../models');
const Product = mongoose.model('Product');

async function getProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/holistic');
    const products = await Product.find().limit(10).select('_id name').lean();
    console.log('Produits disponibles:');
    products.forEach(p => console.log(`- ${p._id}: ${p.name}`));
    mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

getProducts();
