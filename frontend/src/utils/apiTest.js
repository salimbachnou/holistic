// Simple test script to verify API connection
async function testProfessionalsAPI() {
  const baseURL = 'http://localhost:5000/api';

  console.log('🧪 Testing Professionals API...');
  console.log('Base URL:', baseURL);

  try {
    const response = await fetch(`${baseURL}/professionals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response received!');
    console.log('Success:', data.success);
    console.log('Number of professionals:', data.professionals?.length || 0);
    console.log('First professional (if any):', data.professionals?.[0] || 'None');

    if (data.professionals && data.professionals.length > 0) {
      console.log('✅ Professionals found successfully!');
      return data;
    } else {
      console.log('⚠️ API works but no professionals in database');
      return data;
    }
  } catch (error) {
    console.error('❌ API Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Test CORS
async function testCORS() {
  console.log('🌐 Testing CORS...');
  try {
    const response = await fetch('http://localhost:5000/api/professionals', {
      method: 'OPTIONS',
    });
    console.log('CORS preflight status:', response.status);
    console.log('CORS headers:', Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.error('CORS test failed:', error);
  }
}

// Run tests
console.log('🚀 Starting API tests...');
testCORS()
  .then(() => {
    return testProfessionalsAPI();
  })
  .then(data => {
    console.log('🎉 All tests completed successfully!');
  })
  .catch(error => {
    console.log('💥 Tests failed:', error.message);
  });

export { testProfessionalsAPI, testCORS };
