const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Default connection string (should be overridden by .env)
const defaultConnectionString = 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic';

// Connect to MongoDB with retry logic
const connectWithRetry = async (retryCount = 5, delay = 5000) => {
  const connectionString = process.env.MONGODB_URI || defaultConnectionString;
  
  try {
    await mongoose.connect(connectionString, mongoOptions);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (err) {
    if (retryCount <= 0) {
      console.error('❌ MongoDB connection failed after multiple attempts:', err);
      return false;
    }
    
    console.log(`⚠️ MongoDB connection attempt failed. Retrying in ${delay/1000}s...`, err.message);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with one less retry count
    return connectWithRetry(retryCount - 1, delay);
  }
};

// Middleware to ensure database connection
const ensureDbConnected = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log('⚠️ Database connection lost. Attempting to reconnect...');
    const connected = await connectWithRetry();
    
    if (!connected) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.' 
      });
    }
  }
  
  next();
};

// Export the connection function and middleware
module.exports = {
  connectWithRetry,
  ensureDbConnected
};
