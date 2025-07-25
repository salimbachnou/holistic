import {
  MagnifyingGlassIcon,
  HeartIcon,
  EyeIcon,
  XMarkIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  PlusIcon,
  MinusIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Eye, Package, TrendingUp, Star } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSettings } from '../contexts/SettingsContext';
import './ProductsPage.css';

// Product categories for filtering
const PRODUCT_CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'supplements', label: 'Compléments alimentaires' },
  { value: 'equipment', label: 'Équipements' },
  { value: 'books', label: 'Livres' },
  { value: 'accessories', label: 'Accessoires' },
  { value: 'skincare', label: 'Soins de la peau' },
  { value: 'aromatherapy', label: 'Aromathérapie' },
  { value: 'other', label: 'Autres' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'popular', label: 'Les plus populaires' },
];

// Mock products data for development
const MOCK_PRODUCTS = [
  {
    _id: 'product-1',
    title: 'Huile essentielle de lavande bio',
    description:
      'Huile essentielle 100% pure et naturelle de lavande vraie, idéale pour la relaxation et favoriser un sommeil réparateur. Certifiée bio.',
    price: 25.99,
    currency: 'MAD',
    images: [],
    category: 'aromatherapy',
    rating: { average: 4.8, totalReviews: 23 },
    stock: 15,
    professionalId: {
      _id: 'prof-1',
      businessName: 'Nature & Bien-être',
      contactInfo: { email: 'contact@naturebienetre.ma' },
    },
    featured: true,
    tags: ['bio', 'relaxation', 'sommeil'],
    sizeOptions: ['10ml', '30ml', '50ml'],
  },
  {
    _id: 'product-2',
    title: 'Tapis de yoga antidérapant premium',
    description:
      'Tapis de yoga haute qualité, antidérapant et écologique. Fabriqué en matériaux recyclés pour une pratique confortable et durable.',
    price: 89.99,
    currency: 'MAD',
    images: [],
    category: 'equipment',
    rating: { average: 4.6, totalReviews: 18 },
    stock: 8,
    professionalId: {
      _id: 'prof-2',
      businessName: 'Yoga Casablanca',
      contactInfo: { email: 'info@yogacasa.ma' },
    },
    featured: false,
    tags: ['yoga', 'écologique', 'premium'],
    sizeOptions: ['Standard', 'Large', 'Extra Large'],
  },
  {
    _id: 'product-3',
    title: 'Complément détox naturel',
    description:
      "Mélange de plantes et superaliments pour une détoxification en douceur. Favorise le nettoyage de l'organisme et booste l'énergie.",
    price: 45.5,
    currency: 'MAD',
    images: [],
    category: 'supplements',
    rating: { average: 4.4, totalReviews: 31 },
    stock: 22,
    professionalId: {
      _id: 'prof-3',
      businessName: 'Naturopathie Moderne',
      contactInfo: { email: 'hello@naturomoderne.ma' },
    },
    featured: true,
    tags: ['détox', 'naturel', 'énergie'],
    sizeOptions: ['60 gélules', '120 gélules'],
  },
  {
    _id: 'product-4',
    title: 'Guide de méditation pour débutants',
    description:
      'Livre complet pour apprendre les bases de la méditation. Techniques simples et exercices pratiques pour débuter votre voyage intérieur.',
    price: 35,
    currency: 'MAD',
    images: [],
    category: 'books',
    rating: { average: 4.9, totalReviews: 12 },
    stock: 5,
    professionalId: {
      _id: 'prof-4',
      businessName: 'Centre de Méditation',
      contactInfo: { email: 'centre@meditation.ma' },
    },
    featured: false,
    tags: ['méditation', 'débutants', 'guide'],
  },
];

// Utility function to get image URL
const getImageUrl = imagePath => {
  if (!imagePath) return '/api/placeholder/300/300';
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${API_URL}${imagePath}`;
};

// Helper function to check if product is completely out of stock
const isCompletelyOutOfStock = product => {
  if (product.sizeInventory && product.sizeInventory.length > 0) {
    return product.sizeInventory.every(size => size.stock <= 0);
  }
  return product.stock <= 0;
};

// Product Card Component
const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { formatCurrency } = useSettings();
  const { toggleProductFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const isProductFavorite = isFavorite('products', product._id);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Generate default sizes based on product category if needed
  const getDefaultSizes = () => {
    // Si le produit a des tailles définies, les utiliser exactement comme dans la base de données
    if (
      product.sizeOptions &&
      Array.isArray(product.sizeOptions) &&
      product.sizeOptions.length > 0
    ) {
      return [...product.sizeOptions]; // Retourne une copie pour éviter les mutations
    }

    // Sinon, générer des tailles par défaut basées sur la catégorie
    let defaultSizes = [];
    if (product.category === 'supplements') {
      defaultSizes = ['30 gélules', '60 gélules', '120 gélules'];
    } else if (product.category === 'aromatherapy') {
      defaultSizes = ['10ml', '30ml', '50ml'];
    } else if (product.category === 'equipment') {
      defaultSizes = ['S', 'M', 'L', 'XL'];
    } else {
      defaultSizes = ['Taille unique'];
    }
    return defaultSizes;
  };

  const sizeOptions = getDefaultSizes();

  // Get stock for a specific size
  const getStockForSize = size => {
    if (
      product.sizeInventory &&
      Array.isArray(product.sizeInventory) &&
      product.sizeInventory.length > 0
    ) {
      // Recherche exacte, sans transformation de casse
      const sizeInfo = product.sizeInventory.find(item => item.size === size);
      if (sizeInfo) {
        return sizeInfo.stock;
      }
      return 0;
    }
    return product.stock || 0;
  };

  const handleOrder = e => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour commander');
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    // Rediriger vers la page de détail du produit
    navigate(`/products/${product._id}`);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const getStockStatus = () => {
    // Si le produit a des tailles, calculer le stock total de toutes les tailles
    // Sinon, utiliser le stock général du produit
    const totalStock =
      product.sizeInventory && product.sizeInventory.length > 0
        ? product.sizeInventory.reduce((total, item) => total + item.stock, 0)
        : product.stock || 0;

    const inStock = totalStock > 0;

    if (!inStock) return { text: 'Rupture de stock', color: 'text-red-600', bg: 'bg-red-50' };
    if (totalStock <= 5)
      return { text: `Plus que ${totalStock}`, color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'En stock', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const stockStatus = getStockStatus();
  const totalStock =
    product.sizeInventory && product.sizeInventory.length > 0
      ? product.sizeInventory.reduce((total, item) => total + item.stock, 0)
      : product.stock || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden border border-gray-100 hover:border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Featured Badge */}
      {product.featured && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <TrendingUp className="h-3 w-3" />
            <span>Tendance</span>
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent z-10" />

        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          onLoad={handleImageLoad}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}

        {/* Top Right Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
          <button
            onClick={e => {
              e.stopPropagation();
              toggleProductFavorite(product);
            }}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 shadow-lg ${
              isProductFavorite
                ? 'bg-red-500/90 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className={`h-5 w-5 ${isProductFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              navigate(`/products/${product._id}`);
            }}
            className="p-3 rounded-full bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>

        {/* Stock Status */}
        <div className="absolute bottom-4 left-4 z-20">
          <div
            className={`${stockStatus.bg} ${stockStatus.color} text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{stockStatus.text}</span>
            </div>
          </div>
        </div>

        {/* Out of Stock Overlay - Ne l'afficher que si le stock total est vraiment 0 */}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
            <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        {/* Category & Brand */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {PRODUCT_CATEGORIES.find(cat => cat.value === product.category)?.label ||
              product.category}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {product.professionalId?.businessName || product.name || 'Professionnel'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          {product.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating?.average || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {(product.rating?.average || 0).toFixed(1)} ({product.rating?.totalReviews || 0})
          </span>
        </div>

        {/* Size Options */}
        {sizeOptions && sizeOptions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizeOptions.slice(0, 3).map((size, index) => {
              const sizeStock = getStockForSize(size);
              const isOutOfStock = sizeStock === 0;

              return (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-md font-medium ${
                    isOutOfStock ? 'text-gray-400 bg-gray-50' : 'text-gray-600 bg-gray-50'
                  }`}
                  title={`${size}: ${sizeStock} disponibles`}
                >
                  {size}
                </span>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</div>
          <button
            onClick={e => {
              e.stopPropagation();
              navigate(`/products/${product._id}`);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCompletelyOutOfStock(product)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isCompletelyOutOfStock(product)}
          >
            {isCompletelyOutOfStock(product) ? 'Indisponible' : 'Voir plus'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Main ProductsPage Component
const ProductsPage = () => {
  const { user: _user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Load products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.professionalId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'popular':
          return (b.rating?.totalReviews || 0) - (a.rating?.totalReviews || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, sortOption]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const API_URL =
        process.env.REACT_APP_API_URL || 'http://localhost:5000';

      try {
        // Try to fetch from API
        const response = await axios.get(`${API_URL}/api/products/approved`, {
          params: {
            limit: 50, // Get more products for better user experience
            page: 1,
          },
        });

        // Handle the new API response format
        if (response.data.success && response.data.data) {
          setProducts(response.data.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Use mock data if API is not available
        // console.log('Using mock data');
        setProducts(MOCK_PRODUCTS);
        toast('Utilisation de données de démonstration', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSortOption('newest');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec design premium */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 text-sm font-bold mb-4">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Boutique Premium
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-primary-800 to-gray-900 bg-clip-text text-transparent mb-6">
            Boutique Bien-être
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez une sélection de produits wellness soigneusement choisis par nos
            professionnels certifiés. Des compléments naturels aux accessoires de méditation,
            trouvez tout ce dont vous avez besoin pour votre bien-être.
          </p>
        </div>

        {/* Search and Filters avec glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Search avec design premium */}
              <div className="flex-1 max-w-lg">
                <label
                  htmlFor="search-input"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Rechercher vos produits
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary-400" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Rechercher des produits wellness..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all duration-300 text-lg placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Filters avec design amélioré */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Category Filter */}
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Catégorie
                  </label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all duration-300 text-lg font-medium bg-white min-w-[200px]"
                  >
                    {PRODUCT_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label
                    htmlFor="sort-filter"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Trier par
                  </label>
                  <select
                    id="sort-filter"
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                    className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all duration-300 text-lg font-medium bg-white min-w-[200px]"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Clear filters button */}
            {(searchTerm || categoryFilter || sortOption !== 'newest') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results count avec style premium */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-semibold">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé
            {filteredProducts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Products Grid avec design premium */}
        {filteredProducts.length > 0 ? (
          <div className="relative">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Background pattern */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-primary-100/30 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-tl from-amber-100/30 to-transparent rounded-full blur-3xl"></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-12 mx-auto max-w-md">
              <ShoppingBagIcon className="h-16 w-16 text-primary-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Essayez de modifier vos critères de recherche ou vos filtres pour découvrir nos
                produits wellness.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Voir tous les produits
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
