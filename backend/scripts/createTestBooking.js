const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');

async function createTestBooking() {
  try {
    console.log('=== CREATING TEST BOOKING ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    
    // Find a session
    const session = await Session.findOne({ status: 'scheduled' }).populate('professionalId');
    if (!session) {
      console.log('No scheduled session found');
      return;
    }
    
    // Find a client
    const client = await User.findOne({ role: 'client' });
    if (!client) {
      console.log('No client found');
      return;
    }
    
    // Find the professional
    const professional = await Professional.findById(session.professionalId._id);
    if (!professional) {
      console.log('Professional not found');
      return;
    }
    
    console.log('Session found:', session.title);
    console.log('Client found:', client.firstName, client.lastName);
    console.log('Professional found:', professional.businessName);
    
    // Check if booking already exists
    const existingBooking = await Booking.findOne({
      client: client._id,
      'service.sessionId': session._id
    });
    
    if (existingBooking) {
      console.log('Booking already exists for this client and session');
      console.log('Booking ID:', existingBooking._id);
      console.log('Status:', existingBooking.status);
      
      // Update to confirmed if pending
      if (existingBooking.status === 'pending') {
        existingBooking.status = 'confirmed';
        await existingBooking.save();
        console.log('Updated booking status to confirmed');
      }
      
      await mongoose.disconnect();
      return;
    }
    
    // Create booking
    const booking = new Booking({
      client: client._id,
      professional: professional._id,
      service: {
        name: session.title,
        description: session.description,
        duration: session.duration,
        price: {
          amount: session.price || 100,
          currency: 'MAD'
        },
        sessionId: session._id
      },
      appointmentDate: session.startTime,
      appointmentTime: {
        start: session.startTime.toISOString().substring(11, 16),
        end: new Date(session.startTime.getTime() + (session.duration || 60) * 60000)
          .toISOString()
          .substring(11, 16)
      },
      location: {
        type: session.category === 'online' ? 'online' : 'in_person',
        address: session.category !== 'online' ? {
          street: session.location || 'Test Address',
          city: 'Casablanca',
          postalCode: '20000',
          country: 'Morocco'
        } : undefined,
        onlineLink: session.category === 'online' ? session.meetingLink : undefined
      },
      status: 'confirmed', // Set to confirmed so it will be processed
      paymentStatus: 'pending',
      totalAmount: {
        amount: session.price || 100,
        currency: 'MAD'
      },
      clientNotes: 'Test booking for review notification testing'
    });
    
    // Generate booking number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const lastBooking = await Booking.findOne({
      bookingNumber: new RegExp(`^BK${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    booking.bookingNumber = `BK${year}${month}${day}${String(sequence).padStart(4, '0')}`;
    
    await booking.save();
    
    console.log('✅ Test booking created successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Booking Number:', booking.bookingNumber);
    console.log('Session ID:', session._id);
    console.log('Session Title:', session.title);
    console.log('Client:', client.firstName, client.lastName);
    console.log('Status:', booking.status);
    
    console.log('\n=== NEXT STEPS ===');
    console.log('Now you can test the session completion:');
    console.log(`node scripts/manualSessionCompletion.js complete ${session._id} ${session.professionalId.userId}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createTestBooking(); 