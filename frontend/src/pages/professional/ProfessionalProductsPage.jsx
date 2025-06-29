import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon as _CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CurrencyEuroIcon,
  CubeIcon,
  PhotoIcon,
  ClockIcon,
  UserIcon as _UserIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link as _Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

// Temporary mock data for products
const MOCK_PRODUCTS = [
  {
    _id: 'mock-product-1',
    title: 'Huile essentielle de lavande',
    name: 'Huile essentielle de lavande',
    description:
      'Huile essentielle 100% pure et naturelle, idéale pour la relaxation et le sommeil.',
    price: 120,
    stock: 15,
    category: 'aromatherapy',
    status: 'approved',
    images: [],
    rating: { average: 4.5, totalReviews: 12 },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock-product-2',
    title: 'Tapis de yoga premium',
    name: 'Tapis de yoga premium',
    description: 'Tapis de yoga antidérapant, écologique et durable pour une pratique confortable.',
    price: 350,
    stock: 8,
    category: 'equipment',
    status: 'approved',
    images: [],
    rating: { average: 4.8, totalReviews: 24 },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock-product-3',
    title: 'Thé vert bio détox',
    name: 'Thé vert bio détox',
    description: 'Mélange de thé vert et de plantes pour une détoxification naturelle du corps.',
    price: 85,
    stock: 30,
    category: 'supplements',
    status: 'pending',
    images: [],
    rating: { average: 4.2, totalReviews: 8 },
    createdAt: new Date().toISOString(),
  },
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
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'supplements',
    composition: '',
    sizeOptions: [],
    sizeInventory: [],
    images: [],
  });
  const [newSizeOption, setNewSizeOption] = useState('');
  const [newSizeStock, setNewSizeStock] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      try {
        // Try the real API call first
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
      } catch (apiError) {
        console.error('Error fetching products from API, falling back to mock data:', apiError);

        // If the API call fails, use mock data as a fallback
        console.log('Using mock product data instead');
        toast('Utilisation de données de démonstration temporaires');

        // Filter mock data based on search/category/status filters
        let filteredProducts = [...MOCK_PRODUCTS];

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredProducts = filteredProducts.filter(
            p =>
              p.title.toLowerCase().includes(searchLower) ||
              p.description.toLowerCase().includes(searchLower)
          );
        }

        if (categoryFilter) {
          filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
        }

        if (statusFilter) {
          filteredProducts = filteredProducts.filter(p => p.status === statusFilter);
        }

        // Compute mock stats
        const mockStats = {
          pending: MOCK_PRODUCTS.filter(p => p.status === 'pending').length,
          approved: MOCK_PRODUCTS.filter(p => p.status === 'approved').length,
          rejected: MOCK_PRODUCTS.filter(p => p.status === 'rejected').length,
          inactive: MOCK_PRODUCTS.filter(p => p.status === 'inactive').length,
          total: MOCK_PRODUCTS.length,
        };

        setProducts(filteredProducts);
        setTotalPages(1); // Just one page for mock data
        setStats(mockStats);
      }
    } catch (error) {
      console.error('Unexpected error in fetchProducts:', error);
      toast.error('Erreur inattendue lors du chargement des produits');

      // Set empty data to prevent UI issues
      setProducts([]);
      setTotalPages(1);
      setStats({ pending: 0, approved: 0, rejected: 0, inactive: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductOrders = async productId => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/by-product/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
        toast.error('Erreur lors de la récupération des commandes');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      setOrders([]);
      toast.error('Erreur lors de la récupération des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderDetails = async orderId => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setIsOrderDetailsModalOpen(true);
      } else {
        toast.error('Erreur lors de la récupération des détails de la commande');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la commande:', error);
      toast.error('Erreur lors de la récupération des détails de la commande');
    }
  };

  const handleProductSubmit = async e => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Prepare form data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sizeOptions: formData.sizeOptions || [],
        sizeInventory: formData.sizeInventory || [],
        // Ensure images are included
        images: formData.images || [],
      };

      try {
        let response;
        if (isEditing) {
          // Update existing product
          response = await axios.put(
            `${API_URL}/api/professionals/products/${selectedProduct._id}`,
            productData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          // Create new product
          response = await axios.post(`${API_URL}/api/professionals/products`, productData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        console.log('Product saved:', response.data);
        toast.success(isEditing ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès');
      } catch (apiError) {
        console.error('API error when saving product, using mock data instead:', apiError);
        toast('Mode démo: Simulant la sauvegarde du produit');
        // Just pretend it worked when using mock data
      }

      setIsFormModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde du produit');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      try {
        await axios.delete(`${API_URL}/api/professionals/products/${selectedProduct._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (apiError) {
        console.error('API error when deleting product, using mock data instead:', apiError);
        toast('Mode démo: Simulant la suppression du produit');
        // Just pretend it worked when using mock data
      }

      toast.success('Produit supprimé avec succès');
      setIsDeleteModalOpen(false);
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const handleProductClick = product => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = product => {
    setSelectedProduct(product);

    // Convertir sizeOptions en sizeInventory si nécessaire
    let sizeInventory = product.sizeInventory || [];
    if (!product.sizeInventory && product.sizeOptions && product.sizeOptions.length > 0) {
      // Si pas de sizeInventory mais des sizeOptions, créer sizeInventory avec stock 0
      sizeInventory = product.sizeOptions.map(size => ({ size, stock: 0 }));
    }

    setFormData({
      title: product.title,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      composition: product.composition || '',
      sizeOptions: product.sizeOptions || [],
      sizeInventory: sizeInventory,
      images: product.images || [],
    });
    setIsEditing(true);
    setIsFormModalOpen(true);
    setIsProductModalOpen(false);
  };

  const handleNewProduct = () => {
    resetForm();
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'supplements',
      composition: '',
      sizeOptions: [],
      sizeInventory: [],
      images: [],
    });
    setNewSizeOption('');
    setNewSizeStock(0);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSizeOption = () => {
    if (newSizeOption.trim() === '') return;

    // Ajouter la taille avec son stock associé
    const newSizeItem = {
      size: newSizeOption.trim(),
      stock: parseInt(newSizeStock) || 0,
    };

    setFormData(prev => {
      const updatedSizeInventory = [...(prev.sizeInventory || []), newSizeItem];
      const updatedSizeOptions = updatedSizeInventory.map(item => item.size);

      // Calculer le stock total
      const totalStock = updatedSizeInventory.reduce((sum, item) => sum + item.stock, 0);

      return {
        ...prev,
        sizeInventory: updatedSizeInventory,
        sizeOptions: updatedSizeOptions,
        stock: totalStock,
      };
    });

    setNewSizeOption('');
    setNewSizeStock(0);
  };

  const handleRemoveSizeOption = index => {
    setFormData(prev => {
      const updatedSizeInventory = prev.sizeInventory.filter((_, i) => i !== index);
      const updatedSizeOptions = updatedSizeInventory.map(item => item.size);

      // Recalculer le stock total
      const totalStock = updatedSizeInventory.reduce((sum, item) => sum + item.stock, 0);

      return {
        ...prev,
        sizeInventory: updatedSizeInventory,
        sizeOptions: updatedSizeOptions,
        stock: totalStock,
      };
    });
  };

  const handleImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      console.log('Starting image upload for file:', file.name);
      toast("Chargement de l'image en cours...");

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(`${API_URL}/api/uploads/products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        const imageUrl = response.data.imageUrl;
        console.log('Image uploaded successfully, URL:', imageUrl);

        setFormData(prev => {
          // Update form data with the new image URL
          const updatedImages = [...prev.images, imageUrl];
          console.log('Updated images array:', updatedImages);

          return {
            ...prev,
            images: updatedImages,
          };
        });

        toast.success('Image téléchargée avec succès');
      } else {
        console.error('Failed to upload image:', response.data);
        toast.error("Échec du téléchargement de l'image");
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || "Erreur lors du téléchargement de l'image");

      // Fallback for development/demo - use local URL
      if (process.env.NODE_ENV !== 'production') {
        const imageUrl = URL.createObjectURL(file);
        console.log('Using local image URL as fallback:', imageUrl);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl],
        }));
        toast("Utilisation de l'aperçu local (mode développement)");
      }
    }
  };

  const handleRemoveImage = index => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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

  // Classe CSS pour les badges de statut
  const getStatusClass = status => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fonction pour ouvrir la modale des commandes
  const openOrdersModal = product => {
    setSelectedProduct(product);
    setIsOrdersModalOpen(true);
    fetchProductOrders(product._id);
  };

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Si on annule la commande, on doit retourner les quantités au stock
      let message = '';
      if (newStatus === 'cancelled') {
        message = prompt(
          "Veuillez entrer un message d'annulation pour le client:",
          "Nous sommes désolés, mais votre commande a été annulée en raison d'un problème. Veuillez nous excuser pour ce désagrément."
        );
        if (message === null) return; // L'utilisateur a annulé la saisie
      }

      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          status: newStatus,
          returnToStock: newStatus === 'cancelled', // Indiquer qu'il faut retourner au stock
          cancellationMessage: message || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(
          `Statut de la commande mis à jour: ${newStatus === 'cancelled' ? 'Annulée' : newStatus}`
        );

        if (newStatus === 'cancelled') {
          toast.success(
            'Les quantités ont été retournées au stock et une notification a été envoyée au client'
          );
        }

        setSelectedOrder(response.data.order);

        // Mettre à jour la liste des commandes
        if (selectedProduct) {
          fetchProductOrders(selectedProduct._id);
        }

        // Rafraîchir la liste des produits pour mettre à jour les stocks
        if (newStatus === 'cancelled') {
          fetchProducts();
        }
      } else {
        toast.error('Erreur lors de la mise à jour du statut de la commande');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
      toast.error('Erreur lors de la mise à jour du statut de la commande');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
        <button onClick={handleNewProduct} className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau Produit
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Approuvés</p>
          <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Refusés</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-gray-500">Inactifs</p>
          <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-primary-500 focus:border-primary-500"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              className="border border-gray-300 rounded-md w-full py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              className="border border-gray-300 rounded-md w-full py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
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
              className="btn-secondary w-full flex items-center justify-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {products.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {products.map(product => (
                  <div
                    key={product._id}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23d1d5db' fill='none' stroke-width='2'/%3E%3Cpath d='M40,50 A5,5 0 1,1 40,40 A5,5 0 1,1 40,50 Z' fill='%23d1d5db'/%3E%3Cpath d='M30,70 L45,55 L55,65 L65,55 L70,60 L70,70 L30,70 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <PhotoIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(product.status)}`}
                        >
                          {getStatusLabel(product.status)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <TagIcon className="h-4 w-4 mr-1" />
                          {getCategoryLabel(product.category)}
                        </div>
                        <div className="flex items-center text-sm font-semibold text-gray-900">
                          <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                          {product.price} {product.currency || 'MAD'}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <CubeIcon className="h-4 w-4 mr-1" />
                        <span>Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Précédent
                    </button>
                    <span className="text-gray-700">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <PhotoIcon className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun produit trouvé</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || categoryFilter || statusFilter
                  ? 'Aucun produit ne correspond à vos critères de recherche'
                  : "Vous n'avez pas encore de produits. Cliquez sur 'Nouveau Produit' pour commencer."}
              </p>
              <button onClick={handleNewProduct} className="mt-4 btn-primary">
                Ajouter un produit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modale de détails du produit */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h2>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(selectedProduct.status)}`}
                    >
                      {getStatusLabel(selectedProduct.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Galerie d'images */}
                <div className="bg-gray-100 rounded-lg overflow-hidden h-64">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={getImageUrl(selectedProduct.images[0])}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain"
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23d1d5db' fill='none' stroke-width='2'/%3E%3Cpath d='M40,50 A5,5 0 1,1 40,40 A5,5 0 1,1 40,50 Z' fill='%23d1d5db'/%3E%3Cpath d='M30,70 L45,55 L55,65 L65,55 L70,60 L70,70 L30,70 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Informations produit */}
                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Catégorie</p>
                      <p className="font-medium">{getCategoryLabel(selectedProduct.category)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Prix</p>
                      <p className="font-medium text-xl">
                        {selectedProduct.price} {selectedProduct.currency || 'MAD'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Stock</p>
                      <p
                        className={`font-medium ${selectedProduct.stock <= 0 ? 'text-red-600' : 'text-gray-900'}`}
                      >
                        {selectedProduct.stock <= 0
                          ? 'Rupture de stock'
                          : `${selectedProduct.stock} unités`}
                      </p>
                    </div>

                    {selectedProduct.sizeInventory && selectedProduct.sizeInventory.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500">Tailles et stocks disponibles</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProduct.sizeInventory.map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                              {item.size} ({item.stock})
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      selectedProduct.sizeOptions &&
                      selectedProduct.sizeOptions.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Tailles disponibles</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedProduct.sizeOptions.map((size, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              {selectedProduct.composition && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Composition</h3>
                  <p className="text-gray-700">{selectedProduct.composition}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {/* Tailles et stocks additionnels si présents */}
                {selectedProduct.sizeInventory && selectedProduct.sizeInventory.length > 0 ? (
                  <div className="w-full">
                    <h3 className="font-semibold text-gray-900 mb-2">Tailles et stocks</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Taille
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Stock
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedProduct.sizeInventory.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.size}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {item.stock}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  selectedProduct.sizeOptions &&
                  selectedProduct.sizeOptions.length > 0 && (
                    <div className="w-full">
                      <h3 className="font-semibold text-gray-900 mb-2">Tailles</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizeOptions.map((size, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {/* Note d'information sur le statut */}
                {selectedProduct.status === 'pending' && (
                  <div className="flex items-center bg-yellow-50 text-yellow-800 p-3 rounded-lg">
                    <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      Ce produit est en attente d'approbation par un administrateur.
                    </p>
                  </div>
                )}

                {selectedProduct.status === 'rejected' && (
                  <div className="flex items-center bg-red-50 text-red-800 p-3 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      Ce produit a été refusé. Veuillez le modifier et le soumettre à nouveau.
                    </p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditProduct(selectedProduct)}
                      className="btn-secondary flex items-center"
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Modifier
                    </button>
                    <button
                      onClick={() => openOrdersModal(selectedProduct)}
                      className="btn-secondary flex items-center"
                    >
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Commandes
                    </button>
                  </div>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn-danger flex items-center"
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de suppression */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-semibold">Supprimer le produit</h3>
            </div>

            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleDeleteProduct} className="btn-danger">
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de formulaire (ajout/modification) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
                </h2>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nom (référence) *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="input-field w-full"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Prix (MAD) *
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="stock"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Stock *
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        min="0"
                        className="input-field w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Catégorie *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        required
                      >
                        <option value="supplements">Suppléments</option>
                        <option value="equipment">Équipement</option>
                        <option value="books">Livres</option>
                        <option value="accessories">Accessoires</option>
                        <option value="skincare">Soins de la peau</option>
                        <option value="aromatherapy">Aromathérapie</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="composition"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Composition (optionnel)
                    </label>
                    <textarea
                      id="composition"
                      name="composition"
                      value={formData.composition}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field w-full"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tailles et stocks disponibles (optionnel)
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={newSizeOption}
                          onChange={e => setNewSizeOption(e.target.value)}
                          className="input-field w-full"
                          placeholder="S, M, L, XL, 38, 40..."
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newSizeStock}
                          onChange={e => setNewSizeStock(parseInt(e.target.value) || 0)}
                          className="input-field w-full"
                          placeholder="Stock"
                          min="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <button
                          type="button"
                          onClick={handleAddSizeOption}
                          className="w-full px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                        >
                          Ajouter cette taille
                        </button>
                      </div>
                    </div>

                    {formData.sizeInventory && formData.sizeInventory.length > 0 && (
                      <div className="mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Taille
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Stock
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {formData.sizeInventory.map((item, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.size}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {item.stock}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSizeOption(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images (optionnel)
                    </label>
                    <div
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                      onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-primary-500');
                      }}
                      onDragLeave={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary-500');
                      }}
                      onDrop={async e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary-500');

                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          await handleImageUpload({ target: { files: [file] } });
                        }
                      }}
                    >
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Télécharger une image</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                            />
                          </label>
                          <p className="pl-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
                      </div>
                    </div>

                    {formData.images && formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={getImageUrl(image)}
                              alt={`Image ${index + 1}`}
                              className="h-24 w-full object-cover rounded"
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23d1d5db' fill='none' stroke-width='2'/%3E%3Cpath d='M40,50 A5,5 0 1,1 40,40 A5,5 0 1,1 40,50 Z' fill='%23d1d5db'/%3E%3Cpath d='M30,70 L45,55 L55,65 L65,55 L70,60 L70,70 L30,70 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100"
                            >
                              <XMarkIcon className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale des commandes */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Commandes pour {selectedProduct?.title}
                </h2>
                <button
                  onClick={() => setIsOrdersModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {loadingOrders ? (
                <div className="flex justify-center my-12">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Référence
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Client
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Statut
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Quantité
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map(order => {
                        // Trouver l'item qui correspond au produit sélectionné
                        const orderItem = order.items.find(
                          item => item.product && item.product._id === selectedProduct._id
                        );

                        return (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.clientId?.firstName} {order.clientId?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{order.clientId?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleTimeString('fr-FR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'shipped'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'delivered'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status === 'pending'
                                  ? 'En attente'
                                  : order.status === 'shipped'
                                    ? 'Expédiée'
                                    : order.status === 'delivered'
                                      ? 'Livrée'
                                      : order.status === 'cancelled'
                                        ? 'Annulée'
                                        : order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {orderItem ? orderItem.quantity : 'N/A'}
                              {orderItem && orderItem.size && ` (${orderItem.size})`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => fetchOrderDetails(order._id)}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                Détails
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="h-16 w-16 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Aucune commande trouvée
                  </h3>
                  <p className="mt-1 text-gray-500">Ce produit n'a pas encore été commandé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale des détails de commande */}
      {isOrderDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Détails de la commande #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setIsOrderDetailsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informations client</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-1">
                      <span className="font-medium">Nom:</span> {selectedOrder.clientId?.firstName}{' '}
                      {selectedOrder.clientId?.lastName}
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Email:</span> {selectedOrder.clientId?.email}
                    </p>
                    {selectedOrder.clientId?.phone && (
                      <p className="mb-1">
                        <span className="font-medium">Téléphone:</span>{' '}
                        {selectedOrder.clientId?.phone}
                      </p>
                    )}
                    {selectedOrder.shippingAddress && (
                      <p className="mb-1">
                        <span className="font-medium">Adresse de livraison:</span>{' '}
                        {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                        , {selectedOrder.shippingAddress.postalCode},{' '}
                        {selectedOrder.shippingAddress.country}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Informations commande</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-1">
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}{' '}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR')}
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Statut:</span>{' '}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedOrder.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedOrder.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedOrder.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : selectedOrder.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedOrder.status === 'pending'
                          ? 'En attente'
                          : selectedOrder.status === 'shipped'
                            ? 'Expédiée'
                            : selectedOrder.status === 'delivered'
                              ? 'Livrée'
                              : selectedOrder.status === 'cancelled'
                                ? 'Annulée'
                                : selectedOrder.status}
                      </span>
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Total:</span> {selectedOrder.totalAmount}{' '}
                      {selectedOrder.currency || 'MAD'}
                    </p>
                    {selectedOrder.paymentMethod && (
                      <p className="mb-1">
                        <span className="font-medium">Méthode de paiement:</span>{' '}
                        {selectedOrder.paymentMethod === 'credit_card'
                          ? 'Carte de crédit'
                          : selectedOrder.paymentMethod === 'cash_on_delivery'
                            ? 'Paiement à la livraison'
                            : selectedOrder.paymentMethod === 'bank_transfer'
                              ? 'Virement bancaire'
                              : selectedOrder.paymentMethod}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-2">Produits commandés</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Produit
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Taille
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Prix unitaire
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantité
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.product?.images && item.product.images.length > 0 && (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="h-10 w-10 rounded-md object-cover mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.title || 'Produit non disponible'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.size || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.price} {selectedOrder.currency || 'MAD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(item.price * item.quantity).toFixed(2)}{' '}
                          {selectedOrder.currency || 'MAD'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsOrderDetailsModalOpen(false)}
                  className="btn-secondary mr-3"
                >
                  Fermer
                </button>
                {selectedOrder.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder._id, 'shipped')}
                      className="btn-primary"
                    >
                      Marquer comme expédiée
                    </button>
                  </>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                    className="btn-primary"
                  >
                    Marquer comme livrée
                  </button>
                )}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'shipped') && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                    className="btn-danger ml-3"
                  >
                    Annuler la commande
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProductsPage;
