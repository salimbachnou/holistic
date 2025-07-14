const mongoose = require('mongoose');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestFavorites() {
  try {
    console.log('🔄 Creating test favorites...');

    // Find a client user (role: 'client') 
    let client = await User.findOne({ role: 'client' });
    if (!client) {
      console.log('❌ No client found. Please create a client first via the application.');
      return;
    }

    console.log(`✅ Found client: ${client.firstName} ${client.lastName} (${client.email})`);

    // Find some professionals to add as favorites
    const professionals = await Professional.find().limit(3);
    
    if (professionals.length === 0) {
      console.log('❌ No professionals found. Cannot create test favorites.');
      return;
    }

    console.log(`📋 Found ${professionals.length} professionals`);

    // Initialize favorites array if it doesn't exist
    if (!client.favorites) {
      client.favorites = [];
    }

    // Add professionals to favorites if not already added
    let addedCount = 0;
    for (const prof of professionals) {
      if (!client.favorites.includes(prof._id)) {
        client.favorites.push(prof._id);
        addedCount++;
        console.log(`➕ Added ${prof.businessName} to favorites`);
      } else {
        console.log(`⚪ ${prof.businessName} already in favorites`);
      }
    }

    if (addedCount > 0) {
      await client.save();
      console.log(`✅ Successfully updated favorites for ${client.firstName} ${client.lastName}`);
    } else {
      console.log('✅ No new favorites to add');
    }

    // Display the favorites with details
    const clientWithFavorites = await User.findById(client._id).populate('favorites');
    console.log('\n📋 Current favorites:');
    if (clientWithFavorites.favorites && clientWithFavorites.favorites.length > 0) {
      clientWithFavorites.favorites.forEach((fav, index) => {
        console.log(`${index + 1}. ${fav.businessName} (${fav.businessType})`);
      });
    } else {
      console.log('No favorites found');
    }

  } catch (error) {
    console.error('❌ Error creating test favorites:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestFavorites();
