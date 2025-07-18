import {
  ShoppingBag,
  Star,
  ArrowLeft,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Tag,
  Package,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useFavorites } from '../contexts/FavoritesContext';

const ProfessionalProductsPage = () => {
  const { id } = useParams();
  const { toggleProductFavorite, isFavorite } = useFavorites();
  const [professional, setProfessional] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Définition de toutes les catégories disponibles
  const allCategories = {
    wellness: 'Bien-être',
    yoga: 'Yoga',
    meditation: 'Méditation',
    aromatherapy: 'Aromathérapie',
    nutrition: 'Nutrition',
    massage: 'Massage',
    naturopathy: 'Naturopathie',
    psychology: 'Psychologie',
    coaching: 'Coaching',
    fitness: 'Fitness',
    dance: 'Danse',
    pilates: 'Pilates',
    mindfulness: 'Pleine conscience',
    acupuncture: 'Acupuncture',
    homeopathy: 'Homéopathie',
    physiotherapy: 'Physiothérapie',
    osteopathy: 'Ostéopathie',
    art_therapy: 'Art-thérapie',
    music_therapy: 'Musicothérapie',
    hypnotherapy: 'Hypnothérapie',
    reflexology: 'Réflexologie',
    reiki: 'Reiki',
    ayurveda: 'Ayurveda',
    chinese_medicine: 'Médecine chinoise',
    herbal_medicine: 'Phytothérapie',
    sound_therapy: 'Sonothérapie',
    energy_healing: 'Soins énergétiques',
    other: 'Autre',
  };

  // Fetch professional and products data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch professional data
        const professionalResponse = await fetch(
          `https://holistic-maroc-backend.onrender.com/api/professionals/${id}`
        );
        const professionalData = await professionalResponse.json();

        if (!professionalData.success) {
          throw new Error(professionalData.message || 'Erreur lors du chargement du professionnel');
        }

        setProfessional(professionalData.professional);

        // Fetch products with filters
        const params = new URLSearchParams({
          page: '1',
          limit: '50', // Récupérer plus de produits pour le filtrage côté client
        });

        const productsResponse = await fetch(
          `https://holistic-maroc-backend.onrender.com/api/professionals/${id}/products?${params}`
        );
        const productsData = await productsResponse.json();

        if (!productsData.success) {
          throw new Error(productsData.message || 'Erreur lors du chargement des produits');
        }

        const fetchedProducts = productsData.products || [];
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Erreur lors du chargement des données');
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Apply filters when search term or category changes
  useEffect(() => {
    let results = [...products];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        product =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      results = results.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(results);
  }, [searchTerm, selectedCategory, products]);

  const formatPrice = product => {
    if (product.price === 0 || product.isFree) {
      return 'Gratuit';
    }
    return `${product.price || 'Prix non spécifié'} ${product.currency || 'MAD'}`;
  };

  const formatCategoryName = category => {
    return allCategories[category] || category;
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

  // Product Card Component
  const ProductCard = ({ product }) => {
    const isProductFavorite = isFavorite('products', product._id);

    const defaultImageUrl =
      'https://holistic-maroc-backend.onrender.com/uploads/products/1748711983894-578098072.jpg';
    let imageUrl = defaultImageUrl;

    // Utiliser les nouvelles données d'image de l'API
    if (product.images && product.images.length > 0) {
      if (product.images[0].url) {
        imageUrl = product.images[0].url;
      } else if (typeof product.images[0] === 'string') {
        const img = product.images[0];
        imageUrl = img.startsWith('http')
          ? img
          : `https://holistic-maroc-backend.onrender.com/uploads/products/${img}`;
      }
    }

    return (
      <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {product.isFeatured && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Populaire
          </div>
        )}

        {/* Badge pour rupture de stock partielle */}
        {hasOutOfStockSizes(product) && !isCompletelyOutOfStock(product) && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Stock limité
          </div>
        )}

        {/* Badge pour rupture totale */}
        {isCompletelyOutOfStock(product) && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Rupture de stock
          </div>
        )}

        {/* Bouton favoris */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleProductFavorite(product);
          }}
          className={`absolute ${
            product.isFeatured || hasOutOfStockSizes(product) || isCompletelyOutOfStock(product)
              ? 'top-16 right-4'
              : 'top-4 right-4'
          } z-10 p-2 rounded-full shadow-md transition-all duration-300 ${
            isProductFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart size={16} className={isProductFavorite ? 'fill-current' : ''} />
        </button>

        <Link to={`/products/${product._id}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={product.name || 'Product image'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultImageUrl;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <div className="flex items-center text-xs font-medium text-gray-700">
                <Tag className="w-3 h-3 mr-1" />
                {formatCategoryName(product.category || 'other')}
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Package className="w-4 h-4 mr-2 text-blue-500" />
                {product.sizeInventory && product.sizeInventory.length > 0 ? (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Stock par taille:</span>
                    <div className="flex flex-wrap gap-1">
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
                        <span className="text-xs text-gray-400">
                          +{product.sizeInventory.length - 3} autres
                        </span>
                      )}
                    </div>
                    {hasOutOfStockSizes(product) && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600">Certaines tailles en rupture</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span
                    className={`${
                      product.stock <= 5 && product.stock > 0
                        ? 'text-amber-600'
                        : product.stock <= 0
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {product.stock <= 0
                      ? 'Rupture de stock'
                      : `${product.stock || 'Stock non spécifié'} en stock`}
                  </span>
                )}
              </div>
              {product.rating && (
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                  <span>
                    {product.rating.average || 0} ({product.rating.totalReviews || 0} avis)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-lg font-bold text-gray-900">{formatPrice(product)}</div>
              <button
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
        </Link>
      </div>
    );
  };

  // List View Product Card Component
  const ProductListCard = ({ product }) => {
    const isProductFavorite = isFavorite('products', product._id);

    const defaultImageUrl =
      'https://holistic-maroc-backend.onrender.com/uploads/products/1748711983894-578098072.jpg';
    let imageUrl = defaultImageUrl;

    // Utiliser les nouvelles données d'image de l'API
    if (product.images && product.images.length > 0) {
      if (product.images[0].url) {
        imageUrl = product.images[0].url;
      } else if (typeof product.images[0] === 'string') {
        const img = product.images[0];
        imageUrl = img.startsWith('http')
          ? img
          : `https://holistic-maroc-backend.onrender.com/uploads/products/${img}`;
      }
    }

    return (
      <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <Link to={`/products/${product._id}`}>
          <div className="flex">
            {/* Image Section */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <img
                src={imageUrl}
                alt={product.name || 'Product image'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = defaultImageUrl;
                }}
              />
              {/* Badges */}
              {product.isFeatured && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </div>
              )}
              {hasOutOfStockSizes(product) && !isCompletelyOutOfStock(product) && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stock limité
                </div>
              )}
              {isCompletelyOutOfStock(product) && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Rupture de stock
                </div>
              )}

              {/* Bouton favoris */}
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleProductFavorite(product);
                }}
                className={`absolute ${
                  product.isFeatured ||
                  hasOutOfStockSizes(product) ||
                  isCompletelyOutOfStock(product)
                    ? 'top-16 right-4'
                    : 'top-4 right-4'
                } z-10 p-2 rounded-full shadow-md transition-all duration-300 ${
                  isProductFavorite
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart size={16} className={isProductFavorite ? 'fill-current' : ''} />
              </button>

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                <div className="flex items-center text-xs font-medium text-gray-700">
                  <Tag className="w-3 h-3 mr-1" />
                  {formatCategoryName(product.category || 'other')}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                  {product.description}
                </p>

                {/* Stock Information - Enhanced for Size Variants */}
                <div className="space-y-3 mb-4">
                  {product.sizeInventory && product.sizeInventory.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="font-medium">Stock par taille:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {product.sizeInventory.map((size, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                              size.stock <= 0
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : size.stock <= 5
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <span className="font-medium">{size.size}</span>
                            <span className="text-xs">
                              {size.stock <= 0 ? 'Rupture' : `${size.stock} unités`}
                            </span>
                          </div>
                        ))}
                      </div>
                      {hasOutOfStockSizes(product) && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Certaines tailles en rupture de stock</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="w-4 h-4 mr-2 text-blue-500" />
                      <span
                        className={`${
                          product.stock <= 5 && product.stock > 0
                            ? 'text-amber-600'
                            : product.stock <= 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {product.stock <= 0
                          ? 'Rupture de stock'
                          : `${product.stock || 'Stock non spécifié'} en stock`}
                      </span>
                    </div>
                  )}

                  {product.rating && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                      <span>
                        {product.rating.average || 0} ({product.rating.totalReviews || 0} avis)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-lg font-bold text-gray-900">{formatPrice(product)}</div>
                <button
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
          </div>
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Professionnel non trouvé</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/professionals/${id}`}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au profil
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Produits de {professional.businessName || professional.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Découvrez tous les produits proposés par ce professionnel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700"
                  >
                    <option value="">Toutes catégories</option>
                    {Object.entries(allCategories).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Filters Button */}
            {(searchTerm || selectedCategory) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600 mb-6">
              Ce professionnel n&apos;a pas encore de produits ou ils ne correspondent pas à vos
              critères de recherche
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Produits
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredProducts.length} produits)
                  </span>
                </h2>
                {/* Stock summary for size variants */}
                {filteredProducts.some(
                  product => product.sizeInventory && product.sizeInventory.length > 0
                ) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filteredProducts.filter(hasOutOfStockSizes).length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          {filteredProducts.filter(hasOutOfStockSizes).length} produits avec stock
                          limité
                        </span>
                      </div>
                    )}
                    {filteredProducts.filter(isCompletelyOutOfStock).length > 0 && (
                      <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          {filteredProducts.filter(isCompletelyOutOfStock).length} produits en
                          rupture
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`grid gap-6 ${
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}
            >
              {filteredProducts.map(product =>
                viewMode === 'grid' ? (
                  <ProductCard key={product._id} product={product} />
                ) : (
                  <ProductListCard key={product._id} product={product} />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalProductsPage;
