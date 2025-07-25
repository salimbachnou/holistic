const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'admin_settings'
  },
  settings: {
    general: {
      siteName: {
        type: String,
        default: 'Holistic.ma'
      },
      siteDescription: {
        type: String,
        default: 'Plateforme de bien-être holistique au Maroc'
      },
      contactEmail: {
        type: String,
        default: 'contact@holistic.ma'
      },
      supportEmail: {
        type: String,
        default: 'support@holistic.ma'
      },
      phoneNumber: {
        type: String,
        default: '+212 5XX XXX XXX'
      },
      address: {
        type: String,
        default: 'Casablanca, Maroc'
      },
      timezone: {
        type: String,
        default: 'Africa/Casablanca'
      },
      language: {
        type: String,
        default: 'fr'
      },
      currency: {
        type: String,
        default: 'MAD'
      }
    },
    email: {
      smtpHost: {
        type: String,
        default: ''
      },
      smtpPort: {
        type: String,
        default: '587'
      },
      smtpUser: {
        type: String,
        default: ''
      },
      smtpPassword: {
        type: String,
        default: ''
      },
      smtpSecure: {
        type: Boolean,
        default: true
      },
      emailFromName: {
        type: String,
        default: 'Holistic.ma'
      },
      emailFromAddress: {
        type: String,
        default: 'noreply@holistic.ma'
      }
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      adminNotifyNewUser: {
        type: Boolean,
        default: true
      },
      adminNotifyNewOrder: {
        type: Boolean,
        default: true
      },
      adminNotifyNewBooking: {
        type: Boolean,
        default: true
      },
      adminNotifyNewProfessional: {
        type: Boolean,
        default: true
      },
      clientNotifyOrderStatus: {
        type: Boolean,
        default: true
      },
      professionalNotifyNewBooking: {
        type: Boolean,
        default: true
      }
    },
    security: {
      sessionTimeout: {
        type: Number,
        default: 24
      },
      maxLoginAttempts: {
        type: Number,
        default: 5
      },
      passwordMinLength: {
        type: Number,
        default: 8
      },
      requirePasswordChange: {
        type: Boolean,
        default: false
      },
      twoFactorAuth: {
        type: Boolean,
        default: false
      },
      maintenanceMode: {
        type: Boolean,
        default: false
      }
    },
    payments: {
      enablePayments: {
        type: Boolean,
        default: true
      },
      currency: {
        type: String,
        default: 'MAD'
      },
      taxRate: {
        type: Number,
        default: 20
      },
      commissionRate: {
        type: Number,
        default: 5
      },
      enableRefunds: {
        type: Boolean,
        default: true
      },
      autoApproveRefunds: {
        type: Boolean,
        default: false
      },
      paymentMethods: {
        creditCard: {
          type: Boolean,
          default: true
        },
        bankTransfer: {
          type: Boolean,
          default: true
        },
        cashOnDelivery: {
          type: Boolean,
          default: false
        }
      }
    },
    appearance: {
      primaryColor: {
        type: String,
        default: '#059669'
      },
      secondaryColor: {
        type: String,
        default: '#0D9488'
      },
      logoUrl: {
        type: String,
        default: '/logo.png'
      },
      faviconUrl: {
        type: String,
        default: '/logo.png'
      },
      customCSS: {
        type: String,
        default: ''
      },
      enableDarkMode: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Method to get settings or create default if not exists
settingsSchema.statics.getSettings = async function() {
  try {
    let settings = await this.findOne({ key: 'admin_settings' });
    
    if (!settings) {
      // Create default settings
      settings = new this({
        key: 'admin_settings',
        settings: {} // Will use schema defaults
      });
      await settings.save();
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

// Method to update settings
settingsSchema.statics.updateSettings = async function(newSettings) {
  try {
    let settings = await this.findOne({ key: 'admin_settings' });
    
    if (!settings) {
      settings = new this({
        key: 'admin_settings',
        settings: newSettings
      });
    } else {
      // Deep merge the settings
      settings.settings = this.mergeDeep(settings.settings.toObject(), newSettings);
    }
    
    await settings.save();
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Helper method for deep merging objects
settingsSchema.statics.mergeDeep = function(target, source) {
  const output = Object.assign({}, target);
  
  if (this.isObject(target) && this.isObject(source)) {
    Object.keys(source).forEach(key => {
      if (this.isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = this.mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

// Helper method to check if value is object
settingsSchema.statics.isObject = function(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
};

module.exports = mongoose.model('Settings', settingsSchema); 