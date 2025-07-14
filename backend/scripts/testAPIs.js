const axios = require('axios');

async function testAPIs() {
  try {
    console.log('Testing professional API...');
    const professionalResponse = await axios.get('http://hamza-aourass.ddns.net:5001/api/professionals/684334cc016361b53a41404d');
    console.log('Professional API Success:', professionalResponse.data.success);
    console.log('Professional data keys:', Object.keys(professionalResponse.data));
    
    console.log('\nTesting products API...');
    const productsResponse = await axios.get('http://hamza-aourass.ddns.net:5001/api/professionals/684334cc016361b53a41404d/products');
    console.log('Products API Success:', productsResponse.data.success);
    console.log('Products count:', productsResponse.data.products?.length || 0);
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

testAPIs();
