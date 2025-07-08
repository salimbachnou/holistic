const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isProfessional, isAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

// Ajouter un avis sur un événement
router.post('/:id/reviews', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Vérifier si l'utilisateur a participé à l'événement
    const hasParticipated = event.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.status === 'confirmed'
    );

    if (!hasParticipated) {
      return res.status(403).json({ message: 'Vous devez avoir participé à l\'événement pour laisser un avis' });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis
    const hasReviewed = event.reviews.some(
      review => review.user.toString() === req.user._id.toString()
    );

    if (hasReviewed) {
      return res.status(400).json({ message: 'Vous avez déjà laissé un avis pour cet événement' });
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
    }

    // Ajouter l'avis
    event.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    // Mettre à jour les statistiques
    event.updateReviewStats();
    await event.save();

    res.json({ message: 'Avis ajouté avec succès', event });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'avis' });
  }
});

// Modifier son avis
router.put('/:eventId/reviews/:reviewId', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const review = event.reviews.id(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier cet avis' });
    }

    const { rating, comment } = req.body;

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    // Mettre à jour les statistiques
    event.updateReviewStats();
    await event.save();

    res.json({ message: 'Avis modifié avec succès', event });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'avis' });
  }
});

// Supprimer son avis
router.delete('/:eventId/reviews/:reviewId', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const review = event.reviews.id(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cet avis' });
    }

    review.remove();
    
    // Mettre à jour les statistiques
    event.updateReviewStats();
    await event.save();

    res.json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'avis' });
  }
});

// Mettre à jour le calcul des statistiques pour inclure la satisfaction
router.get('/stats', async (req, res) => {
  try {
    // Nombre total d'événements approuvés
    const totalEvents = await Event.countDocuments({ status: 'approved' });

    // Nombre total de participants (statut confirmé)
    const events = await Event.find({ status: 'approved' });
    let totalParticipants = 0;
    let totalRating = 0;
    let totalReviews = 0;

    events.forEach(event => {
      // Compter les participants confirmés
      totalParticipants += event.participants.filter(p => p.status === 'confirmed').length;
      
      // Calculer la moyenne des notes
      if (event.stats.totalReviews > 0) {
        totalRating += event.stats.averageRating * event.stats.totalReviews;
        totalReviews += event.stats.totalReviews;
      }
    });

    // Calculer la satisfaction moyenne globale
    const satisfaction = totalReviews > 0 
      ? Number((totalRating / totalReviews).toFixed(1))
      : 0;

    // Calcul de la croissance
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const currentMonthEvents = await Event.countDocuments({
      status: 'approved',
      createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
    });

    const lastMonthEvents = await Event.countDocuments({
      status: 'approved',
      createdAt: { 
        $gte: lastMonth,
        $lt: new Date(today.getFullYear(), today.getMonth(), 1)
      }
    });

    const growth = lastMonthEvents === 0 ? 100 : 
      Math.round(((currentMonthEvents - lastMonthEvents) / lastMonthEvents) * 100);

    res.json({
      stats: {
        totalEvents,
        totalParticipants,
        satisfaction,
        totalReviews,
        growth: `${growth > 0 ? '+' : ''}${growth}%`
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

// Récupérer tous les événements publics (approuvés)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('professional', 'firstName lastName profileImage')
      .sort({ date: 1 });
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

// Récupérer les événements d'un professionnel - doit être placé avant la route paramétrée
router.get('/professional', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const events = await Event.find({ professional: req.user._id })
      .sort({ date: 1 });
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching professional events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements du professionnel' });
  }
});

// Récupérer un événement par son ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage businessName bio specialties email'
      })
      .populate('participants.user', 'firstName lastName profileImage');
    

    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'événement' });
  }
});

// Créer un nouvel événement
router.post('/', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      endDate,
      address,
      locationCoordinates,
      price,
      currency,
      maxParticipants,
      bookingType,
      coverImages,
    } = req.body;

    // Validation
    if (new Date(date) > new Date(endDate)) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      endDate,
      address,
      locationCoordinates,
      price,
      currency: currency || 'MAD',
      maxParticipants,
      bookingType,
      coverImages: coverImages || [],
      professional: req.user._id,
    });

    await newEvent.save();
    
    // Déclencher la notification pour le professionnel (confirmation de création)
    try {
      const NotificationService = require('../services/notificationService');
      const Professional = require('../models/Professional');
      const professional = await Professional.findOne({ userId: req.user._id });
      if (professional) {
        await NotificationService.notifyNewEvent(newEvent, professional._id);
      }
    } catch (error) {
      console.error('Erreur lors de la notification de nouvel événement:', error);
    }
    
    res.status(201).json({ message: 'Événement créé avec succès', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'événement' });
  }
});

// Mettre à jour un événement
router.put('/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier que l'événement appartient au professionnel
    if (event.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier cet événement' });
    }
    
    const {
      title,
      description,
      date,
      endDate,
      address,
      locationCoordinates,
      price,
      currency,
      maxParticipants,
      bookingType,
      coverImages,
    } = req.body;

    // Validation
    if (new Date(date) > new Date(endDate)) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
    }

    // Mettre à jour l'événement
    event.title = title;
    event.description = description;
    event.date = date;
    event.endDate = endDate;
    event.address = address;
    event.locationCoordinates = locationCoordinates;
    event.price = price;
    event.currency = currency || 'MAD';
    event.maxParticipants = maxParticipants;
    event.bookingType = bookingType;
    
    // Ne mettre à jour les images que si elles sont fournies
    if (coverImages) {
      event.coverImages = coverImages;
    }
    
    // Si l'événement était déjà approuvé, le passer en attente de modération
    if (event.status === 'approved') {
      event.status = 'pending';
    }

    await event.save();
    
    res.json({ message: 'Événement mis à jour avec succès', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'événement' });
  }
});

// Supprimer un événement
router.delete('/:id', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier que l'événement appartient au professionnel
    if (event.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cet événement' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement' });
  }
});

// S'inscrire à un événement
router.post('/:id/register', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier si l'événement est approuvé
    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Cet événement n\'est pas disponible pour inscription' });
    }
    
    // Vérifier si l'utilisateur est déjà inscrit
    const isRegistered = event.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.status !== 'cancelled'
    );
    
    if (isRegistered) {
      return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement' });
    }
    
    // Vérifier si l'événement est complet
    const activeParticipants = event.participants.filter(p => p.status !== 'cancelled').length;
    if (activeParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Cet événement est complet' });
    }
    
    // Ajouter l'utilisateur aux participants
    event.participants.push({
      user: req.user._id,
      status: 'pending',
    });
    
    await event.save();
    
    res.json({ message: 'Inscription réussie', event });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription à l\'événement' });
  }
});

// Annuler son inscription à un événement
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Trouver l'inscription de l'utilisateur
    const participantIndex = event.participants.findIndex(p => 
      p.user.toString() === req.user._id.toString() && p.status !== 'cancelled'
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Vous n\'êtes pas inscrit à cet événement' });
    }
    
    // Annuler l'inscription
    event.participants[participantIndex].status = 'cancelled';
    
    await event.save();
    
    res.json({ message: 'Inscription annulée avec succès' });
  } catch (error) {
    console.error('Error cancelling event registration:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de l\'inscription' });
  }
});

// Routes pour les administrateurs

// Approuver/Rejeter un événement
router.put('/:id/review', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    event.status = status;
    
    if (status === 'rejected' && reason) {
      event.rejectionReason = reason;
    }
    
    await event.save();
    
    res.json({ message: 'Statut de l\'événement mis à jour', event });
  } catch (error) {
    console.error('Error reviewing event:', error);
    res.status(500).json({ message: 'Erreur lors de la révision de l\'événement' });
  }
});

module.exports = router; 