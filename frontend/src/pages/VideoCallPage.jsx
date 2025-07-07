import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import VideoCallComponent from '../components/VideoCall/VideoCallComponent';
import { useAuth } from '../contexts/AuthContext';

const VideoCallPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [videoAccessToken, setVideoAccessToken] = useState(null);

  // Get the correct user ID (the user object uses 'id' instead of '_id')
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!user || !userId) {
      setError('Vous devez être connecté pour accéder à cette session');
      setLoading(false);
      return;
    }

    const fetchSecureSessionData = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        if (!token) {
          setError("Token d'authentification manquant");
          return;
        }

        // Use the secure video access endpoint
        const response = await axios.get(`${API_URL}/api/sessions/${sessionId}/video-access`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) {
          setError(response.data.message || 'Impossible de charger les données de la session');
          return;
        }

        const { session, user: sessionUser, videoAccessToken } = response.data;

        // Store the video access token for validation
        setVideoAccessToken(videoAccessToken);

        // Create the session data object
        const sessionData = {
          sessionId: session.id,
          title: session.title,
          status: session.status,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime),
          duration: session.duration,
          professional: {
            id: session.professional.id,
            name: session.professional.name,
          },
          user: {
            id: sessionUser.id,
            name: sessionUser.name,
            role: sessionUser.role,
          },
          maxParticipants: session.maxParticipants,
          currentParticipants: session.currentParticipants,
        };

        setSessionData(sessionData);

        // Verify token periodically to ensure continued access
        const verifyInterval = setInterval(async () => {
          try {
            await axios.post(`${API_URL}/api/sessions/video-verify-token`, {
              videoAccessToken,
            });
          } catch (error) {
            console.error('Token verification failed:', error);
            clearInterval(verifyInterval);
            setError('Votre session a expiré. Veuillez vous reconnecter.');
            toast.error('Session expirée');
          }
        }, 60000); // Verify every minute

        // Cleanup interval on component unmount
        return () => clearInterval(verifyInterval);
      } catch (err) {
        console.error('Error fetching secure session data:', err);

        if (err.response?.status === 403) {
          setError(err.response.data.message || 'Accès refusé à cette session');
        } else if (err.response?.status === 404) {
          setError('Session non trouvée');
        } else if (err.response?.status === 401) {
          setError('Authentification requise');
        } else {
          setError('Erreur lors du chargement de la session');
        }

        toast.error('Erreur lors du chargement de la session vidéo');
      } finally {
        setLoading(false);
      }
    };

    fetchSecureSessionData();
  }, [sessionId, user, userId]);

  const handleEndCall = () => {
    // Clear the video access token
    setVideoAccessToken(null);
    toast.success('Vous avez quitté la session');
    navigate('/sessions');
  };

  const handleSecurityError = errorMessage => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <LoadingSpinner />
          <p className="mt-4">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md p-6 bg-gray-800 rounded-lg">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => navigate('/sessions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mr-2"
          >
            Retour aux sessions
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData || !videoAccessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Session inaccessible</h2>
          <p className="mb-6">Impossible d'accéder à cette session vidéo.</p>
          <button
            onClick={() => navigate('/sessions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour aux sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoCallComponent
      sessionId={sessionData.sessionId}
      professionalId={sessionData.professional.id}
      clientId={sessionData.user.id}
      currentUserId={sessionData.user.id}
      currentUserRole={sessionData.user.role}
      currentUserName={sessionData.user.name}
      videoAccessToken={videoAccessToken}
      onEndCall={handleEndCall}
      onSecurityError={handleSecurityError}
    />
  );
};

export default VideoCallPage;
