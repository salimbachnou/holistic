import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiEye,
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiShoppingBag,
  FiSearch,
  FiFilter,
} from 'react-icons/fi';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import OrderCard from '../components/Orders/OrderCard';
import OrderDetailsModal from '../components/Orders/OrderDetailsModal';
import apiService from '../services/api.service.jsx';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });

      const response = await apiService.get(`/orders?${queryParams}`);

      console.log('Orders API response:', response.data);
      console.log('Orders data:', response.data.orders);

      setOrders(response.data.orders || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setCurrentPage(response.data.pagination?.page || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Erreur lors de la récupération des commandes');
      setLoading(false);
      toast.error('Erreur lors de la récupération des commandes');
    }
  }, [currentPage, filters]);

  // Effect to fetch orders when page or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle filter changes
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Format date for display
  const formatDate = dateString => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Format price for display
  const formatPrice = (amount, currency = 'MAD') => {
    console.log('formatPrice input:', { amount, currency, type: typeof amount });

    // Handle different price formats
    let numericAmount = 0;

    if (typeof amount === 'object' && amount !== null) {
      // If amount is an object with amount property
      numericAmount = amount.amount || 0;
    } else if (typeof amount === 'string') {
      // If amount is a string, try to parse it
      numericAmount = parseFloat(amount) || 0;
    } else if (typeof amount === 'number') {
      // If amount is already a number
      numericAmount = amount;
    } else {
      // Default to 0
      numericAmount = 0;
    }

    // Ensure it's a valid number
    if (isNaN(numericAmount)) {
      numericAmount = 0;
    }

    console.log('formatPrice result:', {
      numericAmount,
      formatted: `${numericAmount.toFixed(2)} ${currency}`,
    });

    return `${numericAmount.toFixed(2)} ${currency}`;
  };

  // Handle order details
  const handleViewOrderDetails = order => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Render order details modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Commande #${selectedOrder._id.slice(-6)}`}
        maxWidth="max-w-4xl"
      >
        <OrderDetailsModal
          order={selectedOrder}
          formatDate={formatDate}
          formatPrice={formatPrice}
        />
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-lotus rounded-lg">
                <FiShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Commandes</h1>
                <p className="text-gray-600 mt-1">Suivez vos commandes et leur statut</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FiPackage className="w-4 h-4" />
              <span>
                {orders.length} commande{orders.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="lotus-card mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <FiFilter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Statut
              </label>
              <select
                id="status-filter"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="shipped">Expédié</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
                <option value="refunded">Remboursé</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                id="sort-filter"
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="createdAt">Date de création</option>
                <option value="totalAmount">Montant total</option>
                <option value="status">Statut</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="order-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ordre
              </label>
              <select
                id="order-filter"
                name="sortOrder"
                value={filters.sortOrder}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="lotus-card text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <FiShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-gray-600 mb-6">Vous n&apos;avez pas encore de commandes.</p>
                <a href="/products" className="btn-primary">
                  Découvrir nos produits
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onViewDetails={handleViewOrderDetails}
                formatDate={formatDate}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Précédent
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Suivant
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {renderOrderDetailsModal()}
    </div>
  );
};

export default OrdersPage;
