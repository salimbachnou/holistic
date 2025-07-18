import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiEye, FiEdit2, FiCalendar, FiDownload, FiClock } from 'react-icons/fi';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    professional: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'appointmentDate',
    sortOrder: 'desc',
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query string from filters
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/bookings?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings(response.data.bookings);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setTotalBookings(response.data.totalBookings);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Erreur lors de la récupération des réservations');
      setLoading(false);
      toast.error('Erreur lors de la récupération des réservations');
    }
  };

  // Effect to fetch bookings when page or filters change
  useEffect(() => {
    fetchBookings();
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle booking status update
  const updateBookingStatus = async (bookingId, newStatus, adminNotes) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'https://holistic-maroc-backend.onrender.com'}/api/admin/bookings/${bookingId}/status`,
        { status: newStatus, adminNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Statut de la réservation mis à jour: ${newStatus}`);
      fetchBookings(); // Refresh bookings
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle pagination
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return 'Non spécifié';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Format time for display
  const formatTime = (start, end) => {
    if (!start || !end) return 'Non spécifié';
    return `${start} - ${end}`;
  };

  // Format price for display
  const formatPrice = (amount, currency = 'MAD') => {
    if (amount === undefined || amount === null) {
      return `0.00 ${currency}`;
    }
    return `${Number(amount).toFixed(2)} ${currency}`;
  };

  // Open booking details modal
  const openBookingModal = booking => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  // Render booking status badge
  const renderStatusBadge = status => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Non présenté',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100'}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Réservations</h1>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => {
            /* Export functionality */
          }}
        >
          <FiDownload className="mr-2" /> Exporter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <FiCalendar className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Réservations</p>
              <p className="text-xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <FiClock className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-xl font-semibold">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <FiCalendar className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Confirmées</p>
              <p className="text-xl font-semibold">{stats.confirmed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <FiCalendar className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terminées</p>
              <p className="text-xl font-semibold">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 mr-4">
              <FiCalendar className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Annulées</p>
              <p className="text-xl font-semibold">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
              <option value="no_show">Non présenté</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tri par</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="appointmentDate">Date de rendez-vous</option>
              <option value="createdAt">Date de création</option>
              <option value="totalAmount.amount">Montant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Réservation
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Client
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Professionnel
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date & Heure
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Montant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length > 0 ? (
                  bookings.map(booking => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.bookingNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.client
                          ? `${booking.client.firstName} ${booking.client.lastName}`
                          : 'Client inconnu'}
                        <div className="text-xs text-gray-400">{booking.client?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.professional?.businessName || 'Non spécifié'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(booking.appointmentDate)}</div>
                        <div className="text-xs flex items-center mt-1">
                          <FiClock className="mr-1" size={12} />
                          {formatTime(booking.appointmentTime?.start, booking.appointmentTime?.end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatPrice(booking.totalAmount?.amount, booking.totalAmount?.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openBookingModal(booking)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Voir les détails"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => {
                              /* Edit functionality */
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucune réservation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-l-md border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Précédent
                </button>

                {[...Array(totalPages).keys()].map(page => (
                  <button
                    key={page + 1}
                    onClick={() => handlePageChange(page + 1)}
                    className={`px-3 py-1 border-t border-b ${
                      currentPage === page + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-r-md border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Suivant
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Détails de la réservation {selectedBooking.bookingNumber}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Informations client</h3>
                  <p className="text-sm">
                    <span className="font-medium">Nom:</span> {selectedBooking.client?.firstName}{' '}
                    {selectedBooking.client?.lastName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {selectedBooking.client?.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Téléphone:</span>{' '}
                    {selectedBooking.client?.phone || 'Non spécifié'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Informations professionnel</h3>
                  <p className="text-sm">
                    <span className="font-medium">Nom:</span>{' '}
                    {selectedBooking.professional?.businessName || 'Non spécifié'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    {selectedBooking.professional?.businessType || 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Détails du rendez-vous</h3>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(selectedBooking.appointmentDate)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Heure:</span>{' '}
                    {formatTime(
                      selectedBooking.appointmentTime?.start,
                      selectedBooking.appointmentTime?.end
                    )}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Service:</span> {selectedBooking.service?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Durée:</span> {selectedBooking.service?.duration}{' '}
                    minutes
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type de lieu:</span>{' '}
                    {selectedBooking.location?.type === 'in_person'
                      ? 'En personne'
                      : selectedBooking.location?.type === 'online'
                        ? 'En ligne'
                        : selectedBooking.location?.type === 'home_visit'
                          ? 'À domicile'
                          : 'Non spécifié'}
                  </p>
                  {selectedBooking.location?.address && (
                    <p className="text-sm">
                      <span className="font-medium">Adresse:</span>{' '}
                      {selectedBooking.location.address.street},{' '}
                      {selectedBooking.location.address.city},{' '}
                      {selectedBooking.location.address.postalCode},{' '}
                      {selectedBooking.location.address.country}
                    </p>
                  )}
                  {selectedBooking.location?.onlineLink && (
                    <p className="text-sm">
                      <span className="font-medium">Lien:</span>{' '}
                      {selectedBooking.location.onlineLink}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Informations de paiement</h3>
                  <p className="text-sm">
                    <span className="font-medium">Montant total:</span>{' '}
                    {formatPrice(
                      selectedBooking.totalAmount?.amount,
                      selectedBooking.totalAmount?.currency
                    )}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Statut du paiement:</span>{' '}
                    {selectedBooking.paymentStatus === 'paid'
                      ? 'Payé'
                      : selectedBooking.paymentStatus === 'pending'
                        ? 'En attente'
                        : selectedBooking.paymentStatus === 'failed'
                          ? 'Échoué'
                          : selectedBooking.paymentStatus === 'refunded'
                            ? 'Remboursé'
                            : selectedBooking.paymentStatus || 'Non spécifié'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Méthode de paiement:</span>{' '}
                    {selectedBooking.paymentMethod || 'Non spécifié'}
                  </p>
                </div>
              </div>

              {selectedBooking.clientNotes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Notes du client</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedBooking.clientNotes}</p>
                </div>
              )}

              {selectedBooking.professionalNotes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Notes du professionnel</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {selectedBooking.professionalNotes}
                  </p>
                </div>
              )}

              {selectedBooking.adminNotes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Notes administratives</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedBooking.adminNotes}</p>
                </div>
              )}

              {/* Booking Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Mettre à jour le statut</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].map(
                    status => (
                      <button
                        key={status}
                        onClick={() => updateBookingStatus(selectedBooking._id, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.status === status
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'pending'
                          ? 'En attente'
                          : status === 'confirmed'
                            ? 'Confirmé'
                            : status === 'in_progress'
                              ? 'En cours'
                              : status === 'completed'
                                ? 'Terminé'
                                : status === 'cancelled'
                                  ? 'Annulé'
                                  : status === 'no_show'
                                    ? 'Non présenté'
                                    : status}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
