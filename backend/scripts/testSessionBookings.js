const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const User = require('../models/User');
const Professional = require('../models/Professional');

async function testSessionBookings() {
  try {
    console.log('=== TESTING SESSION BOOKINGS ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    // Find the session "Méditation guidée"
    const session = await Session.findOne({ title: { $regex: /méditation/i } });
    
    if (!session) {
      console.log('No session found with "méditation" in title');
      // List all sessions
      const allSessions = await Session.find().limit(10);
      console.log('Available sessions:');
      allSessions.forEach(s => console.log(`- ${s.title} (${s._id})`));
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Found session: ${session.title} (${session._id})`);
    
    // Test the same query as the endpoint
    const bookings = await Booking.find({ 'service.sessionId': session._id })
      .populate('client', 'firstName lastName email')
      .populate('professional', 'businessName firstName lastName');
    
    console.log(`Found ${bookings.length} bookings for session ${session._id}`);
    
    bookings.forEach((booking, index) => {
      console.log(`\nBooking ${index + 1}:`);
      console.log('ID:', booking._id);
      console.log('Client:', booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown');
      console.log('Professional:', booking.professional ? booking.professional.businessName : 'Unknown');
      console.log('Status:', booking.status);
      console.log('SessionId:', booking.service?.sessionId);
    });
    
    // Test with a session that we know has bookings
    const sessionWithBookings = await Session.findById('687fb8d7c19958ec4acb0057');
    if (sessionWithBookings) {
      console.log(`\n=== TESTING SESSION WITH KNOWN BOOKINGS ===`);
      console.log(`Session: ${sessionWithBookings.title} (${sessionWithBookings._id})`);
      
      const bookingsForKnownSession = await Booking.find({ 'service.sessionId': sessionWithBookings._id })
        .populate('client', 'firstName lastName email')
        .populate('professional', 'businessName firstName lastName');
      
      console.log(`Found ${bookingsForKnownSession.length} bookings for this session`);
      
      bookingsForKnownSession.forEach((booking, index) => {
        console.log(`\nBooking ${index + 1}:`);
        console.log('ID:', booking._id);
        console.log('Client:', booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Unknown');
        console.log('Professional:', booking.professional ? booking.professional.businessName : 'Unknown');
        console.log('Status:', booking.status);
      });
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

testSessionBookings(); 