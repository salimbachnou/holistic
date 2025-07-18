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
  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [businessHours, setBusinessHours] = useState([]);
  const [coverImages, setCoverImages] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    _reset,
    setValue,
    watch,
  } = useForm();

  // Fonction pour forcer le rechargement des images (éviter le cache)
  const forceImageReload = imageUrl => {
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      return `${imageUrl}?t=${Date.now()}`;
    }
    return imageUrl;
  };

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
            : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${response.professional.profilePhoto}`;

          setProfilePhoto(photoUrl);
        }

        // Initialize business hours and cover images
        setBusinessHours(response.professional.businessHours || []);
        setCoverImages(response.professional.coverImages || []);

        // Load additional data from specific endpoints
        try {
          // Load business hours
          const businessHoursResponse = await apiService.getBusinessHours();
          if (businessHoursResponse.success) {
            setBusinessHours(businessHoursResponse.businessHours || []);
          }
        } catch (hoursError) {
          console.error('Error loading business hours:', hoursError);
        }

        // Load cover images from dedicated endpoint
        try {
          const coverImagesResponse = await apiService.getCoverImages();
          if (coverImagesResponse.success) {
            // Assurer que les URLs sont cohérentes (complètes pour l'affichage)
            const normalizedImages = (coverImagesResponse.coverImages || []).map(img => {
              if (img.startsWith('/uploads/')) {
                return `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${img}`;
              }
              return img;
            });

            setCoverImages(normalizedImages);
            // Update professional data with fresh cover images
            setProfessionalData(prev => ({
              ...prev,
              coverImages: normalizedImages,
            }));
          }
        } catch (coverError) {
          console.error('Error loading cover images:', coverError);
        }

        // Populate form with existing data
        Object.keys(response.professional).forEach(key => {
          if (key === 'contactInfo') {
            setValue('website', response.professional.contactInfo?.website || '');
          } else if (
            key !== 'coverImages' &&
            key !== 'businessHours' &&
            key !== 'stats' &&
            key !== 'businessAddress'
          ) {
            setValue(key, response.professional[key]);
          }
        });

        // Handle nested businessAddress
        if (response.professional.businessAddress) {
          setValue('businessAddress.street', response.professional.businessAddress.street || '');
          setValue('businessAddress.city', response.professional.businessAddress.city || '');
          setValue(
            'businessAddress.coordinates.lat',
            response.professional.businessAddress.coordinates?.lat || null
          );
          setValue(
            'businessAddress.coordinates.lng',
            response.professional.businessAddress.coordinates?.lng || null
          );
        }

        return; // Si l'API réussit, sortir de la fonction
      } catch (apiError) {
        console.error('Erreur API:', apiError);
        toast.error(
          'Impossible de charger les données du serveur. Utilisation des données de démonstration.'
        );
      }

      // Si l'API échoue, utiliser les données réelles basées sur la structure de la base de données
      const mockData = {
        title: 'Professionnel du Bien-être',
        description: 'Spécialisé dans le bien-être holistique et les thérapies naturelles.',
        address: user?.address || 'Adresse à définir',
        coverImages: [],
        activities: [],
        categories: [],
        businessType: 'wellness',
        businessName: 'Centre de Bien-être',
        businessAddress: {
          street: '',
          city: '',
          country: 'Morocco',
          coordinates: {
            lat: null,
            lng: null,
          },
        },
        contactInfo: {
          phone: user?.phone || '',
          website: '',
          socialMedia: {},
        },
        rating: {
          average: 0,
          totalReviews: 0,
        },
        subscription: {
          plan: 'basic',
          isActive: true,
        },
        isVerified: user?.isVerified || false,
        isActive: true,
        paymentEnabled: false,
        bookingMode: 'auto',
        certifications: [],
        services: [],
        businessHours: [],
        stats: {
          totalSessions: 0,
          totalClients: 0,
          productsCount: 0,
          upcomingSessions: 0,
        },
      };

      setProfessionalData(mockData);

      // Initialize business hours and cover images
      setBusinessHours(mockData.businessHours || []);
      setCoverImages(mockData.coverImages || []);

      // Populate form with existing data
      Object.keys(mockData).forEach(key => {
        if (key === 'contactInfo') {
          setValue('website', mockData.contactInfo?.website || '');
        } else if (
          key !== 'coverImages' &&
          key !== 'businessHours' &&
          key !== 'stats' &&
          key !== 'businessAddress'
        ) {
          setValue(key, mockData[key]);
        }
      });

      // Handle nested businessAddress
      if (mockData.businessAddress) {
        setValue('businessAddress.street', mockData.businessAddress.street || '');
        setValue('businessAddress.city', mockData.businessAddress.city || '');
        setValue(
          'businessAddress.coordinates.lat',
          mockData.businessAddress.coordinates?.lat || null
        );
        setValue(
          'businessAddress.coordinates.lng',
          mockData.businessAddress.coordinates?.lng || null
        );
      }
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

      // Préparer les données à envoyer selon la structure de la base de données
      const updatedData = {
        title: data.title,
        description: data.description,
        address:
          data.address && data.address !== 'À définir' ? data.address : professionalData.address,
        businessName: data.businessName || data.title,
        businessType: data.businessType || 'wellness',
        businessAddress: {
          street: data.businessAddress?.street || professionalData.businessAddress?.street || '',
          city: data.businessAddress?.city || professionalData.businessAddress?.city || '',
          country: 'Morocco',
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
        contactInfo: {
          phone: user?.phone || '',
          email: user?.email || '',
          website: data.website || '',
          socialMedia: professionalData.contactInfo?.socialMedia || {},
        },
      };

      // Tenter de mettre à jour les données via l'API
      try {
        const response = await apiService.updateProfessionalProfile(updatedData);

        // Fusionner les données de la réponse avec les données existantes
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
      setIsLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('coverImage', file);

      // Upload image to server
      apiService
        .uploadCoverImage(formData)
        .then(response => {
          if (response.success) {
            const newImageUrl = response.imageUrl;

            console.log('Image uploaded successfully:', {
              imageUrl: newImageUrl,
              fullImageUrl: response.fullImageUrl,
              filename: response.filename,
            });

            // Remplacer l'image de couverture (plus efficace)
            return apiService.replaceCoverImage(newImageUrl);
          } else {
            throw new Error('Upload failed');
          }
        })
        .then(response => {
          if (response.success) {
            // Update local state with the new images from server
            const updatedImages = response.coverImages || [];

            // Forcer le rechargement de l'image en ajoutant un timestamp pour éviter le cache
            const refreshedImages = updatedImages.map(img => forceImageReload(img));

            console.log('Cover image updated successfully:', {
              originalImages: updatedImages,
              refreshedImages: refreshedImages,
            });

            // Mettre à jour l'état avec les images rafraîchies
            setCoverImages(refreshedImages);
            setProfessionalData(prev => ({
              ...prev,
              coverImages: refreshedImages,
            }));

            toast.success('Image de couverture mise à jour avec succès !');
          } else {
            throw new Error('Failed to update cover image');
          }
        })
        .catch(error => {
          console.error('Error uploading cover image:', error);
          toast.error("Erreur lors de l'upload de l'image");

          // Fallback to local file reader for demo
          const reader = new FileReader();
          reader.onload = e => {
            const newImage = e.target.result;
            const updatedImages = [newImage]; // Single image
            setCoverImages(updatedImages);
            setProfessionalData(prev => ({
              ...prev,
              coverImages: updatedImages,
            }));
            toast.success('Image ajoutée avec succès (mode démo) !');
          };
          reader.readAsDataURL(file);
        })
        .finally(() => {
          setIsLoading(false);
          setShowImageUpload(false);
        });
    }
  };

  const removeImage = index => {
    const imageToRemove = coverImages[index];

    if (imageToRemove) {
      setIsLoading(true);

      // Convertir l'URL complète en URL relative si nécessaire et nettoyer les paramètres de timestamp
      let imageUrlToRemove = imageToRemove.startsWith('http')
        ? imageToRemove.replace(/^https?:\/\/[^/]+/, '')
        : imageToRemove;

      // Supprimer les paramètres de timestamp (ex: ?t=1752416154374) pour éviter les erreurs 404
      imageUrlToRemove = imageUrlToRemove.split('?')[0];

      console.log('Attempting to remove image:', imageToRemove);
      console.log('Converted URL for API:', imageUrlToRemove);
      console.log('Current cover images:', coverImages);

      // Remove the cover image from the professional profile
      apiService
        .removeCoverImage(imageUrlToRemove)
        .then(response => {
          if (response.success) {
            // Update local state with the new images from server
            const updatedImages = response.coverImages || [];
            console.log('Updated images from server:', updatedImages);

            setCoverImages(updatedImages);
            setProfessionalData(prev => ({
              ...prev,
              coverImages: updatedImages,
            }));
            toast.success('Image de couverture supprimée avec succès !');
          } else {
            throw new Error('Failed to remove cover image from profile');
          }
        })
        .catch(error => {
          console.error('Error removing cover image:', error);
          console.error('Error status:', error.response?.status);

          // Afficher l'erreur spécifique
          const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
          toast.error(`Erreur API: ${errorMessage}`);

          // Fallback: remove locally for demo
          const updatedImages = coverImages.filter((_, i) => i !== index);
          setCoverImages(updatedImages);
          setProfessionalData(prev => ({
            ...prev,
            coverImages: updatedImages,
          }));
          toast.success('Image de couverture supprimée localement (mode démo)');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  // Initialize default business hours
  const initializeDefaultBusinessHours = () => {
    const defaultHours = [
      { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
    ];
    return defaultHours;
  };

  // Handle business hours changes
  const handleBusinessHoursChange = (dayIndex, field, value) => {
    const updatedHours = [...businessHours];
    updatedHours[dayIndex] = {
      ...updatedHours[dayIndex],
      [field]: value,
    };
    setBusinessHours(updatedHours);
  };

  // Save business hours
  const saveBusinessHours = async () => {
    try {
      setIsLoading(true);

      // Try to update via API
      try {
        const response = await apiService.updateBusinessHours(businessHours);

        if (response.success) {
          // Update professional data with server response
          setProfessionalData(prev => ({
            ...prev,
            businessHours: response.businessHours,
          }));
          toast.success('Horaires mis à jour avec succès !');
        } else {
          throw new Error('Failed to update business hours');
        }
      } catch (apiError) {
        console.error('Erreur API:', apiError);

        // Fallback to local update
        setProfessionalData(prev => ({
          ...prev,
          businessHours: businessHours,
        }));
        toast.success('Horaires mis à jour localement (mode démo)');
      }

      setShowBusinessHoursModal(false);
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Erreur lors de la sauvegarde des horaires');
    } finally {
      setIsLoading(false);
    }
  };

  // Open business hours modal
  const openBusinessHoursModal = () => {
    if (businessHours.length === 0) {
      setBusinessHours(initializeDefaultBusinessHours());
    }
    setShowBusinessHoursModal(true);
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
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 whitespace-nowrap"
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
            : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${response.photoUrl}`;

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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Profil Professionnel Introuvable
            </h1>
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
        <div className="h-48 sm:h-64 md:h-80 lg:h-96 relative overflow-hidden">
          {coverImages && coverImages.length > 0 ? (
            <div className="relative h-full">
              <img src={coverImages[0]} alt="Couverture" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

              {/* Image controls */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 z-10">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowImageUpload(true);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={e => {
                    e.stopPropagation();
                    setShowImageUpload(true);
                  }}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all duration-200 touch-manipulation active:scale-95 active:bg-white/90"
                  title="Changer l'image de couverture"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <CameraIcon className="h-5 w-5 sm:h-5 sm:w-5 text-gray-700 mx-auto" />
                </button>
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImage(0);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={e => {
                    e.stopPropagation();
                    removeImage(0);
                  }}
                  className="min-w-[44px] min-h-[44px] p-3 sm:p-2 bg-red-500/95 hover:bg-red-500 rounded-lg shadow-lg transition-all duration-200 touch-manipulation active:scale-95 active:bg-red-600"
                  title="Supprimer l'image de couverture"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <XMarkIcon className="h-5 w-5 sm:h-5 sm:w-5 text-white mx-auto" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gradient-lotus flex items-center justify-center">
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageUpload(true);
                }}
                onTouchStart={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchEnd={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageUpload(true);
                }}
                className="flex flex-col items-center text-white hover:text-white/80 transition-all duration-200 touch-manipulation active:scale-95 p-4 rounded-lg"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <CameraIcon className="h-8 w-8 sm:h-12 sm:w-12 mb-2" />
                <span className="text-sm sm:text-lg font-medium text-center">
                  Ajouter une photo de couverture
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-lotus flex items-center justify-center shadow-xl border-4 border-white overflow-hidden cursor-pointer touch-manipulation active:scale-95 transition-transform duration-200"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfilePhotoUpload(true);
                    }}
                    onTouchStart={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchEnd={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfilePhotoUpload(true);
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg sm:text-2xl md:text-3xl font-bold text-white">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <CameraIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                  {professionalData.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                      <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Title */}
                <div className="text-white">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-base sm:text-lg text-white/90 mt-1">
                    {professionalData.title}
                  </p>
                  <div className="flex items-center mt-2">
                    <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm sm:text-base text-white/90">
                      {professionalData.rating.average} ({professionalData.rating.totalReviews}{' '}
                      avis)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(!isEditing);
                  }}
                  onTouchStart={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(!isEditing);
                  }}
                  className="btn-primary flex-1 sm:flex-none text-sm sm:text-base touch-manipulation active:scale-95 transition-transform duration-200"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {isEditing ? 'Annuler' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Add Cover Image Button - Only shown when no cover image exists */}
      {(!coverImages || coverImages.length === 0) && (
        <div className="block sm:hidden mx-auto max-w-7xl px-4 py-4">
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowImageUpload(true);
            }}
            onTouchStart={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchEnd={e => {
              e.preventDefault();
              e.stopPropagation();
              setShowImageUpload(true);
            }}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border-2 border-dashed border-primary-300 rounded-lg text-primary-600 hover:text-primary-700 hover:border-primary-400 transition-all duration-200 touch-manipulation active:scale-[0.98] shadow-sm"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <CameraIcon className="h-5 w-5" />
            <span className="font-medium">Ajouter une image de couverture</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="lotus-card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">À propos</h2>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom commercial
                    </label>
                    <input
                      type="text"
                      {...register('businessName')}
                      className="input-field"
                      placeholder="Ex: Centre de Yoga Fès"
                    />
                    {errors.businessName && (
                      <p className="error-message">{errors.businessName.message}</p>
                    )}
                  </div>

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
                      Type d'activité
                    </label>
                    <select {...register('businessType')} className="input-field">
                      <option value="wellness">Bien-être</option>
                      <option value="yoga">Yoga</option>
                      <option value="massage">Massage</option>
                      <option value="meditation">Méditation</option>
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="therapy">Thérapie</option>
                      <option value="coaching">Coaching</option>
                      <option value="other">Autre</option>
                    </select>
                    {errors.businessType && (
                      <p className="error-message">{errors.businessType.message}</p>
                    )}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                    <input
                      type="url"
                      {...register('website')}
                      className="input-field"
                      placeholder="https://votre-site.com"
                    />
                    {errors.website && <p className="error-message">{errors.website.message}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex-1 sm:flex-none"
                    >
                      {isLoading ? <LoadingSpinner size="small" className="mr-2" /> : null}
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary flex-1 sm:flex-none"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {professionalData.description}
                  </p>

                  {/* Activities/Categories Tags */}
                  {(professionalData.activities?.length > 0 ||
                    professionalData.categories?.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {professionalData.activities?.map((activity, index) => (
                        <span
                          key={`activity-${index}`}
                          className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-primary-100 text-primary-700"
                        >
                          {activity}
                        </span>
                      ))}
                      {professionalData.categories?.map((category, index) => (
                        <span
                          key={`category-${index}`}
                          className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-700"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Business Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Type d'activité</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {professionalData.businessType}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Mode de réservation
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {professionalData.bookingMode === 'auto' ? 'Automatique' : 'Manuel'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address & Map */}
            <div className="lotus-card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Localisation</h2>
              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 mb-3 text-sm sm:text-base break-words">
                    {professionalData.address}
                  </p>

                  {/* Show a small preview map if coordinates are available */}
                  {professionalData.businessAddress?.coordinates?.lat &&
                    professionalData.businessAddress?.coordinates?.lng && (
                      <div className="mt-3 mb-3">
                        <div
                          id="map-preview"
                          className="h-32 sm:h-48 w-full rounded-lg border border-gray-200 overflow-hidden cursor-pointer touch-manipulation active:scale-[0.99] transition-transform duration-200"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMapPicker(true);
                          }}
                          onTouchStart={e => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onTouchEnd={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMapPicker(true);
                          }}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
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
                                      'h-32 sm:h-48 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center p-4';

                                    // Add map icon with distinctive purple color
                                    const mapIcon = document.createElement('div');
                                    mapIcon.innerHTML =
                                      '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';

                                    // Create a clean address display
                                    const addressContainer = document.createElement('div');
                                    addressContainer.className = 'w-full';

                                    // Add the address in a nice input-like container
                                    const addressDisplay = document.createElement('div');
                                    addressDisplay.className =
                                      'w-full p-2 bg-white border border-gray-300 rounded-md text-center text-gray-700 shadow-sm text-sm';

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

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <a
                      href={generateMapLink(professionalData.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-1" />
                      Voir sur Google Maps
                    </a>

                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMapPicker(true);
                      }}
                      onTouchStart={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchEnd={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMapPicker(true);
                      }}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm touch-manipulation active:scale-95 transition-transform duration-200 p-2 -m-2 rounded-md"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Modifier la localisation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="lotus-card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-primary-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-primary-700">
                    {professionalData.sessions?.length ||
                      professionalData.stats?.totalSessions ||
                      0}
                  </div>
                  <div className="text-xs text-gray-600">Sessions</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-emerald-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-700">
                    {professionalData.stats?.totalClients || 0}
                  </div>
                  <div className="text-xs text-gray-600">Clients</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-700">
                    {professionalData.products?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Produits</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-orange-700">
                    {professionalData.events?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Événements</div>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="lotus-card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Abonnement</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan actuel</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {professionalData.subscription?.plan || 'Basic'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span
                    className={`text-sm font-medium ${
                      professionalData.subscription?.isActive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {professionalData.subscription?.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paiement activé</span>
                  <span
                    className={`text-sm font-medium ${
                      professionalData.paymentEnabled ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {professionalData.paymentEnabled ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lotus-card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base break-all">
                    {professionalData.contactInfo.phone}
                  </span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base break-all">
                    {user?.email}
                  </span>
                </div>
                {professionalData.contactInfo.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <a
                      href={`https://${professionalData.contactInfo.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm sm:text-base break-all"
                    >
                      {professionalData.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div className="lotus-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Horaires</h3>
                <button
                  onClick={openBusinessHoursModal}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Modifier
                </button>
              </div>

              {professionalData.businessHours && professionalData.businessHours.length > 0 ? (
                <div className="space-y-2">
                  {professionalData.businessHours.map(schedule => (
                    <div key={schedule.day} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-700 font-medium">{dayNames[schedule.day]}</span>
                      <span className="text-gray-600">
                        {schedule.isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : 'Fermé'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Aucun horaire défini</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Cliquez sur "Modifier" pour ajouter vos horaires d'ouverture
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Changer l'image de couverture</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                <CameraIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
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
                <p className="text-gray-400 text-xs mt-1">
                  Cette image remplacera votre image de couverture actuelle
                </p>
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
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              height="400px"
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
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                <CameraIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
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

      {/* Business Hours Modal */}
      {showBusinessHoursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Horaires d'ouverture</h3>
              <button
                onClick={() => setShowBusinessHoursModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {businessHours.map((schedule, index) => (
                <div key={schedule.day} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">{dayNames[schedule.day]}</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={schedule.isOpen}
                        onChange={e => handleBusinessHoursChange(index, 'isOpen', e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Ouvert</span>
                    </label>
                  </div>

                  {schedule.isOpen && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ouverture
                        </label>
                        <input
                          type="time"
                          value={schedule.openTime}
                          onChange={e =>
                            handleBusinessHoursChange(index, 'openTime', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fermeture
                        </label>
                        <input
                          type="time"
                          value={schedule.closeTime}
                          onChange={e =>
                            handleBusinessHoursChange(index, 'closeTime', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={saveBusinessHours}
                disabled={isLoading}
                className="btn-primary flex-1 sm:flex-none"
              >
                {isLoading ? <LoadingSpinner size="small" className="mr-2" /> : null}
                Enregistrer
              </button>
              <button
                onClick={() => setShowBusinessHoursModal(false)}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProfilePage;
