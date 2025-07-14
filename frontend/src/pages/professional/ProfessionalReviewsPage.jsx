import {
  StarIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
  TagIcon,
  FunnelIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import apiService from '../../services/api.service';

const ProfessionalReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentType: '',
    status: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      const response = await apiService.get(`/reviews/professional?${queryParams}`);
      setReviews(response.data.reviews || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      toast.error('Erreur lors de la récupération des notes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = page => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      await apiService.put(`/reviews/${reviewId}/status`, { status: newStatus });
      toast.success('Statut mis à jour avec succès');
      fetchReviews(); // Refresh the list
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) {
      toast.error('Veuillez saisir une réponse');
      return;
    }

    try {
      setSubmittingResponse(true);
      await apiService.put(`/reviews/${selectedReview._id}/response`, {
        response: responseText.trim(),
      });

      toast.success('Réponse envoyée avec succès');
      setIsResponseModalOpen(false);
      setResponseText('');
      setSelectedReview(null);
      fetchReviews(); // Refresh the list
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const renderStars = rating => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className="text-lg">
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = status => {
    const statusConfig = {
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'En attente' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approuvé' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejeté' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getContentTypeLabel = contentType => {
    const types = {
      product: 'Produit',
      event: 'Événement',
      session: 'Session',
    };
    return types[contentType] || contentType;
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-slate-200/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Avis et Notes
                </h1>
                <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                  Gérez les avis de vos clients et répondez à leurs commentaires
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchReviews}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-3 sm:px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 rounded-lg">
              <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Filtres</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Type de contenu</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                value={filters.contentType}
                onChange={e => handleFilterChange('contentType', e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="product">Produits</option>
                <option value="event">Événements</option>
                <option value="session">Sessions</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Statut</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Par page</label>
              <select
                className="border border-slate-300 rounded-xl w-full py-2 sm:py-3 px-3 sm:px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                value={filters.limit}
                onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => {
                  setFilters({
                    contentType: '',
                    status: '',
                    page: 1,
                    limit: 10,
                  });
                }}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des notes */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200/60">
          {reviews.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-4 rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
                  <ChatBubbleLeftIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">
                  Aucun avis trouvé
                </h3>
                <p className="text-slate-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  {filters.contentType || filters.status
                    ? 'Aucun avis ne correspond à vos critères de filtrage.'
                    : "Vous n'avez pas encore reçu d'avis de vos clients."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-2 rounded-lg">
                  <ChatBubbleLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Avis reçus ({reviews.length})
                </h3>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {reviews.map(review => (
                  <div
                    key={review._id}
                    className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-base sm:text-lg font-semibold text-slate-900">
                            {review.rating}/5
                          </span>
                        </div>
                        {getStatusBadge(review.status)}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-slate-500">{formatDate(review.createdAt)}</p>
                        <p className="text-sm text-slate-600">
                          {getContentTypeLabel(review.contentType)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                        {review.contentTitle}
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                        {review.comment}
                      </p>
                    </div>

                    {review.tags && review.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {review.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Par:</span>
                        <span className="font-medium">
                          {review.clientId?.firstName} {review.clientId?.lastName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {review.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(review._id, 'approved')}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
                            >
                              <CheckIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Approuver</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(review._id, 'rejected')}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
                            >
                              <XMarkIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Rejeter</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setIsResponseModalOpen(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Répondre
                        </button>
                      </div>
                    </div>

                    {review.professionalResponse && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <PaperAirplaneIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Votre réponse</span>
                        </div>
                        <p className="text-blue-700 text-sm sm:text-base">
                          {review.professionalResponse}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Répondu le {formatDate(review.respondedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6 sm:mt-8 px-4">
            <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Précédent</span>
                <span className="sm:hidden">Préc.</span>
              </button>

              {/* Show fewer page numbers on mobile */}
              <div className="flex space-x-1 sm:space-x-2">
                {pagination.pages <= 5 ? (
                  // Show all pages if 5 or fewer
                  [...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                ) : (
                  // Show condensed pagination for many pages
                  <>
                    {pagination.page > 2 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="px-2 sm:px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        >
                          1
                        </button>
                        {pagination.page > 3 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {[pagination.page - 1, pagination.page, pagination.page + 1]
                      .filter(page => page >= 1 && page <= pagination.pages)
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${
                            pagination.page === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    {pagination.page < pagination.pages - 1 && (
                      <>
                        {pagination.page < pagination.pages - 2 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(pagination.pages)}
                          className="px-2 sm:px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        >
                          {pagination.pages}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${
                  pagination.page === pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Suivant</span>
                <span className="sm:hidden">Suiv.</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Modal de réponse */}
      {isResponseModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Répondre à l'avis</h2>
                <button
                  onClick={() => {
                    setIsResponseModalOpen(false);
                    setSelectedReview(null);
                    setResponseText('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Avis original */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {renderStars(selectedReview.rating)}
                  <span className="font-semibold text-slate-900">{selectedReview.rating}/5</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">
                  {selectedReview.contentTitle}
                </h4>
                <p className="text-slate-700 text-sm sm:text-base">{selectedReview.comment}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Par {selectedReview.clientId?.firstName} {selectedReview.clientId?.lastName} -{' '}
                  {formatDate(selectedReview.createdAt)}
                </p>
              </div>

              {/* Formulaire de réponse */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Votre réponse *
                </label>
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Répondez à ce commentaire..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                  maxLength={1000}
                />
                <p className="text-sm text-slate-500 mt-1">{responseText.length}/1000 caractères</p>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsResponseModalOpen(false);
                    setSelectedReview(null);
                    setResponseText('');
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse || !responseText.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submittingResponse ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      Envoyer la réponse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalReviewsPage;
