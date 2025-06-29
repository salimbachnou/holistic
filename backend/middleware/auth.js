const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est authentifié
const isAuthenticated = async (req, res, next) => {
  try {
    // Vérifier si le token est présent dans les headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé - Token non fourni' });
    }
      // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Trouver l'utilisateur associé au token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Non autorisé - Token invalide' });
  }
};

// Middleware pour vérifier si l'utilisateur est un professionnel
const isProfessional = (req, res, next) => {
  if (!req.user || req.user.role !== 'professional') {
    return res.status(403).json({ message: 'Accès refusé - Réservé aux professionnels' });
  }
  
  next();
};

// Middleware pour vérifier si l'utilisateur est un administrateur
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé - Réservé aux administrateurs' });
  }
  
  next();
};

module.exports = { isAuthenticated, isProfessional, isAdmin }; 