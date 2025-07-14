import {
  StarIcon,
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

const ProductReviewsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductAndReviews();
  }, [productId]);

  const fetchProductAndReviews = async () => {
    try {
      setLoading(true);

      // Récupérer les détails du produit
      const productResponse = await apiService.get(`/products/${productId}`);
      setProduct(productResponse.data.product);

      // Récupérer les avis du produit
      const reviewsResponse = await apiService.get(`/reviews/product/${productId}`);
      setReviews(reviewsResponse.data.reviews || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Erreur lors de la récupération des données');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingCount = rating => {
    return reviews.filter(review => review.rating === rating).length;
  };

  const getRatingPercentage = rating => {
    if (reviews.length === 0) return 0;
    return ((getRatingCount(rating) / reviews.length) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-4">Ce produit n'existe pas ou vous n'y avez pas accès.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Avis du produit</h1>
              <p className="text-gray-600 mt-1">{product.title}</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-2xl">📦</div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{product.title}</h2>
              <p className="text-gray-600">{product.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className="text-lg">
                        {star <= getAverageRating() ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {getAverageRating()} ({reviews.length} avis)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des notes</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {getRatingCount(rating)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Tous les avis ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <StarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun avis encore</h4>
              <p className="text-gray-600">Ce produit n'a pas encore reçu d'avis.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.clientId?.firstName} {review.clientId?.lastName}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className="text-sm">
                                {star <= review.rating ? (
                                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                ) : (
                                  <StarIcon className="h-4 w-4 text-gray-300" />
                                )}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-13">
                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {review.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1"
                          >
                            <TagIcon className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {review.professionalResponse && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Réponse du professionnel
                        </p>
                        <p className="text-sm text-gray-700">{review.professionalResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsPage;
