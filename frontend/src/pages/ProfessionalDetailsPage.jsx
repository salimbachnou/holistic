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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Une erreur est survenue</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {apiStatus && !apiStatus.isConnected ? (
            <div className="mb-4">
              <p className="text-yellow-600 mb-2">Statut du serveur: Non connecté</p>
              <p className="text-sm text-gray-500">
                Assurez-vous que le serveur backend est en cours d&apos;exécution sur le port 5000
              </p>
            </div>
          ) : null}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Professionnel non trouvé</h2>
          <p className="text-gray-600">
            Le professionnel que vous recherchez n&apos;existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img
              className="h-48 w-full object-cover md:w-48"
              src={
                professional.userId?.profileImage ||
                professional.coverImages?.[0] ||
                'https://via.placeholder.com/300x300?text=Photo+de+profil'
              }
              alt={professional.businessName}
            />
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-primary-500 font-semibold">
              {professional.businessType}
            </div>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{professional.businessName}</h1>
            <p className="mt-2 text-gray-600">{professional.description}</p>

            {professional.activities && professional.activities.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-800">Spécialisations</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {professional.activities.map((activity, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800">Contact</h2>
              <p className="mt-2 text-gray-600">
                Email: {professional.contactInfo?.email || professional.userId?.email}
                {professional.contactInfo?.phone && (
                  <>
                    <br />
                    Téléphone: {professional.contactInfo.phone}
                  </>
                )}
              </p>
            </div>

            <div className="mt-6">
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded mr-2">
                Prendre rendez-vous
              </button>
              <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                Contacter
              </button>
            </div>
          </div>
        </div>

        {professional.services && professional.services.length > 0 && (
          <div className="px-8 pb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Services proposés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professional.services.map((service, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                  <p className="text-primary-600 font-bold mt-2">
                    {service.price?.amount || service.price} {service.price?.currency || 'MAD'}
                  </p>
                  <p className="text-sm text-gray-500">{service.duration} min</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDetailsPage;
