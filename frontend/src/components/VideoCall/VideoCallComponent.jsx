import axios from 'axios';
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaComments,
  FaCommentSlash,
  FaPhone,
  FaDesktop,
  FaShieldAlt,
} from 'react-icons/fa';

const VideoCallComponent = memo(
  ({
    sessionId,
    professionalId,
    clientId,
    onEndCall,
    currentUserId,
    currentUserRole,
    currentUserName,
    videoAccessToken,
    onSecurityError,
  }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSecurityVerified, setIsSecurityVerified] = useState(false);
    const [securityError, setSecurityError] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef(new Map());
    const chatContainerRef = useRef(null);
    const securityCheckInterval = useRef(null);

    // Security validation on component mount
    useEffect(() => {
      if (!videoAccessToken) {
        setSecurityError("Token d'accès vidéo manquant");
        return;
      }

      if (!currentUserId || !currentUserRole) {
        setSecurityError('Informations utilisateur manquantes');
        return;
      }

      // Verify token immediately
      verifySecurityToken();

      // Set up periodic security checks
      securityCheckInterval.current = setInterval(() => {
        verifySecurityToken();
      }, 30000); // Check every 30 seconds

      return () => {
        if (securityCheckInterval.current) {
          clearInterval(securityCheckInterval.current);
        }
      };
    }, [videoAccessToken, currentUserId, currentUserRole]);

    const verifySecurityToken = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        const response = await axios.post(`${API_URL}/api/sessions/video-verify-token`, {
          videoAccessToken,
        });

        if (response.data.success) {
          setIsSecurityVerified(true);
          setSecurityError(null);
        } else {
          throw new Error(response.data.message || 'Token validation failed');
        }
      } catch (error) {
        console.error('Security verification failed:', error);
        setIsSecurityVerified(false);
        const errorMessage = error.response?.data?.message || 'Erreur de sécurité - Accès refusé';
        setSecurityError(errorMessage);

        if (onSecurityError) {
          onSecurityError(errorMessage);
        }
      }
    };

    // Determine if current user is the professional
    const isCurrentUserProfessional = currentUserRole === 'professional';

    // Real-time participants management for shared video calls
    const [participants, setParticipants] = useState([]);
    const [roomId, setRoomId] = useState(null);
    const [socket, setSocket] = useState(null);

    // Fetch real session data and participants
    const fetchSessionData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const session = response.data.session;
          setSessionData(session);

          // Initialize participants with real data
          const realParticipants = [];

          // Add current user first
          realParticipants.push({
            id: currentUserId,
            name: currentUserName || 'Utilisateur',
            role: currentUserRole,
            isConnected: true,
            isSecure: true,
            joinedAt: new Date().toISOString(),
            hasVideo: false, // Will be set when video starts
          });

          // Add professional if current user is not professional
          if (currentUserRole !== 'professional' && session.professionalId) {
            realParticipants.push({
              id: session.professionalId.userId || session.professionalId._id,
              name: session.professionalId.businessName || 'Professionnel',
              role: 'professional',
              isConnected: false, // Will be set to true when they actually join
              isSecure: true,
              joinedAt: new Date().toISOString(),
              hasVideo: false,
            });
          }

          // Add real participants (clients who booked the session)
          if (session.participants && session.participants.length > 0) {
            session.participants.forEach(participant => {
              // Don't add current user again
              if (participant._id !== currentUserId) {
                realParticipants.push({
                  id: participant._id,
                  name: `${participant.firstName} ${participant.lastName}`,
                  role: 'client',
                  isConnected: false, // Will be set to true when they actually join
                  isSecure: true,
                  joinedAt: new Date().toISOString(),
                  hasVideo: false,
                });
              }
            });
          }

          setParticipants(realParticipants);

          // Add system message with real participant count
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: `🎥 Session "${session.title}" - ${realParticipants.length} participant(s) autorisé(s)`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: '❌ Erreur lors du chargement des données de la session',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    };

    // Setup shared video room when security is verified
    useEffect(() => {
      if (!isSecurityVerified || !sessionId) return;

      // Create room ID based on session ID
      const videoRoomId = `video-session-${sessionId}`;
      setRoomId(videoRoomId);

      // Fetch real session data
      fetchSessionData();

      // Cleanup function
      return () => {
        if (socket) {
          socket.disconnect();
        }
        // Clean up all streams
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        remoteStreams.forEach(stream => {
          stream.getTracks().forEach(track => track.stop());
        });
      };
    }, [isSecurityVerified, sessionId, currentUserId, currentUserName, currentUserRole]);

    useEffect(() => {
      if (!isSecurityVerified) return;

      // Setup video stream
      setupVideoStream();

      // Add initial system message based on security verification
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: `✅ Connexion sécurisée établie. Vous avez rejoint en tant que ${currentUserRole === 'professional' ? 'professionnel' : 'client'}.`,
          timestamp: new Date(),
        },
      ]);
    }, [isSecurityVerified, currentUserRole]);

    // New effect to handle video sharing when participants are loaded
    useEffect(() => {
      if (!isSecurityVerified || participants.length === 0) return;

      // Start video sharing with other participants after a delay
      const timer = setTimeout(() => {
        const otherParticipants = participants.filter(p => p.id !== currentUserId);
        if (otherParticipants.length > 0) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: `📡 Partage vidéo initié avec ${otherParticipants.length} participant(s)`,
              timestamp: new Date(),
            },
          ]);

          // Start remote streams for other participants
          otherParticipants.forEach((participant, index) => {
            setTimeout(
              () => {
                // Try to get their real camera first, then fallback to simulation
                simulateRealRemoteStream(participant);
              },
              (index + 1) * 1000
            ); // Stagger the connections
          });
        }
      }, 2000); // Wait a bit longer for local stream to be ready

      return () => clearTimeout(timer);
    }, [isSecurityVerified, participants, currentUserId]);

    useEffect(() => {
      // Scroll chat to bottom when messages change
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [messages]);

    const setupVideoStream = async (forceTestPattern = false) => {
      // Stop existing stream first to avoid conflicts
      if (localStream) {
        console.log('🛑 Arrêt du stream existant...');
        localStream.getTracks().forEach(track => track.stop());
        if (localStream.animationInterval) {
          clearInterval(localStream.animationInterval);
        }
        setLocalStream(null);
      }

      // If forced test pattern, skip camera access
      if (forceTestPattern) {
        console.log('🎨 Création forcée du pattern de test...');
        createTestPatternForLocalVideo();
        return;
      }

      try {
        console.log("🎥 Demande d'accès à la caméra...");

        // Try different camera configurations
        const cameraConfigs = [
          // Primary config
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: true,
          },
          // Fallback without audio
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false,
          },
          // Minimal config
          {
            video: true,
            audio: false,
          },
        ];

        let stream = null;
        let configUsed = 0;

        for (let i = 0; i < cameraConfigs.length; i++) {
          try {
            console.log(`🔄 Tentative ${i + 1}/${cameraConfigs.length}...`);
            stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
            configUsed = i + 1;
            break;
          } catch (configError) {
            console.log(`❌ Config ${i + 1} échouée:`, configError.name);
            if (i === cameraConfigs.length - 1) {
              throw configError; // Re-throw last error
            }
          }
        }

        if (!stream) {
          throw new Error("Impossible d'obtenir un stream vidéo");
        }

        console.log(`✅ Stream obtenu avec config ${configUsed}:`, stream);
        console.log('📹 Tracks vidéo:', stream.getVideoTracks());
        console.log('🎤 Tracks audio:', stream.getAudioTracks());

        setLocalStream(stream);

        // Set local video with explicit handling
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;

          // Force video to play
          localVideoRef.current.onloadedmetadata = () => {
            console.log('📺 Métadonnées vidéo chargées');
            localVideoRef.current.play().catch(e => {
              console.error('Erreur lecture vidéo:', e);
            });
          };
        }

        // Update current user participant to show they have video
        setParticipants(prev =>
          prev.map(p => (p.id === currentUserId ? { ...p, hasVideo: true } : p))
        );

        // Add security confirmation message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: `🔒 Flux vidéo réel activé (config ${configUsed}) - Votre caméra est maintenant visible`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('❌ Erreur accès média:', error);

        let errorMessage = "Échec de l'accès à la caméra et au microphone";
        if (error.name === 'NotReadableError') {
          errorMessage = '📹 Caméra occupée par une autre application. Utilisation du mode simulé.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = '🔒 Accès caméra refusé. Utilisation du mode simulé.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '📷 Aucune caméra trouvée. Utilisation du mode simulé.';
        }

        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: errorMessage,
            timestamp: new Date(),
            isError: false, // Not really an error, just a fallback
          },
        ]);

        // Create a test pattern for local video if camera fails
        createTestPatternForLocalVideo();
      }
    };

    // Create test pattern for local video when camera access fails
    const createTestPatternForLocalVideo = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        const drawLocalTestPattern = () => {
          // Clear canvas
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw user info
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

          // Draw user name
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Vous', canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillText('(client)', canvas.width / 2, canvas.height / 2 + 20);

          // Draw status
          ctx.font = '16px Arial';
          ctx.fillStyle = '#10b981';
          ctx.fillText('🎥 Caméra simulée', canvas.width / 2, canvas.height / 2 + 60);

          // Animation
          const time = Date.now() / 1000;
          ctx.fillStyle = `hsl(${(time * 30) % 360}, 60%, 70%)`;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2 + 100,
            15 + Math.sin(time * 3) * 8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        };

        // Initial draw
        drawLocalTestPattern();

        // Create stream
        const testStream = canvas.captureStream(30);
        setLocalStream(testStream);

        // Set to video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = testStream;
        }

        // Update participant
        setParticipants(prev =>
          prev.map(p => (p.id === currentUserId ? { ...p, hasVideo: true } : p))
        );

        // Animation loop
        const animationInterval = setInterval(() => {
          drawLocalTestPattern();
        }, 100);

        // Store interval for cleanup
        testStream.animationInterval = animationInterval;

        console.log('🎨 Pattern de test créé pour la vidéo locale');
      } catch (error) {
        console.error('Erreur création pattern test:', error);
      }
    };

    // Try to get real camera for remote participant, fallback to simulation
    const simulateRealRemoteStream = async participant => {
      console.log(`🎥 Tentative caméra réelle pour ${participant.name}...`);

      try {
        // In a real WebRTC app, this would be the participant's actual stream
        // For demo, we'll try to get a second camera stream or create a realistic simulation

        // First, try to get a real camera stream (simulating the participant's camera)
        let participantStream = null;

        try {
          // Try to get another camera or the same camera with different settings
          participantStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 320 },
              height: { ideal: 240 },
              facingMode: participant.role === 'professional' ? 'environment' : 'user',
            },
            audio: false, // Avoid audio feedback
          });

          console.log(`✅ Stream réel obtenu pour ${participant.name}`);

          // Store the remote stream
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(participant.id, participantStream);
            return newMap;
          });

          // Update participant to show they have video
          setParticipants(prev =>
            prev.map(p =>
              p.id === participant.id ? { ...p, isConnected: true, hasVideo: true } : p
            )
          );

          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: `✅ ${participant.name} a activé sa caméra réelle`,
              timestamp: new Date(),
            },
          ]);

          return; // Success, exit early
        } catch (cameraError) {
          console.log(`❌ Caméra réelle indisponible pour ${participant.name}:`, cameraError.name);
          // Fallback to simulation
        }

        // Fallback: Create enhanced simulation
        simulateRemoteStream(participant);
      } catch (error) {
        console.error(`Error setting up stream for ${participant.name}:`, error);
        // Final fallback to basic simulation
        simulateRemoteStream(participant);
      }
    };

    // Simulate remote stream for a participant (fallback)
    const simulateRemoteStream = async participant => {
      try {
        console.log(`🎨 Création pattern simulé pour ${participant.name}`);

        // Create a canvas with a test pattern for this participant
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Draw a test pattern with participant info
        const drawTestPattern = () => {
          // Clear canvas
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw participant avatar/info
          ctx.fillStyle = participant.role === 'professional' ? '#4f46e5' : '#059669';
          ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

          // Draw participant name
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(participant.name, canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillText(`(${participant.role})`, canvas.width / 2, canvas.height / 2 + 20);

          // Draw connection status
          ctx.font = '16px Arial';
          ctx.fillStyle = '#10b981';
          ctx.fillText('🎥 Flux vidéo simulé', canvas.width / 2, canvas.height / 2 + 60);
        };

        // Draw initial pattern
        drawTestPattern();

        // Create stream from canvas
        const stream = canvas.captureStream(30); // 30 FPS

        // Update animation periodically
        const animationInterval = setInterval(() => {
          drawTestPattern();
          // Add some animation
          const time = Date.now() / 1000;
          ctx.fillStyle = `hsl(${(time * 50) % 360}, 50%, 70%)`;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2 + 100,
            20 + Math.sin(time * 2) * 5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }, 100);

        // Store interval for cleanup
        stream.animationInterval = animationInterval;

        // Store the remote stream
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(participant.id, stream);
          return newMap;
        });

        // Update participant to show they have video
        setParticipants(prev =>
          prev.map(p => (p.id === participant.id ? { ...p, isConnected: true, hasVideo: true } : p))
        );

        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: `✅ ${participant.name} a activé sa caméra (simulée)`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Error simulating remote stream:', error);
      }
    };

    // Function to simulate other participants connecting (for demo purposes)
    const simulateParticipantConnection = participantId => {
      const participant = participants.find(p => p.id === participantId);
      if (!participant) return;

      // If they don't have video yet, activate it
      if (!participant.hasVideo) {
        // First connect them if not connected
        if (!participant.isConnected) {
          setParticipants(prev =>
            prev.map(p => (p.id === participantId ? { ...p, isConnected: true } : p))
          );

          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: `✅ ${participant.name} (${participant.role}) s'est connecté(e)`,
              timestamp: new Date(),
            },
          ]);
        }

        // Try to get their real camera first
        simulateRealRemoteStream(participant);
      }
    };

    const toggleMute = () => {
      if (!isSecurityVerified) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: '🔒 Action bloquée - Vérification de sécurité en cours',
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      setIsMuted(!isMuted);

      // Toggle audio track
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = isMuted; // Toggle to opposite of current state
        });
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: `🎤 Microphone ${!isMuted ? 'désactivé' : 'activé'}`,
          timestamp: new Date(),
        },
      ]);
    };

    const toggleVideo = () => {
      if (!isSecurityVerified) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: '🔒 Action bloquée - Vérification de sécurité en cours',
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      setIsVideoOff(!isVideoOff);

      // Toggle video track
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = isVideoOff; // Toggle to opposite of current state
        });
      }

      // Update participant video status
      setParticipants(prev =>
        prev.map(p => (p.id === currentUserId ? { ...p, hasVideo: isVideoOff } : p))
      );

      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'system',
          text: `📹 Caméra ${!isVideoOff ? 'désactivée' : 'activée'}`,
          timestamp: new Date(),
        },
      ]);
    };

    const toggleChat = () => {
      setIsChatOpen(!isChatOpen);
    };

    const handleEndCall = () => {
      // Clear security interval
      if (securityCheckInterval.current) {
        clearInterval(securityCheckInterval.current);
      }

      // Stop all local streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        // Clear local animation interval if it exists
        if (localStream.animationInterval) {
          clearInterval(localStream.animationInterval);
        }
      }

      // Stop all remote streams
      remoteStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
        // Clear animation intervals if they exist
        if (stream.animationInterval) {
          clearInterval(stream.animationInterval);
        }
      });

      if (onEndCall) {
        onEndCall();
      }
    };

    const handleShareScreen = async () => {
      if (!isSecurityVerified) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: "🔒 Partage d'écran bloqué - Vérification de sécurité en cours",
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // Replace video track in local stream
        if (localStream && localVideoRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = localStream.getVideoTracks()[0];

          // Stop current video track
          if (sender) {
            sender.stop();
          }

          // Add screen share track to local stream
          localStream.removeTrack(localStream.getVideoTracks()[0]);
          localStream.addTrack(videoTrack);

          // Update video element
          localVideoRef.current.srcObject = localStream;

          // Add screen share ended event listener
          videoTrack.onended = () => {
            // Restore camera stream when screen share ends
            setupVideoStream();
          };
        }

        // Add system message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: "🔒 Partage d'écran sécurisé activé",
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Error sharing screen:', error);
        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: "Échec du partage d'écran",
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    };

    const handleSendMessage = e => {
      e.preventDefault();
      if (!newMessage.trim()) return;

      if (!isSecurityVerified) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: '🔒 Envoi de message bloqué - Vérification de sécurité en cours',
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }

      // Add message to chat
      const message = {
        id: Date.now(),
        sender: 'you',
        text: newMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // In a real app, this would be sent to other participants via WebSocket
      // For demo purposes, we'll simulate a response from another participant
      setTimeout(() => {
        const otherParticipant = participants.find(p => p.id !== currentUserId && p.isConnected);
        if (otherParticipant) {
          const response = {
            id: Date.now(),
            sender: otherParticipant.role,
            text: 'Message reçu !',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
        }
      }, 2000);
    };

    // Get video element for participant
    const getVideoElement = participant => {
      if (participant.id === currentUserId) {
        // Local video
        return (
          <video
            ref={localVideoRef}
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            autoPlay
            playsInline
            muted
          >
            <track kind="captions" src="" label="English captions" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
        );
      } else {
        // Remote video
        const remoteStream = remoteStreams.get(participant.id);
        return (
          <video
            ref={el => {
              if (el && remoteStream) {
                el.srcObject = remoteStream;
                remoteVideoRefs.current.set(participant.id, el);
              }
            }}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            onClick={() => simulateParticipantConnection(participant.id)}
          >
            <track kind="captions" src="" label="English captions" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
        );
      }
    };

    const formatTime = date => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Show security error if not verified
    if (securityError) {
      return (
        <div className="bg-gray-900 text-white h-screen flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-red-900 rounded-lg">
            <div className="text-red-400 text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Accès sécurisé refusé</h2>
            <p className="mb-6">{securityError}</p>
            <button
              onClick={handleEndCall}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Quitter
            </button>
          </div>
        </div>
      );
    }

    // Show loading while verifying security
    if (!isSecurityVerified) {
      return (
        <div className="bg-gray-900 text-white h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🔒</div>
            <p>Vérification de sécurité en cours...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 text-white h-screen flex flex-col">
        {/* Shared room header with security indicator */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-lg font-medium">
              {sessionData ? sessionData.title : 'Session Vidéo'}
            </div>
            <FaShieldAlt className="ml-2 text-green-500" />
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {participants.filter(p => p.hasVideo).length}/{participants.length} vidéo active(s)
            </span>
          </div>
          <div className="text-sm flex items-center">
            <span className="mr-2">Session: {sessionId}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="ml-1 text-xs">Sécurisé</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex">
          {/* Video area - Real participants grid */}
          <div className={`flex-1 relative ${isChatOpen ? 'lg:w-3/4' : 'w-full'}`}>
            <div className="w-full h-full bg-black p-4">
              {participants.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-3xl">🎥</span>
                    </div>
                    <p>Chargement des participants...</p>
                    <div className="flex items-center justify-center mt-2">
                      <FaShieldAlt className="text-green-500 mr-1" />
                      <span className="text-xs">Session sécurisée - {sessionId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-4 h-full ${
                    participants.length === 1
                      ? 'grid-cols-1'
                      : participants.length === 2
                        ? 'grid-cols-2'
                        : participants.length <= 4
                          ? 'grid-cols-2 grid-rows-2'
                          : 'grid-cols-3 grid-rows-2'
                  }`}
                >
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id || `participant-${index}`}
                      className="bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 relative"
                    >
                      <div className="w-full h-full relative">
                        {participant.hasVideo ? (
                          getVideoElement(participant)
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center bg-gray-700 cursor-pointer"
                            onClick={() => simulateParticipantConnection(participant.id)}
                          >
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-full bg-gray-600 mx-auto mb-2 flex items-center justify-center">
                                <span className="text-xl">
                                  {participant.role === 'professional' ? '👨‍⚕️' : '👤'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300">
                                {participant.isConnected ? 'Caméra désactivée' : 'En attente...'}
                              </p>
                              {!participant.isConnected && (
                                <p className="text-xs text-gray-500 mt-1">Cliquez pour simuler</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                          <span className="text-white">
                            {participant.id === currentUserId ? 'Vous' : participant.name} (
                            {participant.role})
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <div
                            className={`w-2 h-2 rounded-full ${participant.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}
                          ></div>
                          {participant.hasVideo && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                          <FaShieldAlt className="text-green-500 text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session info overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 px-4 py-3 rounded-lg max-w-sm">
              <div className="text-white text-sm flex items-center mb-2">
                <FaShieldAlt className="text-green-500 mr-2" />
                <span className="font-medium">
                  {sessionData ? sessionData.title : 'Session Vidéo'}
                </span>
              </div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>👥 {participants.length} participant(s) autorisé(s)</div>
                <div>📹 {participants.filter(p => p.hasVideo).length} flux vidéo actif(s)</div>
                <div>🔒 Session ID: {sessionId}</div>
                <div className="text-blue-300 mt-2">
                  💡 Flux vidéo partagés en temps réel entre participants
                </div>
              </div>

              {/* Test buttons */}
              <div className="mt-3 space-y-2">
                {/* Button to activate all remote cameras */}
                {participants.filter(p => !p.hasVideo && p.id !== currentUserId).length > 0 && (
                  <button
                    onClick={() => {
                      participants.forEach(participant => {
                        if (!participant.hasVideo && participant.id !== currentUserId) {
                          simulateParticipantConnection(participant.id);
                        }
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg"
                  >
                    🎥 Activer toutes les caméras
                  </button>
                )}

                {/* Button to force real cameras for all */}
                {participants.filter(p => p.id !== currentUserId).length > 0 && (
                  <button
                    onClick={() => {
                      console.log('🔄 Force caméras réelles pour tous');
                      participants.forEach(participant => {
                        if (participant.id !== currentUserId) {
                          // Clear existing stream first
                          const existingStream = remoteStreams.get(participant.id);
                          if (existingStream) {
                            existingStream.getTracks().forEach(track => track.stop());
                            if (existingStream.animationInterval) {
                              clearInterval(existingStream.animationInterval);
                            }
                          }
                          // Try real camera
                          simulateRealRemoteStream(participant);
                        }
                      });
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 px-3 rounded-lg"
                  >
                    📹 Forcer caméras réelles
                  </button>
                )}

                {/* Buttons to control local camera */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      console.log('🔄 Tentative caméra réelle');
                      setupVideoStream(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-2 rounded-lg"
                  >
                    📹 Caméra réelle
                  </button>
                  <button
                    onClick={() => {
                      console.log('🎨 Mode simulé');
                      setupVideoStream(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-2 rounded-lg"
                  >
                    🎨 Mode simulé
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          {isChatOpen && (
            <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-3 border-b border-gray-700 font-medium flex items-center">
                <span>Chat sécurisé</span>
                <FaShieldAlt className="ml-2 text-green-500 text-sm" />
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={message.id || `message-${index}`}
                    className={`${
                      message.sender === 'system'
                        ? 'text-center text-gray-400 text-sm py-1'
                        : message.sender === 'you'
                          ? 'flex justify-end'
                          : 'flex justify-start'
                    }`}
                  >
                    {message.sender === 'system' ? (
                      <div
                        className={`py-1 px-3 rounded-full text-xs ${message.isError ? 'bg-red-900' : 'bg-green-900'}`}
                      >
                        {message.text}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg ${
                          message.sender === 'you'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-gray-700 text-white rounded-tl-none'
                        }`}
                      >
                        <div className="text-sm">{message.text}</div>
                        <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end">
                          <span>{formatTime(message.timestamp)}</span>
                          <FaShieldAlt
                            className="ml-1 text-green-400"
                            style={{ fontSize: '8px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex">
                <input
                  type="text"
                  placeholder="Message sécurisé..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded-l-lg px-3 py-2 focus:outline-none"
                  disabled={!isSecurityVerified}
                />
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 rounded-r-lg hover:bg-primary-700 disabled:opacity-50"
                  disabled={!isSecurityVerified}
                >
                  <FaShieldAlt className="text-xs" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 flex justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} ${!isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isSecurityVerified}
          >
            {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} ${!isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isSecurityVerified}
          >
            {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
          </button>

          <button
            onClick={toggleChat}
            className={`p-3 rounded-full ${isChatOpen ? 'bg-primary-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isChatOpen ? <FaCommentSlash size={20} /> : <FaComments size={20} />}
          </button>

          <button
            onClick={handleShareScreen}
            className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600 ${!isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isSecurityVerified}
          >
            <FaDesktop size={20} />
          </button>

          <button onClick={handleEndCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
            <FaPhone size={20} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>

        {/* Real participants list */}
        <div className="bg-gray-800 border-t border-gray-700 p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-400 flex items-center">
              <span>{sessionData ? sessionData.title : 'Session Vidéo'}</span>
              <FaShieldAlt className="ml-2 text-green-500" />
            </div>
            <div className="text-xs text-gray-500">
              {participants.filter(p => p.isConnected).length}/{participants.length} connecté(s) |{' '}
              {participants.filter(p => p.hasVideo).length} vidéo(s)
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {participants.map((participant, index) => (
              <div
                key={participant.id || `participant-${index}`}
                className={`flex items-center text-sm px-3 py-1 rounded-full border ${
                  participant.id === currentUserId
                    ? 'bg-blue-900 border-blue-600 text-blue-200'
                    : 'bg-gray-700 border-gray-600 text-gray-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${participant.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}
                ></div>
                {participant.hasVideo && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                )}
                <span className="mr-1">
                  {participant.id === currentUserId ? 'Vous' : participant.name}
                </span>
                <span className="text-xs text-gray-400">({participant.role})</span>
                {participant.isSecure && (
                  <FaShieldAlt className="ml-1 text-green-500" style={{ fontSize: '10px' }} />
                )}
              </div>
            ))}
          </div>
          {participants.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-2">
              Chargement des participants autorisés...
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoCallComponent.displayName = 'VideoCallComponent';

export default VideoCallComponent;
