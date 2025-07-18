import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaStar,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaClock,
  FaEuroSign,
  FaUserFriends,
  FaCalendarAlt,
  FaUsers,
  FaShoppingBag,
  FaCheckCircle,
  FaAward,
} from 'react-icons/fa';
import { useParams, Link, useNavigate } from 'react-router-dom';

import EnhancedBookingModal from '../components/Common/EnhancedBookingModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import PlanningSection from '../components/Common/PlanningSection';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { handleImageError, getDefaultFallbackImage } from '../utils/imageUtils';

const ProfessionalDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedSession, setSelectedSession] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // States for image URLs like ProfilePage.jsx
  const [coverImageUrls, setCoverImageUrls] = useState([]);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // Day names mapping for business hours
  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  };

  // Business type mapping
  const businessTypeLabels = {
    wellness: 'Bien-être',
    yoga: 'Yoga',
    massage: 'Massage',
    meditation: 'Méditation',
    fitness: 'Fitness',
    nutrition: 'Nutrition',
    therapy: 'Thérapie',
    coaching: 'Coaching',
    other: 'Autre',
  };

  const fetchSessions = async profId => {
    try {
      // Utiliser l'ID du professionnel passé en paramètre ou celui du state
      const professionalId = profId || (professional && professional._id);

      if (professionalId) {
        // Only use startDate to get all sessions including past ones
        // Omit status parameter to avoid filtering by status
        const response = await apiService.get(
          `/sessions/professional/${professionalId}?startDate=2020-01-01`
        );

        // Check if the response has the expected structure
        if (response && response.sessions) {
          setSessions(response.sessions || []);
        } else {
          console.error('Unexpected API response structure:', response);
          setSessions([]);
          toast.error('Erreur de format de réponse pour les sessions');
        }
      } else {
        console.warn('No professional ID available to fetch sessions');
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // Ne pas définir d'erreur globale pour ne pas bloquer l'affichage du profil
      setSessions([]);
      toast.error(`Erreur lors du chargement des sessions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Build image URLs when professional data changes
  useEffect(() => {
    if (professional) {
      // Build cover images URLs
      if (professional.coverImages && professional.coverImages.length > 0) {
        const urls = professional.coverImages.map(imagePath => {
          if (!imagePath) return getDefaultFallbackImage();
          return imagePath.startsWith('http')
            ? imagePath
            : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${imagePath}`;
        });
        setCoverImageUrls(urls);
      } else {
        setCoverImageUrls([]);
      }

      // Build profile image URL
      if (professional.profilePhoto) {
        const imageUrl = professional.profilePhoto.startsWith('http')
          ? professional.profilePhoto
          : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${professional.profilePhoto}`;
        setProfileImageUrl(imageUrl);
      } else if (professional.userId?.profileImage) {
        const imageUrl = professional.userId.profileImage.startsWith('http')
          ? professional.userId.profileImage
          : `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}${professional.userId.profileImage}`;
        setProfileImageUrl(imageUrl);
      } else {
        setProfileImageUrl(null);
      }

      // Fetch sessions once we have the professional data
      fetchSessions(professional._id);
    }
  }, [professional]);

  // Check if API is reachable
  useEffect(() => {
    const checkApiHealth = async () => {
      const healthStatus = await apiService.checkHealth();
      setApiStatus(healthStatus);

      if (!healthStatus.isConnected) {
        setError(`Erreur de connexion au serveur: ${healthStatus.message}`);
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  useEffect(() => {
    // Don't fetch if API is unreachable
    if (apiStatus && !apiStatus.isConnected) {
      return;
    }

    const fetchProfessional = async () => {
      try {
        const data = await apiService.get(`/professionals/${id}`);
        setProfessional(data.professional);
      } catch (err) {
        console.error('Error fetching professional:', err);
        setError("Ce professionnel n'existe pas ou a été supprimé");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfessional();
    }
  }, [id, apiStatus]);

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleBookSession = session => {
    // Vérifier si la session est dans le passé
    const sessionDate = parseISO(session.startTime);
    const now = new Date();

    if (sessionDate < now) {
      toast.error('Cette session est déjà passée et ne peut plus être réservée');
      return;
    }

    if (!user) {
      toast.error('Veuillez vous connecter pour réserver une session');
      navigate('/login', { state: { from: `/professionals/${id}` } });
      return;
    }

    setSelectedSession(session);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = _booking => {
    // Refresh sessions to update availability
    refetchSessions();
    toast.success('Votre réservation a été enregistrée');
  };

  const refetchSessions = async () => {
    try {
      // Utiliser l'ID du professionnel du state
      if (professional && professional._id) {
        const data = await apiService.get(
          `/sessions/professional/${professional._id}?startDate=2020-01-01`
        );
        setSessions(data.sessions || []);
      } else {
        console.warn('Cannot refresh sessions: professional ID not available');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Erreur lors du rafraîchissement des sessions');
    }
  };

  const getDaysSessions = date => {
    return sessions.filter(session => {
      const sessionDate = parseISO(session.startTime);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Generate Google Maps link for address
  const generateMapLink = address => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            {apiStatus && !apiStatus.isConnected && (
              <p className="mt-2 text-sm">
                Statut du serveur: Non connecté. Assurez-vous que le serveur backend est en cours
                d&apos;exécution sur le port 5000.
              </p>
            )}
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professional Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  // Prepare the days for the week view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        {/* Enhanced Hero Section with Image Gallery */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden mb-6 sm:mb-8 transform hover:shadow-3xl transition-all duration-700 border border-white/20">
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
            {coverImageUrls.length > 0 ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent z-10"></div>
                <img
                  src={coverImageUrls[activeImageIndex]}
                  alt={professional.businessName}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-20"></div>

                {/* Premium Floating Info Card with Enhanced Design */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-30">
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/30 transform hover:scale-[1.02] transition-all duration-500">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="h-1 sm:h-1.5 w-12 sm:w-16 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-3 sm:mr-4 animate-pulse"></div>
                          <div className="flex items-center space-x-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 font-bold text-xs sm:text-sm uppercase tracking-wider">
                              {professional.isVerified ? 'Professionnel Certifié' : 'Professionnel'}
                            </span>
                            {professional.isVerified && (
                              <div className="relative">
                                <FaCheckCircle
                                  className="text-emerald-500 animate-pulse"
                                  size={16}
                                />
                                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight tracking-tight">
                          {professional.businessName || professional.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                            {businessTypeLabels[professional.businessType] ||
                              professional.businessType}
                          </span>
                          {professional.rating?.average > 0 && (
                            <div className="flex items-center bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                              <FaStar className="text-white mr-1 sm:mr-2" size={14} />
                              <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                                {professional.rating.average.toFixed(1)}
                              </span>
                              <span className="text-white/90 text-xs sm:text-sm ml-1 sm:ml-2">
                                ({professional.rating.totalReviews} avis)
                              </span>
                            </div>
                          )}
                          {professional.activities && professional.activities.length > 0 && (
                            <span className="bg-white/90 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-md backdrop-blur-sm border border-gray-200">
                              +{professional.activities.length} services
                            </span>
                          )}
                          {professional.bookingMode && (
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-md">
                              Réservation{' '}
                              {professional.bookingMode === 'auto' ? 'automatique' : 'manuelle'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl font-medium">
                          {professional.description?.slice(0, 150) ||
                            'Découvrez nos services de qualité pour votre bien-être.'}
                          {professional.description?.length > 150 && '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Image Navigation */}
                {coverImageUrls.length > 1 && (
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-lg border border-white/30">
                      <div className="flex space-x-1.5 sm:space-x-2">
                        {coverImageUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveImageIndex(index)}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 transform ${
                              index === activeImageIndex
                                ? 'bg-white scale-125 shadow-lg'
                                : 'bg-white/60 hover:bg-white/80 hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <img
                  src={getDefaultFallbackImage()}
                  alt={professional.businessName || 'Professional'}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-20"></div>
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-30">
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/30">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                      {professional.businessName || professional.title}
                    </h1>
                    <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                      {businessTypeLabels[professional.businessType] || professional.businessType}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Description Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="h-1 sm:h-1.5 w-8 sm:w-12 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-3 sm:mr-4 animate-pulse"></div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  À propos
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base lg:prose-lg text-gray-700 leading-relaxed">
                <p className="whitespace-pre-line text-base sm:text-lg leading-7 sm:leading-8">
                  {professional.description || 'Aucune description disponible.'}
                </p>
              </div>

              {/* Activities/Categories Tags */}
              {(professional.activities?.length > 0 || professional.categories?.length > 0) && (
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8">
                  {professional.activities?.map((activity, index) => (
                    <span
                      key={`activity-${index}`}
                      className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border border-pink-200 hover:from-pink-200 hover:to-purple-200 transition-all duration-300 transform hover:scale-105"
                    >
                      {activity}
                    </span>
                  ))}
                  {professional.categories?.map((category, index) => (
                    <span
                      key={`category-${index}`}
                      className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 hover:from-blue-200 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Business Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 uppercase tracking-wide">
                    Type d'activité
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                    {businessTypeLabels[professional.businessType] || professional.businessType}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 uppercase tracking-wide">
                    Mode de réservation
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                    {professional.bookingMode === 'auto' ? 'Automatique' : 'Manuel'}
                  </p>
                </div>
                {professional.paymentEnabled !== undefined && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 uppercase tracking-wide">
                      Paiement en ligne
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      {professional.paymentEnabled ? 'Activé' : 'Désactivé'}
                    </p>
                  </div>
                )}
                {professional.subscription && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 uppercase tracking-wide">
                      Plan d'abonnement
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                      {professional.subscription.plan || 'Basic'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Planning Section */}
            <div id="planning-section">
              <PlanningSection
                currentWeekStart={currentWeekStart}
                weekDays={weekDays}
                handlePreviousWeek={handlePreviousWeek}
                handleNextWeek={handleNextWeek}
                getDaysSessions={getDaysSessions}
                handleBookSession={handleBookSession}
              />
            </div>

            {/* Business Hours */}
            {professional.businessHours && professional.businessHours.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="h-1.5 w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-4 animate-pulse"></div>
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-4">
                  {professional.businessHours.map((hours, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-4 px-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <span className="font-bold text-gray-800 text-lg">
                        {dayNames[hours.day] || hours.day}
                      </span>
                      {hours.isOpen ? (
                        <span className="text-emerald-600 font-bold text-lg bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                          {hours.openTime} - {hours.closeTime}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-lg bg-red-50 px-4 py-2 rounded-full border border-red-200">
                          Fermé
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            {/* Professional Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
              <div className="text-center">
                <div className="relative inline-block mb-4 sm:mb-6">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={professional.businessName}
                      className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full mx-auto object-cover border-4 border-gradient-to-r from-pink-300 to-purple-300 shadow-xl"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full mx-auto bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 flex items-center justify-center border-4 border-white shadow-xl">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        {professional.businessName?.charAt(0) ||
                          professional.userId?.firstName?.charAt(0) ||
                          professional.title?.charAt(0) ||
                          '?'}
                      </span>
                    </div>
                  )}
                  {professional.isVerified && (
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 rounded-full p-2 sm:p-3 shadow-lg">
                      <FaCheckCircle className="text-white" size={16} />
                    </div>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  {professional.userId?.firstName} {professional.userId?.lastName}
                </h3>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-bold mb-4 sm:mb-6 capitalize text-base sm:text-lg">
                  {businessTypeLabels[professional.businessType] || professional.businessType}
                </p>
                {professional.rating?.average > 0 && (
                  <div className="flex items-center justify-center mb-4 sm:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-yellow-200">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-base sm:text-lg lg:text-xl ${
                          i < Math.floor(professional.rating.average)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-yellow-700">
                      {professional.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
                <div className="h-1 sm:h-1.5 w-8 sm:w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-3 sm:mr-4 animate-pulse"></div>
                Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl sm:rounded-2xl border border-pink-200 hover:shadow-lg hover:border-pink-300 transition-all duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-opacity-50">
                  <div className="text-2xl sm:text-3xl font-bold text-pink-700 mb-2">
                    {professional.stats?.totalSessions || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 flex items-center justify-center font-semibold">
                    <FaCalendarAlt className="mr-1 sm:mr-2 text-pink-600" />
                    Sessions
                  </div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl border border-emerald-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-opacity-50">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-2">
                    {professional.stats?.totalClients || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 flex items-center justify-center font-semibold">
                    <FaUsers className="mr-1 sm:mr-2 text-emerald-600" />
                    Clients
                  </div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
                    {professional.stats?.productsCount || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 flex items-center justify-center font-semibold">
                    <FaShoppingBag className="mr-1 sm:mr-2 text-blue-600" />
                    Produits
                  </div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl sm:rounded-2xl border border-orange-200 hover:shadow-lg hover:border-orange-300 transition-all duration-300 transform hover:scale-105 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-50">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-700 mb-2">
                    {professional.stats?.upcomingEvents || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 flex items-center justify-center font-semibold">
                    <FaCalendarAlt className="mr-1 sm:mr-2 text-orange-600" />
                    Événements
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
                <div className="h-1 sm:h-1.5 w-8 sm:w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-3 sm:mr-4 animate-pulse"></div>
                Contact
              </h3>

              {/* Address */}
              {(professional.address || professional.businessAddress) && (
                <div className="flex items-start mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <FaMapMarkerAlt className="text-white text-sm sm:text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-semibold leading-relaxed mb-2 text-sm sm:text-base">
                      {professional.address ||
                        `${professional.businessAddress?.street || ''} ${professional.businessAddress?.city || ''} ${professional.businessAddress?.country || 'Morocco'}`.trim()}
                    </p>
                    <a
                      href={generateMapLink(
                        professional.address ||
                          `${professional.businessAddress?.street || ''} ${professional.businessAddress?.city || ''} ${professional.businessAddress?.country || 'Morocco'}`.trim()
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700 text-xs sm:text-sm font-bold inline-flex items-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded-md px-1"
                    >
                      <FaMapMarkerAlt className="mr-1 sm:mr-2" />
                      Voir sur la carte
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {professional.contactInfo?.phone && (
                <div className="flex items-center mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <FaPhone className="text-white text-sm sm:text-lg" />
                  </div>
                  <a
                    href={`tel:${professional.contactInfo.phone}`}
                    className="text-gray-800 hover:text-green-600 font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded-md px-1"
                  >
                    {professional.contactInfo.phone}
                  </a>
                </div>
              )}

              {/* Email */}
              {professional.contactInfo?.email && (
                <div className="flex items-center mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <FaPhone className="text-white text-sm sm:text-lg" />
                  </div>
                  <a
                    href={`mailto:${professional.contactInfo.email}`}
                    className="text-gray-800 hover:text-blue-600 font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md px-1 break-all"
                  >
                    {professional.contactInfo.email}
                  </a>
                </div>
              )}

              {/* Website */}
              {professional.contactInfo?.website && (
                <div className="flex items-center mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <FaGlobe className="text-white text-sm sm:text-lg" />
                  </div>
                  <a
                    href={
                      professional.contactInfo.website.startsWith('http')
                        ? professional.contactInfo.website
                        : `https://${professional.contactInfo.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-purple-600 font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-md px-1"
                  >
                    Site web
                  </a>
                </div>
              )}

              {/* Social Media */}
              {professional.contactInfo?.socialMedia && (
                <div className="flex justify-center space-x-4 sm:space-x-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                  {professional.contactInfo.socialMedia.facebook && (
                    <a
                      href={professional.contactInfo.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      aria-label="Facebook"
                    >
                      <FaFacebook size={20} />
                    </a>
                  )}
                  {professional.contactInfo.socialMedia.instagram && (
                    <a
                      href={professional.contactInfo.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                      aria-label="Instagram"
                    >
                      <FaInstagram size={20} />
                    </a>
                  )}
                  {professional.contactInfo.socialMedia.linkedin && (
                    <a
                      href={professional.contactInfo.socialMedia.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedin size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Professional Content Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <div className="h-1.5 w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-4 animate-pulse"></div>
                Contenu du Professionnel
              </h3>
              <div className="space-y-6">
                {/* Events Link */}
                <Link
                  to={`/professionals/${professional._id}/events`}
                  className="flex items-center justify-between p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-pink-100 hover:to-purple-100 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                      <FaCalendarAlt className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Voir mes événements</h4>
                      <p className="text-gray-600 text-sm">
                        Découvrez tous les événements organisés par ce professionnel
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                      {professional.stats?.upcomingEvents || 0} événements
                    </span>
                    <svg
                      className="w-5 h-5 text-pink-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>

                {/* Products Link */}
                <Link
                  to={`/professionals/${professional._id}/products`}
                  className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                      <FaShoppingBag className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Voir mes produits</h4>
                      <p className="text-gray-600 text-sm">
                        Explorez tous les produits proposés par ce professionnel
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                      {professional.stats?.productsCount || 0} produits
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>

            {/* Activities/Services */}
            {professional.activities && professional.activities.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="h-1.5 w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-4 animate-pulse"></div>
                  Services & Activités
                </h2>
                <div className="flex flex-wrap gap-4">
                  {professional.activities.map((activity, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-100 via-purple-100 to-violet-100 text-pink-800 px-6 py-3 rounded-full text-sm font-bold hover:from-pink-200 hover:via-purple-200 hover:to-violet-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-pink-200"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {professional.certifications && professional.certifications.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-500 border border-white/20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="h-1.5 w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 rounded-full mr-4 animate-pulse"></div>
                  Certifications
                </h2>
                <div className="space-y-4">
                  {professional.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
                        <FaAward className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{cert.name}</p>
                        {cert.issuer && (
                          <p className="text-gray-600 font-semibold">{cert.issuer}</p>
                        )}
                        {cert.year && (
                          <p className="text-gray-500 text-sm font-medium">{cert.year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Booking Modal */}
      {bookingModalOpen && selectedSession && (
        <EnhancedBookingModal
          session={selectedSession}
          professional={professional}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedSession(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default ProfessionalDetailPage;
