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
import { addMinutes, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import toast from 'react-hot-toast';
import { FaVideo } from 'react-icons/fa';

import VideoCallComponent from '../../components/VideoCall/VideoCallComponent';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import { useAuth } from '../../contexts/AuthContext';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  const [showVideoCall, setShowVideoCall] = useState(false);
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
    useBuiltInVideo: false,
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

  const handleSessionSelect = session => {
    setSelectedSession(session);
    setIsModalOpen(true);
    fetchSessionBookings(session._id);

    // If session has useBuiltInVideo, set up for potential video call
    if (session.category === 'online' && session.useBuiltInVideo) {
      setShowVideoCall(false); // Don't show it immediately, only when user clicks to join
    }
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

      // Préparer les données avec une valeur par défaut pour meetingLink si useBuiltInVideo est true
      const sessionData = { ...formData };
      if (sessionData.category === 'online' && sessionData.useBuiltInVideo) {
        sessionData.meetingLink = 'builtin://video-call';
      }

      if (isEditing) {
        // Update session
        await axios.put(`${API_URL}/api/sessions/${sessionData._id}`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Session mise à jour avec succès');
      } else {
        // Create new session
        await axios.post(`${API_URL}/api/sessions`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Session créée avec succès');
      }

      setIsFormModalOpen(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
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
      useBuiltInVideo: session.useBuiltInVideo || false,
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
      useBuiltInVideo: false,
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

  const handleJoinVideoCall = () => {
    // Debug logging
    console.log('=== ProfessionalSessionsPage Debug ===');
    console.log('user:', user);
    console.log('user?.id:', user?.id);
    console.log('user?._id:', user?._id);
    console.log('user?.role:', user?.role);
    console.log('selectedSession.professionalId:', selectedSession.professionalId);

    setShowVideoCall(true);
    setIsModalOpen(false);
  };

  const handleEndVideoCall = () => {
    setShowVideoCall(false);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Sessions</h1>
        <button onClick={handleNewSession} className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouvelle Session
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={event => handleSessionSelect(event.resource)}
            eventPropGetter={event => {
              const status = event.resource.status;
              let backgroundColor = '#4F46E5'; // default purple

              if (status === 'cancelled') {
                backgroundColor = '#EF4444'; // red
              } else if (status === 'completed') {
                backgroundColor = '#6B7280'; // gray
              } else if (status === 'in_progress') {
                backgroundColor = '#10B981'; // green
              }

              return { style: { backgroundColor } };
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
      )}

      {/* Session Details Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{selectedSession.title}</h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(selectedSession.status)}`}
                >
                  {selectedSession.status === 'scheduled' && 'Programmée'}
                  {selectedSession.status === 'in_progress' && 'En cours'}
                  {selectedSession.status === 'completed' && 'Terminée'}
                  {selectedSession.status === 'cancelled' && 'Annulée'}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <p className="text-gray-700">{selectedSession.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>
                      {formatDate(selectedSession.startTime)} ({selectedSession.duration} min)
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    <span>
                      {selectedSession.participants?.length || 0} /{' '}
                      {selectedSession.maxParticipants} participants
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <CurrencyEuroIcon className="h-5 w-5 mr-2" />
                    <span>{selectedSession.price} MAD</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span>{selectedSession.category}</span>
                  </div>
                </div>

                {selectedSession.location && (
                  <div>
                    <div className="mt-2 text-gray-600 flex items-start">
                      <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Lieu:</strong> {selectedSession.location}
                      </span>
                    </div>

                    {selectedSession.locationCoordinates &&
                      selectedSession.locationCoordinates.lat &&
                      selectedSession.locationCoordinates.lng &&
                      isLoaded && (
                        <div className="mt-3 h-48 rounded-lg overflow-hidden shadow-sm border">
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{
                              lat: selectedSession.locationCoordinates.lat,
                              lng: selectedSession.locationCoordinates.lng,
                            }}
                            zoom={14}
                            options={{ disableDefaultUI: true, zoomControl: true }}
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
                )}

                {selectedSession.category === 'online' && (
                  <div className="mt-2 text-gray-600">
                    {selectedSession.useBuiltInVideo ? (
                      <div>
                        <strong>Type de réunion:</strong> Appel vidéo intégré
                        <button
                          onClick={handleJoinVideoCall}
                          className="mt-2 btn-sm bg-primary-500 hover:bg-primary-600 text-white rounded px-4 py-2 flex items-center"
                        >
                          <FaVideo className="mr-2" /> Rejoindre l'appel vidéo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <strong>Lien de réunion:</strong>{' '}
                        <a
                          href={selectedSession.meetingLink}
                          className="text-primary-600 hover:text-primary-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {selectedSession.meetingLink}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedSession.notes && (
                  <div className="mt-2 text-gray-600">
                    <strong>Notes:</strong> {selectedSession.notes}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Demandes de réservation
                </h3>

                {isLoadingRequests ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 mt-2">Chargement des demandes...</p>
                  </div>
                ) : bookingRequests.length > 0 ? (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {bookingRequests.map(booking => (
                      <div key={booking._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {booking.client.firstName} {booking.client.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{booking.client.email}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Réservé le {format(new Date(booking.createdAt), 'dd/MM/yyyy')}
                            </div>
                          </div>
                          <div>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {booking.status === 'pending' && 'En attente'}
                              {booking.status === 'confirmed' && 'Confirmée'}
                              {booking.status === 'cancelled' && 'Annulée'}
                              {booking.status === 'completed' && 'Terminée'}
                            </span>
                          </div>
                        </div>

                        {booking.clientNotes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Notes:</strong> {booking.clientNotes}
                          </div>
                        )}

                        {booking.status === 'pending' && (
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => handleBookingStatusChange(booking._id, 'confirmed')}
                              className="btn-sm bg-green-500 hover:bg-green-600 text-white flex items-center"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Accepter
                            </button>
                            <button
                              onClick={() => handleBookingStatusChange(booking._id, 'cancelled')}
                              className="btn-sm bg-red-500 hover:bg-red-600 text-white flex items-center"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucune demande de réservation</p>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => handleEditSession(selectedSession)}
                  className="btn-secondary flex items-center"
                  disabled={
                    selectedSession.status === 'completed' || selectedSession.status === 'cancelled'
                  }
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="btn-danger flex items-center"
                  disabled={
                    selectedSession.status === 'completed' || selectedSession.status === 'cancelled'
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

      {/* Video Call Modal */}
      {showVideoCall && selectedSession && (
        <div className="fixed inset-0 z-50">
          <VideoCallComponent
            sessionId={selectedSession._id}
            professionalId={
              selectedSession.professionalId.userId ||
              selectedSession.professionalId._id ||
              selectedSession.professionalId
            }
            clientId="demo-client-id"
            currentUserId={user?.id || user?._id}
            currentUserRole={user?.role}
            onEndCall={handleEndVideoCall}
          />
        </div>
      )}

      {/* Session Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Modifier la session' : 'Créer une nouvelle session'}
                </h2>
                <button
                  onClick={handleCloseFormModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Titre *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field w-full"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="startTime"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Date et heure de début *
                      </label>
                      <input
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="duration"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="maxParticipants"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="input-field w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Catégorie *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field w-full"
                      required
                    >
                      <option value="individual">Individuelle</option>
                      <option value="group">Groupe</option>
                      <option value="online">En ligne</option>
                      <option value="workshop">Atelier</option>
                      <option value="retreat">Retraite</option>
                    </select>
                  </div>

                  {formData.category === 'online' && (
                    <div className="mt-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de réunion en ligne *
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="useBuiltInVideo"
                              checked={!formData.useBuiltInVideo}
                              onChange={() =>
                                setFormData(prev => ({ ...prev, useBuiltInVideo: false }))
                              }
                              className="form-radio h-4 w-4 text-primary-600"
                            />
                            <span className="ml-2">Lien externe (Zoom, Teams, etc.)</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="useBuiltInVideo"
                              checked={formData.useBuiltInVideo}
                              onChange={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  useBuiltInVideo: true,
                                  meetingLink: '',
                                }))
                              }
                              className="form-radio h-4 w-4 text-primary-600"
                            />
                            <span className="ml-2">Appel vidéo intégré</span>
                          </label>
                        </div>
                      </div>

                      {!formData.useBuiltInVideo && (
                        <div>
                          <label
                            htmlFor="meetingLink"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Lien de réunion *
                          </label>
                          <input
                            type="url"
                            id="meetingLink"
                            name="meetingLink"
                            value={formData.meetingLink}
                            onChange={handleInputChange}
                            className="input-field w-full"
                            placeholder="https://..."
                            required={formData.category === 'online' && !formData.useBuiltInVideo}
                          />
                        </div>
                      )}

                      {formData.useBuiltInVideo && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center text-primary-600 mb-2">
                            <FaVideo className="mr-2" />
                            <span className="font-medium">Appel vidéo intégré</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Cette session utilisera notre solution d'appel vidéo intégrée. Les
                            participants pourront rejoindre directement depuis l'application sans
                            logiciel supplémentaire.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.category !== 'online' && (
                    <>
                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Lieu *{' '}
                          <span className="text-xs font-normal text-gray-500">
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
                            className="input-field w-full pl-10 pr-10"
                            placeholder="Entrez une adresse ou cliquez sur la carte"
                            required={formData.category !== 'online'}
                          />
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

                          {/* Bouton pour effacer l'adresse */}
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
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 flex space-x-2">
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
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
                      </div>

                      {/* Map for location selection */}
                      {renderMap()}

                      {selectedLocation && (
                        <div className="text-sm text-gray-500">
                          Coordonnées: {selectedLocation.lat.toFixed(6)},{' '}
                          {selectedLocation.lng.toFixed(6)}
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes additionnelles
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="2"
                      className="input-field w-full"
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button type="button" onClick={handleCloseFormModal} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-semibold">Annuler la session</h3>
            </div>

            <p className="text-gray-700">
              Êtes-vous sûr de vouloir annuler cette session ? Tous les participants seront notifiés
              et les réservations seront annulées.
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
                Retour
              </button>
              <button onClick={handleDeleteConfirm} className="btn-danger">
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalSessionsPage;
