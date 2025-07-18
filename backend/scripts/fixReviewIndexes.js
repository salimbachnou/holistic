require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function fixReviewIndexes() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('reviews');

    // Lister tous les index actuels
    console.log('\n📋 Index actuels:');
    const currentIndexes = await collection.listIndexes().toArray();
    currentIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Supprimer l'ancien index problématique
    try {
      console.log('\n🗑️  Suppression de l\'ancien index userId_1_targetId_1_targetType_1...');
      await collection.dropIndex('userId_1_targetId_1_targetType_1');
      console.log('✅ Ancien index supprimé');
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠️  L\'index n\'existe pas (déjà supprimé)');
      } else {
        console.error('❌ Erreur lors de la suppression:', error.message);
      }
    }

    // Supprimer d'autres anciens index potentiels
    const oldIndexesToDrop = [
      'userId_1_productId_1',
      'userId_1_eventId_1',
      'userId_1_sessionId_1'
    ];

    for (const indexName of oldIndexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Index ${indexName} supprimé`);
      } catch (error) {
        // Ignorer si l'index n'existe pas
      }
    }

    // Créer l'index unique pour éviter les doublons d'avis
    console.log('\n🔨 Création du nouvel index unique...');
    try {
      await collection.createIndex(
        { clientId: 1, contentId: 1, contentType: 1 },
        { 
          unique: true,
          name: 'clientId_1_contentId_1_contentType_1',
          background: true
        }
      );
      console.log('✅ Nouvel index unique créé');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️  Des doublons existent dans la collection');
        console.log('   Nettoyage des doublons nécessaire avant de créer l\'index unique');
      } else {
        console.error('❌ Erreur lors de la création de l\'index:', error.message);
      }
    }

    // Lister les index après modifications
    console.log('\n📋 Index après modifications:');
    const newIndexes = await collection.listIndexes().toArray();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Opération terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le script
fixReviewIndexes(); 