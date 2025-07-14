const mongoose = require('mongoose');
const Event = require('../models/Event');
const Professional = require('../models/Professional');
const User = require('../models/User');

async function checkEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holisticcare');
    console.log('MongoDB connected');

    const professionalId = '68744bee61db639624c873e9';
    const professional = await Professional.findById(professionalId);
    console.log('Professional found:', professional ? 'Yes' : 'No');
    if (professional) {
      console.log('Professional userId:', professional.userId);
      
      // Chercher les événements pour ce professionnel
      const events = await Event.find({ professional: professional.userId });
      console.log(`Found ${events.length} events for this professional`);
      
      events.forEach(event => {
        console.log(`- ${event.title} (${event.category})`);
      });
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEvents();
