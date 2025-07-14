const mongoose = require('mongoose');

/**
 * Middleware pour vérifier si l'utilisateur authentifié est un professionnel
 */
module.exports = function(req, res, next) {
  // Récupérer le modèle Professional après son chargement par mongoose
  const Professional = mongoose.model('Professional');
  
  // Vérifier si l'utilisateur est un professionnel
  Professional.findOne({ userId: req.user._id })
    .then(professional => {
      if (!professional) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Cette fonctionnalité est réservée aux professionnels.'
        });
      }
      
      // Ajouter les informations du professionnel à la requête pour utilisation ultérieure
      req.professional = professional;
      
      next();
    })
    .catch(error => {
      console.error('Erreur dans le middleware professionalAuth:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la vérification des droits professionnels'
      });
    });
}; 