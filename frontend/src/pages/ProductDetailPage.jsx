import {
  ArrowLeftIcon,
  HeartIcon,
  ShoppingBagIcon,
  StarIcon,
  PlusIcon,
  MinusIcon,
  ShareIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleProductFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      // Reset quantity if it exceeds available stock
      if (product.stock && quantity > product.stock) {
        setQuantity(Math.min(quantity, product.stock));
      }
    }
  }, [product, quantity]);

  // Initialize first available size when product loads
  useEffect(() => {
    if (product?.sizeInventory && product.sizeInventory.length > 0 && !selectedSize) {
      // Find first size with stock > 0, or first size if all are out of stock
      const availableSize = product.sizeInventory.find(size => size.stock > 0);
      const sizeToSelect = availableSize || product.sizeInventory[0];
      setSelectedSize(sizeToSelect.size);
    }
  }, [product, selectedSize]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `https://holistic-maroc-backend.onrender.com/api/products/${id}`
      );

      // Handle both wrapped and direct response formats
      const productData = response.data.data || response.data;
      setProduct(productData);
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      if (error.response?.status === 404) {
        setError('Produit non trouvé');
      } else {
        setError('Erreur lors du chargement du produit');
        toast.error('Erreur lors du chargement du produit');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setReviewsLoading(true);

      const response = await axios.get(
        `https://holistic-maroc-backend.onrender.com/api/products/${product._id}/reviews`,
        {
          params: {
            page,
            limit: 5,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        }
      );

      const { reviews: newReviews, pagination, statistics } = response.data.data;

      if (page === 1) {
        setReviews(newReviews);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setReviewsStats(statistics);
      setHasMoreReviews(pagination.hasNextPage);
      setReviewsPage(page);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      // Don't show error toast for reviews as it's not critical
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadMoreReviews = () => {
    if (!reviewsLoading && hasMoreReviews) {
      fetchReviews(reviewsPage + 1);
    }
  };

  const handleDirectOrder = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour commander');
      navigate('/login');
      return;
    }

    // Check if size selection is required
    if (product?.sizeInventory && product.sizeInventory.length > 0 && !selectedSize) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    try {
      setIsOrdering(true);

      // Get the appropriate stock to check
      const stockToCheck = getStockForSize(product, selectedSize);

      // Check if the requested quantity exceeds available stock
      if (quantity > stockToCheck) {
        const sizeText = selectedSize ? ` pour la taille ${selectedSize}` : '';
        toast.error(`Stock insuffisant${sizeText}. Seulement ${stockToCheck} disponibles.`);
        return;
      }

      // Check if selected size is out of stock
      if (stockToCheck <= 0) {
        const sizeText = selectedSize ? ` pour la taille ${selectedSize}` : '';
        toast.error(`Produit en rupture de stock${sizeText}.`);
        return;
      }

      // Prepare order message with size information
      const sizeInfo = selectedSize ? `\n📏 *Taille:* ${selectedSize}` : '';
      const orderMessage = `✨ *NOUVELLE COMMANDE* ✨ 

📦 *Produit:* ${product.name || product.title}${sizeInfo}
💰 *Prix:* ${product.price?.toFixed(2)} ${product.currency || 'EUR'}
🔢 *Quantité:* ${quantity} 
💵 *Total:* ${(product.price * quantity).toFixed(2)} ${product.currency || 'EUR'}

Merci de confirmer cette commande. Je suis impatient(e) de recevoir ce produit!`;

      // Redirect to messages page with the professional
      const professionalId = product.professional?._id || product.professionalId?._id;

      if (professionalId) {
        // Redirect to messages page
        navigate(`/messages/${professionalId}`, {
          state: { initialMessage: orderMessage },
        });

        toast.success('Commande envoyée au professionnel !');
      } else {
        toast.error('Impossible de contacter le professionnel');
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error('Une erreur est survenue lors de la commande');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour gérer vos favoris');
      return;
    }

    toggleProductFavorite(product);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Lien copié dans le presse-papiers');
        } else {
          // Legacy fallback for older browsers or non-HTTPS contexts
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            toast.success('Lien copié dans le presse-papiers');
          } catch (err) {
            toast.error('Impossible de copier le lien. Veuillez le copier manuellement.');
            // Show the URL to the user so they can copy it manually
            prompt('Copiez ce lien:', window.location.href);
          }
          document.body.removeChild(textArea);
        }
      } catch (error) {
        toast.error('Impossible de copier le lien. Veuillez le copier manuellement.');
        // Show the URL to the user so they can copy it manually
        prompt('Copiez ce lien:', window.location.href);
      }
    }
  };

  /*
   * SIZE INVENTORY MANAGEMENT FEATURES:
   *
   * This component now properly handles products with size variants and individual stock levels:
   * - Products can have both general stock AND size-specific inventory (sizeInventory)
   * - Size selection interface for products with variants
   * - Stock validation per size option
   * - Dynamic pricing and availability based on selected size
   * - Helper functions calculate accurate stock totals and identify stock issues across size variants
   *
   * This fixes the issue where products with size options didn't properly show out-of-stock warnings.
   */

  // Helper function to get total stock for products with size variants
  const getTotalStock = product => {
    if (product?.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.reduce((total, size) => total + size.stock, 0);
    }
    return product?.stock || 0;
  };

  // Helper function to check if product has any sizes out of stock
  const hasOutOfStockSizes = product => {
    if (product?.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.some(size => size.stock <= 0);
    }
    return false;
  };

  // Helper function to check if product is completely out of stock
  const isCompletelyOutOfStock = product => {
    if (product?.sizeInventory && product.sizeInventory.length > 0) {
      return product.sizeInventory.every(size => size.stock <= 0);
    }
    return (product?.stock || 0) <= 0;
  };

  // Helper function to get available stock for a specific size
  const getStockForSize = (product, selectedSize) => {
    if (product?.sizeInventory && product.sizeInventory.length > 0 && selectedSize) {
      const sizeData = product.sizeInventory.find(size => size.size === selectedSize);
      return sizeData ? sizeData.stock : 0;
    }
    return product?.stock || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h2>
          <p className="text-gray-600 mb-6">
            Le produit que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Retour
          </button>

          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Accueil
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <Link to="/products" className="text-gray-500 hover:text-gray-700">
                  Produits
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
              </li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <motion.div
              className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.src = '/api/placeholder/400/400';
                }}
              />
            </motion.div>

            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.target.src = '/api/placeholder/80/80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(Number(product.rating?.average || product.rating || 0))
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({Number(product.rating?.average || product.rating || 0).toFixed(1)} sur 5
                    {product.rating?.totalReviews ? ` - ${product.rating.totalReviews} avis` : ''})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  {product.price?.toFixed(2)} MAD
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-500 line-through">
                    {product.originalPrice.toFixed(2)} MAD
                  </span>
                )}
              </div>

              {/* Professional Info */}
              {product.professional && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-1">Vendu par</p>
                  <Link
                    to={`/professionals/${product.professional._id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {product.professional.businessName || product.professional.name}
                  </Link>
                </div>
              )}

              {/* Description */}
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </div>
            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              {/* Size Selection for products with size variants */}
              {product.sizeInventory && product.sizeInventory.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Taille:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {product.sizeInventory.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSize(size.size);
                          // Reset quantity if it exceeds stock for this size
                          if (quantity > size.stock) {
                            setQuantity(Math.min(quantity, size.stock || 1));
                          }
                        }}
                        disabled={size.stock <= 0}
                        className={`relative p-3 border rounded-lg text-sm font-medium transition-all ${
                          selectedSize === size.size
                            ? size.stock > 0
                              ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                              : 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                            : size.stock > 0
                              ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium">{size.size}</div>
                          <div
                            className={`text-xs mt-1 ${
                              size.stock <= 0
                                ? 'text-red-500'
                                : size.stock <= 5
                                  ? 'text-amber-500'
                                  : 'text-green-500'
                            }`}
                          >
                            {size.stock <= 0 ? 'Rupture' : `${size.stock} dispo`}
                          </div>
                        </div>
                        {size.stock <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-red-400 transform rotate-45"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Size-specific stock warning */}
                  {hasOutOfStockSizes(product) && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-amber-800">Stock limité :</span>
                        <span className="text-amber-700 ml-1">
                          Certaines tailles sont en rupture de stock
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Information - Enhanced for size variants */}
              <div className="space-y-2">
                {product.sizeInventory && product.sizeInventory.length > 0 ? (
                  selectedSize ? (
                    <div className="flex items-center space-x-2 text-sm">
                      {getStockForSize(product, selectedSize) > 0 ? (
                        <span
                          className={`flex items-center gap-1 ${
                            getStockForSize(product, selectedSize) <= 5
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }`}
                        >
                          ✓ {getStockForSize(product, selectedSize)} en stock pour la taille{' '}
                          {selectedSize}
                          {getStockForSize(product, selectedSize) <= 5 && (
                            <span className="text-amber-600">(Stock faible)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Rupture de stock pour la taille {selectedSize}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Sélectionnez une taille pour voir la disponibilité
                    </div>
                  )
                ) : (
                  product.stock !== undefined && (
                    <div className="flex items-center space-x-2 text-sm">
                      {product.stock > 0 ? (
                        <span
                          className={`${product.stock <= 5 ? 'text-amber-600' : 'text-green-600'}`}
                        >
                          ✓ {product.stock} en stock
                          {product.stock <= 5 && <span className="ml-1">(Stock faible)</span>}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Rupture de stock
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center space-x-4">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Quantité:
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={e => {
                      const value = parseInt(e.target.value) || 1;
                      const maxStock = getStockForSize(product, selectedSize);
                      const maxValue = maxStock || 999;
                      setQuantity(Math.min(Math.max(1, value), maxValue));
                    }}
                    className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center focus:outline-none"
                    min="1"
                    max={getStockForSize(product, selectedSize) || 999}
                  />
                  <button
                    onClick={() => {
                      const maxStock = getStockForSize(product, selectedSize);
                      const maxValue = maxStock || 999;
                      setQuantity(Math.min(maxValue, quantity + 1));
                    }}
                    className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= (getStockForSize(product, selectedSize) || 999)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                {(() => {
                  const currentStock = getStockForSize(product, selectedSize);
                  return currentStock && quantity >= currentStock ? (
                    <span className="text-sm text-orange-600">Maximum disponible</span>
                  ) : null;
                })()}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDirectOrder}
                  disabled={
                    isOrdering ||
                    isCompletelyOutOfStock(product) ||
                    (product?.sizeInventory &&
                      product.sizeInventory.length > 0 &&
                      (!selectedSize || getStockForSize(product, selectedSize) <= 0))
                  }
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isOrdering ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <>
                      <ShoppingBagIcon className="h-5 w-5" />
                      <span>
                        {isCompletelyOutOfStock(product)
                          ? 'Rupture de stock'
                          : product?.sizeInventory &&
                              product.sizeInventory.length > 0 &&
                              !selectedSize
                            ? 'Sélectionnez une taille'
                            : product?.sizeInventory &&
                                product.sizeInventory.length > 0 &&
                                getStockForSize(product, selectedSize) <= 0
                              ? `Taille ${selectedSize} indisponible`
                              : 'Commander maintenant'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isFavorite('products', product._id) ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShareIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>
            {/* Category & Tags */}
            {(product.category || (product.tags && product.tags.length > 0)) && (
              <div className="pt-6 border-t border-gray-200">
                {product.category && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 mr-2">Catégorie:</span>
                    <span className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mr-2">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Size Inventory Summary */}
            {product.sizeInventory && product.sizeInventory.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold mb-3">Disponibilité par taille</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {product.sizeInventory.map((size, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-center ${
                          size.stock <= 0
                            ? 'bg-red-50 border-red-200'
                            : size.stock <= 5
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{size.size}</div>
                        <div
                          className={`text-sm mt-1 ${
                            size.stock <= 0
                              ? 'text-red-600'
                              : size.stock <= 5
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {size.stock <= 0 ? 'Rupture' : `${size.stock} disponibles`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stock summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock total:</span>
                      <span
                        className={`font-medium ${
                          getTotalStock(product) <= 0
                            ? 'text-red-600'
                            : getTotalStock(product) <= 10
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {getTotalStock(product)} unités
                      </span>
                    </div>
                    {hasOutOfStockSizes(product) && (
                      <div className="flex items-center gap-1 mt-2 text-amber-600">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {product.sizeInventory.filter(size => size.stock <= 0).length} taille(s)
                          en rupture
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold mb-3">Spécifications</h4>
                <div className="space-y-2">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{spec.name}:</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Avis clients</h2>
            {reviewsStats && reviewsStats.totalReviews > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(reviewsStats.averageRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium text-gray-900">
                    {reviewsStats.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600">({reviewsStats.totalReviews} avis)</span>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          {reviewsStats && reviewsStats.totalReviews > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold mb-4">Répartition des notes</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = reviewsStats.ratingDistribution[rating] || 0;
                  const percentage =
                    reviewsStats.totalReviews > 0 ? (count / reviewsStats.totalReviews) * 100 : 0;

                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-2">{rating}</span>
                      <StarIconSolid className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviewsLoading && reviews.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : reviews.length > 0 ? (
              <>
                {reviews.map(review => (
                  <motion.div
                    key={review._id}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {review.client.profileImage ? (
                            <img
                              src={review.client.profileImage}
                              alt={review.client.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-600 font-medium">
                              {review.client.firstName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.client.displayName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {/* Review Tags */}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex space-x-2 mb-4">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Avis ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    {/* Professional Response */}
                    {review.professionalResponse && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Réponse du professionnel
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.respondedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{review.professionalResponse}</p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Load More Button */}
                {hasMoreReviews && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreReviews}
                      disabled={reviewsLoading}
                      className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewsLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-600"></div>
                          <span>Chargement...</span>
                        </div>
                      ) : (
                        "Voir plus d'avis"
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <StarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun avis pour le moment
                    </h3>
                    <p className="text-gray-500">
                      Soyez le premier à laisser un avis sur ce produit !
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
