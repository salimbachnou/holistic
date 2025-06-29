# Holistic.ma Backend API

## Overview
Backend API for the Holistic.ma platform - a wellness platform connecting clients with holistic health professionals.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js (Google OAuth2 + JWT)
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/holistic

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Session Secret
SESSION_SECRET=your-super-secret-session-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000
NODE_ENV=development

# Base URL for backend
BASE_URL=http://localhost:5000
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - Your production callback URL
6. Copy Client ID and Client Secret to your `.env` file

### 4. MongoDB Setup
- **Local MongoDB**: Install MongoDB and ensure it's running on port 27017
- **MongoDB Atlas**: Create a cluster and get the connection string

### 5. Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use your Gmail address and the generated app password in `.env`

### 6. Start the Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user (session-based)
- `GET /api/auth/me/jwt` - Get current user (JWT-based)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/refresh` - Refresh JWT token

### Contact Forms
- `POST /api/contact/professional-request` - Submit professional account request
- `POST /api/contact/information-request` - Submit information request
- `GET /api/contact/activity-types` - Get available activity types
- `GET /api/contact/plans` - Get subscription plans

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/preferences` - Update user preferences
- `DELETE /api/users/account` - Delete user account
- `GET /api/users/stats` - Get user statistics

### Professionals
- `GET /api/professionals` - Get all professionals (public)
- `GET /api/professionals/:id` - Get professional by ID (public)
- `GET /api/professionals/me/profile` - Get current professional profile
- `POST /api/professionals/profile` - Create professional profile
- `PUT /api/professionals/profile` - Update professional profile
- `POST /api/professionals/services` - Add service
- `PUT /api/professionals/services/:serviceId` - Update service
- `DELETE /api/professionals/services/:serviceId` - Delete service
- `GET /api/professionals/me/stats` - Get professional statistics

### Health Check
- `GET /api/health` - API health check

## Data Models

### User
```javascript
{
  googleId: String,
  email: String (required, unique),
  firstName: String (required),
  lastName: String (required),
  profileImage: String,
  role: String (enum: ['client', 'professional', 'admin']),
  isVerified: Boolean,
  preferences: {
    language: String (default: 'fr'),
    notifications: {
      email: Boolean,
      push: Boolean
    }
  },
  location: {
    city: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  }
}
```

### Professional
```javascript
{
  userId: ObjectId (ref: 'User'),
  businessName: String (required),
  businessType: String (enum: activity types),
  description: String,
  certifications: [Certification],
  services: [Service],
  businessAddress: Address,
  contactInfo: ContactInfo,
  businessHours: [BusinessHour],
  subscription: Subscription,
  rating: { average: Number, totalReviews: Number },
  isVerified: Boolean,
  isActive: Boolean
}
```

### Contact
```javascript
{
  type: String (enum: ['professional_account_request', 'information_request']),
  email: String (required),
  status: String (enum: ['pending', 'in_progress', 'resolved', 'rejected']),
  // Professional request fields
  businessName: String,
  businessCreationDate: Date,
  phone: String,
  activityType: String,
  selectedPlan: String,
  // Information request fields
  firstName: String,
  lastName: String,
  message: String,
  // Admin fields
  adminNotes: String,
  processedBy: ObjectId,
  processedAt: Date
}
```

## Socket.io Events

### Client to Server
- `join-user-room` - Join user's notification room
- `send-message` - Send chat message
- `send-notification` - Send notification

### Server to Client
- `receive-message` - Receive chat message
- `receive-notification` - Receive notification

## Security Features
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **JWT**: Secure token-based authentication
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: bcryptjs for password security

## Development
```bash
# Install nodemon for development
npm install -g nodemon

# Run in development mode
npm run dev

# Run tests (when implemented)
npm test
```

## Production Deployment
1. Set `NODE_ENV=production` in environment variables
2. Use a production MongoDB instance (MongoDB Atlas recommended)
3. Configure proper CORS origins
4. Set secure session cookies
5. Use process manager like PM2
6. Set up SSL/TLS certificates
7. Configure reverse proxy (nginx)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the ISC License. 