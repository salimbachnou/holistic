const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isProfessional, isAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

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