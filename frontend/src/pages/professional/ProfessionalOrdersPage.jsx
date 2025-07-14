import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TruckIcon,
  CheckIcon,
  StarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api.service';

const ProfessionalOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderReview, setOrderReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      toast.error('Erreur lors de la récupération des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await apiService.put(`/orders/${orderId}/status`, { status: newStatus });

      // Update local state
      setOrders(prev =>
        prev.map(order => (order._id === orderId ? { ...order, status: newStatus } : order))
      );

      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = status => {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En cours',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = status => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivered':
        return <CheckIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = price => {
    if (typeof price === 'object' && price.amount) {
      return `${price.amount} ${price.currency || 'MAD'}`;
    }
    return `${price} MAD`;
  };

  const openOrderModal = async order => {
    setSelectedOrder(order);
    setShowOrderModal(true);

    // Fetch order review if order is delivered
    if (order.status === 'delivered') {
      try {
        setLoadingReview(true);
        const response = await apiService.get(`/order-reviews/order/${order._id}`);
        setOrderReview(response.data.review);
      } catch (error) {
        // Review doesn't exist yet, which is fine
        console.log('No review found for this order');
        setOrderReview(null);
      } finally {
        setLoadingReview(false);
      }
    } else {
      setOrderReview(null);
    }
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    setOrderReview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des commandes</h1>
          <p className="text-gray-600">Gérez et suivez les commandes de vos produits</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Livrées</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'processing'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En cours ({orders.filter(o => o.status === 'processing').length})
            </button>
            <button
              onClick={() => setFilter('shipped')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'shipped'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expédiées ({orders.filter(o => o.status === 'shipped').length})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livrées ({orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? "Vous n'avez pas encore reçu de commandes."
                  : `Aucune commande avec le statut "${getStatusLabel(filter)}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber || order._id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.clientId?.firstName} {order.clientId?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{order.clientId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items
                            ?.slice(0, 2)
                            .map(item => item.product?.title || item.product?.name)
                            .join(', ')}
                          {order.items?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusLabel(order.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openOrderModal(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => navigate(`/orders/${order._id}/review`)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir les avis de la commande"
                            >
                              <StarIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Commande #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                </h3>
                <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-600">
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Informations client</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nom:</span>
                      <span className="ml-2 font-medium">
                        {selectedOrder.clientId?.firstName} {selectedOrder.clientId?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedOrder.clientId?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone:</span>
                      <span className="ml-2 font-medium">
                        {selectedOrder.clientId?.phone || 'Non renseigné'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Articles commandés</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            {item.product?.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title || item.product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-gray-400 text-lg">📦</div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.product?.title || item.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Quantité: {item.quantity}
                              {item.size && ` - Taille: ${item.size}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatPrice(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Résumé de la commande</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="font-medium">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{getStatusLabel(selectedOrder.status)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de commande:</span>
                      <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mettre à jour le statut</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'confirmed')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Confirmer
                        </button>
                      )}
                      {selectedOrder.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'processing')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          En cours
                        </button>
                      )}
                      {(selectedOrder.status === 'processing' ||
                        selectedOrder.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'shipped')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Expédier
                        </button>
                      )}
                      {selectedOrder.status === 'shipped' && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Livrer
                        </button>
                      )}
                      {selectedOrder.status !== 'delivered' &&
                        selectedOrder.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                            disabled={updatingStatus}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Order Review Section */}
                {selectedOrder.status === 'delivered' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                      Avis du client
                    </h4>
                    {loadingReview ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Chargement de l'avis...</p>
                      </div>
                    ) : orderReview ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              Avis soumis le{' '}
                              {new Date(orderReview.createdAt).toLocaleDateString('fr-FR')}
                            </span>
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
                        <p className="text-gray-700 mb-3">{orderReview.comment}</p>
                        {orderReview.tags && orderReview.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
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
                        {orderReview.productReviews && orderReview.productReviews.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Avis par produit</h5>
                            <div className="space-y-2">
                              {orderReview.productReviews.map((productReview, index) => (
                                <div key={index} className="bg-white rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {productReview.productTitle}
                                    </span>
                                    <div className="flex items-center space-x-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className="text-xs">
                                          {star <= productReview.rating ? (
                                            <span className="text-yellow-400">★</span>
                                          ) : (
                                            <span className="text-gray-300">☆</span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  {productReview.comment && (
                                    <p className="text-xs text-gray-600">{productReview.comment}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Aucun avis encore laissé pour cette commande
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalOrdersPage;
