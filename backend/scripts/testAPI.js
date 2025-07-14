const http = require('http');

async function testDebugAPI() {
  return new Promise((resolve, reject) => {
    console.log('Testing debug API to list professionals...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/professionals/debug/list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Response status:', res.statusCode);
          console.log('Response data:', JSON.stringify(jsonData, null, 2));
          resolve();
        } catch (error) {
          console.error('JSON parse error:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

async function testEventsAPI(professionalId) {
  return new Promise((resolve, reject) => {
    console.log(`\nTesting events API for professional ${professionalId}...`);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/professionals/${professionalId}/events`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Response status:', res.statusCode);
          console.log('Response data:', JSON.stringify(jsonData, null, 2));
          
          if (jsonData.success) {
            console.log(`✅ Success! Found ${jsonData.events.length} events`);
          } else {
            console.log('❌ Error:', jsonData.message);
          }
          resolve();
        } catch (error) {
          console.error('JSON parse error:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    await testDebugAPI();
    
    // Tester avec l'ID du professionnel "Centre Bien-être Harmonie"
    await testEventsAPI('684334cc016361b53a41404d');
  } catch (error) {
    console.error('Tests failed:', error);
  }
}

runTests();
