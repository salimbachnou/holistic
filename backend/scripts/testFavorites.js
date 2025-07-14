const mongoose = require('mongoose');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testFavorites() {
  try {
    console.log('🔄 Testing favorites route...');

    // Find the client with favorites
    const client = await User.findOne({ role: 'client' }).populate({
      path: 'favorites',
      select: 'businessName businessType description rating coverImages profilePhoto address activities categories services'
    });

    if (!client) {
      console.log('❌ No client found');
      return;
    }

    console.log(`✅ Found client: ${client.firstName} ${client.lastName}`);
    console.log(`📋 Favorites count: ${client.favorites?.length || 0}`);

    if (client.favorites && client.favorites.length > 0) {
      console.log('\n📋 Favorites details:');
      client.favorites.forEach((fav, index) => {
        console.log(`${index + 1}. ${fav.businessName} (${fav.businessType})`);
        console.log(`   - ID: ${fav._id}`);
        console.log(`   - Description: ${fav.description ? fav.description.substring(0, 50) + '...' : 'None'}`);
        console.log(`   - Rating: ${fav.rating?.average || 'N/A'} (${fav.rating?.totalReviews || 0} reviews)`);
        console.log(`   - Cover Images: ${fav.coverImages?.length || 0}`);
        console.log(`   - Activities: ${fav.activities?.length || 0}`);
        console.log('');
      });

      // Test API response format
      const formattedFavorites = client.favorites.map(favorite => {
        const favoriteData = favorite.toJSON();
        
        // Convert cover images to full URLs
        if (favoriteData.coverImages && favoriteData.coverImages.length > 0) {
          favoriteData.coverImages = favoriteData.coverImages.map(img => 
            img && !img.startsWith('http') ? 
            `http://hamza-aourass.ddns.net:5001${img.startsWith('/uploads') ? img : '/uploads/professionals/' + img}` : 
            img
          );
        }
        
        // Convert profile photo to full URL
        if (favoriteData.profilePhoto && !favoriteData.profilePhoto.startsWith('http')) {
          favoriteData.profilePhoto = `http://hamza-aourass.ddns.net:5001${favoriteData.profilePhoto.startsWith('/uploads') ? favoriteData.profilePhoto : '/uploads/professionals/' + favoriteData.profilePhoto}`;
        }
        
        return favoriteData;
      });

      console.log('✅ API Response format:');
      console.log(JSON.stringify({
        success: true,
        favorites: formattedFavorites
      }, null, 2));
    } else {
      console.log('❌ No favorites found for this client');
    }

  } catch (error) {
    console.error('❌ Error testing favorites:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFavorites();
