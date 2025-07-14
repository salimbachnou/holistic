import React, { createContext, useContext, useState, useEffect } from 'react';

import settingsService from '../services/settings.service';

const SettingsContext = createContext({});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    if (settings) {
      settingsService.applyThemeColors(settings);
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getCachedPublicSettings();
      setSettings(response.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError(error);
      // Set default settings if loading fails
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      settingsService.clearCache();
      await loadSettings();
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  // Helper function to get a setting value
  const getSetting = (path, defaultValue = null) => {
    return settingsService.getSetting({ settings }, path, defaultValue);
  };

  // Helper function to format currency
  const formatCurrency = amount => {
    return settingsService.formatCurrency(amount, { settings });
  };

  // Helper function to get contact info
  const getContactInfo = () => {
    return settingsService.getContactInfo({ settings });
  };

  // Helper function to check payment method
  const isPaymentMethodEnabled = method => {
    return settingsService.isPaymentMethodEnabled({ settings }, method);
  };

  // Helper function to get tax rate
  const getTaxRate = () => {
    return settingsService.getTaxRate({ settings });
  };

  const value = {
    settings,
    loading,
    error,
    loadSettings,
    refreshSettings,
    getSetting,
    formatCurrency,
    getContactInfo,
    isPaymentMethodEnabled,
    getTaxRate,
    // Direct access to common settings
    siteName: getSetting('general.siteName', 'Holistic.ma'),
    primaryColor: getSetting('appearance.primaryColor', '#059669'),
    secondaryColor: getSetting('appearance.secondaryColor', '#0D9488'),
    currency: getSetting('general.currency', 'MAD'),
    language: getSetting('general.language', 'fr'),
    enablePayments: getSetting('payments.enablePayments', true),
    logoUrl: getSetting('appearance.logoUrl', '/logo.png'),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// Default settings as fallback
const getDefaultSettings = () => ({
  general: {
    siteName: 'Holistic.ma',
    siteDescription: 'Plateforme de bien-être holistique au Maroc',
    contactEmail: 'contact@holistic.ma',
    phoneNumber: '+212 5XX XXX XXX',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    language: 'fr',
  },
  appearance: {
    primaryColor: '#059669',
    secondaryColor: '#0D9488',
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    enableDarkMode: false,
  },
  payments: {
    enablePayments: true,
    currency: 'MAD',
    taxRate: 20,
    paymentMethods: {
      creditCard: true,
      bankTransfer: true,
      cashOnDelivery: false,
    },
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
  },
});

export default SettingsContext;
