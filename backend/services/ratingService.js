const Review = require('../models/Review');
const Event = require('../models/Event');
const Professional = require('../models/Professional');

/**
 * Service for calculating ratings from all sources
 */
class RatingService {
  /**
   * Calculate overall rating for a professional from all sources
   * @param {ObjectId} professionalId - Professional ID
   * @param {ObjectId} professionalUserId - Professional User ID
   * @returns {Object} Rating statistics
   */
  static async calculateOverallRating(professionalId, professionalUserId) {
    try {
      let allRatings = [];
      let totalReviews = 0;
      let sourceBreakdown = {
        reviews: { count: 0, average: 0 },
        events: { count: 0, average: 0 },
        products: { count: 0, average: 0 },
        sessions: { count: 0, average: 0 }
      };

      // 1. Get ratings from Review model (products and sessions)
      const reviewsData = await Review.aggregate([
        { 
          $match: { 
            professionalId: professionalId, 
            status: 'approved' 
          } 
        },
        {
          $group: {
            _id: '$contentType',
            ratings: { $push: '$rating' },
            count: { $sum: 1 },
            average: { $avg: '$rating' }
          }
        }
      ]);

      // Process review data by content type
      for (const reviewData of reviewsData) {
        const contentType = reviewData._id;
        const ratings = reviewData.ratings;
        
        allRatings = allRatings.concat(ratings);
        totalReviews += reviewData.count;

        if (contentType === 'product') {
          sourceBreakdown.products = {
            count: reviewData.count,
            average: reviewData.average
          };
        } else if (contentType === 'session') {
          sourceBreakdown.sessions = {
            count: reviewData.count,
            average: reviewData.average
          };
        }
      }

      // 2. Get ratings from Event model (event reviews)
      const events = await Event.find({
        professional: professionalUserId,
        'reviews.0': { $exists: true }
      });

      let eventRatings = [];
      for (const event of events) {
        for (const review of event.reviews) {
          allRatings.push(review.rating);
          eventRatings.push(review.rating);
          totalReviews++;
        }
      }

      if (eventRatings.length > 0) {
        sourceBreakdown.events = {
          count: eventRatings.length,
          average: eventRatings.reduce((sum, rating) => sum + rating, 0) / eventRatings.length
        };
      }

      // Calculate overall statistics
      const overallAverage = allRatings.length > 0 
        ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
        : 0;

      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allRatings.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });

      return {
        overallAverage: Math.round(overallAverage * 10) / 10,
        totalReviews,
        distribution,
        sourceBreakdown,
        allRatings
      };

    } catch (error) {
      console.error('Error calculating overall rating:', error);
      throw error;
    }
  }

  /**
   * Update professional's stored rating
   * @param {ObjectId} professionalId - Professional ID
   * @param {number} newRating - New average rating
   * @param {number} totalReviews - Total number of reviews
   */
  static async updateProfessionalRating(professionalId, newRating, totalReviews) {
    try {
      await Professional.findByIdAndUpdate(professionalId, {
        'rating.average': newRating,
        'rating.totalReviews': totalReviews
      });
    } catch (error) {
      console.error('Error updating professional rating:', error);
      throw error;
    }
  }

  /**
   * Calculate rating trend compared to stored rating
   * @param {number} currentRating - Current calculated rating
   * @param {number} storedRating - Previously stored rating
   * @returns {Object} Trend information
   */
  static calculateRatingTrend(currentRating, storedRating) {
    const difference = currentRating - storedRating;
    const trend = difference > 0.1 ? 'up' : difference < -0.1 ? 'down' : 'neutral';
    const trendValue = difference !== 0 
      ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}`
      : '0.0';

    return { trend, trendValue, difference };
  }

  /**
   * Get rating statistics for dashboard
   * @param {ObjectId} professionalId - Professional ID
   * @param {ObjectId} professionalUserId - Professional User ID
   * @returns {Object} Dashboard rating stats
   */
  static async getDashboardRatingStats(professionalId, professionalUserId) {
    try {
      // Get current stored rating
      const professional = await Professional.findById(professionalId);
      const storedRating = professional?.rating?.average || 0;

      // Calculate real rating from all sources
      const ratingStats = await this.calculateOverallRating(professionalId, professionalUserId);
      
      // Calculate trend
      const trendInfo = this.calculateRatingTrend(ratingStats.overallAverage, storedRating);

      // Update stored rating if significantly different
      if (Math.abs(ratingStats.overallAverage - storedRating) > 0.1) {
        await this.updateProfessionalRating(professionalId, ratingStats.overallAverage, ratingStats.totalReviews);
      }

      return {
        total: ratingStats.overallAverage.toFixed(1),
        totalReviews: ratingStats.totalReviews,
        trend: trendInfo.trend,
        trendValue: trendInfo.trendValue,
        distribution: ratingStats.distribution,
        sourceBreakdown: ratingStats.sourceBreakdown
      };

    } catch (error) {
      console.error('Error getting dashboard rating stats:', error);
      return {
        total: '0.0',
        totalReviews: 0,
        trend: 'neutral',
        trendValue: '0.0',
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sourceBreakdown: {
          reviews: { count: 0, average: 0 },
          events: { count: 0, average: 0 },
          products: { count: 0, average: 0 },
          sessions: { count: 0, average: 0 }
        }
      };
    }
  }

  /**
   * Get detailed rating breakdown for analytics
   * @param {ObjectId} professionalId - Professional ID
   * @param {ObjectId} professionalUserId - Professional User ID
   * @returns {Object} Detailed rating analytics
   */
  static async getDetailedRatingAnalytics(professionalId, professionalUserId) {
    try {
      const ratingStats = await this.calculateOverallRating(professionalId, professionalUserId);
      
      // Calculate percentages for distribution
      const distributionPercentages = {};
      Object.keys(ratingStats.distribution).forEach(rating => {
        distributionPercentages[rating] = ratingStats.totalReviews > 0 
          ? Math.round((ratingStats.distribution[rating] / ratingStats.totalReviews) * 100)
          : 0;
      });

      return {
        overall: {
          average: ratingStats.overallAverage,
          total: ratingStats.totalReviews
        },
        distribution: ratingStats.distribution,
        distributionPercentages,
        sourceBreakdown: ratingStats.sourceBreakdown,
        insights: {
          mostCommonRating: this.getMostCommonRating(ratingStats.distribution),
          satisfactionRate: this.calculateSatisfactionRate(ratingStats.distribution, ratingStats.totalReviews)
        }
      };

    } catch (error) {
      console.error('Error getting detailed rating analytics:', error);
      throw error;
    }
  }

  /**
   * Get most common rating
   * @param {Object} distribution - Rating distribution
   * @returns {number} Most common rating
   */
  static getMostCommonRating(distribution) {
    let maxCount = 0;
    let mostCommon = 5;
    
    Object.entries(distribution).forEach(([rating, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = parseInt(rating);
      }
    });
    
    return mostCommon;
  }

  /**
   * Calculate satisfaction rate (4-5 stars)
   * @param {Object} distribution - Rating distribution
   * @param {number} totalReviews - Total reviews
   * @returns {number} Satisfaction rate percentage
   */
  static calculateSatisfactionRate(distribution, totalReviews) {
    if (totalReviews === 0) return 0;
    
    const satisfiedCount = (distribution[4] || 0) + (distribution[5] || 0);
    return Math.round((satisfiedCount / totalReviews) * 100);
  }
}

module.exports = RatingService; 