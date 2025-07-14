import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState({
    sessions: [],
    products: [],
    professionals: [],
    events: [],
  });
  const [loading, setLoading] = useState(false);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavoritesFromStorage();
    } else {
      // Clear favorites when user logs out
      setFavorites({
        sessions: [],
        products: [],
        professionals: [],
        events: [],
      });
    }
  }, [isAuthenticated, user]);

  // Load favorites from localStorage
  const loadFavoritesFromStorage = useCallback(() => {
    try {
      const savedFavorites = localStorage.getItem(`favorites_${user?.id || 'anonymous'}`);
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  }, [user]);

  // Save favorites to localStorage
  const saveFavoritesToStorage = useCallback(
    newFavorites => {
      try {
        localStorage.setItem(`favorites_${user?.id || 'anonymous'}`, JSON.stringify(newFavorites));
      } catch (error) {
        console.error('Error saving favorites to storage:', error);
      }
    },
    [user]
  );

  // Generic function to add/remove favorites
  const toggleFavorite = useCallback(
    (type, item) => {
      if (!isAuthenticated) {
        toast.error('Veuillez vous connecter pour ajouter des favoris');
        return;
      }

      setFavorites(prev => {
        const currentFavorites = prev[type] || [];
        const existingIndex = currentFavorites.findIndex(fav => fav.id === item.id);

        let newFavorites;
        let message;

        if (existingIndex >= 0) {
          // Remove from favorites
          newFavorites = {
            ...prev,
            [type]: currentFavorites.filter(fav => fav.id !== item.id),
          };
          message = `${getTypeLabel(type)} retiré des favoris`;
        } else {
          // Add to favorites
          const favoriteItem = {
            id: item.id,
            title: item.title,
            ...item,
          };
          newFavorites = {
            ...prev,
            [type]: [...currentFavorites, favoriteItem],
          };
          message = `${getTypeLabel(type)} ajouté aux favoris`;
        }

        saveFavoritesToStorage(newFavorites);
        toast.success(message);
        return newFavorites;
      });
    },
    [isAuthenticated, saveFavoritesToStorage]
  );

  // Check if an item is in favorites
  const isFavorite = useCallback(
    (type, itemId) => {
      const currentFavorites = favorites[type] || [];
      return currentFavorites.some(fav => fav.id === itemId);
    },
    [favorites]
  );

  // Get favorites count for a specific type
  const getFavoritesCount = useCallback(
    type => {
      return favorites[type]?.length || 0;
    },
    [favorites]
  );

  // Get all favorites count
  const getTotalFavoritesCount = useCallback(() => {
    return Object.values(favorites).reduce((total, favArray) => total + favArray.length, 0);
  }, [favorites]);

  // Remove all favorites of a specific type
  const clearFavoritesByType = useCallback(
    type => {
      if (!isAuthenticated) return;

      setFavorites(prev => {
        const newFavorites = {
          ...prev,
          [type]: [],
        };
        saveFavoritesToStorage(newFavorites);
        toast.success(`Tous les favoris ${getTypeLabel(type)} supprimés`);
        return newFavorites;
      });
    },
    [isAuthenticated, saveFavoritesToStorage]
  );

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    if (!isAuthenticated) return;

    const emptyFavorites = {
      sessions: [],
      products: [],
      professionals: [],
      events: [],
    };

    setFavorites(emptyFavorites);
    saveFavoritesToStorage(emptyFavorites);
    toast.success('Tous les favoris supprimés');
  }, [isAuthenticated, saveFavoritesToStorage]);

  // Helper function to get type label
  const getTypeLabel = type => {
    const labels = {
      sessions: 'Session',
      products: 'Produit',
      professionals: 'Professionnel',
      events: 'Événement',
    };
    return labels[type] || type;
  };

  // Specific functions for each type
  const toggleSessionFavorite = useCallback(
    session => {
      toggleFavorite('sessions', {
        id: session._id,
        title: session.title,
        description: session.description,
        price: session.price,
        professionalId: session.professionalId,
        startTime: session.startTime,
        duration: session.duration,
        category: session.category,
        location: session.location,
        maxParticipants: session.maxParticipants,
        participants: session.participants,
      });
    },
    [toggleFavorite]
  );

  const toggleProductFavorite = useCallback(
    product => {
      toggleFavorite('products', {
        id: product._id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        images: product.images,
        category: product.category,
        rating: product.rating,
        stock: product.stock,
        professionalId: product.professionalId,
      });
    },
    [toggleFavorite]
  );

  const toggleProfessionalFavorite = useCallback(
    professional => {
      toggleFavorite('professionals', {
        id: professional._id,
        title: professional.businessName,
        businessName: professional.businessName,
        businessType: professional.businessType,
        description: professional.description,
        profilePhoto: professional.profilePhoto,
        coverImages: professional.coverImages,
        userId: professional.userId,
        rating: professional.rating,
        businessAddress: professional.businessAddress,
        activities: professional.activities,
        address: professional.address,
      });
    },
    [toggleFavorite]
  );

  const toggleEventFavorite = useCallback(
    event => {
      toggleFavorite('events', {
        id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        type: event.type,
        pricing: event.pricing,
        price: event.price,
        currency: event.currency,
        images: event.images,
        professional: event.professional,
        capacity: event.capacity,
        maxParticipants: event.maxParticipants,
        participants: event.participants,
      });
    },
    [toggleFavorite]
  );

  const value = {
    favorites,
    loading,
    toggleFavorite,
    toggleSessionFavorite,
    toggleProductFavorite,
    toggleProfessionalFavorite,
    toggleEventFavorite,
    isFavorite,
    getFavoritesCount,
    getTotalFavoritesCount,
    clearFavoritesByType,
    clearAllFavorites,
    isAuthenticated,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
