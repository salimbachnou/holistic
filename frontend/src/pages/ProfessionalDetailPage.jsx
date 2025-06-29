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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative h-96">
            {coverImageUrls.length > 0 ? (
              <>
                <img
                  src={coverImageUrls[activeImageIndex]}
                  alt={professional.businessName}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                {coverImageUrls.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {coverImageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <img
                src={getDefaultFallbackImage()}
                alt={professional.businessName || 'Professional'}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{professional.businessName}</h1>
              <p className="text-lg text-gray-600 mt-2">{professional.businessType}</p>

              {/* Rating */}
              <div className="flex items-center mt-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`${
                      i < Math.floor(professional.rating?.average || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-gray-600">
                  {professional.rating?.average?.toFixed(1) || 0}
                </span>
                <Link
                  to={`/professionals/${id}/reviews`}
                  className="ml-4 text-primary-600 hover:text-primary-700"
                >
                  Voir plus ({professional.rating?.totalReviews || 0} avis)
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {professional.description || 'Aucune description disponible.'}
              </p>
            </div>

            {/* Planning/Calendar */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Planning</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePreviousWeek}
                      className="px-4 py-2 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-all flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Précédent
                    </button>
                    <button
                      onClick={handleNextWeek}
                      className="px-4 py-2 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-all flex items-center"
                    >
                      Suivant
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-white text-opacity-80 mt-2">
                  {format(currentWeekStart, 'd MMMM', { locale: fr })} -{' '}
                  {format(addDays(currentWeekStart, 6), 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>

              <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
                {weekDays.map((day, index) => (
                  <div key={index} className="bg-white">
                    <div
                      className={`p-3 text-center ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-primary-50 border-b-2 border-primary-500' : 'bg-gray-50 border-b border-gray-200'}`}
                    >
                      <p className="font-medium text-gray-900">
                        {format(day, 'EEEE', { locale: fr })}
                      </p>
                      <p
                        className={`text-lg font-semibold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-primary-600' : 'text-gray-700'}`}
                      >
                        {format(day, 'd', { locale: fr })}
                      </p>
                      <p className="text-xs text-gray-500">{format(day, 'MMM', { locale: fr })}</p>
                    </div>
                    <div className="p-3 min-h-[180px] max-h-[300px] overflow-y-auto">
                      {getDaysSessions(day).length > 0 ? (
                        getDaysSessions(day).map(session => {
                          const sessionDate = parseISO(session.startTime);
                          const isPast = sessionDate < new Date();

                          return (
                            <div
                              key={session._id}
                              className={`${
                                isPast
                                  ? 'bg-gray-100 border-l-4 border-gray-400'
                                  : 'bg-primary-50 border-l-4 border-primary-500 hover:shadow-md'
                              } rounded mb-3 transition-all duration-200 cursor-pointer transform hover:-translate-y-1`}
                              onClick={() => handleBookSession(session)}
                            >
                              <div className="p-3">
                                <div className="flex justify-between items-start">
                                  <h3
                                    className={`font-medium ${isPast ? 'text-gray-600' : 'text-primary-700'}`}
                                  >
                                    {session.title}
                                  </h3>
                                  {isPast && (
                                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                                      Passée
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center mt-2 text-sm">
                                  <FaClock
                                    className={`mr-1 ${isPast ? 'text-gray-500' : 'text-primary-500'}`}
                                  />
                                  <span className="text-gray-600">
                                    {format(parseISO(session.startTime), 'HH:mm')}
                                  </span>
                                  <span className="mx-1 text-gray-400">•</span>
                                  <span className="text-gray-600">{session.duration} min</span>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center text-sm">
                                    <FaEuroSign
                                      className={`mr-1 ${isPast ? 'text-gray-500' : 'text-primary-500'}`}
                                    />
                                    <span className="font-medium text-gray-700">
                                      {session.price} MAD
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <FaUserFriends
                                      className={`mr-1 ${isPast ? 'text-gray-500' : 'text-primary-500'}`}
                                    />
                                    <span className="text-gray-600">
                                      {session.participants?.length || 0}/{session.maxParticipants}
                                    </span>
                                  </div>
                                </div>

                                {!isPast && (
                                  <div className="mt-2 pt-2 border-t border-primary-100 text-center">
                                    <span className="text-xs text-primary-600 font-medium inline-flex items-center">
                                      Réserver
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 ml-1"
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
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500 mt-2">Aucune session</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Professional Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="text-center">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={professional.businessName}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary-100"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-lotus flex items-center justify-center border-4 border-primary-100">
                    <span className="text-2xl font-bold text-white">
                      {professional.businessName?.charAt(0) ||
                        professional.userId?.firstName?.charAt(0) ||
                        '?'}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {professional.userId?.firstName} {professional.userId?.lastName}
                </h3>
                <p className="text-sm text-gray-600 mb-4 capitalize">{professional.businessType}</p>
                {professional.rating?.average > 0 && (
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(professional.rating.average)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {professional.rating.average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact</h3>

              {/* Address */}
              {professional.businessAddress && (
                <div className="flex items-start mb-4">
                  <FaMapMarkerAlt className="text-primary-600 mt-1 mr-3" />
                  <div>
                    <p className="text-gray-700">
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
                      className="text-primary-600 hover:text-primary-700 text-sm mt-1"
                    >
                      Voir sur la carte
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {professional.contactInfo?.phone && (
                <div className="flex items-center mb-4">
                  <FaPhone className="text-primary-600 mr-3" />
                  <a
                    href={`tel:${professional.contactInfo.phone}`}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    {professional.contactInfo.phone}
                  </a>
                </div>
              )}

              {/* Website */}
              {professional.contactInfo?.website && (
                <div className="flex items-center mb-4">
                  <FaGlobe className="text-primary-600 mr-3" />
                  <a
                    href={professional.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    {professional.contactInfo.website}
                  </a>
                </div>
              )}

              {/* Social Media */}
              <div className="flex mt-4">
                {professional.contactInfo?.socialMedia?.facebook && (
                  <a
                    href={professional.contactInfo.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary-600 mr-4"
                  >
                    <FaFacebook size={20} />
                  </a>
                )}
                {professional.contactInfo?.socialMedia?.instagram && (
                  <a
                    href={professional.contactInfo.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary-600 mr-4"
                  >
                    <FaInstagram size={20} />
                  </a>
                )}
                {professional.contactInfo?.socialMedia?.linkedin && (
                  <a
                    href={professional.contactInfo.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary-600"
                  >
                    <FaLinkedin size={20} />
                  </a>
                )}
              </div>
            </div>

            {/* Business Hours */}
            {professional.businessHours && professional.businessHours.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div>
                  {professional.businessHours.map((hours, index) => (
                    <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                      <span className="capitalize">{hours.day}</span>
                      {hours.isOpen ? (
                        <span>
                          {hours.openTime} - {hours.closeTime}
                        </span>
                      ) : (
                        <span className="text-gray-500">Fermé</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities/Services */}
            {professional.activities && professional.activities.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Activités</h2>
                <div className="flex flex-wrap gap-2">
                  {professional.activities.map((activity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
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
