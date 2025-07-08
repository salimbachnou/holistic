import {
  CheckIcon,
  ClockIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import axios from 'axios';
import { addMinutes, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { toast } from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaEuroSign,
  FaEye,
  FaLink,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaUser,
  FaUsers,
  FaVideo,
} from 'react-icons/fa';

import BookingModal from '../../components/Common/BookingModal';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import MapPicker from '../../components/Common/MapPicker';
import Modal from '../../components/Common/Modal';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import { useAuth } from '../../contexts/AuthContext';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './ProfessionalSessionsPage.css';

// Configure moment for French locale
moment.locale('fr');
const localizer = momentLocalizer(moment);

// Google Maps options
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 33.589886, // Morocco center
  lng: -7.603869, // Casablanca
};

const libraries = ['places'];

const ProfessionalSessionsPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  // Video call functionality removed - using external links only
  const searchInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    maxParticipants: 10,
    price: 0,
    category: 'individual',
    location: '',
    locationCoordinates: {
      lat: null,
      lng: null,
    },
    meetingLink: '',
    // useBuiltInVideo removed - external links only
    notes: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Initialize places autocomplete
  const initPlacesAutocomplete = useCallback(() => {
    if (!isLoaded || !searchInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMapCenter(location);
        setSelectedLocation(location);
        setFormData(prev => ({
          ...prev,
          location: place.formatted_address,
          locationCoordinates: location,
        }));
      }
    });
  }, [isLoaded]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (isLoaded && isFormModalOpen) {
      initPlacesAutocomplete();
    }
  }, [isLoaded, isFormModalOpen, initPlacesAutocomplete]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/sessions/professional`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionBookings = async sessionId => {
    try {
      setIsLoadingRequests(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/sessions/${sessionId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookingRequests(response.data.bookings);
    } catch (error) {
      console.error('Error fetching session bookings:', error);
      toast.error('Erreur lors du chargement des demandes de réservation');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchSpecificBooking = async bookingId => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Nouvelle réservation chargée avec succès');
        // Refresh the bookings list if a session is selected
        if (selectedSession) {
          fetchSessionBookings(selectedSession._id);
        }
        // Also refresh sessions to get updated data
        fetchSessions();
        return response.data.booking;
      }
    } catch (error) {
      console.error('Error fetching specific booking:', error);
      toast.error('Erreur lors du chargement de la réservation');
    }
  };

  const refreshBookingRequests = async () => {
    if (selectedSession) {
      await fetchSessionBookings(selectedSession._id);
      toast.success('Demandes de réservation actualisées');
    } else {
      toast.info('Veuillez sélectionner une session pour voir les demandes');
    }
  };

  // Function to load a specific booking by ID (useful for debugging)
  const loadSpecificBooking = async bookingId => {
    try {
      const booking = await fetchSpecificBooking(bookingId);
      if (booking) {
        // If the booking has a session, try to select that session
        if (booking.service.sessionId) {
          const session = sessions.find(s => s._id === booking.service.sessionId);
          if (session) {
            handleSessionSelect(session);
          }
        }
      }
    } catch (error) {
      console.error('Error loading specific booking:', error);
    }
  };

  // Expose function to window for debugging
  React.useEffect(() => {
    window.loadSpecificBooking = loadSpecificBooking;
    return () => {
      delete window.loadSpecificBooking;
    };
  }, [sessions, loadSpecificBooking]);

  const handleSessionSelect = session => {
    setSelectedSession(session);
    setIsModalOpen(true);
    fetchSessionBookings(session._id);
    // Video call functionality removed - using external links only
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    setBookingRequests([]);
  };

  const handleFormSubmit = async e => {
    e.preventDefault();

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Prepare session data - only external meeting links supported
      const sessionData = { ...formData };

      // Clean up data based on category
      if (sessionData.category === 'online') {
        // For online sessions, remove location fields if they're empty/null
        if (!sessionData.location || sessionData.location.trim() === '') {
          delete sessionData.location;
        }
        if (
          !sessionData.locationCoordinates ||
          sessionData.locationCoordinates.lat === null ||
          sessionData.locationCoordinates.lng === null
        ) {
          delete sessionData.locationCoordinates;
        }
      } else {
        // For physical sessions, ensure meetingLink is not required
        if (!sessionData.meetingLink || sessionData.meetingLink.trim() === '') {
          delete sessionData.meetingLink;
        }
        // Clean up locationCoordinates if they're null
        if (
          sessionData.locationCoordinates &&
          (sessionData.locationCoordinates.lat === null ||
            sessionData.locationCoordinates.lng === null)
        ) {
          delete sessionData.locationCoordinates;
        }
      }

      console.log('=== FRONTEND SESSION CREATION DEBUG ===');
      console.log('Form data:', JSON.stringify(formData, null, 2));
      console.log('Session data to send:', JSON.stringify(sessionData, null, 2));
      console.log('Is editing:', isEditing);

      if (isEditing) {
        // Update session
        console.log('Updating session with ID:', sessionData._id);
        await axios.put(`${API_URL}/api/sessions/${sessionData._id}`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Session mise à jour avec succès');
      } else {
        // Create new session
        console.log('Creating new session...');
        const response = await axios.post(`${API_URL}/api/sessions`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Session creation response:', response.data);
        toast.success('Session créée avec succès');
      }

      setIsFormModalOpen(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('=== FRONTEND SESSION CREATION ERROR ===');
      console.error('Error saving session:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde de la session');
    }
  };

  const handleEditSession = session => {
    const locationCoordinates = session.locationCoordinates || { lat: null, lng: null };
    setFormData({
      _id: session._id,
      title: session.title,
      description: session.description,
      startTime: format(new Date(session.startTime), "yyyy-MM-dd'T'HH:mm"),
      duration: session.duration,
      maxParticipants: session.maxParticipants,
      price: session.price,
      category: session.category,
      location: session.location || '',
      locationCoordinates,
      meetingLink: session.meetingLink || '',
      // useBuiltInVideo removed - external links only
      notes: session.notes || '',
    });

    if (locationCoordinates.lat && locationCoordinates.lng) {
      setSelectedLocation(locationCoordinates);
      setMapCenter(locationCoordinates);
    }

    setIsEditing(true);
    setIsFormModalOpen(true);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_URL}/api/sessions/${selectedSession._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Session annulée avec succès');
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error("Erreur lors de l'annulation de la session");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      duration: 60,
      maxParticipants: 10,
      price: 0,
      category: 'individual',
      location: '',
      locationCoordinates: {
        lat: null,
        lng: null,
      },
      meetingLink: '',
      // useBuiltInVideo removed - external links only
      notes: '',
    });
    setSelectedLocation(null);
    setMapCenter(defaultCenter);
    setSearchAddress('');
    setIsEditing(false);
  };

  const handleNewSession = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddressInputChange = e => {
    setSearchAddress(e.target.value);
    setFormData(prevData => ({
      ...prevData,
      location: e.target.value,
    }));
  };

  const handleMapClick = e => {
    if (formData.category === 'online') return;

    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setSelectedLocation(location);
    setFormData(prevData => ({
      ...prevData,
      locationCoordinates: location,
    }));

    // Afficher un message temporaire pendant la recherche d'adresse
    setSearchAddress("Recherche de l'adresse...");

    // Get address from coordinates using reverse geocoding
    if (isLoaded) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setSearchAddress(formattedAddress);
          setFormData(prevData => ({
            ...prevData,
            location: formattedAddress,
          }));

          // Notification de confirmation
          toast.success('Lieu sélectionné avec succès');
        } else {
          // En cas d'erreur, afficher au moins les coordonnées comme texte
          const coordsText = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
          setSearchAddress(coordsText);
          setFormData(prevData => ({
            ...prevData,
            location: coordsText,
          }));

          toast.error("Impossible de trouver l'adresse. Coordonnées enregistrées.");
        }
      });
    }
  };

  const handleBookingStatusChange = async (bookingId, status, reason = '') => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_URL}/api/sessions/bookings/${bookingId}`,
        { status, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Réservation ${status === 'confirmed' ? 'confirmée' : 'refusée'} avec succès`);
      fetchSessionBookings(selectedSession._id);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour du statut de la réservation');
    }
  };

  // Format sessions for calendar
  const calendarEvents = sessions.map(session => ({
    id: session._id,
    title: session.title,
    start: new Date(session.startTime),
    end: addMinutes(new Date(session.startTime), session.duration),
    resource: session,
  }));

  // Get session status class
  const getStatusClass = status => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = dateString => {
    return format(new Date(dateString), 'PPP à HH:mm', { locale: fr });
  };

  // Render map
  const renderMap = () => {
    if (loadError)
      return <div className="p-4 text-red-500">Erreur lors du chargement de la carte</div>;
    if (!isLoaded) return <div className="p-4">Chargement de la carte...</div>;

    return (
      <div className="mb-4 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={13}
          onClick={handleMapClick}
        >
          {selectedLocation && <Marker position={selectedLocation} />}
        </GoogleMap>

        {/* Bouton pour utiliser la position actuelle */}
        <button
          type="button"
          onClick={getCurrentLocation}
          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md z-10 hover:bg-gray-100"
          title="Utiliser ma position actuelle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  };

  // Récupérer la position actuelle de l'utilisateur
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Recherche de votre position...', { id: 'geolocation' });

      navigator.geolocation.getCurrentPosition(
        position => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setMapCenter(currentLocation);
          setSelectedLocation(currentLocation);

          // Convertir les coordonnées en adresse
          if (isLoaded) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: currentLocation }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const formattedAddress = results[0].formatted_address;
                setSearchAddress(formattedAddress);
                setFormData(prevData => ({
                  ...prevData,
                  location: formattedAddress,
                  locationCoordinates: currentLocation,
                }));
                toast.success('Position actuelle détectée', { id: 'geolocation' });
              } else {
                const coordsText = `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
                setSearchAddress(coordsText);
                setFormData(prevData => ({
                  ...prevData,
                  location: coordsText,
                  locationCoordinates: currentLocation,
                }));
                toast.success('Position actuelle détectée (sans adresse)', { id: 'geolocation' });
              }
            });
          } else {
            toast.error("Le service de géocodage n'est pas disponible", { id: 'geolocation' });
          }
        },
        error => {
          console.error('Erreur de géolocalisation:', error);
          toast.error("Impossible d'obtenir votre position actuelle", { id: 'geolocation' });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header moderne et responsive */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Gestion des Sessions
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Organisez et gérez vos sessions avec vos clients
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => loadSpecificBooking('6868a28a160cd27b20e2b91f')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                title="Charger la réservation de Samih Bachnou"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">Charger Réservation</span>
                <span className="sm:hidden">Charger</span>
              </button>
              <button
                onClick={fetchSessions}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base flex-1 sm:flex-none justify-center"
                disabled={loading}
              >
                <svg
                  className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {loading ? 'Actualisation...' : 'Actualiser'}
                </span>
                <span className="sm:hidden">{loading ? '...' : 'Sync'}</span>
              </button>
              <button
                onClick={handleNewSession}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base flex-1 sm:flex-none justify-center"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nouvelle Session</span>
                <span className="sm:hidden">Nouveau</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal responsive */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-200 border-b-purple-600 rounded-full animate-ping"></div>
            </div>
            <p className="text-gray-600 mt-4 text-base sm:text-lg">Chargement de vos sessions...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header du calendrier responsive */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                <span className="hidden sm:inline">Calendrier des Sessions</span>
                <span className="sm:hidden">Sessions</span>
              </h2>
            </div>

            {/* Calendrier avec style amélioré et responsive */}
            <div className="p-3 sm:p-6">
              <div className="calendar-container overflow-hidden">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{
                    height: window.innerWidth < 640 ? 400 : window.innerWidth < 768 ? 500 : 650,
                    fontSize: window.innerWidth < 640 ? '12px' : '14px',
                  }}
                  onSelectEvent={event => handleSessionSelect(event.resource)}
                  eventPropGetter={event => {
                    const status = event.resource.status;
                    let backgroundColor = '#4F46E5';
                    const borderRadius = '6px';
                    const border = 'none';

                    if (status === 'cancelled') {
                      backgroundColor = '#EF4444';
                    } else if (status === 'completed') {
                      backgroundColor = '#10B981';
                    } else if (status === 'in_progress') {
                      backgroundColor = '#F59E0B';
                    }

                    return {
                      style: {
                        backgroundColor,
                        borderRadius,
                        border,
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '14px',
                      },
                    };
                  }}
                  views={['month', 'week', 'day', 'agenda']}
                  messages={{
                    agenda: 'Liste',
                    day: 'Jour',
                    month: 'Mois',
                    next: 'Suivant',
                    previous: 'Précédent',
                    today: "Aujourd'hui",
                    week: 'Semaine',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Session Details Modal */}
        {isModalOpen && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header du modal avec gradient */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedSession.title}</h2>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                          selectedSession.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedSession.status === 'in_progress'
                              ? 'bg-orange-100 text-orange-800'
                              : selectedSession.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : selectedSession.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedSession.status === 'scheduled' && 'Programmée'}
                        {selectedSession.status === 'in_progress' && 'En cours'}
                        {selectedSession.status === 'completed' && 'Terminée'}
                        {selectedSession.status === 'cancelled' && 'Annulée'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border">
                    {selectedSession.description}
                  </p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center text-blue-700 mb-2">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Horaires</span>
                    </div>
                    <p className="text-gray-700">{formatDate(selectedSession.startTime)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Durée: {selectedSession.duration} minutes
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center text-purple-700 mb-2">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Participants</span>
                    </div>
                    <p className="text-gray-700">
                      {selectedSession.participants?.length || 0} /{' '}
                      {selectedSession.maxParticipants}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">places disponibles</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                    <div className="flex items-center text-green-700 mb-2">
                      <CurrencyEuroIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Prix</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{selectedSession.price} MAD</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-100">
                    <div className="flex items-center text-orange-700 mb-2">
                      <UserIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Catégorie</span>
                    </div>
                    <p className="text-gray-700 capitalize">{selectedSession.category}</p>
                  </div>
                </div>

                {/* Informations de lieu/réunion */}
                {selectedSession.location && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Lieu de la session
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-xl border">
                      <p className="text-gray-700 font-medium mb-4">{selectedSession.location}</p>

                      {selectedSession.locationCoordinates &&
                        selectedSession.locationCoordinates.lat &&
                        selectedSession.locationCoordinates.lng &&
                        isLoaded && (
                          <div className="h-64 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                            <GoogleMap
                              mapContainerStyle={{ width: '100%', height: '100%' }}
                              center={{
                                lat: selectedSession.locationCoordinates.lat,
                                lng: selectedSession.locationCoordinates.lng,
                              }}
                              zoom={15}
                              options={{
                                disableDefaultUI: true,
                                zoomControl: true,
                                styles: [
                                  {
                                    featureType: 'all',
                                    stylers: [{ saturation: -20 }],
                                  },
                                ],
                              }}
                            >
                              <Marker
                                position={{
                                  lat: selectedSession.locationCoordinates.lat,
                                  lng: selectedSession.locationCoordinates.lng,
                                }}
                              />
                            </GoogleMap>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {selectedSession.category === 'online' && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaVideo className="mr-2 text-indigo-600" />
                      Réunion en ligne
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                      <div>
                        <p className="text-gray-700 mb-3">
                          <strong>Lien de réunion:</strong>
                        </p>
                        <a
                          href={selectedSession.meetingLink}
                          className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-colors duration-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Rejoindre la réunion
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>

                      {/* Video access errors removed - using external links only */}
                    </div>
                  </div>
                )}

                {selectedSession.notes && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Notes additionnelles
                    </h3>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <p className="text-gray-700">{selectedSession.notes}</p>
                    </div>
                  </div>
                )}
                {/* Section des demandes de réservation */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <UserGroupIcon className="h-6 w-6 mr-2 text-indigo-600" />
                      Demandes de réservation
                      <span className="ml-3 bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                        {bookingRequests.length}
                      </span>
                    </h3>
                    <button
                      onClick={refreshBookingRequests}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-300 transform hover:-translate-y-1"
                      disabled={isLoadingRequests}
                    >
                      <svg
                        className={`h-4 w-4 mr-2 ${isLoadingRequests ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {isLoadingRequests ? 'Actualisation...' : 'Actualiser'}
                    </button>
                  </div>

                  {isLoadingRequests ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-600 mt-4">Chargement des demandes...</p>
                    </div>
                  ) : bookingRequests.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {bookingRequests.map(booking => (
                        <div
                          key={booking._id}
                          className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {booking.client.firstName.charAt(0)}
                                {booking.client.lastName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {booking.client.firstName} {booking.client.lastName}
                                </h4>
                                <p className="text-sm text-gray-600">{booking.client.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Réservé le{' '}
                                  {format(new Date(booking.createdAt), 'dd/MM/yyyy à HH:mm')}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {booking.status === 'pending' && '⏳ En attente'}
                              {booking.status === 'confirmed' && '✅ Confirmée'}
                              {booking.status === 'cancelled' && '❌ Annulée'}
                              {booking.status === 'completed' && '🎉 Terminée'}
                            </span>
                          </div>

                          {booking.clientNotes && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-blue-800">Notes du client:</span>{' '}
                                {booking.clientNotes}
                              </p>
                            </div>
                          )}

                          {booking.status === 'pending' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleBookingStatusChange(booking._id, 'confirmed')}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <CheckIcon className="h-5 w-5 mr-2" />
                                Accepter
                              </button>
                              <button
                                onClick={() => handleBookingStatusChange(booking._id, 'cancelled')}
                                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-3 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Aucune demande de réservation</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Les nouvelles demandes apparaîtront ici
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions du modal */}
                <div className="border-t border-gray-200 pt-8 flex justify-between">
                  <button
                    onClick={() => handleEditSession(selectedSession)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                    disabled={
                      selectedSession.status === 'completed' ||
                      selectedSession.status === 'cancelled'
                    }
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl flex items-center transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                    disabled={
                      selectedSession.status === 'completed' ||
                      selectedSession.status === 'cancelled'
                    }
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Call functionality removed - using external links only */}

        {/* Session Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header du modal avec gradient */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {isEditing ? 'Modifier la session' : 'Créer une nouvelle session'}
                    </h2>
                    <p className="text-indigo-100 mt-1">
                      {isEditing
                        ? 'Modifiez les détails de votre session'
                        : 'Configurez votre nouvelle session'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseFormModal}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenu du formulaire avec scroll */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleFormSubmit} className="p-8">
                  <div className="space-y-8">
                    {/* Informations de base */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="h-5 w-5 mr-2 text-blue-600"
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
                        Informations de base
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Titre de la session *
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Ex: Session de méditation matinale"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Description *
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Décrivez le contenu et les objectifs de votre session..."
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Planification */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
                        Planification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="startTime"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Date et heure de début *
                          </label>
                          <input
                            type="datetime-local"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="duration"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Durée (minutes) *
                          </label>
                          <input
                            type="number"
                            id="duration"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            min="15"
                            max="480"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="maxParticipants"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Nombre maximum de participants *
                          </label>
                          <input
                            type="number"
                            id="maxParticipants"
                            name="maxParticipants"
                            value={formData.maxParticipants}
                            onChange={handleInputChange}
                            min="1"
                            max="100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="price"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Prix (MAD) *
                          </label>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="category"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Catégorie *
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                            required
                          >
                            <option value="individual">Individuelle</option>
                            <option value="group">Groupe</option>
                            <option value="online">En ligne</option>
                            <option value="workshop">Atelier</option>
                            <option value="retreat">Retraite</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section pour sessions en ligne */}
                    {formData.category === 'online' && (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FaVideo className="mr-2 text-indigo-600" />
                          Configuration en ligne
                        </h3>

                        <div>
                          <label
                            htmlFor="meetingLink"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Lien de réunion externe *
                          </label>
                          <input
                            type="url"
                            id="meetingLink"
                            name="meetingLink"
                            value={formData.meetingLink}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="https://zoom.us/j/123456789... (Zoom, Teams, Meet, etc.)"
                            required={formData.category === 'online'}
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            Fournissez un lien de réunion externe (Zoom, Teams, Google Meet, etc.)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Section pour localisation physique */}
                    {formData.category !== 'online' && (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                          Localisation
                        </h3>

                        <div className="mb-4">
                          <label
                            htmlFor="location"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Adresse du lieu *
                            <span className="text-xs font-normal text-gray-500 ml-2">
                              (Recherchez ou sélectionnez sur la carte)
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="location"
                              name="location"
                              ref={searchInputRef}
                              value={searchAddress}
                              onChange={handleAddressInputChange}
                              className="w-full px-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                              placeholder="Entrez une adresse ou cliquez sur la carte"
                              required={formData.category !== 'online'}
                            />
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

                            {searchAddress && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchAddress('');
                                  setSelectedLocation(null);
                                  setFormData(prev => ({
                                    ...prev,
                                    location: '',
                                    locationCoordinates: { lat: null, lng: null },
                                  }));
                                }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            className="mt-3 inline-flex items-center text-sm text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Utiliser ma position actuelle
                          </button>
                        </div>

                        {/* Carte */}
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          {renderMap()}
                        </div>

                        {selectedLocation && (
                          <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <strong>Coordonnées:</strong> {selectedLocation.lat.toFixed(6)},{' '}
                            {selectedLocation.lng.toFixed(6)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes additionnelles */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="h-5 w-5 mr-2 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Notes additionnelles
                      </h3>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                        placeholder="Ajoutez des informations complémentaires pour vos participants..."
                      />
                    </div>
                  </div>

                  {/* Actions du formulaire */}
                  <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleCloseFormModal}
                      className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                    >
                      {isEditing ? 'Mettre à jour' : 'Créer la session'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header avec couleur d'alerte */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6">
                <div className="flex items-center text-white">
                  <ExclamationTriangleIcon className="h-8 w-8 mr-4" />
                  <h3 className="text-xl font-semibold">Annuler la session</h3>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-8">
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    "{selectedSession.title}"
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Êtes-vous sûr de vouloir annuler cette session ?
                  </p>
                  <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>⚠️ Attention :</strong> Tous les participants seront automatiquement
                      notifiés et leurs réservations seront annulées. Cette action est irréversible.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  >
                    Oui, annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalSessionsPage;
