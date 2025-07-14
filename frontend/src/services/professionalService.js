import apiService from './api';

/**
 * Service for professional-related API calls
 */
export class ProfessionalService {
  /**
   * Get dashboard statistics for the current professional
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getDashboardStats() {
    console.log('📡 ProfessionalService - getDashboardStats called');
    try {
      const response = await apiService.getDashboardStats();
      console.log('✅ ProfessionalService - API response:', response);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('❌ ProfessionalService - Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du chargement des statistiques',
        data: null,
      };
    }
  }

  /**
   * Get professional analytics data
   * @param {string} period - Analytics period (week, month, quarter, year)
   * @returns {Promise<Object>} Analytics data
   */
  static async getAnalyticsData(period = 'month') {
    try {
      const response = await apiService.getAnalyticsData(period);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du chargement des données analytiques',
        data: null,
      };
    }
  }

  /**
   * Get basic professional statistics
   * @returns {Promise<Object>} Basic statistics
   */
  static async getBasicStats() {
    try {
      const response = await apiService.getProfessionalStats();
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du chargement des statistiques de base',
        data: null,
      };
    }
  }

  /**
   * Get mock data for fallback when API is unavailable
   * @returns {Object} Mock dashboard statistics
   */
  static getMockDashboardStats() {
    return {
      success: true,
      stats: {
        sessions: {
          total: 0,
          trend: 'up',
          trendValue: '+0%',
        },
        clients: {
          total: 0,
          trend: 'up',
          trendValue: '+0',
        },
        revenue: {
          total: '0',
          trend: 'up',
          trendValue: '+0%',
        },
        rating: {
          total: '0.0',
          trend: 'up',
          trendValue: '+0.0',
        },
        upcomingSessions: [],
        recentMessages: [],
      },
    };
  }

  /**
   * Format currency value for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: MAD)
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount, currency = 'MAD') {
    if (!amount || isNaN(amount)) return '0';

    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }

  /**
   * Calculate trend percentage
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {Object} Trend information
   */
  static calculateTrend(current, previous) {
    if (!previous || previous === 0) {
      return {
        trend: current > 0 ? 'up' : 'neutral',
        trendValue: current > 0 ? '+100%' : '0%',
      };
    }

    const percentChange = Math.round(((current - previous) / previous) * 100);

    return {
      trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
      trendValue: `${percentChange >= 0 ? '+' : ''}${percentChange}%`,
    };
  }

  /**
   * Format time ago string
   * @param {Date|string} timestamp - Timestamp to format
   * @returns {string} Formatted time ago string
   */
  static formatTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'maintenant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  }

  /**
   * Validate dashboard stats data structure
   * @param {Object} stats - Stats object to validate
   * @returns {boolean} Whether the stats are valid
   */
  static validateDashboardStats(stats) {
    if (!stats || typeof stats !== 'object') return false;

    const requiredFields = ['sessions', 'clients', 'revenue', 'rating'];
    return requiredFields.every(
      field =>
        stats[field] &&
        typeof stats[field] === 'object' &&
        'total' in stats[field] &&
        'trend' in stats[field] &&
        'trendValue' in stats[field]
    );
  }
}

export default ProfessionalService;
