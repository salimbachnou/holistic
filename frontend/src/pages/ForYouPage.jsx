import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FaMapMarkerAlt, FaStar, FaSearch, FaFilter } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import MapView from '../components/Common/MapView';
import { mockProfessionals, filterProfessionals } from '../mocks/professionals';
import { apiService } from '../services/axiosConfig';

const ForYouPage = () => {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [location] = useState(null); // Remove geolocation functionality
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Use a constant instead of state since we're not changing it
  const categories = [
    'yoga',
    'meditation',
    'naturopathy',
    'massage',
    'acupuncture',
    'osteopathy',
    'chiropractic',
    'nutrition',
    'psychology',
    'coaching',
    'reiki',
    'aromatherapy',
    'reflexology',
    'ayurveda',
    'hypnotherapy',
  ];

  // Simplified fetchProfessionals without geolocation
  const fetchProfessionals = useCallback(
    async (filters = {}) => {
      setLoading(true);
      try {
        const queryParams = {};

        if (filters.search) queryParams.search = filters.search;
        if (filters.category) queryParams.businessType = filters.category;

        try {
          // Utiliser le nouveau service API
          const response = await apiService.getProfessionals(queryParams);
          setProfessionals(response.professionals || []);
          setError(null);
        } catch (apiError) {
          // If API fails, use mock data with filtering
          const filteredMockData = filterProfessionals(mockProfessionals, {
            search: filters.search,
            category: filters.category,
          });

          setProfessionals(filteredMockData);

          // Show a toast notification only once
          if (!error) {
            toast.error(
              'Impossible de se connecter au serveur. Affichage des données de démonstration.',
              {
                duration: 5000,
              }
            );
          }

          setError('Le serveur est indisponible. Les données affichées sont des exemples.');
        }
      } catch (err) {
        setError('Une erreur est survenue. Veuillez réessayer plus tard.');
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    },
    [error]
  );

  // Initial data fetch on component mount
  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleSearch = e => {
    e.preventDefault();
    fetchProfessionals({
      search: searchTerm,
      category: selectedCategory,
    });
  };

  const handleCategoryChange = category => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    fetchProfessionals({
      search: searchTerm,
      category: category === selectedCategory ? '' : category,
    });
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const handleProfessionalSelect = id => {
    navigate(`/professionals/enhanced/${id}`);
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  if (loading && professionals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">For You</h1>
          <p className="mt-4 text-lg text-gray-600">
            Découvrez notre réseau de professionnels certifiés dans votre région
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par titre, description..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={toggleMap}
              className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                showMap ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FaMapMarkerAlt /> {showMap ? 'Masquer la carte' : 'Afficher la carte'}
            </button>
            <button
              type="button"
              onClick={toggleFilters}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center gap-2"
            >
              <FaFilter /> Filtres
            </button>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Rechercher
            </button>
          </form>

          {/* Advanced Filters */}
          {filtersExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filtres avancés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="payment-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type de paiement
                  </label>
                  <select
                    id="payment-type"
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="online">Paiement en ligne</option>
                    <option value="cash">Paiement en personne</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="booking-mode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mode de réservation
                  </label>
                  <select
                    id="booking-mode"
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="auto">Réservation directe</option>
                    <option value="manual">Demande de réservation</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="min-rating"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Évaluation minimum
                  </label>
                  <select
                    id="min-rating"
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="4">4+ étoiles</option>
                    <option value="3">3+ étoiles</option>
                    <option value="2">2+ étoiles</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Map View (Togglable) */}
        {showMap && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <MapView
              professionals={professionals}
              userLocation={location}
              onProfessionalSelect={handleProfessionalSelect}
              height="400px"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.length > 0 ? (
            professionals.map(professional => (
              <Link
                to={`/professionals/enhanced/${professional._id}`}
                key={professional._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-48 bg-gray-200 relative">
                  {(() => {
                    // Helper function to construct image URL
                    const getImageUrl = imagePath => {
                      if (!imagePath) return null;
                      if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
                        return imagePath;
                      }
                      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                      return `${apiUrl}${imagePath}`;
                    };

                    // Determine which image to use
                    let imageUrl = null;
                    const altText = professional.businessName || 'Professional';

                    if (professional.profilePhoto) {
                      imageUrl = getImageUrl(professional.profilePhoto);
                    } else if (professional.coverImages && professional.coverImages.length > 0) {
                      imageUrl = getImageUrl(professional.coverImages[0]);
                    } else if (professional.userId?.profileImage) {
                      imageUrl = getImageUrl(professional.userId.profileImage);
                    }

                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000';
                        }}
                      />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000"
                        alt={altText}
                        className="w-full h-full object-cover"
                      />
                    );
                  })()}
                  {professional.paymentEnabled && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Paiement en ligne
                    </div>
                  )}
                  {professional.bookingMode === 'auto' && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Réservation directe
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {professional.businessName || 'Sans nom'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 capitalize">
                    {professional.businessType || 'Autre'}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`${
                          i < Math.floor(professional.rating?.average || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {professional.rating?.totalReviews || 0} avis
                    </span>
                  </div>

                  {/* Location */}
                  {professional.businessAddress && (
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>
                        {professional.address ||
                          (professional.businessAddress.street
                            ? `${professional.businessAddress.street}, ${professional.businessAddress.city || ''}, ${professional.businessAddress.postalCode || ''}, ${professional.businessAddress.country || 'Morocco'}`
                            : `${professional.businessAddress.city || ''}, ${professional.businessAddress.country || 'Morocco'}`)}
                      </span>
                    </div>
                  )}

                  {/* Description Preview */}
                  {professional.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{professional.description}</p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">
                Aucun professionnel trouvé. Essayez de modifier vos filtres.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForYouPage;
