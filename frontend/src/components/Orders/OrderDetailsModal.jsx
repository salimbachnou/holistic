import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  FiUser,
  FiStar,
  FiMessageSquare,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import apiService from '../../services/api.service.jsx';

const OrderDetailsModal = ({ order, formatDate, formatPrice }) => {
  const navigate = useNavigate();
  const [orderReview, setOrderReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Fetch order review
  useEffect(() => {
    const fetchOrderReview = async () => {
      if (order.status === 'delivered') {
        try {
          setLoadingReview(true);
          const response = await apiService.get(`/order-reviews/order/${order._id}`);
          setOrderReview(response.data.review);
        } catch (error) {
          // Review doesn't exist yet, which is fine
          console.log('No review found for this order');
        } finally {
          setLoadingReview(false);
        }
      }
    };

    fetchOrderReview();
  }, [order._id, order.status]);
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
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100'}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Commande #{order.orderNumber || order._id.slice(-6)}
            </h3>
            <p className="text-gray-600">Créée le {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            {renderStatusBadge(order.status)}
            <p className="text-sm text-gray-500 mt-1">
              Paiement: {order.paymentStatus || 'En attente'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FiCreditCard className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold text-gray-900">
              {formatPrice(order.totalAmount, order.totalAmount?.currency || 'MAD')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FiPackage className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Articles</p>
            <p className="font-semibold text-gray-900">
              {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <FiCalendar className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Méthode de paiement</p>
            <p className="font-semibold text-gray-900 capitalize">
              {order.paymentMethod?.replace('_', ' ') || 'Non spécifié'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Articles commandés</h4>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {item.product?.title || item.product?.name || 'Produit'}
                    </h5>
                    <p className="text-sm text-gray-600">
                      Quantité: {item.quantity}
                      {item.size && ` - Taille: ${item.size}`}
                    </p>
                    {item.professional?.businessName && (
                      <p className="text-sm text-gray-500">
                        Vendeur: {item.professional.businessName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price, item.price?.currency || 'MAD')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Review Section for Delivered Orders */}
          {order.status === 'delivered' && (
            <div className="mt-6">
              {orderReview ? (
                // Display existing review
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FiMessageSquare className="w-5 h-5 text-blue-600" />
                      <div>
                        <h5 className="font-medium text-blue-900">Votre avis</h5>
                        <p className="text-sm text-blue-700">
                          Avis soumis le{' '}
                          {new Date(orderReview.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="text-sm">
                          {star <= orderReview.rating ? (
                            <span className="text-yellow-400">★</span>
                          ) : (
                            <span className="text-gray-300">☆</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{orderReview.comment}</p>
                  {orderReview.tags && orderReview.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {orderReview.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Show review button
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FiStar className="w-5 h-5 text-green-600" />
                      <div>
                        <h5 className="font-medium text-green-900">Commande livrée !</h5>
                        <p className="text-sm text-green-700">
                          Partagez votre expérience en laissant un avis sur vos produits
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/orders/${order._id}/review`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Laisser un avis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Shipping Information */}
      {order.shippingAddress && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiMapPin className="w-5 h-5 mr-2" />
            Adresse de livraison
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-gray-600">{order.shippingAddress.street}</p>
            <p className="text-gray-600">
              {order.shippingAddress.city} {order.shippingAddress.postalCode}
            </p>
            {order.shippingAddress.phone && (
              <p className="text-gray-600">Tél: {order.shippingAddress.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Tracking Information */}
      {order.tracking && (order.tracking.number || order.tracking.carrier) && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiTruck className="w-5 h-5 mr-2" />
            Suivi de livraison
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {order.tracking.number && (
              <p className="text-gray-900">
                <span className="font-medium">Numéro de suivi:</span> {order.tracking.number}
              </p>
            )}
            {order.tracking.carrier && (
              <p className="text-gray-600">
                <span className="font-medium">Transporteur:</span> {order.tracking.carrier}
              </p>
            )}
            {order.tracking.url && (
              <a
                href={order.tracking.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Suivre en ligne →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Historique</h4>
          <div className="space-y-3">
            {order.timeline.map((entry, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{entry.note || entry.status}</p>
                  <p className="text-sm text-gray-500">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsModal;
