import axios from 'axios';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaClock,
  FaLocationDot,
  FaEuroSign,
  FaCalendar,
  FaVideo,
  FaUser,
  FaPlus,
  FaStar,
  FaFilter,
  FaChartBar,
  FaMagnifyingGlass,
  FaCircleCheck,
  FaCircleXmark,
  FaSpinner,
  FaHeart,
  FaUsers,
  FaGraduationCap,
  FaHandshake,
  FaFire,
  FaArrowTrendUp,
  FaLayerGroup,
  FaCalendarCheck,
  FaEye,
  FaBookmark,
} from 'react-icons/fa6';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import MapView from '../components/Common/MapView';
import Modal from '../components/Common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { sessionAPI } from '../utils/api';

const ClientSessionsPage = () => {
  const { user } = useAuth();
  const { toggleSessionFavorite, isFavorite } = useFavorites();
  const [availableSessions, setAvailableSessions] = useState([]);
  const [userBookedSessions, setUserBookedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [statistics, setStatistics] = useState({
    totalSessions: 0,
    totalProfessionals: 0,
    averagePrice: 0,
    categoriesCount: {},
    citiesCount: {},
    popularCategories: [],
    priceRange: { min: 0, max: 0 },
  });

  // États pour le filtrage
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Liste fixe des villes marocaines
  const MOROCCO_CITIES = [
    'Casablanca',
    'Rabat',
    'Fès',
    'Marrakech',
    'Agadir',
    'Tanger',
    'Meknès',
    'Oujda',
    'Kenitra',
    'Tétouan',
    'Safi',
    'Khouribga',
    'El Jadida',
    'Béni Mellal',
    'Nador',
    'Taza',
    'Mohammedia',
    'Ksar El Kebir',
    'Larache',
    'Settat',
    'Kénitra',
    'Salé',
    'Autre',
  ];

  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 31.7917, lng: -7.0926 });
  const [filters, setFilters] = useState({
    selectedDate: null,
    maxPrice: 1000,
    sortBy: 'date',
    priceRange: [0, 1000],
  });

  // État pour stocker les sessions filtrées
  const [filteredAvailableSessions, setFilteredAvailableSessions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAvailableSessions(), fetchUserBookedSessions()]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookedSessions = async () => {
    try {
      const API_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/api/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUserBookedSessions(response.data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching user booked sessions:', err);
      // Ne pas afficher d'erreur si l'utilisateur n'a pas de sessions réservées
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const API_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';
      const response = await axios.get(`${API_URL}/api/sessions`, {
        params: {
          status: 'scheduled',
          startDate: new Date().toISOString(),
          sortBy: 'startTime',
          sortOrder: 'asc',
        },
      });

      if (!response.data.success || !response.data.sessions) {
        setError('Aucune session disponible trouvée.');
        setAvailableSessions([]);
        return;
      }

      // Filtrer uniquement sur la date future et les places disponibles
      const sessions = response.data.sessions
        .filter(session => session.availableSpots > 0)
        .filter(session => new Date(session.startTime) >= new Date());

      setAvailableSessions(sessions);
      calculateStatistics(sessions);
      setError(null);
    } catch (err) {
      console.error('Error fetching available sessions:', err);
      setError('Échec du chargement des sessions disponibles.');
      setAvailableSessions([]);
    }
  };

  const calculateStatistics = sessions => {
    if (!sessions || sessions.length === 0) return;

    const totalSessions = sessions.length;
    const professionals = new Set();
    const categories = {};
    const cities = {};
    let totalPrice = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    sessions.forEach(session => {
      // Professionnels uniques
      if (session.professionalId?._id) {
        professionals.add(session.professionalId._id);
      }

      // Catégories
      const category = session.category || 'Autre';
      categories[category] = (categories[category] || 0) + 1;

      // Villes
      if (session.location && session.category !== 'online') {
        const city = extractCityFromLocation(session.location);
        if (city) {
          cities[city] = (cities[city] || 0) + 1;
        }
      }

      // Prix
      const price = session.price?.amount || session.price || 0;
      totalPrice += price;
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });

    // Catégories populaires (top 5)
    const popularCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    setStatistics({
      totalSessions,
      totalProfessionals: professionals.size,
      averagePrice: totalPrice / totalSessions,
      categoriesCount: categories,
      citiesCount: cities,
      popularCategories,
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice },
    });

    // Mettre à jour la plage de prix du filtre
    setFilters(prev => ({
      ...prev,
      priceRange: [minPrice === Infinity ? 0 : minPrice, maxPrice],
      maxPrice: maxPrice,
    }));
  };

  const extractCityFromLocation = location => {
    if (!location) return null;

    // Chercher une ville marocaine dans la location
    const foundCity = MOROCCO_CITIES.find(city =>
      location.toLowerCase().includes(city.toLowerCase())
    );

    return foundCity || null;
  };

  // Fonction pour filtrer et trier les sessions
  const filterAndSortSessions = sessions => {
    let filtered = [...sessions];

    // Filtrer les sessions déjà réservées par l'utilisateur
    const bookedSessionIds = userBookedSessions.map(session => session._id);
    filtered = filtered.filter(session => !bookedSessionIds.includes(session._id));

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        session =>
          session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.professionalId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par ville
    if (selectedCity) {
      filtered = filtered.filter(
        session =>
          session.location && session.location.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(session => session.category === selectedCategory);
    }

    // Filtrage par prix
    filtered = filtered.filter(session => {
      const price = session.price?.amount || session.price || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filtrage par date (seulement si une date est sélectionnée)
    if (filters.selectedDate) {
      const start = startOfDay(filters.selectedDate);
      const end = endOfDay(filters.selectedDate);
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= start && sessionDate <= end;
      });
    }

    // Tri
    switch (filters.sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        break;
      case 'price':
        filtered.sort(
          (a, b) => (a.price?.amount || a.price || 0) - (b.price?.amount || b.price || 0)
        );
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.professionalId?.rating || 0) - (a.professionalId?.rating || 0));
        break;
      default:
        break;
    }

    setFilteredAvailableSessions(filtered);
  };

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    if (availableSessions.length > 0) {
      filterAndSortSessions(availableSessions);
    }
  }, [availableSessions, userBookedSessions, selectedCity, selectedCategory, searchTerm, filters]);

  const handleSessionSelect = session => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handleBookSession = async session => {
    if (bookingInProgress) return;

    setBookingInProgress(true);
    try {
      const API_URL =
        process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com';
      const token = localStorage.getItem('token');

      if (!session.professionalId) {
        toast.error('Données de session invalides');
        return;
      }

      const professionalId = session.professionalId._id || session.professionalId;

      const response = await axios.post(
        `${API_URL}/api/bookings`,
        {
          professionalId: professionalId,
          sessionId: session._id,
          bookingType: 'direct',
          notes: 'Réservation directe depuis les sessions disponibles',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Session réservée avec succès !');
      fetchData(); // Recharger les données

      if (isModalOpen) {
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error booking session:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation de la session');
    } finally {
      setBookingInProgress(false);
    }
  };

  const getCategoryIcon = category => {
    switch (category) {
      case 'online':
        return <FaVideo className="text-blue-500" />;
      case 'group':
        return <FaUsers className="text-green-500" />;
      case 'individual':
        return <FaUser className="text-purple-500" />;
      case 'workshop':
        return <FaGraduationCap className="text-orange-500" />;
      case 'consultation':
        return <FaHandshake className="text-indigo-500" />;
      default:
        return <FaLayerGroup className="text-gray-500" />;
    }
  };

  const getCategoryLabel = category => {
    switch (category) {
      case 'online':
        return 'En ligne';
      case 'group':
        return 'Groupe';
      case 'individual':
        return 'Individuel';
      case 'workshop':
        return 'Atelier';
      case 'consultation':
        return 'Consultation';
      default:
        return 'Autre';
    }
  };

  const renderStatisticsCards = () => {
    const cards = [
      {
        title: 'Sessions disponibles',
        value: statistics.totalSessions,
        icon: <FaCalendarCheck className="text-blue-500" />,
        color: 'bg-blue-50 border-blue-200',
        trend: '+12%',
      },
      {
        title: 'Professionnels actifs',
        value: statistics.totalProfessionals,
        icon: <FaUsers className="text-green-500" />,
        color: 'bg-green-50 border-green-200',
        trend: '+8%',
      },
      {
        title: 'Prix moyen',
        value: `${Math.round(statistics.averagePrice)} MAD`,
        icon: <FaEuroSign className="text-purple-500" />,
        color: 'bg-purple-50 border-purple-200',
        trend: '+5%',
      },
      {
        title: 'Catégories',
        value: Object.keys(statistics.categoriesCount).length,
        icon: <FaLayerGroup className="text-orange-500" />,
        color: 'bg-orange-50 border-orange-200',
        trend: '+3%',
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                  <FaArrowTrendUp className="mr-1" />
                  {card.trend}
                </p>
              </div>
              <div className="text-3xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSessionCard = session => {
    const isBooked = userBookedSessions.some(bookedSession => bookedSession._id === session._id);
    const isSessionFavorite = isFavorite('sessions', session._id);

    return (
      <div
        key={session._id}
        className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
        onClick={() => handleSessionSelect(session)}
      >
        <div className="relative">
          {/* Badge de catégorie */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              {getCategoryIcon(session.category)}
              <span className="ml-2 text-xs font-medium text-gray-700">
                {getCategoryLabel(session.category)}
              </span>
            </div>
          </div>

          {/* Badge de prix et bouton favoris */}
          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
            <div className="bg-primary-600 text-white rounded-full px-3 py-1.5 shadow-sm">
              <span className="text-sm font-bold">
                {session.price?.amount || session.price} MAD
              </span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                toggleSessionFavorite(session);
              }}
              className={`p-2 rounded-full shadow-sm transition-all duration-300 ${
                isSessionFavorite
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
            >
              <FaHeart size={16} className={isSessionFavorite ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

          {/* Image de fond ou couleur */}
          <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">{getCategoryIcon(session.category)}</div>
              <h3 className="text-xl font-bold text-white/90">{session.title}</h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <p className="text-gray-600 font-medium">
                {session.professionalId?.businessName || 'Professionnel'}
              </p>
              {session.professionalId?.rating && (
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar
                        key={star}
                        className={
                          star <= session.professionalId.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                        size={14}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({session.professionalId.reviewCount || 0})
                  </span>
                </div>
              )}
            </div>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <FaHeart size={20} />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <FaCalendar className="mr-3 text-primary-500" size={16} />
              <span className="text-sm font-medium">
                {format(parseISO(session.startTime), 'EEEE d MMMM yyyy', {
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaClock className="mr-3 text-primary-500" size={16} />
              <span className="text-sm font-medium">
                {format(parseISO(session.startTime), 'HH:mm', { locale: fr })} -
                {format(
                  new Date(parseISO(session.startTime).getTime() + session.duration * 60000),
                  'HH:mm',
                  { locale: fr }
                )}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              {session.category === 'online' ? (
                <>
                  <FaVideo className="mr-3 text-primary-500" size={16} />
                  <span className="text-sm font-medium">Session en ligne</span>
                </>
              ) : (
                <>
                  <FaLocationDot className="mr-3 text-primary-500" size={16} />
                  <span className="text-sm font-medium">{session.location}</span>
                </>
              )}
            </div>
            <div className="flex items-center text-gray-600">
              <FaUsers className="mr-3 text-primary-500" size={16} />
              <span className="text-sm font-medium">
                {session.participants?.length || 0}/{session.maxParticipants} participants
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center font-medium transition-colors"
              onClick={e => {
                e.stopPropagation();
                handleBookSession(session);
              }}
              disabled={bookingInProgress || isBooked}
            >
              {bookingInProgress ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : isBooked ? (
                <>
                  <FaCircleCheck className="mr-2" />
                  Réservé
                </>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Réserver
                </>
              )}
            </button>
            <button
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={e => {
                e.stopPropagation();
                // Action pour voir les détails
              }}
            >
              <FaEye />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fonction pour extraire les coordonnées d'une session
  const getSessionCoordinates = session => {
    if (session.category === 'online') return null;

    // Nouveau : supporte locationCoordinates
    if (
      session.locationCoordinates &&
      session.locationCoordinates.lat &&
      session.locationCoordinates.lng
    ) {
      return session.locationCoordinates;
    }

    if (session.coordinates && session.coordinates.lat && session.coordinates.lng) {
      return session.coordinates;
    }

    if (session.latitude && session.longitude) {
      const coords = { lat: parseFloat(session.latitude), lng: parseFloat(session.longitude) };
      return coords;
    }

    if (session.location && session.location.includes('[')) {
      try {
        const coords = session.location.split('[')[1].split(']')[0].split(',');
        const parsed = {
          lat: parseFloat(coords[0]),
          lng: parseFloat(coords[1]),
        };
        return parsed;
      } catch (e) {
        console.error('Error parsing location coordinates:', e);
        return null;
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary-600 text-4xl mb-4 mx-auto" />
          <p className="text-gray-600">Chargement des sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Sessions Disponibles</h1>
            <p className="text-xl text-gray-600">
              Découvrez et réservez des sessions avec nos professionnels certifiés
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        {renderStatisticsCards()}

        {/* Filtres avancés */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaFilter className="mr-2 text-primary-600" />
                Filtres avancés
              </h2>
              <button
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <FaLocationDot className="mr-2" />
                {showMap ? 'Masquer la carte' : 'Afficher la carte'}
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <FaMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une session, un professionnel..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Sélecteur de ville */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                >
                  <option value="">Toutes les villes</option>
                  {MOROCCO_CITIES.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur de catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {Object.keys(statistics.categoriesCount).map(category => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)} ({statistics.categoriesCount[category]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur de date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={filters.selectedDate ? format(filters.selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={e => {
                    setFilters({
                      ...filters,
                      selectedDate: e.target.value ? new Date(e.target.value) : null,
                    });
                  }}
                />
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={filters.sortBy}
                  onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <option value="date">Date</option>
                  <option value="price">Prix</option>
                  <option value="popularity">Popularité</option>
                  <option value="rating">Note</option>
                </select>
              </div>
            </div>

            {/* Filtre de prix */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fourchette de prix: {filters.priceRange[0]} - {filters.priceRange[1]} MAD
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={statistics.priceRange.min}
                  max={statistics.priceRange.max}
                  value={filters.priceRange[0]}
                  onChange={e =>
                    setFilters({
                      ...filters,
                      priceRange: [Number(e.target.value), filters.priceRange[1]],
                    })
                  }
                  className="flex-1"
                />
                <input
                  type="range"
                  min={statistics.priceRange.min}
                  max={statistics.priceRange.max}
                  value={filters.priceRange[1]}
                  onChange={e =>
                    setFilters({
                      ...filters,
                      priceRange: [filters.priceRange[0], Number(e.target.value)],
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* Carte */}
            {showMap && (
              <div className="mt-6">
                <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
                  <MapView
                    sessions={filteredAvailableSessions}
                    height="400px"
                    userLocation={mapCenter}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <FaCircleXmark className="text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">Erreur</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredAvailableSessions.length} session
              {filteredAvailableSessions.length > 1 ? 's' : ''} trouvée
              {filteredAvailableSessions.length > 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => {
                setSelectedCity('');
                setSelectedCategory('');
                setSearchTerm('');
                setFilters({
                  selectedDate: null,
                  maxPrice: statistics.priceRange.max,
                  sortBy: 'date',
                  priceRange: [statistics.priceRange.min, statistics.priceRange.max],
                });
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Liste des sessions */}
        {filteredAvailableSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAvailableSessions.map(session => renderSessionCard(session))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-gray-400 text-6xl mb-4">
              <FaCalendar className="mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Aucune session trouvée</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
            <button
              onClick={() => {
                setSelectedCity('');
                setSelectedCategory('');
                setSearchTerm('');
                setFilters({
                  selectedDate: null,
                  maxPrice: statistics.priceRange.max,
                  sortBy: 'date',
                  priceRange: [statistics.priceRange.min, statistics.priceRange.max],
                });
              }}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FaFilter className="mr-2" />
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Modal de détails de session */}
      {isModalOpen && selectedSession && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedSession.title}>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getCategoryIcon(selectedSession.category)}
                  <span className="ml-2 text-sm font-medium text-gray-600">
                    {getCategoryLabel(selectedSession.category)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary-600">
                  {selectedSession.price?.amount || selectedSession.price} MAD
                </div>
              </div>

              <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedSession.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Date et heure</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <FaCalendar className="text-primary-500 mr-2" />
                    <span className="text-gray-700">
                      {format(parseISO(selectedSession.startTime), 'EEEE d MMMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-primary-500 mr-2" />
                    <span className="text-gray-700">
                      {format(parseISO(selectedSession.startTime), 'HH:mm', { locale: fr })} -
                      {format(
                        new Date(
                          parseISO(selectedSession.startTime).getTime() +
                            selectedSession.duration * 60000
                        ),
                        'HH:mm',
                        { locale: fr }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Lieu</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedSession.category === 'online' ? (
                    <div className="flex items-center">
                      <FaVideo className="text-primary-500 mr-2" />
                      <span className="text-gray-700">Session en ligne</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FaLocationDot className="text-primary-500 mr-2" />
                      <span className="text-gray-700">{selectedSession.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Professionnel</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedSession.professionalId?.businessName || 'Professionnel'}
                    </p>
                    {selectedSession.professionalId?.rating && (
                      <div className="flex items-center mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FaStar
                              key={star}
                              className={
                                star <= selectedSession.professionalId.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }
                              size={16}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          ({selectedSession.professionalId.reviewCount || 0} avis)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {selectedSession.participants?.length || 0}/{selectedSession.maxParticipants}
                    </p>
                    <p className="text-xs text-gray-500">participants</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleBookSession(selectedSession)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center transition-colors"
                disabled={bookingInProgress}
              >
                {bookingInProgress ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaPlus className="mr-2" />
                )}
                Réserver maintenant
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientSessionsPage;
