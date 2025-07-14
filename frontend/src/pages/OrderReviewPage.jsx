import {
  StarIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

const OrderReviewPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState({});
  const [existingReviews, setExistingReviews] = useState({});
  const [reviewableStats, setReviewableStats] = useState({
    reviewableProductsCount: 0,
    totalProductsCount: 0,
    reviewedInThisOrderCount: 0,
    reviewedInOtherOrdersCount: 0,
    allProductsReviewed: false,
  });

  useEffect(() => {
    fetchOrder();
    fetchExistingReviews();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      toast.error('Erreur lors de la récupération de la commande');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReviews = async () => {
    try {
      // Utiliser la route API qui retourne les avis pour les produits de cette commande
      const response = await apiService.get(`/order-reviews/products-for-order/${orderId}`);
      setExistingReviews(response.data.existingReviews || {});

      // Stocker les statistiques des avis avec la structure complète
      setReviewableStats({
        reviewableProductsCount: response.data.stats.reviewableProductsCount || 0,
        totalProductsCount: response.data.stats.totalProductsCount || 0,
        reviewedInThisOrderCount: response.data.stats.reviewedInThisOrderCount || 0,
        reviewedInOtherOrdersCount: response.data.stats.reviewedInOtherOrdersCount || 0,
        allProductsReviewed: response.data.stats.allProductsReviewed || false,
      });

      console.log('Statistiques des avis:', response.data.stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des avis existants:', error);
      // Ne pas afficher d'erreur car ce n'est pas critique
    }
  };

  const handleRatingChange = (productId, rating) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
      },
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment,
      },
    }));
  };

  const handleTagsChange = (productId, tags) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        tags,
      },
    }));
  };

  const handleSubmitReview = async productId => {
    const review = reviews[productId];

    if (!review || !review.rating || !review.comment) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiService.post('/reviews', {
        contentType: 'product',
        contentId: productId,
        rating: review.rating,
        comment: review.comment,
        orderId: orderId,
        tags: review.tags || [],
      });

      toast.success('Avis soumis avec succès !');

      // Marquer comme soumis
      setReviews(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          submitted: true,
        },
      }));

      // Recharger les avis existants et les statistiques
      await fetchExistingReviews();
    } catch (error) {
      console.error("Erreur lors de la soumission de l'avis:", error);

      // Afficher un message d'erreur plus spécifique
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur lors de la soumission de l'avis");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableTags = [
    { id: 'qualité', label: 'Qualité' },
    { id: 'service', label: 'Service' },
    { id: 'livraison', label: 'Livraison' },
    { id: 'prix', label: 'Prix' },
    { id: 'communication', label: 'Communication' },
    { id: 'ponctualité', label: 'Ponctualité' },
    { id: 'expertise', label: 'Expertise' },
    { id: 'ambiance', label: 'Ambiance' },
  ];

  const renderStars = (productId, currentRating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(productId, star)}
            className="text-2xl transition-colors duration-200 hover:scale-110"
          >
            {star <= currentRating ? (
              <StarIconSolid className="h-8 w-8 text-yellow-400" />
            ) : (
              <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderTags = (productId, selectedTags = []) => {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Catégories (optionnel)</label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                const newTags = selectedTags.includes(tag.id)
                  ? selectedTags.filter(t => t !== tag.id)
                  : [...selectedTags, tag.id];
                handleTagsChange(productId, newTags);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TagIcon className="h-4 w-4 inline mr-1" />
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="text-center">
            <XMarkIcon className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Commande introuvable</h2>
            <p className="text-gray-600 mt-2">
              Désolé, nous n'avons pas trouvé la commande demandée.
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retour à mes commandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculer le nombre de produits qui peuvent être évalués
  const reviewableProducts = order.items.filter(item => {
    const productId = item.product?._id || (typeof item.product === 'string' ? item.product : null);
    // Un produit peut être évalué s'il n'a pas déjà un avis dans une autre commande ou individuellement
    return productId && (!existingReviews[productId] || existingReviews[productId].forThisOrder);
  });

  // Obtenir tous les produits qui ont déjà un avis ailleurs
  const alreadyReviewedProducts = order.items.filter(item => {
    const productId = item.product?._id || (typeof item.product === 'string' ? item.product : null);
    return productId && existingReviews[productId] && !existingReviews[productId].forThisOrder;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowLeftIcon
                  className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => navigate('/orders')}
                />
                <h2 className="ml-4 text-xl font-semibold text-gray-900">
                  Avis pour la commande #{order.orderNumber || order._id.slice(-6)}
                </h2>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Information sur les avis - Message détaillé basé sur les statistiques */}
          {reviewableStats.allProductsReviewed ? (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    {reviewableStats.reviewedInThisOrderCount > 0 &&
                    reviewableStats.reviewedInOtherOrdersCount > 0
                      ? `Tous les produits ont déjà été évalués : ${reviewableStats.reviewedInThisOrderCount} dans cette commande et ${reviewableStats.reviewedInOtherOrdersCount} dans d'autres commandes.`
                      : reviewableStats.reviewedInThisOrderCount > 0
                        ? `Tous les produits ont déjà été évalués dans cette commande (${reviewableStats.reviewedInThisOrderCount} sur ${reviewableStats.totalProductsCount}).`
                        : reviewableStats.reviewedInOtherOrdersCount > 0
                          ? `Tous les produits de cette commande ont déjà été évalués dans d'autres commandes (${reviewableStats.reviewedInOtherOrdersCount} sur ${reviewableStats.totalProductsCount}).`
                          : 'Tous les produits ont déjà été évalués.'}
                  </p>
                </div>
              </div>
            </div>
          ) : reviewableStats.reviewableProductsCount < reviewableStats.totalProductsCount ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {reviewableStats.reviewableProductsCount === 0 ? (
                      <>
                        Tous les produits ont déjà été évalués :{' '}
                        {reviewableStats.reviewedInThisOrderCount} dans cette commande
                        {reviewableStats.reviewedInOtherOrdersCount > 0 &&
                          ` et ${reviewableStats.reviewedInOtherOrdersCount} dans d'autres commandes`}
                        .
                      </>
                    ) : (
                      <>
                        {reviewableStats.reviewableProductsCount} produit(s) sur{' '}
                        {reviewableStats.totalProductsCount} peuvent être évalués dans cette
                        commande.
                        {reviewableStats.reviewedInThisOrderCount > 0 &&
                          ` (${reviewableStats.reviewedInThisOrderCount} déjà évalué(s) dans cette commande)`}
                        {reviewableStats.reviewedInOtherOrdersCount > 0 &&
                          ` (${reviewableStats.reviewedInOtherOrdersCount} déjà évalué(s) dans d'autres commandes)`}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles de votre commande</h3>
            <div className="space-y-8">
              {order.items.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                // Déterminer si ce produit a déjà un avis
                const productId = product._id || product;
                const existingReview = existingReviews[productId];
                const review = reviews[productId] || {};

                // Déterminer si ce produit peut être évalué
                // Un produit peut être évalué s'il n'a pas déjà un avis ou si l'avis est pour cette commande
                const canReview = !existingReview || existingReview.forThisOrder;

                return (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden ${
                      canReview ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="p-6 flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20">
                        <img
                          src={product.images?.[0] || '/placeholder-image.svg'}
                          alt={product.title}
                          className={`w-full h-full object-cover rounded ${
                            !canReview && 'opacity-60'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold ${canReview ? 'text-gray-900' : 'text-gray-500'}`}
                        >
                          {product.title}
                        </h3>
                        <p className={`${canReview ? 'text-gray-600' : 'text-gray-500'}`}>
                          Quantité: {item.quantity}
                        </p>
                        <p className={`${canReview ? 'text-gray-600' : 'text-gray-500'}`}>
                          Prix: {item.price?.amount || item.price} {item.price?.currency || 'MAD'}
                        </p>
                      </div>
                      {existingReview && (
                        <div
                          className={`flex items-center gap-2 ${existingReview.forThisOrder ? 'text-green-600' : 'text-amber-600'}`}
                        >
                          {existingReview.forThisOrder ? (
                            <CheckIcon className="h-5 w-5" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          )}
                          <span className="text-sm font-medium">
                            {existingReview.forThisOrder
                              ? 'Avis déjà soumis pour cette commande'
                              : existingReview.message ||
                                (existingReview.orderId
                                  ? `Déjà évalué dans la commande #${existingReview.orderId.toString().slice(-6)}`
                                  : 'Déjà évalué individuellement')}
                          </span>
                        </div>
                      )}
                    </div>

                    {existingReview ? (
                      // Afficher l'avis existant
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-6 mb-6">
                        <div className="flex items-center gap-2 text-blue-700 mb-3">
                          <StarIcon className="h-5 w-5" />
                          <span className="font-medium">
                            Votre avis
                            {!existingReview.forThisOrder && (
                              <span className="text-sm ml-2 text-gray-600 font-normal">
                                {existingReview.message && `(${existingReview.message})`}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Note existante */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className="text-xl">
                                {star <= existingReview.rating ? (
                                  <StarIconSolid className="h-6 w-6 text-yellow-400" />
                                ) : (
                                  <StarIcon className="h-6 w-6 text-gray-300" />
                                )}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {existingReview.rating === 1 && 'Très déçu'}
                            {existingReview.rating === 2 && 'Déçu'}
                            {existingReview.rating === 3 && 'Moyen'}
                            {existingReview.rating === 4 && 'Satisfait'}
                            {existingReview.rating === 5 && 'Très satisfait'}
                          </span>
                        </div>

                        {/* Commentaire existant */}
                        <div className="mb-3">
                          <p className="text-gray-700">{existingReview.comment}</p>
                        </div>

                        {/* Tags existants */}
                        {existingReview.tags && existingReview.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {existingReview.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-blue-600 text-sm mt-3">
                          Avis soumis le{' '}
                          {new Date(existingReview.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ) : !review.submitted ? (
                      // Formulaire pour nouveau avis
                      <div className="space-y-6 p-6 pt-0">
                        {/* Note avec étoiles */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Note globale
                          </label>
                          {renderStars(productId, review.rating || 0)}
                          {review.rating && (
                            <p className="text-sm text-gray-600 mt-2">
                              {review.rating === 1 && 'Très déçu'}
                              {review.rating === 2 && 'Déçu'}
                              {review.rating === 3 && 'Moyen'}
                              {review.rating === 4 && 'Satisfait'}
                              {review.rating === 5 && 'Très satisfait'}
                            </p>
                          )}
                        </div>

                        {/* Commentaire */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Votre avis *
                          </label>
                          <textarea
                            value={review.comment || ''}
                            onChange={e => handleCommentChange(productId, e.target.value)}
                            placeholder="Partagez votre expérience avec ce produit..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            maxLength={1000}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {(review.comment || '').length}/1000 caractères
                          </p>
                        </div>

                        {/* Tags */}
                        {renderTags(productId, review.tags || [])}

                        {/* Bouton de soumission */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSubmitReview(productId)}
                            disabled={submitting || !review.rating || !review.comment}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {submitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Soumission...
                              </>
                            ) : (
                              <>
                                <ChatBubbleLeftIcon className="h-5 w-5" />
                                Soumettre l'avis
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-6 mb-6">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckIcon className="h-5 w-5" />
                          <span className="font-medium">Avis soumis avec succès !</span>
                        </div>
                        <p className="text-green-600 text-sm mt-1">
                          Merci pour votre contribution. Votre avis aide la communauté.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bouton de retour */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/orders')}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewPage;
