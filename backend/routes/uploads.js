const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Authentication middleware
const requireAuth = passport.authenticate('jwt', { session: false });

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine category from request path or body
    let category = 'general';
    
    if (req.body.category) {
      category = req.body.category;
    } else if (req.path.includes('profile')) {
      category = 'profiles';
    } else if (req.path.includes('product')) {
      category = 'products';
    } else if (req.path.includes('event')) {
      category = 'events';
    } else if (req.path.includes('message')) {
      category = 'messages';
    }
    
    const uploadDir = path.join(__dirname, '../uploads', category);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const uniqueFilename = `${timestamp}-${randomNum}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // For messages, allow more file types
  if (req.path.includes('message')) {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non pris en charge. Seuls les images et documents sont autorisés.'), false);
    }
  } else {
    // For other uploads, only allow images
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Seules les images sont autorisées.'), false);
    }
  }
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Upload single file
router.post('/:category?', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const category = req.params.category || 'products';
    const imageUrl = `/uploads/${category}/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl,
      file: req.file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Upload multiple files
router.post('/multiple/:category?', requireAuth, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const category = req.params.category || 'products';
    const imageUrls = req.files.map(file => `/uploads/${category}/${file.filename}`);

    res.json({
      success: true,
      imageUrls,
      files: req.files
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
});

// Route for uploading an image
router.post('/image', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Determine category for URL construction
    let category = 'general';
    if (req.body.category) {
      category = req.body.category;
    }
    
    // Construct image URL based on category
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${category}/${req.file.filename}`;
    
    res.json({
      message: 'Image uploadée avec succès',
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
  }
});

// Route for uploading event images specifically
router.post('/event', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Set category to events and reconstruct path
    const category = 'events';
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${category}/${req.file.filename}`;
    
    res.json({
      message: 'Image d\'événement uploadée avec succès',
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Error uploading event image:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image d\'événement' });
  }
});

// Route for uploading message attachments
router.post('/message', isAuthenticated, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Set category to messages and reconstruct path
    const category = 'messages';
    const url = `${req.protocol}://${req.get('host')}/uploads/${category}/${req.file.filename}`;
    
    res.json({
      message: 'Fichier uploadé avec succès',
      url,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading message attachment:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload du fichier' });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux. La taille maximum est de 10MB.' });
    }
    return res.status(400).json({ message: `Erreur de téléchargement: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
});

module.exports = router; 