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
  CalendarIcon,
  EyeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import axios from 'axios';
import { addMinutes, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  FaStickyNote,
  FaChartLine,
  FaFilter,
  FaSync,
} from 'react-icons/fa';

import BookingModal from '../../components/Common/BookingModal';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import MapPicker from '../../components/Common/MapPicker';
import Modal from '../../components/Common/Modal';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import { useAuth } from '../../contexts/AuthContext';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configure moment for French locale
moment.locale('fr');
const localizer = momentLocalizer(moment);

// Google Maps options - Responsive
const getMapContainerStyle = () => ({
  width: '100%',
  height: window.innerWidth < 640 ? '200px' : window.innerWidth < 1024 ? '250px' : '300px',
});

const defaultCenter = {
  lat: 33.589886, // Morocco center
  lng: -7.603869, // Casablanca
};

const libraries = ['places'];

// Utility function to format numbers with proper decimal places
const formatNumber = (number, decimals = 2) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return Number(number)
    .toFixed(decimals)
    .replace(/\.?0+$/, '');
};

// Utility function to format currency
const formatCurrency = (amount, currency = 'MAD') => {
  if (typeof amount === 'object' && amount.amount) {
    return `${formatNumber(amount.amount, 2)} ${amount.currency || currency}`;
  }
  return `${formatNumber(amount, 2)} ${currency}`;
};

// Utility function to format percentage
const formatPercentage = (value, total) => {
  if (total === 0) return '0';
  const percentage = (value / total) * 100;
  return formatNumber(percentage, 1);
};

const ProfessionalSessionsPage = () => {
  const { user } = useAuth();

  // Main data states
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([
    'Méditation',
    'Yoga',
    'Nutrition',
    'Bien-être',
    'Fitness',
    'Développement personnel',
    'Thérapie holistique',
    'Santé mentale',
  ]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isReviewResponseModalOpen, setIsReviewResponseModalOpen] = useState(false);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
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
    notes: '',
    useCategories: false,
    sessionCategories: [],
  });

  // Map states
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');

  // Filter and view states
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list' | 'stats'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category management states
  const [newCategory, setNewCategory] = useState('');

  // Review management states
  const [sessionReviews, setSessionReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewResponse, setReviewResponse] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Auto-refresh states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [newBookings, setNewBookings] = useState(new Set());

  // Refs
  const searchInputRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

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
    fetchProfessionalCategories();
  }, []);

  // Add function to fetch professional categories
  const fetchProfessionalCategories = async () => {
    try {
      setLoadingCategories(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/professionals/me/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAvailableCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching professional categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Add function to add a new category
  const addCategory = async categoryName => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/api/professionals/me/categories`,
        { category: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAvailableCategories(response.data.categories);
        toast.success(`Catégorie "${categoryName}" ajoutée`);
        return true;
      }
    } catch (error) {
      console.error('Error adding category:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Cette catégorie existe déjà');
      } else {
        toast.error("Erreur lors de l'ajout de la catégorie");
      }
      return false;
    }
  };

  // Add function to delete a category
  const deleteCategory = async categoryName => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        `${API_URL}/api/professionals/me/categories/${encodeURIComponent(categoryName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAvailableCategories(response.data.categories);
        toast.success(`Catégorie "${categoryName}" supprimée`);
        return true;
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
      return false;
    }
  };

  // Fetch reviews for a specific session
  const fetchSessionReviews = async sessionId => {
    try {
      setLoadingReviews(true);
      setReviewsError(null); // Reset error state
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Validation des paramètres
      if (!sessionId) {
        console.error('Session ID is required');
        setReviewsError('ID de session manquant');
        toast.error('ID de session manquant');
        return;
      }

      if (!token) {
        console.error('Authentication token is missing');
        setReviewsError("Token d'authentification manquant");
        toast.error("Token d'authentification manquant");
        return;
      }

      // Use the professional-specific endpoint for better security and error handling
      const response = await axios.get(`${API_URL}/api/reviews/session/${sessionId}/professional`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 secondes de timeout
      });

      if (response.data?.success) {
        setSessionReviews(response.data.reviews || []);
      } else if (response.data?.reviews) {
        // Fallback si pas de success flag mais reviews présents
        setSessionReviews(response.data.reviews);
      } else {
        setSessionReviews([]);
        console.warn('No reviews found for session:', sessionId);
      }
    } catch (error) {
      console.error('Error fetching session reviews:', error);

      let errorMessage = 'Erreur lors du chargement des avis';

      // Gestion d'erreur spécifique selon le type d'erreur
      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message || error.response.data?.error || 'Erreur inconnue';

        switch (status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            break;
          case 403:
            errorMessage = 'Accès refusé aux avis de cette session';
            break;
          case 404:
            errorMessage = 'Session introuvable';
            break;
          case 500:
            errorMessage = 'Erreur serveur lors du chargement des avis. Veuillez réessayer.';
            console.error('Server error details:', message);
            break;
          default:
            errorMessage = `Erreur lors du chargement des avis (${status})`;
        }

        toast.error(errorMessage);
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        toast.error(errorMessage);
      } else {
        errorMessage = 'Erreur lors de la configuration de la requête';
        toast.error(errorMessage);
      }

      setReviewsError(errorMessage);
      // Initialiser avec un tableau vide pour éviter les erreurs d'affichage
      setSessionReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handle opening reviews modal
  const handleOpenReviewsModal = async session => {
    try {
      setSelectedSession(session);
      setIsReviewsModalOpen(true);

      // Charger les avis en arrière-plan - ne pas bloquer l'ouverture du modal
      await fetchSessionReviews(session._id);
    } catch (error) {
      console.error('Error in handleOpenReviewsModal:', error);
      // Le modal reste ouvert même si le chargement des avis échoue
      toast.error("Erreur lors de l'ouverture du modal des avis");
    }
  };

  // Handle closing reviews modal
  const handleCloseReviewsModal = () => {
    setIsReviewsModalOpen(false);
    setSelectedSession(null);
    setSessionReviews([]);
    setSelectedReview(null);
    setReviewResponse('');
    setReviewsError(null); // Reset error state
  };

  // Handle opening review response modal
  const handleOpenReviewResponseModal = review => {
    setSelectedReview(review);
    setReviewResponse(review.professionalResponse || '');
    setIsReviewResponseModalOpen(true);
  };

  // Handle closing review response modal
  const handleCloseReviewResponseModal = () => {
    setIsReviewResponseModalOpen(false);
    setSelectedReview(null);
    setReviewResponse('');
  };

  // Submit review response
  const handleSubmitReviewResponse = async () => {
    if (!selectedReview || !reviewResponse.trim()) {
      toast.error('Veuillez saisir une réponse');
      return;
    }

    try {
      setSubmittingResponse(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_URL}/api/reviews/${selectedReview._id}/response`,
        { response: reviewResponse.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Réponse envoyée avec succès');
      handleCloseReviewResponseModal();

      // Refresh reviews
      if (selectedSession) {
        await fetchSessionReviews(selectedSession._id);
      }
    } catch (error) {
      console.error('Error submitting review response:', error);
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSubmittingResponse(false);
    }
  };

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

      const newSessions = response.data.sessions || [];
      setSessions(newSessions);
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

      const newBookingsList = response.data.bookings;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const newBookingsSet = new Set();

      newBookingsList.forEach(booking => {
        const bookingDate = new Date(booking.createdAt);
        if (bookingDate > fiveMinutesAgo) {
          newBookingsSet.add(booking._id);
        }
      });

      setNewBookings(newBookingsSet);
      setBookingRequests(newBookingsList);
      setLastRefreshTime(new Date());

      if (newBookingsSet.size > 0) {
        toast.success(`${newBookingsSet.size} nouvelle(s) réservation(s) reçue(s) !`, {
          duration: 4000,
        });
      }
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
        if (selectedSession) {
          fetchSessionBookings(selectedSession._id);
        }
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

  const loadSpecificBooking = async bookingId => {
    try {
      const booking = await fetchSpecificBooking(bookingId);
      if (booking) {
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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    setBookingRequests([]);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  const handleFormSubmit = async e => {
    e.preventDefault();

    try {
      if (!formData.title || !formData.description || !formData.startTime) {
        toast.error(
          'Veuillez remplir tous les champs obligatoires (titre, description, heure de début)'
        );
        return;
      }

      if (formData.category === 'online') {
        if (!formData.meetingLink || formData.meetingLink.trim() === '') {
          toast.error('Le lien de réunion est obligatoire pour les sessions en ligne');
          return;
        }

        try {
          new URL(formData.meetingLink);
        } catch (error) {
          toast.error('Le lien de réunion doit être une URL valide');
          return;
        }
      }

      if (formData.category !== 'online' && !formData.location) {
        toast.error("L'adresse est obligatoire pour les sessions physiques");
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error("Token d'authentification manquant. Veuillez vous reconnecter.");
        return;
      }

      const sessionData = { ...formData };

      if (!sessionData.title || sessionData.title.trim().length < 3) {
        toast.error('Le titre doit contenir au moins 3 caractères');
        return;
      }

      if (!sessionData.description || sessionData.description.trim().length < 10) {
        toast.error('La description doit contenir au moins 10 caractères');
        return;
      }

      const startTime = new Date(sessionData.startTime);
      const now = new Date();
      if (startTime <= now) {
        toast.error('La date de début doit être dans le futur');
        return;
      }

      sessionData.duration = parseInt(sessionData.duration) || 60;
      sessionData.maxParticipants = parseInt(sessionData.maxParticipants) || 10;
      sessionData.price = parseFloat(sessionData.price) || 0;

      if (sessionData.duration < 15 || sessionData.duration > 480) {
        toast.error('La durée doit être entre 15 et 480 minutes');
        return;
      }

      if (sessionData.maxParticipants < 1 || sessionData.maxParticipants > 100) {
        toast.error('Le nombre maximum de participants doit être entre 1 et 100');
        return;
      }

      if (sessionData.price < 0) {
        toast.error('Le prix ne peut pas être négatif');
        return;
      }

      if (sessionData.category === 'online') {
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
        if (!sessionData.meetingLink || sessionData.meetingLink.trim() === '') {
          delete sessionData.meetingLink;
        }
        if (
          sessionData.locationCoordinates &&
          (sessionData.locationCoordinates.lat === null ||
            sessionData.locationCoordinates.lng === null)
        ) {
          delete sessionData.locationCoordinates;
        }
      }

      if (!sessionData.useCategories) {
        delete sessionData.sessionCategories;
      } else if (sessionData.sessionCategories && sessionData.sessionCategories.length === 0) {
        toast.warning("Vous avez activé les catégories mais n'en avez sélectionné aucune");
      }

      delete sessionData.useCategories;

      if (sessionData.startTime && !sessionData.startTime.endsWith('Z')) {
        const dateObj = new Date(sessionData.startTime);
        sessionData.startTime = dateObj.toISOString();
      }

      if (isEditing) {
        await axios.put(`${API_URL}/api/sessions/${sessionData._id}`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Session mise à jour avec succès');

        // Rafraîchir les sessions après modification
        await fetchSessions();
      } else {
        const response = await axios.post(`${API_URL}/api/sessions`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Session créée avec succès');

        // Rafraîchir immédiatement les sessions après création
        await fetchSessions();
      }

      setIsFormModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving session:', error);

      if (error.response?.status === 401) {
        toast.error("Erreur d'authentification. Veuillez vous reconnecter.");
      } else if (error.response?.status === 403) {
        toast.error('Accès refusé. Vérifiez vos permissions.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data?.message || 'Données invalides';
        const validationErrors = error.response.data?.errors || [];

        if (validationErrors.length > 0) {
          const errorsByField = {};
          validationErrors.forEach(err => {
            const field = err.field || err.param || 'général';
            if (!errorsByField[field]) {
              errorsByField[field] = [];
            }
            errorsByField[field].push(err.message || err.msg);
          });

          const errorMessages = Object.entries(errorsByField)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');

          toast.error(`Erreurs de validation: ${errorMessages}`, {
            duration: 6000,
          });
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde de la session');
      }
    }
  };

  const handleEditSession = session => {
    const locationCoordinates = session.locationCoordinates || { lat: null, lng: null };
    const hasCategories = session.sessionCategories && session.sessionCategories.length > 0;

    if (hasCategories) {
      const newCategories = session.sessionCategories.filter(
        cat => !availableCategories.includes(cat)
      );
      if (newCategories.length > 0) {
        setAvailableCategories(prevCats => [...prevCats, ...newCategories]);
      }
    }

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
      notes: session.notes || '',
      useCategories: hasCategories,
      sessionCategories: session.sessionCategories || [],
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
      notes: '',
      useCategories: false,
      sessionCategories: [],
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

    setSearchAddress("Recherche de l'adresse...");

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
          toast.success('Lieu sélectionné avec succès');
        } else {
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

      const statusText = status === 'confirmed' ? 'confirmée' : 'refusée';
      toast.success(`Réservation ${statusText} avec succès`);

      if (selectedSession) {
        await fetchSessionBookings(selectedSession._id);
      }

      if (status === 'cancelled') {
        toast.info('Le client sera notifié du refus de sa réservation', {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour du statut de la réservation');
    }
  };

  const handleCompleteSession = async sessionId => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${API_URL}/api/sessions/${sessionId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(
          `Session terminée ! ${response.data.totalParticipants} demande(s) d'avis envoyée(s)`,
          { duration: 5000 }
        );

        await fetchSessions();
        setIsModalOpen(false);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Erreur lors de la finalisation de la session');
    }
  };

  // Refresh sessions with loading state
  const handleRefreshSessions = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setIsRefreshing(false);
    toast.success('Sessions actualisées');
  };

  // Filtered sessions based on current filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Status filter
      if (filterStatus !== 'all' && session.status !== filterStatus) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && session.category !== filterCategory) {
        return false;
      }

      // Search query filter
      if (
        searchQuery &&
        !session.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !session.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [sessions, filterStatus, filterCategory, searchQuery]);

  // Memoize calendar events calculation
  const calendarEvents = useMemo(() => {
    return filteredSessions.map(session => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + session.duration * 60000);

      return {
        id: session._id,
        title: session.title,
        start: startTime,
        end: endTime,
        resource: session,
      };
    });
  }, [filteredSessions]);

  // Get session status class
  const getStatusClass = status => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date for display
  const formatDate = dateString => {
    return format(new Date(dateString), 'PPP à HH:mm', { locale: fr });
  };

  // Check if session is in the past
  const isSessionInPast = sessionStartTime => {
    const now = new Date();
    const sessionDate = new Date(sessionStartTime);
    return sessionDate < now;
  };

  // Check if session can be edited or cancelled
  const canModifySession = session => {
    if (session.status === 'completed' || session.status === 'cancelled') {
      return false;
    }
    if (isSessionInPast(session.startTime)) {
      return false;
    }
    return true;
  };

  // Statistics calculations
  const sessionStats = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter(s => s.status === 'scheduled').length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    const totalRevenue = sessions
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Review statistics
    const sessionsWithReviews = sessions.filter(s => s.reviews && s.reviews.length > 0);
    const totalReviews = sessions.reduce((sum, s) => sum + (s.reviews?.length || 0), 0);
    const averageRating =
      sessionsWithReviews.length > 0
        ? sessionsWithReviews.reduce((sum, s) => {
            const sessionAvg =
              s.reviews.reduce((rSum, r) => rSum + (r.rating || 0), 0) / s.reviews.length;
            return sum + sessionAvg;
          }, 0) / sessionsWithReviews.length
        : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    sessions.forEach(session => {
      if (session.reviews) {
        session.reviews.forEach(review => {
          const rating = Math.round(review.rating || 0);
          if (rating >= 1 && rating <= 5) {
            ratingDistribution[rating]++;
          }
        });
      }
    });

    return {
      total,
      scheduled,
      completed,
      cancelled,
      totalRevenue,
      totalReviews,
      averageRating,
      sessionsWithReviews: sessionsWithReviews.length,
      ratingDistribution,
    };
  }, [sessions]);

  // Get sessions with detailed review stats
  const getSessionReviewStats = session => {
    if (!session.reviews || session.reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        latestReviews: [],
      };
    }

    const totalReviews = session.reviews.length;
    const averageRating =
      session.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    session.reviews.forEach(review => {
      const rating = Math.round(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    const latestReviews = session.reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      latestReviews,
    };
  };

  // Render stars for rating display
  const renderStars = (rating, size = 'h-4 w-4') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className={`${size} text-yellow-400 fill-current`} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className={`${size} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className={`${size} text-yellow-400 fill-current`} />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className={`${size} text-gray-300`} />);
      }
    }

    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  // Render map
  const renderMap = () => {
    if (loadError)
      return <div className="p-4 text-red-500">Erreur lors du chargement de la carte</div>;
    if (!isLoaded) return <div className="p-4">Chargement de la carte...</div>;

    return (
      <div className="mb-4 relative">
        <GoogleMap
          mapContainerStyle={getMapContainerStyle()}
          center={mapCenter}
          zoom={13}
          onClick={handleMapClick}
        >
          {selectedLocation && <Marker position={selectedLocation} />}
        </GoogleMap>

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

  useEffect(() => {
    if (selectedSession && autoRefreshEnabled && isModalOpen) {
      autoRefreshIntervalRef.current = setInterval(() => {
        if (selectedSession) {
          fetchSessionBookings(selectedSession._id);
        }
      }, 30000);

      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
          autoRefreshIntervalRef.current = null;
        }
      };
    }
  }, [selectedSession, autoRefreshEnabled, isModalOpen]);

  useEffect(() => {
    if (newBookings.size > 0) {
      const timer = setTimeout(() => {
        setNewBookings(new Set());
      }, 120000);
      return () => clearTimeout(timer);
    }
  }, [newBookings]);

  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header moderne avec gradient - Responsive */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 sm:p-6 lg:p-8 border border-slate-200/60 mx-2 sm:mx-4 lg:mx-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Gestion des Sessions
              </h1>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                Planifiez, organisez et gérez vos sessions professionnelles
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <a
                href="/dashboard/professional/reviews?contentType=session"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <StarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Tous les Avis</span>
                <span className="sm:hidden">Avis</span>
              </a>
              <button
                onClick={handleRefreshSessions}
                disabled={isRefreshing}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 text-sm sm:text-base"
              >
                <FaSync className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </span>
                <span className="sm:hidden">{isRefreshing ? '...' : 'Sync'}</span>
              </button>
              <button
                onClick={handleNewSession}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Nouvelle Session</span>
                <span className="sm:hidden">Nouvelle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Statistiques améliorées - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total des sessions */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                  Total Sessions
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                  {sessionStats.total}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Sessions créées</span>
                  <span className="truncate sm:hidden">Créées</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-1.5 sm:p-2 lg:p-3 rounded-lg lg:rounded-xl flex-shrink-0">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-slate-600" />
              </div>
            </div>
          </div>

          {/* Sessions programmées */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                  Programmées
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">
                  {sessionStats.scheduled}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ClockIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {formatPercentage(sessionStats.scheduled, sessionStats.total)}%
                  </span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-1.5 sm:p-2 lg:p-3 rounded-lg lg:rounded-xl flex-shrink-0">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Sessions terminées */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                  Terminées
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {sessionStats.completed}
                </p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <CheckIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Avec succès</span>
                  <span className="truncate sm:hidden">OK</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-1.5 sm:p-2 lg:p-3 rounded-lg lg:rounded-xl flex-shrink-0">
                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Revenus totaux */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                  Revenus
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold text-purple-600 truncate">
                  {formatNumber(sessionStats.totalRevenue)} MAD
                </p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <CurrencyEuroIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Revenus totaux</span>
                  <span className="truncate sm:hidden">Total</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-1.5 sm:p-2 lg:p-3 rounded-lg lg:rounded-xl flex-shrink-0">
                <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres - Responsive */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 rounded-lg flex-shrink-0">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              Filtres et recherche
            </h3>
          </div>

          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4">
            {/* View Mode Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Mode d'affichage</label>
              <div className="flex items-center space-x-1 bg-slate-50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === 'calendar'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                  }`}
                >
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                  <span className="hidden sm:inline">Calendrier</span>
                  <span className="sm:hidden">Cal</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                  }`}
                >
                  <FaEye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                  <span className="hidden sm:inline">Liste</span>
                  <span className="sm:hidden">List</span>
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === 'stats'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white'
                  }`}
                >
                  <FaChartLine className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                  <span className="hidden sm:inline">Stats</span>
                  <span className="sm:hidden">Stat</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Recherche</label>
              <div className="relative">
                <input
                  type="text"
                  className="pl-10 sm:pl-11 pr-4 py-2 sm:py-3 border border-slate-300 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white text-sm"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Statut</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white text-sm"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="scheduled">Programmées</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Catégorie</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white text-sm"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                <option value="individual">Individuelle</option>
                <option value="group">Groupe</option>
                <option value="online">En ligne</option>
                <option value="workshop">Atelier</option>
                <option value="retreat">Retraite</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterCategory('all');
                }}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
              >
                <FaSync className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Réinitialiser</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-pink-200 border-b-pink-600 rounded-full animate-ping"></div>
            </div>
            <p className="text-gray-600 mt-6 text-lg font-medium">Chargement des sessions...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="calendar-container">
            {filteredSessions.length > 0 ? (
              <div className="bg-white/50 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 sm:p-4 border border-purple-100">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{
                    height: window.innerWidth < 640 ? 450 : window.innerWidth < 1024 ? 550 : 650,
                  }}
                  onSelectEvent={event => handleSessionSelect(event.resource)}
                  eventPropGetter={event => {
                    const status = event.resource.status;
                    const isPast = isSessionInPast(event.resource.startTime);
                    let background = 'linear-gradient(135deg, #8B5CF6, #EC4899)';

                    if (status === 'cancelled') {
                      background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                    } else if (status === 'completed') {
                      background = 'linear-gradient(135deg, #10B981, #059669)';
                    } else if (status === 'in_progress') {
                      background = 'linear-gradient(135deg, #F59E0B, #D97706)';
                    } else if (isPast && status === 'scheduled') {
                      background = 'linear-gradient(135deg, #6B7280, #4B5563)';
                    }

                    return {
                      style: {
                        background,
                        borderRadius: '6px',
                        opacity: isPast && status === 'scheduled' ? 0.7 : 1,
                        color: 'white',
                        border: 'none',
                        display: 'block',
                        fontWeight: '600',
                        fontSize: window.innerWidth < 640 ? '11px' : '13px',
                        padding: window.innerWidth < 640 ? '2px 6px' : '4px 8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      },
                    };
                  }}
                  messages={{
                    agenda: 'Liste',
                    day: 'Jour',
                    month: 'Mois',
                    next: 'Suivant',
                    previous: 'Précédent',
                    today: "Aujourd'hui",
                    week: 'Semaine',
                  }}
                  popup
                  popupOffset={30}
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="h-12 w-12 text-purple-500" />
                </div>
                <p className="text-gray-600 text-xl font-medium">Aucune session trouvée</p>
                <p className="text-gray-500 mt-2">
                  Ajustez vos filtres ou créez une nouvelle session
                </p>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg overflow-hidden border border-slate-200/60">
            {filteredSessions.length > 0 ? (
              <div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-2 rounded-lg">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                      Liste des sessions ({filteredSessions.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {filteredSessions.map(session => (
                      <button
                        key={session._id}
                        type="button"
                        className="group bg-gradient-to-br from-white to-slate-50 rounded-xl lg:rounded-2xl border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => handleSessionSelect(session)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSessionSelect(session);
                          }
                        }}
                        tabIndex={0}
                      >
                        {/* Session Card Content */}
                        <div className="p-3 sm:p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                              {session.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          </div>

                          {/* Badge de statut */}
                          <div className="flex items-center justify-between text-sm">
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                                session.status === 'scheduled'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : session.status === 'in_progress'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : session.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : session.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              <span className="hidden sm:inline">
                                {session.status === 'scheduled' && '🕐 Programmée'}
                                {session.status === 'in_progress' && '⚡ En cours'}
                                {session.status === 'completed' && '✅ Terminée'}
                                {session.status === 'cancelled' && '❌ Annulée'}
                              </span>
                              <span className="sm:hidden">
                                {session.status === 'scheduled' && '🕐'}
                                {session.status === 'in_progress' && '⚡'}
                                {session.status === 'completed' && '✅'}
                                {session.status === 'cancelled' && '❌'}
                              </span>
                            </span>
                            {session.reviews && session.reviews.length > 0 && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                                <span className="text-xs sm:text-sm font-medium">
                                  {formatNumber(getSessionReviewStats(session).averageRating, 1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Métadonnées */}
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center gap-1 text-slate-500 min-w-0 flex-1">
                              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="capitalize truncate">
                                {formatDate(session.startTime)}
                              </span>
                            </div>
                          </div>

                          {/* Prix et participants */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <CurrencyEuroIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                              <span className="font-bold text-sm sm:text-lg text-slate-900 truncate">
                                {formatCurrency(session.price)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                              <span
                                className={`text-xs sm:text-sm font-medium ${
                                  (session.participants?.length || 0) >= session.maxParticipants
                                    ? 'text-red-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {session.participants?.length || 0}/{session.maxParticipants}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* État vide modernisé */
              <div className="text-center py-16 px-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-4 rounded-2xl w-fit mx-auto mb-6">
                    <CalendarIcon className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Aucune session trouvée
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                      ? 'Aucune session ne correspond à vos critères de recherche. Essayez de modifier les filtres.'
                      : "Vous n'avez pas encore de sessions dans votre planning. Commencez par créer votre première session."}
                  </p>
                  <button
                    onClick={handleNewSession}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Créer votre première session
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Stats view
          <div className="space-y-6 sm:space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-100 font-medium text-sm sm:text-base">
                      Sessions Totales
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">
                      {sessionStats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <CheckIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-emerald-100 font-medium text-sm sm:text-base">
                      Sessions Terminées
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">
                      {sessionStats.completed}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-amber-100 font-medium text-sm sm:text-base">
                      Sessions Programmées
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">
                      {sessionStats.scheduled}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <CurrencyEuroIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-purple-100 font-medium text-sm sm:text-base">
                      Revenus Totaux
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mt-1 sm:mt-2 break-words">
                      {sessionStats.totalRevenue} MAD
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <StarIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-yellow-100 font-medium text-sm sm:text-base">Note Moyenne</p>
                    <div className="flex items-center justify-center sm:justify-start mt-1 sm:mt-2 flex-wrap gap-2">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                        {formatNumber(sessionStats.averageRating, 1)}
                      </p>
                      <div className="flex">
                        {renderStars(
                          sessionStats.averageRating,
                          'h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                <div className="flex items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-0 sm:mr-4 lg:mr-6 flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 mx-auto sm:mx-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-indigo-100 font-medium text-sm sm:text-base">Total Avis</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 sm:mt-2">
                      {sessionStats.totalReviews}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-purple-200 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl p-3 mr-4">
                  <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                Distribution des Notes
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = sessionStats.ratingDistribution[rating];
                  const percentage =
                    sessionStats.totalReviews > 0 ? (count / sessionStats.totalReviews) * 100 : 0;

                  return (
                    <div key={rating} className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex items-center space-x-2 w-12 sm:w-16">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>

                      <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center space-x-2 w-16 sm:w-20">
                        <span className="text-sm font-medium text-gray-600">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({formatNumber(percentage, 1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sessions with Reviews Details */}
            <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-purple-200">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                    <span className="break-words">
                      Avis par Session ({sessionStats.sessionsWithReviews} sessions évaluées)
                    </span>
                  </h3>
                  <a
                    href="/dashboard/professional/reviews?contentType=session"
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm font-semibold flex-shrink-0"
                  >
                    <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Voir tous les avis</span>
                    <span className="sm:hidden">Tous les avis</span>
                  </a>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                {sessions.filter(s => s.reviews && s.reviews.length > 0).length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {sessions
                      .filter(s => s.reviews && s.reviews.length > 0)
                      .sort((a, b) => {
                        const aStats = getSessionReviewStats(a);
                        const bStats = getSessionReviewStats(b);
                        return bStats.averageRating - aStats.averageRating;
                      })
                      .map(session => {
                        const reviewStats = getSessionReviewStats(session);

                        return (
                          <div
                            key={session._id}
                            className="bg-gradient-to-r from-white to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 break-words">
                                  {session.title}
                                </h4>
                                <p className="text-gray-600 text-xs sm:text-sm mb-3">
                                  {formatDate(session.startTime)}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {renderStars(
                                      reviewStats.averageRating,
                                      'h-4 w-4 sm:h-5 sm:w-5'
                                    )}
                                    <span className="text-sm sm:text-lg font-bold text-gray-900">
                                      {reviewStats.averageRating.toFixed(1)}
                                    </span>
                                  </div>

                                  <div className="text-xs sm:text-sm text-gray-600">
                                    {reviewStats.totalReviews} avis
                                  </div>

                                  <span
                                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(session.status)}`}
                                  >
                                    {session.status === 'completed' && '✅ Terminée'}
                                    {session.status === 'scheduled' && '🕐 Programmée'}
                                    {session.status === 'cancelled' && '❌ Annulée'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleOpenReviewsModal(session)}
                                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                  title="Voir les avis"
                                >
                                  <StarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                  onClick={() => handleSessionSelect(session)}
                                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
                                  title="Voir les détails"
                                >
                                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Rating Distribution for this session */}
                            <div className="mb-4">
                              <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                Distribution des notes:
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                {[5, 4, 3, 2, 1].map(rating => {
                                  const count = reviewStats.ratingDistribution[rating];
                                  const percentage =
                                    count > 0 ? (count / reviewStats.totalReviews) * 100 : 0;

                                  return (
                                    <div key={rating} className="flex items-center gap-1">
                                      <span className="text-xs text-gray-600">{rating}★</span>
                                      <div className="w-8 sm:w-12 bg-gray-200 rounded-full h-1.5 sm:h-2">
                                        <div
                                          className="bg-gradient-to-r from-yellow-400 to-amber-500 h-1.5 sm:h-2 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-500">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Latest Reviews */}
                            {reviewStats.latestReviews.length > 0 && (
                              <div>
                                <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">
                                  Derniers avis:
                                </h5>
                                <div className="space-y-3">
                                  {reviewStats.latestReviews.map((review, index) => (
                                    <div
                                      key={index}
                                      className="bg-white/70 rounded-lg p-3 sm:p-4 border border-gray-200"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                                        <div className="flex items-center gap-2">
                                          {renderStars(review.rating, 'h-3 w-3 sm:h-4 sm:w-4')}
                                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                                            {review.rating}/5
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {review.createdAt
                                            ? format(new Date(review.createdAt), 'dd/MM/yyyy', {
                                                locale: fr,
                                              })
                                            : 'Date inconnue'}
                                        </span>
                                      </div>

                                      {review.comment && (
                                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                          &ldquo;{review.comment}&rdquo;
                                        </p>
                                      )}

                                      {review.clientName && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          - {review.clientName}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="bg-gradient-to-r from-gray-100 to-purple-100 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <StarIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg sm:text-xl font-medium mb-2">
                      Aucun avis disponible
                    </p>
                    <p className="text-gray-500 text-sm sm:text-base break-words">
                      Les avis apparaîtront ici une fois que vos sessions seront terminées et
                      évaluées
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories Management Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 rounded-lg flex-shrink-0">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  Gestion des Catégories
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm truncate">
                  Organisez vos sessions avec des catégories personnalisées
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {availableCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-sm sm:text-lg font-bold mr-3 sm:mr-4 shadow-lg flex-shrink-0">
                        {category.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm sm:text-lg truncate">
                        {category}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteCategory(category);
                      }}
                      className="text-red-500 hover:text-red-700 transition-all duration-200 p-1 sm:p-2 rounded-xl hover:bg-red-50 transform hover:scale-110 flex-shrink-0"
                      title="Supprimer cette catégorie"
                    >
                      <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                <span className="truncate">Ajouter une nouvelle catégorie</span>
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Nom de la nouvelle catégorie..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-lg transition-all duration-200"
                  onKeyPress={async e => {
                    if (e.key === 'Enter' && newCategory.trim()) {
                      e.preventDefault();
                      const success = await addCategory(newCategory.trim());
                      if (success) {
                        setNewCategory('');
                      }
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (newCategory.trim()) {
                      const success = await addCategory(newCategory.trim());
                      if (success) {
                        setNewCategory('');
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal - Responsive */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-purple-200">
            {/* Header du modal avec gradient coloré */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 mr-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 line-clamp-2">
                    {selectedSession.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <span
                      className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg ${
                        selectedSession.status === 'scheduled'
                          ? 'bg-white/20 text-white border-2 border-white/30'
                          : selectedSession.status === 'in_progress'
                            ? 'bg-amber-500/90 text-white border-2 border-amber-300'
                            : selectedSession.status === 'completed'
                              ? 'bg-emerald-500/90 text-white border-2 border-emerald-300'
                              : selectedSession.status === 'cancelled'
                                ? 'bg-red-500/90 text-white border-2 border-red-300'
                                : 'bg-white/20 text-white border-2 border-white/30'
                      }`}
                    >
                      <span className="hidden sm:inline">
                        {selectedSession.status === 'scheduled' && '🕐 Programmée'}
                        {selectedSession.status === 'in_progress' && '⚡ En cours'}
                        {selectedSession.status === 'completed' && '✅ Terminée'}
                        {selectedSession.status === 'cancelled' && '❌ Annulée'}
                      </span>
                      <span className="sm:hidden">
                        {selectedSession.status === 'scheduled' && '🕐'}
                        {selectedSession.status === 'in_progress' && '⚡'}
                        {selectedSession.status === 'completed' && '✅'}
                        {selectedSession.status === 'cancelled' && '❌'}
                      </span>
                    </span>

                    {isSessionInPast(selectedSession.startTime) &&
                      selectedSession.status === 'scheduled' && (
                        <span className="inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gray-500/90 text-white border-2 border-gray-300 shadow-lg">
                          <span className="hidden sm:inline">⏰ Session passée</span>
                          <span className="sm:hidden">⏰ Passée</span>
                        </span>
                      )}
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-pink-200 transition-all duration-300 p-2 sm:p-3 rounded-full hover:bg-white/20 hover:scale-110 flex-shrink-0"
                >
                  <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Description */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-2 mr-3">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                  Description
                </h3>
                <p className="text-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:p-6 rounded-2xl border border-gray-200 text-sm sm:text-lg leading-relaxed">
                  {selectedSession.description}
                </p>
              </div>

              {/* Informations principales avec gradients colorés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-rose-100 to-pink-200 p-4 sm:p-6 rounded-2xl border border-rose-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center text-rose-700 mb-3">
                    <div className="bg-rose-500/20 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                      <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <span className="font-bold text-sm sm:text-lg">Horaires</span>
                  </div>
                  <p className="text-gray-800 font-bold text-base sm:text-xl mb-2">
                    {formatDate(selectedSession.startTime)}
                  </p>
                  <p className="text-xs sm:text-sm text-rose-600 font-semibold">
                    ⏱️ Durée: {selectedSession.duration} minutes
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-violet-200 p-4 sm:p-6 rounded-2xl border border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center text-purple-700 mb-3">
                    <div className="bg-purple-500/20 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                      <UserGroupIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <span className="font-bold text-sm sm:text-lg">Participants</span>
                  </div>
                  <p className="text-gray-800 font-bold text-xl sm:text-3xl mb-2">
                    {selectedSession.participants?.length || 0} / {selectedSession.maxParticipants}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-600 font-semibold">
                    👥 places disponibles
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-100 to-teal-200 p-4 sm:p-6 rounded-2xl border border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center text-emerald-700 mb-3">
                    <div className="bg-emerald-500/20 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                      <CurrencyEuroIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <span className="font-bold text-sm sm:text-lg">Prix</span>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold text-emerald-700 mb-2">
                    {formatCurrency(selectedSession.price)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-100 to-orange-200 p-4 sm:p-6 rounded-2xl border border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center text-amber-700 mb-3">
                    <div className="bg-amber-500/20 rounded-xl p-2 sm:p-3 mr-3 sm:mr-4">
                      <UserIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <span className="font-bold text-sm sm:text-lg">Catégorie</span>
                  </div>
                  <p className="text-gray-800 capitalize font-bold text-lg sm:text-2xl">
                    {selectedSession.category}
                  </p>
                </div>
              </div>

              {/* Informations de lieu/réunion */}
              {selectedSession.location && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-3 mr-3">
                      <MapPinIcon className="h-6 w-6 text-white" />
                    </div>
                    Lieu de la session
                  </h3>
                  <div className="bg-gradient-to-br from-pink-50 to-purple-100 p-6 rounded-2xl border border-pink-300 shadow-lg">
                    <p className="text-gray-800 font-bold mb-4 text-xl">
                      📍 {selectedSession.location}
                    </p>

                    {selectedSession.locationCoordinates &&
                      selectedSession.locationCoordinates.lat &&
                      selectedSession.locationCoordinates.lng &&
                      isLoaded && (
                        <div className="h-48 sm:h-56 lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border-2 border-pink-300">
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
                                  stylers: [{ saturation: 20 }, { lightness: 10 }],
                                },
                                {
                                  featureType: 'water',
                                  stylers: [{ color: '#E879F9' }, { saturation: 40 }],
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
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 mr-3">
                      <FaVideo className="text-white" />
                    </div>
                    Réunion en ligne
                  </h3>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-2xl border border-indigo-300 shadow-lg">
                    <div>
                      <p className="text-gray-800 mb-4 font-bold text-lg">
                        <strong>🔗 Lien de réunion:</strong>
                      </p>
                      {selectedSession.meetingLink ? (
                        <a
                          href={selectedSession.meetingLink}
                          className="inline-flex items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl font-bold text-lg"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🚀 Rejoindre la réunion
                          <svg
                            className="ml-3 h-5 w-5"
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
                      ) : (
                        <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4">
                          <div className="flex items-center text-red-700">
                            <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
                            <span className="font-bold">Lien de réunion manquant</span>
                          </div>
                          <p className="text-red-600 text-sm mt-2">
                            Aucun lien de réunion n'a été configuré pour cette session en ligne.
                            Veuillez modifier la session pour ajouter un lien de réunion.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedSession.notes && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 mr-3">
                      <FaStickyNote className="text-white" />
                    </div>
                    Notes importantes
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-2xl border-2 border-amber-300 shadow-lg">
                    <p className="text-gray-800 font-semibold text-lg leading-relaxed">
                      📝 {selectedSession.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions du modal - Responsive */}
              <div className="border-t-2 border-purple-200 pt-6 sm:pt-8">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={() => handleOpenReviewsModal(selectedSession)}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base"
                      title="Voir les avis de cette session"
                    >
                      <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden sm:inline">
                        Avis ({selectedSession.reviewCount || 0})
                      </span>
                      <span className="sm:hidden">Avis ({selectedSession.reviewCount || 0})</span>
                    </button>

                    <button
                      onClick={() => handleEditSession(selectedSession)}
                      className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:transform-none disabled:hover:scale-100 text-sm sm:text-base"
                      disabled={!canModifySession(selectedSession)}
                      title={
                        !canModifySession(selectedSession)
                          ? selectedSession.status === 'completed' ||
                            selectedSession.status === 'cancelled'
                            ? 'Session terminée ou annulée'
                            : 'Impossible de modifier une session passée'
                          : 'Modifier cette session'
                      }
                    >
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Modifier
                    </button>

                    {selectedSession.status === 'scheduled' && (
                      <button
                        onClick={() => handleCompleteSession(selectedSession._id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base"
                        title="Marquer comme terminée et envoyer les demandes d'avis aux participants"
                      >
                        <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Terminer
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:transform-none disabled:hover:scale-100 text-sm sm:text-base"
                    disabled={!canModifySession(selectedSession)}
                    title={
                      !canModifySession(selectedSession)
                        ? selectedSession.status === 'completed' ||
                          selectedSession.status === 'cancelled'
                          ? 'Session terminée ou annulée'
                          : "Impossible d'annuler une session passée"
                        : 'Annuler cette session'
                    }
                  >
                    <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Form Modal - Responsive */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header du modal avec gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {isEditing ? '✏️ Modifier la session' : '✨ Créer une nouvelle session'}
                  </h2>
                  <p className="text-indigo-100 mt-2 text-sm sm:text-base lg:text-lg">
                    {isEditing
                      ? 'Modifiez les détails de votre session'
                      : 'Configurez votre nouvelle session'}
                  </p>
                </div>
                <button
                  onClick={handleCloseFormModal}
                  className="text-white hover:text-gray-200 transition-colors p-2 sm:p-3 rounded-full hover:bg-white/10"
                >
                  <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Contenu du formulaire avec scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-8">
                  {/* Informations de base */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 mr-3">
                        <svg
                          className="h-6 w-6 text-white"
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
                      Informations de base
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="title"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Titre de la session *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                          placeholder="Ex: Session de méditation matinale"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Description *
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                          placeholder="Décrivez le contenu et les objectifs de votre session..."
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Planification */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border-2 border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 mr-3">
                        <ClockIcon className="h-6 w-6 text-white" />
                      </div>
                      Planification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="startTime"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Date et heure de début *
                        </label>
                        <input
                          type="datetime-local"
                          id="startTime"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="duration"
                          className="block text-sm font-bold text-gray-700 mb-2"
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 mr-3">
                        <UserGroupIcon className="h-6 w-6 text-white" />
                      </div>
                      Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="maxParticipants"
                          className="block text-sm font-bold text-gray-700 mb-2"
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="price"
                          className="block text-sm font-bold text-gray-700 mb-2"
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Catégorie *
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-2xl border-2 border-indigo-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-3 mr-3">
                          <FaVideo className="text-white" />
                        </div>
                        Configuration en ligne
                      </h3>

                      <div>
                        <label
                          htmlFor="meetingLink"
                          className="block text-sm font-bold text-gray-700 mb-2"
                        >
                          Lien de réunion externe *
                        </label>
                        <input
                          type="url"
                          id="meetingLink"
                          name="meetingLink"
                          value={formData.meetingLink}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
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
                    <div className="bg-gradient-to-br from-green-50 to-teal-100 p-6 rounded-2xl border-2 border-green-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-3 mr-3">
                          <MapPinIcon className="h-6 w-6 text-white" />
                        </div>
                        Localisation
                      </h3>

                      <div className="mb-4">
                        <label
                          htmlFor="location"
                          className="block text-sm font-bold text-gray-700 mb-2"
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
                            className="w-full px-12 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
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
                      <div className="rounded-2xl overflow-hidden border-2 border-gray-200">
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
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-2xl border-2 border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-3 mr-3">
                        <FaStickyNote className="text-white" />
                      </div>
                      Notes additionnelles
                    </h3>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Informations complémentaires, prérequis, équipement nécessaire..."
                    />
                  </div>

                  {/* Catégories */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 mr-3">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      Catégories
                    </h3>

                    <div className="mb-4">
                      <div className="flex items-center mb-3">
                        <input
                          id="useCategories"
                          name="useCategories"
                          type="checkbox"
                          checked={formData.useCategories}
                          onChange={e => {
                            setFormData({
                              ...formData,
                              useCategories: e.target.checked,
                              sessionCategories: e.target.checked ? formData.sessionCategories : [],
                            });
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="useCategories" className="ml-2 block text-sm text-gray-700">
                          Utiliser des catégories pour cette session
                        </label>
                      </div>
                    </div>

                    {formData.useCategories && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catégories sélectionnées
                          </label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {formData.sessionCategories.length > 0 ? (
                              formData.sessionCategories.map((cat, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                                >
                                  {cat}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        sessionCategories: formData.sessionCategories.filter(
                                          (_, i) => i !== index
                                        ),
                                      });
                                    }}
                                    className="ml-1 text-purple-600 hover:text-purple-900"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">
                                Aucune catégorie sélectionnée
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catégories disponibles
                          </label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {availableCategories
                              .filter(cat => !formData.sessionCategories.includes(cat))
                              .map((cat, index) => (
                                <button
                                  type="button"
                                  key={index}
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      sessionCategories: [...formData.sessionCategories, cat],
                                    });
                                  }}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                                >
                                  {cat}
                                  <PlusIcon className="h-4 w-4 ml-1" />
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="Ajouter une nouvelle catégorie"
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (newCategory.trim()) {
                                const success = await addCategory(newCategory.trim());
                                if (success) {
                                  setFormData({
                                    ...formData,
                                    sessionCategories: [
                                      ...formData.sessionCategories,
                                      newCategory.trim(),
                                    ],
                                  });
                                  setNewCategory('');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions du formulaire - Responsive */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t-2 border-gray-200 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={handleCloseFormModal}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold text-sm sm:text-base"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base"
                    >
                      {isEditing ? 'Mettre à jour' : 'Créer la session'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header avec couleur d'alerte */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6">
              <div className="flex items-center text-white">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Annuler la session</h3>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-8">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-3">"{selectedSession.title}"</h4>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Êtes-vous sûr de vouloir annuler cette session ?
                </p>
                <div className="mt-6 bg-red-50 p-4 rounded-2xl border-2 border-red-200">
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
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-bold"
                >
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {isReviewsModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 px-8 py-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Avis de la session</h2>
                  <p className="text-yellow-100 text-lg">{selectedSession.title}</p>
                  <div className="flex items-center mt-3 space-x-4">
                    <div className="flex items-center space-x-2">
                      {renderStars(selectedSession.averageRating || 0, 'h-5 w-5')}
                      <span className="text-white font-bold text-lg">
                        {(selectedSession.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-yellow-100">{selectedSession.reviewCount || 0} avis</span>
                  </div>
                </div>
                <button
                  onClick={handleCloseReviewsModal}
                  className="text-white hover:text-yellow-200 transition-all duration-300 p-3 rounded-full hover:bg-white/20 hover:scale-110"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {loadingReviews ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-amber-200 border-b-amber-600 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-gray-600 mt-6 text-lg font-medium">Chargement des avis...</p>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                  </div>
                  <p className="text-red-600 text-xl font-medium mb-4">
                    Erreur lors du chargement des avis
                  </p>
                  <p className="text-gray-600 mb-6">{reviewsError}</p>
                  <button
                    onClick={() => fetchSessionReviews(selectedSession._id)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Réessayer
                  </button>
                </div>
              ) : sessionReviews.length > 0 ? (
                <div className="space-y-6">
                  {sessionReviews.map((review, index) => (
                    <div
                      key={review._id || index}
                      className="bg-gradient-to-r from-white to-yellow-50 rounded-2xl p-6 border border-yellow-200 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {review.clientId?.firstName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {review.clientId?.firstName} {review.clientId?.lastName}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {renderStars(review.rating, 'h-4 w-4')}
                              <span className="text-gray-600 font-medium">{review.rating}/5</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {format(new Date(review.createdAt), 'PPP', { locale: fr })}
                          </p>
                          <button
                            onClick={() => handleOpenReviewResponseModal(review)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {review.professionalResponse ? 'Modifier la réponse' : 'Répondre'}
                          </button>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed text-lg">{review.comment}</p>
                      </div>

                      {/* Professional Response */}
                      {review.professionalResponse && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-2xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-blue-800">Votre réponse</span>
                            <span className="text-xs text-blue-600">
                              {review.respondedAt &&
                                format(new Date(review.respondedAt), 'PPP', { locale: fr })}
                            </span>
                          </div>
                          <p className="text-blue-700 leading-relaxed">
                            {review.professionalResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <StarIcon className="h-12 w-12 text-yellow-500" />
                  </div>
                  <p className="text-gray-600 text-xl font-medium">Aucun avis pour cette session</p>
                  <p className="text-gray-500 mt-2">
                    Les avis apparaîtront ici une fois que les participants auront évalué la session
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Response Modal */}
      {isReviewResponseModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedReview.professionalResponse
                    ? 'Modifier votre réponse'
                    : "Répondre à l'avis"}
                </h2>
                <button
                  onClick={handleCloseReviewResponseModal}
                  className="text-white hover:text-blue-200 transition-all duration-300 p-3 rounded-full hover:bg-white/20 hover:scale-110"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Original Review */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Avis original</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedReview.clientId?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedReview.clientId?.firstName} {selectedReview.clientId?.lastName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(selectedReview.rating, 'h-4 w-4')}
                      <span className="text-gray-600 font-medium">{selectedReview.rating}/5</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedReview.comment}</p>
              </div>

              {/* Response Form */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Votre réponse</label>
                <textarea
                  value={reviewResponse}
                  onChange={e => setReviewResponse(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Rédigez votre réponse à cet avis..."
                />
                <p className="text-sm text-gray-500">
                  Votre réponse sera visible publiquement par tous les visiteurs.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={handleCloseReviewResponseModal}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReviewResponse}
                  disabled={submittingResponse || !reviewResponse.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
                >
                  {submittingResponse ? 'Envoi...' : 'Envoyer la réponse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalSessionsPage;
