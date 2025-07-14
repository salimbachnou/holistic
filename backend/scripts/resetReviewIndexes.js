require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function resetReviewIndexes() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    
    // Option 1: Supprimer la collection (si elle est vide ou si vous voulez tout réinitialiser)
    console.log('\n🔍 Vérification de la collection reviews...');
    const collections = await db.listCollections({ name: 'reviews' }).toArray();
    
    if (collections.length > 0) {
      const collection = db.collection('reviews');
      const count = await collection.countDocuments();
      console.log(`   Nombre de documents: ${count}`);
      
      if (count === 0) {
        console.log('🗑️  Collection vide, suppression...');
        await db.dropCollection('reviews');
        console.log('✅ Collection supprimée');
      } else {
        console.log('\n⚠️  La collection contient des données.');
        console.log('   Option 1: Exécutez "node fixReviewIndexes.js" pour corriger les index');
        console.log('   Option 2: Supprimez manuellement les données si vous voulez tout réinitialiser');
        
        // Supprimer uniquement les index non-_id
        console.log('\n🗑️  Suppression de tous les index (sauf _id)...');
        const indexes = await collection.listIndexes().toArray();
        
        for (const index of indexes) {
          if (index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`   ✅ Index ${index.name} supprimé`);
            } catch (error) {
              console.error(`   ❌ Erreur lors de la suppression de ${index.name}:`, error.message);
            }
          }
        }
      }
    }
    
    // Forcer Mongoose à recréer la collection avec les bons index
    console.log('\n🔨 Création de la collection avec les bons index...');
    
    // Charger le modèle Review
    require('../models/Review');
    const Review = mongoose.model('Review');
    
    // Créer un document temporaire pour forcer la création de la collection
    try {
      const tempReview = new Review({
        clientId: new mongoose.Types.ObjectId(),
        professionalId: new mongoose.Types.ObjectId(),
        contentType: 'product',
        contentId: new mongoose.Types.ObjectId(),
        contentTitle: 'Temp',
        rating: 5,
        comment: 'Temporary review for index creation',
        status: 'pending'
      });
      
      await tempReview.save();
      console.log('✅ Document temporaire créé');
      
      // Supprimer immédiatement le document temporaire
      await Review.deleteOne({ _id: tempReview._id });
      console.log('✅ Document temporaire supprimé');
    } catch (error) {
      console.log('⚠️  Impossible de créer un document temporaire:', error.message);
    }
    
    // Lister les index finaux
    const finalCollection = db.collection('reviews');
    console.log('\n📋 Index finaux:');
    const finalIndexes = await finalCollection.listIndexes().toArray();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n✅ Réinitialisation terminée');
    console.log('   Les index seront créés automatiquement lors de la première insertion');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le script
resetReviewIndexes(); 