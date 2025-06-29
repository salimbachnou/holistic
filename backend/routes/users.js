const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    ...user.toJSON(),
    profileImage: convertImageUrl(user.profileImage)
  };
};

// Middleware to require authentication
const requireAuth = passport.authenticate('jwt', { session: false });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: formatUserData(user)
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user profile
router.put('/profile', requireAuth, upload.single('profileImage'), [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('preferences.language').optional().isIn(['fr', 'en', 'ar']).withMessage('Invalid language'),
  body('location.city').optional().isString(),
  body('location.country').optional().isString()
], async (req, res) => {
  try {
    console.log('=== Profile Update Request ===');
    console.log('Request body:', req.body);
    console.log('Address field from request:', req.body.address);
    console.log('Request file:', req.file);
    console.log('User ID:', req.user._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updateData = {};
    const allowedFields = [
      'firstName', 'lastName', 'email', 'preferences', 'location', 'phone', 'address', 'birthDate', 'profileImage'
    ];

    // Only update fields that are provided
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Explicitly handle the address field
    if (req.body.address !== undefined) {
      console.log('Setting address in updateData:', req.body.address);
      updateData.address = req.body.address;
    }

    // If a file was uploaded, add the path to updateData
    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      updateData.email = updateData.email.toLowerCase();
    }    console.log('Update data to save:', updateData);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, select: '-password' }
    );

    console.log('Updated user result:', updatedUser);
    console.log('Updated address:', updatedUser.address);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserData(updatedUser)
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user preferences
router.put('/preferences', requireAuth, [
  body('language').optional().isIn(['fr', 'en', 'ar']).withMessage('Invalid language'),
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean()
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (req.body.language) {
      user.preferences.language = req.body.language;
    }
    if (req.body.notifications) {
      if (req.body.notifications.email !== undefined) {
        user.preferences.notifications.email = req.body.notifications.email;
      }
      if (req.body.notifications.push !== undefined) {
        user.preferences.notifications.push = req.body.notifications.push;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user account
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // If user is a professional, delete associated professional data
    if (userRole === 'professional') {
      const Professional = require('../models/Professional');
      
      // Delete professional profile
      await Professional.findOneAndDelete({ userId });
      
      // Delete associated services, sessions, etc.
      const Session = require('../models/Session');
      await Session.deleteMany({ professionalId: userId });
      
      // Delete associated products if any
      const Product = require('../models/Product');
      await Product.deleteMany({ sellerId: userId });
      
      // Delete associated events if any
      const Event = require('../models/Event');
      await Event.deleteMany({ createdBy: userId });
    }
    
    // Delete user's bookings
    const Booking = require('../models/Booking');
    await Booking.deleteMany({ userId });
    
    // Delete user's messages
    const Message = require('../models/Message');
    await Message.deleteMany({ 
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    });
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Change password
router.put('/change-password', requireAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
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

    // Update password
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

// Get user statistics (for dashboard)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      joinDate: user.createdAt,
      role: user.role,
      isVerified: user.isVerified,
      totalSessions: 0, // Placeholder for future implementation
      favoriteServices: [], // Placeholder for future implementation
      upcomingBookings: 0 // Placeholder for future implementation
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 