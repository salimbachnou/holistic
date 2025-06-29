const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const router = express.Router();

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
  body('activityType').isIn([
    'yoga', 'meditation', 'naturopathy', 'massage', 'acupuncture',
    'osteopathy', 'chiropractic', 'nutrition', 'psychology', 'coaching',
    'reiki', 'aromatherapy', 'reflexology', 'ayurveda', 'hypnotherapy',
    'sophrology', 'spa', 'beauty', 'wellness', 'fitness', 'therapist',
    'nutritionist', 'other'
  ]).withMessage('Valid activity type is required'),
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
router.get('/activity-types', (req, res) => {
  const activityTypes = [
    { value: 'yoga', label: 'Yoga' },
    { value: 'meditation', label: 'Méditation' },
    { value: 'naturopathy', label: 'Naturopathie' },
    { value: 'massage', label: 'Massage' },
    { value: 'acupuncture', label: 'Acupuncture' },
    { value: 'osteopathy', label: 'Ostéopathie' },
    { value: 'chiropractic', label: 'Chiropractie' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'psychology', label: 'Psychologie' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'reiki', label: 'Reiki' },
    { value: 'aromatherapy', label: 'Aromathérapie' },
    { value: 'reflexology', label: 'Réflexologie' },
    { value: 'ayurveda', label: 'Ayurveda' },
    { value: 'hypnotherapy', label: 'Hypnothérapie' },
    { value: 'sophrology', label: 'Sophrologie' },
    { value: 'spa', label: 'Spa' },
    { value: 'beauty', label: 'Beauté' },
    { value: 'wellness', label: 'Bien-être' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'therapist', label: 'Thérapeute' },
    { value: 'nutritionist', label: 'Nutritionniste' },
    { value: 'other', label: 'Autre' }
  ];

  res.json({
    success: true,
    activityTypes
  });
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

module.exports = router; 