import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  User,
  Calendar,
  MessageCircle,
  Award,
  CheckCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import apiService from '../services/api';

const ProfessionalDetailsPage = () => {
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState(null);

  const { id } = useParams();

  // Check if API is reachable
  useEffect(() => {
    const checkApiHealth = async () => {
      const healthStatus = await apiService.checkHealth();
      setApiStatus(healthStatus);

      if (!healthStatus.isConnected) {
        setError(`Erreur de connexion au serveur: ${healthStatus.message}`);
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  useEffect(() => {
    const fetchProfessionalDetails = async () => {
      // Don't fetch if API is unreachable
      if (apiStatus && !apiStatus.isConnected) {
        return;
      }

      try {
        setLoading(true);

        // Use the API service instead of axios directly
        const data = await apiService.get(`/professionals/${id}`);
        setProfessional(data.professional);
      } catch (err) {
        console.error('Error fetching professional details:', err);

        // Set a more user-friendly error message based on the error type
        if (err.response) {
          if (err.response.status === 404) {
            setError("Ce professionnel n'existe pas ou a été supprimé");
          } else {
            setError(
              err.response.data?.message || 'Impossible de récupérer les détails du professionnel'
            );
          }
        } else if (err.request) {
          setError(
            'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet.'
          );
        } else {
          setError('Une erreur est survenue lors de la récupération des détails');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && (!apiStatus || apiStatus.isConnected)) {
      fetchProfessionalDetails();
    }
  }, [id, apiStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Une erreur est survenue</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          {apiStatus && !apiStatus.isConnected ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <p className="text-yellow-800 font-medium">Statut du serveur: Non connecté</p>
              </div>
              <p className="text-sm text-yellow-700">
                Assurez-vous que le serveur backend est en cours d'exécution sur le port 5000
              </p>
            </div>
          ) : null}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Professionnel non trouvé</h2>
          <p className="text-gray-600 leading-relaxed">
            Le professionnel que vous recherchez n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img
                  className="w-full h-full object-cover"
                  src={
                    professional.userId?.profileImage ||
                    professional.coverImages?.[0] ||
                    'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=400'
                  }
                  alt={professional.businessName}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="text-center lg:text-left flex-1">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm text-sm font-medium mb-4">
                <Award className="w-4 h-4 mr-2" />
                {professional.businessType}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{professional.businessName}</h1>
              <p className="text-lg lg:text-xl opacity-90 mb-6 leading-relaxed max-w-2xl">
                {professional.description}
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  <span className="font-medium">4.9 (127 avis)</span>
                </div>
                <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Disponible en ligne</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specializations */}
            {professional.activities && professional.activities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-white">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Award className="w-6 h-6 mr-3 text-blue-600" />
                  Spécialisations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professional.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-800">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {professional.services && professional.services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-white">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-3 text-green-600" />
                  Services proposés
                </h2>
                <div className="grid gap-6">
                  {professional.services.map((service, index) => (
                    <div
                      key={index}
                      className="group p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-blue-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {service.price?.amount || service.price}{' '}
                            {service.price?.currency || 'MAD'}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">{service.description}</p>
                      <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 font-medium">
                        Réserver ce service
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-white sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Contact</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">
                      {professional.contactInfo?.email || professional.userId?.email}
                    </p>
                  </div>
                </div>

                {professional.contactInfo?.phone && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-800">{professional.contactInfo.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 font-medium flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Prendre rendez-vous
                </button>
                <button className="w-full bg-white text-gray-800 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 font-medium flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contacter
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Clients satisfaits</span>
                  <span className="font-bold text-green-600">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Années d'expérience</span>
                  <span className="font-bold text-blue-600">5+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux de réponse</span>
                  <span className="font-bold text-orange-600">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Note moyenne</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-bold text-yellow-600">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetailsPage;
