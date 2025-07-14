import {
  BellIcon,
  CogIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import LoadingSpinner from '../../components/Common/LoadingSpinner';
import MapPicker from '../../components/Common/MapPicker';
import Modal from '../../components/Common/Modal';
import ProfessionalButton from '../../components/professional/ProfessionalButton';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/axiosConfig';
import { userAPI } from '../../utils/api';

const ProfessionalSettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [professionalData, setProfessionalData] = useState(null);
  const [businessAddress, setBusinessAddress] = useState({
    address: '',
    country: 'Morocco',
    city: '',
    street: '',
    coordinates: {
      lat: null,
      lng: null,
    },
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailBookings: true,
    emailMessages: true,
    emailMarketing: false,
    pushBookings: true,
    pushMessages: true,
    smsBookings: false,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors },
    setValue: setAccountValue,
  } = useForm();

  const {
    register: registerBusiness,
    handleSubmit: handleBusinessSubmit,
    formState: { errors: businessErrors },
    setValue: setBusinessValue,
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm();

  const loadProfessionalData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/professionals/user/${user.id}`);
      if (response.data.success) {
        const professional = response.data.professional;
        setProfessionalData(professional);

        // Set form values
        setAccountValue('firstName', user.firstName || '');
        setAccountValue('lastName', user.lastName || '');
        setAccountValue('email', user.email || '');
        setAccountValue('phone', professional.contactInfo?.phone || '');

        setBusinessValue('businessName', professional.businessName || '');
        setBusinessValue('businessType', professional.businessType || '');
        setBusinessValue('bio', professional.description || '');
        setBusinessValue('description', professional.description || '');
        setBusinessValue('website', professional.contactInfo?.website || '');

        // Set business address
        if (professional.businessAddress) {
          setBusinessAddress({
            address: professional.address || '',
            country: professional.businessAddress.country || 'Morocco',
            city: professional.businessAddress.city || '',
            street: professional.businessAddress.street || '',
            coordinates: professional.businessAddress.coordinates || { lat: null, lng: null },
          });
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error('Error loading professional data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setAccountValue, setBusinessValue]);

  const loadNotificationSettings = useCallback(async () => {
    try {
      const response = await apiService.get('/professionals/me/notifications');
      if (response.data.success) {
        setNotificationSettings(response.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Utiliser les paramètres par défaut en cas d'erreur
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'professional') {
      loadProfessionalData();
      loadNotificationSettings();
    }
  }, [user, loadProfessionalData, loadNotificationSettings]);

  const onAccountSubmit = async data => {
    try {
      setIsLoading(true);

      // Update user profile (firstName and lastName)
      const userResponse = await apiService.put('/users/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Update professional profile (phone)
      const professionalResponse = await apiService.put('/professionals/profile', {
        contactInfo: {
          ...professionalData.contactInfo,
          phone: data.phone,
        },
      });

      if (userResponse.data.success && professionalResponse.data.success) {
        setProfessionalData(professionalResponse.data.professional);
        // Update user in auth context
        updateUser({
          firstName: data.firstName,
          lastName: data.lastName,
        });
        toast.success('Informations personnelles mises à jour avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier les données du profil
  const checkProfileData = useCallback(async () => {
    try {
      const response = await apiService.get('/professionals/me/profile');
      return response.data.professional;
    } catch (error) {
      console.error('Erreur lors de la vérification du profil:', error);
      return null;
    }
  }, []);

  const onBusinessSubmit = async data => {
    try {
      setIsLoading(true);
      const updateData = {
        businessName: data.businessName,
        businessType: data.businessType,
        description: data.description || data.bio,
        address: businessAddress.address,
        businessAddress: {
          country: businessAddress.country,
          city: businessAddress.city,
          street: businessAddress.street,
          coordinates: businessAddress.coordinates,
        },
        contactInfo: {
          ...professionalData.contactInfo,
          website: data.website,
        },
      };

      const response = await apiService.put('/professionals/profile', updateData);

      if (response.data.success) {
        setProfessionalData(response.data.professional);
        toast.success("Informations d'entreprise mises à jour avec succès");

        // Vérifier les données après la mise à jour
        setTimeout(async () => {
          const updatedProfile = await checkProfileData();
        }, 1000);

        // Recharger les données pour s'assurer que tout est à jour
        loadProfessionalData();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating business:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async data => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Mot de passe modifié avec succès');
      resetPasswordForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Erreur lors de la modification du mot de passe'
      );
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleNotificationChange = async (setting, value) => {
    try {
      const updatedSettings = { ...notificationSettings, [setting]: value };
      setNotificationSettings(updatedSettings);

      await apiService.put('/professionals/me/notifications', updatedSettings);
      toast.success('Préférences de notification mises à jour');
    } catch (error) {
      // Revert changes if API call fails
      setNotificationSettings(prev => ({ ...prev, [setting]: !value }));
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating notifications:', error);
    }
  };

  // Function to extract city and street from address
  const extractAddressComponents = fullAddress => {
    try {
      // Split the address by commas
      const parts = fullAddress.split(',').map(part => part.trim());

      // The first part is usually the street
      const street = parts[0] || '';

      // Look for the city (usually the second part)
      let city = '';
      if (parts.length > 1) {
        city = parts[1];
      }

      return { street, city };
    } catch (error) {
      console.error('Error extracting address components:', error);
      return { street: '', city: '' };
    }
  };

  const handleAddressSelected = data => {
    const { street, city } = extractAddressComponents(data.address);

    setBusinessAddress(prev => ({
      ...prev,
      address: data.address,
      city: city || prev.city,
      street: street || prev.street,
      coordinates: data.coordinates,
    }));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.email) {
      toast.error('Le texte de confirmation ne correspond pas à votre email');
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await userAPI.deleteAccount();

      if (response.success) {
        toast.success('Votre compte a été supprimé avec succès');

        // Supprimer toutes les données locales
        localStorage.clear();
        sessionStorage.clear();

        // Rediriger immédiatement vers la page de login avec remplacement complet
        // Cela empêche de revenir en arrière avec le bouton précédent
        window.location.replace('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du compte');
      console.error('Error deleting account:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { id: 'account', name: 'Compte', icon: UserIcon },
    { id: 'business', name: 'Entreprise', icon: BuildingOfficeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Sécurité', icon: ShieldCheckIcon },
    // { id: 'billing', name: 'Facturation', icon: CreditCardIcon },
    { id: 'privacy', name: 'Confidentialité', icon: KeyIcon },
  ];

  if (isLoading && !professionalData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center mb-4">
          <CogIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          Gérez vos paramètres de compte et préférences professionnelles
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          {/* Mobile tabs - horizontal scroll */}
          <div className="sm:hidden">
            <div className="flex overflow-x-auto scrollbar-hide px-4 py-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap mr-2 min-w-fit ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 border border-primary-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    } transition-all duration-200`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden sm:flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Informations personnelles" icon={UserIcon}>
                {/* Tous les champs sont modifiables sauf l'email */}
                <form
                  onSubmit={handleAccountSubmit(onAccountSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        {...registerAccount('firstName', { required: 'Le prénom est requis' })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      {accountErrors.firstName && (
                        <p className="text-red-600 text-sm mt-1">
                          {accountErrors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        {...registerAccount('lastName', { required: 'Le nom est requis' })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      {accountErrors.lastName && (
                        <p className="text-red-600 text-sm mt-1">
                          {accountErrors.lastName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        {...registerAccount('email', { required: "L'email est requis" })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm sm:text-base"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Pour modifier votre email, contactez le support
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        {...registerAccount('phone')}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <ProfessionalButton type="submit" variant="primary" disabled={isLoading}>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </ProfessionalButton>
                  </div>
                </form>
              </ProfessionalCard>
            </motion.div>
          )}

          {/* Business Settings */}
          {activeTab === 'business' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Informations d'entreprise" icon={BuildingOfficeIcon}>
                <form
                  onSubmit={handleBusinessSubmit(onBusinessSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        {...registerBusiness('businessName', {
                          required: "Le nom d'entreprise est requis",
                        })}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      {businessErrors.businessName && (
                        <p className="text-red-600 text-sm mt-1">
                          {businessErrors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type d'entreprise
                      </label>
                      <select
                        {...registerBusiness('businessType')}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="coach">Coach</option>
                        <option value="therapist">Thérapeute</option>
                        <option value="nutritionist">Nutritionniste</option>
                        <option value="psychologist">Psychologue</option>
                        <option value="fitness">Fitness</option>
                        <option value="yoga">Yoga</option>
                        <option value="meditation">Méditation</option>
                        <option value="massage">Massage</option>
                        <option value="acupuncture">Acupuncture</option>
                        <option value="naturopathy">Naturopathie</option>
                        <option value="osteopathy">Ostéopathie</option>
                        <option value="beauty">Beauté</option>
                        <option value="wellness">Bien-être</option>
                        <option value="reiki">Reiki</option>
                        <option value="hypnotherapy">Hypnothérapie</option>
                        <option value="aromatherapy">Aromathérapie</option>
                        <option value="reflexology">Réflexologie</option>
                        <option value="sophrology">Sophrologie</option>
                        <option value="spa">Spa</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site web
                      </label>
                      <input
                        type="url"
                        {...registerBusiness('website')}
                        placeholder="https://monsite.com"
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <div className="space-y-4">
                        <div className="h-64 sm:h-80">
                          <MapPicker
                            initialAddress={businessAddress.address}
                            initialCoordinates={
                              businessAddress.coordinates.lat ? businessAddress.coordinates : null
                            }
                            onAddressSelected={handleAddressSelected}
                            height="100%"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pays
                            </label>
                            <input
                              type="text"
                              value={businessAddress.country}
                              onChange={e =>
                                setBusinessAddress(prev => ({ ...prev, country: e.target.value }))
                              }
                              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ville
                            </label>
                            <input
                              type="text"
                              value={businessAddress.city}
                              onChange={e =>
                                setBusinessAddress(prev => ({ ...prev, city: e.target.value }))
                              }
                              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rue
                            </label>
                            <input
                              type="text"
                              value={businessAddress.street}
                              onChange={e =>
                                setBusinessAddress(prev => ({ ...prev, street: e.target.value }))
                              }
                              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            />
                          </div>
                        </div>
                        {businessAddress.coordinates.lat && businessAddress.coordinates.lng && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">
                              Coordonnées: {businessAddress.coordinates.lat.toFixed(6)},{' '}
                              {businessAddress.coordinates.lng.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        {...registerBusiness('description')}
                        rows={6}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Décrivez votre entreprise, vos services et parlez de votre parcours..."
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Cette description apparaîtra sur votre profil public et sera visible par les
                        clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <ProfessionalButton type="submit" variant="primary" disabled={isLoading}>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </ProfessionalButton>
                  </div>
                </form>
              </ProfessionalCard>
            </motion.div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Préférences de notification" icon={BellIcon}>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                      Notifications par email
                    </h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm sm:text-base">
                            Nouvelles réservations
                          </p>
                          <p className="text-sm text-gray-500">
                            Recevoir un email pour chaque nouvelle réservation
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailBookings}
                            onChange={e =>
                              handleNotificationChange('emailBookings', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm sm:text-base">
                            Messages clients
                          </p>
                          <p className="text-sm text-gray-500">
                            Recevoir un email pour chaque nouveau message
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailMessages}
                            onChange={e =>
                              handleNotificationChange('emailMessages', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm sm:text-base">
                            Marketing
                          </p>
                          <p className="text-sm text-gray-500">
                            Recevoir des conseils et promotions
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailMarketing}
                            onChange={e =>
                              handleNotificationChange('emailMarketing', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                      Notifications push
                    </h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm sm:text-base">
                            Réservations
                          </p>
                          <p className="text-sm text-gray-500">
                            Notifications instantanées pour les réservations
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushBookings}
                            onChange={e =>
                              handleNotificationChange('pushBookings', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm sm:text-base">Messages</p>
                          <p className="text-sm text-gray-500">
                            Notifications instantanées pour les messages
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushMessages}
                            onChange={e =>
                              handleNotificationChange('pushMessages', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </ProfessionalCard>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Sécurité du compte" icon={ShieldCheckIcon}>
                <form
                  onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...registerPassword('currentPassword', {
                          required: 'Le mot de passe actuel est requis',
                        })}
                        className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        {...registerPassword('newPassword', {
                          required: 'Le nouveau mot de passe est requis',
                          minLength: {
                            value: 6,
                            message: 'Le mot de passe doit contenir au moins 6 caractères',
                          },
                        })}
                        className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerPassword('confirmPassword', {
                          required: 'La confirmation est requise',
                        })}
                        className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <ProfessionalButton type="submit" variant="primary" disabled={isLoading}>
                      {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
                    </ProfessionalButton>
                  </div>
                </form>
              </ProfessionalCard>
            </motion.div>
          )}

          {/* Billing Settings */}
          {/* {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Facturation et paiements" icon={CreditCardIcon}>
                <div className="text-center py-12">
                  <CreditCardIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gestion de la facturation
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Cette section sera bientôt disponible pour gérer vos moyens de paiement et vos
                    factures.
                  </p>
                  <ProfessionalButton variant="secondary" disabled>
                    Bientôt disponible
                  </ProfessionalButton>
                </div>
              </ProfessionalCard>
            </motion.div>
          )} */}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCard title="Confidentialité et données" icon={KeyIcon}>
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Protection de vos données</h4>
                    <p className="text-sm text-yellow-700">
                      Nous prenons la protection de vos données très au sérieux. Consultez notre
                      politique de confidentialité pour plus d'informations.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                          Profil public
                        </h4>
                        <p className="text-sm text-gray-500">
                          Votre profil est visible par tous les utilisateurs
                        </p>
                      </div>
                      <ProfessionalButton variant="outline" size="sm">
                        Gérer
                      </ProfessionalButton>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                          Données d'utilisation
                        </h4>
                        <p className="text-sm text-gray-500">
                          Données collectées pour améliorer l'expérience
                        </p>
                      </div>
                      <ProfessionalButton variant="outline" size="sm">
                        Paramètres
                      </ProfessionalButton>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-red-200 rounded-lg bg-red-50 gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900 text-sm sm:text-base">
                          Supprimer le compte
                        </h4>
                        <p className="text-sm text-red-700">
                          Suppression définitive de votre compte et données
                        </p>
                      </div>
                      <ProfessionalButton
                        variant="danger"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Supprimer
                      </ProfessionalButton>
                    </div>
                  </div>
                </div>
              </ProfessionalCard>

              {/* Delete Account Confirmation Modal */}
              <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Supprimer votre compte"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 font-medium text-sm sm:text-base">
                      Cette action est irréversible
                    </p>
                  </div>

                  <p className="text-gray-700 text-sm sm:text-base">
                    La suppression de votre compte entraînera la perte définitive de toutes vos
                    données, y compris votre profil, vos réservations et votre historique.
                  </p>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pour confirmer, veuillez saisir votre email :{' '}
                      <span className="font-bold break-all">{user?.email}</span>
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Votre email"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <ProfessionalButton
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                      className="w-full sm:w-auto"
                    >
                      Annuler
                    </ProfessionalButton>
                    <ProfessionalButton
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading || deleteConfirmText !== user?.email}
                      className="w-full sm:w-auto"
                    >
                      {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                    </ProfessionalButton>
                  </div>
                </div>
              </Modal>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSettingsPage;
