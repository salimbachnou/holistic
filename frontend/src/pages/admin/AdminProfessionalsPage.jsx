import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon as _FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon as _XCircleIcon,
  EyeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  Cog6ToothIcon,
  TagIcon,
  PlayIcon,
  PauseIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const AdminProfessionalsPage = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_selectedProfessional, _setSelectedProfessional] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    businessType: '',
    isVerified: '',
    isActive: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  // Activity types management
  const [activityTypes, setActivityTypes] = useState([]);
  const [showActivityTypesModal, setShowActivityTypesModal] = useState(false);
  const [editingActivityType, setEditingActivityType] = useState(null);
  const [activityTypesLoading, setActivityTypesLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProfessionalDetails, setSelectedProfessionalDetails] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const {
    register: registerActivityType,
    handleSubmit: handleActivityTypeSubmit,
    formState: { errors: activityTypeErrors },
    reset: resetActivityTypeForm,
    setValue: setActivityTypeValue,
  } = useForm();

  const businessTypes = activityTypes
    .filter(type => type.isActive)
    .map(type => ({
      value: type.value,
      label: type.label,
    }));

  useEffect(() => {
    fetchProfessionals();
    fetchActivityTypes();
  }, [filters]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/professionals?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfessionals(response.data.docs || []);
      setPagination({
        totalPages: response.data.totalPages,
        currentPage: response.data.page,
        totalDocs: response.data.totalDocs,
      });
    } catch (error) {
      console.error('Error fetching professionals:', error);
      toast.error('Erreur lors du chargement des professionnels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfessional = async data => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/professionals`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Professionnel créé avec succès');
      setShowCreateModal(false);
      reset();
      fetchProfessionals();

      // Show credentials
      toast.success(
        `Identifiants: ${response.data.credentials.email} / ${response.data.credentials.password}`,
        { duration: 10000 }
      );
    } catch (error) {
      console.error('Error creating professional:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteProfessional = async id => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce professionnel ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/professionals/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Professionnel supprimé avec succès');
      fetchProfessionals();
    } catch (error) {
      console.error('Error deleting professional:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpdateStatus = async (id, field, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/professionals/${id}`,
        { [field]: value },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Statut mis à jour avec succès');
      fetchProfessionals();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Activity types management functions
  const fetchActivityTypes = async () => {
    try {
      setActivityTypesLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/activity-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActivityTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching activity types:', error);
      toast.error("Erreur lors du chargement des types d'activité");
    } finally {
      setActivityTypesLoading(false);
    }
  };

  const handleCreateActivityType = async data => {
    try {
      const token = localStorage.getItem('token');

      // Ensure all required fields are present with defaults
      const activityTypeData = {
        ...data,
        description: data.description || '',
        category: data.category || 'wellness',
        color: data.color || '#059669',
        icon: data.icon || 'default',
        order: data.order || 0,
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/activity-types`,
        activityTypeData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Type d'activité créé avec succès");
      setShowActivityTypesModal(false);
      resetActivityTypeForm();
      fetchActivityTypes();
    } catch (error) {
      console.error('Error creating activity type:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateActivityType = async data => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/activity-types/${editingActivityType._id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Type d'activité mis à jour avec succès");
      setShowActivityTypesModal(false);
      setEditingActivityType(null);
      resetActivityTypeForm();
      fetchActivityTypes();
    } catch (error) {
      console.error('Error updating activity type:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteActivityType = async id => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce type d'activité ?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/activity-types/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Type d'activité supprimé avec succès");
      fetchActivityTypes();
    } catch (error) {
      console.error('Error deleting activity type:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActivityType = async id => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/activity-types/${id}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Statut du type d'activité mis à jour");
      fetchActivityTypes();
    } catch (error) {
      console.error('Error toggling activity type:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const openEditActivityType = activityType => {
    setEditingActivityType(activityType);
    setActivityTypeValue('value', activityType.value);
    setActivityTypeValue('label', activityType.label);
    setActivityTypeValue('description', activityType.description || '');
    setActivityTypeValue('category', activityType.category);
    setActivityTypeValue('color', activityType.color);
    setActivityTypeValue('icon', activityType.icon);
    setActivityTypeValue('order', activityType.order);
    setShowActivityTypesModal(true);
  };

  const openCreateActivityType = () => {
    setEditingActivityType(null);
    resetActivityTypeForm();
    setShowActivityTypesModal(true);
  };

  const openProfessionalDetails = professional => {
    setSelectedProfessionalDetails(professional);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (isVerified, isActive) => {
    if (!isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Inactif
        </span>
      );
    }
    if (!isVerified) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          En attente
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Vérifié
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Professionnels</h1>
          <p className="text-gray-600 mt-1">Gérez les comptes professionnels de la plateforme</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateActivityType}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <TagIcon className="h-5 w-5" />
            <span>Types d'Activité</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nouveau Professionnel</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nom d'entreprise, téléphone..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité</label>
            <select
              value={filters.businessType}
              onChange={e => setFilters({ ...filters, businessType: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous</option>
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut de vérification
            </label>
            <select
              value={filters.isVerified}
              onChange={e => setFilters({ ...filters, isVerified: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous</option>
              <option value="true">Vérifiés</option>
              <option value="false">Non vérifiés</option>
            </select>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut d'activité
            </label>
            <select
              value={filters.isActive}
              onChange={e => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Professional List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des professionnels...</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun professionnel trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professionnel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type d'activité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {professionals.map(professional => (
                  <tr key={professional._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {professional.businessName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {professional.userId?.firstName} {professional.userId?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {businessTypes.find(t => t.value === professional.businessType)?.label ||
                          professional.businessType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {professional.userId?.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {professional.contactInfo?.phone || professional.userId?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(professional.isVerified, professional.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(professional.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Toggle Verification */}
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              professional._id,
                              'isVerified',
                              !professional.isVerified
                            )
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            professional.isVerified
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                          title={
                            professional.isVerified
                              ? 'Retirer la vérification'
                              : 'Vérifier le professionnel'
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() =>
                            handleUpdateStatus(professional._id, 'isActive', !professional.isActive)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            professional.isActive
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title={professional.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {professional.isActive ? (
                            <PlayIcon className="h-4 w-4" />
                          ) : (
                            <PauseIcon className="h-4 w-4" />
                          )}
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => openProfessionalDetails(professional)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Voir les détails"
                        >
                          <InformationCircleIcon className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteProfessional(professional._id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Affichage de {(pagination.currentPage - 1) * filters.limit + 1} à{' '}
              {Math.min(pagination.currentPage * filters.limit, pagination.totalDocs)} sur{' '}
              {pagination.totalDocs} professionnels
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Professional Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowCreateModal(false)}
            ></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-lg max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Créer un nouveau professionnel
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateProfessional)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'Le prénom est requis' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Le nom est requis' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: "L'email est requis",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Format d'email invalide",
                      },
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    {...register('phone', { required: 'Le téléphone est requis' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    {...register('businessName', { required: "Le nom de l'entreprise est requis" })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'activité *
                  </label>
                  <select
                    {...register('businessType', { required: "Le type d'activité est requis" })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe (optionnel)
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Laissez vide pour un mot de passe automatique"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Si laissé vide, le mot de passe par défaut sera "holistic123"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Description des services proposés..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Créer le professionnel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Activity Types Management Modal */}
      {showActivityTypesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowActivityTypesModal(false);
                setEditingActivityType(null);
                resetActivityTypeForm();
              }}
            ></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingActivityType
                    ? "Modifier le type d'activité"
                    : "Gestion des Types d'Activité"}
                </h3>
                <button
                  onClick={() => {
                    setShowActivityTypesModal(false);
                    setEditingActivityType(null);
                    resetActivityTypeForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Types List */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Types d'activité existants
                  </h4>
                  {activityTypesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {activityTypes.map(type => (
                        <div
                          key={type._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium text-gray-900">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.value}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleActivityType(type._id)}
                              className={`p-1 rounded ${
                                type.isActive
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={type.isActive ? 'Désactiver' : 'Activer'}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditActivityType(type)}
                              className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivityType(type._id)}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add/Edit Form */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    {editingActivityType ? 'Modifier le type' : 'Ajouter un nouveau type'}
                  </h4>
                  <form
                    onSubmit={handleActivityTypeSubmit(
                      editingActivityType ? handleUpdateActivityType : handleCreateActivityType
                    )}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du Type d'Activité *
                      </label>
                      <input
                        type="text"
                        {...registerActivityType('label', { required: 'Le nom est requis' })}
                        onChange={e => {
                          // Auto-generate value from label
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '');

                          setActivityTypeValue('value', value);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="ex: Yoga Thérapie"
                      />
                      {activityTypeErrors.label && (
                        <p className="mt-1 text-sm text-red-600">
                          {activityTypeErrors.label.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valeur (code) *
                      </label>
                      <input
                        type="text"
                        {...registerActivityType('value', {
                          required: 'La valeur est requise',
                          pattern: {
                            value: /^[a-z0-9_]+$/,
                            message:
                              'Utilisez uniquement des lettres minuscules, chiffres et underscores',
                          },
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="ex: yoga_therapie"
                      />
                      {activityTypeErrors.value && (
                        <p className="mt-1 text-sm text-red-600">
                          {activityTypeErrors.value.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActivityTypesModal(false);
                          setEditingActivityType(null);
                          resetActivityTypeForm();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        {editingActivityType ? 'Mettre à jour' : 'Créer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Professional Details Modal */}
      {showDetailsModal && selectedProfessionalDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            ></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Détails du Professionnel</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2 text-emerald-600" />
                      Informations de l'entreprise
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Nom de l'entreprise:
                        </span>
                        <p className="text-sm text-gray-900 font-semibold">
                          {selectedProfessionalDetails.businessName}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Type d'activité:</span>
                        <p className="text-sm text-gray-900">
                          {businessTypes.find(
                            t => t.value === selectedProfessionalDetails.businessType
                          )?.label || selectedProfessionalDetails.businessType}
                        </p>
                      </div>
                      {selectedProfessionalDetails.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Description:</span>
                          <p className="text-sm text-gray-900">
                            {selectedProfessionalDetails.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Informations personnelles
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nom complet:</span>
                        <p className="text-sm text-gray-900 font-semibold">
                          {selectedProfessionalDetails.userId?.firstName}{' '}
                          {selectedProfessionalDetails.userId?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-sm text-gray-900">
                          {selectedProfessionalDetails.userId?.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Téléphone:</span>
                        <p className="text-sm text-gray-900">
                          {selectedProfessionalDetails.contactInfo?.phone ||
                            selectedProfessionalDetails.userId?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statuts et informations supplémentaires */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <Cog6ToothIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Statuts et configuration
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Statut de vérification:
                        </span>
                        {getStatusBadge(
                          selectedProfessionalDetails.isVerified,
                          selectedProfessionalDetails.isActive
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Compte actif:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedProfessionalDetails.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedProfessionalDetails.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date de création:</span>
                        <p className="text-sm text-gray-900">
                          {format(
                            new Date(selectedProfessionalDetails.createdAt),
                            'dd MMM yyyy à HH:mm',
                            { locale: fr }
                          )}
                        </p>
                      </div>
                      {selectedProfessionalDetails.updatedAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Dernière modification:
                          </span>
                          <p className="text-sm text-gray-900">
                            {format(
                              new Date(selectedProfessionalDetails.updatedAt),
                              'dd MMM yyyy à HH:mm',
                              { locale: fr }
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations de contact détaillées */}
                  {selectedProfessionalDetails.contactInfo && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
                        Informations de contact
                      </h4>
                      <div className="space-y-2">
                        {selectedProfessionalDetails.contactInfo.address && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Adresse:</span>
                            <p className="text-sm text-gray-900">
                              {selectedProfessionalDetails.contactInfo.address}
                            </p>
                          </div>
                        )}
                        {selectedProfessionalDetails.contactInfo.website && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Site web:</span>
                            <a
                              href={selectedProfessionalDetails.contactInfo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              {selectedProfessionalDetails.contactInfo.website}
                            </a>
                          </div>
                        )}
                        {selectedProfessionalDetails.contactInfo.socialMedia && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">
                              Réseaux sociaux:
                            </span>
                            <p className="text-sm text-gray-900">
                              {selectedProfessionalDetails.contactInfo.socialMedia}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions rapides */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Actions rapides</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          handleUpdateStatus(
                            selectedProfessionalDetails._id,
                            'isVerified',
                            !selectedProfessionalDetails.isVerified
                          );
                          setShowDetailsModal(false);
                        }}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          selectedProfessionalDetails.isVerified
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {selectedProfessionalDetails.isVerified
                          ? 'Retirer vérification'
                          : 'Vérifier'}
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(
                            selectedProfessionalDetails._id,
                            'isActive',
                            !selectedProfessionalDetails.isActive
                          );
                          setShowDetailsModal(false);
                        }}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          selectedProfessionalDetails.isActive
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {selectedProfessionalDetails.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteProfessional(selectedProfessionalDetails._id);
                          setShowDetailsModal(false);
                        }}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfessionalsPage;
