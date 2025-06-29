import {
  CameraIcon,
  PencilIcon,
  MapPinIcon,
  StarIcon,
  EyeIcon as _EyeIcon,
  UserGroupIcon as _UserGroupIcon,
  CalendarDaysIcon as _CalendarDaysIcon,
  ShoppingBagIcon as _ShoppingBagIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as _HeartIconSolid } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import MapPicker from '../components/Common/MapPicker';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/axiosConfig';

const ProfessionalProfilePage = () => {
  const { user, _updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [professionalData, setProfessionalData] = useState(null);
  const [_activeTab, _setActiveTab] = useState('profile');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showProfilePhotoUpload, setShowProfilePhotoUpload] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    _reset,
    setValue,
    watch,
  } = useForm();

  // Watch address value
  const currentAddress = watch('address', '');

  // Load professional data
  useEffect(() => {
    if (user?.role === 'professional') {
      loadProfessionalData();
    }
  }, [user]);

  const loadProfessionalData = async () => {
    try {
      setIsLoading(true);

      // Tenter de charger les données depuis l'API
      try {
        const response = await apiService.getMyProfessionalProfile();
        setProfessionalData(response.professional);

        // Load profile photo if exists
        if (response.professional.profilePhoto) {
          // Check if URL is relative and needs to be prepended with API URL
          const photoUrl = response.professional.profilePhoto.startsWith('http')
            ? response.professional.profilePhoto
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.professional.profilePhoto}`;

          setProfilePhoto(photoUrl);
        }

        // Populate form with existing data
        Object.keys(response.professional).forEach(key => {
          if (key !== 'coverImages' && key !== 'businessHours' && key !== 'stats') {
            setValue(key, response.professional[key]);
          }
        });

        return; // Si l'API réussit, sortir de la fonction
      } catch (apiError) {
        console.error('Erreur API:', apiError);
        toast.error(
          'Impossible de charger les données du serveur. Utilisation des données de démonstration.'
        );
      }

      // Si l'API échoue, utiliser les données mockées
      const mockData = {
        title: 'Instructrice de Yoga & Méditation',
        description:
          "Passionnée par le bien-être Holistic, j'accompagne mes clients dans leur quête d'équilibre intérieur depuis plus de 8 ans. Spécialisée en Hatha Yoga, Vinyasa et méditation mindfulness, je propose des séances personnalisées adaptées à tous les niveaux.\n\nMon approche combine les techniques traditionnelles du yoga avec des méthodes modernes de relaxation et de gestion du stress. Chaque séance est une invitation à reconnecter avec votre corps et votre esprit.",
        address: '123 Avenue Mohammed V, Rabat 10000, Maroc',
        coverImages: [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        activities: ['Yoga', 'Méditation', 'Relaxation', 'Bien-être'],
        businessType: 'yoga',
        rating: { average: 4.8, totalReviews: 127 },
        contactInfo: {
          phone: '+212 6 12 34 56 78',
          website: 'www.yoga-wellness.ma',
          socialMedia: {
            instagram: '@yoga_wellness_rabat',
            facebook: 'YogaWellnessRabat',
          },
        },
        businessHours: [
          { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
          { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
          { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
          { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
          { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
          { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
          { day: 'sunday', isOpen: false },
        ],
        stats: {
          totalSessions: 342,
          totalClients: 89,
          productsCount: 12,
          upcomingSessions: 8,
        },
        isVerified: true,
        isActive: true,
      };

      setProfessionalData(mockData);

      // Populate form with existing data
      Object.keys(mockData).forEach(key => {
        if (key !== 'coverImages' && key !== 'businessHours' && key !== 'stats') {
          setValue(key, mockData[key]);
        }
      });
    } catch (error) {
      console.error('Error loading professional data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async data => {
    try {
      setIsLoading(true);

      // Préparer les données à envoyer
      const updatedData = {
        ...data,
        // Assurer que les données sont au format attendu par la base de données
        businessName: data.businessName || data.title,
        businessType: data.businessType || 'other',
        contactInfo: {
          phone: data.phone || professionalData.contactInfo?.phone || '',
          email: user?.email || '',
          website: data.website || professionalData.contactInfo?.website || '',
        },
        businessAddress: {
          country: 'Morocco',
          city: data.city || professionalData.businessAddress?.city || '',
          street: data.street || professionalData.businessAddress?.street || '',
          coordinates: {
            lat:
              data.businessAddress?.coordinates?.lat ||
              professionalData.businessAddress?.coordinates?.lat ||
              null,
            lng:
              data.businessAddress?.coordinates?.lng ||
              professionalData.businessAddress?.coordinates?.lng ||
              null,
          },
        },
        // S'assurer que l'adresse est bien envoyée et n'est pas réinitialisée à "À définir"
        address:
          data.address && data.address !== 'À définir'
            ? data.address
            : professionalData.address !== 'À définir'
              ? professionalData.address
              : 'À définir',
      };

      // Tenter de mettre à jour les données via l'API
      try {
        const response = await apiService.updateProfessionalProfile(updatedData);

        // Fusionner les données de la réponse avec les données existantes pour s'assurer
        // que tous les champs nécessaires pour l'interface sont présents
        const mergedData = {
          ...professionalData,
          ...response.professional,
          contactInfo: {
            ...professionalData.contactInfo,
            ...response.professional.contactInfo,
          },
          businessAddress: {
            ...professionalData.businessAddress,
            ...response.professional.businessAddress,
          },
          // Conserver les données qui pourraient ne pas être dans la réponse API
          stats: professionalData.stats,
          coverImages: response.professional.coverImages || professionalData.coverImages,
          businessHours: response.professional.businessHours || professionalData.businessHours,
        };

        setProfessionalData(mergedData);
        toast.success('Profil mis à jour avec succès !');
        setIsEditing(false);
        return;
      } catch (apiError) {
        console.error('Erreur API lors de la mise à jour:', apiError);
        toast.error(
          'Impossible de mettre à jour les données sur le serveur. Simulation locale uniquement.'
        );
      }

      // Si l'API échoue, simuler la mise à jour localement
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfessionalData(prev => ({
        ...prev,
        ...updatedData,
        contactInfo: {
          ...prev.contactInfo,
          ...updatedData.contactInfo,
        },
        businessAddress: {
          ...prev.businessAddress,
          ...updatedData.businessAddress,
        },
      }));
      toast.success('Profil mis à jour localement (mode démo)');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (file) {
      // Simulate image upload - replace with actual upload logic
      const reader = new FileReader();
      reader.onload = e => {
        const newImage = e.target.result;
        setProfessionalData(prev => ({
          ...prev,
          coverImages: [...(prev.coverImages || []), newImage],
        }));
        toast.success('Image ajoutée avec succès !');
      };
      reader.readAsDataURL(file);
    }
  };

  const _removeImage = index => {
    setProfessionalData(prev => ({
      ...prev,
      coverImages: prev.coverImages.filter((_, i) => i !== index),
    }));
    toast.success('Image supprimée');
  };

  const generateMapLink = address => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  };

  // Handle address selection from map
  const handleAddressSelected = ({ address, coordinates }) => {
    setValue('address', address);
    // Store coordinates in businessAddress
    setValue('businessAddress.coordinates.lat', coordinates.lat);
    setValue('businessAddress.coordinates.lng', coordinates.lng);

    setShowMapPicker(false);
    toast.success('Adresse sélectionnée avec succès');
  };

  // Render form with updated address field
  const renderAddressField = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
        <div className="flex space-x-2">
          <div className="flex-grow">
            <input
              type="text"
              {...register('address', { required: 'Ce champ est requis' })}
              className="input-field"
              placeholder="Votre adresse complète"
              readOnly
            />
            {errors.address && <p className="error-message">{errors.address.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <MapPinIcon className="h-5 w-5 mr-2 text-primary-600" />
            Carte
          </button>
        </div>
      </div>
    );
  };

  const handleProfilePhotoUpload = async event => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsLoading(true);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('profilePhoto', file);

        // Upload profile photo to server
        const response = await apiService.uploadProfilePhoto(formData);

        if (response.success) {
          // Ensure the URL is absolute
          const photoUrl = response.photoUrl.startsWith('http')
            ? response.photoUrl
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.photoUrl}`;

          setProfilePhoto(photoUrl);

          // If the response includes the professional data, update it completely
          if (response.professional) {
            setProfessionalData(response.professional);
          } else {
            // Otherwise just update the photo URL
            setProfessionalData(prev => ({
              ...prev,
              profilePhoto: response.photoUrl,
            }));
          }

          toast.success('Photo de profil mise à jour avec succès!');
        } else {
          toast.error("Erreur lors de l'upload de la photo");
        }
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        toast.error("Erreur lors de l'upload de la photo");

        // Fallback for demo/development - use local FileReader
        const reader = new FileReader();
        reader.onload = e => {
          const newImage = e.target.result;
          setProfilePhoto(newImage);
          setProfessionalData(prev => ({
            ...prev,
            profilePhoto: newImage,
          }));
          toast.success('Photo de profil mise à jour (mode démo)');
        };
        reader.readAsDataURL(file);
      } finally {
        setIsLoading(false);
        setShowProfilePhotoUpload(false);
      }
    }
  };

  if (isLoading && !professionalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!professionalData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Profil Professionnel Introuvable</h1>
            <p className="mt-4 text-gray-500">Votre profil professionnel n'a pas pu être chargé.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec images de couverture */}
      <div className="relative">
        {/* Cover Images Carousel */}
        <div className="h-64 sm:h-80 lg:h-96 relative overflow-hidden">
          {professionalData.coverImages && professionalData.coverImages.length > 0 ? (
            <div className="relative h-full">
              <img
                src={professionalData.coverImages[0]}
                alt="Couverture"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

              {/* Image controls */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
                >
                  <PlusIcon className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
                >
                  <PencilIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Image indicators */}
              {professionalData.coverImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {professionalData.coverImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/60'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-gradient-lotus flex items-center justify-center">
              <button
                onClick={() => setShowImageUpload(true)}
                className="flex flex-col items-center text-white hover:text-white/80 transition-colors"
              >
                <CameraIcon className="h-12 w-12 mb-2" />
                <span className="text-lg font-medium">Ajouter une photo de couverture</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-lotus flex items-center justify-center shadow-xl border-4 border-white overflow-hidden cursor-pointer"
                    onClick={() => setShowProfilePhotoUpload(true)}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <CameraIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  {professionalData.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Title */}
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-lg text-white/90 mt-1">{professionalData.title}</p>
                  <div className="flex items-center mt-2">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-white/90">
                      {professionalData.rating.average} ({professionalData.rating.totalReviews}{' '}
                      avis)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button onClick={() => setIsEditing(!isEditing)} className="btn-primary">
                  <PencilIcon className="h-5 w-5 mr-2" />
                  {isEditing ? 'Annuler' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="lotus-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">À propos</h2>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre professionnel
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'Ce champ est requis' })}
                      className="input-field"
                      placeholder="Ex: Instructrice de Yoga & Méditation"
                    />
                    {errors.title && <p className="error-message">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={5}
                      {...register('description')}
                      className="input-field"
                      placeholder="Décrivez votre expertise, votre approche..."
                    />
                    {errors.description && (
                      <p className="error-message">{errors.description.message}</p>
                    )}
                  </div>

                  {renderAddressField()}

                  <div className="flex space-x-3">
                    <button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? <LoadingSpinner size="small" className="mr-2" /> : null}
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {professionalData.description}
                  </p>

                  {/* Activities Tags */}
                  <div className="flex flex-wrap gap-2">
                    {professionalData.activities?.map((activity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Address & Map */}
            <div className="lotus-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Localisation</h2>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-6 w-6 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700 mb-3">{professionalData.address}</p>

                  {/* Show a small preview map if coordinates are available */}
                  {professionalData.businessAddress?.coordinates?.lat &&
                    professionalData.businessAddress?.coordinates?.lng && (
                      <div className="mt-3 mb-3">
                        <div
                          id="map-preview"
                          className="h-48 w-full rounded-lg border border-gray-200 overflow-hidden cursor-pointer"
                          onClick={() => setShowMapPicker(true)}
                        >
                          <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${professionalData.businessAddress.coordinates.lat},${professionalData.businessAddress.coordinates.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${professionalData.businessAddress.coordinates.lat},${professionalData.businessAddress.coordinates.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBPO-s_mQAKrAJz3oa4IeRlFVA1uSKOYDU'}`}
                            alt="Carte de localisation"
                            className="w-full h-full object-cover"
                            onError={e => {
                              try {
                                // First fallback: OpenStreetMap if Google Maps fails
                                e.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${professionalData.businessAddress.coordinates.lng - 0.01},${professionalData.businessAddress.coordinates.lat - 0.01},${professionalData.businessAddress.coordinates.lng + 0.01},${professionalData.businessAddress.coordinates.lat + 0.01}&layer=mapnik&marker=${professionalData.businessAddress.coordinates.lat},${professionalData.businessAddress.coordinates.lng}`;
                                e.target.style.height = '100%';
                                e.target.style.width = '100%';

                                // Add a second onError handler for when OpenStreetMap also fails
                                e.target.onerror = () => {
                                  // Clear the container
                                  const mapContainer = document.getElementById('map-preview');
                                  if (mapContainer) {
                                    mapContainer.innerHTML = '';
                                    mapContainer.className =
                                      'h-48 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center p-4';

                                    // Add map icon with distinctive purple color
                                    const mapIcon = document.createElement('div');
                                    mapIcon.innerHTML =
                                      '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';

                                    // Create a clean address display
                                    const addressContainer = document.createElement('div');
                                    addressContainer.className = 'w-full';

                                    // Add the address in a nice input-like container
                                    const addressDisplay = document.createElement('div');
                                    addressDisplay.className =
                                      'w-full p-2 bg-white border border-gray-300 rounded-md text-center text-gray-700 shadow-sm';

                                    // Get the current address from the form rather than using professionalData
                                    const currentAddress = watch('address');
                                    addressDisplay.textContent =
                                      currentAddress || professionalData.address || 'À définir';

                                    // Put it all together
                                    addressContainer.appendChild(addressDisplay);
                                    mapContainer.appendChild(mapIcon);
                                    mapContainer.appendChild(addressContainer);
                                  }
                                };
                              } catch (err) {
                                console.error('Error setting map fallback:', err);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                  <a
                    href={generateMapLink(professionalData.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mr-4"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Voir sur Google Maps
                  </a>

                  <button
                    onClick={() => setShowMapPicker(true)}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Modifier la localisation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="lotus-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-700">
                    {professionalData.stats.totalSessions}
                  </div>
                  <div className="text-xs text-gray-600">Sessions</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-700">
                    {professionalData.stats.totalClients}
                  </div>
                  <div className="text-xs text-gray-600">Clients</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {professionalData.stats.productsCount}
                  </div>
                  <div className="text-xs text-gray-600">Produits</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {professionalData.stats.upcomingSessions}
                  </div>
                  <div className="text-xs text-gray-600">À venir</div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lotus-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{professionalData.contactInfo.phone}</span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{user?.email}</span>
                </div>
                {professionalData.contactInfo.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <a
                      href={`https://${professionalData.contactInfo.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {professionalData.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div className="lotus-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires</h3>
              <div className="space-y-2">
                {professionalData.businessHours?.map(schedule => (
                  <div key={schedule.day} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{dayNames[schedule.day]}</span>
                    <span className="text-gray-600">
                      {schedule.isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : 'Fermé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter une image</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-700 font-medium">
                    Choisir un fichier
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">PNG, JPG jusqu'à 10MB</p>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setShowImageUpload(false)} className="flex-1 btn-secondary">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sélectionner votre adresse</h3>
              <button
                onClick={() => setShowMapPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <MapPicker
              initialAddress={currentAddress}
              initialCoordinates={professionalData?.businessAddress?.coordinates || null}
              onAddressSelected={handleAddressSelected}
              height="500px"
            />

            <div className="flex justify-end mt-4 space-x-3">
              <button onClick={() => setShowMapPicker(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Upload Modal */}
      {showProfilePhotoUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Changer votre photo de profil</h3>
              <button
                onClick={() => setShowProfilePhotoUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-700 font-medium">
                    Choisir un fichier
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">PNG, JPG jusqu'à 5MB</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProfilePhotoUpload(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProfilePage;
