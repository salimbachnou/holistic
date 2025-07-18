import _axios from 'axios';
import {
  CalendarDaysIcon,
  MapPinIcon,
  GroupIcon as UserGroupIcon,
  CurrencyIcon as CurrencyDollarIcon,
  ClockIcon,
  ChevronLeftIcon,
  MessageCircleIcon as ChatBubbleLeftRightIcon,
  CreditCardIcon,
  HeartIcon as HeartIconOutline,
  StarIcon,
  MessageCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  UsersIcon,
  PhoneIcon,
  MailIcon,
  BriefcaseIcon,
  AwardIcon,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [bookingNote, setBookingNote] = useState('');
  const [processingBooking, setProcessingBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userParticipation, setUserParticipation] = useState(null);
  const [cancellingRegistration, setCancellingRegistration] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Utility function to get user ID consistently
  const getUserId = user => {
    return user?.id || user?._id;
  };

  // Utility function to find user participation
  const findUserParticipation = (participants, userId) => {
    if (!participants || !userId) return null;

    return participants.find(p => {
      const participantUserId = typeof p.user === 'object' ? p.user.id || p.user._id : p.user;
      const match =
        participantUserId === userId || participantUserId?.toString() === userId?.toString();

      if (match) {
        console.log('✅ Found matching participation:', {
          participant: p,
          participantUserId,
          userId,
          status: p.status,
        });
      }

      return match;
    });
  };

  // Effect to check when auth is stable
  useEffect(() => {
    // Give auth context some time to load
    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('🔐 Auth checked - User:', getUserId(user), 'IsAuth:', isAuthenticated);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Debug effect to track userParticipation changes
  useEffect(() => {
    console.log('🔄 UserParticipation changed:', userParticipation);
    console.log('🔄 Current user ID:', user?.id || user?._id);
    console.log('🔄 IsAuthenticated:', isAuthenticated);
    console.log('🔄 User object:', user);
    console.log('🔄 Event participants:', event?.participants);
    console.log('🔄 Auth checked:', authChecked);
  }, [userParticipation, user, event?.participants, isAuthenticated, authChecked]);

  // Effect to update user participation when event or user changes
  useEffect(() => {
    const userId = getUserId(user);
    console.log(
      '🔄 Effect triggered - Event:',
      !!event,
      'User ID:',
      userId,
      'IsAuth:',
      isAuthenticated,
      'AuthChecked:',
      authChecked
    );

    if (event && authChecked) {
      if (isAuthenticated && userId) {
        const userParticipant = findUserParticipation(event.participants, userId);
        console.log('🔄 Updating participation from effect:', userParticipant);
        setUserParticipation(userParticipant);
      } else {
        console.log('🔄 User not authenticated or no user ID, clearing participation');
        setUserParticipation(null);
      }
    } else {
      console.log('🔄 Conditions not met for participation check:', {
        hasEvent: !!event,
        hasUserId: !!userId,
        isAuthenticated,
        authChecked,
      });
    }
  }, [event, user, isAuthenticated, authChecked]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await _axios.get(`http://localhost:5000/api/events/${id}`);

        if (response.data && response.data.event) {
          const eventData = response.data.event;
          setEvent(eventData);

          // User participation will be checked by the separate effect

          // Check if user has already reviewed this event
          if (isAuthenticated && eventData.reviews && user) {
            const userId = getUserId(user);
            const existingReview = eventData.reviews.find(review => {
              const reviewUserId =
                typeof review.user === 'object' ? review.user.id || review.user._id : review.user;
              return reviewUserId === userId || reviewUserId?.toString() === userId?.toString();
            });
            if (existingReview) {
              setUserReview(existingReview);
              setReviewRating(existingReview.rating);
              setReviewComment(existingReview.comment || '');
            }
          }

          // Check if event has passed and user attended
          if (isAuthenticated && isEventPassed(eventData) && user) {
            const userId = getUserId(user);
            const userAttended = eventData.participants?.some(p => {
              const participantUserId =
                typeof p.user === 'object' ? p.user.id || p.user._id : p.user;
              return participantUserId === userId && p.status === 'confirmed';
            });
            if (userAttended && !userReview) {
              // Show review prompt after a delay
              setTimeout(() => {
                toast.custom(
                  t => (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <StarIcon className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Comment s'est passé l'événement ?
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Partagez votre expérience pour aider les autres participants.
                          </p>
                          <div className="mt-3 flex space-x-4">
                            <button
                              onClick={() => {
                                toast.dismiss(t.id);
                                setIsReviewModalOpen(true);
                              }}
                              className="text-sm font-medium text-primary-600 hover:text-primary-500"
                            >
                              Laisser un avis
                            </button>
                            <button
                              onClick={() => toast.dismiss(t.id)}
                              className="text-sm font-medium text-gray-700 hover:text-gray-500"
                            >
                              Plus tard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                  { duration: 10000 }
                );
              }, 2000);
            }
          }
        } else {
          toast.error("Impossible de récupérer les détails de l'événement");
        }

        setLoading(false);

        if (isAuthenticated) {
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error("Erreur lors du chargement des détails de l'événement");
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, isAuthenticated, user]);

  const isEventPassed = eventData => {
    return new Date(eventData.endDate || eventData.date) < new Date();
  };

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatTime = dateString => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    try {
      if (isFavorite) {
        toast.success('Événement retiré des favoris');
      } else {
        toast.success('Événement ajouté aux favoris');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const openBookingModal = () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour réserver');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (isEventPassed(event)) {
      toast.error('Cet événement est déjà passé');
      return;
    }

    // Check if user is already registered
    if (userParticipation && userParticipation.status !== 'cancelled') {
      console.log('🚫 User already registered:', userParticipation);
      toast.error('Vous êtes déjà inscrit à cet événement');
      return;
    }

    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setBookingQuantity(1);
    setBookingNote('');
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour réserver');
      navigate('/login');
      return;
    }

    setProcessingBooking(true);

    try {
      const response = await _axios.post(`http://localhost:5000/api/events/${id}/register`, {
        quantity: bookingQuantity,
        note: bookingNote,
      });

      if (response.data && response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Réservation effectuée avec succès');
      }

      closeBookingModal();

      // Refresh event details to update participant count
      const updatedResponse = await _axios.get(`http://localhost:5000/api/events/${id}`);
      if (updatedResponse.data && updatedResponse.data.event) {
        setEvent(updatedResponse.data.event);

        // Update user participation state
        const userId = getUserId(user);
        const updatedParticipant = findUserParticipation(
          updatedResponse.data.event.participants,
          userId
        );
        setUserParticipation(updatedParticipant);
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setProcessingBooking(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour annuler votre inscription');
      return;
    }

    if (!userParticipation) {
      toast.error("Vous n'êtes pas inscrit à cet événement");
      return;
    }

    setCancellingRegistration(true);

    try {
      const response = await _axios.post(`http://localhost:5000/api/events/${id}/cancel`);

      if (response.data && response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Inscription annulée avec succès');
      }

      // Refresh event details to update participant count
      const updatedResponse = await _axios.get(`http://localhost:5000/api/events/${id}`);
      if (updatedResponse.data && updatedResponse.data.event) {
        setEvent(updatedResponse.data.event);

        // Update user participation state
        const userId = getUserId(user);
        const updatedParticipant = findUserParticipation(
          updatedResponse.data.event.participants,
          userId
        );
        setUserParticipation(updatedParticipant);
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation de l'inscription");
    } finally {
      setCancellingRegistration(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour laisser un avis');
      return;
    }

    setSubmittingReview(true);

    try {
      let response;
      if (userReview) {
        // Update existing review
        response = await _axios.put(
          `http://localhost:5000/api/events/${id}/reviews/${userReview._id}`,
          {
            rating: reviewRating,
            comment: reviewComment,
          }
        );
      } else {
        // Create new review
        response = await _axios.post(`http://localhost:5000/api/events/${id}/reviews`, {
          rating: reviewRating,
          comment: reviewComment,
        });
      }

      if (response.data) {
        toast.success(userReview ? 'Avis mis à jour' : 'Avis ajouté avec succès');
        setIsReviewModalOpen(false);

        // Refresh event details
        const updatedResponse = await _axios.get(`http://localhost:5000/api/events/${id}`);
        if (updatedResponse.data && updatedResponse.data.event) {
          setEvent(updatedResponse.data.event);

          // Update user review state
          const userId = getUserId(user);
          const newReview = updatedResponse.data.event.reviews.find(review => {
            const reviewUserId =
              typeof review.user === 'object' ? review.user.id || review.user._id : review.user;
            return reviewUserId === userId || reviewUserId?.toString() === userId?.toString();
          });
          setUserReview(newReview);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getBookingButtonText = () => {
    if (isEventPassed(event)) {
      return 'Événement terminé';
    }

    // Check if user is already registered (but not cancelled)
    if (userParticipation && userParticipation.status !== 'cancelled') {
      if (userParticipation.status === 'confirmed') {
        return 'Inscription confirmée';
      } else if (userParticipation.status === 'pending') {
        return 'Inscription en attente';
      }
    }

    // If user has cancelled participation, show re-registration option
    if (userParticipation && userParticipation.status === 'cancelled') {
      return 'Se réinscrire';
    }

    const activeParticipants =
      event.participants?.filter(p => p.status !== 'cancelled').length || 0;
    if (activeParticipants >= event.maxParticipants) {
      return 'Complet';
    }

    if (!event.bookingType || event.bookingType === 'message_only') {
      return 'Demander une réservation';
    }
    if (event.bookingType === 'online_payment') {
      return 'Réserver et payer en ligne';
    }
    return 'Réserver (paiement sur place)';
  };

  const isBookingDisabled = () => {
    if (isEventPassed(event)) return true;

    // Disable if user is already registered (but not cancelled)
    if (userParticipation && userParticipation.status !== 'cancelled') {
      return true;
    }

    // If user has cancelled participation, they can re-register (not disabled)
    if (userParticipation && userParticipation.status === 'cancelled') {
      // Check if event is still available
      const activeParticipants =
        event.participants?.filter(p => p.status !== 'cancelled').length || 0;
      return activeParticipants >= event.maxParticipants;
    }

    const activeParticipants =
      event.participants?.filter(p => p.status !== 'cancelled').length || 0;
    return activeParticipants >= event.maxParticipants;
  };

  const renderBookingModal = () => {
    const totalPrice = event.price ? event.price * bookingQuantity : 0;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Réserver cet événement</h2>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-xl border border-primary-100 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{event.title}</h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-2 text-primary-600" />
                  {formatDate(event.date)} à {formatTime(event.date)}
                </p>
                <p className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-2 text-primary-600" />
                  {event.address || 'Lieu non spécifié'}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="booking-quantity"
                className="block text-sm font-semibold text-gray-800 mb-3"
              >
                Nombre de places
              </label>
              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                <button
                  onClick={() => setBookingQuantity(Math.max(1, bookingQuantity - 1))}
                  className="p-3 text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bookingQuantity <= 1}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <input
                  id="booking-quantity"
                  type="number"
                  min="1"
                  max={
                    event.maxParticipants -
                    (event.participants?.filter(p => p.status !== 'cancelled').length || 0)
                  }
                  value={bookingQuantity}
                  onChange={e => setBookingQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1 text-center py-3 bg-transparent font-semibold text-lg focus:outline-none"
                />
                <button
                  onClick={() =>
                    setBookingQuantity(
                      Math.min(
                        event.maxParticipants -
                          (event.participants?.filter(p => p.status !== 'cancelled').length || 0),
                        bookingQuantity + 1
                      )
                    )
                  }
                  className="p-3 text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    bookingQuantity >=
                    event.maxParticipants -
                      (event.participants?.filter(p => p.status !== 'cancelled').length || 0)
                  }
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="booking-note"
                className="block text-sm font-semibold text-gray-800 mb-3"
              >
                Note ou demande spéciale (optionnel)
              </label>
              <textarea
                id="booking-note"
                name="note"
                rows="4"
                value={bookingNote}
                onChange={e => setBookingNote(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Ajoutez une note pour l'organisateur..."
              ></textarea>
            </div>

            {event.price > 0 && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800">Total à payer</span>
                    <span className="text-3xl font-bold text-primary-600">
                      {totalPrice?.amount || totalPrice}{' '}
                      <span className="text-xl">
                        {totalPrice?.currency || event.currency || 'MAD'}
                      </span>
                    </span>
                  </div>
                  {event.bookingType === 'online_payment' && (
                    <div className="flex items-center text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      <CreditCardIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">Paiement sécurisé par carte bancaire</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={processingBooking}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {processingBooking ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Traitement en cours...
                </>
              ) : (
                getBookingButtonText()
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-violet-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-violet-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-pink-100">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Événement non trouvé</h1>
            <p className="text-gray-600 mb-6">
              L&apos;événement que vous recherchez n&apos;existe pas ou a été supprimé.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-violet-600 text-white rounded-xl hover:from-pink-700 hover:to-violet-700 font-semibold transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Retour aux événements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Préparer les images pour l'affichage
  const eventImages = [];

  // Ajouter les images de couverture si disponibles
  if (event.coverImages && event.coverImages.length > 0) {
    event.coverImages.forEach(imgUrl => {
      eventImages.push({ url: imgUrl });
    });
  }

  // Si aucune image n'est disponible, utiliser l'image par défaut
  if (eventImages.length === 0) {
    eventImages.push({ url: 'http://localhost:5000/uploads/events/default.jpg' });
  }

  // Sécuriser l'accès à l'image active
  const activeImageIndex = Math.min(activeImage, eventImages.length - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/events"
            className="inline-flex items-center text-white/90 hover:text-white transition-colors font-medium"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            <span>Retour aux événements</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event details */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12 border border-gray-200">
          <div className="relative">
            {/* Main image */}
            <div className="relative overflow-hidden">
              <img
                src={eventImages[activeImageIndex].url}
                alt={event.title}
                className="w-full h-96 object-cover transform hover:scale-105 transition-transform duration-700"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = 'http://localhost:5000/uploads/events/default.jpg';
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

              {/* Event status badge */}
              {isEventPassed(event) && (
                <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-medium">Événement terminé</span>
                </div>
              )}
            </div>

            {/* Image thumbnails */}
            {eventImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {eventImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      activeImageIndex === index
                        ? 'bg-white shadow-lg scale-110'
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  ></button>
                ))}
              </div>
            )}

            {/* Favorite button */}
            <button
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white shadow-lg transition-all"
            >
              <HeartIconOutline
                className={`w-6 h-6 ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-600'}`}
              />
            </button>
          </div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
              <div className="flex-1">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {event.title}
                  </h1>
                  {event.stats && event.stats.totalReviews > 0 && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                        <span className="text-yellow-500 mr-1 text-lg">★</span>
                        <span className="font-medium text-gray-700">
                          {event.stats.averageRating}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({event.stats.totalReviews} avis)
                        </span>
                      </div>
                      {isAuthenticated && isEventPassed(event) && !userReview && (
                        <button
                          onClick={() => setIsReviewModalOpen(true)}
                          className="ml-4 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Laisser un avis
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <CalendarDaysIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Date</p>
                      <p className="text-gray-900 font-semibold">
                        {formatDate(event.date)}
                        {event.endDate &&
                          event.endDate !== event.date &&
                          ` - ${formatDate(event.endDate)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <ClockIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Horaire</p>
                      <p className="text-gray-900 font-semibold">
                        {formatTime(event.date)}
                        {event.endDate && ` - ${formatTime(event.endDate)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <MapPinIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Lieu</p>
                      <p className="text-gray-900 font-semibold">
                        {event.address || 'Lieu non spécifié'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <UserGroupIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Participants</p>
                      <p className="text-gray-900 font-semibold">
                        {event.participants?.filter(p => p.status !== 'cancelled').length || 0}/
                        {event.maxParticipants || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-xl border border-primary-100">
                  <div className="flex items-center">
                    <div className="bg-primary-500 p-3 rounded-full mr-4">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Prix</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(event.price?.amount || event.price) === 0 ? (
                          <span className="text-green-600">Gratuit</span>
                        ) : (
                          <>
                            {event.price?.amount || event.price}{' '}
                            <span className="text-lg">
                              {event.price?.currency || event.currency || 'MAD'}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-none w-full lg:w-96">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 sticky top-8">
                  {event.professional && (
                    <div className="mb-6 flex items-center">
                      <div className="relative">
                        <img
                          src={
                            event.professional.profileImage ||
                            'https://placehold.co/60x60/gray/white?text=Pro'
                          }
                          alt={event.professional.businessName || 'Professionnel'}
                          className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-pink-200"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {event.professional.businessName ||
                            `${event.professional.firstName} ${event.professional.lastName}`}
                        </h3>
                        <p className="text-sm text-gray-500">Organisateur</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    {/* Main booking button */}
                    <button
                      onClick={openBookingModal}
                      disabled={isBookingDisabled()}
                      className={`w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        isEventPassed(event)
                          ? 'from-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-500'
                          : userParticipation && userParticipation.status !== 'cancelled'
                            ? userParticipation.status === 'confirmed'
                              ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                              : 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                            : ''
                      }`}
                    >
                      {isEventPassed(event) ? (
                        <>
                          <XCircleIcon className="w-6 h-6 mr-3" />
                          Événement terminé
                        </>
                      ) : userParticipation && userParticipation.status !== 'cancelled' ? (
                        <>
                          {userParticipation.status === 'confirmed' ? (
                            <CheckCircleIcon className="w-6 h-6 mr-3" />
                          ) : (
                            <AlertCircleIcon className="w-6 h-6 mr-3" />
                          )}
                          {getBookingButtonText()}
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 mr-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {getBookingButtonText()}
                        </>
                      )}
                    </button>

                    {/* Review invitation for completed events */}
                    {isEventPassed(event) &&
                      userParticipation &&
                      userParticipation.status === 'confirmed' &&
                      !userReview && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-xl mb-4">
                          <div className="flex items-start">
                            <StarIcon className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-yellow-800 mb-1">
                                Partagez votre expérience !
                              </h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                Comment s'est passé cet événement ? Votre avis aidera d'autres
                                participants à faire leur choix.
                              </p>
                              <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                              >
                                <StarIcon className="w-4 h-4 mr-2" />
                                Laisser un avis
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* User participation status display - Show first if user has active participation */}
                    {userParticipation &&
                      userParticipation.status !== 'cancelled' &&
                      !isEventPassed(event) && (
                        <div
                          className={`p-4 rounded-xl border ${
                            userParticipation.status === 'confirmed'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center">
                            {userParticipation.status === 'confirmed' ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                            ) : (
                              <AlertCircleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                            )}
                            <div>
                              <p
                                className={`font-medium ${
                                  userParticipation.status === 'confirmed'
                                    ? 'text-green-800'
                                    : 'text-yellow-800'
                                }`}
                              >
                                {userParticipation.status === 'confirmed'
                                  ? 'Votre inscription est confirmée'
                                  : 'Votre inscription est en attente de confirmation'}
                              </p>
                              <p
                                className={`text-sm ${
                                  userParticipation.status === 'confirmed'
                                    ? 'text-green-600'
                                    : 'text-yellow-600'
                                }`}
                              >
                                Inscrit le{' '}
                                {new Date(userParticipation.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Event completed status for confirmed participants */}
                    {isEventPassed(event) &&
                      userParticipation &&
                      userParticipation.status === 'confirmed' && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
                            <div>
                              <p className="font-medium text-blue-800">
                                Vous avez participé à cet événement
                              </p>
                              <p className="text-sm text-blue-600">
                                Événement terminé le {formatDate(event.endDate || event.date)}
                              </p>
                              {userReview && (
                                <p className="text-sm text-blue-600 mt-1">
                                  ✨ Merci d'avoir laissé votre avis !
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Cancel registration button */}
                    {userParticipation &&
                      userParticipation.status !== 'cancelled' &&
                      !isEventPassed(event) && (
                        <button
                          onClick={handleCancelRegistration}
                          disabled={cancellingRegistration}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {cancellingRegistration ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Annulation en cours...
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-5 h-5 mr-2" />
                              Annuler mon inscription
                            </>
                          )}
                        </button>
                      )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (event.professional) {
                            // Utiliser l'ID du professionnel s'il existe
                            const professionalId = event.professional._id;

                            if (professionalId) {
                              // Naviguer vers la page du professionnel avec l'ID du professionnel
                              navigate(`/professionals/${professionalId}`);
                            } else {
                              toast.error('ID du professionnel non disponible');
                            }
                          } else {
                            toast.error('Profil du professionnel non disponible');
                          }
                        }}
                        className="bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 flex items-center justify-center font-medium"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profil
                      </button>

                      <button
                        onClick={e => {
                          if (!isAuthenticated) {
                            e.preventDefault();
                            toast.error('Veuillez vous connecter pour contacter le professionnel');
                            navigate('/login', { state: { from: `/events/${id}` } });
                          } else if (event.professional) {
                            // Utiliser l'ID du professionnel ou son ID utilisateur
                            const messageId = event.professional.userId || event.professional._id;
                            navigate(`/messages/${messageId}`, {
                              state: {
                                professional: event.professional,
                                isClient: true, // Ajouter cette information pour identifier que c'est un client qui envoie le message
                              },
                            });
                          } else {
                            toast.error('Impossible de trouver les informations du professionnel');
                          }
                        }}
                        className="bg-white border-2 border-violet-200 text-gray-700 py-2 px-3 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all duration-300 flex items-center justify-center text-sm font-medium"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        Message
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Informations de réservation
                    </h4>
                    {event.bookingType === 'online_payment' ? (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <CreditCardIcon className="w-5 h-5 mr-2 text-green-600" />
                        <span className="font-medium">Réservation et paiement en ligne</span>
                      </div>
                    ) : event.bookingType === 'in_person_payment' ? (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">
                          Réservation en ligne, paiement sur place
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-orange-600" />
                        <span className="font-medium">Réservation sur demande</span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Places restantes</span>
                        <span className="font-semibold text-primary-600">
                          {event.maxParticipants -
                            (event.participants?.filter(p => p.status !== 'cancelled').length || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-full mr-4">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Description de l&apos;événement
                </h2>
              </div>
              <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line text-lg">
                {event.description}
              </div>
            </div>

            {/* Reviews Section */}
            {event.reviews && event.reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-3 rounded-full mr-4">
                      <StarIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Avis des participants</h2>
                  </div>
                  {event.stats && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1 text-xl">★</span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {event.stats.averageRating}
                      </span>
                      <span className="text-gray-500 ml-1">({event.stats.totalReviews})</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(showAllReviews ? event.reviews : event.reviews.slice(0, 3)).map(
                    (review, index) => (
                      <div key={review._id || index} className="bg-gray-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {review.comment && <p className="text-gray-700">{review.comment}</p>}
                      </div>
                    )
                  )}
                </div>

                {event.reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showAllReviews ? 'Voir moins' : `Voir tous les avis (${event.reviews.length})`}
                  </button>
                )}
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-full mr-4">
                  <MapPinIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Localisation</h2>
              </div>
              <div className="mb-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <MapPinIcon className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-gray-800 font-medium text-lg">
                    {event.address || 'Lieu non spécifié'}
                  </span>
                </div>
              </div>

              <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-6 border border-gray-200">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-gray-500 font-medium">
                    Carte interactive - fonctionnalité en cours de développement
                  </p>
                </div>
                {/* Dans une application réelle, ce serait un composant Google Maps ou Mapbox */}
              </div>

              {event.locationCoordinates &&
                event.locationCoordinates.lat &&
                event.locationCoordinates.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.locationCoordinates.lat},${event.locationCoordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-4 py-3 rounded-xl hover:bg-primary-100 transition-colors"
                  >
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    Ouvrir dans Google Maps
                  </a>
                )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Informations pratiques */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-full mr-4">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Informations pratiques</h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Tarif
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    {(event.price?.amount || event.price) === 0 ? (
                      'Gratuit'
                    ) : (
                      <>
                        {event.price?.amount || event.price}{' '}
                        {event.price?.currency || event.currency || 'MAD'}
                      </>
                    )}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Disponibilité
                  </h3>
                  <p className="text-lg text-blue-700 font-medium">
                    <span className="text-2xl font-bold">
                      {event.maxParticipants -
                        (event.participants?.filter(p => p.status !== 'cancelled').length || 0)}
                    </span>{' '}
                    places restantes
                  </p>
                  <div className="mt-3 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          ((event.participants?.filter(p => p.status !== 'cancelled').length || 0) /
                            event.maxParticipants) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Enhanced Section */}
            {event.professional && (
              <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-pink-200">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-pink-100 to-violet-100 p-3 rounded-full mr-3">
                    <BriefcaseIcon className="w-5 h-5 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Organisé par</h2>
                </div>

                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-pink-100">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={
                          event.professional.profileImage ||
                          'https://placehold.co/80x80/gray/white?text=Pro'
                        }
                        alt={event.professional.businessName || 'Professionnel'}
                        className="w-20 h-20 rounded-xl object-cover border-3 border-white shadow-lg"
                      />
                      {event.professional.isVerified && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {event.professional.businessName ||
                          `${event.professional.firstName} ${event.professional.lastName}`}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {event.professional.profession || 'Professionnel'}
                      </p>
                      {event.professional.rating && (
                        <div className="flex items-center mb-3">
                          <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="font-medium text-gray-700">
                              {event.professional.rating.average}
                            </span>
                            <span className="text-gray-500 ml-1 text-sm">
                              ({event.professional.rating.totalReviews} avis)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-violet-50 p-3 rounded-lg text-center">
                      <AwardIcon className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-700">Expérience</p>
                      <p className="text-xs text-gray-500">
                        {event.professional.experience || '5+ ans'}
                      </p>
                    </div>
                    <div className="bg-pink-50 p-3 rounded-lg text-center">
                      <UsersIcon className="w-6 h-6 text-pink-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-700">Événements</p>
                      <p className="text-xs text-gray-500">
                        {event.professional.totalEvents || '10+'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {event.professional.contactInfo && (
                    <div className="mt-6 space-y-2 pt-4 border-t border-pink-100">
                      {event.professional.contactInfo.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{event.professional.contactInfo.phone}</span>
                        </div>
                      )}
                      {event.professional.contactInfo.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{event.professional.contactInfo.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (event.professional) {
                        const professionalId = event.professional._id;
                        if (professionalId) {
                          navigate(`/professionals/${professionalId}`);
                        } else {
                          toast.error('ID du professionnel non disponible');
                        }
                      } else {
                        toast.error('Profil du professionnel non disponible');
                      }
                    }}
                    className="w-full mt-6 bg-gradient-to-r from-violet-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-violet-700 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center justify-center group"
                  >
                    <svg
                      className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Voir le profil complet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && renderBookingModal()}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userReview ? 'Modifier mon avis' : 'Laisser un avis'}
                </h2>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-xl border border-primary-100 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">{event.title}</h3>
                <div className="space-y-2 text-gray-600">
                  <p className="flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 mr-2 text-primary-600" />
                    {formatDate(event.date)} à {formatTime(event.date)}
                  </p>
                  <p className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2 text-primary-600" />
                    {event.address || 'Lieu non spécifié'}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <label
                  htmlFor="review-rating"
                  className="block text-sm font-semibold text-gray-800 mb-3"
                >
                  Votre évaluation
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transform transition-transform hover:scale-110"
                    >
                      <StarIcon
                        className={`w-10 h-10 ${
                          star <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center mt-2 text-sm text-gray-600">
                  {reviewRating === 5 && 'Excellent !'}
                  {reviewRating === 4 && 'Très bien'}
                  {reviewRating === 3 && 'Bien'}
                  {reviewRating === 2 && 'Moyen'}
                  {reviewRating === 1 && 'Décevant'}
                </p>
              </div>

              <div className="mb-8">
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-semibold text-gray-800 mb-3"
                >
                  Votre commentaire (optionnel)
                </label>
                <textarea
                  id="review-comment"
                  name="comment"
                  rows="4"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Partagez votre expérience avec les autres participants..."
                ></textarea>
              </div>

              <button
                onClick={handleReviewSubmit}
                disabled={submittingReview}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submittingReview ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Envoi en cours...
                  </>
                ) : userReview ? (
                  'Modifier mon avis'
                ) : (
                  'Publier mon avis'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
