const mongoose = require('mongoose');

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

// Fix null coordinates in Professional collection
const fixNullCoordinates = async () => {
  try {
    console.log('🔧 Starting to fix null coordinates...');
    
    const Professional = require('../models/Professional');
    
    // Find all professionals with null coordinates
    const professionalsWithNullCoords = await Professional.find({
      $or: [
        { 'businessAddress.coordinates.lat': null },
        { 'businessAddress.coordinates.lng': null },
        { 'businessAddress.coordinates.lat': { $exists: false } },
        { 'businessAddress.coordinates.lng': { $exists: false } }
      ]
    });
    
    console.log(`Found ${professionalsWithNullCoords.length} professionals with null coordinates`);
    
    let fixedCount = 0;
    
    for (const professional of professionalsWithNullCoords) {
      try {
        // Check if both coordinates are null or missing
        const coords = professional.businessAddress?.coordinates;
        const lat = coords?.lat;
        const lng = coords?.lng;
        
        if (lat === null && lng === null) {
          // Remove the entire coordinates object
          await Professional.updateOne(
            { _id: professional._id },
            { 
              $unset: { 'businessAddress.coordinates': 1 }
            }
          );
          console.log(`✅ Fixed professional ${professional._id}: removed null coordinates`);
          fixedCount++;
        } else if (lat === null || lng === null) {
          // Remove the specific null coordinate
          const updateObj = {};
          if (lat === null) {
            updateObj.$unset = { 'businessAddress.coordinates.lat': 1 };
          }
          if (lng === null) {
            updateObj.$unset = { ...updateObj.$unset, 'businessAddress.coordinates.lng': 1 };
          }
          
          await Professional.updateOne(
            { _id: professional._id },
            updateObj
          );
          console.log(`✅ Fixed professional ${professional._id}: removed null coordinate(s)`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing professional ${professional._id}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully fixed ${fixedCount} professionals`);
    
    // Verify the fix
    const remainingNullCoords = await Professional.find({
      $or: [
        { 'businessAddress.coordinates.lat': null },
        { 'businessAddress.coordinates.lng': null }
      ]
    });
    
    console.log(`Remaining professionals with null coordinates: ${remainingNullCoords.length}`);
    
    if (remainingNullCoords.length === 0) {
      console.log('🎉 All null coordinates have been fixed!');
    } else {
      console.log('⚠️ Some null coordinates remain. Check the data manually.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing null coordinates:', error);
  }
};

// Run the script
const runScript = async () => {
  try {
    await connectDB();
    await fixNullCoordinates();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runScript();
}

module.exports = { fixNullCoordinates }; 