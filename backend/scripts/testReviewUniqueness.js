const mongoose = require('mongoose');
const Review = require('../models/Review');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Professional = require('../models/Professional');

async function testReviewUniqueness() {
  try {
    console.log('=== TEST REVIEW UNIQUENESS ===');
    await mongoose.connect('mongodb://localhost:27017/holistic');
    
    // Find a session with a confirmed booking
    const booking = await Booking.findOne({ 
      status: 'confirmed',
      'service.sessionId': { $exists: true, $ne: null }
    }).populate('client').populate('service.sessionId');
    
    if (!booking) {
      console.log('❌ No confirmed booking with sessionId found');
      return;
    }
    
    const sessionId = booking.service.sessionId._id;
    const clientId = booking.client._id;
    
    console.log('✅ Found test data:');
    console.log(`   - Session: ${booking.service.sessionId.title}`);
    console.log(`   - Client: ${booking.client.firstName} ${booking.client.lastName}`);
    console.log(`   - Session ID: ${sessionId}`);
    console.log(`   - Client ID: ${clientId}`);
    
    // Check if review already exists
    const existingReview = await Review.findOne({
      clientId: clientId,
      contentId: sessionId,
      contentType: 'session'
    });
    
    if (existingReview) {
      console.log('\n✅ Review already exists for this session/client combination');
      console.log(`   - Review ID: ${existingReview._id}`);
      console.log(`   - Rating: ${existingReview.rating}/5`);
      console.log(`   - Comment: "${existingReview.comment?.substring(0, 50)}..."`);
      console.log(`   - Created: ${existingReview.createdAt}`);
      
      console.log('\n🧪 Testing uniqueness constraint...');
      
      // Try to create a duplicate review
      try {
        const duplicateReview = new Review({
          clientId: clientId,
          professionalId: booking.professional,
          contentId: sessionId,
          contentType: 'session',
          contentTitle: booking.service.sessionId.title,
          rating: 4,
          comment: 'This should not be allowed - duplicate review test',
          wouldRecommend: true,
          aspects: {
            content: 4,
            communication: 4,
            professionalism: 4,
            value: 4
          },
          status: 'approved'
        });
        
        await duplicateReview.save();
        console.log('❌ ERROR: Duplicate review was saved! This should not happen.');
        
      } catch (error) {
        console.log('✅ Good: Attempted duplicate creation failed (as expected)');
        console.log(`   Error: ${error.message}`);
      }
      
    } else {
      console.log('\n📝 No existing review found. Creating a test review...');
      
      // Create a test review
      const testReview = new Review({
        clientId: clientId,
        professionalId: booking.professional,
        contentId: sessionId,
        contentType: 'session',
        contentTitle: booking.service.sessionId.title,
        rating: 5,
        comment: 'Test review created by uniqueness test script',
        wouldRecommend: true,
        aspects: {
          content: 5,
          communication: 5,
          professionalism: 5,
          value: 5
        },
        status: 'approved'
      });
      
      await testReview.save();
      console.log('✅ Test review created successfully');
      console.log(`   - Review ID: ${testReview._id}`);
      
      // Now try to create a duplicate
      console.log('\n🧪 Testing uniqueness constraint...');
      try {
        const duplicateReview = new Review({
          clientId: clientId,
          professionalId: booking.professional,
          contentId: sessionId,
          contentType: 'session',
          contentTitle: booking.service.sessionId.title,
          rating: 3,
          comment: 'This should not be allowed - duplicate review test',
          wouldRecommend: false,
          aspects: {
            content: 3,
            communication: 3,
            professionalism: 3,
            value: 3
          },
          status: 'approved'
        });
        
        await duplicateReview.save();
        console.log('❌ ERROR: Duplicate review was saved! This should not happen.');
        
      } catch (error) {
        console.log('✅ Good: Duplicate creation failed (as expected)');
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // Count total reviews for this session
    const totalReviews = await Review.countDocuments({
      contentId: sessionId,
      contentType: 'session'
    });
    
    console.log(`\n📊 Total reviews for this session: ${totalReviews}`);
    
    // Count reviews by this client for this session
    const clientReviews = await Review.countDocuments({
      clientId: clientId,
      contentId: sessionId,
      contentType: 'session'
    });
    
    console.log(`📊 Reviews by this client for this session: ${clientReviews}`);
    
    if (clientReviews === 1) {
      console.log('✅ PERFECT: Client has exactly 1 review for this session (as expected)');
    } else if (clientReviews === 0) {
      console.log('ℹ️  Client has no reviews for this session');
    } else {
      console.log(`❌ ERROR: Client has ${clientReviews} reviews for this session (should be 0 or 1)`);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error in test:', error);
    await mongoose.disconnect();
  }
}

testReviewUniqueness(); 