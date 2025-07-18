const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');

async function findProfessionals() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic-platform');
    
    console.log('Finding professionals...');
    const professionals = await Professional.find().populate('userId', 'firstName lastName email').limit(5);
    
    console.log('=== PROFESSIONALS FOUND ===');
    if (professionals.length === 0) {
      console.log('No professionals found in database');
    } else {
      professionals.forEach((prof, index) => {
        console.log(`${index + 1}. ${prof.businessName}`);
        console.log(`   - Professional ID: ${prof._id}`);
        console.log(`   - User ID: ${prof.userId._id}`);
        console.log(`   - User: ${prof.userId.firstName} ${prof.userId.lastName}`);
        console.log(`   - Email: ${prof.userId.email}`);
        console.log('');
      });
      
      console.log('=== USAGE ===');
      console.log('To list sessions for a professional:');
      console.log(`node scripts/manualSessionCompletion.js list ${professionals[0].userId._id}`);
      console.log('');
      console.log('To complete a session:');
      console.log(`node scripts/manualSessionCompletion.js complete <sessionId> ${professionals[0].userId._id}`);
    }
    
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findProfessionals(); 