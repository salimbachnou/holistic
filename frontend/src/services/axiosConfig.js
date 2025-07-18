import axios from 'axios';

// Create a custom axios instance with default configuration
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? '/api' // In production, use relative path
      : 'https://holistic-maroc-backend.onrender.com/api', // In development, use absolute URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour les cookies de session et CORS
});

// Add request interceptor for authentication
api.interceptors.request.use(
  config => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.response?.data);

    // Handle specific error cases here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Vous pouvez ajouter une redirection vers la page de connexion ici
      // window.location.href = '/login';
    }

    // Vous pouvez ajouter d'autres gestionnaires d'erreurs HTTP ici
    if (error.response?.status === 404) {
      console.log('Ressource introuvable');
    }

    if (error.response?.status === 500) {
      console.log('Erreur serveur interne');
    }

    return Promise.reject(error);
  }
);

// Fonction d'aide pour simplifier les appels API
export const apiService = {
  // Generic HTTP methods
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config);
      return response;
    } catch (error) {
      console.error(`Error making GET request to ${url}:`, error);
      throw error;
    }
  },

  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      console.error(`Error making POST request to ${url}:`, error);
      throw error;
    }
  },

  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      console.error(`Error making PUT request to ${url}:`, error);
      throw error;
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      console.error(`Error making DELETE request to ${url}:`, error);
      throw error;
    }
  },

  // Récupérer tous les professionnels avec filtres optionnels
  async getProfessionals(params = {}) {
    try {
      const response = await api.get('/professionals', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }
  },

  // Récupérer un professionnel par ID
  async getProfessionalById(id) {
    try {
      const response = await api.get(`/professionals/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching professional with ID ${id}:`, error);
      throw error;
    }
  },

  // Récupérer le profil du professionnel connecté
  async getMyProfessionalProfile() {
    try {
      const response = await api.get('/professionals/me/profile');

      // Vérifier si les données existent dans la réponse
      if (response.data && response.data.professional) {
        // Vérifier les champs manquants et les compléter au besoin
        const professional = response.data.professional;

        // Initialiser des champs qui pourraient être absents
        if (!professional.businessAddress) {
          professional.businessAddress = { country: 'Morocco' };
        } else if (!professional.businessAddress.country) {
          professional.businessAddress.country = 'Morocco';
        }

        // Ajouter structure complète pour contactInfo si absente
        if (!professional.contactInfo) {
          professional.contactInfo = { phone: '' };
        }

        // Ajouter champ pour les statistiques s'il n'existe pas
        if (!professional.stats) {
          professional.stats = {
            totalSessions: professional.sessions ? professional.sessions.length : 0,
            totalClients: 0,
            productsCount: professional.products ? professional.products.length : 0,
            upcomingSessions: 0,
          };
        }

        // Initialiser les tableaux vides si nécessaire
        if (!professional.coverImages) professional.coverImages = [];
        if (!professional.activities) professional.activities = [];
        if (!professional.services) professional.services = [];
        if (!professional.businessHours) professional.businessHours = [];
        if (!professional.certifications) professional.certifications = [];

        // S'assurer que les champs requis par l'interface existent
        if (!professional.title) professional.title = professional.businessName || '';
        if (!professional.description) professional.description = '';
        if (!professional.address) professional.address = 'À définir';

        // Vérifier si rating existe
        if (!professional.rating) {
          professional.rating = { average: 0, totalReviews: 0 };
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching professional profile:', error);
      throw error;
    }
  },

  // Mettre à jour le profil du professionnel
  async updateProfessionalProfile(data) {
    try {
      // Préparer les données à envoyer au backend en conservant uniquement
      // les champs compatibles avec le modèle MongoDB
      const updateData = {
        title: data.title,
        description: data.description,
        address: data.address,
        businessName: data.businessName,
        businessType: data.businessType,
        businessAddress: data.businessAddress || { country: 'Morocco' },
        contactInfo: data.contactInfo || { phone: data.phone || '' },
        activities: data.activities || [],
        services: data.services || [],
      };

      const response = await api.put('/professionals/profile', updateData);

      // Si la mise à jour est réussie, mais que certains champs manquent dans la réponse,
      // les compléter à partir des données d'entrée
      if (response.data && response.data.professional) {
        const updatedProfessional = response.data.professional;

        // Ajouter les champs pour l'interface si absents dans la réponse
        if (!updatedProfessional.stats) {
          updatedProfessional.stats = {
            totalSessions: updatedProfessional.sessions ? updatedProfessional.sessions.length : 0,
            totalClients: 0,
            productsCount: updatedProfessional.products ? updatedProfessional.products.length : 0,
            upcomingSessions: 0,
          };
        }

        // Assurer que tous les champs visuels existent
        if (!updatedProfessional.businessHours) updatedProfessional.businessHours = [];
        if (!updatedProfessional.certifications) updatedProfessional.certifications = [];
      }

      return response.data;
    } catch (error) {
      console.error('Error updating professional profile:', error);
      throw error;
    }
  },

  // Uploader une photo de profil
  async uploadProfilePhoto(formData) {
    try {
      const response = await api.post('/professionals/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // If the response includes the updated professional data, return it
      if (response.data.professional) {
        // Ensure the professional object has all required fields
        if (!response.data.professional.stats) {
          response.data.professional.stats = {
            totalSessions: response.data.professional.sessions
              ? response.data.professional.sessions.length
              : 0,
            totalClients: 0,
            productsCount: response.data.professional.products
              ? response.data.professional.products.length
              : 0,
            upcomingSessions: 0,
          };
        }

        // Add missing fields needed for UI if absent
        if (!response.data.professional.rating) {
          response.data.professional.rating = { average: 0, totalReviews: 0 };
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  },

  // ===================== BUSINESS HOURS MANAGEMENT =====================

  // Récupérer les horaires d'ouverture
  async getBusinessHours() {
    try {
      const response = await api.get('/professionals/me/business-hours');
      return response.data;
    } catch (error) {
      console.error('Error fetching business hours:', error);
      throw error;
    }
  },

  // Mettre à jour les horaires d'ouverture
  async updateBusinessHours(businessHours) {
    try {
      const response = await api.put('/professionals/me/business-hours', {
        businessHours,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating business hours:', error);
      throw error;
    }
  },

  // ===================== COVER IMAGES MANAGEMENT =====================

  // Uploader une image de couverture
  async uploadCoverImage(formData) {
    try {
      const response = await api.post('/uploads/cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw error;
    }
  },

  // Ajouter une image de couverture au profil professionnel
  async addCoverImage(imageUrl) {
    try {
      const response = await api.post('/professionals/me/cover-images', {
        imageUrl: imageUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding cover image to profile:', error);
      throw error;
    }
  },

  // Supprimer une image de couverture du profil professionnel
  async removeCoverImage(imageUrl) {
    try {
      const response = await api.delete('/professionals/me/cover-images', {
        params: { imageUrl: imageUrl },
        data: { imageUrl: imageUrl }, // Aussi dans le body pour compatibilité
      });
      return response.data;
    } catch (error) {
      console.error('Error removing cover image from profile:', error);
      throw error;
    }
  },

  // Récupérer les images de couverture du profil professionnel
  async getCoverImages() {
    try {
      const response = await api.get('/professionals/me/cover-images');
      return response.data;
    } catch (error) {
      console.error('Error fetching cover images:', error);
      throw error;
    }
  },

  // Remplacer l'image de couverture (plus efficace qu'ajouter puis supprimer)
  async replaceCoverImage(newImageUrl) {
    try {
      const response = await api.put('/professionals/me/cover-images/replace', {
        newImageUrl: newImageUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error replacing cover image:', error);
      throw error;
    }
  },
};

export default api;
