import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Search,
  Filter,
  Grid,
  List,
  Heart,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useFavorites } from '../contexts/FavoritesContext';

const ProfessionalEventsPage = () => {
  const { id } = useParams();
  const { toggleEventFavorite, isFavorite } = useFavorites();
  const [professional, setProfessional] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filteredEvents, setFilteredEvents] = useState([]);

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

  // Fetch professional and events data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch professional data
        const professionalResponse = await fetch(
          `https://holistic-maroc-backend.onrender.com/api/professionals/${id}`
        );
        const professionalData = await professionalResponse.json();

        if (!professionalData.success) {
          throw new Error(professionalData.message || 'Erreur lors du chargement du professionnel');
        }

        setProfessional(professionalData.professional);

        // Fetch events with filters
        const params = new URLSearchParams({
          filter: 'upcoming',
          page: '1',
          limit: '50', // Récupérer plus d'événements pour le filtrage côté client
        });

        const eventsResponse = await fetch(
          `https://holistic-maroc-backend.onrender.com/api/professionals/${id}/events?${params}`
        );
        const eventsData = await eventsResponse.json();

        if (!eventsData.success) {
          throw new Error(eventsData.message || 'Erreur lors du chargement des événements');
        }

        const fetchedEvents = eventsData.events || [];
        setEvents(fetchedEvents);
        setFilteredEvents(fetchedEvents);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Erreur lors du chargement des données');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Apply filters when search term or category changes
  useEffect(() => {
    let results = [...events];

    // Filter out expired events by default
    const now = new Date();
    results = results.filter(event => {
      const eventDate = new Date(event.date || event.endDate || event.schedule?.endDate);
      return eventDate >= now;
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

    setFilteredEvents(results);
  }, [searchTerm, selectedCategory, events]);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatCategoryName = category => {
    return allCategories[category] || category;
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

    const defaultImageUrl =
      'https://holistic-maroc-backend.onrender.com/uploads/events/1749834623480-860019398.jpg';
    let imageUrl = defaultImageUrl;

    // Utiliser les nouvelles données d'image de l'API
    if (event.images && event.images.length > 0) {
      if (event.images[0].url) {
        imageUrl = event.images[0].url;
      } else if (typeof event.images[0] === 'string') {
        imageUrl = event.images[0];
      }
    } else if (event.coverImages && event.coverImages.length > 0) {
      const coverImage = event.coverImages[0];
      imageUrl = coverImage.startsWith('http')
        ? coverImage
        : `https://holistic-maroc-backend.onrender.com/uploads/events/${coverImage}`;
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

    return (
      <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
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
                <Calendar className="w-3 h-3 mr-1" />
                {formatCategoryName(event.category || 'other')}
              </div>
            </div>
          </div>

          <div className="p-6">
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
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                <span>{capacityText}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-lg font-bold text-gray-900">{formatPrice(event)}</div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Voir plus
              </button>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professionnel non trouvé</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/professionals/${id}`}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au profil
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Événements de {professional.businessName || professional.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Découvrez tous les événements organisés par ce professionnel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
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
              </div>
            </div>

            {/* Reset Filters Button */}
            {(searchTerm || selectedCategory) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
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

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-600 mb-6">
              Ce professionnel n&apos;a pas encore d&apos;événements ou ils ne correspondent pas à
              vos critères de recherche
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Événements
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredEvents.length} événements)
                </span>
              </h2>
            </div>
            <div
              className={`grid gap-6 ${
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}
            >
              {filteredEvents.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalEventsPage;
