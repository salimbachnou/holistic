const mongoose = require('mongoose');
const User = require('../models/User');
const Professional = require('../models/Professional');

async function checkDatabase() {
  try {
    console.log('Trying to connect to database...');
    
    // Try different database names
    const dbNames = ['holistic', 'holistic-platform'];
    
    for (const dbName of dbNames) {
      try {
        console.log(`Trying database: ${dbName}`);
        await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
        
        const users = await User.find().limit(5);
        console.log(`Users found in ${dbName}:`, users.length);
        
        if (users.length > 0) {
          console.log('=== USERS FOUND ===');
          users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} - Role: ${user.role}`);
          });
          
          // Check for professionals
          const professionals = await Professional.find().populate('userId').limit(5);
          console.log(`Professionals found in ${dbName}:`, professionals.length);
          
          if (professionals.length > 0) {
            console.log('=== PROFESSIONALS FOUND ===');
            professionals.forEach((prof, index) => {
              console.log(`${index + 1}. ${prof.businessName}`);
              console.log(`   - Professional ID: ${prof._id}`);
              console.log(`   - User ID: ${prof.userId._id}`);
              console.log(`   - User: ${prof.userId.firstName} ${prof.userId.lastName}`);
              console.log('');
            });
          }
          
          await mongoose.disconnect();
          return;
        }
        
        await mongoose.disconnect();
      } catch (error) {
        console.log(`Failed to connect to ${dbName}:`, error.message);
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
      }
    }
    
    console.log('No data found in any database');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase(); 