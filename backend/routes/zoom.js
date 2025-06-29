const express = require('express');
const router = express.Router();
const zoomService = require('../services/zoomService');
const { isAuthenticated, isProfessional } = require('../middleware/auth');
const Session = require('../models/Session');
const Professional = require('../models/Professional');

// Créer une réunion Zoom pour une session
router.post('/meetings/session/:sessionId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Vérifier que la session existe et appartient au professionnel
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette session.'
      });
    }

    // Créer la réunion Zoom
    const startTime = new Date(session.startTime).toISOString();
    const meeting = await zoomService.createMeeting(
      session.title,
      startTime,
      session.duration,
      session.description
    );

    // Mettre à jour la session avec les informations de la réunion
    session.meetingLink = meeting.join_url;
    session.zoomMeetingId = meeting.id;
    session.zoomMeetingPassword = meeting.password;
    session.category = 'online'; // Définir la catégorie comme "online"
    
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Réunion Zoom créée avec succès',
      meeting: {
        id: meeting.id,
        join_url: meeting.join_url,
        password: meeting.password,
        start_url: meeting.start_url
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réunion Zoom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la réunion Zoom'
    });
  }
});

// Récupérer les informations d'une réunion Zoom associée à une session
router.get('/meetings/info/:sessionId', isAuthenticated, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Vérifier que la session existe
    const session = await Session.findById(sessionId).populate('professionalId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    if (!session.zoomMeetingId) {
      return res.status(400).json({
        success: false,
        message: 'Cette session n\'a pas de réunion Zoom associée'
      });
    }

    // Vérifier si l'utilisateur est le professionnel ou un participant
    const isProfessional = session.professionalId.userId.equals(req.user._id);
    const isParticipant = session.participants.some(participant => participant.equals(req.user._id));
    
    if (!isProfessional && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas autorisé à rejoindre cette session.'
      });
    }

    // Récupérer les détails de la réunion
    const meeting = await zoomService.getMeeting(session.zoomMeetingId);

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        topic: meeting.topic,
        join_url: meeting.join_url,
        password: session.zoomMeetingPassword || meeting.password,
        start_time: meeting.start_time,
        duration: meeting.duration
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la réunion Zoom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des informations de la réunion Zoom'
    });
  }
});

// Mettre à jour une réunion Zoom
router.put('/meetings/:meetingId/session/:sessionId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { meetingId, sessionId } = req.params;
    
    // Vérifier que la session existe et appartient au professionnel
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette session.'
      });
    }

    // Mettre à jour la réunion Zoom
    const startTime = new Date(session.startTime).toISOString();
    const meeting = await zoomService.updateMeeting(
      meetingId,
      session.title,
      startTime,
      session.duration,
      session.description
    );

    res.json({
      success: true,
      message: 'Réunion Zoom mise à jour avec succès',
      meeting: {
        id: meeting.id,
        join_url: meeting.join_url,
        password: meeting.password
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réunion Zoom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la réunion Zoom'
    });
  }
});

// Supprimer une réunion Zoom
router.delete('/meetings/:meetingId/session/:sessionId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { meetingId, sessionId } = req.params;
    
    // Vérifier que la session existe et appartient au professionnel
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional || !session.professionalId.equals(professional._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette session.'
      });
    }

    // Supprimer la réunion Zoom
    await zoomService.deleteMeeting(meetingId);

    // Mettre à jour la session
    session.meetingLink = undefined;
    session.zoomMeetingId = undefined;
    session.zoomMeetingPassword = undefined;
    await session.save();

    res.json({
      success: true,
      message: 'Réunion Zoom supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réunion Zoom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de la réunion Zoom'
    });
  }
});

module.exports = router; 