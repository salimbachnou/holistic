const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Load models
require('./models/User');
require('./models/Professional');
require('./models/Product');
require('./models/Booking');
require('./models/Session');
require('./models/Review');
require('./models/OrderReview');
require('./models/Message');
require('./models/Contact');
require('./models/Event');
require('./models/Notification');
require('./models/Order');

// Import routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const usersRoutes = require('./routes/users');
const professionalsRoutes = require('./routes/professionals');
const adminRoutes = require('./routes/admin');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');
const bookingsRoutes = require('./routes/bookings');
const uploadsRoutes = require('./routes/uploads');
const productsRoutes = require('./routes/products');
const eventsRoutes = require('./routes/events');
const ordersRoutes = require('./routes/orders');
const notificationsRoutes = require('./routes/notifications');
const reviewsRoutes = require('./routes/reviews');
const orderReviewsRoutes = require('./routes/orderReviews');
const homepageRoutes = require('./routes/homepage');

// Import passport configuration
require('./config/passport');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Enable trust proxy to fix express-rate-limit warning
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // increased from 1000 to 5000 requests per window
  standardHeaders: true, // Renvoie les headers 'RateLimit-*' standards pour informer le client
  legacyHeaders: false, // Désactive les headers 'X-RateLimit-*' 
  message: 'Too many requests, please try again later.'
});

// Middleware spécifique pour l'endpoint auth/me/jwt (sans rate limit)
const authJwtLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // increased from 5000 to 10000 for auth requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const productImagesDir = path.join(uploadsDir, 'products');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir);
}

// Configure CORS middleware with more permissive settings
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};

// Apply CORS as early as possible in middleware chain
app.use(cors(corsOptions));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP to avoid blocking resources
}));

// Apply rate limiter after CORS, but only in production
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
} else {
  console.log('Rate limiting disabled in development mode');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS pre-flight handler for all routes
app.options('*', cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
  // Set CORS headers specifically for static files
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'holistic-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic')
.then(async () => {
  console.log('MongoDB connected successfully');
  
  // Create admin account if it doesn't exist
  try {
    const createAdminAccount = require('./scripts/createAdminAccount');
    await createAdminAccount();
    console.log('admin creating successfully');
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Special CORS handling for auth endpoint
app.use('/api/auth/me/jwt', process.env.NODE_ENV === 'production' ? authJwtLimiter : (req, res, next) => next(), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Global middleware to ensure CORS headers are always sent
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/order-reviews', orderReviewsRoutes);
app.use('/api/homepage', homepageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Holistic.ma API is running' });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their room for notifications
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    }
  });
  
  // Handle chat messages
  socket.on('send-message', (data) => {
    console.log('Message sent:', data);
    if (data.recipientId) {
      io.to(`user-${data.recipientId}`).emit('receive-message', data);
    }
  });
  
  // Handle notifications
  socket.on('send-notification', (data) => {
    if (data.userId) {
      io.to(`user-${data.userId}`).emit('receive-notification', data);
    }
  });
  
  // Join admin-specific room for notifications
  socket.on('join-admin-room', (userId) => {
    if (userId) {
      console.log(`Admin ${userId} joined admin notification room`);
      socket.join(`admin:${userId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io instance available to routes
app.set('io', io);

// Make io instance available globally for services
global.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start automatic event review notifications (check every 6 hours)
  const EventReviewService = require('./services/eventReviewService');
  
  // Run immediately on startup (after 30 seconds delay)
  setTimeout(async () => {
    try {
      console.log('🚀 [STARTUP] Running initial event review check...');
      await EventReviewService.checkCompletedEvents();
    } catch (error) {
      console.error('❌ [STARTUP] Error in initial event review check:', error);
    }
  }, 30000);
  
  // Then run every 6 hours
  setInterval(async () => {
    try {
      console.log('⏰ [CRON] Running scheduled event review check...');
      await EventReviewService.checkCompletedEvents();
    } catch (error) {
      console.error('❌ [CRON] Error in scheduled event review check:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  
  console.log('✅ Event review notifications scheduler started (runs every 6 hours)');
}); 