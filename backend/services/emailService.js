const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const Settings = require('../models/Settings');

// Create email transporter using dynamic settings
const createTransporter = async () => {
  try {
    const settingsDoc = await Settings.getSettings();
    const emailSettings = settingsDoc.settings.email;
    
    // Check if email credentials are configured
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword) {
      // Fallback to environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email credentials not configured in settings or environment. Email sending will be skipped.');
        return null;
      }
      
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
    }

    // Use settings from database
    return nodemailer.createTransporter({
      host: emailSettings.smtpHost,
      port: parseInt(emailSettings.smtpPort),
      secure: emailSettings.smtpSecure, // true for 465, false for other ports
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Get email settings for from address and name
const getEmailSettings = async () => {
  try {
    const settingsDoc = await Settings.getSettings();
    return {
      fromName: settingsDoc.settings.email.emailFromName,
      fromAddress: settingsDoc.settings.email.emailFromAddress,
      siteName: settingsDoc.settings.general.siteName
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    return {
      fromName: 'Holistic.ma',
      fromAddress: 'noreply@holistic.ma',
      siteName: 'Holistic.ma'
    };
  }
};

// Send booking confirmation to client
const sendBookingConfirmationToClient = async (booking, client, professional) => {
  try {
    const transporter = await createTransporter();
    const emailSettings = await getEmailSettings();
    
    // Skip email sending if transporter is not configured
    if (!transporter) {
      console.log('Email service not configured. Skipping booking confirmation email to client.');
      return false;
    }
    
    const statusText = booking.status === 'confirmed' 
      ? 'confirmée' 
      : 'en attente de confirmation';
    
    const paymentText = booking.paymentStatus === 'paid' 
      ? 'Payée' 
      : 'En attente de paiement';
    
    const formattedDate = format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr });
    
    const mailOptions = {
      from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      to: client.email,
      subject: `Confirmation de réservation - ${professional.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5a87;">Réservation ${statusText}</h2>
          <p>Bonjour ${client.firstName || client.name || client.email},</p>
          <p>Nous vous confirmons votre réservation chez <strong>${professional.businessName}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5a87;">${booking.service.name}</h3>
            <p>${booking.service.description || ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Date :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Heure :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.appointmentTime.start} - ${booking.appointmentTime.end}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Durée :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.service.duration} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Lieu :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                  ${booking.location.type === 'online' 
                    ? 'Session en ligne' + (booking.location.onlineLink ? ` (lien: ${booking.location.onlineLink})` : '') 
                    : `${booking.location.address?.street || ''}, ${booking.location.address?.city || ''}`}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Prix :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.totalAmount.amount} ${booking.totalAmount.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Statut du paiement :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${paymentText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Numéro de réservation :</strong></td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
            </table>
          </div>
          
          ${booking.status === 'pending' ? `
            <p><strong>Note :</strong> Votre réservation est en attente de confirmation par le professionnel. 
            Vous recevrez un email dès que votre réservation sera confirmée.</p>
          ` : ''}
          
          <p>Pour toute question ou pour modifier votre réservation, vous pouvez contacter directement 
          ${professional.businessName} au ${professional.contactInfo?.phone || 'numéro indiqué sur son profil'} 
          ou répondre à cet email.</p>
          
          <p>Vous pouvez également consulter et gérer vos réservations depuis votre espace client.</p>
          
          <p>Cordialement,<br/>L'équipe ${emailSettings.siteName}</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to client: ${client.email}`);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email to client:', error);
    return false;
  }
};

// Send booking notification to professional
const sendBookingNotificationToProfessional = async (booking, client, professional) => {
  try {
    const transporter = await createTransporter();
    const emailSettings = await getEmailSettings();
    
    // Skip email sending if transporter is not configured
    if (!transporter) {
      console.log('Email service not configured. Skipping booking notification email to professional.');
      return false;
    }
    
    const formattedDate = format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr });
    
    const mailOptions = {
      from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      to: professional.contactInfo.email,
      subject: `Nouvelle réservation - ${booking.service.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5a87;">Nouvelle réservation</h2>
          <p>Bonjour ${professional.businessName},</p>
          <p>Vous avez reçu une nouvelle réservation de la part de <strong>${client.firstName || client.name || client.email}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5a87;">${booking.service.name}</h3>
            <p>${booking.service.description || ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Client :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${client.firstName || ''} ${client.lastName || ''} (${client.email})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Date :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Heure :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.appointmentTime.start} - ${booking.appointmentTime.end}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Prix :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.totalAmount.amount} ${booking.totalAmount.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Statut du paiement :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                  ${booking.paymentStatus === 'paid' ? 'Payée' : 'En attente de paiement'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Numéro de réservation :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.bookingNumber}</td>
              </tr>
              ${booking.clientNotes ? `
              <tr>
                <td style="padding: 8px 0; vertical-align: top;"><strong>Notes du client :</strong></td>
                <td style="padding: 8px 0;">${booking.clientNotes}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${booking.status === 'pending' ? `
            <p><strong>Action requise :</strong> Cette réservation est en attente de votre confirmation. 
            Veuillez vous connecter à votre espace professionnel pour l'accepter ou la refuser.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/professional/sessions" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                 Accéder à mon espace
              </a>
            </div>
          ` : `
            <p>Cette réservation a été automatiquement confirmée selon vos paramètres.</p>
          `}
          
          <p>Cordialement,<br/>L'équipe Holistic.ma</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Booking notification email sent to professional: ${professional.contactInfo.email}`);
    return true;
  } catch (error) {
    console.error('Error sending booking notification email to professional:', error);
    return false;
  }
};

// Send booking status update to client
const sendBookingStatusUpdateToClient = async (booking, client, professional, status) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is not configured
    if (!transporter) {
      console.log('Email service not configured. Skipping booking status update email to client.');
      return false;
    }

    let statusText = '';
    let statusColor = '';
    let additionalText = '';
    
    switch (status) {
      case 'confirmed':
        statusText = 'confirmée';
        statusColor = '#28a745';
        additionalText = 'Votre réservation a été confirmée par le professionnel.';
        break;
      case 'cancelled':
        statusText = 'annulée';
        statusColor = '#dc3545';
        additionalText = 'Votre réservation a été annulée.';
        break;
      default:
        statusText = status;
        statusColor = '#6c757d';
    }
    
    const formattedDate = format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Réservation ${statusText} - ${professional.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Réservation ${statusText}</h2>
          <p>Bonjour ${client.firstName || client.name || client.email},</p>
          <p>${additionalText}</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5a87;">${booking.service.name}</h3>
            <p>${booking.service.description || ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Date :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Heure :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.appointmentTime.start} - ${booking.appointmentTime.end}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Professionnel :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${professional.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Numéro de réservation :</strong></td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
            </table>
          </div>
          
          <p>Pour toute question, vous pouvez contacter directement 
          ${professional.businessName} au ${professional.contactInfo?.phone || 'numéro indiqué sur son profil'} 
          ou répondre à cet email.</p>
          
          <p>Cordialement,<br/>L'équipe Holistic.ma</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Booking status update email sent to client: ${client.email}`);
    return true;
  } catch (error) {
    console.error('Error sending booking status update email to client:', error);
    return false;
  }
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (booking, client, professional) => {
  try {
    const transporter = createTransporter();
    
    // Skip email sending if transporter is not configured
    if (!transporter) {
      console.log('Email service not configured. Skipping payment confirmation email.');
      return false;
    }

    const formattedDate = format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Confirmation de paiement - ${professional.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Paiement confirmé</h2>
          <p>Bonjour ${client.firstName || client.name || client.email},</p>
          <p>Nous vous confirmons que votre paiement pour la réservation suivante a bien été reçu :</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2d5a87;">${booking.service.name}</h3>
            <p>${booking.service.description || ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Date :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Heure :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.appointmentTime.start} - ${booking.appointmentTime.end}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Professionnel :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${professional.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Montant payé :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${booking.totalAmount.amount} ${booking.totalAmount.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Méthode de paiement :</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${
                  booking.paymentMethod === 'credit_card' ? 'Carte de crédit' :
                  booking.paymentMethod === 'mobile_payment' ? 'Paiement mobile' :
                  booking.paymentMethod === 'online' ? 'Paiement en ligne' : 'Non spécifié'
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Numéro de réservation :</strong></td>
                <td style="padding: 8px 0;">${booking.bookingNumber}</td>
              </tr>
            </table>
          </div>
          
          <p>Votre réservation est maintenant confirmée. Vous pouvez consulter les détails de votre réservation depuis votre espace client.</p>
          
          <p>Cordialement,<br/>L'équipe Holistic.ma</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to client: ${client.email}`);
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email to client:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmationToClient,
  sendBookingNotificationToProfessional,
  sendBookingStatusUpdateToClient,
  sendPaymentConfirmationEmail
}; 