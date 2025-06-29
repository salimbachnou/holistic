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

  // Get the correct user ID (the user object uses 'id' instead of '_id')
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!user || !userId) return;

    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        // Récupérer les détails de la session
        const response = await axios.get(`${API_URL}/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) {
          setError('Impossible de charger les données de la session');
          return;
        }

        const session = response.data.session;

        // Vérifier si la session est configurée pour l'appel vidéo intégré
        if (!session.useBuiltInVideo) {
          setError("Cette session n'est pas configurée pour l'appel vidéo intégré");
          return;
        }

        // Vérifier si l'utilisateur est autorisé à rejoindre cette session
        const isParticipant = session.participants.some(participant => {
          const participantId = typeof participant === 'object' ? participant._id : participant;
          return participantId === userId || participantId.toString() === userId.toString();
        });

        const isProfessional =
          session.professionalId &&
          (session.professionalId._id === userId ||
            session.professionalId._id?.toString() === userId?.toString() ||
            (session.professionalId.userId && session.professionalId.userId === userId) ||
            (session.professionalId.userId &&
              session.professionalId.userId.toString() === userId.toString()));

        if (!isParticipant && !isProfessional && user.role !== 'admin') {
          setError("Vous n'êtes pas autorisé à rejoindre cette session");
          return;
        }

        // Créer l'objet sessionData
        const sessionData = {
          sessionId: session._id,
          title: session.title,
          status: session.status,
          startTime: new Date(session.startTime),
          endTime: new Date(new Date(session.startTime).getTime() + session.duration * 60000),
          professional: {
            id:
              session.professionalId.userId || session.professionalId._id || session.professionalId,
            name: session.professionalId.businessName || 'Professionnel',
          },
          client: {
            id: userId,
            name: `${user.firstName} ${user.lastName}`,
          },
        };

        setSessionData(sessionData);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError('Impossible de charger les données de la session');
        toast.error('Erreur lors du chargement de la session vidéo');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, user, userId]);

  const handleEndCall = () => {
    toast.success('Vous avez quitté la session');
    navigate('/sessions');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <LoadingSpinner />
          <p className="mt-4">Préparation de votre session vidéo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md p-6 bg-gray-800 rounded-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Erreur de connexion</h2>
          <p className="mb-6">{error}</p>
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

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Session introuvable</h2>
          <p className="mb-6">Cette session n'existe pas ou a expiré.</p>
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
      clientId={sessionData.client.id}
      currentUserId={userId}
      currentUserRole={user.role}
      onEndCall={handleEndCall}
    />
  );
};

export default VideoCallPage;
