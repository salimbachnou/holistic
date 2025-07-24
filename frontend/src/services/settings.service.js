import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class SettingsService {
  // Get public settings (no authentication required)
  async getPublicSettings() {
    try {
      const response = await axios.get(`${API_URL}/api/users/settings/public`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public settings:', error);
      throw error;
    }
  }

  // Get admin settings (requires admin authentication)
  async getAdminSettings() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }
  }

  // Update admin settings (requires admin authentication)
  async updateAdminSettings(settings) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/admin/settings`,
        { settings },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }

  // Cache for public settings to avoid unnecessary API calls
  _publicSettingsCache = null;
  _cacheTimestamp = null;
  _cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Get public settings with caching
  async getCachedPublicSettings() {
    const now = Date.now();

    // Return cached settings if they're still valid
    if (
      this._publicSettingsCache &&
      this._cacheTimestamp &&
      now - this._cacheTimestamp < this._cacheExpiry
    ) {
      return this._publicSettingsCache;
    }

    // Fetch fresh settings
    try {
      const response = await this.getPublicSettings();
      this._publicSettingsCache = response;
      this._cacheTimestamp = now;
      return response;
    } catch (error) {
      // Return cached settings if API fails and we have cache
      if (this._publicSettingsCache) {
        console.warn('Using cached settings due to API error');
        return this._publicSettingsCache;
      }
      throw error;
    }
  }

  // Clear the cache (useful when settings are updated)
  clearCache() {
    this._publicSettingsCache = null;
    this._cacheTimestamp = null;
  }

  // Get specific setting value with fallback
  getSetting(settingsData, path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let current = settingsData?.settings;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }

      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.error('Error getting setting value:', error);
      return defaultValue;
    }
  }

  // Apply theme colors to CSS variables
  applyThemeColors(settings) {
    if (!settings?.appearance) return;

    const root = document.documentElement;

    if (settings.appearance.primaryColor) {
      root.style.setProperty('--primary-color', settings.appearance.primaryColor);
    }

    if (settings.appearance.secondaryColor) {
      root.style.setProperty('--secondary-color', settings.appearance.secondaryColor);
    }

    // Update favicon if provided
    if (settings.appearance.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = settings.appearance.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    // Update page title if provided
    if (settings.general?.siteName) {
      const currentTitle = document.title;
      if (!currentTitle.includes(settings.general.siteName)) {
        document.title = `${settings.general.siteName} - ${currentTitle}`;
      }
    }
  }

  // Format currency based on settings
  formatCurrency(amount, settings) {
    const currency = this.getSetting(settings, 'general.currency', 'MAD');
    const locale = this.getSetting(settings, 'general.language', 'fr') === 'fr' ? 'fr-MA' : 'en-US';

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${amount} ${currency}`;
    }
  }

  // Get contact information
  getContactInfo(settings) {
    return {
      email: this.getSetting(settings, 'general.contactEmail', 'contact@holistic.ma'),
      phone: this.getSetting(settings, 'general.phoneNumber', '+212 5XX XXX XXX'),
      siteName: this.getSetting(settings, 'general.siteName', 'Holistic.ma'),
    };
  }

  // Check if a payment method is enabled
  isPaymentMethodEnabled(settings, method) {
    return this.getSetting(settings, `payments.paymentMethods.${method}`, false);
  }

  // Get tax rate
  getTaxRate(settings) {
    return this.getSetting(settings, 'payments.taxRate', 20);
  }
}

// Export a singleton instance
const settingsService = new SettingsService();
export default settingsService;
