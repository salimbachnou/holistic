const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Route pour obtenir les statistiques générales pour la page About
router.get('/about', async (req, res) => {
  try {
    // Récupérer le nombre de professionnels
    const professionalsCount = await Professional.countDocuments({ isActive: true });
    
    // Récupérer le nombre de clients (utilisateurs qui ne sont pas des professionnels)
    const clientsCount = await User.countDocuments({ role: 'client' });
    
    // Récupérer le nombre de sessions (bookings complétées)
    const sessionsCount = await Booking.countDocuments({ status: 'completed' });
    
    // Pour le taux de satisfaction, on pourrait le calculer à partir des avis
    // Pour l'instant, on met une valeur fixe
    const satisfactionRate = 95;

    res.json({
      professionals: professionalsCount,
      clients: clientsCount,
      sessions: sessionsCount,
      satisfaction: satisfactionRate
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router; 