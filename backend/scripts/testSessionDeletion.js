const mongoose = require('mongoose');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSessionDeletion() {
  try {
    console.log('=== TESTING SESSION DELETION WITH ACTIVE BOOKINGS ===');
    
    // Find a professional to create test sessions
    const professional = await Professional.findOne();
    if (!professional) {
      console.log('No professional found. Please create a professional first.');
      return;
    }
    
    console.log(`Using professional: ${professional.businessName}`);
    
    // Find a user to create bookings
    const user = await User.findOne({ role: 'client' });
    if (!user) {
      console.log('No client user found. Please create a client user first.');
      return;
    }
    
    console.log(`Using client: ${user.firstName} ${user.lastName}`);
    
    // Create a test session
    const testSession = new Session({
      title: 'Test Session for Deletion',
      description: 'This session will be used to test deletion with bookings',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 60,
      maxParticipants: 10,
      price: 50,
      category: 'individual',
      professionalId: professional._id,
      status: 'scheduled',
      confirmationStatus: 'approved'
    });
    
    await testSession.save();
    console.log(`Created test session: ${testSession.title} (ID: ${testSession._id})`);
    
    // Create a test booking for this session
    const testBooking = new Booking({
      client: user._id,
      professional: professional._id,
      service: {
        type: 'session',
        sessionId: testSession._id,
        title: testSession.title,
        duration: testSession.duration,
        price: testSession.price
      },
      status: 'confirmed',
      totalAmount: {
        amount: testSession.price,
        currency: 'EUR'
      },
      paymentStatus: 'paid'
    });
    
    await testBooking.save();
    console.log(`Created test booking for session (ID: ${testBooking._id})`);
    
    // Test 1: Try to delete session with active booking (should fail)
    console.log('\n=== TEST 1: Attempting to delete session with active booking ===');
    try {
      const axios = require('axios');
      const response = await axios.delete(`http://localhost:5000/api/admin/sessions/${testSession._id}`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
        }
      });
      console.log('❌ ERROR: Session was deleted despite having active bookings');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ SUCCESS: Session deletion was blocked due to active bookings');
        console.log('Error message:', error.response.data.message);
        console.log('Active bookings:', error.response.data.activeBookings);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 2: Cancel the booking and try to delete again
    console.log('\n=== TEST 2: Cancelling booking and attempting deletion ===');
    testBooking.status = 'cancelled';
    testBooking.cancellation = {
      reason: 'Test cancellation',
      cancelledBy: professional.userId,
      cancelledAt: new Date()
    };
    await testBooking.save();
    console.log('✅ Booking cancelled successfully');
    
    // Try to delete session again (should succeed)
    try {
      const axios = require('axios');
      const response = await axios.delete(`http://localhost:5000/api/admin/sessions/${testSession._id}`, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
        }
      });
      console.log('✅ SUCCESS: Session deleted successfully after booking cancellation');
    } catch (error) {
      console.log('❌ ERROR: Session deletion failed:', error.response?.data?.message || error.message);
    }
    
    // Clean up any remaining test data
    console.log('\n=== CLEANING UP ===');
    try {
      await Booking.findByIdAndDelete(testBooking._id);
      console.log('Deleted test booking');
    } catch (error) {
      console.log('Booking already deleted or not found');
    }
    
    try {
      await Session.findByIdAndDelete(testSession._id);
      console.log('Deleted test session');
    } catch (error) {
      console.log('Session already deleted or not found');
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the test
testSessionDeletion(); 