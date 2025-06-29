import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaUser,
  FaEnvelope,
  FaHistory,
  FaShoppingBag,
  FaComment,
  FaHeart,
  FaVideo,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const ClientProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
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
  }, [user, activeTab]);

  const loadTabData = tab => {
    if (!user) return;

    if (tab === 'bookings') {
      fetchBookings();
    } else if (tab === 'orders') {
      setLoading(true);
      fetchOrders();
    } else if (tab === 'messages') {
      setLoading(true);
      fetchConversations();
    } else if (tab === 'favorites') {
      setLoading(true);
      fetchFavorites();
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await axios.get('/api/bookings/my-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Impossible de charger vos commandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Impossible de charger vos conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/favorites');
      setFavorites(response.data.favorites || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      toast.error('Impossible de charger vos favoris');
    } finally {
      setLoading(false);
    }
  };

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

      // Only append profileImage if it exists
      if (profileForm.profileImage) {
        formData.append('profileImage', profileForm.profileImage);
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Profil mis à jour avec succès');
        setEditMode(false);
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
      const response = await axios.post('/api/contact', contactForm);

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
      await axios.post(`/api/bookings/${bookingId}/cancel`);
      toast.success('Réservation annulée avec succès');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'annulation de la réservation");
    }
  };

  const removeFavorite = async professionalId => {
    try {
      await axios.delete(`/api/favorites/${professionalId}`);
      toast.success('Professionnel retiré des favoris');
      fetchFavorites();
    } catch (err) {
      toast.error('Erreur lors du retrait du favori');
    }
  };

  const joinVideoCall = link => {
    window.open(link, '_blank', 'width=800,height=600');
  };

  const renderPersonalInfo = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {!editMode ? (
        <>
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
            <button
              onClick={() => setEditMode(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Modifier
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 md:mb-0 md:mr-8">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-gray-400 w-12 h-12" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{user?.email}</p>
              {user?.phone && <p className="text-gray-600 mt-1">{user?.phone}</p>}
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6">Modifier le profil</h2>

          <div className="flex flex-col md:flex-row items-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-4 md:mb-0 md:mr-8 relative group">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-gray-400 w-12 h-12" />
              )}

              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer text-white text-sm font-medium">
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

            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={profileForm.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={profileForm.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={profileForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Mes réservations</h2>

      {/* Tabs for upcoming and past bookings */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className="py-2 px-4 border-b-2 border-primary-600 text-primary-600">
          À venir
        </button>
        <button className="py-2 px-4 text-gray-500 hover:text-gray-700">Passées</button>
      </div>

      {bookingsLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap justify-between mb-2">
                <h3 className="text-lg font-medium">{booking.service?.name || 'Session'}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
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

              <p className="text-gray-600 mb-3">{booking.professional?.businessName}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="mr-2">📅</span>
                  <span>{new Date(booking.appointmentDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">🕒</span>
                  <span>
                    {booking.appointmentTime.start} - {booking.appointmentTime.end}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">📍</span>
                  <span>
                    {booking.location.type === 'online'
                      ? 'Session en ligne'
                      : booking.location.address?.street &&
                        `${booking.location.address.street}, ${booking.location.address.city}`}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">💰</span>
                  <span>
                    {booking.totalAmount.amount} {booking.totalAmount.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Link
                  to={`/professionals/${booking.professional?._id}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  Voir professionnel
                </Link>

                {booking.location.type === 'online' && booking.status === 'confirmed' && (
                  <button
                    onClick={() => joinVideoCall(booking.location.onlineLink)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    <FaVideo className="inline mr-1" /> Rejoindre
                  </button>
                )}

                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <button
                    onClick={() => cancelBooking(booking._id)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
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
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de réservations</p>
          <Link
            to="/professionals"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Explorer les professionnels
          </Link>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Mes commandes</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap justify-between mb-3">
                <div>
                  <h3 className="font-medium">Commande #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.product?.name || 'Produit'}
                    </span>
                    <span>
                      {item.price?.amount} {item.price?.currency}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-2 flex justify-between">
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
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de commandes</p>
          <Link
            to="/products"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Explorer les produits
          </Link>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Mes conversations</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map(conversation => {
            const otherUser =
              conversation.sender._id === user._id ? conversation.receiver : conversation.sender;

            return (
              <Link
                to={`/messages/${otherUser._id}`}
                key={conversation._id}
                className="flex items-center border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3">
                  {otherUser.profileImage ? (
                    <img
                      src={otherUser.profileImage}
                      alt={`${otherUser.firstName} ${otherUser.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100">
                      <span className="text-primary-600 font-medium">
                        {otherUser.firstName?.charAt(0)}
                        {otherUser.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">
                      {otherUser.firstName} {otherUser.lastName}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.text}</p>
                </div>

                {conversation.unreadCount > 0 && (
                  <div className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Vous n'avez pas encore de conversations</p>
        </div>
      )}
    </div>
  );

  const renderFavorites = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Mes favoris</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map(favorite => (
            <div
              key={favorite.professional._id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="relative h-32">
                {favorite.professional.coverImages &&
                favorite.professional.coverImages.length > 0 ? (
                  <img
                    src={favorite.professional.coverImages[0]}
                    alt={favorite.professional.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">Pas d'image</span>
                  </div>
                )}

                <button
                  onClick={() => removeFavorite(favorite.professional._id)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                >
                  <FaHeart className="text-red-500 w-4 h-4" />
                </button>
              </div>

              <div className="p-3">
                <h3 className="font-medium">{favorite.professional.businessName}</h3>
                <p className="text-sm text-gray-500 mb-2 capitalize">
                  {favorite.professional.businessType}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-yellow-400 text-sm">
                    {'★'.repeat(Math.floor(favorite.professional.rating?.average || 0))}
                    {'☆'.repeat(5 - Math.floor(favorite.professional.rating?.average || 0))}
                    <span className="ml-1 text-gray-500">
                      ({favorite.professional.rating?.totalReviews || 0})
                    </span>
                  </div>

                  <Link
                    to={`/professionals/${favorite.professional._id}`}
                    className="text-primary-600 text-sm font-medium hover:underline"
                  >
                    Voir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de favoris</p>
          <Link
            to="/professionals"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Explorer les professionnels
          </Link>
        </div>
      )}
    </div>
  );

  const renderContactForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Nous contacter</h2>

      <form onSubmit={handleContactSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={contactForm.subject}
            onChange={handleContactInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={contactForm.message}
            onChange={handleContactInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submittingContact}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-400"
          >
            {submittingContact ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Mon espace personnel</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'personal'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaUser className="w-5 h-5" />
              <span>Informations personnelles</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'bookings'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaHistory className="w-5 h-5" />
              <span>Mes réservations</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'orders'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaShoppingBag className="w-5 h-5" />
              <span>Mes commandes</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'messages'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaComment className="w-5 h-5" />
              <span>Mes messages</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'favorites'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaHeart className="w-5 h-5" />
              <span>Mes favoris</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left ${
                activeTab === 'contact'
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FaEnvelope className="w-5 h-5" />
              <span>Nous contacter</span>
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
