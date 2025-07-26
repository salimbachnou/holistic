const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');
const { sendEmailVerification } = require('../services/emailService');

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
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
    birthDate: user.birthDate,
    gender: user.gender,
    emailVerified: user.emailVerified
  };
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    // Check if email is verified for local users
    if (user.provider === 'local' && !user.emailVerified && user.role !== 'admin') {
      return res.status(401).json({ 
        message: 'Votre compte n\'est pas encore vérifié. Veuillez vérifier votre email et entrer le code de vérification.',
        requiresVerification: true,
        email: user.email
      });
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
  body('lastName').notEmpty().trim(),
  body('birthDate').optional().isISO8601().toDate(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
], async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, phone, birthDate, gender } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      
      // If user exists but is not verified, allow them to request verification again
      if (!existingUser.emailVerified) {
        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        existingUser.emailVerificationToken = verificationCode;
        existingUser.emailVerificationExpiry = verificationExpiry;
        await existingUser.save();
        
        // Send verification email
        const emailSent = await sendEmailVerification(existingUser, verificationCode);
        
        return res.status(200).json({
          success: true,
          message: 'Un compte existe déjà avec cet email. Un nouveau code de vérification a été envoyé.',
          requiresVerification: emailSent,
          email: existingUser.email
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create new user
    let userData = {
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      phone,
      birthDate,
      gender,
      role: req.body.role || 'client', // Permettre de spécifier le rôle si besoin
      provider: 'local',
      isVerified: false, // User needs to verify email
      emailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpiry: verificationExpiry
    };
    // Si c'est un admin, bypass la vérification
    if (userData.role === 'admin') {
      userData.isVerified = true;
      userData.emailVerified = true;
      userData.emailVerificationToken = null;
      userData.emailVerificationExpiry = null;
    }
    const user = new User(userData);
    await user.save();

    // N'envoyer l'email de vérification que si ce n'est pas un admin
    let emailSent = false;
    if (user.role !== 'admin') {
      emailSent = await sendEmailVerification(user, verificationCode);
    }
    if (user.role !== 'admin' && !emailSent) {
      // If email service is not configured, still create the user but mark as verified
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      user.isVerified = true;
      await user.save();
      console.log('Email service not configured. User created without verification.');
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.'
        : 'Inscription réussie. Votre compte a été créé.',
      requiresVerification: emailSent,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Verify email endpoint
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Votre email est déjà vérifié' });
    }

    // Check if verification code matches and is not expired
    if (user.emailVerificationToken !== code) {
      return res.status(400).json({ message: 'Code de vérification incorrect' });
    }

    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ message: 'Code de vérification expiré. Veuillez demander un nouveau code.' });
    }

    // Verify the user
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Email vérifié avec succès. Votre compte est maintenant actif.',
      token,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Resend verification code
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Votre email est déjà vérifié' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with new verification code
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpiry = verificationExpiry;
    await user.save();

    // Send new verification email
    const emailSent = await sendEmailVerification(user, verificationCode);

    if (!emailSent) {
      return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.' });
    }

    res.json({
      success: true,
      message: 'Nouveau code de vérification envoyé à votre email.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// Register professional endpoint
router.post('/register/professional', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional().trim(),
  body('businessName').optional().trim(),
  body('businessType').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Professional registration validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    const { 
      email, password, firstName, lastName, 
      specializations, phone, name, businessName, businessType, address, coordinates 
    } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Professional user already exists:', email);
      
      // If user exists but is not verified, allow them to request verification again
      if (!existingUser.emailVerified) {
        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        existingUser.emailVerificationToken = verificationCode;
        existingUser.emailVerificationExpiry = verificationExpiry;
        await existingUser.save();
        
        // Send verification email
        const emailSent = await sendEmailVerification(existingUser, verificationCode);
        
        return res.status(200).json({
          success: true,
          message: 'Un compte existe déjà avec cet email. Un nouveau code de vérification a été envoyé.',
          requiresVerification: emailSent,
          email: existingUser.email
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
      isVerified: false, // Le compte doit être vérifié par l'admin
      emailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpiry: verificationExpiry
    });

    await user.save();

    // Create professional profile
    const Professional = require('../models/Professional');
    const professional = new Professional({
      userId: user._id,
      businessType: businessType || 'wellness',
      businessName: businessName || '',
      title: businessName || 'Professionnel du bien-être',
      address: address || '',
      businessAddress: coordinates ? {
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        street: address || '',
        city: '',
        country: 'Morocco'
      } : null,
      specializations: specializations ? specializations.split(',').map(s => s.trim()) : [],
      contactInfo: { 
        phone: phone || '',
        email: email
      },
      isVerified: false, // Le profil doit être vérifié par l'admin
      isActive: false // Le profil n'est pas actif tant qu'il n'est pas vérifié
    });

    await professional.save();

    // Send verification email
    const emailSent = await sendEmailVerification(user, verificationCode);
    
    if (!emailSent) {
      // If email service is not configured, still create the user but mark as verified
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();
      
      console.log('Email service not configured. Professional user created without verification.');
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.'
        : 'Inscription réussie. Votre compte a été créé.',
      requiresVerification: emailSent,
      email: user.email
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
    console.log('🔍 Google Auth Route - Query params:', req.query);
    console.log('🔍 Google Auth Route - Session before:', req.session);
    
    // Store role in session if provided
    if (req.query.role) {
      req.session = req.session || {};
      req.session.userRole = req.query.role;
      console.log('🔍 Google Auth Route - Set userRole in session:', req.query.role);
    }
    
    // Utiliser l'état fourni ou en générer un nouveau
    const state = req.query.state || Math.random().toString(36).substring(7);
    
    console.log('🔍 Google Auth Route - Session after:', req.session);
    
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
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed` }),
  async (req, res) => {
    try {
      // Log user info for debugging
      console.log('Google authentication successful', {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.firstName + ' ' + req.user.lastName
      });
      
      // Log user info for debugging
      console.log('Google authentication successful', {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.firstName + ' ' + req.user.lastName,
        role: req.user.role
      });
      
      // The professional profile is now created in the Passport strategy
      // No need to create it here anymore
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token and role info
      const redirectUrl = req.session && req.session.userRole === 'professional' 
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&role=professional`
        : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
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

// Forgot password - send reset email
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email valide requis',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'Holistic.ma'} <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Holistic.ma',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d5a87; text-align: center;">Réinitialisation de mot de passe</h2>
            
            <p>Bonjour ${user.firstName || user.name || 'Utilisateur'},</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur Holistic.ma.</p>
            
            <p>Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            
            <p><strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
            
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Cet email a été envoyé par Holistic.ma<br>
              Si vous avez des questions, contactez-nous à ${process.env.EMAIL_USER || 'support@holistic.ma'}
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
      
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.json({
      success: true,
      message: 'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur du serveur'
    });
  }
});

// Reset password with token
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
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

    const { token } = req.params;
    const { password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }

    // Update password and clear reset token
    // Hash the password manually since we're using findByIdAndUpdate
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur du serveur'
    });
  }
});

module.exports = router;