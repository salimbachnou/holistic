import { MagnifyingGlassIcon, MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import _axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch events from backend API
        const response = await _axios.get('http://localhost:5000/api/events');

        // Extract events from the nested response
        const fetchedEvents = response.data.events || [];

        setEvents(fetchedEvents);
        setFilteredEvents(fetchedEvents);

        // Extract unique categories
        const uniqueCategories = [...new Set(fetchedEvents.map(event => event.category))];
        setCategories(uniqueCategories);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Erreur lors du chargement des événements');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Apply filters when search term, category or location changes
  useEffect(() => {
    let results = [...events];

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

    setFilteredEvents(results);
  }, [searchTerm, selectedCategory, locationFilter, events]);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatCategoryName = category => {
    const categoryMap = {
      yoga: 'Yoga',
      meditation: 'Méditation',
      aromatherapy: 'Aromathérapie',
      nutrition: 'Nutrition',
      massage: 'Massage',
      naturopathy: 'Naturopathie',
      acupuncture: 'Acupuncture',
      osteopathy: 'Ostéopathie',
      chiropractic: 'Chiropractie',
      psychology: 'Psychologie',
      coaching: 'Coaching',
      reiki: 'Reiki',
      reflexology: 'Réflexologie',
      ayurveda: 'Ayurveda',
      hypnotherapy: 'Hypnothérapie',
      other: 'Autre',
    };
    return categoryMap[category] || category;
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

  const renderEventCards = () => {
    const safeFilteredEvents = Array.isArray(filteredEvents) ? filteredEvents : [];

    if (safeFilteredEvents.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Aucun événement ne correspond à votre recherche</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setLocationFilter('');
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Réinitialiser les filtres
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeFilteredEvents.map(event => {
          // Utiliser directement l'image de la carte bancaire comme image par défaut
          const defaultImageUrl =
            'http://localhost:5000/uploads/events/1749834623480-860019398.jpg';

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

          const priceText =
            event.pricing?.type === 'free' || event.price === 0
              ? 'Gratuit'
              : `${event.pricing?.amount || event.price || 'Prix non spécifié'} ${event.pricing?.currency || event.currency || 'MAD'}`;

          return (
            <Link
              to={`/events/${event._id}`}
              key={event._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={imageUrl}
                  alt={event.title || 'Event image'}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = defaultImageUrl;
                  }}
                />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                  {formatCategoryName(event.category || 'other')}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {formatEventType(event.type || 'other')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.capacity
                      ? `${event.capacity.current || 0}/${event.capacity.maximum || 0} places`
                      : event.maxParticipants
                        ? `${event.participants?.length || 0}/${event.maxParticipants} places`
                        : 'Places non spécifiées'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{locationText}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-primary-600 font-medium">{priceText}</div>
                  {event.professional?.rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="text-sm">
                        {event.professional.rating.average} (
                        {event.professional.rating.totalReviews})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderMap = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">
            Carte interactive - fonctionnalité en cours de développement
          </p>
          {/* In a real application, this would be a Google Maps or Mapbox component */}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Événements</h1>
          <p className="text-gray-600">
            Découvrez les événements organisés par nos professionnels du bien-être
          </p>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex-none">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Toutes catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-none">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Lieu..."
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full md:w-48 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={() => setShowMap(!showMap)}
              className="flex-none bg-primary-100 text-primary-700 hover:bg-primary-200 px-4 py-2 rounded-lg flex items-center justify-center"
            >
              <MapPinIcon className="h-5 w-5 mr-2" />
              {showMap ? 'Masquer la carte' : 'Afficher la carte'}
            </button>
          </div>
        </div>

        {/* Map view (togglable) */}
        {showMap && renderMap()}

        {/* Events listing */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          renderEventCards()
        )}
      </div>
    </div>
  );
};

export default EventsPage;
