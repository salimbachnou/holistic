import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaClock,
  FaMapMarkerAlt,
  FaEuroSign,
  FaCalendarAlt,
  FaUsers,
  FaStar,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaArrowUp,
  FaCalendarCheck,
  FaVideo,
  FaMapPin,
  FaTimes,
  FaEdit,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';

// Review Modal Component
const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted, existingReview }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    tags: [],
    wouldRecommend: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const availableTags = [
    'qualité',
    'service',
    'communication',
    'ponctualité',
    'expertise',
    'ambiance',
    'prix',
  ];

  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating,
        comment: existingReview.comment,
        tags: existingReview.tags || [],
        wouldRecommend: existingReview.wouldRecommend,
      });
    }
  }, [existingReview]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.rating) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }

    setSubmitting(true);

    try {
      if (existingReview) {
        // Update existing review
        const reviewData = {
          rating: formData.rating,
          comment: formData.comment.trim(),
          wouldRecommend: formData.wouldRecommend,
          aspects: formData.aspects || {},
        };

        await axiosInstance.put(`/reviews/${existingReview._id}`, reviewData);
        toast.success('Avis modifié avec succès !');
      } else {
        // Create new review
        const reviewData = {
          contentType: 'session',
          contentId: booking.service?.sessionId,
          rating: formData.rating,
          comment: formData.comment.trim(),
          tags: formData.tags,
          wouldRecommend: formData.wouldRecommend,
        };

        await axiosInstance.post('/reviews', reviewData);
        toast.success('Avis envoyé avec succès !');
      }

      onReviewSubmitted();
      onClose();

      // Reset form only if it was a new review
      if (!existingReview) {
        setFormData({
          rating: 0,
          comment: '',
          tags: [],
          wouldRecommend: true,
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagToggle = tag => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`text-3xl transition-colors duration-200 ${
              star <= (hoveredRating || formData.rating)
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingReview ? 'Modifier votre avis' : 'Laisser un avis'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {booking.service?.name || 'Session'}
            </h3>
            <p className="text-gray-600 text-sm">
              avec {booking.professional?.businessName || 'Professionnel'}
            </p>
            <p className="text-gray-500 text-sm">
              {format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Note globale *</label>
              <div className="flex items-center space-x-4">
                {renderStars()}
                <span className="text-sm text-gray-500">
                  {formData.rating > 0 && `${formData.rating}/5`}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire *
              </label>
              <textarea
                value={formData.comment}
                onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Partagez votre expérience..."
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.comment.length}/1000 caractères
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Aspects à souligner (optionnel)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recommanderiez-vous cette session ?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.wouldRecommend
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Oui, je recommande
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !formData.wouldRecommend
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Non, je ne recommande pas
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.rating || !formData.comment.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <FaEdit />
                    <span>{existingReview ? "Modifier l'avis" : "Publier l'avis"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('sessions'); // 'sessions' or 'events'
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null });
  const [existingReviews, setExistingReviews] = useState({}); // Track existing reviews

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchEvents();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await axiosInstance.get('/bookings/my-bookings');
      setBookings(response.data.bookings);

      // Check for existing reviews for completed sessions
      await checkExistingReviews(response.data.bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Échec du chargement des réservations. Veuillez réessayer plus tard.');
      setBookings([]);
    }
  };

  const checkExistingReviews = async bookingsList => {
    const reviewsMap = {};

    // Check reviews for completed sessions
    const completedBookings = bookingsList.filter(
      booking => booking.status === 'completed' && booking.service?.sessionId
    );

    for (const booking of completedBookings) {
      try {
        const response = await axiosInstance.get(
          `/reviews/session/${booking.service.sessionId}/user`
        );
        if (response.data.success && response.data.review) {
          reviewsMap[booking.service.sessionId] = response.data.review;
        }
      } catch (error) {
        // No review exists, which is fine
        console.log(`No review found for session ${booking.service.sessionId}`);
      }
    }

    setExistingReviews(reviewsMap);
  };

  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get('/events/my-events');
      setEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async bookingId => {
    try {
      await axiosInstance.put(`/bookings/${bookingId}/cancel`);
      toast.success('Réservation annulée avec succès');
      fetchBookings();
    } catch (err) {
      console.error('Error canceling booking:', err);
      toast.error(err.response?.data?.message || "Erreur lors de l'annulation de la réservation");
    }
  };

  const cancelEventRegistration = async eventId => {
    try {
      await axiosInstance.post(`/events/${eventId}/cancel`);
      toast.success("Inscription à l'événement annulée avec succès");
      fetchEvents();
    } catch (err) {
      console.error('Error canceling event registration:', err);
      toast.error(err.response?.data?.message || "Erreur lors de l'annulation de l'inscription");
    }
  };

  const handleReviewClick = booking => {
    setReviewModal({ isOpen: true, booking });
  };

  const handleReviewSubmitted = () => {
    // Refresh bookings and reviews to update the UI
    fetchBookings();
  };

  // Helper function to get existing review for a booking
  const getExistingReview = booking => {
    return booking.service?.sessionId ? existingReviews[booking.service.sessionId] : null;
  };

  // Calculate statistics
  const getStatistics = () => {
    const now = new Date();

    // Session statistics
    const sessionStats = {
      total: bookings.length,
      upcoming: bookings.filter(b => new Date(b.appointmentDate) >= now).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount?.amount || 0), 0),
      onlineSessions: bookings.filter(b => b.location?.type === 'online').length,
      inPersonSessions: bookings.filter(b => b.location?.type !== 'online').length,
    };

    // Event statistics
    const eventStats = {
      total: events.length,
      upcoming: events.filter(e => new Date(e.endDate || e.date) >= now).length,
      completed: events.filter(e => new Date(e.endDate || e.date) < now).length,
      totalSpent: events.reduce((sum, e) => sum + (e.price || 0), 0),
      freeEvents: events.filter(e => e.price === 0).length,
      paidEvents: events.filter(e => e.price > 0).length,
    };

    return { sessionStats, eventStats };
  };

  const { sessionStats, eventStats } = getStatistics();

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const appointmentDate = new Date(booking.appointmentDate);
    const today = new Date();

    if (activeTab === 'upcoming') {
      return appointmentDate >= today;
    } else if (activeTab === 'past') {
      return appointmentDate < today;
    }
    return true;
  });

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.endDate || event.date);
    const today = new Date();

    if (activeTab === 'upcoming') {
      return eventDate >= today;
    } else if (activeTab === 'past') {
      return eventDate < today;
    }
    return true;
  });

  // Sort bookings by date (most recent first for past, soonest first for upcoming)
  filteredBookings.sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);

    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  // Sort events by date
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <FaCalendarCheck className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tableau de bord des réservations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gérez vos réservations de sessions et vos inscriptions aux événements en un seul endroit
          </p>
        </div>

        {/* Statistics Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <FaChartLine className="text-blue-600 mr-3 text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
          </div>

          {contentType === 'sessions' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">{sessionStats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaCalendarAlt className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions Terminées</p>
                    <p className="text-3xl font-bold text-gray-900">{sessionStats.completed}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Attente</p>
                    <p className="text-3xl font-bold text-gray-900">{sessionStats.pending}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <FaHourglassHalf className="text-yellow-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Montant Total</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {sessionStats.totalSpent} MAD
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FaEuroSign className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions En Ligne</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {sessionStats.onlineSessions}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <FaVideo className="text-indigo-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions Annulées</p>
                    <p className="text-3xl font-bold text-gray-900">{sessionStats.cancelled}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <FaTimesCircle className="text-red-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions Présentiel</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {sessionStats.inPersonSessions}
                    </p>
                  </div>
                  <div className="bg-teal-100 p-3 rounded-full">
                    <FaMapPin className="text-teal-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">À Venir</p>
                    <p className="text-3xl font-bold text-gray-900">{sessionStats.upcoming}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <FaArrowUp className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Événements</p>
                    <p className="text-3xl font-bold text-gray-900">{eventStats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaCalendarAlt className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Événements Terminés</p>
                    <p className="text-3xl font-bold text-gray-900">{eventStats.completed}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Montant Total</p>
                    <p className="text-3xl font-bold text-gray-900">{eventStats.totalSpent} MAD</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FaEuroSign className="text-purple-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">À Venir</p>
                    <p className="text-3xl font-bold text-gray-900">{eventStats.upcoming}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <FaArrowUp className="text-orange-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Type Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 px-6 font-semibold text-center transition-all duration-200 ${
                contentType === 'sessions'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tl-xl'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setContentType('sessions')}
            >
              <div className="flex items-center justify-center">
                <FaCalendarAlt className="mr-2" />
                Sessions ({bookings.length})
              </div>
            </button>
            <button
              className={`flex-1 py-4 px-6 font-semibold text-center transition-all duration-200 ${
                contentType === 'events'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xl'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setContentType('events')}
            >
              <div className="flex items-center justify-center">
                <FaUsers className="mr-2" />
                Événements ({events.length})
              </div>
            </button>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 px-6 font-medium text-center transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              À venir
            </button>
            <button
              className={`flex-1 py-3 px-6 font-medium text-center transition-all duration-200 ${
                activeTab === 'past'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('past')}
            >
              Passées
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center">
              <FaTimesCircle className="mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Sessions Content */}
        {contentType === 'sessions' && (
          <>
            {filteredBookings.length > 0 ? (
              <div className="space-y-6">
                {filteredBookings.map(booking => {
                  const existingReview = getExistingReview(booking);

                  return (
                    <div
                      key={booking._id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="p-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {booking.service?.name || 'Session'}
                            </h3>
                            <p className="text-lg text-gray-600 mb-4">
                              {booking.professional?.businessName || 'Professionnel'}
                            </p>
                          </div>
                          <div className="mt-4 lg:mt-0">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-gray-100 text-gray-800 border border-gray-200'
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                            <div className="bg-blue-100 p-2 rounded-full mr-4">
                              <FaCalendarAlt className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Date</p>
                              <p className="font-semibold text-gray-900">
                                {format(new Date(booking.appointmentDate), 'EEEE d MMMM yyyy', {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                            <div className="bg-green-100 p-2 rounded-full mr-4">
                              <FaClock className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Heure</p>
                              <p className="font-semibold text-gray-900">
                                {booking.appointmentTime.start} - {booking.appointmentTime.end}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                            <div className="bg-purple-100 p-2 rounded-full mr-4">
                              <FaMapMarkerAlt className="text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Lieu</p>
                              <p className="font-semibold text-gray-900">
                                {booking.location.type === 'online'
                                  ? 'Session en ligne'
                                  : booking.location.address?.street &&
                                    `${booking.location.address.street}, ${booking.location.address.city}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                            <div className="bg-yellow-100 p-2 rounded-full mr-4">
                              <FaEuroSign className="text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Prix</p>
                              <p className="font-semibold text-gray-900">
                                {booking.totalAmount.amount} {booking.totalAmount.currency}
                              </p>
                            </div>
                          </div>
                        </div>

                        {booking.clientNotes && (
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <h4 className="font-semibold text-blue-900 mb-2">Notes du client</h4>
                            <p className="text-blue-800">{booking.clientNotes}</p>
                          </div>
                        )}

                        {/* Show existing review if it exists */}
                        {existingReview && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-green-900">Votre avis</h4>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <FaStar
                                    key={star}
                                    className={`text-sm ${star <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600">
                                  {existingReview.rating}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-green-800 mb-2">{existingReview.comment}</p>
                            <p className="text-xs text-green-600">
                              Publié le{' '}
                              {format(new Date(existingReview.createdAt), 'd MMMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        )}

                        {/* Actions based on booking status */}
                        <div className="flex justify-end space-x-4">
                          {booking.status === 'pending' || booking.status === 'confirmed' ? (
                            <>
                              {booking.location.type === 'online' &&
                                booking.location.onlineLink && (
                                  <a
                                    href={booking.location.onlineLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  >
                                    Rejoindre la session
                                  </a>
                                )}
                              <button
                                onClick={() => cancelBooking(booking._id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                Annuler
                              </button>
                            </>
                          ) : booking.status === 'completed' ? (
                            <button
                              onClick={() => handleReviewClick(booking)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                            >
                              <FaStar />
                              <span>{existingReview ? "Modifier l'avis" : 'Laisser un avis'}</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="mb-6">
                  <FaCalendarAlt className="mx-auto text-6xl text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {activeTab === 'upcoming'
                    ? "Vous n'avez aucune réservation à venir"
                    : "Vous n'avez aucune réservation passée"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {activeTab === 'upcoming'
                    ? 'Explorez notre liste de professionnels pour réserver votre prochaine session'
                    : 'Vos réservations passées apparaîtront ici'}
                </p>
                {activeTab === 'upcoming' && (
                  <a
                    href="/for-you"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
                  >
                    Découvrir des professionnels
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {/* Events Content */}
        {contentType === 'events' && (
          <>
            {filteredEvents.length > 0 ? (
              <div className="space-y-6">
                {filteredEvents.map(event => (
                  <div
                    key={event._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-8">
                      <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                          <p className="text-lg text-gray-600 mb-4">
                            Organisé par{' '}
                            {event.professional?.businessName ||
                              `${event.professional?.firstName} ${event.professional?.lastName}` ||
                              'Professionnel'}
                          </p>
                        </div>
                        <div className="mt-4 lg:mt-0">
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                              event.userParticipation?.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : event.userParticipation?.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : event.userParticipation?.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {event.userParticipation?.status === 'confirmed'
                              ? 'Confirmée'
                              : event.userParticipation?.status === 'pending'
                                ? 'En attente'
                                : event.userParticipation?.status === 'cancelled'
                                  ? 'Annulée'
                                  : 'Inscrit'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                          <div className="bg-blue-100 p-2 rounded-full mr-4">
                            <FaCalendarAlt className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(event.date), 'EEEE d MMMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                          <div className="bg-green-100 p-2 rounded-full mr-4">
                            <FaClock className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Heure</p>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(event.date), 'HH:mm', { locale: fr })}
                              {event.endDate &&
                                ` - ${format(new Date(event.endDate), 'HH:mm', { locale: fr })}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                          <div className="bg-purple-100 p-2 rounded-full mr-4">
                            <FaMapMarkerAlt className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Lieu</p>
                            <p className="font-semibold text-gray-900">
                              {event.address || 'Lieu non spécifié'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                          <div className="bg-yellow-100 p-2 rounded-full mr-4">
                            <FaEuroSign className="text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Prix</p>
                            <p className="font-semibold text-gray-900">
                              {event.price === 0
                                ? 'Gratuit'
                                : `${event.price} ${event.currency || 'MAD'}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {event.description && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                          <h4 className="font-semibold text-blue-900 mb-2">Description</h4>
                          <p className="text-blue-800 line-clamp-3">{event.description}</p>
                        </div>
                      )}

                      {/* Event stats */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg">
                            <FaUsers className="text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {event.participants?.filter(p => p.status !== 'cancelled').length ||
                                0}
                              /{event.maxParticipants} participants
                            </span>
                          </div>
                          {event.stats && event.stats.totalReviews > 0 && (
                            <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-lg">
                              <FaStar className="text-yellow-500 mr-2" />
                              <span className="text-sm font-medium text-gray-700">
                                {event.stats.averageRating} ({event.stats.totalReviews} avis)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions based on event status */}
                      <div className="flex justify-end space-x-4">
                        <Link
                          to={`/events/${event._id}`}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Voir détails
                        </Link>
                        {event.userParticipation?.status === 'pending' ||
                        event.userParticipation?.status === 'confirmed' ? (
                          <>
                            {new Date(event.endDate || event.date) >= new Date() && (
                              <button
                                onClick={() => cancelEventRegistration(event._id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                Annuler inscription
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="mb-6">
                  <FaUsers className="mx-auto text-6xl text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {activeTab === 'upcoming'
                    ? "Vous n'êtes inscrit à aucun événement à venir"
                    : "Vous n'avez participé à aucun événement"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {activeTab === 'upcoming'
                    ? "Explorez notre liste d'événements pour vous inscrire"
                    : 'Vos participations passées aux événements apparaîtront ici'}
                </p>
                {activeTab === 'upcoming' && (
                  <Link
                    to="/events"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
                  >
                    Découvrir des événements
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, booking: null })}
        booking={reviewModal.booking}
        onReviewSubmitted={handleReviewSubmitted}
        existingReview={reviewModal.booking ? getExistingReview(reviewModal.booking) : null}
      />
    </div>
  );
};

export default BookingsPage;
