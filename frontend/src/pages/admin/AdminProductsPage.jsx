import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  StarIcon as _StarIcon,
  PhotoIcon,
  CheckBadgeIcon as _CheckBadgeIcon,
  UserIcon as _UserIcon,
  ChevronDownIcon as _ChevronDownIcon,
  ArchiveBoxIcon as _ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    categories: [],
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    images: [],
    professionalId: '',
    status: 'pending',
  });

  // Fetch products data
  const fetchProducts = async (page = 1, search = '', category = '', status = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: 12,
            search,
            category,
            status,
          },
        }
      );

      setProducts(response.data.products);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  // Toggle product approval status
  const toggleApproval = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';

      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products/${productId}/approve`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        newStatus === 'approved' ? 'Produit approuvé avec succès' : 'Approbation retirée'
      );
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
    } catch (error) {
      console.error('Error toggling approval:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  // Create new product
  const createProduct = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Produit créé avec succès');
      setShowCreateModal(false);
      resetForm();
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erreur lors de la création');
    }
  };

  // Update product
  const updateProduct = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products/${selectedProduct._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Produit mis à jour avec succès');
      setShowEditModal(false);
      resetForm();
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Delete product
  const deleteProduct = async productId => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Produit supprimé avec succès');
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // View product details
  const viewProductDetails = async productId => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedProduct(response.data.product);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  // Edit product
  const editProduct = product => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      images: product.images || [],
      professionalId: product.professionalId?._id || '',
      status: product.status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      images: [],
      professionalId: '',
      status: 'pending',
    });
    setSelectedProduct(null);
  };

  const categories = [
    'supplements',
    'equipment',
    'books',
    'accessories',
    'skincare',
    'aromatherapy',
    'other',
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'pending', label: 'En attente' },
    { value: 'rejected', label: 'Rejetés' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-emerald-600 mr-3" />
              Gestion des Produits
            </h1>
            <p className="mt-2 text-gray-600">Gérez tous les produits de la plateforme</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouveau Produit
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Produits', value: stats.total, icon: ShoppingBagIcon, color: 'blue' },
          { label: 'Approuvés', value: stats.approved, icon: CheckCircleIcon, color: 'green' },
          { label: 'En attente', value: stats.pending, icon: CubeIcon, color: 'yellow' },
          { label: 'Rejetés', value: stats.rejected, icon: XCircleIcon, color: 'red' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-100'
                    : stat.color === 'green'
                      ? 'bg-green-100'
                      : stat.color === 'yellow'
                        ? 'bg-yellow-100'
                        : stat.color === 'red'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                }`}
              >
                <stat.icon
                  className={`h-6 w-6 ${
                    stat.color === 'blue'
                      ? 'text-blue-600'
                      : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'yellow'
                          ? 'text-yellow-600'
                          : stat.color === 'red'
                            ? 'text-red-600'
                            : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Toutes catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        ) : (
          products.map(product => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Product Image */}
              <div className="h-48 bg-gray-100 relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {product.status === 'approved'
                      ? 'Approuvé'
                      : product.status === 'rejected'
                        ? 'Rejeté'
                        : 'En attente'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {product.category}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-gray-900">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    {product.price?.amount || product.price}{' '}
                    {product.price?.currency || product.currency || 'MAD'}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">Stock: {product.stock || 0}</div>
                  {product.professionalId && (
                    <div className="text-sm text-gray-500 truncate">
                      {product.professionalId.businessName || 'Professionnel'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewProductDetails(product._id)}
                    className="flex-1 text-blue-600 hover:text-blue-900 p-2 rounded text-sm"
                    title="Voir détails"
                  >
                    <EyeIcon className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => editProduct(product)}
                    className="flex-1 text-gray-600 hover:text-gray-900 p-2 rounded text-sm"
                    title="Modifier"
                  >
                    <PencilIcon className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => toggleApproval(product._id, product.status)}
                    className={`flex-1 p-2 rounded text-sm ${
                      product.status === 'approved'
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    }`}
                    title={product.status === 'approved' ? 'Retirer approbation' : 'Approuver'}
                  >
                    {product.status === 'approved' ? (
                      <XCircleIcon className="h-4 w-4 mx-auto" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 mx-auto" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="flex-1 text-red-600 hover:text-red-900 p-2 rounded text-sm"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {showCreateModal ? 'Nouveau Produit' : 'Modifier le Produit'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <form
                  onSubmit={showCreateModal ? createProduct : updateProduct}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="productName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nom du produit *
                      </label>
                      <input
                        id="productName"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="productCategory"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Catégorie *
                      </label>
                      <select
                        id="productCategory"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="productDescription"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description *
                    </label>
                    <textarea
                      id="productDescription"
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="productPrice"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Prix (MAD) *
                      </label>
                      <input
                        id="productPrice"
                        type="number"
                        value={formData.price}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            price: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="productStock"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Stock *
                      </label>
                      <input
                        id="productStock"
                        type="number"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="block text-sm font-medium text-gray-700">
                      Statut du produit
                    </legend>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="pending"
                          checked={formData.status === 'pending'}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-900">En attente</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="approved"
                          checked={formData.status === 'approved'}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-900">Approuvé</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="rejected"
                          checked={formData.status === 'rejected'}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-900">Rejeté</span>
                      </label>
                    </div>
                  </fieldset>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      {showCreateModal ? 'Créer' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Détails du Produit</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Images */}
                  <div>
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedProduct.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Catégorie</p>
                        <p className="font-medium">{selectedProduct.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Prix</p>
                        <p className="font-medium">
                          {selectedProduct.price?.amount || selectedProduct.price}{' '}
                          {selectedProduct.price?.currency || selectedProduct.currency || 'MAD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Stock</p>
                        <p className="font-medium">{selectedProduct.stock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedProduct.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : selectedProduct.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {selectedProduct.status === 'approved'
                            ? 'Approuvé'
                            : selectedProduct.status === 'rejected'
                              ? 'Rejeté'
                              : 'En attente'}
                        </span>
                      </div>
                    </div>

                    {selectedProduct.professionalId && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Professionnel</p>
                        <p className="font-medium">{selectedProduct.professionalId.businessName}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Date de création</p>
                      <p className="font-medium">
                        {new Date(selectedProduct.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsPage;
