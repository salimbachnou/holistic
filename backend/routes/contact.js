const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Validation middleware for professional account request
const validateProfessionalRequest = [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('businessCreationDate').isISO8601().withMessage('Valid date is required'),
  body('activityType').notEmpty().withMessage('Valid activity type is required'),
  body('selectedPlan').isIn(['basic', 'premium', 'enterprise']).withMessage('Valid plan is required')
];

// Validation middleware for information request
const validateInformationRequest = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
];

// Professional account request
router.post('/professional-request', validateProfessionalRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      businessName,
      email,
      phone,
      businessCreationDate,
      activityType,
      selectedPlan
    } = req.body;

    // Check if a request already exists for this email
    const existingRequest = await Contact.findOne({
      email: email.toLowerCase(),
      type: 'professional',
      status: { $in: ['pending', 'in_progress'] }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'A professional account request already exists for this email'
      });
    }

    // Create new contact request
    const contactRequest = new Contact({
      type: 'professional',
      email: email.toLowerCase(),
      businessName,
      phone,
      businessCreationDate: new Date(businessCreationDate),
      activityType,
      selectedPlan,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await contactRequest.save();

    // Send confirmation email to user
    try {
      const transporter = createEmailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Demande de compte professionnel reçue - Holistic.ma',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d5a87;">Merci pour votre demande !</h2>
            <p>Bonjour,</p>
            <p>Nous avons bien reçu votre demande de création de compte professionnel pour <strong>${businessName}</strong>.</p>
            <p><strong>Détails de votre demande :</strong></p>
            <ul>
              <li>Entité : ${businessName}</li>
              <li>Type d'activité : ${activityType}</li>
              <li>Formule choisie : ${selectedPlan}</li>
              <li>Email : ${email}</li>
              <li>Téléphone : ${phone}</li>
            </ul>
            <p>Notre équipe va examiner votre demande et vous contacter sous 48 heures.</p>
            <p>Cordialement,<br/>L'équipe Holistic.ma</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Professional account request submitted successfully',
      requestId: contactRequest._id
    });

  } catch (error) {
    console.error('Error creating professional request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Information request
router.post('/information-request', validateInformationRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      message
    } = req.body;

    // Create new contact request
    const contactRequest = new Contact({
      type: 'information_request',
      email: email.toLowerCase(),
      firstName,
      lastName,
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await contactRequest.save();

    // Send confirmation email to user
    try {
      const transporter = createEmailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Demande d\'information reçue - Holistic.ma',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d5a87;">Merci pour votre message !</h2>
            <p>Bonjour ${firstName},</p>
            <p>Nous avons bien reçu votre demande d'information.</p>
            <p><strong>Votre message :</strong></p>
            <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2d5a87; margin: 15px 0;">
              ${message}
            </blockquote>
            <p>Notre équipe va examiner votre demande et vous contacter sous 24 heures.</p>
            <p>Cordialement,<br/>L'équipe Holistic.ma</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Information request submitted successfully',
      requestId: contactRequest._id
    });

  } catch (error) {
    console.error('Error creating information request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get activity types for dropdown
router.get('/activity-types', async (req, res) => {
  try {
    const ActivityType = require('../models/ActivityType');
    const activityTypes = await ActivityType.getForDropdown();
    
    res.json({
      success: true,
      activityTypes
    });
  } catch (error) {
    console.error('Error fetching activity types:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types d\'activité'
    });
  }
});

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      value: 'basic',
      label: 'Basique',
      description: 'Fonctionnalités essentielles pour débuter',
      price: '99 MAD/mois'
    },
    {
      value: 'premium',
      label: 'Premium',
      description: 'Outils avancés pour développer votre activité',
      price: '199 MAD/mois'
    },
    {
      value: 'enterprise',
      label: 'Entreprise',
      description: 'Solution complète pour les professionnels établis',
      price: '299 MAD/mois'
    }
  ];

  res.json({
    success: true,
    plans
  });
});

// General contact form
router.post('/', [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email valide requis'),
  body('subject').notEmpty().withMessage('Le sujet est requis'),
  body('message').isLength({ min: 10, max: 1000 }).withMessage('Le message doit contenir entre 10 et 1000 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(error => ({
          path: error.path,
          msg: error.msg,
          value: error.value
        }))
      });
    }

    const {
      firstName,
      lastName,
      email,
      subject,
      message,
      phone
    } = req.body;

    // Create new contact request
    const contactRequest = new Contact({
      type: 'general_contact',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone ? phone.trim() : undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await contactRequest.save();

    // Send confirmation email to user if SMTP is configured
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = createEmailTransporter();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Message reçu - Holistic.ma',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d5a87;">Merci pour votre message !</h2>
              <p>Bonjour ${firstName},</p>
              <p>Nous avons bien reçu votre message concernant "${subject}".</p>
              <p><strong>Votre message :</strong></p>
              <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2d5a87; margin: 15px 0;">
                ${message}
              </blockquote>
              <p>Notre équipe va examiner votre message et vous contacter sous 24 heures.</p>
              <p>Cordialement,<br/>L'équipe Holistic.ma</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue execution even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      requestId: contactRequest._id
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        path: key,
        msg: error.errors[key].message,
        value: error.errors[key].value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Get user's contact responses
router.get('/responses', isAuthenticated, async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    
    // Find all contacts for this user by email
    const contacts = await Contact.find({ 
      email: req.user.email 
    }).populate('responses.adminId', 'firstName lastName');
    
    // Filter contacts that have responses
    const contactsWithResponses = contacts.filter(contact => 
      contact.responses && contact.responses.length > 0
    );
    
    res.json({
      success: true,
      contacts: contactsWithResponses
    });
  } catch (error) {
    console.error('Get contact responses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des réponses' 
    });
  }
});

// Get single contact with responses
router.get('/responses/:contactId', isAuthenticated, async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    
    const contact = await Contact.findById(req.params.contactId)
      .populate('responses.adminId', 'firstName lastName');
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact non trouvé' 
      });
    }
    
    // Check if this contact belongs to the user
    if (contact.email !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact response error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la réponse' 
    });
  }
});

// ===================== CONTACT MANAGEMENT =====================

module.exports = router; 