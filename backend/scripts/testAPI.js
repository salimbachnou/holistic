const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Test de l\'API des événements...\n');

    // Test de l'API des événements
    const eventsResponse = await axios.get('http://localhost:5000/api/events');
    console.log('📊 Réponse API événements:');
    console.log(JSON.stringify(eventsResponse.data, null, 2));

    // Test de l'API des statistiques
    const statsResponse = await axios.get('http://localhost:5000/api/events/stats');
    console.log('\n📈 Réponse API statistiques:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

    // Analyse
    console.log('\n🔍 === ANALYSE ===');
    console.log(`📊 Événements retournés: ${eventsResponse.data.events?.length || 0}`);
    console.log(`📈 Total événements (stats): ${statsResponse.data.stats?.totalEvents || 0}`);
    
    if (eventsResponse.data.events?.length === 0 && statsResponse.data.stats?.totalEvents > 0) {
      console.log('\n❌ PROBLÈME DÉTECTÉ:');
      console.log('   - Les statistiques montrent des événements');
      console.log('   - Mais l\'API ne retourne aucun événement');
      console.log('   - Cela indique un problème de filtrage côté API');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

testAPI();
