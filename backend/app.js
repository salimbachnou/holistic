const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const professionalsRoutes = require('./routes/professionals');
const bookingsRoutes = require('./routes/bookings');
const productsRoutes = require('./routes/products');
const sessionsRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const messagesRoutes = require('./routes/messages');
const uploadsRoutes = require('./routes/uploads');
const eventsRoutes = require('./routes/events');
const zoomRoutes = require('./routes/zoom');
const statsRouter = require('./routes/stats');
const homepageRoutes = require('./routes/homepage');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/stats', statsRouter);
app.use('/api/homepage', homepageRoutes);

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Accessible from other devices on your network.`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});