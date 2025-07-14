import React, { useState, useEffect } from 'react';
import {
  FiEye,
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiStar,
  FiMessageSquare,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import apiService from '../../services/api.service.jsx';

const OrderCard = ({ order, onViewDetails, formatDate, formatPrice }) => {
  const navigate = useNavigate();
  const [orderReview, setOrderReview] = useState(null);
  const [productReviewStatus, setProductReviewStatus] = useState({
    reviewableProductsCount: 0,
    totalProductsCount: 0,
    allProductsReviewed: false,
  });
  const [loadingReview, setLoadingReview] = useState(false);

  // Fetch order review and check if products already have reviews
  useEffect(() => {
    const fetchOrderReviewData = async () => {
      if (order.status === 'delivered') {
        try {
          setLoadingReview(true);

          // Vérifier l'état des avis pour les produits de cette commande
          const productsReviewResponse = await apiService.get(
            `/order-reviews/products-for-order/${order._id}`
          );

          // Stocker les statistiques des avis avec toutes les informations
          setProductReviewStatus({
            reviewableProductsCount: productsReviewResponse.data.stats.reviewableProductsCount || 0,
            totalProductsCount: productsReviewResponse.data.stats.totalProductsCount || 0,
            reviewedInThisOrderCount:
              productsReviewResponse.data.stats.reviewedInThisOrderCount || 0,
            reviewedInOtherOrdersCount:
              productsReviewResponse.data.stats.reviewedInOtherOrdersCount || 0,
            allProductsReviewed: productsReviewResponse.data.stats.allProductsReviewed || false,
          });

          // Vérifier si cette commande a déjà un avis général
          if (productsReviewResponse.data.orderReviewExists) {
            // Récupérer les détails de l'avis de commande
            const orderReviewResponse = await apiService.get(`/order-reviews/order/${order._id}`);
            if (orderReviewResponse.data.review) {
              setOrderReview(orderReviewResponse.data.review);
            }
          } else if (productsReviewResponse.data.stats.allProductsReviewed) {
            // Si tous les produits ont déjà des avis, ne pas permettre d'ajouter d'autres avis
            setOrderReview({
              _id: 'products_reviewed',
              rating: 0,
              allProductsAlreadyReviewed: true,
              reviewedInThisOrderCount:
                productsReviewResponse.data.stats.reviewedInThisOrderCount || 0,
              reviewedInOtherOrdersCount:
                productsReviewResponse.data.stats.reviewedInOtherOrdersCount || 0,
            });
          } else if (
            productsReviewResponse.data.stats.reviewableProductsCount <
            productsReviewResponse.data.stats.totalProductsCount
          ) {
            // Si certains produits ont des avis mais d'autres non, on laisse l'utilisateur accéder à la page
            // Mais on lui montre qu'il y a des avis partiels
            setOrderReview({
              _id: 'partial_reviews',
              rating: 0,
              partialReviews: true,
              reviewableProductsCount: productsReviewResponse.data.stats.reviewableProductsCount,
              totalProductsCount: productsReviewResponse.data.stats.totalProductsCount,
              reviewedInThisOrderCount:
                productsReviewResponse.data.stats.reviewedInThisOrderCount || 0,
              reviewedInOtherOrdersCount:
                productsReviewResponse.data.stats.reviewedInOtherOrdersCount || 0,
            });
          }
        } catch (error) {
          // Gérer l'erreur silencieusement
        } finally {
          setLoadingReview(false);
        }
      }
    };

    fetchOrderReviewData();
  }, [order._id, order.status, order.items]);

  // Définir l'état du review avec les nouvelles propriétés dans le state
  const [reviewStatus, setReviewStatus] = useState({
    reviewableProductsCount: 0,
    totalProductsCount: 0,
    reviewedInThisOrderCount: 0,
    reviewedInOtherOrdersCount: 0,
    allProductsReviewed: false,
  });

  // Render order status badge
  const renderStatusBadge = status => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédié',
      delivered: 'Livré',
      cancelled: 'Annulé',
      refunded: 'Remboursé',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100'}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="lotus-card hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiPackage className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Commande #{order.orderNumber || order._id.slice(-6)}
              </h3>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 md:mt-0">{renderStatusBadge(order.status)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <FiCreditCard className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-semibold text-gray-900">
              {formatPrice(order.totalAmount, order.totalAmount?.currency || 'MAD')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <FiPackage className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Articles</p>
            <p className="font-semibold text-gray-900">
              {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Statut paiement</p>
            <p className="font-semibold text-gray-900 capitalize">
              {order.paymentStatus || 'En attente'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items Preview */}
      {order.items && order.items.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Articles commandés</h4>
          <div className="space-y-2">
            {order.items.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product?.title || item.product?.name || 'Produit'}
                  </p>
                  <p className="text-gray-500">
                    Qté: {item.quantity} {item.size && `- Taille: ${item.size}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.price, item.price?.currency || 'MAD')}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-sm text-gray-500 italic">
                +{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''} article
                {order.items.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          {order.status === 'delivered' && (
            <div className="flex items-center space-x-2">
              {orderReview ? (
                orderReview.allProductsAlreadyReviewed ? (
                  // Si tous les produits ont déjà été évalués dans cette commande ou ailleurs
                  <div className="flex items-center space-x-2 text-amber-600">
                    <FiMessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {orderReview.reviewedInThisOrderCount > 0 &&
                      orderReview.reviewedInOtherOrdersCount > 0
                        ? `Tous les produits évalués (${orderReview.reviewedInThisOrderCount} ici, ${orderReview.reviewedInOtherOrdersCount} ailleurs)`
                        : orderReview.reviewedInThisOrderCount ===
                            productReviewStatus.totalProductsCount
                          ? 'Tous les produits évalués dans cette commande'
                          : 'Tous les produits déjà évalués ailleurs'}
                    </span>
                  </div>
                ) : orderReview.partialReviews ? (
                  // Si certains produits ont des avis mais d'autres peuvent être évalués
                  <button
                    onClick={() => navigate(`/orders/${order._id}/review`)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FiStar className="w-4 h-4" />
                    <span>
                      {orderReview.reviewableProductsCount} produit
                      {orderReview.reviewableProductsCount > 1 ? 's' : ''} à évaluer
                    </span>
                  </button>
                ) : (
                  // Si cette commande a déjà un avis complet
                  <div className="flex items-center space-x-2 text-green-600">
                    <FiMessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Avis laissé</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="text-xs">
                          {star <= orderReview.rating ? (
                            <span className="text-yellow-400">★</span>
                          ) : (
                            <span className="text-gray-300">☆</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ) : loadingReview ? (
                // Pendant le chargement
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-sm">Chargement...</span>
                </div>
              ) : productReviewStatus.reviewableProductsCount === 0 ? (
                // Tous les produits sont déjà évalués (sans avoir chargé un orderReview)
                <div className="flex items-center space-x-2 text-amber-600">
                  <FiMessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Tous les produits ont déjà été évalués
                  </span>
                </div>
              ) : (
                // Des produits peuvent être évalués, montrer le bouton
                <button
                  onClick={() => navigate(`/orders/${order._id}/review`)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FiStar className="w-4 h-4" />
                  <span>
                    {productReviewStatus.reviewableProductsCount > 0
                      ? `Évaluer ${productReviewStatus.reviewableProductsCount} produit${productReviewStatus.reviewableProductsCount > 1 ? 's' : ''}`
                      : 'Laisser un avis'}
                  </span>
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => onViewDetails(order)}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiEye className="w-4 h-4" />
            <span>Voir les détails</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
