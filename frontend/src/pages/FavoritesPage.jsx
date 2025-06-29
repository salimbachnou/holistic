import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaStar, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/favorites');
      setFavorites(response.data.favorites || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Échec du chargement des favoris. Veuillez réessayer plus tard.');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async professionalId => {
    try {
      await axios.delete(`/api/favorites/${professionalId}`);
      toast.success('Professionnel retiré des favoris');
      // Update favorites list
      setFavorites(favorites.filter(fav => fav.professional._id !== professionalId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('Erreur lors du retrait du favori');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mes favoris</h1>
          <p className="mt-4 text-lg text-gray-600">
            Les professionnels que vous avez ajoutés à vos favoris
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(favorite => (
              <div
                key={favorite.professional._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
              >
                {/* Remove favorite button */}
                <button
                  onClick={() => removeFavorite(favorite.professional._id)}
                  className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors duration-200"
                  aria-label="Remove from favorites"
                >
                  <FaHeart className="text-red-500 h-5 w-5" />
                </button>

                <Link to={`/professionals/enhanced/${favorite.professional._id}`}>
                  <div className="h-48 bg-gray-200 relative">
                    {favorite.professional.coverImages &&
                    favorite.professional.coverImages.length > 0 ? (
                      <img
                        src={favorite.professional.coverImages[0]}
                        alt={favorite.professional.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                    {favorite.professional.paymentEnabled && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Paiement en ligne
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {favorite.professional.businessName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2 capitalize">
                      {favorite.professional.businessType}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`${
                            i < Math.floor(favorite.professional.rating?.average || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {favorite.professional.rating?.totalReviews || 0} avis
                      </span>
                    </div>

                    {/* Location */}
                    {favorite.professional.businessAddress && (
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>
                          {favorite.professional.businessAddress.city},{' '}
                          {favorite.professional.businessAddress.country}
                        </span>
                      </div>
                    )}

                    {/* Added date */}
                    <div className="text-xs text-gray-500 mt-4">
                      Ajouté le {new Date(favorite.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Vous n'avez pas encore de favoris
            </h3>
            <p className="text-gray-600 mb-6">
              Explorez notre liste de professionnels et ajoutez-les à vos favoris pour les retrouver
              facilement
            </p>
            <Link to="/for-you" className="btn-primary inline-block">
              Découvrir des professionnels
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
