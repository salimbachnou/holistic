const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Import models
const Message = require('../models/Message');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all conversations for the authenticated user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Message.getConversationsList(req.user._id);
    
    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const sender = conv.sender[0];
      const receiver = conv.receiver[0];
      const otherPerson = sender._id.toString() === req.user._id.toString() ? receiver : sender;
      
      return {
        conversationId: conv._id,
        otherPerson: {
          _id: otherPerson._id,
          firstName: otherPerson.firstName,
          lastName: otherPerson.lastName,
          profileImage: otherPerson.profileImage
        },
        lastMessage: {
          content: conv.lastMessage.text,
          createdAt: conv.lastMessage.timestamp
        },
        unreadCount: conv.unreadCount
      };
    });
    
    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation with a specific user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between the two users
    const messages = await Message.getConversation(req.user._id, userId);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', [
  authenticate,
  body('receiverId').notEmpty().isMongoId(),
  body('text').notEmpty().trim().isLength({ max: 1000 }),
  body('messageType').optional().isIn(['text', 'image', 'file', 'booking_request', 'booking_response', 'system'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, text, messageType = 'text', attachments } = req.body;
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Créer l'ID de conversation en triant les IDs des utilisateurs
    const sortedIds = [req.user._id.toString(), receiverId.toString()].sort();
    const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;

    // Create and save the message
    const message = new Message({
      senderId: req.user._id,
      receiverId,
      text,
      messageType,
      timestamp: new Date(),
      isRead: false,
      deliveryStatus: 'sent',
      attachments: attachments || [],
      conversationId: conversationId // Ajouter explicitement l'ID de conversation
    });

    await message.save();

    // Populate sender and receiver info
    await message.populate('senderId', 'firstName lastName fullName profileImage');
    await message.populate('receiverId', 'firstName lastName fullName profileImage');

    res.status(201).json(message);

    // Access the socket.io instance from the request
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`user-${receiverId}`).emit('receive-message', message);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/mark-read/:senderId', authenticate, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    // Validate senderId
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Update all unread messages from this sender
    const result = await Message.updateMany(
      { 
        senderId, 
        receiverId: req.user._id,
        isRead: false
      },
      {
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({ 
      success: true, 
      count: result.nModified || 0
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message (soft delete)
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user is the sender or receiver
    if (!message.senderId.equals(req.user._id) && !message.receiverId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete the message
    await message.softDelete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 