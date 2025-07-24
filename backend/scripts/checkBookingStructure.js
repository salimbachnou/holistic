const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function checkBookingStructure() {
  try {
    console.log('=== CHECKING BOOKING STRUCTURE ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    const bookings = await Booking.find().limit(5);
    console.log(`Found ${bookings.length} bookings`);
    
    bookings.forEach((booking, index) => {
      console.log(`\nBooking ${index + 1}:`);
      console.log('ID:', booking._id);
      console.log('Booking Number:', booking.bookingNumber);
      console.log('Client:', booking.client);
      console.log('Professional:', booking.professional);
      console.log('Service:', JSON.stringify(booking.service, null, 2));
      console.log('Has sessionId:', booking.service?.sessionId ? 'YES' : 'NO');
      console.log('SessionId value:', booking.service?.sessionId);
    });
    
    // Check for bookings with sessionId
    const bookingsWithSession = await Booking.find({
      'service.sessionId': { $exists: true, $ne: null }
    });
    
    console.log(`\nBookings with sessionId: ${bookingsWithSession.length}`);
    
    // Check for bookings without sessionId
    const bookingsWithoutSession = await Booking.find({
      $or: [
        { 'service.sessionId': { $exists: false } },
        { 'service.sessionId': null }
      ]
    });
    
    console.log(`Bookings without sessionId: ${bookingsWithoutSession.length}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkBookingStructure(); 