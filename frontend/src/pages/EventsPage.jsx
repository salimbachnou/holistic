import _axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Filter,
  Clock,
  Tag,
  Grid,
  List,
  Heart,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useFavorites } from '../contexts/FavoritesContext';

// Create a custom icon for event markers
const createEventIcon = (color = '#4F46E5') => {
  const iconHtml = `
    <div style="
      width: 36px;
      height: 36px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      E
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-event-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const EventsPage = () => {
  const { toggleEventFavorite, isFavorite } = useFavorites();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [mapInstance, setMapInstance] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [expiredFilter, setExpiredFilter] = useState('upcoming'); // 'upcoming', 'expired', 'all'
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    satisfaction: 0,
    growth: '0%',
  });
  const [growth, setGrowth] = useState('0%');
  const [expiredEvents, setExpiredEvents] = useState(0);

  // Définition de toutes les catégories disponibles
  const allCategories = {
    yoga: 'Yoga',
    meditation: 'Méditation',
    aromatherapy: 'Aromathérapie',
    nutrition: 'Nutrition',
    massage: 'Massage',
    naturopathy: 'Naturopathie',
    psychology: 'Psychologie',
    coaching: 'Coaching',
    workshop: 'Atelier',
    retreat: 'Retraite',
    fitness: 'Fitness',
    dance: 'Danse',
    pilates: 'Pilates',
    mindfulness: 'Pleine conscience',
    acupuncture: 'Acupuncture',
    homeopathy: 'Homéopathie',
    physiotherapy: 'Physiothérapie',
    osteopathy: 'Ostéopathie',
    art_therapy: 'Art-thérapie',
    music_therapy: 'Musicothérapie',
    hypnotherapy: 'Hypnothérapie',
    reflexology: 'Réflexologie',
    reiki: 'Reiki',
    ayurveda: 'Ayurveda',
    chinese_medicine: 'Médecine chinoise',
    herbal_medicine: 'Phytothérapie',
    sound_therapy: 'Sonothérapie',
    energy_healing: 'Soins énergétiques',
    other: 'Autre',
  };

  // Fetch events and stats from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch events
        const eventsResponse = await _axios.get(
          'https://holistic-maroc-backend.onrender.com/api/events'
        );
        const fetchedEvents = eventsResponse.data.events || [];
        setEvents(fetchedEvents);
        setFilteredEvents(fetchedEvents);

        // Calculate expired events
        const now = new Date();
        const expiredCount = fetchedEvents.filter(event => {
          const eventDate = new Date(event.date || event.endDate || event.schedule?.endDate);
          return eventDate < now;
        }).length;
        setExpiredEvents(expiredCount);

        // Fetch stats
        const statsResponse = await _axios.get(
          'https://holistic-maroc-backend.onrender.com/api/events/stats'
        );
        setStats(statsResponse.data.stats);
        setGrowth(statsResponse.data.stats.growth);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when search term, category, location, or date changes
  useEffect(() => {
    let results = [...events];

    // Apply expired events filter
    const now = new Date();
    results = results.filter(event => {
      const eventDate = new Date(event.date || event.endDate || event.schedule?.endDate);

      switch (expiredFilter) {
        case 'upcoming':
          return eventDate >= now; // Only show upcoming events
        case 'expired':
          return eventDate < now; // Only show expired events
        case 'all':
          return true; // Show all events
        default:
          return eventDate >= now; // Default to upcoming events
      }
    });

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        event =>
          event.title.toLowerCase().includes(term) || event.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      results = results.filter(event => event.category === selectedCategory);
    }

    // Apply location filter
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      results = results.filter(
        event =>
          event.location?.type?.toLowerCase().includes(location) ||
          (event.location?.venue?.address &&
            (event.location.venue.address.city?.toLowerCase().includes(location) ||
              event.location.venue.address.country?.toLowerCase().includes(location))) ||
          event.address?.toLowerCase().includes(location)
      );
    }

    // Apply date filter
    if (selectedDate) {
      const selectedDateTime = new Date(selectedDate).setHours(0, 0, 0, 0);
      results = results.filter(event => {
        const eventDate = new Date(event.date).setHours(0, 0, 0, 0);
        return eventDate === selectedDateTime;
      });
    }

    setFilteredEvents(results);
  }, [searchTerm, selectedCategory, locationFilter, selectedDate, expiredFilter, events]);

  // Initialize map when showMap changes
  useEffect(() => {
    if (showMap && !mapInstance) {
      initializeMap();
    }
  }, [showMap]);

  // Update map markers when filtered events change
  useEffect(() => {
    if (showMap && mapInstance && filteredEvents.length > 0) {
      updateMapMarkers();
    }
  }, [filteredEvents, showMap, mapInstance]);

  const initializeMap = () => {
    // Clear existing map
    const mapContainer = document.getElementById('events-map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }

    // Create new map centered on Morocco
    const map = L.map('events-map').setView([31.7917, -7.0926], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    setMapInstance(map);
  };

  const updateMapMarkers = () => {
    if (!mapInstance) return;

    // Clear existing markers
    mapMarkers.forEach(marker => {
      if (marker && mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker);
      }
    });

    const newMarkers = [];
    const bounds = L.latLngBounds();

    filteredEvents.forEach(event => {
      // Get coordinates from event
      let coordinates = null;

      if (event.locationCoordinates) {
        coordinates = event.locationCoordinates;
      } else if (event.location?.venue?.coordinates) {
        coordinates = event.location.venue.coordinates;
      } else if (event.address) {
        coordinates = {
          lat: 31.7917 + (Math.random() - 0.5) * 2,
          lng: -7.0926 + (Math.random() - 0.5) * 2,
        };
      }

      if (coordinates && coordinates.lat && coordinates.lng) {
        const marker = L.marker([coordinates.lat, coordinates.lng], {
          icon: createEventIcon('#4F46E5'),
        }).addTo(mapInstance);

        // Get event image URL
        const defaultImageUrl =
          'https://holistic-maroc-backend.onrender.com/uploads/events/1749834623480-860019398.jpg';
        let imageUrl = defaultImageUrl;

        if (event.images && event.images.length > 0) {
          if (event.images[0].url) {
            imageUrl = event.images[0].url;
          } else if (typeof event.images[0] === 'string') {
            imageUrl = event.images[0];
          }
        } else if (event.coverImages && event.coverImages.length > 0) {
          imageUrl = event.coverImages[0];
        }

        // Get location text
        const locationText =
          event.location?.type === 'online'
            ? 'Session en ligne'
            : event.location?.venue?.address?.city ||
              event.location?.venue?.name ||
              event.address ||
              'Lieu non spécifié';

        // Create enhanced popup content
        const popupContent = `
          <div style="width: 300px; padding: 0; border-radius: 8px; overflow: hidden;">
            <div style="position: relative; width: 100%; height: 150px; overflow: hidden;">
              <img 
                src="${imageUrl}" 
                alt="${event.title}" 
                style="width: 100%; height: 100%; object-fit: cover;"
                onerror="this.onerror=null; this.src='${defaultImageUrl}';"
              />
              <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 8px;
                background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
                color: white;
              ">
                <div style="font-size: 16px; font-weight: bold;">${event.title}</div>
                <div style="font-size: 12px;">${formatCategoryName(event.category || 'other')}</div>
              </div>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; color: #4F46E5;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span style="font-size: 14px; color: #374151;">${locationText}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; color: #4F46E5;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span style="font-size: 14px; color: #374151;">${formatDate(event.date)}</span>
                </div>
              </div>
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 12px;
                border-top: 1px solid #E5E7EB;
              ">
                <span style="font-weight: bold; color: #4F46E5;">${formatPrice(event)}</span>
                <button 
                  onclick="window.openEvent('${event._id}')"
                  style="
                    padding: 8px 16px;
                    background-color: #4F46E5;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                  "
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        });
        newMarkers.push(marker);
        bounds.extend([coordinates.lat, coordinates.lng]);
      }
    });

    setMapMarkers(newMarkers);

    // Fit map to bounds if we have markers
    if (bounds.isValid() && newMarkers.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Define global function to handle event selection from popup
  useEffect(() => {
    window.openEvent = eventId => {
      window.open(`/events/${eventId}`, '_blank');
    };

    return () => {
      delete window.openEvent;
    };
  }, []);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Mettre à jour la fonction formatCategoryName pour utiliser allCategories
  const formatCategoryName = category => {
    return allCategories[category] || category;
  };

  const formatEventType = type => {
    const typeMap = {
      workshop: 'Atelier',
      retreat: 'Retraite',
      group_session: 'Session de groupe',
      seminar: 'Séminaire',
      conference: 'Conférence',
      webinar: 'Webinaire',
    };
    return typeMap[type] || type;
  };

  const formatPrice = event => {
    if (event.pricing?.type === 'free' || event.price === 0) {
      return 'Gratuit';
    }
    return `${event.pricing?.amount || event.price || 'Prix non spécifié'} ${event.pricing?.currency || event.currency || 'MAD'}`;
  };

  // Event Card Component
  const EventCard = ({ event }) => {
    const isEventFavorite = isFavorite('events', event._id);

    // Utiliser directement l'image de la carte bancaire comme image par défaut
    const defaultImageUrl =
      'https://holistic-maroc-backend.onrender.com/uploads/events/1749834623480-860019398.jpg';

    // Amélioration de la logique pour trouver l'URL de l'image
    let imageUrl = defaultImageUrl;

    if (event.images && event.images.length > 0) {
      if (event.images[0].url) {
        imageUrl = event.images[0].url;
      } else if (typeof event.images[0] === 'string') {
        imageUrl = event.images[0];
      }
    } else if (event.coverImages && event.coverImages.length > 0) {
      imageUrl = event.coverImages[0];
    }

    const locationText =
      event.location?.type === 'online'
        ? 'Session en ligne'
        : event.location?.venue?.address?.city ||
          event.location?.venue?.name ||
          event.address ||
          'Lieu non spécifié';

    const eventDate = event.date
      ? formatDate(event.date)
      : event.schedule?.startDate
        ? formatDate(event.schedule.startDate)
        : 'Date non spécifiée';

    const capacityText = event.capacity
      ? `${event.capacity.current || 0}/${event.capacity.maximum || 0} places`
      : event.maxParticipants
        ? `${event.participants?.length || 0}/${event.maxParticipants} places`
        : 'Places non spécifiées';

    // Gérer les informations du professionnel
    const professionalName = event.professional
      ? `${event.professional.firstName || ''} ${event.professional.lastName || ''}`.trim() ||
        'Professionnel'
      : 'Professionnel non spécifié';

    const professionalAvatar = event.professional?.profileImage || null;

    return (
      <div
        className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
          event.featured ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        {event.featured && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            À la Une
          </div>
        )}

        {/* Bouton favoris */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleEventFavorite(event);
          }}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full shadow-md transition-all duration-300 ${
            isEventFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart size={16} className={isEventFavorite ? 'fill-current' : ''} />
        </button>

        <Link to={`/events/${event._id}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={event.title || 'Event image'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultImageUrl;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <div className="flex items-center text-xs font-medium text-gray-700">
                <Tag className="w-3 h-3 mr-1" />
                {formatCategoryName(event.category || 'other')}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {formatEventType(event.type || 'other')}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {capacityText}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2 text-green-500" />
                <span>{event.time || 'Heure non spécifiée'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                <span className="truncate">{locationText}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center">
                {professionalAvatar ? (
                  <img
                    src={professionalAvatar}
                    alt={professionalName}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/32x32/gray/white?text=P';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <span className="text-xs text-gray-500">P</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{professionalName}</p>
                  {event.professional?.rating && (
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500 ml-1">
                        {event.professional.rating.average} (
                        {event.professional.rating.totalReviews})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{formatPrice(event)}</div>
                <button className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Voir plus
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // Filter Section Component
  const FilterSection = () => {
    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un événement, un professionnel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700"
                >
                  <option value="">Toutes catégories</option>
                  {Object.entries(allCategories).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Lieu ou ville..."
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  placeholder="Sélectionner une date"
                />
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={expiredFilter}
                  onChange={e => setExpiredFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700"
                >
                  <option value="upcoming">Événements à venir</option>
                  <option value="expired">Événements expirés</option>
                  <option value="all">Tous les événements</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  showMap ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Carte</span>
              </button>
            </div>
          </div>

          {/* Reset Filters Button - Only show if any filter is active */}
          {(searchTerm ||
            selectedCategory ||
            locationFilter ||
            selectedDate ||
            expiredFilter !== 'upcoming') && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setLocationFilter('');
                  setSelectedDate('');
                  setExpiredFilter('upcoming');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEventCards = () => {
    const safeFilteredEvents = Array.isArray(filteredEvents) ? filteredEvents : [];

    if (safeFilteredEvents.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
          <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setLocationFilter('');
              setSelectedDate('');
              setExpiredFilter('upcoming');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      );
    }

    return (
      <div
        className={`grid gap-6 ${
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {safeFilteredEvents.map(event => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    );
  };

  const renderMap = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Carte des Événements</h3>
          <p className="text-sm text-gray-600">
            Cliquez sur les marqueurs pour voir les détails des événements
          </p>
        </div>
        <div id="events-map" className="h-96 w-full rounded-xl border border-gray-200"></div>
      </div>
    );
  };

  const statsConfig = [
    {
      icon: Calendar,
      label: 'Événements',
      value: stats.totalEvents.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: 'Participants',
      value: stats.totalParticipants.toString(),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Clock,
      label: 'Expirés',
      value: expiredEvents.toString(),
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Star,
      label: 'Satisfaction',
      value: stats.satisfaction
        ? `${stats.satisfaction}/5 (${stats.totalReviews} avis)`
        : 'Aucun avis',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: TrendingUp,
      label: 'Croissance',
      value: growth,
      color: growth.startsWith('+') ? 'text-green-600' : 'text-red-600',
      bgColor: growth.startsWith('+') ? 'bg-green-100' : 'bg-red-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Événements Bien-être
              </h1>
              <p className="text-gray-600 mt-1">
                Découvrez les événements qui transforment votre bien-être
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {statsConfig.map((stat, index) => (
                <div key={index} className="text-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 ${stat.bgColor} rounded-full mb-2`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <FilterSection />
        {showMap && renderMap()}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEvents.filter(event => event.featured).length > 0 && (
              <div>
                <div className="flex items-center mb-6">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Événements à la Une</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents
                    .filter(event => event.featured)
                    .map(event => (
                      <EventCard key={event._id} event={event} />
                    ))}
                </div>
              </div>
            )}

            {filteredEvents.filter(event => !event.featured).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tous les Événements
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filteredEvents.filter(event => !event.featured).length} événements)
                    </span>
                  </h2>
                </div>
                {renderEventCards()}
              </div>
            )}

            {filteredEvents.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
                <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setLocationFilter('');
                    setSelectedDate('');
                    setExpiredFilter('upcoming');
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
