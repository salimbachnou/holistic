import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaExternalLinkAlt, FaVideo } from 'react-icons/fa';

const ZoomMeeting = ({ sessionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Récupérer les informations de la réunion
    const fetchMeetingInfo = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        // D'abord, vérifier si la session a une réunion Zoom associée
        const sessionResponse = await axios.get(`${API_URL}/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!sessionResponse.data.success) {
          setError('Erreur lors de la récupération des informations de la session');
          return;
        }

        const session = sessionResponse.data.session;

        // Vérifier si la session a un ID de réunion Zoom
        if (!session.zoomMeetingId) {
          setNeedsSetup(true);
          setLoading(false);
          return;
        }

        // Si la session a un ID de réunion Zoom, récupérer les détails
        const response = await axios.get(`${API_URL}/api/zoom/meetings/info/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setMeetingInfo(response.data.meeting);
        } else {
          setError('Erreur lors de la récupération des informations de la réunion');
          toast.error('Impossible de récupérer les informations de la réunion Zoom');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des informations de la réunion:', err);

        // Vérifier si l'erreur est due à l'absence de réunion Zoom
        if (
          err.response?.status === 400 &&
          err.response?.data?.message?.includes('pas de réunion Zoom')
        ) {
          setNeedsSetup(true);
        } else {
          setError(
            err.response?.data?.message ||
              'Erreur lors de la récupération des informations de la réunion'
          );
          toast.error('Impossible de récupérer les informations de la réunion Zoom');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingInfo();
  }, [sessionId]);

  const handleOpenZoomMeeting = () => {
    if (meetingInfo && meetingInfo.join_url) {
      window.open(meetingInfo.join_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Récupération des informations de la réunion
          </h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-primary-600 mb-4 text-center">
            <FaVideo className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Configuration requise</h2>
          <p className="text-gray-600 mb-4 text-center">
            Cette session n'a pas encore de réunion Zoom configurée. Veuillez contacter le
            professionnel pour qu'il configure la réunion.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-red-600 mb-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Erreur</h2>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Réunion Zoom</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {meetingInfo ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{meetingInfo.topic}</h3>
              <p className="text-sm text-gray-500">ID: {meetingInfo.id}</p>
              <p className="text-sm text-gray-500">Mot de passe: {meetingInfo.password}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                Cliquez sur le bouton ci-dessous pour ouvrir la réunion Zoom dans une nouvelle
                fenêtre.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleOpenZoomMeeting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
              >
                <FaExternalLinkAlt className="mr-2" />
                Rejoindre la réunion Zoom
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center">Aucune information de réunion disponible</p>
        )}
      </div>
    </div>
  );
};

export default ZoomMeeting;
