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
} from 'react-icons/fa';
import { useParams, Link, useNavigate } from 'react-router-dom';

import EnhancedBookingModal from '../components/Common/EnhancedBookingModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
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

  const fetchSessions = async profId => {
    try {
      // Utiliser l'ID du professionnel passé en paramètre ou celui du state
      const professionalId = profId || (professional && professional._id);

      if (professionalId) {
        console.log('Fetching sessions for professional ID:', professionalId);
        // Only use startDate to get all sessions including past ones
        // Omit status parameter to avoid filtering by status
        const response = await apiService.get(
          `/sessions/professional/${professionalId}?startDate=2020-01-01`
        );
        console.log('Sessions API response:', response);

        // Check if the response has the expected structure
        if (response && response.sessions) {
          console.log('Sessions found:', response.sessions.length);
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
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
        });
        setCoverImageUrls(urls);
      } else {
        setCoverImageUrls([]);
      }

      // Build profile image URL
      if (professional.profilePhoto) {
        const imageUrl = professional.profilePhoto.startsWith('http')
          ? professional.profilePhoto
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${professional.profilePhoto}`;
        setProfileImageUrl(imageUrl);
      } else if (professional.userId?.profileImage) {
        const imageUrl = professional.userId.profileImage.startsWith('http')
          ? professional.userId.profileImage
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${professional.userId.profileImage}`;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Image Gallery */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 transform hover:shadow-3xl transition-all duration-500">
          <div className="relative h-[500px]">
            {coverImageUrls.length > 0 ? (
              <>
                <img
                  src={coverImageUrls[activeImageIndex]}
                  alt={professional.businessName}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Premium Floating Info Card */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className="h-1 w-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-4"></div>
                        <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">
                          Professionnel Certifié
                        </span>
                      </div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                        {professional.businessName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                          {professional.businessType}
                        </span>
                        {professional.rating?.average > 0 && (
                          <div className="flex items-center bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 rounded-full shadow-lg">
                            <FaStar className="text-white mr-2" />
                            <span className="text-white font-bold">
                              {professional.rating.average.toFixed(1)}
                            </span>
                            <span className="text-white/90 text-sm ml-2">
                              ({professional.rating.totalReviews} avis)
                            </span>
                          </div>
                        )}
                        {professional.activities && professional.activities.length > 0 && (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            +{professional.activities.length} services
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                        {professional.description?.slice(0, 150) || 'Découvrez nos services de qualité pour votre bien-être.'}
                        {professional.description?.length > 150 && '...'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() =>
                          document
                            .getElementById('planning-section')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center group"
                      >
                        <FaClock className="mr-2 group-hover:animate-pulse" />
                        Réserver maintenant
                      </button>
                      <Link
                        to={`/professionals/${id}/reviews`}
                        className="bg-white/90 hover:bg-white text-primary-600 border-2 border-primary-200 hover:border-primary-300 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
                      >
                        <FaStar className="mr-2" />
                        Voir les avis
                      </Link>
                    </div>
                  </div>
                </div>

                {coverImageUrls.length > 1 && (
                  <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <div className="flex space-x-2">
                      {coverImageUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === activeImageIndex
                              ? 'bg-white scale-125 shadow-lg'
                              : 'bg-white/60 hover:bg-white/80 hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <img
                  src={getDefaultFallbackImage()}
                  alt={professional.businessName || 'Professional'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    {professional.businessName}
                  </h1>
                  <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {professional.businessType}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="h-1 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-gray-900">À propos</h2>
              </div>
              <div className="prose prose-lg text-gray-700 leading-relaxed">
                <p className="whitespace-pre-line">
                  {professional.description || 'Aucune description disponible.'}
                </p>
              </div>
            </div>

            {/* Planning/Calendar */}
            <div id="planning-section" className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Planning des Sessions</h2>
                    <p className="text-white/90">
                      {format(currentWeekStart, 'd MMMM', { locale: fr })} -{' '}
                      {format(addDays(currentWeekStart, 6), 'd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePreviousWeek}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all duration-200 flex items-center backdrop-blur-sm"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </button>
                    <button
                      onClick={handleNextWeek}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all duration-200 flex items-center backdrop-blur-sm"
                    >
                      Suivant
                      <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {weekDays.map((day, index) => (
                  <div key={index} className="bg-white">
                    <div
                      className={`p-4 text-center border-b-2 ${
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors duration-200`}
                    >
                      <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                        {format(day, 'EEEE', { locale: fr })}
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                            ? 'text-primary-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd', { locale: fr })}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {format(day, 'MMM', { locale: fr })}
                      </p>
                    </div>
                    <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
                      {getDaysSessions(day).length > 0 ? (
                        getDaysSessions(day).map(session => {
                          const sessionDate = parseISO(session.startTime);
                          const isPast = sessionDate < new Date();

                          return (
                            <button
                              key={session._id}
                              onClick={() => handleBookSession(session)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleBookSession(session);
                                }
                              }}
                              className={`w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                isPast
                                  ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 hover:from-primary-100 hover:to-primary-200 hover:border-primary-300 hover:shadow-lg cursor-pointer'
                              }`}
                              disabled={isPast}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3
                                  className={`font-bold text-lg ${
                                    isPast ? 'text-gray-600' : 'text-primary-800'
                                  }`}
                                >
                                  {session.title}
                                </h3>
                                {isPast && (
                                  <span className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded-full font-medium">
                                    Passée
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center mb-3 text-sm">
                                <FaClock
                                  className={`mr-2 ${isPast ? 'text-gray-500' : 'text-primary-600'}`}
                                />
                                <span className="font-semibold text-gray-700">
                                  {format(parseISO(session.startTime), 'HH:mm')}
                                </span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-gray-600">{session.duration} min</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                  <FaEuroSign
                                    className={`mr-1 ${isPast ? 'text-gray-500' : 'text-green-600'}`}
                                  />
                                  <span className="font-bold text-green-700">
                                    {session.price} MAD
                                  </span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <FaUserFriends
                                    className={`mr-1 ${isPast ? 'text-gray-500' : 'text-primary-600'}`}
                                  />
                                  <span className="font-medium text-gray-700">
                                    {session.participants?.length || 0}/{session.maxParticipants}
                                  </span>
                                </div>
                              </div>

                              {!isPast && (
                                <div className="mt-3 pt-3 border-t border-primary-200 text-center">
                                  <span className="text-sm text-primary-700 font-bold inline-flex items-center group">
                                    <FaClock className="mr-2 group-hover:animate-spin" />
                                    Réserver cette session
                                    <svg
                                      className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                      />
                                    </svg>
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="h-8 w-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">Aucune session</p>
                          <p className="text-gray-400 text-sm mt-1">programmée ce jour</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Professional Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={professional.businessName}
                    className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-primary-200 shadow-lg"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-4 border-primary-200 shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {professional.businessName?.charAt(0) ||
                        professional.userId?.firstName?.charAt(0) ||
                        '?'}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {professional.userId?.firstName} {professional.userId?.lastName}
                </h3>
                <p className="text-primary-600 font-semibold mb-4 capitalize">
                  {professional.businessType}
                </p>
                {professional.rating?.average > 0 && (
                  <div className="flex items-center justify-center mb-4 bg-yellow-50 rounded-full px-4 py-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-lg ${
                          i < Math.floor(professional.rating.average)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-3 text-lg font-bold text-yellow-700">
                      {professional.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="h-1 w-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-3"></div>
                Contact
              </h3>

              {/* Address */}
              {professional.businessAddress && (
                <div className="flex items-start mb-6 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <FaMapMarkerAlt className="text-primary-600 mt-1 mr-4 text-lg" />
                  <div>
                    <p className="text-gray-700 font-medium leading-relaxed">
                      {professional.businessAddress.street &&
                        `${professional.businessAddress.street}, `}
                      {professional.businessAddress.city &&
                        `${professional.businessAddress.city}, `}
                      {professional.businessAddress.postalCode &&
                        `${professional.businessAddress.postalCode}, `}
                      {professional.businessAddress.country || 'Morocco'}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${professional.businessAddress.street || ''} ${professional.businessAddress.city || ''} ${professional.businessAddress.country || 'Morocco'}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-semibold mt-2 inline-flex items-center"
                    >
                      <FaMapMarkerAlt className="mr-1" />
                      Voir sur la carte
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {professional.contactInfo?.phone && (
                <div className="flex items-center mb-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <FaPhone className="text-primary-600 mr-4 text-lg" />
                  <a
                    href={`tel:${professional.contactInfo.phone}`}
                    className="text-gray-700 hover:text-primary-600 font-medium text-lg"
                  >
                    {professional.contactInfo.phone}
                  </a>
                </div>
              )}

              {/* Website */}
              {professional.contactInfo?.website && (
                <div className="flex items-center mb-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <FaGlobe className="text-primary-600 mr-4 text-lg" />
                  <a
                    href={professional.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Site web
                  </a>
                </div>
              )}

              {/* Social Media */}
              <div className="flex justify-center space-x-4 mt-6 pt-6 border-t border-gray-200">
                {professional.contactInfo?.socialMedia?.facebook && (
                  <a
                    href={professional.contactInfo.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                  >
                    <FaFacebook size={20} />
                  </a>
                )}
                {professional.contactInfo?.socialMedia?.instagram && (
                  <a
                    href={professional.contactInfo.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                  >
                    <FaInstagram size={20} />
                  </a>
                )}
                {professional.contactInfo?.socialMedia?.linkedin && (
                  <a
                    href={professional.contactInfo.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                  >
                    <FaLinkedin size={20} />
                  </a>
                )}
              </div>
            </div>

            {/* Business Hours */}
            {professional.businessHours && professional.businessHours.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="h-1 w-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-3"></div>
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-3">
                  {professional.businessHours.map((hours, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="capitalize font-semibold text-gray-700">{hours.day}</span>
                      {hours.isOpen ? (
                        <span className="text-green-600 font-bold">
                          {hours.openTime} - {hours.closeTime}
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">Fermé</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities/Services */}
            {professional.activities && professional.activities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="h-1 w-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mr-3"></div>
                  Services & Activités
                </h2>
                <div className="flex flex-wrap gap-3">
                  {professional.activities.map((activity, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold hover:from-primary-200 hover:to-primary-300 transition-all duration-200 transform hover:scale-105"
                    >
                      {activity}
                    </span>
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
