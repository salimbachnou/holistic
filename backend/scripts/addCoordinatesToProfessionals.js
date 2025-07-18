const mongoose = require('mongoose');
const Professional = require('../models/Professional');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Coordinates for major Moroccan cities
const cityCoordinates = {
  'Casablanca': { lat: 33.5731, lng: -7.5898 },
  'Rabat': { lat: 34.0209, lng: -6.8416 },
  'Marrakech': { lat: 31.6295, lng: -7.9811 },
  'Fez': { lat: 34.0181, lng: -5.0078 },
  'Agadir': { lat: 30.4278, lng: -9.5981 },
  'Tangier': { lat: 35.7595, lng: -5.8340 },
  'Meknes': { lat: 33.8935, lng: -5.5473 },
  'Oujda': { lat: 34.6814, lng: -1.9086 },
  'Kenitra': { lat: 34.2545, lng: -6.5800 },
  'Tetouan': { lat: 35.5711, lng: -5.3724 },
  'Safi': { lat: 32.2988, lng: -9.2376 },
  'El Jadida': { lat: 33.2316, lng: -8.5004 },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498 },
  'Nador': { lat: 35.1688, lng: -2.9286 },
  'Taza': { lat: 34.2150, lng: -4.0066 },
  'Settat': { lat: 33.0023, lng: -7.6198 },
  'Larache': { lat: 35.1894, lng: -6.1557 },
  'Khouribga': { lat: 32.8667, lng: -6.9000 },
  'Taourirt': { lat: 34.4071, lng: -2.8973 },
  'Berkane': { lat: 34.9167, lng: -2.3167 },
  'Khemisset': { lat: 33.8167, lng: -6.0667 },
  'Inezgane': { lat: 30.3500, lng: -9.5333 },
  'Tiflet': { lat: 33.8944, lng: -6.3064 },
  'Taroudant': { lat: 30.4703, lng: -8.8769 },
  'Sidi Slimane': { lat: 34.2667, lng: -5.9333 },
  'Sidi Kacem': { lat: 34.2167, lng: -5.7000 },
  'Taza': { lat: 34.2150, lng: -4.0066 },
  'Ouarzazate': { lat: 30.9333, lng: -6.9000 },
  'Essaouira': { lat: 31.5085, lng: -9.7595 },
  'Khenifra': { lat: 32.9333, lng: -5.6667 },
  'Guelmim': { lat: 28.9833, lng: -10.0667 },
  'Jorf El Melha': { lat: 34.1667, lng: -6.3000 },
  'Ifrane': { lat: 33.5731, lng: -5.3700 },
  'Azrou': { lat: 33.4333, lng: -5.2167 },
  'Midelt': { lat: 32.6833, lng: -4.7333 },
  'Errachidia': { lat: 31.9333, lng: -4.4167 },
  'Erfoud': { lat: 31.4333, lng: -4.2333 },
  'Meknes': { lat: 33.8935, lng: -5.5473 },
  'Ifrane': { lat: 33.5731, lng: -5.3700 },
  'Azrou': { lat: 33.4333, lng: -5.2167 },
  'Midelt': { lat: 32.6833, lng: -4.7333 },
  'Errachidia': { lat: 31.9333, lng: -4.4167 },
  'Erfoud': { lat: 31.4333, lng: -4.2333 }
};

// Get coordinates for a city
const getCoordinatesForCity = (city) => {
  if (!city) return cityCoordinates['Casablanca']; // Default to Casablanca
  
  const normalizedCity = city.trim().toLowerCase();
  
  for (const [cityName, coords] of Object.entries(cityCoordinates)) {
    if (cityName.toLowerCase() === normalizedCity) {
      return coords;
    }
  }
  
  // If city not found, return Casablanca coordinates
  return cityCoordinates['Casablanca'];
};

// Add coordinates to professionals
const addCoordinatesToProfessionals = async () => {
  try {
    console.log('🔍 Finding professionals without coordinates...');
    
    // Find professionals without coordinates
    const professionalsWithoutCoords = await Professional.find({
      $or: [
        { 'businessAddress.coordinates': { $exists: false } },
        { 'businessAddress.coordinates.lat': { $exists: false } },
        { 'businessAddress.coordinates.lng': { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${professionalsWithoutCoords.length} professionals without coordinates`);
    
    if (professionalsWithoutCoords.length === 0) {
      console.log('✅ All professionals already have coordinates');
      return;
    }
    
    let updatedCount = 0;
    
    for (const professional of professionalsWithoutCoords) {
      try {
        // Get city from businessAddress or address
        const city = professional.businessAddress?.city || 
                    professional.address?.split(',').pop()?.trim() || 
                    'Casablanca';
        
        const coordinates = getCoordinatesForCity(city);
        
        // Update professional with coordinates
        await Professional.findByIdAndUpdate(professional._id, {
          $set: {
            'businessAddress.coordinates': coordinates
          }
        });
        
        console.log(`✅ Updated ${professional.businessName} (${city}) with coordinates: ${coordinates.lat}, ${coordinates.lng}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error updating ${professional.businessName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} professionals with coordinates`);
    
  } catch (error) {
    console.error('❌ Error adding coordinates to professionals:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await addCoordinatesToProfessionals();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { addCoordinatesToProfessionals }; 