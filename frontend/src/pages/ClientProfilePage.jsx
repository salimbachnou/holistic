import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaUser,
  FaEnvelope,
  FaHistory,
  FaShoppingBag,
  FaComment,
  FaHeart,
  FaVideo,
  FaTrash,
  FaStar,
  FaCalendar,
  FaClock,
  FaEuroSign,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { apiService } from '../services/axiosConfig';

const ClientProfilePage = () => {
  const { user, refreshUserData } = useAuth();
  const {
    favorites,
    toggleSessionFavorite,
    toggleProductFavorite,
    toggleProfessionalFavorite,
    toggleEventFavorite,
    getTotalFavoritesCount,
  } = useFavorites();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const response = await apiService.get('/bookings/my-bookings');
      setBookings(response.data?.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiService.get('/orders');
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Impossible de charger vos commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await apiService.get('/messages/conversations');
      // Ensure we have the correct data structure
      const conversations = response.data?.conversations || [];
      // Filter out any conversations with missing data
      const validConversations = conversations.filter(
        conv => conv && conv.otherPerson && conv.otherPerson._id
      );
      setConversations(validConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Impossible de charger vos conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTabData = useCallback(
    tab => {
      if (!user) return;

      if (tab === 'bookings') {
        fetchBookings();
      } else if (tab === 'orders') {
        setLoading(true);
        fetchOrders();
      } else if (tab === 'messages') {
        setLoading(true);
        fetchConversations();
      }
      // Note: favorites are now managed by FavoritesContext, no need to fetch them here
    },
    [user, fetchBookings, fetchOrders, fetchConversations]
  );

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        gender: user.gender || '',
      });

      // Set preview image if user has profile image
      if (user.profileImage) {
        setPreviewImage(
          user.profileImage.startsWith('http')
            ? user.profileImage
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profileImage}`
        );
      }

      // Load data based on active tab
      loadTabData(activeTab);
    }
  }, [user, activeTab, loadTabData]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactInputChange = e => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm(prev => ({
        ...prev,
        profileImage: file,
      }));

      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      formData.append('email', profileForm.email);
      formData.append('phone', profileForm.phone || '');
      formData.append('address', profileForm.address || '');

      // Only append birthDate if it's not empty
      if (profileForm.birthDate) {
        formData.append('birthDate', profileForm.birthDate);
      }

      // Only append gender if it's not empty
      if (profileForm.gender) {
        formData.append('gender', profileForm.gender);
      }

      // Only append profileImage if it exists
      if (profileForm.profileImage) {
        formData.append('profileImage', profileForm.profileImage);
      }

      const response = await apiService.put(`/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Profil mis à jour avec succès');
        setEditMode(false);
        // Refresh user data to show updated info immediately
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // If refresh fails, just reload the page as fallback
          window.location.reload();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async e => {
    e.preventDefault();
    setSubmittingContact(true);

    try {
      const response = await apiService.post('/contact', contactForm);

      if (response.data.success) {
        toast.success('Votre message a été envoyé avec succès');
        setContactForm({ subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi du message");
    } finally {
      setSubmittingContact(false);
    }
  };

  const cancelBooking = async bookingId => {
    try {
      await apiService.put(`/bookings/${bookingId}/cancel`);
      toast.success('Réservation annulée avec succès');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'annulation de la réservation");
    }
  };

  const removeFavorite = async (favoriteId, favoriteType) => {
    try {
      // Use the appropriate toggle function based on type
      const favoriteItem = { id: favoriteId, _id: favoriteId };

      switch (favoriteType) {
        case 'professional':
          toggleProfessionalFavorite(favoriteItem);
          break;
        case 'product':
          toggleProductFavorite(favoriteItem);
          break;
        case 'event':
          toggleEventFavorite(favoriteItem);
          break;
        case 'session':
          toggleSessionFavorite(favoriteItem);
          break;
        default:
          // Fallback for backwards compatibility
          toggleProfessionalFavorite(favoriteItem);
      }

      toast.success('Retiré des favoris');
    } catch (err) {
      toast.error('Erreur lors du retrait du favori');
    }
  };

  const joinMeeting = link => {
    window.open(link, '_blank', 'width=800,height=600');
  };

  const renderPersonalInfo = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      {!editMode ? (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-0">
              Informations personnelles
            </h2>
            <button
              onClick={() => setEditMode(true)}
              className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Modifier
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 md:mb-0 md:mr-6 lg:mr-8">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-gray-400 w-8 h-8 sm:w-12 sm:h-12" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base break-all">{user?.email}</p>
              <div className="flex items-center justify-center md:justify-start mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.isVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {user?.isVerified ? 'Compte vérifié' : 'Compte non vérifié'}
                </span>
              </div>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Contact
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-sm sm:text-base text-gray-900 break-all">
                    {user?.email || 'Non renseigné'}
                  </p>
                </div>

                {user?.phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Téléphone</span>
                    <p className="text-sm sm:text-base text-gray-900">{user.phone}</p>
                  </div>
                )}

                {user?.address && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Adresse</span>
                    <p className="text-sm sm:text-base text-gray-900">{user.address}</p>
                  </div>
                )}

                {user?.coordinates?.city && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Localisation</span>
                    <p className="text-sm sm:text-base text-gray-900">
                      {user.coordinates.city}
                      {user.coordinates.country && `, ${user.coordinates.country}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Informations personnelles
              </h3>

              <div className="space-y-3">
                {user?.birthDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de naissance</span>
                    <p className="text-sm sm:text-base text-gray-900">
                      {new Date(user.birthDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                {user?.gender && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Genre</span>
                    <p className="text-sm sm:text-base text-gray-900 capitalize">
                      {user.gender === 'male'
                        ? 'Homme'
                        : user.gender === 'female'
                          ? 'Femme'
                          : user.gender === 'other'
                            ? 'Autre'
                            : 'Préfère ne pas dire'}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-500">Type de compte</span>
                  <p className="text-sm sm:text-base text-gray-900 capitalize">
                    {user?.role === 'client'
                      ? 'Client'
                      : user?.role === 'professional'
                        ? 'Professionnel'
                        : user?.role === 'admin'
                          ? 'Administrateur'
                          : user?.role}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Membre depuis</span>
                  <p className="text-sm sm:text-base text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                      : 'Non disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Préférences */}
          {user?.preferences && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm font-medium text-gray-500">Langue</span>
                  <p className="text-sm sm:text-base text-gray-900">
                    {user.preferences.language === 'fr'
                      ? 'Français'
                      : user.preferences.language === 'en'
                        ? 'Anglais'
                        : user.preferences.language === 'ar'
                          ? 'Arabe'
                          : user.preferences.language || 'Non définie'}
                  </p>
                </div>

                {user.preferences.notifications && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Notifications</span>
                    <div className="text-sm sm:text-base text-gray-900">
                      <p>
                        Email: {user.preferences.notifications.email ? 'Activées' : 'Désactivées'}
                      </p>
                      <p>
                        Push: {user.preferences.notifications.push ? 'Activées' : 'Désactivées'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistiques du compte */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques du compte</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-primary-600">
                  {user?.bookings?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Réservations</p>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-primary-600">
                  {user?.orders?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Commandes</p>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-primary-600">
                  {user?.favorites?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Favoris</p>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-primary-600">
                  {user?.provider || 'Local'}
                </p>
                <p className="text-xs text-gray-500">Méthode de connexion</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Modifier le profil</h2>

          <div className="flex flex-col md:flex-row items-center mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 md:mb-0 md:mr-6 lg:mr-8 relative group">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-gray-400 w-8 h-8 sm:w-12 sm:h-12" />
              )}

              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer text-white text-xs sm:text-sm font-medium">
                  Changer
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex-1 space-y-3 sm:space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                  >
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={profileForm.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={profileForm.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={profileForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Adresse
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={profileForm.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  placeholder="Votre adresse complète"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="birthDate"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                  >
                    Date de naissance
                  </label>
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={profileForm.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                  >
                    Genre
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={profileForm.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                    <option value="prefer_not_to_say">Préfère ne pas dire</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Mes réservations</h2>

      {/* Tabs for upcoming and past bookings */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6">
        <button className="py-2 px-3 sm:px-4 border-b-2 border-primary-600 text-primary-600 text-sm sm:text-base">
          À venir
        </button>
        <button className="py-2 px-3 sm:px-4 text-gray-500 hover:text-gray-700 text-sm sm:text-base">
          Passées
        </button>
      </div>

      {bookingsLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {bookings.map(booking => (
            <div key={booking._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between mb-3 sm:mb-2">
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-0">
                  {booking.service?.name || 'Session'}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {booking.status === 'confirmed'
                    ? 'Confirmée'
                    : booking.status === 'pending'
                      ? 'En attente'
                      : booking.status === 'cancelled'
                        ? 'Annulée'
                        : booking.status === 'completed'
                          ? 'Terminée'
                          : booking.status}
                </span>
              </div>

              <p className="text-gray-600 mb-3 text-sm sm:text-base">
                {booking.professional?.businessName}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  <span>{new Date(booking.appointmentDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🕒</span>
                  <span>
                    {booking.appointmentTime.start} - {booking.appointmentTime.end}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span className="truncate">
                    {booking.location.type === 'online'
                      ? 'Session en ligne'
                      : booking.location.address?.street &&
                        `${booking.location.address.street}, ${booking.location.address.city}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">💰</span>
                  <span>
                    {booking.totalAmount.amount} {booking.totalAmount.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Link
                  to={`/professionals/${booking.professional?._id}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs sm:text-sm hover:bg-gray-200 text-center"
                >
                  Voir professionnel
                </Link>

                {booking.location.type === 'online' && booking.status === 'confirmed' && (
                  <button
                    onClick={() => joinMeeting(booking.location.onlineLink)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 flex items-center justify-center"
                  >
                    <FaVideo className="inline mr-1" /> Rejoindre
                  </button>
                )}

                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <button
                    onClick={() => cancelBooking(booking._id)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs sm:text-sm hover:bg-red-200"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            Vous n&apos;avez pas encore de réservations
          </p>
          <Link
            to="/professionals"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm sm:text-base"
          >
            Explorer les professionnels
          </Link>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Mes commandes</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {orders.map(order => (
            <div key={order._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between mb-3">
                <div>
                  <h3 className="font-medium text-sm sm:text-base">
                    Commande #{order.orderNumber}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium self-start mt-2 sm:mt-0 ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.status === 'delivered'
                    ? 'Livré'
                    : order.status === 'shipped'
                      ? 'Expédié'
                      : 'En attente'}
                </span>
              </div>

              <div className="mb-3 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs sm:text-sm">
                    <span className="truncate mr-2">
                      {item.quantity}x {item.product?.name || 'Produit'}
                    </span>
                    <span className="whitespace-nowrap">
                      {item.price?.amount} {item.price?.currency}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm sm:text-base">
                <span className="font-medium">Total</span>
                <span className="font-medium">
                  {order.totalAmount.amount} {order.totalAmount.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            Vous n&apos;avez pas encore de commandes
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm sm:text-base"
          >
            Explorer les produits
          </Link>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Mes conversations</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map(conversation => {
            // Handle the new conversation structure from the API
            const otherUser = conversation.otherPerson;

            // Safety check to prevent errors if data is missing
            if (!otherUser || !otherUser._id) {
              return null;
            }

            return (
              <Link
                to={`/messages/${otherUser._id}`}
                key={conversation.conversationId}
                className="flex items-center border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                  {otherUser.profileImage ? (
                    <img
                      src={otherUser.profileImage}
                      alt={`${otherUser.firstName} ${otherUser.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100">
                      <span className="text-primary-600 font-medium text-xs sm:text-sm">
                        {otherUser.firstName?.charAt(0)}
                        {otherUser.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm sm:text-base truncate">
                      {otherUser.firstName} {otherUser.lastName}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {conversation.lastMessage.content}
                  </p>
                </div>

                {conversation.unreadCount > 0 && (
                  <div className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {conversation.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm sm:text-base">
            Vous n&apos;avez pas encore de conversations
          </p>
        </div>
      )}
    </div>
  );

  const renderFavorites = () => {
    // Combine all favorites from different categories
    const allFavorites = [
      ...favorites.sessions.map(item => ({ ...item, type: 'session' })),
      ...favorites.products.map(item => ({ ...item, type: 'product' })),
      ...favorites.professionals.map(item => ({ ...item, type: 'professional' })),
      ...favorites.events.map(item => ({ ...item, type: 'event' })),
    ];

    const totalFavoritesCount = getTotalFavoritesCount();

    const renderFavoriteCard = item => {
      const commonCardClass =
        'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative';

      switch (item.type) {
        case 'session':
          return (
            <div key={item.id} className={commonCardClass}>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => removeFavorite(item.id, 'session')}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <FaCalendar className="text-4xl mb-2 mx-auto" />
                    <p className="text-lg font-semibold">Session</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3">
                  <FaCalendar className="text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-blue-600">Session</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <FaClock className="mr-2" />
                    <span>{new Date(item.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <FaEuroSign className="mr-2" />
                    <span>{item.price?.amount || item.price} MAD</span>
                  </div>
                </div>
                <Link
                  to="/sessions"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors w-full text-center"
                >
                  Voir les sessions
                </Link>
              </div>
            </div>
          );

        case 'product':
          return (
            <div key={item.id} className={commonCardClass}>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => removeFavorite(item.id, 'product')}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div className="h-32 sm:h-40 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <FaShoppingBag className="text-4xl mb-2 mx-auto" />
                    <p className="text-lg font-semibold">Produit</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3">
                  <FaShoppingBag className="text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Produit</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-gray-900">
                    {item.price} {item.currency || 'MAD'}
                  </span>
                  {item.rating && (
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">{item.rating.average}</span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/products/${item.id}`}
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors w-full text-center"
                >
                  Voir le produit
                </Link>
              </div>
            </div>
          );

        case 'professional':
          return (
            <div key={item.id} className={commonCardClass}>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => removeFavorite(item.id, 'professional')}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div className="h-32 sm:h-40 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center relative overflow-hidden">
                {item.coverImages && item.coverImages.length > 0 ? (
                  <img
                    src={item.coverImages[0]}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : item.profilePhoto ? (
                  <img
                    src={item.profilePhoto}
                    alt={item.businessName}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <FaUser className="text-4xl mb-2 mx-auto" />
                    <p className="text-lg font-semibold">Professionnel</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3">
                  <FaUser className="text-purple-500 mr-2" />
                  <span className="text-sm font-medium text-purple-600">Professionnel</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.businessName}</h3>
                <p className="text-gray-600 text-sm mb-3 capitalize">{item.businessType}</p>
                {item.rating && (
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={
                          i < Math.floor(item.rating.average || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {item.rating.totalReviews || 0} avis
                    </span>
                  </div>
                )}
                <Link
                  to={`/professionals/${item.id}`}
                  className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors w-full text-center"
                >
                  Voir le profil
                </Link>
              </div>
            </div>
          );

        case 'event':
          return (
            <div key={item.id} className={commonCardClass}>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => removeFavorite(item.id, 'event')}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div className="h-32 sm:h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <FaCalendar className="text-4xl mb-2 mx-auto" />
                    <p className="text-lg font-semibold">Événement</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3">
                  <FaCalendar className="text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-orange-600">Événement</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <FaCalendar className="mr-2" />
                    <span>
                      {item.date ? new Date(item.date).toLocaleDateString() : 'Date non spécifiée'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2" />
                    <span>{item.time || 'Heure non spécifiée'}</span>
                  </div>
                </div>
                <Link
                  to={`/events/${item.id}`}
                  className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors w-full text-center"
                >
                  Voir l&apos;événement
                </Link>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Mes favoris</h2>

        {totalFavoritesCount > 0 ? (
          <>
            {/* Statistiques des favoris */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Sessions</p>
                    <p className="text-xl font-bold text-blue-900">
                      {favorites.sessions?.length || 0}
                    </p>
                  </div>
                  <FaCalendar className="text-2xl text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Produits</p>
                    <p className="text-xl font-bold text-green-900">
                      {favorites.products?.length || 0}
                    </p>
                  </div>
                  <FaShoppingBag className="text-2xl text-green-500" />
                </div>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Professionnels</p>
                    <p className="text-xl font-bold text-purple-900">
                      {favorites.professionals?.length || 0}
                    </p>
                  </div>
                  <FaUser className="text-2xl text-purple-500" />
                </div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Événements</p>
                    <p className="text-xl font-bold text-orange-900">
                      {favorites.events?.length || 0}
                    </p>
                  </div>
                  <FaCalendar className="text-2xl text-orange-500" />
                </div>
              </div>
            </div>

            {/* Liste des favoris */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {allFavorites.slice(0, 6).map(item => renderFavoriteCard(item))}
            </div>

            {/* Actions de gestion */}
            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {totalFavoritesCount} élément{totalFavoritesCount > 1 ? 's' : ''} en favoris
              </p>
              <Link
                to="/favorites"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Voir tous mes favoris
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <FaHeart className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun favori</h3>
            <p className="text-gray-600 mb-6 text-base">
              Explorez nos contenus et ajoutez vos préférés pour les retrouver facilement
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/sessions"
                className="inline-block bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Sessions
              </Link>
              <Link
                to="/products"
                className="inline-block bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Produits
              </Link>
              <Link
                to="/professionals"
                className="inline-block bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Professionnels
              </Link>
              <Link
                to="/events"
                className="inline-block bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Événements
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContactForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Nous contacter</h2>

      <form onSubmit={handleContactSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label
            htmlFor="subject"
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
          >
            Sujet
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={contactForm.subject}
            onChange={handleContactInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={contactForm.message}
            onChange={handleContactInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base resize-y"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submittingContact}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-400 text-sm sm:text-base"
          >
            {submittingContact ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mon espace personnel</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-1 lg:space-y-2">
            <button
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'personal'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Informations personnelles</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'bookings'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaHistory className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Mes réservations</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'orders'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Mes commandes</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'messages'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaComment className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Mes messages</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'favorites'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaHeart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Mes favoris</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left text-sm sm:text-base ${
                activeTab === 'contact'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Nous contacter</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'favorites' && renderFavorites()}
            {activeTab === 'contact' && renderContactForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
