const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Test the homepage API endpoints
async function testHomepageAPI() {
  const baseURL = process.env.API_URL || 'https://holistic-maroc-backend.onrender.com';
  
  console.log('🚀 Testing Homepage API endpoints...');
  console.log(`Base URL: ${baseURL}`);
  
  const endpoints = [
    '/api/homepage/featured-professionals',
    '/api/homepage/featured-products',
    '/api/homepage/upcoming-events',
    '/api/homepage/testimonials',
    '/api/homepage/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint}...`);
      const response = await axios.get(`${baseURL}${endpoint}`);
      
      if (response.data.success) {
        console.log(`✅ ${endpoint} - SUCCESS`);
        console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);
        
        // Show sample data structure
        const dataKey = Object.keys(response.data).find(key => key !== 'success' && key !== 'message');
        if (dataKey && response.data[dataKey]) {
          const sampleData = Array.isArray(response.data[dataKey]) 
            ? response.data[dataKey][0] 
            : response.data[dataKey];
          
          if (sampleData) {
            console.log(`   Sample structure: ${Object.keys(sampleData).join(', ')}`);
          }
        }
      } else {
        console.log(`⚠️  ${endpoint} - SUCCESS but no data`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Test newsletter subscription
  console.log('\n📧 Testing newsletter subscription...');
  try {
    const response = await axios.post(`${baseURL}/api/homepage/newsletter`, {
      email: 'test@example.com'
    });
    
    if (response.data.success) {
      console.log('✅ Newsletter subscription - SUCCESS');
      console.log(`   Message: ${response.data.message}`);
    } else {
      console.log('⚠️  Newsletter subscription - FAILED');
      console.log(`   Message: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`❌ Newsletter subscription - ERROR: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  console.log('\n🏁 Homepage API testing completed!');
}

// Connect to MongoDB and run tests
async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Run API tests
    await testHomepageAPI();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the tests
runTests(); 