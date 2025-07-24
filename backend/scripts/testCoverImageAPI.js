const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Professional = require('../models/Professional');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic-platform';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testCoverImageAPI() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Trouver un utilisateur professionnel
    const user = await User.findOne({ email: 'test.professional@example.com' });
    if (!user) {
      console.log('❌ Utilisateur de test non trouvé');
      return;
    }

    // Générer un token JWT pour l'authentification
    const token = jwt.sign({ _id: user._id }, JWT_SECRET);
    console.log('✅ Token généré pour:', user.email);

    // Configuration axios avec token
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Test 1: Récupérer les images de couverture actuelles
    console.log('\n🧪 Test 1: Récupération des images de couverture');
    try {
      const response = await apiClient.get('/professionals/me/cover-images');
      console.log('✅ Images actuelles:', response.data.coverImages);
    } catch (error) {
      console.log('❌ Erreur lors de la récupération:', error.response?.data || error.message);
    }

    // Test 2: Ajouter une image de couverture
    console.log('\n🧪 Test 2: Ajout d\'une image de couverture');
    const testImageUrl = '/uploads/profiles/test-cover-image.jpg';
    try {
      const response = await apiClient.post('/professionals/me/cover-images', {
        imageUrl: testImageUrl
      });
      console.log('✅ Image ajoutée:', response.data.coverImages);
    } catch (error) {
      console.log('❌ Erreur lors de l\'ajout:', error.response?.data || error.message);
    }

    // Test 3: Supprimer l'image de couverture
    console.log('\n🧪 Test 3: Suppression de l\'image de couverture');
    try {
      const response = await apiClient.delete('/professionals/me/cover-images', {
        params: { imageUrl: testImageUrl }
      });
      console.log('✅ Image supprimée:', response.data.coverImages);
    } catch (error) {
      console.log('❌ Erreur lors de la suppression:', error.response?.data || error.message);
    }

    // Test 4: Remplacer l'image de couverture
    console.log('\n🧪 Test 4: Remplacement d\'image de couverture');
    const newImageUrl = '/uploads/profiles/new-cover-image.jpg';
    try {
      // D'abord ajouter une image
      await apiClient.post('/professionals/me/cover-images', {
        imageUrl: testImageUrl
      });
      
      // Puis la remplacer
      const response = await apiClient.put('/professionals/me/cover-images/replace', {
        newImageUrl: newImageUrl
      });
      console.log('✅ Image remplacée:', response.data.coverImages);
    } catch (error) {
      console.log('❌ Erreur lors du remplacement:', error.response?.data || error.message);
    }

    console.log('\n✅ Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testCoverImageAPI(); 