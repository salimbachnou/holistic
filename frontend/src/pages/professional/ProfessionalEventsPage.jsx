import {
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  TicketIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon as _FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import MapPicker from '../../components/Common/MapPicker';
import { useAuth } from '../../contexts/AuthContext';

const ProfessionalEventsPage = () => {
  const { user: _user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm();

  // Watch the address field to keep it in sync with the map
  const addressValue = watch('address');
  const eventTypeValue = watch('eventType');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Aucun token trouvé. Veuillez vous reconnecter.');
        return;
      }

      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const response = await axios.get(`${BASE_URL}/events/professional`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data || !response.data.events) {
        toast.error('Aucun événement trouvé');
        setEvents([]);
        return;
      }

      setEvents(response.data.events);
    } catch (error) {
      console.error('Detailed Error fetching events:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers,
        url: error.config?.url,
      });

      if (error.response) {
        switch (error.response.status) {
          case 401:
            toast.error('Non autorisé. Veuillez vous reconnecter.');
            break;
          case 403:
            toast.error('Accès refusé.');
            break;
          case 404:
            toast.error("Ressource non trouvée. Vérifiez l'URL de l'API.");
            break;
          case 500:
            toast.error('Erreur serveur. Veuillez réessayer plus tard.');
            break;
          default:
            toast.error('Erreur lors du chargement des événements');
        }
      } else if (error.request) {
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        toast.error('Erreur de configuration de la requête');
      }

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async data => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get the base API URL
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Préparer les données de l'événement
      const eventData = {
        ...data,
        locationCoordinates: data.eventType === 'in_person' ? locationCoordinates : null,
      };

      if (isEditing) {
        // Mise à jour d'un événement existant
        await axios.put(`${BASE_URL}/api/events/${selectedEvent._id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Événement mis à jour avec succès ! En attente d'approbation.");
      } else {
        // Création d'un nouvel événement
        await axios.post(`${BASE_URL}/api/events`, eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Événement créé avec succès ! En attente d'approbation.");
      }

      closeFormModal();
      fetchEvents(); // Recharger les événements après modification
    } catch (error) {
      console.error('Error saving event:', error);

      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers,
        });

        toast.error(error.response.data?.message || "Erreur lors de la sauvegarde de l'événement");
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
        toast.error('Erreur de configuration de la requête');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/events/${selectedEvent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Événement supprimé avec succès !');
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      fetchEvents(); // Recharger les événements après suppression
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || "Erreur lors de la suppression de l'événement");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size and type
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Type de fichier non autorisé. Utilisez JPG, PNG ou GIF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('La taille du fichier ne doit pas dépasser 10 Mo.');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', 'events');
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Token non trouvé. Veuillez vous reconnecter.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(`${API_URL}/api/uploads/events`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });

      // Check for successful response with imageUrl
      if (response.data && response.data.imageUrl) {
        const imageUrl = response.data.imageUrl;
        setValue('coverImages', [...(getValues('coverImages') || []), imageUrl]);
        toast.success('Image téléchargée avec succès');
      } else {
        throw new Error("Aucune URL d'image reçue du serveur");
      }
    } catch (error) {
      console.error('Detailed Error uploading image:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers,
        url: error.config?.url,
      });

      if (error.response) {
        // The request was made and the server responded with a status code
        switch (error.response.status) {
          case 400:
            toast.error('Requête invalide. Vérifiez le fichier.');
            break;
          case 401:
            toast.error('Non autorisé. Veuillez vous reconnecter.');
            break;
          case 413:
            toast.error('Fichier trop volumineux. Limite de 10 Mo. Limite de 10 Mo.');
            break;
          case 500:
            toast.error('Erreur serveur. Réessayez plus tard.');
            break;
          default:
            toast.error(
              `Erreur ${error.response.status}: ${
                error.response.data?.message || 'Échec du téléchargement'
              }`
            );
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
      } else {
        // Something happened in setting up the request
        toast.error('Erreur de configuration du téléchargement.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImageFromList = imageToRemove => {
    // Handle both direct image parameter and event object
    if (typeof imageToRemove === 'object' && imageToRemove.target) {
      // If it's an event object, prevent default and get the image from data attribute
      if (imageToRemove.preventDefault) {
        imageToRemove.preventDefault();
      }
      imageToRemove = imageToRemove.target.getAttribute('data-image');
    }

    const updatedImages = getValues('coverImages').filter(img => img !== imageToRemove);
    setValue('coverImages', updatedImages);
  };

  const openCreateModal = () => {
    reset({
      title: '',
      description: '',
      address: '',
      price: '',
      maxParticipants: '',
      bookingType: 'in_person_payment',
      date: '',
      endDate: '',
      coverImages: [],
      eventType: 'in_person',
      onlineLink: '',
    });
    setLocationCoordinates(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = event => {
    setSelectedEvent(event);

    // Pré-remplir le formulaire avec les données de l'événement
    setValue('title', event.title);
    setValue('description', event.description);
    setValue('address', event.address);
    setValue('price', event.price);
    setValue('maxParticipants', event.maxParticipants);
    setValue('bookingType', event.bookingType);
    setValue('date', formatDateForInput(event.date));
    setValue('endDate', formatDateForInput(event.endDate));
    setValue('coverImages', event.coverImages || []);
    setValue('eventType', event.eventType || 'in_person');
    setValue('onlineLink', event.onlineLink || '');

    setLocationCoordinates(event.locationCoordinates);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const openViewModal = event => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedEvent(null);
    setIsEditing(false);
    setShowMapPicker(false);
    setLocationCoordinates(null);
    reset();
  };

  // Fonctions utilitaires
  const formatDateForInput = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatDateForDisplay = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBookingTypeLabel = type => {
    switch (type) {
      case 'message_only':
        return 'Par messages uniquement';
      case 'in_person_payment':
        return 'En ligne avec paiement en personne';
      default:
        return type;
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const getStatusClass = status => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingTypeIcon = type => {
    switch (type) {
      case 'message_only':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
      case 'in_person_payment':
        return <TicketIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <TicketIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddressSelected = ({ address, coordinates }) => {
    setValue('address', address);
    setLocationCoordinates(coordinates);
    toast.success('Adresse sélectionnée avec succès');
  };

  const openDeleteModal = event => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleValueChange = value => {
    // Existing implementation
  };

  const handleStatusChange = value => {
    // Existing implementation
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Événements</h1>
          <p className="text-gray-600 mt-1">Gérez vos événements et ateliers</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Créer un événement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
              <_FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={fetchEvents}
              className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                <div className="h-48 bg-gray-200 relative">
                  {event.coverImages && event.coverImages.length > 0 ? (
                    <img
                      src={event.coverImages[0]}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <CalendarDaysIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}
                    >
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-lg">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    <span>{formatDateForDisplay(event.date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {event.eventType === 'online' ? 'Événement en ligne' : event.address}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>
                        {event.participants ? event.participants.length : 0}/{event.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {event.price?.amount || event.price} {event.price?.currency || 'MAD'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">{getBookingTypeIcon(event.bookingType)}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(event)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(event)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucun événement ne correspond à vos critères de recherche.'
                  : "Vous n'avez pas encore créé d'événement."}
              </p>
              <button onClick={openCreateModal} className="btn-primary">
                Créer votre premier événement
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de création/édition */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Modifier l'événement" : 'Créer un nouvel événement'}
                </h2>
                <button onClick={closeFormModal} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre / Nom *
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title', { required: 'Ce champ est requis' })}
                    className="input-field w-full"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows="4"
                    {...register('description', { required: 'Ce champ est requis' })}
                    className="input-field w-full"
                  ></textarea>
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Type d'événement (en ligne ou en présentiel) */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type d'événement *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        id="in_person"
                        type="radio"
                        value="in_person"
                        {...register('eventType', { required: 'Ce champ est requis' })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                      />
                      <label htmlFor="in_person" className="ml-3 flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">En présentiel</span>
                          <p className="text-xs text-gray-500">
                            L'événement se déroule à une adresse physique
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start">
                      <input
                        id="online"
                        type="radio"
                        value="online"
                        {...register('eventType', { required: 'Ce champ est requis' })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                      />
                      <label htmlFor="online" className="ml-3 flex items-start">
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">En ligne</span>
                          <p className="text-xs text-gray-500">
                            L'événement se déroule à distance via Zoom, Meet ou autre plateforme
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {errors.eventType && (
                    <p className="text-red-600 text-sm mt-1">{errors.eventType.message}</p>
                  )}
                </div>

                {/* Lien en ligne (visible uniquement si le type est 'online') */}
                {eventTypeValue === 'online' && (
                  <div>
                    <label
                      htmlFor="onlineLink"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Lien de l'événement en ligne *
                    </label>
                    <input
                      id="onlineLink"
                      type="text"
                      {...register('onlineLink', {
                        required: eventTypeValue === 'online' ? 'Ce champ est requis' : false,
                      })}
                      className="input-field w-full"
                      placeholder="Lien Zoom, Google Meet, etc."
                    />
                    {errors.onlineLink && (
                      <p className="text-red-600 text-sm mt-1">{errors.onlineLink.message}</p>
                    )}
                  </div>
                )}

                {/* Adresse avec carte améliorée - visible uniquement si le type est 'in_person' */}
                {eventTypeValue === 'in_person' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <label
                          htmlFor="address"
                          className="block text-sm font-semibold text-gray-700 flex items-center"
                        >
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          Localisation de l&apos;événement *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMapPicker(!showMapPicker)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-3 py-1 rounded-md border border-primary-200 hover:bg-primary-50 transition-colors"
                        >
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {showMapPicker ? 'Masquer la carte' : 'Choisir sur la carte'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <input
                          id="address"
                          type="text"
                          {...register('address', {
                            required:
                              eventTypeValue === 'in_person' ? 'Ce champ est requis' : false,
                          })}
                          className="input-field w-full"
                          placeholder="Adresse complète de l'événement"
                        />
                        {errors.address && (
                          <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                        )}

                        {locationCoordinates && (
                          <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded-md">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>
                              Position GPS enregistrée: {locationCoordinates.lat.toFixed(6)},{' '}
                              {locationCoordinates.lng.toFixed(6)}
                            </span>
                          </div>
                        )}

                        {showMapPicker && (
                          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                            <MapPicker
                              initialAddress={addressValue}
                              initialCoordinates={locationCoordinates}
                              onAddressSelected={handleAddressSelected}
                              height="400px"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date et heures améliorées */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Planification de l&apos;événement
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Date et heure de début *
                        </label>
                        <div className="relative">
                          <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="date"
                            type="datetime-local"
                            {...register('date', {
                              required: 'Ce champ est requis',
                              validate: value => {
                                const selectedDate = new Date(value);
                                const now = new Date();
                                if (selectedDate <= now) {
                                  return 'La date doit être dans le futur';
                                }
                                return true;
                              },
                            })}
                            className="input-field w-full pl-10"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        {errors.date && (
                          <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Date et heure de fin *
                        </label>
                        <div className="relative">
                          <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="endDate"
                            type="datetime-local"
                            {...register('endDate', {
                              required: 'Ce champ est requis',
                              validate: value => {
                                const startDate = watch('date');
                                if (startDate && new Date(value) <= new Date(startDate)) {
                                  return 'La date de fin doit être après la date de début';
                                }
                                return true;
                              },
                            })}
                            className="input-field w-full pl-10"
                            min={watch('date') || new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        {errors.endDate && (
                          <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prix et participants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (MAD) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', {
                        required: 'Ce champ est requis',
                        min: { value: 0, message: 'Le prix ne peut pas être négatif' },
                      })}
                      className="input-field w-full"
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="maxParticipants"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nombre maximum de participants *
                    </label>
                    <input
                      id="maxParticipants"
                      type="number"
                      {...register('maxParticipants', {
                        required: 'Ce champ est requis',
                        min: { value: 1, message: 'Au moins un participant est requis' },
                      })}
                      className="input-field w-full"
                      min="1"
                    />
                    {errors.maxParticipants && (
                      <p className="text-red-600 text-sm mt-1">{errors.maxParticipants.message}</p>
                    )}
                  </div>
                </div>

                {/* Type de réservation amélioré */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de réservation *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        id="message_only"
                        type="radio"
                        value="message_only"
                        {...register('bookingType', { required: 'Ce champ est requis' })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                      />
                      <label htmlFor="message_only" className="ml-3 flex items-start">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Par messages uniquement
                          </span>
                          <p className="text-xs text-gray-500">
                            Les clients vous contactent directement par message
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start">
                      <input
                        id="in_person_payment"
                        type="radio"
                        value="in_person_payment"
                        {...register('bookingType', { required: 'Ce champ est requis' })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-1"
                      />
                      <label htmlFor="in_person_payment" className="ml-3 flex items-start">
                        <TicketIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Réservation en ligne, paiement en personne
                          </span>
                          <p className="text-xs text-gray-500">
                            Les clients réservent en ligne et paient sur place
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  {errors.bookingType && (
                    <p className="text-red-600 text-sm mt-1">{errors.bookingType.message}</p>
                  )}
                </div>

                {/* Images de couverture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image(s) de couverture
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className={`relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none ${
                            uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <span>
                            {uploadingImage
                              ? 'Téléchargement en cours...'
                              : 'Télécharger une image'}
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF jusqu&apos;à 10MB</p>
                    </div>
                  </div>

                  {getValues('coverImages') && getValues('coverImages').length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {getValues('coverImages').map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Couverture ${index + 1}`}
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              handleRemoveImageFromList(image);
                            }}
                            data-image={image}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button type="button" onClick={closeFormModal} className="btn-secondary">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="btn-primary flex items-center"
                  >
                    {loading && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    )}
                    {isEditing ? 'Mettre à jour' : "Créer l'événement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer l&apos;événement &quot;{selectedEvent.title}&quot;
              ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleDeleteEvent}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {selectedEvent.coverImages && selectedEvent.coverImages.length > 0 && (
                <div className="mb-6">
                  <img
                    src={selectedEvent.coverImages[0]}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date et heure</h3>
                  <p className="text-gray-900 mt-1">{formatDateForDisplay(selectedEvent.date)}</p>
                  <p className="text-gray-600 text-sm">
                    Fin: {formatDateForDisplay(selectedEvent.endDate)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Lieu</h3>
                  <p className="text-gray-900 mt-1">
                    {selectedEvent.eventType === 'online'
                      ? 'Événement en ligne'
                      : selectedEvent.address}
                  </p>
                  {selectedEvent.eventType === 'online' && selectedEvent.onlineLink && (
                    <a
                      href={selectedEvent.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm underline"
                    >
                      Lien de l'événement
                    </a>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Prix</h3>
                  <p className="text-gray-900 mt-1">
                    {selectedEvent.price?.amount || selectedEvent.price}{' '}
                    {selectedEvent.price?.currency || 'MAD'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Participants</h3>
                  <p className="text-gray-900 mt-1">
                    {selectedEvent.participants ? selectedEvent.participants.length : 0}/
                    {selectedEvent.maxParticipants}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Type de réservation</h3>
                <div className="flex items-center">
                  {getBookingTypeIcon(selectedEvent.bookingType)}
                  <span className="ml-2">{getBookingTypeLabel(selectedEvent.bookingType)}</span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedEvent);
                  }}
                  className="btn-secondary flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openDeleteModal(selectedEvent);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalEventsPage;
