const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility function to convert relative image paths to absolute URLs
const convertImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return imagePath.startsWith('/uploads') ? `${baseUrl}${imagePath}` : `${baseUrl}/uploads/profiles/${imagePath}`;
};

// Utility function to format user data with converted image URLs
const formatUserData = (user) => {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    profileImage: convertImageUrl(user.profileImage),
    provider: user.provider,
    phone: user.phone,
    address: user.address,
    birthDate: user.birthDate
  };
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Email/Password Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user by email (including admin users)
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // Determine if this is an admin login
    if (user.role === 'admin') {
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isAdmin: true
        },
        redirectTo: '/admin/dashboard'
      });
    }

    res.json({
      success: true,
      token,
      user: formatUserData(user),
      redirectTo: user.role === 'professional' ? '/dashboard/professional' : '/dashboard'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      phone,
      role: 'client', // Default role
      provider: 'local',
      isVerified: true // Définir l'utilisateur comme vérifié
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Register professional endpoint
router.post('/register/professional', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('profession').notEmpty().trim(),
  body('phone').optional().trim(),
  body('businessName').optional().trim(),
  body('businessType').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, password, firstName, lastName, profession, 
      specializations, phone, name, businessName, businessType, address 
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      name,
      phone,
      role: 'professional', // Professional role
      provider: 'local',
      isVerified: true // Définir l'utilisateur professionnel comme vérifié
    });

    await user.save();

    // Create professional profile
    const Professional = require('../models/Professional');
    const professional = new Professional({
      userId: user._id,
      businessType: businessType || profession,
      businessName: businessName || '',
      title: businessName || profession,
      address: address || '',
      specializations: specializations ? specializations.split(',').map(s => s.trim()) : [],
      contactInfo: { 
        phone: phone || '',
        email: email
      },
      isVerified: true, // Définir le profil professionnel comme vérifié
      isActive: true
    });

    await professional.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Professional registration error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Google OAuth routes
router.get('/google/url', (req, res) => {
  try {
    const isProfessional = req.query.isProfessional === 'true';
    
    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    
    // Create the Google auth URL
    const googleAuthUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/google?role=${isProfessional ? 'professional' : 'client'}&state=${state}`;
    
    res.json({ url: googleAuthUrl, state });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ message: 'Error generating Google auth URL' });
  }
});

router.get('/google',
  (req, res, next) => {
    // Store role in session if provided
    if (req.query.role) {
      req.session = req.session || {};
      req.session.userRole = req.query.role;
    }
    
    // Utiliser l'état fourni ou en générer un nouveau
    const state = req.query.state || Math.random().toString(36).substring(7);
    
    // Passer à l'authentification avec les options correctes
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      accessType: 'offline',
      session: true,
      state: state
    })(req, res, next);
  }
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=auth_failed` }),
  async (req, res) => {
    try {
      // Log user info for debugging
      console.log('Google authentication successful', {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.firstName + ' ' + req.user.lastName
      });
      
      // Update user role if needed
      if (req.session && req.session.userRole === 'professional') {
        // Update user role
        await User.findByIdAndUpdate(req.user._id, { role: 'professional' });
        console.log('Updated user role to professional');
        
        // Check if professional profile already exists
        const Professional = require('../models/Professional');
        const existingProfile = await Professional.findOne({ userId: req.user._id });
        
        if (!existingProfile) {
          // Create a professional profile
          const newProfessional = new Professional({
            userId: req.user._id,
            businessName: `${req.user.firstName} ${req.user.lastName}`,
            businessType: 'other', // Default business type
            title: `${req.user.firstName} ${req.user.lastName}`,
            description: '',
            address: "À définir",
            contactInfo: { 
              email: req.user.email,
              phone: ''
            },
            isVerified: true,
            isActive: true
          });
          
          await newProfessional.save();
          console.log('Created professional profile for user:', req.user._id);
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=server_error`);
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Token non fourni' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Return user data
    res.json({
      success: true,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // Specific error for invalid/expired token
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou expiré',
        error: error.name
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des données utilisateur' 
    });
  }
});

// Get current user with JWT
router.get('/me/jwt', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    success: true,
    user: formatUserData(req.user)
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error destroying session' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: formatUserData(req.user)
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Refresh JWT token
router.post('/refresh', passport.authenticate('jwt', { session: false }), (req, res) => {
  const newToken = jwt.sign(
    { userId: req.user._id, email: req.user.email },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    token: newToken
  });
});

// Change password
router.put('/change-password', passport.authenticate('jwt', { session: false }), [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;