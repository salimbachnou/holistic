const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Récupérer les messages entre l'utilisateur connecté et un professionnel spécifique
router.get('/:professionalId', protect, async (req, res) => {
  try {
    const { professionalId } = req.params;
    const userId = req.user._id;

    // Rechercher les messages entre ces deux utilisateurs
    const messages = await Message.find({
      conversationId: {
        $in: [
          `${userId}_${professionalId}`,
          `${professionalId}_${userId}`,
        ]
      }
    }).sort({ createdAt: 1 });

    // Marquer les messages non lus comme lus
    await Message.updateMany(
      {
        senderId: professionalId,
        receiverId: userId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// Envoyer un nouveau message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Destinataire et contenu requis' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      content
    });

    const savedMessage = await newMessage.save();
    
    res.status(201).json({ 
      message: savedMessage,
      success: true
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Récupérer la liste des conversations de l'utilisateur
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Trouver toutes les conversations où l'utilisateur est impliqué
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ createdAt: -1 });

    // Extraire les IDs de conversation uniques
    const conversationIds = [...new Set(messages.map(msg => msg.conversationId))];
    
    // Pour chaque conversation, obtenir le dernier message et les infos de l'autre personne
    const conversations = [];
    for (const convId of conversationIds) {
      const lastMessage = await Message.findOne({ conversationId: convId })
        .sort({ createdAt: -1 })
        .populate('senderId', 'firstName lastName profileImage')
        .populate('receiverId', 'firstName lastName profileImage');
      
      // Déterminer qui est l'autre personne dans la conversation
      const otherPerson = lastMessage.senderId._id.toString() === userId.toString() 
        ? lastMessage.receiverId 
        : lastMessage.senderId;
      
      // Compter les messages non lus
      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        receiverId: userId,
        read: false
      });
      
      conversations.push({
        conversationId: convId,
        otherPerson,
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId._id
        },
        unreadCount
      });
    }

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
});

module.exports = router; 