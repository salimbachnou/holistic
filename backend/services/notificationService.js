const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Professional = require('../models/Professional');

/**
 * Service de notifications pour les professionnels
 */
class NotificationService {
  
  /**
   * Créer une notification pour un professionnel
   */
  static async createNotification(professionalId, title, message, type, link = null, data = {}) {
    try {
      // Trouver le professionnel pour obtenir son userId
      const professional = await Professional.findById(professionalId);
      if (!professional) {
        console.error('Professional not found:', professionalId);
        return null;
      }

      const notification = new Notification({
        userId: professional.userId,
        title,
        message,
        type,
        link,
        data,
        read: false
      });

      await notification.save();
      console.log(`Notification créée pour le professionnel ${professionalId}: ${title}`);
      
      // Émettre la notification via Socket.io si disponible
      const io = global.io;
      if (io) {
        io.to(`user-${professional.userId}`).emit('receive-notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return null;
    }
  }

  /**
   * Notifier d'une nouvelle commande
   */
  static async notifyNewOrder(order) {
    try {
      // Vérifier si clientId est peuplé ou juste un ID
      let clientName = 'Client';
      if (order.clientId) {
        if (typeof order.clientId === 'object' && order.clientId.firstName) {
          // clientId est déjà peuplé
          clientName = `${order.clientId.firstName} ${order.clientId.lastName}`;
        } else {
          // clientId est juste un ID, récupérer les données
          try {
            const mongoose = require('mongoose');
            const User = mongoose.model('User');
            const client = await User.findById(order.clientId);
            if (client) {
              clientName = `${client.firstName} ${client.lastName}`;
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données client:', error);
          }
        }
      }

      // Trouver tous les professionnels concernés par cette commande
      const professionalIds = [...new Set(order.items.map(item => item.professional).filter(Boolean))];
      
      for (const professionalId of professionalIds) {
        // Calculer le montant total pour ce professionnel
        const professionalItems = order.items.filter(item => 
          item.professional && item.professional.toString() === professionalId.toString()
        );
        
        const totalAmount = professionalItems.reduce((sum, item) => 
          sum + (item.price.amount * item.quantity), 0
        );

        // Récupérer les noms des produits
        let productNames = 'Produit(s)';
        try {
          const mongoose = require('mongoose');
          const Product = mongoose.model('Product');
          const productIds = professionalItems.map(item => item.product);
          const products = await Product.find({ _id: { $in: productIds } }).select('title name');
          productNames = products.map(product => product.title || product.name || 'Produit').join(', ');
        } catch (error) {
          console.error('Erreur lors de la récupération des noms de produits:', error);
        }

        await this.createNotification(
          professionalId,
          'Nouvelle commande',
          `Commande #${order.orderNumber} - ${productNames} (${totalAmount} MAD)`,
          'new_order',
          '/dashboard/professional/orders',
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            clientName: clientName,
            totalAmount,
            itemsCount: professionalItems.length
          }
        );
      }
    } catch (error) {
      console.error('Erreur lors de la notification de nouvelle commande:', error);
    }
  }

  /**
   * Notifier d'une nouvelle réservation
   */
  static async notifyNewBooking(booking) {
    try {
      if (!booking.professional) {
        console.log('Pas de professionnel associé à cette réservation');
        return;
      }

      const formattedDate = new Date(booking.appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = booking.appointmentTime?.start || 'Heure à définir';

      await this.createNotification(
        booking.professional,
        'Nouvelle réservation',
        `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''} - ${formattedDate} à ${formattedTime}`,
        'appointment_scheduled',
        '/dashboard/professional/sessions',
        {
          bookingId: booking._id,
          clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Client',
          appointmentDate: booking.appointmentDate,
          appointmentTime: formattedTime,
          serviceName: booking.service?.name || 'Service',
          location: booking.location
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de nouvelle réservation:', error);
    }
  }

  /**
   * Notifier d'une réservation annulée
   */
  static async notifyBookingCancelled(booking) {
    try {
      if (!booking.professional) {
        console.log('Pas de professionnel associé à cette réservation');
        return;
      }

      const formattedDate = new Date(booking.appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await this.createNotification(
        booking.professional,
        'Réservation annulée',
        `${booking.client?.firstName || 'Client'} ${booking.client?.lastName || ''} - ${formattedDate}`,
        'appointment_cancelled',
        '/dashboard/professional/sessions',
        {
          bookingId: booking._id,
          clientName: booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Client',
          appointmentDate: booking.appointmentDate,
          reason: booking.cancellationReason || 'Raison non spécifiée'
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification d\'annulation:', error);
    }
  }

  /**
   * Notifier d'un nouveau paiement
   */
  static async notifyPaymentReceived(payment, professionalId) {
    try {
      await this.createNotification(
        professionalId,
        'Paiement reçu',
        `Paiement de ${payment.amount} ${payment.currency} reçu`,
        'payment_received',
        '/dashboard/professional/sessions',
        {
          paymentId: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          clientName: payment.clientName || 'Client'
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de paiement:', error);
    }
  }

  /**
   * Notifier d'un nouveau message
   */
  static async notifyNewMessage(message, professionalId) {
    try {
      await this.createNotification(
        professionalId,
        'Nouveau message',
        `Message de ${message.senderName || 'Client'}: ${message.text.substring(0, 50)}...`,
        'message',
        '/dashboard/professional/messages',
        {
          messageId: message._id,
          senderName: message.senderName,
          senderId: message.senderId,
          preview: message.text.substring(0, 100)
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de message:', error);
    }
  }

  /**
   * Notifier d'un nouvel événement (si créé par admin pour le professionnel)
   */
  static async notifyNewEvent(event, professionalId) {
    try {
      const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await this.createNotification(
        professionalId,
        'Nouvel événement',
        `${event.title} - ${formattedDate}`,
        'new_event',
        '/dashboard/professional/events',
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification d\'événement:', error);
    }
  }

  /**
   * Notifier d'un nouveau client
   */
  static async notifyNewClient(client, professionalId) {
    try {
      await this.createNotification(
        professionalId,
        'Nouveau client',
        `${client.firstName} ${client.lastName} a rejoint votre liste de clients`,
        'new_client',
        '/dashboard/professional/clients',
        {
          clientId: client._id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de nouveau client:', error);
    }
  }

  /**
   * Notifier du changement de statut d'une commande
   */
  static async notifyOrderStatusChange(order, newStatus, professionalId) {
    try {
      const statusMessages = {
        'pending': 'en attente',
        'confirmed': 'confirmée',
        'shipped': 'expédiée',
        'delivered': 'livrée',
        'cancelled': 'annulée'
      };

      const statusMessage = statusMessages[newStatus] || newStatus;

      await this.createNotification(
        professionalId,
        `Commande ${statusMessage}`,
        `Commande #${order.orderNumber} est maintenant ${statusMessage}`,
        `order_${newStatus}`,
        '/dashboard/professional/orders',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          newStatus: newStatus,
          clientName: order.clientId ? `${order.clientId.firstName} ${order.clientId.lastName}` : 'Client'
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de changement de statut:', error);
    }
  }

  /**
   * Créer une notification pour un client
   */
  static async createClientNotification(clientId, title, message, type, link = null, data = {}) {
    try {
      const notification = new Notification({
        userId: clientId,
        title,
        message,
        type,
        link,
        data,
        read: false
      });

      await notification.save();
      console.log(`Notification créée pour le client ${clientId}: ${title}`);
      
      // Émettre la notification via Socket.io si disponible
      const io = global.io;
      if (io) {
        io.to(`user-${clientId}`).emit('receive-notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification client:', error);
      return null;
    }
  }

  /**
   * Notifier un client d'une nouvelle commande
   */
  static async notifyClientOrderPlaced(order) {
    try {
      if (!order.clientId) {
        console.log('Pas de client associé à cette commande');
        return;
      }

      // Vérifier si clientId est peuplé ou juste un ID
      let clientId = order.clientId;
      if (typeof order.clientId === 'object') {
        clientId = order.clientId._id;
      }

      const totalAmount = order.totalAmount.amount;
      const itemsCount = order.items.length;

      // Récupérer les noms des produits
      let productNames = 'Produit(s)';
      try {
        const mongoose = require('mongoose');
        const Product = mongoose.model('Product');
        const productIds = order.items.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).select('title name');
        productNames = products.map(product => product.title || product.name || 'Produit').join(', ');
      } catch (error) {
        console.error('Erreur lors de la récupération des noms de produits:', error);
      }

      await this.createClientNotification(
        clientId,
        'Commande confirmée',
        `Votre commande #${order.orderNumber} a été confirmée - ${productNames} (${totalAmount} MAD)`,
        'order_placed',
        '/orders',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount,
          itemsCount,
          productNames
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de commande client:', error);
    }
  }

  /**
   * Notifier un client du changement de statut de sa commande
   */
  static async notifyClientOrderStatusChange(order, newStatus) {
    try {
      if (!order.clientId) {
        console.log('Pas de client associé à cette commande');
        return;
      }

      // Vérifier si clientId est peuplé ou juste un ID
      let clientId = order.clientId;
      if (typeof order.clientId === 'object') {
        clientId = order.clientId._id;
      }

      const statusMessages = {
        'pending': 'en attente',
        'processing': 'en cours de traitement',
        'shipped': 'expédiée',
        'delivered': 'livrée',
        'cancelled': 'annulée'
      };

      const statusTitles = {
        'pending': 'Commande en attente',
        'processing': 'Commande en cours',
        'shipped': 'Commande expédiée',
        'delivered': 'Commande livrée',
        'cancelled': 'Commande annulée'
      };

      const statusMessage = statusMessages[newStatus] || newStatus;
      const statusTitle = statusTitles[newStatus] || `Commande ${newStatus}`;

      // Pour les commandes livrées, inclure un lien vers la notation
      let link = '/orders';
      let additionalData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: newStatus
      };

      if (newStatus === 'delivered') {
        link = `/orders/${order._id}/review`;
        additionalData.canReview = true;
        additionalData.products = order.items.map(item => ({
          id: item.product._id || item.product,
          title: item.product?.title || item.product?.name || 'Produit'
        }));
      }

      await this.createClientNotification(
        clientId,
        statusTitle,
        newStatus === 'delivered' 
          ? `Votre commande #${order.orderNumber} a été livrée ! N'oubliez pas de laisser votre avis sur les produits reçus.`
          : `Votre commande #${order.orderNumber} est maintenant ${statusMessage}`,
        `order_${newStatus}`,
        link,
        additionalData
      );
    } catch (error) {
      console.error('Erreur lors de la notification de changement de statut client:', error);
    }
  }

  /**
   * Notifier un client d'une réservation confirmée
   */
  static async notifyClientBookingConfirmed(booking) {
    try {
      if (!booking.client) {
        console.log('Pas de client associé à cette réservation');
        return;
      }

      // Vérifier si client est peuplé ou juste un ID
      let clientId = booking.client;
      if (typeof booking.client === 'object') {
        clientId = booking.client._id;
      }

      const formattedDate = new Date(booking.appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = booking.appointmentTime?.start || 'Heure à définir';

      // Récupérer le nom du professionnel
      let professionalName = 'Professionnel';
      try {
        const Professional = require('../models/Professional');
        const professional = await Professional.findById(booking.professional);
        if (professional) {
          professionalName = professional.businessName || professional.name || 'Professionnel';
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du nom du professionnel:', error);
      }

      await this.createClientNotification(
        clientId,
        'Rendez-vous confirmé',
        `Votre rendez-vous avec ${professionalName} est confirmé pour le ${formattedDate} à ${formattedTime}`,
        'appointment_scheduled',
        '/bookings',
        {
          bookingId: booking._id,
          professionalName,
          appointmentDate: booking.appointmentDate,
          appointmentTime: formattedTime,
          serviceName: booking.service?.name || 'Service'
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification de réservation confirmée:', error);
    }
  }

  /**
   * Notifier un client qu'il peut laisser un avis sur une session
   */
  static async notifySessionReviewRequest(booking, session, professional) {
    try {
      if (!booking.client) {
        console.log('Pas de client associé à cette réservation');
        return;
      }

      // Vérifier si client est peuplé ou juste un ID
      let clientId = booking.client;
      if (typeof booking.client === 'object') {
        clientId = booking.client._id;
      }

      const formattedDate = new Date(session.startTime).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await this.createClientNotification(
        clientId,
        'Votre session est terminée !',
        `Comment s'est passée votre session "${session.title}" du ${formattedDate} ? Partagez votre expérience avec d'autres clients.`,
        'session_review_request',
        `/sessions/${session._id}/review`,
        {
          sessionId: session._id,
          sessionTitle: session.title,
          sessionDate: session.startTime,
          professionalName: professional.businessName || 'Professionnel',
          professionalId: professional._id,
          bookingId: booking._id,
          canReview: true
        }
      );

      console.log(`Review request notification sent to client ${clientId} for session ${session._id}`);
    } catch (error) {
      console.error('Erreur lors de la notification de demande d\'avis:', error);
    }
  }

  /**
   * Envoyer un rappel pour laisser un avis sur une session
   */
  static async notifySessionReviewReminder(booking, professional) {
    try {
      if (!booking.client) {
        console.log('Pas de client associé à cette réservation');
        return;
      }

      // Vérifier si client est peuplé ou juste un ID
      let clientId = booking.client;
      if (typeof booking.client === 'object') {
        clientId = booking.client._id;
      }

      const sessionTitle = booking.service?.sessionId?.title || booking.service?.name || 'Session';

      await this.createClientNotification(
        clientId,
        'N\'oubliez pas votre avis !',
        `Vous avez participé à "${sessionTitle}". Votre avis peut aider d'autres clients à découvrir cette expérience.`,
        'session_review_reminder',
        `/sessions/${booking.service.sessionId}/review`,
        {
          sessionId: booking.service.sessionId,
          sessionTitle: sessionTitle,
          professionalName: professional.businessName || 'Professionnel',
          professionalId: professional._id,
          bookingId: booking._id,
          isReminder: true
        }
      );

      console.log(`Review reminder sent to client ${clientId} for session ${booking.service.sessionId}`);
    } catch (error) {
      console.error('Erreur lors du rappel d\'avis:', error);
    }
  }

  /**
   * Notifier un professionnel qu'il a reçu un nouvel avis
   */
  static async notifyProfessionalNewReview(review, session) {
    try {
      const formattedDate = new Date(review.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const stars = '⭐'.repeat(review.rating);
      const clientName = review.clientId ? 
        (typeof review.clientId === 'object' ? 
          `${review.clientId.firstName} ${review.clientId.lastName}` : 
          'Client') : 
        'Client';

      await this.createNotification(
        review.professionalId,
        'Nouvel avis reçu !',
        `${clientName} a laissé un avis ${stars} sur "${session?.title || review.contentTitle}" - ${formattedDate}`,
        'new_review',
        '/dashboard/professional/reviews',
        {
          reviewId: review._id,
          sessionId: session?._id,
          sessionTitle: session?.title || review.contentTitle,
          clientName: clientName,
          rating: review.rating,
          comment: review.comment?.substring(0, 100),
          reviewDate: review.createdAt
        }
      );

      console.log(`New review notification sent to professional ${review.professionalId}`);
    } catch (error) {
      console.error('Erreur lors de la notification de nouvel avis:', error);
    }
  }

  /**
   * Notifier un client d'une réservation annulée
   */
  static async notifyClientBookingCancelled(booking, reason = null) {
    try {
      if (!booking.client) {
        console.log('Pas de client associé à cette réservation');
        return;
      }

      // Vérifier si client est peuplé ou juste un ID
      let clientId = booking.client;
      if (typeof booking.client === 'object') {
        clientId = booking.client._id;
      }

      const formattedDate = new Date(booking.appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Récupérer le nom du professionnel
      let professionalName = 'Professionnel';
      try {
        const Professional = require('../models/Professional');
        const professional = await Professional.findById(booking.professional);
        if (professional) {
          professionalName = professional.businessName || professional.name || 'Professionnel';
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du nom du professionnel:', error);
      }

      const message = reason 
        ? `Votre rendez-vous avec ${professionalName} du ${formattedDate} a été annulé. Raison: ${reason}`
        : `Votre rendez-vous avec ${professionalName} du ${formattedDate} a été annulé.`;

      await this.createClientNotification(
        clientId,
        'Rendez-vous annulé',
        message,
        'appointment_cancelled',
        '/bookings',
        {
          bookingId: booking._id,
          professionalName,
          appointmentDate: booking.appointmentDate,
          reason: reason || 'Raison non spécifiée'
        }
      );
    } catch (error) {
      console.error('Erreur lors de la notification d\'annulation client:', error);
    }
  }
}

module.exports = NotificationService; 