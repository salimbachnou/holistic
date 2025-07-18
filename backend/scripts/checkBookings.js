const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');

async function checkBookings() {
  try {
    await mongoose.connect('mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    const bookings = await Booking.find({}).populate('client', 'firstName lastName').sort({ createdAt: -1 }).limit(10);
    
    console.log('=== RECENT BOOKINGS ===');
    if (bookings.length === 0) {
      console.log('No bookings found');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ${booking.bookingNumber}`);
        console.log(`   - Client: ${booking.client?.firstName} ${booking.client?.lastName}`);
        console.log(`   - Status: ${booking.status}`);
        console.log(`   - Session ID: ${booking.service?.sessionId}`);
        console.log(`   - Service: ${booking.service?.name}`);
        console.log(`   - Created: ${booking.createdAt}`);
        console.log('');
      });
    }
    
    // Find confirmed bookings specifically
    const confirmedBookings = await Booking.find({ status: 'confirmed' }).populate('client', 'firstName lastName');
    console.log(`=== CONFIRMED BOOKINGS (${confirmedBookings.length}) ===`);
    confirmedBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.bookingNumber} - ${booking.client?.firstName} ${booking.client?.lastName}`);
      console.log(`   - Session ID: ${booking.service?.sessionId}`);
      console.log(`   - Service: ${booking.service?.name}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBookings(); 