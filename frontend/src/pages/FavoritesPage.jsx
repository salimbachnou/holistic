import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaStar,
  FaLocationDot,
  FaHeart,
  FaCalendar,
  FaClock,
  FaUsers,
  FaBagShopping,
  FaUser,
  FaVideo,
  FaEuroSign,
  FaTrash,
  FaFilter,
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { userAPI } from '../utils/api';

const FavoritesPage = () => {
  const { user } = useAuth();
  const {
    favorites,
    toggleSessionFavorite,
    toggleProductFavorite,
    toggleProfessionalFavorite,
    toggleEventFavorite,
    clearFavoritesByType,
    clearAllFavorites,
    getTotalFavoritesCount,
  } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'Tous', count: getTotalFavoritesCount() },
    { id: 'sessions', label: 'Sessions', count: favorites.sessions?.length || 0 },
    { id: 'products', label: 'Produits', count: favorites.products?.length || 0 },
    { id: 'professionals', label: 'Professionnels', count: favorites.professionals?.length || 0 },
    { id: 'events', label: 'Événements', count: favorites.events?.length || 0 },
  ];

  const getFilteredFavorites = () => {
    if (activeTab === 'all') {
      return [
        ...favorites.sessions.map(item => ({ ...item, type: 'session' })),
        ...favorites.products.map(item => ({ ...item, type: 'product' })),
        ...favorites.professionals.map(item => ({ ...item, type: 'professional' })),
        ...favorites.events.map(item => ({ ...item, type: 'event' })),
      ];
    }
    return favorites[activeTab]?.map(item => ({ ...item, type: activeTab.slice(0, -1) })) || [];
  };

  const handleRemoveFavorite = item => {
    switch (item.type) {
      case 'session':
        toggleSessionFavorite(item);
        break;
      case 'product':
        toggleProductFavorite(item);
        break;
      case 'professional':
        toggleProfessionalFavorite(item);
        break;
      case 'event':
        toggleEventFavorite(item);
        break;
      default:
        break;
    }
  };

  // Fonction pour rendre une carte de favori selon son type
  const renderFavoriteCard = item => {
    const commonCardClass =
      'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative';

    switch (item.type) {
      case 'session':
        return (
          <div key={item.id} className={commonCardClass}>
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => handleRemoveFavorite(item)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>
            {/* Image de session avec gradient par défaut */}
            <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-white text-center">
                  <FaCalendar className="text-4xl mb-2 mx-auto" />
                  <p className="text-lg font-semibold">Session</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <FaCalendar className="text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-600">Session</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  <span>{new Date(item.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <FaEuroSign className="mr-2" />
                  <span>{item.price?.amount || item.price} MAD</span>
                </div>
                <div className="flex items-center">
                  <FaUsers className="mr-2" />
                  <span>
                    {item.participants?.length || 0}/{item.maxParticipants} participants
                  </span>
                </div>
              </div>
              <Link
                to="/sessions"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Voir les sessions
              </Link>
            </div>
          </div>
        );

      case 'product':
        return (
          <div key={item.id} className={commonCardClass}>
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => handleRemoveFavorite(item)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>
            {/* Image du produit avec gradient par défaut */}
            <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-white text-center">
                  <FaBagShopping className="text-4xl mb-2 mx-auto" />
                  <p className="text-lg font-semibold">Produit</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <FaBagShopping className="text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-600">Produit</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-gray-900">
                  {item.price} {item.currency}
                </span>
                {item.rating && (
                  <div className="flex items-center">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{item.rating.average}</span>
                  </div>
                )}
              </div>
              <Link
                to="/products"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Voir les produits
              </Link>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div key={item.id} className={commonCardClass}>
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => handleRemoveFavorite(item)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>
            {/* Image du professionnel avec plusieurs sources possibles */}
            <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center relative overflow-hidden">
              {(() => {
                // Fonction pour construire l'URL de l'image
                const getImageUrl = imagePath => {
                  if (!imagePath) return null;
                  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
                    return imagePath;
                  }
                  const apiUrl =
                    process.env.REACT_APP_API_URL || 'http://localhost:5000';
                  return `${apiUrl}${imagePath}`;
                };

                // Debug: Log des données du professionnel
                console.log('Professional item data:', item);

                // Déterminer quelle image utiliser avec plus de sources
                let imageUrl = null;
                let imageSource = 'none';

                if (item.coverImages && item.coverImages.length > 0) {
                  imageUrl = getImageUrl(item.coverImages[0]);
                  imageSource = 'coverImages';
                } else if (item.profilePhoto) {
                  imageUrl = getImageUrl(item.profilePhoto);
                  imageSource = 'profilePhoto';
                } else if (item.userId?.profileImage) {
                  imageUrl = getImageUrl(item.userId.profileImage);
                  imageSource = 'userId.profileImage';
                }

                console.log(`Image source: ${imageSource}, URL: ${imageUrl}`);

                return imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                    onError={e => {
                      console.log('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', imageUrl);
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <FaUser className="text-4xl mb-2 mx-auto" />
                    <p className="text-lg font-semibold">Professionnel</p>
                  </div>
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <FaUser className="text-purple-500 mr-2" />
                <span className="text-sm font-medium text-purple-600">Professionnel</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.businessName}</h3>
              <p className="text-gray-600 text-sm mb-3 capitalize">{item.businessType}</p>
              {item.rating && (
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={
                        i < Math.floor(item.rating.average || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {item.rating.totalReviews || 0} avis
                  </span>
                </div>
              )}
              <Link
                to={`/professionals/${item.id}`}
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                Voir le profil
              </Link>
            </div>
          </div>
        );

      case 'event':
        return (
          <div key={item.id} className={commonCardClass}>
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => handleRemoveFavorite(item)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>
            {/* Image de l'événement avec plusieurs sources possibles */}
            <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative overflow-hidden">
              {(() => {
                // Utiliser directement l'image par défaut des événements
                const defaultImageUrl =
                  'http://localhost:5000/uploads/events/1749834623480-860019398.jpg';

                // Amélioration de la logique pour trouver l'URL de l'image
                let imageUrl = defaultImageUrl;

                if (item.images && item.images.length > 0) {
                  if (item.images[0].url) {
                    imageUrl = item.images[0].url;
                  } else if (typeof item.images[0] === 'string') {
                    imageUrl = item.images[0];
                  }
                } else if (item.coverImages && item.coverImages.length > 0) {
                  imageUrl = item.coverImages[0];
                }

                return (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.src = defaultImageUrl;
                    }}
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-3">
                <FaCalendar className="text-orange-500 mr-2" />
                <span className="text-sm font-medium text-orange-600">Événement</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
              <div className="space-y-2 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <FaCalendar className="mr-2" />
                  <span>
                    {item.date ? new Date(item.date).toLocaleDateString() : 'Date non spécifiée'}
                  </span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  <span>{item.time || 'Heure non spécifiée'}</span>
                </div>
                {item.pricing && (
                  <div className="flex items-center">
                    <FaEuroSign className="mr-2" />
                    <span>
                      {item.pricing.amount} {item.pricing.currency}
                    </span>
                  </div>
                )}
              </div>
              <Link
                to={`/events/${item.id}`}
                className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors"
              >
                Voir l'événement
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredFavorites = getFilteredFavorites();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Favoris</h1>
            <p className="text-xl text-gray-600">
              Retrouvez tous vos contenus préférés en un seul endroit
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Sessions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {favorites.sessions?.length || 0}
                </p>
              </div>
              <FaCalendar className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Produits</p>
                <p className="text-2xl font-bold text-green-900">
                  {favorites.products?.length || 0}
                </p>
              </div>
              <FaBagShopping className="text-3xl text-green-500" />
            </div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Professionnels</p>
                <p className="text-2xl font-bold text-purple-900">
                  {favorites.professionals?.length || 0}
                </p>
              </div>
              <FaUser className="text-3xl text-purple-500" />
            </div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Événements</p>
                <p className="text-2xl font-bold text-orange-900">
                  {favorites.events?.length || 0}
                </p>
              </div>
              <FaCalendar className="text-3xl text-orange-500" />
            </div>
          </div>
        </div>

        {/* Onglets de filtrage */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Actions de nettoyage */}
          {getTotalFavoritesCount() > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredFavorites.length} élément{filteredFavorites.length > 1 ? 's' : ''} affiché
                {filteredFavorites.length > 1 ? 's' : ''}
              </p>
              <div className="flex space-x-2">
                {activeTab !== 'all' && (
                  <button
                    onClick={() => clearFavoritesByType(activeTab)}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                  >
                    <FaTrash className="mr-1" />
                    Vider cette catégorie
                  </button>
                )}
                <button
                  onClick={clearAllFavorites}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <FaTrash className="mr-1" />
                  Vider tous les favoris
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenu des favoris */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map(item => renderFavoriteCard(item))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              <FaHeart className="mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {activeTab === 'all'
                ? 'Aucun favori'
                : `Aucun favori dans ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Explorez nos contenus et ajoutez vos préférés pour les retrouver facilement
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/sessions"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Découvrir les sessions
              </Link>
              <Link
                to="/products"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir les produits
              </Link>
              <Link
                to="/professionals"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Trouver des professionnels
              </Link>
              <Link
                to="/events"
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Découvrir les événements
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
