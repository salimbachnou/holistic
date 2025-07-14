const http = require('http');

async function testProductsAPI(professionalId) {
  return new Promise((resolve, reject) => {
    console.log(`Testing products API for professional ${professionalId}...`);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/professionals/${professionalId}/products`,
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
          
          if (jsonData.success) {
            console.log(`✅ Success! Found ${jsonData.products.length} products`);
            jsonData.products.forEach((product, index) => {
              console.log(`${index + 1}. ${product.name} - ${product.price} ${product.currency}`);
            });
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

testProductsAPI('684334cc016361b53a41404d').catch(console.error);
