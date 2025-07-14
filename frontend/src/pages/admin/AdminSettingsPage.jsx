import {
  CogIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ServerIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Holistic.ma',
      siteDescription: 'Plateforme de bien-être holistique au Maroc',
      contactEmail: 'contact@holistic.ma',
      supportEmail: 'support@holistic.ma',
      phoneNumber: '+212 5XX XXX XXX',
      address: 'Casablanca, Maroc',
      timezone: 'Africa/Casablanca',
      language: 'fr',
      currency: 'MAD',
    },
    email: {
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
      emailFromName: 'Holistic.ma',
      emailFromAddress: 'noreply@holistic.ma',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      adminNotifyNewUser: true,
      adminNotifyNewOrder: true,
      adminNotifyNewBooking: true,
      adminNotifyNewProfessional: true,
      clientNotifyOrderStatus: true,
      professionalNotifyNewBooking: true,
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requirePasswordChange: false,
      twoFactorAuth: false,
      maintenanceMode: false,
    },
    payments: {
      enablePayments: true,
      currency: 'MAD',
      taxRate: 20,
      commissionRate: 5,
      enableRefunds: true,
      autoApproveRefunds: false,
      paymentMethods: {
        creditCard: true,
        bankTransfer: true,
        cashOnDelivery: false,
      },
    },
    appearance: {
      primaryColor: '#059669',
      secondaryColor: '#0D9488',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      customCSS: '',
      enableDarkMode: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.settings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.settings,
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      if (error.response?.status !== 404) {
        toast.error('Erreur lors du chargement des paramètres');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/settings`,
        { settings },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: 'general', name: 'Général', icon: CogIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Sécurité', icon: ShieldCheckIcon },
    { id: 'payments', name: 'Paiements', icon: CurrencyDollarIcon },
    { id: 'appearance', name: 'Apparence', icon: PaintBrushIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">Configuration de la plateforme Holistic.ma</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={saveSettings}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Sauvegarde...</span>
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              <span>Sauvegarder</span>
            </>
          )}
        </motion.button>
      </motion.div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings.general} updateSetting={updateSetting} />
          )}
          {activeTab === 'email' && (
            <EmailSettings settings={settings.email} updateSetting={updateSetting} />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings settings={settings.notifications} updateSetting={updateSetting} />
          )}
          {activeTab === 'security' && (
            <SecuritySettings settings={settings.security} updateSetting={updateSetting} />
          )}
          {activeTab === 'payments' && (
            <PaymentSettings settings={settings.payments} updateSetting={updateSetting} />
          )}
          {activeTab === 'appearance' && (
            <AppearanceSettings settings={settings.appearance} updateSetting={updateSetting} />
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings Component
const GeneralSettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom du site</label>
        <input
          type="text"
          value={settings.siteName}
          onChange={e => updateSetting('general', 'siteName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email de contact</label>
        <input
          type="email"
          value={settings.contactEmail}
          onChange={e => updateSetting('general', 'contactEmail', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
        <input
          type="text"
          value={settings.phoneNumber}
          onChange={e => updateSetting('general', 'phoneNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
        <select
          value={settings.currency}
          onChange={e => updateSetting('general', 'currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="MAD">MAD - Dirham Marocain</option>
          <option value="EUR">EUR - Euro</option>
          <option value="USD">USD - Dollar Américain</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Description du site</label>
      <textarea
        value={settings.siteDescription}
        onChange={e => updateSetting('general', 'siteDescription', e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
      <textarea
        value={settings.address}
        onChange={e => updateSetting('general', 'address', e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  </div>
);

// Email Settings Component
const EmailSettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Configuration Email</h3>

    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex">
        <EnvelopeIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-yellow-800">Configuration SMTP</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Configurez votre serveur SMTP pour l'envoi d'emails automatiques.
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Serveur SMTP</label>
        <input
          type="text"
          value={settings.smtpHost}
          onChange={e => updateSetting('email', 'smtpHost', e.target.value)}
          placeholder="smtp.gmail.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Port SMTP</label>
        <input
          type="number"
          value={settings.smtpPort}
          onChange={e => updateSetting('email', 'smtpPort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
        <input
          type="text"
          value={settings.smtpUser}
          onChange={e => updateSetting('email', 'smtpUser', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
        <input
          type="password"
          value={settings.smtpPassword}
          onChange={e => updateSetting('email', 'smtpPassword', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'expéditeur</label>
        <input
          type="text"
          value={settings.emailFromName}
          onChange={e => updateSetting('email', 'emailFromName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email de l'expéditeur
        </label>
        <input
          type="email"
          value={settings.emailFromAddress}
          onChange={e => updateSetting('email', 'emailFromAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div className="flex items-center">
      <input
        type="checkbox"
        id="smtpSecure"
        checked={settings.smtpSecure}
        onChange={e => updateSetting('email', 'smtpSecure', e.target.checked)}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
      />
      <label htmlFor="smtpSecure" className="ml-2 block text-sm text-gray-900">
        Utiliser une connexion sécurisée (TLS)
      </label>
    </div>
  </div>
);

// Notification Settings Component
const NotificationSettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Paramètres de notifications</h3>

    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-800">Notifications administrateur</h4>

      {[
        { key: 'adminNotifyNewUser', label: 'Nouveau utilisateur enregistré' },
        { key: 'adminNotifyNewOrder', label: 'Nouvelle commande' },
        { key: 'adminNotifyNewBooking', label: 'Nouvelle réservation' },
        { key: 'adminNotifyNewProfessional', label: 'Nouveau professionnel inscrit' },
      ].map(item => (
        <div key={item.key} className="flex items-center">
          <input
            type="checkbox"
            id={item.key}
            checked={settings[item.key]}
            onChange={e => updateSetting('notifications', item.key, e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={item.key} className="ml-2 block text-sm text-gray-900">
            {item.label}
          </label>
        </div>
      ))}
    </div>

    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-800">Notifications clients</h4>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="clientNotifyOrderStatus"
          checked={settings.clientNotifyOrderStatus}
          onChange={e =>
            updateSetting('notifications', 'clientNotifyOrderStatus', e.target.checked)
          }
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="clientNotifyOrderStatus" className="ml-2 block text-sm text-gray-900">
          Notifier les changements de statut des commandes
        </label>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-800">Notifications professionnels</h4>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="professionalNotifyNewBooking"
          checked={settings.professionalNotifyNewBooking}
          onChange={e =>
            updateSetting('notifications', 'professionalNotifyNewBooking', e.target.checked)
          }
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="professionalNotifyNewBooking" className="ml-2 block text-sm text-gray-900">
          Notifier les nouvelles réservations
        </label>
      </div>
    </div>
  </div>
);

// Security Settings Component
const SecuritySettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Paramètres de sécurité</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timeout de session (heures)
        </label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={e => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
          min="1"
          max="168"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tentatives de connexion max
        </label>
        <input
          type="number"
          value={settings.maxLoginAttempts}
          onChange={e => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
          min="3"
          max="10"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Longueur minimale du mot de passe
        </label>
        <input
          type="number"
          value={settings.passwordMinLength}
          onChange={e => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
          min="6"
          max="20"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div className="space-y-4">
      {[
        { key: 'twoFactorAuth', label: 'Authentification à deux facteurs' },
        { key: 'requirePasswordChange', label: 'Forcer le changement de mot de passe périodique' },
        { key: 'maintenanceMode', label: 'Mode maintenance' },
      ].map(item => (
        <div key={item.key} className="flex items-center">
          <input
            type="checkbox"
            id={item.key}
            checked={settings[item.key]}
            onChange={e => updateSetting('security', item.key, e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={item.key} className="ml-2 block text-sm text-gray-900">
            {item.label}
          </label>
        </div>
      ))}
    </div>
  </div>
);

// Payment Settings Component
const PaymentSettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Paramètres de paiement</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Taux de TVA (%)</label>
        <input
          type="number"
          value={settings.taxRate}
          onChange={e => updateSetting('payments', 'taxRate', parseFloat(e.target.value))}
          min="0"
          max="100"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commission plateforme (%)
        </label>
        <input
          type="number"
          value={settings.commissionRate}
          onChange={e => updateSetting('payments', 'commissionRate', parseFloat(e.target.value))}
          min="0"
          max="50"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-800">Options de paiement</h4>

      {[
        { key: 'enablePayments', label: 'Activer les paiements en ligne' },
        { key: 'enableRefunds', label: 'Autoriser les remboursements' },
        { key: 'autoApproveRefunds', label: 'Approuver automatiquement les remboursements' },
      ].map(item => (
        <div key={item.key} className="flex items-center">
          <input
            type="checkbox"
            id={item.key}
            checked={settings[item.key]}
            onChange={e => updateSetting('payments', item.key, e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={item.key} className="ml-2 block text-sm text-gray-900">
            {item.label}
          </label>
        </div>
      ))}
    </div>

    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-800">Méthodes de paiement</h4>

      {[
        { key: 'creditCard', label: 'Carte de crédit' },
        { key: 'bankTransfer', label: 'Virement bancaire' },
        { key: 'cashOnDelivery', label: 'Paiement à la livraison' },
      ].map(item => (
        <div key={item.key} className="flex items-center">
          <input
            type="checkbox"
            id={`payment_${item.key}`}
            checked={settings.paymentMethods[item.key]}
            onChange={e =>
              updateSetting('payments', 'paymentMethods', {
                ...settings.paymentMethods,
                [item.key]: e.target.checked,
              })
            }
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor={`payment_${item.key}`} className="ml-2 block text-sm text-gray-900">
            {item.label}
          </label>
        </div>
      ))}
    </div>
  </div>
);

// Appearance Settings Component
const AppearanceSettings = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Paramètres d'apparence</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur primaire</label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={settings.primaryColor}
            onChange={e => updateSetting('appearance', 'primaryColor', e.target.value)}
            className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={settings.primaryColor}
            onChange={e => updateSetting('appearance', 'primaryColor', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur secondaire</label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={settings.secondaryColor}
            onChange={e => updateSetting('appearance', 'secondaryColor', e.target.value)}
            className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={settings.secondaryColor}
            onChange={e => updateSetting('appearance', 'secondaryColor', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">URL du logo</label>
        <input
          type="text"
          value={settings.logoUrl}
          onChange={e => updateSetting('appearance', 'logoUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">URL du favicon</label>
        <input
          type="text"
          value={settings.faviconUrl}
          onChange={e => updateSetting('appearance', 'faviconUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">CSS personnalisé</label>
      <textarea
        value={settings.customCSS}
        onChange={e => updateSetting('appearance', 'customCSS', e.target.value)}
        rows={6}
        placeholder="/* Ajoutez votre CSS personnalisé ici */"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
      />
    </div>

    <div className="flex items-center">
      <input
        type="checkbox"
        id="enableDarkMode"
        checked={settings.enableDarkMode}
        onChange={e => updateSetting('appearance', 'enableDarkMode', e.target.checked)}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
      />
      <label htmlFor="enableDarkMode" className="ml-2 block text-sm text-gray-900">
        Activer le mode sombre
      </label>
    </div>
  </div>
);

export default AdminSettingsPage;
