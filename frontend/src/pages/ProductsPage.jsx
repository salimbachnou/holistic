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
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

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

// Product Card Component
const ProductCard = ({ product, onViewProduct, favorites, onToggleFavorite }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isFavorite = favorites.includes(product._id);
  const [ordering, setOrdering] = useState(false);

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

  // Get default size for adding to cart
  const getDefaultSize = () => {
    if (!sizeOptions || sizeOptions.length === 0) return null;

    // Si nous avons un inventaire de tailles, choisir la première taille qui a du stock
    if (product.sizeInventory && product.sizeInventory.length > 0) {
      // Utiliser les tailles exactes de sizeOptions qui correspondent à sizeInventory
      for (const size of sizeOptions) {
        const sizeInfo = product.sizeInventory.find(item => item.size === size);
        if (sizeInfo && sizeInfo.stock > 0) return size;
      }
    }

    // Sinon retourner la première taille
    return sizeOptions[0];
  };

  const handleOrder = e => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour commander');
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    // Ouvrir le modal de détail du produit
    onViewProduct(product);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              Recommandé
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite(product._id);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-600'
            }`}
          >
            {isFavorite ? (
              <HeartIconSolid className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-primary-600 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Stock Warning */}
        {product.sizeInventory
          ? product.sizeInventory.some(item => item.stock > 0 && item.stock <= 5) && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  Stock limité
                </span>
              </div>
            )
          : product.stock <= 5 &&
            product.stock > 0 && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  Plus que {product.stock} en stock
                </span>
              </div>
            )}

        {/* Out of Stock */}
        {(product.sizeInventory
          ? !product.sizeInventory.some(item => item.stock > 0)
          : product.stock === 0) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-full">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <div className="mb-2">
          <span className="text-xs text-primary-600 font-medium uppercase tracking-wide">
            {PRODUCT_CATEGORIES.find(cat => cat.value === product.category)?.label ||
              product.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.title}
        </h3>

        {/* Professional */}
        <p className="text-sm text-gray-600 mb-3">
          Par {product.professionalId?.businessName || product.name || 'Professionnel'}
        </p>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <StarIconSolid
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating?.average || 0) ? 'text-yellow-400' : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.totalReviews || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <span className="text-2xl font-bold text-gray-900">
              {product.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-gray-600">{product.currency || 'MAD'}</span>
          </div>
        </div>

        {/* Size Options */}
        {sizeOptions && sizeOptions.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-gray-600 mb-1 block">Tailles:</span>
            <div className="flex flex-wrap gap-1">
              {sizeOptions.map((size, index) => {
                const sizeStock = getStockForSize(size);
                const isOutOfStock = sizeStock === 0;

                return (
                  <span
                    key={index}
                    className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
                      isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700'
                    }`}
                    title={`${size}: ${sizeStock} disponibles`}
                  >
                    {size}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewProduct(product)}
            className="py-2 px-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <span className="flex items-center justify-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>Détails</span>
            </span>
          </button>

          <button
            onClick={handleOrder}
            disabled={
              (product.sizeInventory
                ? !product.sizeInventory.some(item => item.stock > 0)
                : product.stock === 0) || ordering
            }
            className={`py-2 px-3 rounded-lg font-medium transition-colors ${
              (
                product.sizeInventory
                  ? !product.sizeInventory.some(item => item.stock > 0)
                  : product.stock === 0
              )
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
            }`}
          >
            {ordering ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-4 w-4 mr-1 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                <span>Commander</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Product Detail Modal Component
const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [defaultSizes, setDefaultSizes] = useState([]);
  const [sizeError, setSizeError] = useState(false);

  // Fonction pour obtenir les tailles exactes de la base de données
  const getExactSizesFromDB = useCallback(product => {
    if (
      product &&
      product.sizeOptions &&
      Array.isArray(product.sizeOptions) &&
      product.sizeOptions.length > 0
    ) {
      return [...product.sizeOptions]; // Retourne une copie pour éviter les mutations
    }

    // Si pas de tailles dans la base de données, créer des tailles par défaut
    let defaultSizes = [];
    if (product) {
      if (product.category === 'supplements') {
        defaultSizes = ['30 gélules', '60 gélules', '120 gélules'];
      } else if (product.category === 'aromatherapy') {
        defaultSizes = ['10ml', '30ml', '50ml'];
      } else if (product.category === 'equipment') {
        defaultSizes = ['S', 'M', 'L', 'XL'];
      } else {
        defaultSizes = ['Taille unique'];
      }
    }
    console.log('Using default sizes:', defaultSizes);
    return defaultSizes;
  }, []);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      // Obtenir les tailles exactes de la base de données
      const sizes = getExactSizesFromDB(product);
      if (!product.sizeOptions || product.sizeOptions.length === 0) {
        setDefaultSizes(sizes);
      }

      setSelectedSize(sizes.length > 0 ? sizes[0] : null);
      setQuantity(1);
      setSizeError(false); // Réinitialiser l'erreur de taille
    }
  }, [product, getExactSizesFromDB]);

  if (!product) return null;

  // Use either product's size options or default sizes
  const sizeOptions =
    product.sizeOptions && Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0
      ? [...product.sizeOptions]
      : defaultSizes;

  // Get stock for selected size
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

  // Get current stock based on selected size
  const currentStock = getStockForSize(selectedSize);

  // Fonction pour envoyer une commande directe au professionnel
  const handleDirectOrder = async () => {
    // Vérifier si une taille est sélectionnée lorsque des tailles sont disponibles
    if (sizeOptions && sizeOptions.length > 0 && !selectedSize) {
      setSizeError(true);
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour commander');
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    setSizeError(false);
    setIsOrdering(true);

    try {
      // Vérifier le stock disponible pour cette taille
      const stockForSize = getStockForSize(selectedSize);

      // Vérifier si la quantité demandée dépasse le stock disponible
      if (quantity > stockForSize) {
        toast.error(`Stock insuffisant. Seulement ${stockForSize} disponibles.`);
        setIsOrdering(false);
        return;
      }

      // Préparer le message de commande
      const orderMessage = `✨ *NOUVELLE COMMANDE * ✨ 
      
📦 * Produit: * ${product.title} 
💰 * Prix: * ${product.price} ${product.currency || 'MAD'}
📏 * Taille: * ${selectedSize || 'Standard'}
🔢 * Quantité: * ${quantity} 
💵 * Total: * ${(product.price * quantity).toFixed(2)} ${product.currency || 'MAD'}

Merci de confirmer cette commande. Je suis impatient(e) de recevoir ce produit!`;

      // Rediriger vers la page de messages avec le professionnel
      const professionalId = product.professionalId._id;

      // Rediriger vers la page de messages
      navigate(`/messages/${professionalId}`, { state: { initialMessage: orderMessage } });

      // Fermer le modal
      onClose();
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error('Une erreur est survenue lors de la commande');
    } finally {
      setIsOrdering(false);
    }
  };

  const incrementQuantity = () => {
    // Vérifier si l'augmentation de la quantité dépasserait le stock disponible
    if (quantity < currentStock) {
      setQuantity(prev => prev + 1);
    } else {
      toast.error(`Stock insuffisant. Seulement ${currentStock} disponibles au total.`);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={onClose}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative z-50"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h3>
                  <p className="text-primary-600">
                    Par {product.professionalId?.businessName || product.name || 'Professionnel'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Additional Images */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {product.images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden"
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${product.title} - image ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Price and Rating */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {product.price?.toFixed(2) || '0.00'} {product.currency || 'MAD'}
                      </span>
                      {product.featured && (
                        <span className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                          Recommandé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.rating?.average || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">
                        {product.rating?.average?.toFixed(1) || '0.0'} (
                        {product.rating?.totalReviews || 0} avis)
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>

                  {/* Composition */}
                  {product.composition && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Composition</h4>
                      <p className="text-gray-600 leading-relaxed">{product.composition}</p>
                    </div>
                  )}

                  {/* Size Options */}
                  {sizeOptions && sizeOptions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tailles disponibles</h4>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((size, index) => {
                          const sizeStock = getStockForSize(size);
                          const isOutOfStock = sizeStock === 0;

                          return (
                            <button
                              key={index}
                              disabled={isOutOfStock}
                              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium ${
                                isOutOfStock
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : selectedSize === size
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              onClick={() => {
                                setSelectedSize(size);
                                setSizeError(false);
                              }}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Taille sélectionnée: <span className="font-medium">{selectedSize}</span>
                        {product.sizeInventory && (
                          <span className="ml-2">
                            ({getStockForSize(selectedSize)} disponibles)
                          </span>
                        )}
                      </p>
                      {sizeError && (
                        <p className="text-sm text-red-500 mt-1">
                          Veuillez sélectionner une taille avant d'ajouter au panier
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Quantité</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className={`p-2 rounded-md ${
                          quantity <= 1
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= currentStock}
                        className={`p-2 rounded-md ${
                          quantity >= currentStock
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-500">{currentStock} disponibles</span>
                    </div>
                  </div>

                  {/* Specifications */}
                  {product.specifications && product.specifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Spécifications</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        {product.specifications.map((spec, index) => (
                          <li key={index}>{spec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">Disponibilité:</span>
                      {currentStock > (product.lowStockThreshold || 5) ? (
                        <span className="text-green-600 font-medium">
                          En stock ({currentStock} disponibles)
                        </span>
                      ) : currentStock > 0 ? (
                        <span className="text-orange-600 font-medium">
                          Stock limité ({currentStock} restants)
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Rupture de stock</span>
                      )}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {product.shippingInfo && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Livraison</h4>
                      <p className="text-gray-600">
                        {product.shippingInfo.freeShipping
                          ? 'Livraison gratuite'
                          : product.shippingInfo.shippingCost > 0
                            ? `Frais de livraison: ${product.shippingInfo.shippingCost} ${product.currency || 'MAD'}`
                            : 'Frais de livraison à déterminer'}
                      </p>
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Catégorie</h4>
                    <p className="text-gray-600">
                      {PRODUCT_CATEGORIES.find(cat => cat.value === product.category)?.label ||
                        product.category}
                    </p>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleDirectOrder}
                      disabled={currentStock === 0 || isOrdering}
                      className={`w-full py-3 px-6 rounded-lg font-medium text-lg transition-colors ${
                        currentStock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
                      }`}
                    >
                      {isOrdering ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Traitement...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                          Commander
                        </span>
                      )}
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full py-2 px-6 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [favorites, setFavorites] = useState([]);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Load products
  useEffect(() => {
    fetchProducts();
    loadFavorites();
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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        console.log('Using mock data');
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

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('productFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = updatedFavorites => {
    try {
      localStorage.setItem('productFavorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const handleViewProduct = product => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleToggleFavorite = productId => {
    const updatedFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];

    saveFavorites(updatedFavorites);
    toast.success(
      favorites.includes(productId) ? 'Produit retiré des favoris' : 'Produit ajouté aux favoris'
    );
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Boutique Bien-être</h1>
          <p className="text-gray-600 max-w-2xl">
            Découvrez une sélection de produits wellness soigneusement choisis par nos
            professionnels certifiés. Des compléments naturels aux accessoires de méditation,
            trouvez tout ce dont vous avez besoin pour votre bien-être.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {PRODUCT_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(searchTerm || categoryFilter || sortOption !== 'newest') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé
            {filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onViewProduct={handleViewProduct}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche ou vos filtres.
            </p>
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir tous les produits
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductDetail}
        onClose={() => {
          setShowProductDetail(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ProductsPage;
