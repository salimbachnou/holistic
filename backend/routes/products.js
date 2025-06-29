const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticated, isProfessional } = require('../middleware/auth');

// Import models
const Product = mongoose.model('Product');
const Professional = mongoose.model('Professional');

// @route   GET /api/products/check-stock
// @desc    Vérifier le stock disponible pour un produit et une taille
// @access  Private
router.get('/check-stock', isAuthenticated, async (req, res) => {
  try {
    const { productName, size } = req.query;
    
    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Nom du produit requis'
      });
    }
    
    console.log("Vérification du stock pour:", { productName, size });
    
    // Échapper les caractères spéciaux pour l'expression régulière
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const safeProductName = escapeRegExp(productName);
    
    // Rechercher le produit par nom (correspondance exacte d'abord, puis partielle)
    const productRegex = new RegExp(`^${safeProductName}$`, 'i'); // Correspondance exacte (insensible à la casse)
    let products = await Product.find({
      $or: [
        { title: { $regex: productRegex } },
        { name: { $regex: productRegex } }
      ]
    });
    
    // Si aucun produit trouvé avec correspondance exacte, essayer une correspondance partielle
    if (products.length === 0) {
      const partialRegex = new RegExp(safeProductName, 'i');
      products = await Product.find({
        $or: [
          { title: { $regex: partialRegex } },
          { name: { $regex: partialRegex } }
        ]
      });
    }
    
    const productsInfo = products.map(p => ({ 
      id: p._id, 
      title: p.title, 
      name: p.name,
      sizes: p.sizeInventory?.map(s => s.size) || []
    }));
    
    console.log("Produits trouvés:", productsInfo);
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé',
        available: false
      });
    }
    
    // Si plusieurs produits correspondent, essayer de trouver celui qui correspond le mieux
    let product = products[0]; // Par défaut, prendre le premier
    
    // Si le nom est exactement le même (insensible à la casse), privilégier ce produit
    const exactMatch = products.find(p => 
      p.title.toLowerCase() === productName.toLowerCase() || 
      p.name.toLowerCase() === productName.toLowerCase()
    );
    
    if (exactMatch) {
      product = exactMatch;
      console.log("Correspondance exacte trouvée:", { id: product._id, title: product.title, name: product.name });
    }
    
    // Indiquer s'il y a plusieurs produits correspondants
    const multipleProducts = products.length > 1;
    
    // Vérifier le stock pour la taille spécifiée
    if (size && product.sizeInventory && product.sizeInventory.length > 0) {
      // Recherche insensible à la casse
      const sizeEntry = product.sizeInventory.find(item => 
        item.size.toLowerCase() === size.toLowerCase()
      );
      
      console.log("Recherche de taille:", {
        productId: product._id,
        productTitle: product.title,
        requestedSize: size.toLowerCase(),
        availableSizes: product.sizeInventory.map(s => s.size.toLowerCase()),
        availableSizesOriginal: product.sizeInventory.map(s => s.size),
        sizeFound: !!sizeEntry,
        sizeEntry: sizeEntry
      });
      
      if (!sizeEntry) {
        return res.json({
          success: true,
          message: 'Taille non disponible',
          available: false,
          multipleProducts,
          products: multipleProducts ? productsInfo : undefined,
          product: {
            id: product._id,
            title: product.title,
            name: product.name,
            availableSizes: product.sizeInventory.map(s => s.size)
          }
        });
      }
      
      return res.json({
        success: true,
        available: true,
        stock: sizeEntry.stock,
        size: sizeEntry.size,
        multipleProducts,
        products: multipleProducts ? productsInfo : undefined,
        product: {
          id: product._id,
          title: product.title,
          name: product.name,
          totalStock: product.stock
        }
      });
    } else {
      // Retourner le stock global si pas de taille spécifiée ou pas d'inventaire par taille
      return res.json({
        success: true,
        available: true,
        stock: product.stock,
        multipleProducts,
        products: multipleProducts ? productsInfo : undefined,
        product: {
          id: product._id,
          title: product.title,
          name: product.name
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du stock'
    });
  }
});

// @route   GET /api/products/approved
// @desc    Get all approved products for public viewing
// @access  Public
router.get('/approved', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      featured
    } = req.query;

    // Build query for approved and active products
    const query = {
      status: 'approved',
      isActive: true,
      stock: { $gt: 0 } // Only show products in stock
    };

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Add featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Build sort object
    const sort = {};
    if (search) {
      sort.score = { $meta: 'textScore' };
    }
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('professionalId', 'businessName location profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Transform products for frontend compatibility
    const transformedProducts = products.map(product => ({
      _id: product._id,
      id: product._id, // Add id field for compatibility
      name: product.name || product.title,
      title: product.title || product.name,
      description: product.description,
      price: product.price,
      currency: product.currency || 'MAD',
      category: product.category,
      images: product.images || [],
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      stock: product.stock,
      rating: product.rating,
      tags: product.tags || [],
      featured: product.featured || false,
      sizeOptions: product.sizeOptions || [],
      sizeInventory: product.sizeInventory || [],
      professional: product.professionalId ? {
        _id: product.professionalId._id,
        businessName: product.professionalId.businessName,
        location: product.professionalId.location,
        profileImage: product.professionalId.profileImage
      } : null,
      professionalId: product.professionalId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    res.json({
      success: true,
      data: transformedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching approved products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }

    const product = await Product.findOne({
      _id: id,
      status: 'approved',
      isActive: true
    })
    .populate('professionalId', 'businessName location profileImage contactInfo')
    .populate('reviews')
    .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Transform product for frontend compatibility
    const transformedProduct = {
      _id: product._id,
      id: product._id,
      name: product.name || product.title,
      title: product.title || product.name,
      description: product.description,
      price: product.price,
      currency: product.currency || 'MAD',
      category: product.category,
      images: product.images || [],
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      stock: product.stock,
      rating: product.rating,
      tags: product.tags || [],
      featured: product.featured || false,
      composition: product.composition,
      sizeOptions: product.sizeOptions || [],
      sizeInventory: product.sizeInventory || [],
      specifications: product.specifications || [],
      shippingInfo: product.shippingInfo,
      professional: product.professionalId ? {
        _id: product.professionalId._id,
        businessName: product.professionalId.businessName,
        location: product.professionalId.location,
        profileImage: product.professionalId.profileImage,
        contactInfo: product.professionalId.contactInfo
      } : null,
      reviews: product.reviews || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    res.json({
      success: true,
      data: transformedProduct
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get list of available categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', {
      status: 'approved',
      isActive: true
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
