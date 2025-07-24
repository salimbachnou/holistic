const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Informations de test - correspond aux identifiants créés par createTestProfessional.js
const TEST_CREDENTIALS = {
  email: 'professional@test.com',
  password: 'password123'
};

async function getAuthToken() {
  try {
    console.log('🔐 Connexion pour obtenir un token...');
    
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Connexion réussie');
      return loginResponse.data.token;
    } else {
      throw new Error('Échec de la connexion');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data?.message || error.message);
    console.log('\n💡 Pour utiliser ce script :');
    console.log('1. Assurez-vous que le serveur backend est démarré');
    console.log('2. Créez un compte de test: node scripts/createTestProfessional.js');
    console.log('3. Relancez le script');
    return null;
  }
}

async function testClientsAPI() {
  try {
    console.log('🧪 Test de l\'API des clients professionnels...\n');

    // Obtenir un token valide
    const token = await getAuthToken();
    if (!token) {
      console.log('❌ Impossible de continuer sans token valide');
      return;
    }

    // Test 1: Récupérer tous les clients
    console.log('1. Test récupération de tous les clients:');
    const allClientsResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        status: 'all',
        type: 'all'
      }
    });
    
    if (allClientsResponse.data.success) {
      console.log('✅ Succès - Clients récupérés:', allClientsResponse.data.clients.length);
      console.log('📊 Statistiques:', allClientsResponse.data.stats);
      
      // Afficher quelques détails des clients
      if (allClientsResponse.data.clients.length > 0) {
        console.log('\n📋 Détails des clients:');
        allClientsResponse.data.clients.slice(0, 3).forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name} - ${client.tags.join(', ')} - ${client.totalSpent} MAD`);
        });
      } else {
        console.log('📝 Aucun client trouvé (normal pour un nouveau compte)');
      }
    } else {
      console.log('❌ Échec:', allClientsResponse.data.message);
    }

    // Test 2: Filtrer par type - Sessions uniquement
    console.log('\n2. Test filtre par type - Sessions uniquement:');
    const sessionsResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        type: 'session'
      }
    });
    
    if (sessionsResponse.data.success) {
      console.log('✅ Succès - Clients sessions:', sessionsResponse.data.clients.length);
      if (sessionsResponse.data.clients.length > 0) {
        sessionsResponse.data.clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}: ${client.tags.join(', ')}`);
        });
      } else {
        console.log('📝 Aucun client de session trouvé');
      }
    }

    // Test 3: Filtrer par type - Événements uniquement
    console.log('\n3. Test filtre par type - Événements uniquement:');
    const eventsResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        type: 'event'
      }
    });
    
    if (eventsResponse.data.success) {
      console.log('✅ Succès - Clients événements:', eventsResponse.data.clients.length);
      if (eventsResponse.data.clients.length > 0) {
        eventsResponse.data.clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}: ${client.tags.join(', ')}`);
        });
      } else {
        console.log('📝 Aucun client d\'événement trouvé');
      }
    }

    // Test 4: Filtrer par type - Boutique uniquement
    console.log('\n4. Test filtre par type - Boutique uniquement:');
    const boutiqueResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        type: 'boutique'
      }
    });
    
    if (boutiqueResponse.data.success) {
      console.log('✅ Succès - Clients boutique:', boutiqueResponse.data.clients.length);
      if (boutiqueResponse.data.clients.length > 0) {
        boutiqueResponse.data.clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}: ${client.tags.join(', ')}`);
        });
      } else {
        console.log('📝 Aucun client de boutique trouvé');
      }
    }

    // Test 5: Filtrer par type - Clients mixtes
    console.log('\n5. Test filtre par type - Clients mixtes:');
    const mixedResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        type: 'mixed'
      }
    });
    
    if (mixedResponse.data.success) {
      console.log('✅ Succès - Clients mixtes:', mixedResponse.data.clients.length);
      if (mixedResponse.data.clients.length > 0) {
        mixedResponse.data.clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name}: ${client.tags.join(', ')}`);
        });
      } else {
        console.log('📝 Aucun client mixte trouvé');
      }
    }

    // Test 6: Recherche avec tags
    console.log('\n6. Test recherche avec tags:');
    const searchResponse = await axios.get(`${API_URL}/api/professionals/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 10,
        search: 'Client'
      }
    });
    
    if (searchResponse.data.success) {
      console.log('✅ Succès - Recherche par tags:', searchResponse.data.clients.length);
    }

    // Test 7: Test des détails d'un client (si des clients existent)
    if (allClientsResponse.data.success && allClientsResponse.data.clients.length > 0) {
      console.log('\n7. Test détails d\'un client:');
      const firstClient = allClientsResponse.data.clients[0];
      const clientDetailsResponse = await axios.get(`${API_URL}/api/professionals/clients/${firstClient.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (clientDetailsResponse.data.success) {
        console.log('✅ Succès - Détails client récupérés');
        console.log(`   Nom: ${clientDetailsResponse.data.client.name}`);
        console.log(`   Sessions passées: ${clientDetailsResponse.data.client.pastSessions?.length || 0}`);
        console.log(`   Sessions à venir: ${clientDetailsResponse.data.client.upcomingSessions?.length || 0}`);
        console.log(`   Commandes: ${clientDetailsResponse.data.client.orders?.length || 0}`);
      }
    } else {
      console.log('\n7. Test détails d\'un client:');
      console.log('📝 Aucun client disponible pour tester les détails');
    }

    console.log('\n🎉 Tests terminés!');
    console.log('\n💡 Note: Les résultats vides sont normaux pour un nouveau compte sans données');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testClientsAPI();
}

module.exports = { testClientsAPI }; 