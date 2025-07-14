import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CurrencyEuroIcon,
  CubeIcon,
  PhotoIcon,
  ClockIcon,
  UserIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  EyeIcon,
  ShoppingCartIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  TruckIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link as _Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

// Product categories for selection
const PRODUCT_CATEGORIES = [
  { value: 'supplements', label: 'Compléments alimentaires' },
  { value: 'equipment', label: 'Équipements' },
  { value: 'books', label: 'Livres' },
  { value: 'accessories', label: 'Accessoires' },
  { value: 'skincare', label: 'Soins de la peau' },
  { value: 'aromatherapy', label: 'Aromathérapie' },
  { value: 'wellness', label: 'Bien-être' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'meditation', label: 'Méditation' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'massage', label: 'Massage' },
  { value: 'naturopathy', label: 'Naturopathie' },
  { value: 'psychology', label: 'Psychologie' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Autres' },
  { value: 'custom', label: 'Nouvelle catégorie...' },
];

// Utility function to get the full image URL
const getImageUrl = imagePath => {
  if (!imagePath) return null;

  // Check if it's already a full URL or a data URL
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

  // Otherwise, prepend the API URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${API_URL}${imagePath}`;
};

const ProfessionalProductsPage = () => {
  const { _user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inactive: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'supplements',
    composition: '',
    specifications: [],
    tags: [],
    sizeOptions: [],
    sizeInventory: [],
    images: [],
    customCategory: '', // Pour permettre l'ajout de nouvelles catégories
  });
  const [newSizeOption, setNewSizeOption] = useState('');
  const [newSizeStock, setNewSizeStock] = useState(0);
  const [newSpecification, setNewSpecification] = useState('');
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${API_URL}/api/professionals/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 12,
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
        },
      });

      const { products, pagination, stats } = response.data;

      setProducts(products || []);
      setTotalPages(pagination?.pages || 1);
      setStats(stats || { pending: 0, approved: 0, rejected: 0, inactive: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
      setProducts([]);
      setTotalPages(1);
      setStats({ pending: 0, approved: 0, rejected: 0, inactive: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les commandes d'un produit
  const fetchProductOrders = async productId => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${API_URL}/api/orders/by-product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching product orders:', error);
      toast.error('Erreur lors du chargement des commandes');
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderStatus(orderId);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order => (order._id === orderId ? { ...order, status: newStatus } : order))
      );

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }

      toast.success(`Commande marquée comme ${getOrderStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  // Fonction pour marquer une commande comme livrée
  const markAsDelivered = async (orderId, deliveryNote = '') => {
    try {
      setUpdatingOrderStatus(orderId);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.put(
        `${API_URL}/api/orders/${orderId}/deliver`,
        { deliveryNote },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: 'delivered', deliveredAt: new Date() } : order
        )
      );

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'delivered', deliveredAt: new Date() }));
      }

      toast.success('Commande marquée comme livrée');
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      toast.error('Erreur lors de la confirmation de livraison');
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  // Fonction pour obtenir le label d'un statut de commande
  const getOrderStatusLabel = status => {
    const statuses = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      refunded: 'Remboursée',
    };
    return statuses[status] || status;
  };

  // Fonction pour obtenir la couleur d'un statut de commande
  const getOrderStatusColor = status => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Rendre les catégories en français
  const getCategoryLabel = category => {
    const categories = {
      supplements: 'Suppléments',
      equipment: 'Équipement',
      books: 'Livres',
      accessories: 'Accessoires',
      skincare: 'Soins de la peau',
      aromatherapy: 'Aromathérapie',
      other: 'Autre',
    };
    return categories[category] || category;
  };

  // Rendre les statuts en français
  const getStatusLabel = status => {
    const statuses = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Refusé',
      inactive: 'Inactif',
    };
    return statuses[status] || status;
  };

  const handleNewProduct = () => {
    setFormData({
      title: '',
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'supplements',
      composition: '',
      specifications: [],
      tags: [],
      sizeOptions: [],
      sizeInventory: [],
      images: [],
      customCategory: '',
    });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleProductClick = product => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Fonctions pour gérer le formulaire de produit
  const handleSubmit = async e => {
    e.preventDefault();

    // Validation de la catégorie personnalisée
    if (formData.category === 'custom' && !formData.customCategory.trim()) {
      toast.error('Veuillez saisir le nom de la nouvelle catégorie');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const productData = {
        ...formData,
        name: formData.title, // Assurer la compatibilité
        // Si une catégorie personnalisée est sélectionnée, utiliser la valeur personnalisée
        category: formData.category === 'custom' ? formData.customCategory : formData.category,
        // Convertir les spécifications en format attendu par le backend
        specifications: formData.specifications.map(spec => ({
          name: spec,
          value: spec,
        })),
      };

      // Supprimer le champ customCategory des données envoyées (il n'est plus nécessaire)
      delete productData.customCategory;

      // Log pour déboguer
      console.log('Données envoyées au serveur:', productData);

      if (isEditing && selectedProduct) {
        // Mise à jour du produit existant
        await axios.put(
          `${API_URL}/api/professionals/products/${selectedProduct._id}`,
          productData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success('Produit mis à jour avec succès');
      } else {
        // Création d'un nouveau produit
        await axios.post(`${API_URL}/api/professionals/products`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Produit créé avec succès');
      }

      setIsFormModalOpen(false);
      fetchProducts(); // Recharger la liste des produits
    } catch (error) {
      console.error('Error saving product:', error);
      // Log plus détaillé de l'erreur
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);

        // Log détaillé des erreurs
        if (error.response.data.errors) {
          console.error('Detailed errors:', error.response.data.errors);
          error.response.data.errors.forEach((err, index) => {
            console.error(`Error ${index + 1}:`, err);
          });
        }

        toast.error(`Erreur: ${error.response.data.message || 'Données invalides'}`);
      } else {
        toast.error('Erreur lors de la sauvegarde du produit');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, event.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = index => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addSizeOption = () => {
    if (newSizeOption.trim() && newSizeStock >= 0) {
      const newSize = {
        size: newSizeOption.trim(),
        stock: newSizeStock,
      };

      setFormData(prev => ({
        ...prev,
        sizeInventory: [...prev.sizeInventory, newSize],
      }));

      setNewSizeOption('');
      setNewSizeStock(0);
    }
  };

  const removeSizeOption = index => {
    setFormData(prev => ({
      ...prev,
      sizeInventory: prev.sizeInventory.filter((_, i) => i !== index),
    }));
  };

  // Fonctions pour gérer les spécifications
  const addSpecification = () => {
    if (newSpecification.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, newSpecification.trim()],
      }));
      setNewSpecification('');
    }
  };

  const removeSpecification = index => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Fonctions pour gérer les tags
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = index => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Fonction utilitaire pour afficher le prix
  const formatPrice = (price, currency = 'MAD') => {
    if (typeof price === 'object' && price.amount) {
      return `${price.amount} ${price.currency || currency}`;
    }
    return `${price} ${currency}`;
  };

  // Fonction utilitaire pour obtenir le montant numérique du prix
  const getPriceAmount = price => {
    if (typeof price === 'object' && price.amount) {
      return price.amount;
    }
    return price;
  };

  // Helper function to get total stock for products with size variants
  const getTotalStock = product => {
    if (product.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.reduce((total, size) => total + size.stock, 0);
    }
    return product.stock || 0;
  };

  // Helper function to check if product has any sizes out of stock
  const hasOutOfStockSizes = product => {
    if (product.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.some(size => size.stock <= 0);
    }
    return false;
  };

  // Helper function to check if product is completely out of stock
  const isCompletelyOutOfStock = product => {
    if (product.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.every(size => size.stock <= 0);
    }
    return product.stock <= 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header moderne avec gradient */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
                <p className="text-slate-600 text-lg">
                  Gérez votre catalogue et suivez vos performances
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleNewProduct}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nouveau Produit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques améliorées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
          {/* Total des produits */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Produits</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <ChartBarIcon className="h-3 w-3" />
                  Catalogue complet
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-3 rounded-xl">
                <CubeIcon className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          {/* Produits approuvés */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Approuvés</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% du total
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-xl">
                <CheckIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Produits en attente */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">En Attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <ClockIcon className="h-3 w-3" />À valider
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Stock total */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Stock Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {products.reduce((total, product) => total + getTotalStock(product), 0)}
                </p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <CubeIcon className="h-3 w-3" />
                  Unités disponibles
                </p>
                {/* Warning for products with out of stock sizes */}
                {products.some(hasOutOfStockSizes) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    Certaines tailles en rupture
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Valeur totale */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Valeur Stock</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    products.reduce((total, product) => {
                      const price = getPriceAmount(product.price);
                      const stock = getTotalStock(product);
                      return total + (price * stock || 0);
                    }, 0)
                  )}{' '}
                  MAD
                </p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <BanknotesIcon className="h-3 w-3" />
                  Valeur totale
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
                <BanknotesIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Note moyenne */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Note Moyenne</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.length > 0
                    ? (
                        products.reduce(
                          (total, product) => total + (product.rating?.average || 0),
                          0
                        ) / products.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <StarIcon className="h-3 w-3 fill-current" />
                  Satisfaction client
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-xl">
                <StarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Rupture de stock par taille */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Ruptures par Taille</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(hasOutOfStockSizes).length}
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  Produits concernés
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 rounded-lg">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Filtres et recherche</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Recherche</label>
              <div className="relative">
                <input
                  type="text"
                  className="pl-11 pr-4 py-3 border border-slate-300 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Catégorie</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                <option value="supplements">Suppléments</option>
                <option value="equipment">Équipement</option>
                <option value="books">Livres</option>
                <option value="accessories">Accessoires</option>
                <option value="skincare">Soins de la peau</option>
                <option value="aromatherapy">Aromathérapie</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Statut</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Refusés</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        {loading ? (
          <div className="flex justify-center my-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200/60">
            {products.length > 0 ? (
              <div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-2 rounded-lg">
                      <CubeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Catalogue des produits ({products.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                      <div
                        key={product._id}
                        className="group bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                        onClick={() => handleProductClick(product)}
                      >
                        {/* Image du produit */}
                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={getImageUrl(product.images[0])}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23d1d5db' fill='none' stroke-width='2'/%3E%3Cpath d='M40,50 A5,5 0 1,1 40,40 A5,5 0 1,1 40,50 Z' fill='%23d1d5db'/%3E%3Cpath d='M30,70 L45,55 L55,65 L65,55 L70,60 L70,70 L30,70 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <PhotoIcon className="h-16 w-16 text-slate-400" />
                            </div>
                          )}

                          {/* Badge de statut */}
                          <div className="absolute top-3 right-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                                product.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : product.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : product.status === 'rejected'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              {getStatusLabel(product.status)}
                            </span>
                          </div>
                        </div>

                        {/* Contenu de la carte */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
                              {product.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          </div>

                          {/* Métadonnées */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-slate-500">
                              <TagIcon className="h-4 w-4" />
                              <span className="capitalize">
                                {getCategoryLabel(product.category)}
                              </span>
                            </div>
                            {product.rating && product.rating.average > 0 && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <StarIcon className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium">
                                  {product.rating.average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Prix et stock */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <CurrencyEuroIcon className="h-4 w-4 text-slate-500" />
                              <span className="font-bold text-lg text-slate-900">
                                {formatPrice(product.price, product.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CubeIcon className="h-4 w-4 text-slate-500" />
                              {product.sizeInventory && product.sizeInventory.length > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-slate-500 mb-1">Par taille:</span>
                                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                    {product.sizeInventory.slice(0, 3).map((size, index) => (
                                      <span
                                        key={index}
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                          size.stock <= 0
                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                            : size.stock <= 5
                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}
                                      >
                                        {size.size}: {size.stock <= 0 ? 'Rupture' : size.stock}
                                      </span>
                                    ))}
                                    {product.sizeInventory.length > 3 && (
                                      <span className="text-xs text-slate-500">
                                        +{product.sizeInventory.length - 3} autres
                                      </span>
                                    )}
                                  </div>
                                  {hasOutOfStockSizes(product) && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                                      <span className="text-xs text-amber-600">
                                        Certaines tailles en rupture
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={`text-sm font-medium ${
                                    product.stock <= 5 && product.stock > 0
                                      ? 'text-amber-600'
                                      : product.stock <= 0
                                        ? 'text-red-600'
                                        : 'text-emerald-600'
                                  }`}
                                >
                                  {product.stock <= 0 ? 'Rupture' : `${product.stock} unités`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* État vide modernisé */
              <div className="text-center py-16 px-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-4 rounded-2xl w-fit mx-auto mb-6">
                    <PhotoIcon className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Aucun produit trouvé
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {searchTerm || categoryFilter || statusFilter
                      ? 'Aucun produit ne correspond à vos critères de recherche. Essayez de modifier les filtres.'
                      : "Vous n'avez pas encore de produits dans votre catalogue. Commencez par ajouter votre premier produit."}
                  </p>
                  <button
                    onClick={handleNewProduct}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Ajouter votre premier produit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de détails du produit */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Détails du Produit</h2>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image du produit */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-4">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img
                        src={getImageUrl(selectedProduct.images[0])}
                        alt={selectedProduct.title}
                        className="w-full h-64 object-cover rounded-xl"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23d1d5db' fill='none' stroke-width='2'/%3E%3Cpath d='M40,50 A5,5 0 1,1 40,40 A5,5 0 1,1 40,50 Z' fill='%23d1d5db'/%3E%3Cpath d='M30,70 L45,55 L55,65 L65,55 L70,60 L70,70 L30,70 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-slate-100 rounded-xl">
                        <PhotoIcon className="h-16 w-16 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Badge de statut */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedProduct.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : selectedProduct.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : selectedProduct.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {getStatusLabel(selectedProduct.status)}
                    </span>
                    {selectedProduct.rating && selectedProduct.rating.average > 0 && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <StarIcon className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">
                          {selectedProduct.rating.average.toFixed(1)} (
                          {selectedProduct.rating.totalReviews} avis)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations du produit */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {selectedProduct.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CurrencyEuroIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Prix</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPrice(selectedProduct.price, selectedProduct.currency)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CubeIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Stock</span>
                      </div>
                      {selectedProduct.sizeInventory && selectedProduct.sizeInventory.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-600 mb-2">Stock par taille:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedProduct.sizeInventory.map((size, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  size.stock <= 0
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : size.stock <= 5
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}
                              >
                                <span className="font-medium">{size.size}</span>
                                <span className="text-sm font-semibold">
                                  {size.stock <= 0 ? 'Rupture' : `${size.stock} unités`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Stock total:</span>
                              <span
                                className={`font-semibold ${
                                  selectedProduct.sizeInventory.reduce(
                                    (total, size) => total + size.stock,
                                    0
                                  ) <= 0
                                    ? 'text-red-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {selectedProduct.sizeInventory.reduce(
                                  (total, size) => total + size.stock,
                                  0
                                )}{' '}
                                unités
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p
                          className={`text-2xl font-bold ${
                            selectedProduct.stock <= 5 && selectedProduct.stock > 0
                              ? 'text-amber-600'
                              : selectedProduct.stock <= 0
                                ? 'text-red-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {selectedProduct.stock <= 0
                            ? 'Rupture'
                            : `${selectedProduct.stock} unités`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TagIcon className="h-5 w-5 text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">Catégorie</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {getCategoryLabel(selectedProduct.category)}
                    </p>
                  </div>

                  {selectedProduct.composition && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <InformationCircleIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Composition</span>
                      </div>
                      <p className="text-slate-700">{selectedProduct.composition}</p>
                    </div>
                  )}

                  {/* Spécifications */}
                  {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Spécifications</span>
                      </div>
                      <div className="space-y-2">
                        {selectedProduct.specifications.map((spec, index) => (
                          <div key={index} className="flex items-center gap-2 text-slate-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span>{typeof spec === 'string' ? spec : spec.name || spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TagIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setIsProductModalOpen(false);
                        setSelectedProduct(selectedProduct);
                        setIsFormModalOpen(true);
                        setIsEditing(true);
                        setFormData({
                          title: selectedProduct.title,
                          name: selectedProduct.name,
                          description: selectedProduct.description,
                          price: selectedProduct.price,
                          stock: selectedProduct.stock,
                          category: selectedProduct.category,
                          composition: selectedProduct.composition || '',
                          specifications: (selectedProduct.specifications || []).map(spec =>
                            typeof spec === 'string' ? spec : spec.name || spec.value
                          ),
                          tags: selectedProduct.tags || [],
                          sizeOptions: selectedProduct.sizeOptions || [],
                          sizeInventory: selectedProduct.sizeInventory || [],
                          images: selectedProduct.images || [],
                          customCategory: '',
                        });
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setIsProductModalOpen(false);
                        setSelectedProduct(selectedProduct);
                        setIsOrdersModalOpen(true);
                        fetchProductOrders(selectedProduct._id);
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      Voir les commandes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des commandes du produit */}
      {isOrdersModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Commandes du Produit</h2>
                  <p className="text-slate-600 mt-1">{selectedProduct.title}</p>
                </div>
                <button
                  onClick={() => setIsOrdersModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Filtre par statut de commande */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-200 p-2 rounded-lg">
                    <ShoppingCartIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Filtrer par statut</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setOrderStatusFilter('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      orderStatusFilter === ''
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      orderStatusFilter === 'pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    En attente
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      orderStatusFilter === 'confirmed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Confirmées
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('shipped')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      orderStatusFilter === 'shipped'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Expédiées
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('delivered')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      orderStatusFilter === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Livrées
                  </button>
                </div>
              </div>

              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-blue-200 rounded-full"></div>
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders
                      .filter(order => !orderStatusFilter || order.status === orderStatusFilter)
                      .map(order => (
                        <div
                          key={order._id}
                          className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-600">
                              Commande #{order._id.slice(-8)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderStatusColor(order.status)}`}
                            >
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-slate-500" />
                              <span className="text-sm text-slate-700">
                                {order.clientId?.firstName && order.clientId?.lastName
                                  ? `${order.clientId.firstName} ${order.clientId.lastName}`
                                  : order.clientId?.email || 'Client'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CurrencyEuroIcon className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-semibold text-slate-900">
                                {order.totalAmount?.amount || order.totalAmount}{' '}
                                {order.totalAmount?.currency || 'MAD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-slate-500" />
                              <span className="text-sm text-slate-600">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setIsOrderDetailsModalOpen(true);
                              }}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Détails
                            </button>

                            {order.status === 'pending' && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateOrderStatus(order._id, 'confirmed');
                                }}
                                disabled={updatingOrderStatus === order._id}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingOrderStatus === order._id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                                Confirmer
                              </button>
                            )}

                            {order.status === 'confirmed' && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateOrderStatus(order._id, 'shipped');
                                }}
                                disabled={updatingOrderStatus === order._id}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingOrderStatus === order._id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <TruckIcon className="h-3 w-3" />
                                )}
                                Expédier
                              </button>
                            )}

                            {order.status === 'shipped' && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  markAsDelivered(order._id);
                                }}
                                disabled={updatingOrderStatus === order._id}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingOrderStatus === order._id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                                Marquer livré
                              </button>
                            )}

                            {/* Afficher les informations de livraison si commande livrée */}
                            {order.status === 'delivered' && order.deliveredAt && (
                              <div className="flex-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-1 text-emerald-700">
                                  <CheckIcon className="h-3 w-3" />
                                  <span className="text-xs font-medium">
                                    Livré le{' '}
                                    {new Date(order.deliveredAt).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateOrderStatus(order._id, 'cancelled');
                                }}
                                disabled={updatingOrderStatus === order._id}
                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingOrderStatus === order._id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <XCircleIcon className="h-3 w-3" />
                                )}
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 max-w-md mx-auto">
                    <ShoppingCartIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune commande</h3>
                    <p className="text-slate-600">
                      Ce produit n&apos;a pas encore reçu de commandes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails de commande */}
      {isOrderDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Détails de la Commande</h2>
                <button
                  onClick={() => setIsOrderDetailsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Informations Commande</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Numéro:</span>
                      <span className="font-medium">#{selectedOrder._id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Statut:</span>
                      <span
                        className={`font-medium ${
                          selectedOrder.status === 'delivered'
                            ? 'text-emerald-600'
                            : selectedOrder.status === 'pending'
                              ? 'text-amber-600'
                              : selectedOrder.status === 'cancelled'
                                ? 'text-red-600'
                                : selectedOrder.status === 'shipped'
                                  ? 'text-indigo-600'
                                  : selectedOrder.status === 'confirmed'
                                    ? 'text-blue-600'
                                    : 'text-slate-600'
                        }`}
                      >
                        {getOrderStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Montant:</span>
                      <span className="font-bold text-lg">
                        {selectedOrder.totalAmount?.amount || selectedOrder.totalAmount}{' '}
                        {selectedOrder.totalAmount?.currency || 'MAD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Client</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nom:</span>
                      <span className="font-medium">
                        {selectedOrder.clientId?.firstName && selectedOrder.clientId?.lastName
                          ? `${selectedOrder.clientId.firstName} ${selectedOrder.clientId.lastName}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium">{selectedOrder.clientId?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Téléphone:</span>
                      <span className="font-medium">{selectedOrder.clientId?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Produits Commandés</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                            <CubeIcon className="h-6 w-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.product?.title || item.product?.name || 'Produit'}
                            </p>
                            <p className="text-sm text-slate-600">Quantité: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatPrice(item.price)}</p>
                          <p className="text-sm text-slate-600">
                            Total: {getPriceAmount(item.price) * item.quantity} MAD
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.shippingAddress && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Adresse de Livraison</h4>
                  <p className="text-sm text-slate-700">
                    {selectedOrder.shippingAddress.street}
                    <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}
                    <br />
                    {selectedOrder.shippingAddress.country}
                  </p>
                </div>
              )}

              {/* Informations sur les dates importantes */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Historique de la Commande</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date de commande:</span>{' '}
                    <span className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {selectedOrder.shippedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date d'expédition:</span>
                      <span className="font-medium text-indigo-600">
                        {new Date(selectedOrder.shippedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(selectedOrder.shippedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {selectedOrder.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date de livraison:</span>
                      <span className="font-medium text-emerald-600">
                        {new Date(selectedOrder.deliveredAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(selectedOrder.deliveredAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {selectedOrder.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date d'annulation:</span>
                      <span className="font-medium text-red-600">
                        {new Date(selectedOrder.cancelledAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(selectedOrder.cancelledAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Calculer le délai de livraison */}
                  {selectedOrder.deliveredAt && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Délai de livraison:</span>
                        <span className="font-medium text-blue-600">
                          {Math.ceil(
                            (new Date(selectedOrder.deliveredAt) -
                              new Date(selectedOrder.createdAt)) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          jour(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes et commentaires */}
              {selectedOrder.notes && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de création/édition de produit */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {isEditing ? 'Modifier le Produit' : 'Nouveau Produit'}
                </h2>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Informations de base
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Titre du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nom du produit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Description détaillée du produit"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prix (MAD) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          category: value,
                          customCategory: value === 'custom' ? prev.customCategory : '',
                        }));
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {PRODUCT_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    {/* Champ pour catégorie personnalisée */}
                    {formData.category === 'custom' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          required
                          value={formData.customCategory}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              customCategory: e.target.value,
                            }))
                          }
                          placeholder="Nom de la nouvelle catégorie"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Composition/Ingrédients
                    </label>
                    <textarea
                      rows={3}
                      value={formData.composition}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, composition: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Ingrédients, composition, etc."
                    />
                  </div>
                </div>

                {/* Images et options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Images et options</h3>

                  {/* Upload d'images */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Images du produit
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <PhotoIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-2">Cliquez pour ajouter des images</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Choisir des fichiers
                      </button>
                    </div>

                    {/* Aperçu des images */}
                    {formData.images && formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={getImageUrl(image)}
                              alt={`Produit ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gestion des tailles */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tailles disponibles (optionnel)
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSizeOption}
                          onChange={e => setNewSizeOption(e.target.value)}
                          placeholder="Taille (ex: S, M, L, 100ml)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          value={newSizeStock}
                          onChange={e => setNewSizeStock(parseInt(e.target.value) || 0)}
                          placeholder="Stock"
                          min="0"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addSizeOption}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Liste des tailles */}
                      {formData.sizeInventory && formData.sizeInventory.length > 0 && (
                        <div className="space-y-2">
                          {formData.sizeInventory.map((size, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                            >
                              <span className="font-medium">{size.size}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Stock: {size.stock}</span>
                                <button
                                  type="button"
                                  onClick={() => removeSizeOption(index)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gestion des spécifications */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Spécifications (optionnel)
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSpecification}
                          onChange={e => setNewSpecification(e.target.value)}
                          placeholder="Spécification (ex: 100% naturel)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addSpecification}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Liste des spécifications */}
                      {formData.specifications && formData.specifications.length > 0 && (
                        <div className="space-y-2">
                          {formData.specifications.map((specification, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                            >
                              <span className="font-medium">{specification}</span>
                              <button
                                type="button"
                                onClick={() => removeSpecification(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gestion des tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags (optionnel)
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={e => setNewTag(e.target.value)}
                          placeholder="Tag (ex: bio, vegan)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Liste des tags */}
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="space-y-2">
                          {formData.tags.map((tag, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                            >
                              <span className="font-medium">{tag}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isEditing ? 'Mise à jour...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      {isEditing ? 'Mettre à jour' : 'Créer le produit'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/*
 * SIZE INVENTORY MANAGEMENT FEATURES:
 *
 * This component now properly handles products with size variants and individual stock levels:
 * - Products can have both general stock AND size-specific inventory (sizeInventory)
 * - Product cards show size-specific stock status with color coding (red=out of stock, amber=low stock, green=good stock)
 * - Product detail modal displays comprehensive size inventory breakdown
 * - Statistics include size-specific calculations and warnings
 * - New "Ruptures par Taille" statistic shows products with partial size stock issues
 * - Helper functions calculate accurate stock totals and identify stock issues across size variants
 *
 * This fixes the issue where products with size options didn't properly show out-of-stock warnings.
 */

export default ProfessionalProductsPage;
