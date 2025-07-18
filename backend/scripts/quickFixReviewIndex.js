require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function quickFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('reviews');

    // Supprimer directement l'index problématique
    try {
      await collection.dropIndex('userId_1_targetId_1_targetType_1');
      console.log('✅ Index problématique supprimé avec succès!');
    } catch (error) {
      console.log('⚠️  Index déjà supprimé ou inexistant');
    }

    console.log('✅ Terminé! Vous pouvez maintenant créer des avis.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickFix(); 