const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middleware/auth');

// Modèles
const Notification = mongoose.model('Notification');

// Fonction pour convertir un document MongoDB en objet JavaScript standard
const mongoDocToObject = (doc) => {
  if (!doc) return null;
  
  // Si c'est un document Mongoose
  if (doc.toObject) {
    return doc.toObject({ getters: true, virtuals: true });
  }
  
  // Si c'est déjà un objet JavaScript
  return doc;
};

// Fonction pour convertir les objets MongoDB en JSON standard
const toJSON = (doc) => {
  if (!doc) return null;
  
  if (Array.isArray(doc)) {
    return doc.map(item => toJSON(item));
  }
  
  // Convertir d'abord en objet JavaScript standard
  const obj = mongoDocToObject(doc);
  
  // Si c'est un objet, le convertir en JSON
  if (typeof obj === 'object' && obj !== null) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  return obj;
};

// @route   GET /api/notifications
// @desc    Récupérer toutes les notifications de l'utilisateur
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Notifications API: User ID from token:', req.user._id);
    
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('Notifications API: Found notifications:', notifications.length);
    
    // Convertir les objets MongoDB en JSON standard
    const notificationsJSON = toJSON(notifications);
    console.log('Notifications API: First notification after conversion:', 
      notificationsJSON && notificationsJSON.length > 0 ? notificationsJSON[0] : 'No notifications');
    
    return res.json({
      success: true,
      notifications: notificationsJSON
    });
  } catch (error) {
    console.error('Notifications API: Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications'
    });
  }
});

// @route   POST /api/notifications/:id/mark-read
// @desc    Marquer une notification comme lue
// @access  Private
router.post('/:id/mark-read', isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    notification.read = true;
    await notification.save();

    return res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du marquage de la notification'
    });
  }
});

// @route   POST /api/notifications/mark-all-read
// @desc    Marquer toutes les notifications comme lues
// @access  Private
router.post('/mark-all-read', isAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du marquage des notifications'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Supprimer une notification
// @access  Private
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await notification.deleteOne();

    return res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la notification'
    });
  }
});

module.exports = router; 