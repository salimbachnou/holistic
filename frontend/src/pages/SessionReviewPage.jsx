import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const SessionReviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    wouldRecommend: true,
    aspects: {
      content: 0,
      communication: 0,
      professionalism: 0,
      value: 0,
    },
  });

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Fetch session details
      const sessionResponse = await axios.get(`${API_URL}/api/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (sessionResponse.data.success) {
        setSession(sessionResponse.data.session);
        setProfessional(sessionResponse.data.session.professional);
      }

      // Check if user already reviewed this session
      const reviewResponse = await axios.get(`${API_URL}/api/reviews/session/${sessionId}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (reviewResponse.data.success && reviewResponse.data.review) {
        setExistingReview(reviewResponse.data.review);
        setFormData({
          rating: reviewResponse.data.review.rating,
          comment: reviewResponse.data.review.comment || '',
          wouldRecommend: reviewResponse.data.review.wouldRecommend !== false,
          aspects: reviewResponse.data.review.aspects || {
            content: 0,
            communication: 0,
            professionalism: 0,
            value: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      if (error.response?.status === 404) {
        toast.error('Session non trouvée');
        navigate('/');
      } else if (error.response?.status === 403) {
        toast.error("Vous n'avez pas participé à cette session");
        navigate('/');
      } else {
        toast.error('Erreur lors du chargement des détails');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.error('Veuillez donner une note globale');
      return;
    }

    if (formData.comment.trim().length < 10) {
      toast.error('Votre commentaire doit contenir au moins 10 caractères');
      return;
    }

    setSubmitting(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const reviewData = {
        sessionId: sessionId,
        rating: formData.rating,
        comment: formData.comment.trim(),
        wouldRecommend: formData.wouldRecommend,
        aspects: formData.aspects,
      };

      let response;
      if (existingReview) {
        // Update existing review
        response = await axios.put(`${API_URL}/api/reviews/${existingReview._id}`, reviewData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new review
        response = await axios.post(`${API_URL}/api/reviews/session`, reviewData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.success) {
        toast.success(existingReview ? 'Avis mis à jour avec succès!' : 'Merci pour votre avis!');
        setTimeout(() => {
          navigate('/sessions');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingChange = rating => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleAspectRatingChange = (aspect, rating) => {
    setFormData(prev => ({
      ...prev,
      aspects: {
        ...prev.aspects,
        [aspect]: rating,
      },
    }));
  };

  const renderStars = (rating, onRatingChange, size = 'h-8 w-8') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`${size} transition-colors duration-200 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            {star <= rating ? (
              <StarIcon className="w-full h-full" />
            ) : (
              <StarOutlineIcon className="w-full h-full" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session non trouvée</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingReview ? 'Modifier votre avis' : 'Donnez votre avis'}
          </h1>
          <p className="text-gray-600">
            Votre expérience nous intéresse et peut aider d'autres clients
          </p>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {session.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{session.title}</h2>
              <p className="text-gray-600">{session.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>📅 {new Date(session.startTime).toLocaleDateString('fr-FR')}</span>
                <span>⏱️ {session.duration} minutes</span>
                <span>👨‍💼 {professional?.businessName || 'Professionnel'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overall Rating */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Note globale de votre expérience
              </h3>
              {renderStars(formData.rating, handleRatingChange)}
              <p className="text-sm text-gray-500 mt-2">
                Cliquez sur les étoiles pour donner votre note
              </p>
            </div>

            {/* Detailed Aspects */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Évaluez les aspects spécifiques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu de la session
                  </label>
                  {renderStars(
                    formData.aspects.content,
                    rating => handleAspectRatingChange('content', rating),
                    'h-6 w-6'
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication
                  </label>
                  {renderStars(
                    formData.aspects.communication,
                    rating => handleAspectRatingChange('communication', rating),
                    'h-6 w-6'
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professionnalisme
                  </label>
                  {renderStars(
                    formData.aspects.professionalism,
                    rating => handleAspectRatingChange('professionalism', rating),
                    'h-6 w-6'
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rapport qualité-prix
                  </label>
                  {renderStars(
                    formData.aspects.value,
                    rating => handleAspectRatingChange('value', rating),
                    'h-6 w-6'
                  )}
                </div>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire *
              </label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Partagez votre expérience détaillée avec cette session..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 10 caractères ({formData.comment.length}/10)
              </p>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recommanderiez-vous cette session ?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    checked={formData.wouldRecommend === true}
                    onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                    className="mr-2"
                  />
                  <span className="text-green-600">👍 Oui, je recommande</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    checked={formData.wouldRecommend === false}
                    onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                    className="mr-2"
                  />
                  <span className="text-red-600">👎 Non, je ne recommande pas</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || formData.rating === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? 'Envoi...' : existingReview ? 'Mettre à jour' : 'Publier mon avis'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Review Notice */}
        {existingReview && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Vous avez déjà laissé un avis pour cette session. Vous pouvez le modifier
                  ci-dessus.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionReviewPage;
