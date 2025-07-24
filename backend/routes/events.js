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
      // Compter les participants confirmés (en tenant compte des quantités)
      totalParticipants += event.participants
        .filter(p => p.status === 'confirmed')
        .reduce((total, p) => total + (p.quantity || 1), 0);
      
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
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage isVerified isActive'
      })
      .sort({ date: 1 });
    
    // Filter out events with unverified or inactive professionals
    const filteredEvents = events.filter(event => 
      event.professional && 
      event.professional.isVerified && 
      event.professional.isActive
    );
    
    res.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

// Récupérer les événements d'un professionnel (doit être avant /:id)
router.get('/professional', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const events = await Event.find({ professional: req.user._id })
      .populate('participants.user', 'firstName lastName email profileImage')
      .sort({ date: -1 });
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching professional events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

// Récupérer les événements auxquels l'utilisateur s'est inscrit (doit être avant /:id)
router.get('/my-events', isAuthenticated, async (req, res) => {
  try {
    console.log('🔍 [MY-EVENTS] Fetching events for user:', req.user._id);
    
    const events = await Event.find({
      'participants.user': req.user._id,
      status: 'approved'
    })
      .populate('professional', 'firstName lastName profileImage businessName')
      .sort({ date: -1 });
    
    // Filtrer pour récupérer seulement les événements où l'utilisateur est participant
    const userEvents = events.map(event => {
      const userParticipation = event.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );
      
      return {
        ...event.toObject(),
        userParticipation: userParticipation
      };
    });
    
    console.log('✅ [MY-EVENTS] Found events:', userEvents.length);
    res.json({ events: userEvents });
  } catch (error) {
    console.error('❌ [MY-EVENTS] Error fetching user events:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de vos événements' });
  }
});

// Récupérer les participants d'un événement (doit être avant /:id)
router.get('/:id/participants', isAuthenticated, isProfessional, async (req, res) => {
  try {
    console.log('🔍 [PARTICIPANTS] Fetching participants for event:', req.params.id);
    console.log('🔍 [PARTICIPANTS] Route matched: /:id/participants');
    
    const event = await Event.findById(req.params.id)
      .populate('participants.user', 'firstName lastName email profileImage phone');
    
    if (!event) {
      console.log('❌ [PARTICIPANTS] Event not found:', req.params.id);
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    console.log('✅ [PARTICIPANTS] Event found, professional:', event.professional);
    console.log('✅ [PARTICIPANTS] Current user:', req.user._id);
    
    // Vérifier que l'événement appartient au professionnel
    if (event.professional.toString() !== req.user._id.toString()) {
      console.log('❌ [PARTICIPANTS] Access denied - not the owner');
      return res.status(403).json({ message: 'Non autorisé à voir les participants de cet événement' });
    }
    
    console.log('✅ [PARTICIPANTS] Returning participants:', event.participants.length);
    res.json({ participants: event.participants });
  } catch (error) {
    console.error('❌ [PARTICIPANTS] Error fetching event participants:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des participants' });
  }
});

// Mettre à jour le statut d'un participant (doit être avant /:id)
router.put('/:eventId/participants/:participantId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { status, reason } = req.body;
    
    console.log('Updating participant status:', { eventId, participantId, status });
    
    const event = await Event.findById(eventId)
      .populate('participants.user', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier que l'événement appartient au professionnel
    if (event.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier les participants de cet événement' });
    }
    
    // Trouver le participant
    const participantIndex = event.participants.findIndex(
      p => p._id.toString() === participantId
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({ message: 'Participant non trouvé' });
    }
    
    // Mettre à jour le statut
    event.participants[participantIndex].status = status;
    
    if (status === 'cancelled' && reason) {
      event.participants[participantIndex].cancellationReason = reason;
    }
    
    await event.save();
    
    // Envoyer une notification au participant
    try {
      const NotificationService = require('../services/notificationService');
      const participant = event.participants[participantIndex];
      const quantityText = participant.quantity > 1 ? `${participant.quantity} places` : '1 place';
      
      if (status === 'confirmed') {
        await NotificationService.createClientNotification(
          participant.user._id,
          'Inscription confirmée',
          `Votre inscription à l'événement "${event.title}" pour ${quantityText} a été confirmée !`,
          'event_confirmed',
          `/events/${event._id}`,
          {
            eventId: event._id,
            eventTitle: event.title,
            eventDate: event.date,
            quantity: participant.quantity
          }
        );
      } else if (status === 'cancelled') {
        await NotificationService.createClientNotification(
          participant.user._id,
          'Inscription refusée',
          `Votre inscription à l'événement "${event.title}" pour ${quantityText} a été refusée.${reason ? ` Raison: ${reason}` : ''}`,
          'event_cancelled',
          `/events/${event._id}`,
          {
            eventId: event._id,
            eventTitle: event.title,
            reason: reason || 'Aucune raison spécifiée',
            quantity: participant.quantity
          }
        );
      }
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
    }
    
    console.log('Participant status updated successfully');
    res.json({ 
      message: `Statut du participant mis à jour: ${status}`,
      participant: event.participants[participantIndex]
    });
    
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut du participant' });
  }
});

// Récupérer un événement par son ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 [EVENT] Fetching event by ID:', req.params.id);
    console.log('🔍 [EVENT] Route matched: /:id');
    
    const event = await Event.findById(req.params.id)
      .populate({
        path: 'professional',
        select: 'firstName lastName profileImage businessName bio specialties email'
      })
      .populate('participants.user', 'firstName lastName profileImage');
    

    
    if (!event) {
      console.log('❌ [EVENT] Event not found:', req.params.id);
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    console.log('✅ [EVENT] Event found:', event.title);
    res.json({ event });
  } catch (error) {
    console.error('❌ [EVENT] Error fetching event:', error);
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
    
    // Vérifier si l'événement était déjà approuvé pour notifier les participants
    const wasApproved = event.status === 'approved';
    
    // Si l'événement était déjà approuvé, le passer en attente de modération
    if (wasApproved) {
      event.status = 'pending';
    }

    await event.save();
    
    // Notifier les participants si l'événement était approuvé et passe en attente
    if (wasApproved && event.participants && event.participants.length > 0) {
      try {
        console.log('🔔 [UPDATE] Événement était approuvé, envoi des notifications...');
        const NotificationService = require('../services/notificationService');
        
        // Notifier tous les participants actifs (non annulés)
        const activeParticipants = event.participants.filter(p => p.status !== 'cancelled');
        console.log(`🔔 [UPDATE] ${activeParticipants.length} participants actifs trouvés:`, activeParticipants.map(p => ({
          userId: p.user.toString(),
          status: p.status
        })));
        
        for (const participant of activeParticipants) {
          console.log(`🔔 [UPDATE] Envoi notification à l'utilisateur: ${participant.user}`);
          const result = await NotificationService.createClientNotification(
            participant.user,
            'Événement modifié',
            `L'événement "${event.title}" a été modifié par l'organisateur. Il est maintenant en attente de validation.`,
            'event_updated',
            `/events/${event._id}`,
            {
              eventId: event._id,
              eventTitle: event.title,
              eventDate: event.date,
              changes: 'Événement modifié - en attente de validation'
            }
          );
          console.log(`🔔 [UPDATE] Résultat notification pour ${participant.user}:`, result ? 'Succès' : 'Échec');
        }
        
        console.log(`✅ [UPDATE] Notifications envoyées à ${activeParticipants.length} participants pour l'événement modifié: ${event.title}`);
      } catch (notificationError) {
        console.error('❌ [UPDATE] Erreur lors de l\'envoi des notifications de modification:', notificationError);
      }
    } else {
      console.log('🔔 [UPDATE] Conditions non remplies pour l\'envoi de notifications:', {
        wasApproved,
        hasParticipants: event.participants && event.participants.length > 0,
        participantsCount: event.participants ? event.participants.length : 0
      });
    }
    
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
    const { quantity = 1, note = '' } = req.body;
    
    console.log('🔍 [REGISTER] Event registration request:', {
      eventId: req.params.id,
      userId: req.user._id,
      userEmail: req.user.email,
      quantity: quantity,
      note: note
    });
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      console.log('❌ [REGISTER] Event not found:', req.params.id);
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    console.log('✅ [REGISTER] Event found:', event.title);
    console.log('🔍 [REGISTER] Event participants:', event.participants.map(p => ({
      userId: p.user.toString(),
      status: p.status,
      quantity: p.quantity,
      _id: p._id
    })));
    
    // Vérifier si l'événement est approuvé
    if (event.status !== 'approved') {
      console.log('❌ [REGISTER] Event not approved:', event.status);
      return res.status(400).json({ message: 'Cet événement n\'est pas disponible pour inscription' });
    }
    
    // Validation de la quantité
    if (quantity < 1) {
      return res.status(400).json({ message: 'La quantité doit être d\'au moins 1' });
    }
    
    // Vérifier si l'utilisateur est déjà inscrit (avec statut non annulé)
    const existingParticipations = event.participants.filter(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    console.log('🔍 [REGISTER] All user participations:', existingParticipations);
    
    const activeParticipation = existingParticipations.find(p => p.status !== 'cancelled');
    
    console.log('🔍 [REGISTER] Active participation:', activeParticipation);
    
    if (activeParticipation) {
      console.log('❌ [REGISTER] User already has active registration');
      return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement' });
    }
    
    // Trouver la participation annulée la plus récente pour la réactiver
    const cancelledParticipation = existingParticipations
      .filter(p => p.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    console.log('🔍 [REGISTER] Most recent cancelled participation:', cancelledParticipation);
    
    // Calculer le nombre total de places occupées (en tenant compte des quantités)
    const totalOccupiedPlaces = event.participants
      .filter(p => p.status !== 'cancelled')
      .reduce((total, p) => total + (p.quantity || 1), 0);
    
    console.log('🔍 [REGISTER] Total occupied places:', totalOccupiedPlaces, '/', event.maxParticipants);
    
    // Vérifier si l'événement a assez de places disponibles
    if (totalOccupiedPlaces + quantity > event.maxParticipants) {
      console.log('❌ [REGISTER] Event does not have enough places');
      return res.status(400).json({ 
        message: `Il ne reste que ${event.maxParticipants - totalOccupiedPlaces} place(s) disponible(s) pour cet événement` 
      });
    }
    
    // Si l'utilisateur a une participation annulée, la réactiver au lieu de créer une nouvelle
    if (cancelledParticipation) {
      console.log('🔄 [REGISTER] Reactivating cancelled participation');
      // Fetch the Professional by userId (event.professional)
      const Professional = require('../models/Professional');
      const professional = await Professional.findOne({ userId: event.professional });
      const bookingMode = professional?.bookingMode || 'manual';
      cancelledParticipation.status = bookingMode === 'auto' ? 'confirmed' : 'pending';
      cancelledParticipation.quantity = quantity;
      cancelledParticipation.note = note;
      cancelledParticipation.createdAt = new Date();
    } else {
      console.log('➕ [REGISTER] Adding new participation');
      // Ajouter l'utilisateur aux participants
      // Fetch the Professional by userId (event.professional)
      const Professional = require('../models/Professional');
      const professional = await Professional.findOne({ userId: event.professional });
      const bookingMode = professional?.bookingMode || 'manual';
      event.participants.push({
        user: req.user._id,
        status: bookingMode === 'auto' ? 'confirmed' : 'pending',
        quantity: quantity,
        note: note
      });
    }
    
    await event.save();
    
    // Envoyer une notification au professionnel
    try {
      console.log('🔔 [REGISTER] Sending notification to professional');
      const NotificationService = require('../services/notificationService');
      
      // Récupérer les informations du client
      const clientName = `${req.user.firstName} ${req.user.lastName}`;
      
      const quantityText = quantity > 1 ? `${quantity} places` : '1 place';
      const noteText = note ? `\nNote: ${note}` : '';
      
      await NotificationService.createClientNotification(
        event.professional,
        'Nouvelle réservation d\'événement',
        `${clientName} s'est inscrit(e) à votre événement "${event.title}" pour ${quantityText}.${noteText}`,
        'event_booking_request',
        `/dashboard/professional/event-bookings`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          clientId: req.user._id,
          clientName: clientName,
          clientEmail: req.user.email,
          quantity: quantity,
          note: note
        }
      );
      
      console.log('✅ [REGISTER] Notification sent to professional');
    } catch (notificationError) {
      console.error('❌ [REGISTER] Error sending notification:', notificationError);
      // Ne pas faire échouer l'inscription si la notification échoue
    }
    
    console.log('✅ [REGISTER] Registration successful');
    res.json({ message: 'Inscription réussie', event });
  } catch (error) {
    console.error('❌ [REGISTER] Error registering for event:', error);
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
    
    // Envoyer une notification au professionnel
    try {
      console.log('🔔 [CANCEL] Sending cancellation notification to professional');
      const NotificationService = require('../services/notificationService');
      
      // Récupérer les informations du client
      const clientName = `${req.user.firstName} ${req.user.lastName}`;
      
      await NotificationService.createClientNotification(
        event.professional,
        'Annulation de réservation d\'événement',
        `${clientName} a annulé son inscription à votre événement "${event.title}".`,
        'event_booking_cancelled',
        `/dashboard/professional/event-bookings`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          clientId: req.user._id,
          clientName: clientName,
          clientEmail: req.user.email
        }
      );
      
      console.log('✅ [CANCEL] Cancellation notification sent to professional');
    } catch (notificationError) {
      console.error('❌ [CANCEL] Error sending cancellation notification:', notificationError);
      // Ne pas faire échouer l'annulation si la notification échoue
    }
    
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
    
    const previousStatus = event.status;
    event.status = status;
    
    if (status === 'rejected' && reason) {
      event.rejectionReason = reason;
    }
    
    await event.save();
    
    // Notifier les participants si l'événement est approuvé après modification
    if (status === 'approved' && previousStatus === 'pending' && event.participants && event.participants.length > 0) {
      try {
        const NotificationService = require('../services/notificationService');
        
        // Notifier tous les participants actifs (non annulés)
        const activeParticipants = event.participants.filter(p => p.status !== 'cancelled');
        
        for (const participant of activeParticipants) {
          await NotificationService.createClientNotification(
            participant.user,
            'Événement validé',
            `L'événement "${event.title}" a été validé après modification. Vous pouvez maintenant consulter les détails mis à jour.`,
            'event_approved',
            `/events/${event._id}`,
            {
              eventId: event._id,
              eventTitle: event.title,
              eventDate: event.date,
              changes: 'Événement validé après modification'
            }
          );
        }
        
        console.log(`✅ Notifications d'approbation envoyées à ${activeParticipants.length} participants pour l'événement: ${event.title}`);
      } catch (notificationError) {
        console.error('Erreur lors de l\'envoi des notifications d\'approbation:', notificationError);
      }
    }
    
    // Notifier les participants si l'événement est rejeté
    if (status === 'rejected' && event.participants && event.participants.length > 0) {
      try {
        const NotificationService = require('../services/notificationService');
        
        // Notifier tous les participants actifs (non annulés)
        const activeParticipants = event.participants.filter(p => p.status !== 'cancelled');
        
        for (const participant of activeParticipants) {
          await NotificationService.createClientNotification(
            participant.user,
            'Événement rejeté',
            `L'événement "${event.title}" a été rejeté par l'administration.${reason ? ` Raison: ${reason}` : ''}`,
            'event_rejected',
            `/events/${event._id}`,
            {
              eventId: event._id,
              eventTitle: event.title,
              reason: reason || 'Aucune raison spécifiée'
            }
          );
        }
        
        console.log(`✅ Notifications de rejet envoyées à ${activeParticipants.length} participants pour l'événement: ${event.title}`);
      } catch (notificationError) {
        console.error('Erreur lors de l\'envoi des notifications de rejet:', notificationError);
      }
    }
    
    res.json({ message: 'Statut de l\'événement mis à jour', event });
  } catch (error) {
    console.error('Error reviewing event:', error);
    res.status(500).json({ message: 'Erreur lors de la révision de l\'événement' });
  }
});

module.exports = router; 