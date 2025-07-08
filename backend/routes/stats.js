const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Professional = require('../models/Professional');
const Session = require('../models/Session');

// GET /api/stats/global
router.get('/global', async (req, res) => {
  try {
    // Compter les professionnels
    const professionalsCount = await Professional.countDocuments();
    
    // Compter les clients (users qui ne sont pas des professionnels)
    const clientsCount = await User.countDocuments({ role: 'client' });
    
    // Compter les sessions
    const sessionsCount = await Session.countDocuments();
    
    // Calculer le taux de satisfaction (pour l'exemple, on met 98%)
    // TODO: Implémenter le vrai calcul basé sur les reviews
    const satisfactionRate = 98;

    res.json({
      professionals: professionalsCount,
      clients: clientsCount,
      sessions: sessionsCount,
      satisfaction: satisfactionRate
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router; 