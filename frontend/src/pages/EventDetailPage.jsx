import {
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import _axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [bookingNote, setBookingNote] = useState('');
  const [processingBooking, setProcessingBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        // Récupération des données depuis l'API
        const response = await _axios.get(`http://localhost:5000/api/events/${id}`);

        // Vérifier si les données ont été récupérées correctement
        if (response.data && response.data.event) {
          setEvent(response.data.event);
        } else {
          toast.error("Impossible de récupérer les détails de l'événement");
        }

        setLoading(false);

        // Check if this event is in user's favorites
        if (isAuthenticated) {
          // Dans une application réelle, cela serait un appel API
          // const favResponse = await _axios.get('/api/favorites');
          // const isFav = favResponse.data.favorites.some(fav => fav.eventId === id);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error("Erreur lors du chargement des détails de l'événement");
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, isAuthenticated]);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatTime = dateString => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };

  const formatSkillLevel = level => {
    const levelMap = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      all_levels: 'Tous niveaux',
    };
    return levelMap[level] || level;
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        // await _axios.delete(`/api/favorites/events/${id}`);
        toast.success('Événement retiré des favoris');
      } else {
        // Add to favorites
        // await _axios.post('/api/favorites/events', { eventId: id });
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
      // Dans une application réelle, cela serait un appel API
      const response = await _axios.post('http://localhost:5000/api/events/' + id + '/register', {
        quantity: bookingQuantity,
        note: bookingNote,
      });

      if (response.data && response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Réservation effectuée avec succès');
      }

      closeBookingModal();
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setProcessingBooking(false);
    }
  };

  const getBookingButtonText = () => {
    if (!event.bookingType || event.bookingType === 'message_only') {
      return 'Demander une réservation';
    }
    if (event.bookingType === 'online_payment') {
      return 'Réserver et payer en ligne';
    }
    return 'Réserver (paiement sur place)';
  };

  const renderBookingModal = () => {
    const totalPrice = event.price ? event.price * bookingQuantity : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Réserver cet événement</h2>
              <button onClick={closeBookingModal} className="text-gray-500 hover:text-gray-700">
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

            <div className="mb-6">
              <h3 className="font-medium mb-2">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {formatDate(event.date)} à {formatTime(event.date)}
              </p>
              <p className="text-sm text-gray-600">{event.address || 'Lieu non spécifié'}</p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="booking-quantity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre de places
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setBookingQuantity(Math.max(1, bookingQuantity - 1))}
                  className="p-2 border border-gray-300 rounded-l-md"
                  disabled={bookingQuantity <= 1}
                >
                  -
                </button>
                <input
                  id="booking-quantity"
                  type="number"
                  min="1"
                  max={event.maxParticipants - (event.participants?.length || 0)}
                  value={bookingQuantity}
                  onChange={e => setBookingQuantity(parseInt(e.target.value) || 1)}
                  className="p-2 w-16 text-center border-t border-b border-gray-300 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() =>
                    setBookingQuantity(
                      Math.min(
                        event.maxParticipants - (event.participants?.length || 0),
                        bookingQuantity + 1
                      )
                    )
                  }
                  className="p-2 border border-gray-300 rounded-r-md"
                  disabled={
                    bookingQuantity >= event.maxParticipants - (event.participants?.length || 0)
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="booking-note"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Note ou demande spéciale (optionnel)
              </label>
              <textarea
                id="booking-note"
                name="note"
                rows="3"
                value={bookingNote}
                onChange={e => setBookingNote(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ajoutez une note pour l'organisateur..."
              ></textarea>
            </div>

            {event.price > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center py-2 border-t border-b border-gray-200">
                  <span className="font-medium">Total à payer</span>
                  <span className="font-semibold text-lg">
                    {totalPrice} {event.currency || 'MAD'}
                  </span>
                </div>
                {event.bookingType === 'online_payment' && (
                  <p className="text-xs text-gray-500 mt-2">
                    <CreditCardIcon className="inline-block w-4 h-4 mr-1" />
                    Paiement sécurisé par carte bancaire
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={processingBooking}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-xl font-semibold mb-4">Événement non trouvé</h1>
            <p className="text-gray-600 mb-6">
              L'événement que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
    eventImages.push({ url: 'http://localhost:5000/uploads/events/1749834623480-860019398.jpg' });
  }

  // Sécuriser l'accès à l'image active
  const activeImageIndex = Math.min(activeImage, eventImages.length - 1);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link to="/events" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Retour aux événements
          </Link>
        </div>

        {/* Event header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative">
            {/* Main image */}
            <img
              src={eventImages[activeImageIndex].url}
              alt={event.title}
              className="w-full h-80 object-cover"
              onError={e => {
                e.target.onerror = null;
                e.target.src = 'http://localhost:5000/uploads/events/1749834623480-860019398.jpg';
              }}
            />

            {/* Image thumbnails */}
            {eventImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {eventImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-3 h-3 rounded-full ${
                      activeImageIndex === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  ></button>
                ))}
              </div>
            )}

            {/* Favorite button */}
            <button
              onClick={handleFavoriteToggle}
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
            >
              {isFavorite ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                {event.professional && event.professional.rating && (
                  <div className="flex items-center mb-4">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span>
                      {event.professional.rating.average} ({event.professional.rating.totalReviews}{' '}
                      avis)
                    </span>
                  </div>
                )}
                <div className="flex flex-col space-y-3 mb-6">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span>
                      {formatDate(event.date)} -{' '}
                      {event.endDate ? formatDate(event.endDate) : formatDate(event.date)}{' '}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span>
                      {formatTime(event.date)} -{' '}
                      {event.endDate ? formatTime(event.endDate) : ''}{' '}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span>{event.address || 'Lieu non spécifié'}</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span>
                      {event.participants ? event.participants.length : 0}/
                      {event.maxParticipants || 'N/A'} participants
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span>
                      {event.price === 0 ? (
                        'Gratuit'
                      ) : (
                        <>
                          {event.price} {event.currency || 'MAD'}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-none w-full md:w-80">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {event.professional && (
                    <div className="mb-4 flex items-center">
                      <img
                        src={
                          event.professional.profileImage ||
                          'https://placehold.co/50x50/gray/white?text=Pro'
                        }
                        alt={event.professional.businessName || 'Professionnel'}
                        className="w-12 h-12 rounded-full mr-3"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/50x50/gray/white?text=Pro';
                        }}
                      />
                      <div>
                        <h3 className="font-medium">
                          {event.professional.businessName ||
                            `${event.professional.firstName} ${event.professional.lastName}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {event.professional.firstName} {event.professional.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    <button
                      onClick={openBookingModal}
                      className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Réserver
                    </button>

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
                      className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      Voir le profil du professionnel
                    </button>

                    <button
                      onClick={e => {
                        if (!isAuthenticated) {
                          e.preventDefault();
                          toast.error('Veuillez vous connecter pour contacter le professionnel');
                          navigate('/login', { state: { from: `/events/${id}` } });
                        } else if (!event.professional || !event.professional.userId) {
                          e.preventDefault();
                          // Create a mock professional if needed
                          const mockProfessionalId = 'temp-' + Date.now();
                          navigate(`/messages/${mockProfessionalId}`);
                          toast.success(
                            'Certaines informations du professionnel peuvent être limitées'
                          );
                        } else {
                          navigate(`/messages/${event.professional.userId}`);
                        }
                      }}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Contacter le professionnel
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    {event.bookingType === 'online_payment' ? (
                      <p className="flex items-center mb-1">
                        <CreditCardIcon className="w-4 h-4 mr-1" />
                        Réservation et paiement en ligne
                      </p>
                    ) : event.bookingType === 'in_person_payment' ? (
                      <p className="flex items-center mb-1">
                        <CalendarDaysIcon className="w-4 h-4 mr-1" />
                        Réservation en ligne, paiement sur place
                      </p>
                    ) : (
                      <p className="flex items-center mb-1">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                        Réservation sur demande
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="text-gray-700 space-y-4 whitespace-pre-line">{event.description}</div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Lieu</h2>
              <p className="mb-3">{event.address || 'Lieu non spécifié'}</p>

              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">Carte - fonctionnalité en cours de développement</p>
                {/* Dans une application réelle, ce serait un composant Google Maps ou Mapbox */}
              </div>

              {event.locationCoordinates &&
                event.locationCoordinates.lat &&
                event.locationCoordinates.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.locationCoordinates.lat},${event.locationCoordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline flex items-center"
                  >
                    <MapPinIcon className="w-5 h-5 mr-1" />
                    Voir sur Google Maps
                  </a>
                )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Informations pratiques */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Informations pratiques</h2>

              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Prix</h3>
                <p>{event.price === 0 ? 'Gratuit' : `${event.price} ${event.currency || 'MAD'}`}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Places disponibles</h3>
                <p>
                  {event.maxParticipants - (event.participants ? event.participants.length : 0)}{' '}
                  places restantes
                </p>
              </div>
            </div>

            {/* Professional */}
            {event.professional && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">À propos du professionnel</h2>
                <div className="flex items-center mb-4">
                  <img
                    src={
                      event.professional.profileImage ||
                      'https://placehold.co/50x50/gray/white?text=Pro'
                    }
                    alt={event.professional.businessName || 'Professionnel'}
                    className="w-16 h-16 rounded-full mr-4"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/50x50/gray/white?text=Pro';
                    }}
                  />
                  <div>
                    <h3 className="font-medium">
                      {event.professional.businessName ||
                        `${event.professional.firstName} ${event.professional.lastName}`}
                    </h3>
                    {event.professional.rating && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span>
                          {event.professional.rating.average} (
                          {event.professional.rating.totalReviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
                  className="text-primary-600 hover:underline cursor-pointer"
                >
                  Voir le profil complet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && renderBookingModal()}
    </div>
  );
};

export default EventDetailPage;
