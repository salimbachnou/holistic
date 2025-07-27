const mongoose = require('mongoose');
const EmailService = require('../services/emailService');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Session = require('../models/Session');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test session booking emails
const testSessionBookingEmails = async () => {
  try {
    console.log('=== Testing Session Booking Emails ===');
    
    // Get test data
    const client = await User.findOne({ role: 'client' });
    const professional = await Professional.findOne();
    const session = await Session.findOne();
    
    if (!client || !professional || !session) {
      console.log('Missing test data. Please ensure you have users, professionals, and sessions in the database.');
      return;
    }
    
    // Create a test booking
    const testBooking = new Booking({
      client: client._id,
      professional: professional._id,
      service: {
        name: session.title,
        description: session.description,
        duration: session.duration,
        price: { amount: session.price, currency: 'MAD' },
        sessionId: session._id
      },
      appointmentDate: session.startTime,
      appointmentTime: {
        start: session.startTime.toISOString().substring(11, 16),
        end: new Date(session.startTime.getTime() + session.duration * 60000)
          .toISOString()
          .substring(11, 16)
      },
      status: 'pending',
      totalAmount: { amount: session.price, currency: 'MAD' }
    });
    
    console.log('Test booking created:', testBooking._id);
    
    // Test client confirmation email
    console.log('Testing client confirmation email...');
    const clientEmailResult = await EmailService.sendSessionBookingConfirmationToClient(
      testBooking, 
      client, 
      professional, 
      session
    );
    console.log('Client confirmation email result:', clientEmailResult);
    
    // Test professional notification email
    console.log('Testing professional notification email...');
    const professionalEmailResult = await EmailService.sendSessionBookingNotificationToProfessional(
      testBooking, 
      client, 
      professional, 
      session
    );
    console.log('Professional notification email result:', professionalEmailResult);
    
  } catch (error) {
    console.error('Error testing session booking emails:', error);
  }
};

// Test event booking emails
const testEventBookingEmails = async () => {
  try {
    console.log('=== Testing Event Booking Emails ===');
    
    // Get test data
    const client = await User.findOne({ role: 'client' });
    const professional = await Professional.findOne();
    const event = await Event.findOne();
    
    if (!client || !professional || !event) {
      console.log('Missing test data. Please ensure you have users, professionals, and events in the database.');
      return;
    }
    
    // Create a test participation
    const testParticipation = {
      user: client._id,
      status: 'pending',
      quantity: 1,
      note: 'Test participation',
      createdAt: new Date()
    };
    
    console.log('Test participation created');
    
    // Test client confirmation email
    console.log('Testing client confirmation email...');
    const clientEmailResult = await EmailService.sendEventBookingConfirmationToClient(
      event, 
      client, 
      professional, 
      testParticipation
    );
    console.log('Client confirmation email result:', clientEmailResult);
    
    // Test professional notification email
    console.log('Testing professional notification email...');
    const professionalEmailResult = await EmailService.sendEventBookingNotificationToProfessional(
      event, 
      client, 
      professional, 
      testParticipation
    );
    console.log('Professional notification email result:', professionalEmailResult);
    
  } catch (error) {
    console.error('Error testing event booking emails:', error);
  }
};

// Main test function
const runTests = async () => {
  try {
    await connectDB();
    
    console.log('Starting email service tests...');
    
    await testSessionBookingEmails();
    await testEventBookingEmails();
    
    console.log('All email tests completed!');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 