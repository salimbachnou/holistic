const Session = require('../models/Session');
const Professional = require('../models/Professional');
const { validationResult } = require('express-validator');

class SessionService {
  /**
   * Create a new session with improved validation and error handling
   * @param {Object} sessionData - Session data from request
   * @param {Object} user - Authenticated user
   * @returns {Object} Result with session or error
   */
  static async createSession(sessionData, user) {
    try {
      // Validate input data
      const validationErrors = this.validateSessionData(sessionData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          message: 'Validation failed'
        };
      }

      // Find professional profile
      const professional = await Professional.findOne({ userId: user._id });
      if (!professional) {
        return {
          success: false,
          message: 'Professional profile not found'
        };
      }

      // Check for time conflicts (optional - can be disabled)
      // Uncomment the following lines to enable conflict checking
      /*
      const hasConflict = await this.checkTimeConflicts(sessionData, professional._id);
      if (hasConflict) {
        return {
          success: false,
          message: 'Time conflict detected with existing sessions'
        };
      }
      */

      // Prepare session data
      const sessionToCreate = {
        ...sessionData,
        professionalId: professional._id,
        status: 'scheduled',
      };

      // Create session
      const session = new Session(sessionToCreate);
      await session.save();

      // Update professional's sessions array
      professional.sessions.push(session._id);
      await professional.save();

      return {
        success: true,
        message: 'Session created successfully',
        session
      };

    } catch (error) {
      console.error('SessionService.createSession error:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return {
          success: false,
          message: 'Validation error',
          errors: validationErrors
        };
      }

      return {
        success: false,
        message: 'Failed to create session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  /**
   * Validate session data
   * @param {Object} data - Session data to validate
   * @returns {Array} Array of validation errors
   */
  static validateSessionData(data) {
    const errors = [];

    // Required fields validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    if (!data.startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    } else {
      const startTime = new Date(data.startTime);
      if (isNaN(startTime.getTime())) {
        errors.push({ field: 'startTime', message: 'Invalid start time format' });
      } else if (startTime < new Date()) {
        errors.push({ field: 'startTime', message: 'Start time cannot be in the past' });
      }
    }

    // Duration validation
    if (!data.duration || isNaN(data.duration)) {
      errors.push({ field: 'duration', message: 'Duration is required and must be a number' });
    } else if (data.duration < 15 || data.duration > 480) {
      errors.push({ field: 'duration', message: 'Duration must be between 15 and 480 minutes' });
    }

    // Max participants validation
    if (!data.maxParticipants || isNaN(data.maxParticipants)) {
      errors.push({ field: 'maxParticipants', message: 'Max participants is required and must be a number' });
    } else if (data.maxParticipants < 1 || data.maxParticipants > 100) {
      errors.push({ field: 'maxParticipants', message: 'Max participants must be between 1 and 100' });
    }

    // Price validation
    if (!data.price || isNaN(data.price)) {
      errors.push({ field: 'price', message: 'Price is required and must be a number' });
    } else if (data.price < 0) {
      errors.push({ field: 'price', message: 'Price cannot be negative' });
    }

    // Category validation
    const validCategories = ['individual', 'group', 'online', 'workshop', 'retreat'];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.push({ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') });
    }

    // Location is now optional for all session types
    // No validation required

    // Meeting link validation for online sessions
    if (data.category === 'online' && (!data.meetingLink || data.meetingLink.trim().length === 0)) {
      errors.push({ field: 'meetingLink', message: 'Meeting link is required for online sessions' });
    }

    return errors;
  }

  /**
   * Validate update data (more flexible than full validation)
   * @param {Object} updateData - Data being updated
   * @param {Object} existingSession - Existing session data
   * @returns {Array} Array of validation errors
   */
  static validateUpdateData(updateData, existingSession) {
    const errors = [];

    // Title validation (if provided)
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title is required' });
      } else if (updateData.title.trim().length < 3 || updateData.title.trim().length > 100) {
        errors.push({ field: 'title', message: 'Title must be between 3 and 100 characters' });
      }
    }

    // Description validation (if provided)
    if (updateData.description !== undefined) {
      if (!updateData.description || updateData.description.trim().length === 0) {
        errors.push({ field: 'description', message: 'Description is required' });
      } else if (updateData.description.trim().length < 10 || updateData.description.trim().length > 1000) {
        errors.push({ field: 'description', message: 'Description must be between 10 and 1000 characters' });
      }
    }

    // Start time validation (if provided)
    if (updateData.startTime !== undefined) {
      const startTime = new Date(updateData.startTime);
      if (isNaN(startTime.getTime())) {
        errors.push({ field: 'startTime', message: 'Invalid start time format' });
      } else {
        // For updates, allow more flexibility with past times (5 minute buffer)
        const now = new Date();
        const bufferTime = new Date(now.getTime() - 5 * 60000);
        if (startTime <= bufferTime) {
          errors.push({ field: 'startTime', message: 'Start time must be in the future' });
        }
      }
    }

    // Duration validation (if provided)
    if (updateData.duration !== undefined) {
      if (!updateData.duration || isNaN(updateData.duration)) {
        errors.push({ field: 'duration', message: 'Duration is required and must be a number' });
      } else if (updateData.duration < 15 || updateData.duration > 480) {
        errors.push({ field: 'duration', message: 'Duration must be between 15 and 480 minutes' });
      }
    }

    // Max participants validation (if provided)
    if (updateData.maxParticipants !== undefined) {
      if (!updateData.maxParticipants || isNaN(updateData.maxParticipants)) {
        errors.push({ field: 'maxParticipants', message: 'Max participants is required and must be a number' });
      } else if (updateData.maxParticipants < 1 || updateData.maxParticipants > 100) {
        errors.push({ field: 'maxParticipants', message: 'Max participants must be between 1 and 100' });
      }
    }

    // Price validation (if provided)
    if (updateData.price !== undefined) {
      if (updateData.price === null || updateData.price === '' || isNaN(updateData.price)) {
        errors.push({ field: 'price', message: 'Price is required and must be a number' });
      } else if (updateData.price < 0) {
        errors.push({ field: 'price', message: 'Price cannot be negative' });
      }
    }

    // Category validation (if provided)
    if (updateData.category !== undefined) {
      const validCategories = ['individual', 'group', 'online', 'workshop', 'retreat'];
      if (!validCategories.includes(updateData.category)) {
        errors.push({ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') });
      }
    }

    // Location is now optional for all session types
    // No validation required

    // Meeting link validation (context-aware)
    const finalCategory = updateData.category !== undefined ? updateData.category : existingSession.category;
    if (finalCategory === 'online') {
      if (updateData.meetingLink !== undefined && (!updateData.meetingLink || updateData.meetingLink.trim().length === 0)) {
        errors.push({ field: 'meetingLink', message: 'Meeting link is required for online sessions' });
      }
    }

    return errors;
  }

  /**
   * Check for time conflicts with existing sessions
   * @param {Object} sessionData - New session data
   * @param {string} professionalId - Professional ID
   * @returns {boolean} True if conflict exists
   */
  static async checkTimeConflicts(sessionData, professionalId) {
    try {
      const newStartTime = new Date(sessionData.startTime);
      const newEndTime = new Date(newStartTime.getTime() + (sessionData.duration * 60000));

      // Get all existing sessions for this professional
      const existingSessions = await Session.find({
        professionalId: professionalId,
        status: { $in: ['scheduled', 'in_progress'] }
      });

      // Check for conflicts manually
      for (const session of existingSessions) {
        const sessionEndTime = new Date(session.startTime.getTime() + (session.duration * 60000));
        
        // Check if sessions overlap
        const hasConflict = (
          // New session starts during existing session
          (newStartTime >= session.startTime && newStartTime < sessionEndTime) ||
          // New session ends during existing session
          (newEndTime > session.startTime && newEndTime <= sessionEndTime) ||
          // New session completely contains existing session
          (newStartTime <= session.startTime && newEndTime >= sessionEndTime)
        );

        if (hasConflict) {
          console.log(`Time conflict detected with session: ${session.title} (${session.startTime} - ${sessionEndTime})`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return false; // Don't block creation if conflict check fails
    }
  }

  /**
   * Get sessions with advanced filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Object} Sessions and pagination info
   */
  static async getSessions(filters = {}, pagination = {}) {
    try {
      const {
        professionalId,
        startDate,
        endDate,
        status,
        category,
        page = 1,
        limit = 10,
        sortBy = 'startTime',
        sortOrder = 'asc'
      } = filters;

      const query = {};

      // Build query filters
      if (professionalId) {
        query.professionalId = professionalId;
      }

      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) {
          query.startTime.$gte = new Date(startDate);
        }
        if (endDate) {
          query.startTime.$lte = new Date(endDate);
        }
      } else {
        // Default to future sessions if no date range specified
        query.startTime = { $gte: new Date() };
      }

      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const sessions = await Session.find(query)
        .populate('professionalId', 'businessName businessType profileImage')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Session.countDocuments(query);

      return {
        success: true,
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };

    } catch (error) {
      console.error('SessionService.getSessions error:', error);
      return {
        success: false,
        message: 'Failed to fetch sessions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  /**
   * Update session with validation
   * @param {string} sessionId - Session ID
   * @param {Object} updateData - Data to update
   * @param {Object} user - Authenticated user
   * @returns {Object} Result with updated session or error
   */
  static async updateSession(sessionId, updateData, user) {
    try {
      console.log('=== SessionService.updateSession DEBUG ===');
      console.log('Session ID:', sessionId);
      console.log('Update data:', JSON.stringify(updateData, null, 2));
      console.log('User ID:', user._id);

      // Find session
      const session = await Session.findById(sessionId);
      if (!session) {
        console.log('Session not found');
        return {
          success: false,
          message: 'Session not found'
        };
      }

      console.log('Found session:', {
        id: session._id,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        professionalId: session.professionalId
      });

      // Check ownership
      const professional = await Professional.findOne({ userId: user._id });
      if (!professional) {
        console.log('Professional not found for user:', user._id);
        return {
          success: false,
          message: 'Professional profile not found'
        };
      }

      console.log('Found professional:', {
        id: professional._id,
        businessName: professional.businessName
      });

      if (!session.professionalId.equals(professional._id)) {
        console.log('Access denied - session does not belong to professional');
        console.log('Session professionalId:', session.professionalId);
        console.log('User professionalId:', professional._id);
        return {
          success: false,
          message: 'Access denied. You are not the owner of this session.'
        };
      }

      // Check if session can be updated
      if (session.status === 'in_progress' || session.status === 'completed') {
        console.log('Cannot update session - status is:', session.status);
        return {
          success: false,
          message: 'Cannot update a session that is in progress or completed'
        };
      }

      // Check if session is in the past (but allow some buffer time for editing)
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 5 * 60000); // 5 minutes buffer
      if (session.startTime <= bufferTime && session.status !== 'cancelled') {
        console.log('Cannot update session - session is in the past');
        console.log('Session startTime:', session.startTime);
        console.log('Current time:', now);
        console.log('Buffer time:', bufferTime);
        return {
          success: false,
          message: 'Cannot update a session that has already started or is in the past'
        };
      }

      // Validate update data using specialized validation for updates
      console.log('Validating update data...');
      
      const validationErrors = this.validateUpdateData(updateData, session);
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        return {
          success: false,
          errors: validationErrors,
          message: 'Validation failed'
        };
      }

      console.log('Validation passed, updating session...');

      // Update session
      const updatedSession = await Session.findByIdAndUpdate(
        sessionId,
        updateData,
        { new: true, runValidators: true }
      );

      console.log('Session updated successfully:', {
        id: updatedSession._id,
        title: updatedSession.title,
        startTime: updatedSession.startTime,
        status: updatedSession.status
      });

      return {
        success: true,
        message: 'Session updated successfully',
        session: updatedSession
      };

    } catch (error) {
      console.error('=== SessionService.updateSession ERROR ===');
      console.error('SessionService.updateSession error:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        console.log('Mongoose validation errors:', validationErrors);
        
        return {
          success: false,
          message: 'Validation error',
          errors: validationErrors
        };
      }

      return {
        success: false,
        message: 'Failed to update session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  /**
   * Automatically complete sessions that have passed their end time
   * This method is called by the cron job system
   */
  static async autoCompleteExpiredSessions() {
    try {
      // Check if MongoDB is connected
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ [SESSION-AUTO-COMPLETE] Skipping - MongoDB not connected');
        return {
          success: false,
          message: 'MongoDB not connected',
          results: []
        };
      }

      console.log('=== AUTO COMPLETING EXPIRED SESSIONS ===');
      
      const now = new Date();
      
      // Find sessions that should be completed (past end time and still scheduled)
      // Include sessions without confirmationStatus or with approved status
      const expiredSessions = await Session.find({
        status: 'scheduled',
      }).populate('professionalId', 'userId businessName');

      console.log(`Found ${expiredSessions.length} sessions to check for expiration`);

      const results = [];
      
      for (const session of expiredSessions) {
        try {
          // Calculate session end time
          const sessionEndTime = new Date(session.startTime.getTime() + (session.duration * 60 * 1000));
          
          // Only complete if session has actually ended (with 5 minute buffer)
          const bufferTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes buffer
          if (sessionEndTime < bufferTime) {
            console.log(`Auto-completing session: ${session.title} (ID: ${session._id})`);
            
            // Update session status to completed
            session.status = 'completed';
            await session.save();
            
            // Send review requests if SessionReviewService is available
            try {
              const SessionReviewService = require('./sessionReviewService');
              const reviewResult = await SessionReviewService.sendReviewRequestsForSession(session._id, session.professionalId.userId);
              
              results.push({
                sessionId: session._id,
                sessionTitle: session.title,
                status: 'completed',
                reviewRequestsSent: reviewResult ? reviewResult.reviewRequests.length : 0
              });
            } catch (reviewError) {
              console.error(`Error sending review requests for session ${session._id}:`, reviewError);
              results.push({
                sessionId: session._id,
                sessionTitle: session.title,
                status: 'completed',
                reviewRequestsSent: 0,
                reviewError: reviewError.message
              });
            }
          }
        } catch (error) {
          console.error(`Error auto-completing session ${session._id}:`, error);
          results.push({
            sessionId: session._id,
            sessionTitle: session.title,
            status: 'error',
            error: error.message
          });
        }
      }

      const completedCount = results.filter(r => r.status === 'completed').length;
      console.log(`Auto-completed ${completedCount} sessions`);

      return {
        success: true,
        message: `Auto-completed ${completedCount} sessions`,
        results: results
      };

    } catch (error) {
      console.error('Error in auto-complete expired sessions:', error);
      throw error;
    }
  }
}

module.exports = SessionService; 