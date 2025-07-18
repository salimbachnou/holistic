const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Event = require('../models/Event');

async function debugProfessionalEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    console.log('MongoDB connected');

    const professionalId = '684334cc016361b53a41404d';
    
    // 1. Vérifier le professionnel
    const professional = await Professional.findById(professionalId).populate('userId');
    console.log('\n=== PROFESSIONNEL ===');
    console.log('ID:', professionalId);
    console.log('Trouvé:', professional ? 'OUI' : 'NON');
    
    if (professional) {
      console.log('Business Name:', professional.businessName);
      console.log('User ID:', professional.userId._id);
      console.log('User Email:', professional.userId.email);
      
      // 2. Chercher tous les événements pour ce userId
      console.log('\n=== RECHERCHE ÉVÉNEMENTS ===');
      console.log('Recherche événements avec professional =', professional.userId._id);
      
      const allEvents = await Event.find({ professional: professional.userId._id });
      console.log('Événements trouvés (tous):', allEvents.length);
      
      allEvents.forEach((event, index) => {
        console.log(`\n--- Événement ${index + 1} ---`);
        console.log('ID:', event._id);
        console.log('Titre:', event.title);
        console.log('Professional ID:', event.professional);
        console.log('Status:', event.status);
        console.log('Date:', event.date);
        console.log('Category:', event.category);
      });
      
      // 3. Chercher les événements approuvés
      const approvedEvents = await Event.find({ 
        professional: professional.userId._id, 
        status: 'approved' 
      });
      console.log('\nÉvénements approuvés:', approvedEvents.length);
      
      // 4. Chercher les événements futurs approuvés
      const now = new Date();
      const upcomingEvents = await Event.find({
        professional: professional.userId._id,
        status: 'approved',
        $or: [
          { date: { $gte: now } },
          { endDate: { $gte: now } }
        ]
      });
      console.log('Événements futurs approuvés:', upcomingEvents.length);
      
      // 5. Essayer aussi avec l'ID du professionnel directement
      console.log('\n=== RECHERCHE ALTERNATIVE ===');
      const eventsByProfId = await Event.find({ professional: professionalId });
      console.log('Événements avec professional =', professionalId, ':', eventsByProfId.length);
      
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDéconnexion de MongoDB');
  }
}

debugProfessionalEvents();
