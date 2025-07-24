const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');

async function fixBookingSessionLinks() {
  try {
    console.log('=== FIXING BOOKING SESSION LINKS ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    
    // Get all bookings without sessionId
    const bookingsWithoutSession = await Booking.find({
      'service.sessionId': { $exists: false }
    }).populate('client', 'firstName lastName');
    
    console.log(`Found ${bookingsWithoutSession.length} bookings without sessionId`);
    
    if (bookingsWithoutSession.length === 0) {
      console.log('No bookings to fix');
      await mongoose.disconnect();
      return;
    }
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const booking of bookingsWithoutSession) {
      try {
        console.log(`\nProcessing booking: ${booking.bookingNumber}`);
        console.log(`Client: ${booking.client?.firstName} ${booking.client?.lastName}`);
        console.log(`Professional: ${booking.professional}`);
        console.log(`Appointment date: ${booking.appointmentDate}`);
        
        // Find a session that matches this booking
        // Look for sessions by the same professional around the same time
        const session = await Session.findOne({
          professionalId: booking.professional,
          startTime: {
            $gte: new Date(booking.appointmentDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
            $lte: new Date(booking.appointmentDate.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
          }
        });
        
        if (session) {
          console.log(`Found matching session: ${session.title} (${session._id})`);
          
          // Update the booking with sessionId
          booking.service = {
            ...booking.service,
            sessionId: session._id,
            name: session.title,
            description: session.description,
            duration: session.duration,
            price: {
              amount: session.price,
              currency: 'MAD'
            }
          };
          
          await booking.save();
          fixedCount++;
          console.log(`✅ Fixed booking ${booking.bookingNumber}`);
        } else {
          console.log(`❌ No matching session found for booking ${booking.bookingNumber}`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`Error processing booking ${booking.bookingNumber}:`, error);
        skippedCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total bookings processed: ${bookingsWithoutSession.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
    // Verify the fix
    const bookingsWithSession = await Booking.find({
      'service.sessionId': { $exists: true, $ne: null }
    });
    
    console.log(`\nBookings with sessionId: ${bookingsWithSession.length}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

fixBookingSessionLinks(); 