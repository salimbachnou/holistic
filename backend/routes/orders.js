const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isProfessional } = require('../middleware/auth');

// Import models
const User = mongoose.model('User');
const Order = mongoose.model('Order');
const Professional = mongoose.model('Professional');
const Product = mongoose.model('Product');
const Notification = require('../models/Notification');
const Message = mongoose.model('Message');

// @route   GET /api/orders
// @desc    Get orders for the authenticated user (client or professional)
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Check if user is a professional
    const professional = await Professional.findOne({ userId: req.user._id });
    
    if (professional) {
      // If professional, get orders for their products
      query = { 'items.professional': professional._id };
    } else {
      // If client, get orders for this client
      query = { clientId: req.user._id };
    }
    
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('items.product', 'title name images price')
      .populate('items.professional', 'businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/orders/accept
// @desc    Accepter une commande et mettre à jour le stock
// @access  Private (Professional only)
router.post('/accept', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { messageId, orderInfo, clientId } = req.body;

    console.log("Données reçues:", { messageId, orderInfo, clientId, userId: req.user._id });

    // Validation des données
    if (!messageId || !orderInfo || !clientId) {
      console.log("Données manquantes:", { messageId, orderInfo, clientId });
      return res.status(400).json({
        success: false,
        message: 'Données de commande incomplètes'
      });
    }

    // Validation des informations de commande
    if (!orderInfo.product || !orderInfo.size || !orderInfo.quantity || orderInfo.quantity <= 0) {
      console.log("Informations de commande invalides:", orderInfo);
      return res.status(400).json({
        success: false,
        message: 'Informations de commande invalides ou incomplètes'
      });
    }

    // S'assurer que la quantité est un nombre
    orderInfo.quantity = parseInt(orderInfo.quantity, 10);
    if (isNaN(orderInfo.quantity) || orderInfo.quantity <= 0) {
      console.log("Quantité invalide:", orderInfo.quantity);
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide'
      });
    }

    console.log("Quantité validée:", orderInfo.quantity, typeof orderInfo.quantity);

    // Vérifier que le message existe
    const message = await Message.findById(messageId);
    if (!message) {
      console.log("Message non trouvé:", messageId);
      return res.status(404).json({
        success: false,
        message: 'Message de commande non trouvé'
      });
    }

    console.log("Message trouvé:", {
      messageId: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      userId: req.user._id
    });

    // Vérifier que le professionnel est bien le destinataire du message
    const messageReceiverId = message.receiverId.toString();
    const userIdString = req.user._id.toString();
    
    console.log("Comparaison des IDs:", {
      messageReceiverId,
      userIdString,
      match: messageReceiverId === userIdString
    });

    if (messageReceiverId !== userIdString) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à traiter cette commande'
      });
    }

    // Rechercher le professionnel
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      console.log("Professionnel non trouvé pour userId:", req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    console.log("Professionnel trouvé:", {
      professionalId: professional._id,
      name: professional.name || professional.fullName
    });

    // Rechercher le produit correspondant par nom
    const productName = orderInfo.product;
    console.log("Recherche de produit avec nom:", productName);

    // Échapper les caractères spéciaux pour l'expression régulière
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const safeProductName = escapeRegExp(productName);

    // Rechercher d'abord avec une correspondance exacte (insensible à la casse)
    const exactRegex = new RegExp(`^${safeProductName}$`, 'i');
    let products = await Product.find({ 
      professionalId: professional._id,
      $or: [
        { title: { $regex: exactRegex } },
        { name: { $regex: exactRegex } }
      ]
    });

    // Si aucun résultat, essayer une correspondance partielle
    if (products.length === 0) {
      const partialRegex = new RegExp(safeProductName, 'i');
      products = await Product.find({ 
        professionalId: professional._id,
        $or: [
          { title: { $regex: partialRegex } },
          { name: { $regex: partialRegex } }
        ]
      });
    }

    console.log("Produits trouvés:", products.map(p => ({ 
      id: p._id, 
      title: p.title, 
      name: p.name,
      sizes: p.sizeInventory?.map(s => s.size) || []
    })));

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Si plusieurs produits correspondent, essayer de trouver celui qui correspond le mieux
    let product = products[0]; // Par défaut, prendre le premier

    // Si le nom est exactement le même (insensible à la casse), privilégier ce produit
    const exactMatch = products.find(p => 
      p.title.toLowerCase() === productName.toLowerCase() || 
      p.name.toLowerCase() === productName.toLowerCase()
    );

    if (exactMatch) {
      product = exactMatch;
      console.log("Correspondance exacte trouvée:", { id: product._id, title: product.title, name: product.name });
    }

    console.log("Produit sélectionné:", {
      id: product._id,
      title: product.title,
      name: product.name,
      stock: product.stock,
      hasSizeInventory: product.sizeInventory && product.sizeInventory.length > 0
    });

    // Vérifier si le produit a un inventaire par taille
    if (product.sizeInventory && product.sizeInventory.length > 0) {
      // Trouver l'entrée de taille correspondante
      const sizeEntry = product.sizeInventory.find(item => 
        item.size.toLowerCase() === orderInfo.size.toLowerCase()
      );

      console.log("Recherche de taille:", {
        requestedSize: orderInfo.size.toLowerCase(),
        availableSizes: product.sizeInventory.map(s => s.size.toLowerCase()),
        availableSizesOriginal: product.sizeInventory.map(s => s.size),
        sizeFound: !!sizeEntry,
        sizeEntry: sizeEntry
      });

      if (!sizeEntry) {
        return res.status(400).json({
          success: false,
          message: 'Taille non disponible pour ce produit'
        });
      }

      console.log("Vérification du stock:", {
        size: sizeEntry.size,
        availableStock: sizeEntry.stock,
        requestedQuantity: orderInfo.quantity,
        isStockSufficient: sizeEntry.stock >= orderInfo.quantity
      });

      // Vérifier si le stock est suffisant
      if (sizeEntry.stock < orderInfo.quantity) {
        console.log("Stock insuffisant:", {
          size: sizeEntry.size,
          availableStock: sizeEntry.stock,
          requestedQuantity: orderInfo.quantity,
          stockType: typeof sizeEntry.stock,
          quantityType: typeof orderInfo.quantity,
          comparison: `${sizeEntry.stock} < ${orderInfo.quantity} = ${sizeEntry.stock < orderInfo.quantity}`
        });
        
        return res.status(400).json({
          success: false,
          message: 'Stock insuffisant pour cette taille'
        });
      }

      // Mettre à jour le stock pour cette taille
      sizeEntry.stock -= orderInfo.quantity;
      
      // Mettre à jour le stock total
      product.stock = product.sizeInventory.reduce((total, item) => total + item.stock, 0);
    } else {
      console.log("Vérification du stock global:", {
        availableStock: product.stock,
        requestedQuantity: orderInfo.quantity,
        isStockSufficient: product.stock >= orderInfo.quantity
      });

      // Vérifier si le stock global est suffisant
      if (product.stock < orderInfo.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuffisant'
        });
      }

      // Mettre à jour le stock global
      product.stock -= orderInfo.quantity;
    }

    // Enregistrer les modifications du produit
    await product.save();
    console.log("Produit mis à jour avec succès");
    
    // Marquer le message comme traité
    message.orderProcessed = true;
    await message.save();
    console.log("Message marqué comme traité");
    
    // Créer une nouvelle commande dans la collection des commandes
    const Order = mongoose.model('Order');
    
    // Générer un numéro de commande unique
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
    
    // Créer la nouvelle commande
    const newOrder = new Order({
      orderNumber,
      clientId: message.senderId,
      items: [
        {
          product: product._id,
          professional: professional._id,
          quantity: orderInfo.quantity,
          price: {
            amount: orderInfo.price || product.price,
            currency: orderInfo.currency || 'MAD'
          },
          size: orderInfo.size
        }
      ],
      totalAmount: {
        amount: orderInfo.total || (orderInfo.price || product.price) * orderInfo.quantity,
        currency: orderInfo.currency || 'MAD'
      },
      status: 'pending',
      messageId: message._id,
      paymentStatus: 'pending',
      paymentMethod: 'cash_on_delivery', // Par défaut
    });
    
    // Sauvegarder la nouvelle commande
    await newOrder.save();
    console.log("Nouvelle commande créée:", newOrder._id);
    
    // Peupler les données du client avant la notification
    await newOrder.populate('clientId', 'firstName lastName email');
    
    // Déclencher les notifications
    try {
      const NotificationService = require('../services/notificationService');
      
      // Notification pour le professionnel
      await NotificationService.notifyNewOrder(newOrder);
      
      // Notification pour le client
      await NotificationService.notifyClientOrderPlaced(newOrder);
    } catch (error) {
      console.error('Erreur lors des notifications de nouvelle commande:', error);
    }
    
    return res.json({
      success: true,
      message: 'Commande acceptée et stock mis à jour',
      updatedProduct: {
        id: product._id,
        title: product.title,
        stock: product.stock,
        sizeInventory: product.sizeInventory
      },
      order: newOrder
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la commande:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du traitement de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders/reject
// @desc    Refuser une commande
// @access  Private (Professional only)
router.post('/reject', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { messageId, clientId, reason } = req.body;

    console.log("Données reçues (refus):", { messageId, clientId, reason, userId: req.user._id });

    if (!messageId || !clientId) {
      console.log("Données manquantes (refus):", { messageId, clientId });
      return res.status(400).json({
        success: false,
        message: 'Données de commande incomplètes'
      });
    }

    // Vérifier que le message existe
    const message = await Message.findById(messageId);
    if (!message) {
      console.log("Message non trouvé (refus):", messageId);
      return res.status(404).json({
        success: false,
        message: 'Message de commande non trouvé'
      });
    }

    console.log("Message trouvé (refus):", {
      messageId: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      userId: req.user._id
    });

    // Vérifier que le professionnel est bien le destinataire du message
    const messageReceiverId = message.receiverId.toString();
    const userIdString = req.user._id.toString();
    
    console.log("Comparaison des IDs (refus):", {
      messageReceiverId,
      userIdString,
      match: messageReceiverId === userIdString
    });

    if (messageReceiverId !== userIdString) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à traiter cette commande'
      });
    }

    // Marquer le message comme traité et refusé
    message.orderProcessed = true;
    message.orderRejected = true;
    message.rejectionReason = reason || 'Stock insuffisant ou produit indisponible';
    
    await message.save();
    console.log("Message marqué comme refusé");
    
    return res.json({
      success: true,
      message: 'Commande refusée',
      reason: reason || 'Stock insuffisant ou produit indisponible'
    });
  } catch (error) {
    console.error('Erreur lors du refus de la commande:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du traitement de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/by-product/:productId
// @desc    Récupérer toutes les commandes contenant un produit spécifique
// @access  Private (Professional only)
router.get('/by-product/:productId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID de produit requis'
      });
    }

    // Vérifier que le professionnel a accès à ce produit
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Vérifier que le produit appartient au professionnel
    const product = await Product.findOne({
      _id: productId,
      professionalId: professional._id
    });

    if (!product) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à ce produit'
      });
    }

    // Rechercher les commandes qui contiennent ce produit
    const Order = mongoose.model('Order');
    const orders = await Order.find({
      'items.product': productId,
      professionalId: professional._id
    })
    .populate('clientId', 'firstName lastName email')
    .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes par produit:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Récupérer les détails d'une commande spécifique
// @access  Private (Professional only)
router.get('/:orderId', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID de commande requis'
      });
    }

    // Vérifier que le professionnel a accès à cette commande
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Rechercher la commande
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: orderId,
      professionalId: professional._id
    })
    .populate('clientId', 'firstName lastName email phone')
    .populate('items.product', 'title name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des détails de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/:orderId/status
// @desc    Mettre à jour le statut d'une commande
// @access  Private (Professional only)
router.put('/:orderId/status', isAuthenticated, isProfessional, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, returnToStock, cancellationMessage } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'ID de commande et statut requis'
      });
    }

    // Vérifier que le statut est valide
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Vérifier que le professionnel a accès à cette commande
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Rechercher la commande
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: orderId,
      professionalId: professional._id
    }).populate('items.product clientId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Si on annule la commande et qu'on veut retourner les produits au stock
    if (status === 'cancelled' && returnToStock) {
      // Pour chaque produit dans la commande
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product._id);
          
          if (product) {
            // Retourner la quantité au stock général
            product.stock += item.quantity;
            
            // Si le produit a des tailles spécifiques
            if (item.size && product.sizeInventory && product.sizeInventory.length > 0) {
              const sizeItem = product.sizeInventory.find(s => s.size === item.size);
              if (sizeItem) {
                sizeItem.stock += item.quantity;
              }
            }
            
            await product.save();
            console.log(`Stock returned for product ${product._id}: +${item.quantity}`);
          }
        }
      }
      
      // Envoyer une notification au client si un message d'annulation est fourni
      if (cancellationMessage && order.clientId) {
        const Notification = mongoose.model('Notification');
        
        const newNotification = new Notification({
          userId: order.clientId._id,
          title: 'Commande annulée',
          message: cancellationMessage,
          type: 'order_cancelled',
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber
          },
          read: false
        });
        
        await newNotification.save();
        console.log(`Notification sent to client ${order.clientId._id}`);
      }
    }

    // Mettre à jour le statut
    order.status = status;
    
    // Mettre à jour les dates en fonction du statut
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    } else if (status === 'shipped') {
      order.shippedAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
      
      // Ajouter le message d'annulation aux notes si fourni
      if (cancellationMessage) {
        order.notes = order.notes 
          ? `${order.notes}\n\nMotif d'annulation: ${cancellationMessage}` 
          : `Motif d'annulation: ${cancellationMessage}`;
      }
    }

    await order.save();

    // Envoyer les notifications de changement de statut
    try {
      const NotificationService = require('../services/notificationService');
      
      // Notification pour le client
      await NotificationService.notifyClientOrderStatusChange(order, status);
      
      // Notification pour le professionnel (si nécessaire)
      if (status === 'delivered' || status === 'cancelled') {
        await NotificationService.notifyOrderStatusChange(order, status, professional._id);
      }
    } catch (error) {
      console.error('Erreur lors des notifications de changement de statut:', error);
    }

    return res.json({
      success: true,
      message: 'Statut de la commande mis à jour',
      order
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 