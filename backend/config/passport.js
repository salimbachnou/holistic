const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL || 'https://holistic-maroc-backend.onrender.com'}/api/auth/google/callback`,
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  proxy: true,
  passReqToCallback: true, // Pass request to callback
  // Ajouter des options de sécurité supplémentaires
  scope: ['profile', 'email'],
  accessType: 'offline',
  prompt: 'consent'
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      // Check if we need to update the role
      if (req.session && req.session.userRole === 'professional' && existingUser.role !== 'professional') {
        existingUser.role = 'professional';
        await existingUser.save();
      }
      return done(null, existingUser);
    }
    
    // Check if user exists with same email
    existingUser = await User.findOne({ email: profile.emails[0].value });
    
    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = profile.id;
      if (!existingUser.profileImage && profile.photos && profile.photos.length > 0) {
        existingUser.profileImage = profile.photos[0].value;
      }
      // Check if we need to update the role
      if (req.session && req.session.userRole === 'professional' && existingUser.role !== 'professional') {
        existingUser.role = 'professional';
      }
      await existingUser.save();
      return done(null, existingUser);
    }
    
    // Determine role based on session
    const role = req.session && req.session.userRole === 'professional' ? 'professional' : 'client';
    
    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      name: `${profile.name.givenName} ${profile.name.familyName}`,
      profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      isVerified: true, // Google accounts are considered verified
      role: role // Set role based on session
    });
    
    await newUser.save();
    done(null, newUser);
    
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    done(error, null);
  }
}));

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport; 