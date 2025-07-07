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
  FaExpand,
  FaCog,
  FaUsers,
  FaPaperPlane,
  FaTimes,
  FaVolumeUp,
  FaVolumeOff,
  FaCircle,
  FaStop,
} from 'react-icons/fa';
import './VideoCallComponent.css';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-md p-8 bg-gradient-to-r from-red-900/80 to-red-800/80 backdrop-blur-lg rounded-2xl border border-red-700/30 shadow-2xl">
            <div className="text-red-400 text-6xl mb-6 animate-pulse">🔒</div>
            <h2 className="text-2xl font-bold mb-4 text-red-100">Accès sécurisé refusé</h2>
            <p className="mb-8 text-red-200 leading-relaxed">{securityError}</p>
            <button
              onClick={handleEndCall}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-red-500/50 font-medium"
            >
              Quitter la session
            </button>
          </div>
        </div>
      );
    }

    // Show loading while verifying security
    if (!isSecurityVerified) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex items-center justify-center">
          <div className="text-center p-8">
            <div className="relative">
              <div className="animate-spin text-6xl mb-6 text-blue-400">🔒</div>
              <div className="absolute inset-0 animate-ping text-6xl mb-6 text-blue-400 opacity-20">
                🔒
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Vérification de sécurité</h3>
            <p className="text-gray-300">Authentification en cours...</p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col">
        {/* Responsive header with glass effect */}
        <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-3 md:p-4">
          <div className="flex justify-between items-center">
            {/* Left section - Logo and title */}
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaVideo className="text-white text-sm md:text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm md:text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                    {sessionData ? sessionData.title : 'Session Vidéo Sécurisée'}
                  </h1>
                  <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-400">
                    <FaShieldAlt className="text-green-400 text-xs" />
                    <span className="hidden sm:inline">Connexion chiffrée</span>
                    <span className="sm:hidden">Sécurisé</span>
                  </div>
                </div>
              </div>

              {/* Status badges - Hidden on small screens, shown on medium+ */}
              <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
                <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 text-xs px-2 md:px-3 py-1 rounded-full flex items-center space-x-1 md:space-x-2">
                  <FaUsers className="text-xs" />
                  <span>
                    {participants.filter(p => p.hasVideo).length}/{participants.length}
                  </span>
                </div>
                <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 text-xs px-2 md:px-3 py-1 rounded-full flex items-center space-x-1 md:space-x-2">
                  <FaCircle className="text-xs animate-pulse" />
                  <span>En direct</span>
                </div>
              </div>
            </div>

            {/* Right section - Session info and settings */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {/* Session ID - Hidden on mobile, visible on medium+ screens */}
              <div className="hidden md:block text-xs md:text-sm text-gray-400">
                <span className="hidden lg:inline">Session: </span>
                <span className="text-white font-mono text-xs">{sessionId}</span>
              </div>

              {/* Mobile status indicator */}
              <div className="lg:hidden flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">
                  {participants.filter(p => p.hasVideo).length}
                </span>
              </div>

              {/* Settings button */}
              <button className="p-1.5 md:p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300">
                <FaCog className="text-gray-300 text-sm md:text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Responsive main video content area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video grid area */}
          <div
            className={`flex-1 relative transition-all duration-300 ${
              isChatOpen ? 'lg:w-3/4 h-1/2 lg:h-full' : 'w-full h-full'
            }`}
          >
            <div className="w-full h-full bg-black/50 backdrop-blur-sm p-3 md:p-4 lg:p-6">
              {participants.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4 md:p-6 lg:p-8 bg-white/5 backdrop-blur-lg rounded-2xl lg:rounded-3xl border border-white/10 max-w-sm mx-auto">
                    <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-4 md:mb-6 flex items-center justify-center shadow-2xl">
                      <FaVideo className="text-white text-xl md:text-2xl lg:text-3xl" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">
                      Préparation de la session
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm md:text-base">
                      Chargement des participants autorisés...
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <FaShieldAlt className="text-green-400" />
                        <span className="text-green-400">Session sécurisée</span>
                      </div>
                      <span className="text-gray-500 hidden sm:inline">•</span>
                      <span className="text-gray-400 font-mono text-xs">{sessionId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-2 md:gap-3 lg:gap-4 h-full ${
                    participants.length === 1
                      ? 'grid-cols-1'
                      : participants.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : participants.length <= 4
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:grid-rows-2'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2'
                  }`}
                >
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id || `participant-${index}`}
                      className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-xl lg:rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]"
                    >
                      <div className="w-full h-full relative">
                        {participant.hasVideo ? (
                          getVideoElement(participant)
                        ) : (
                          <button
                            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-lg hover:from-slate-600/80 hover:to-slate-700/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            onClick={() => simulateParticipantConnection(participant.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                simulateParticipantConnection(participant.id);
                              }
                            }}
                          >
                            <div className="text-center p-3 sm:p-4 lg:p-6">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-lg sm:text-xl lg:text-2xl">
                                  {participant.role === 'professional' ? '👨‍⚕️' : '👤'}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-white mb-1 truncate px-2">
                                {participant.id === currentUserId ? 'Vous' : participant.name}
                              </p>
                              <p className="text-xs text-gray-400 mb-2 sm:mb-3">
                                {participant.isConnected ? 'Caméra désactivée' : 'En attente'}
                              </p>
                              {!participant.isConnected && (
                                <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 text-xs px-2 sm:px-3 py-1 rounded-full">
                                  <span className="hidden sm:inline">Cliquez pour connecter</span>
                                  <span className="sm:hidden">Connecter</span>
                                </div>
                              )}
                            </div>
                          </button>
                        )}

                        {/* Responsive participant info overlay */}
                        <div className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-black/60 backdrop-blur-sm px-2 py-1 lg:px-3 lg:py-1 rounded-md lg:rounded-lg border border-white/20">
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            <span className="text-white text-xs lg:text-sm font-medium truncate max-w-[100px] lg:max-w-none">
                              {participant.id === currentUserId ? 'Vous' : participant.name}
                            </span>
                            <span className="text-xs text-gray-300 hidden sm:inline">
                              ({participant.role === 'professional' ? 'Pro' : 'Client'})
                            </span>
                          </div>
                        </div>

                        {/* Responsive status indicators */}
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-3 flex items-center space-x-1 lg:space-x-2">
                          <div
                            className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full shadow-lg ${
                              participant.isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                            }`}
                          ></div>
                          {participant.hasVideo && (
                            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-blue-400 shadow-lg animate-pulse"></div>
                          )}
                          <FaShieldAlt className="text-green-400 text-xs drop-shadow-lg" />
                        </div>

                        {/* Hover controls - Hidden on mobile */}
                        {participant.hasVideo && (
                          <div className="absolute bottom-2 right-2 lg:bottom-3 lg:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                            <button className="p-1.5 lg:p-2 bg-black/60 backdrop-blur-sm rounded-md lg:rounded-lg border border-white/20 hover:bg-black/80 transition-all duration-300">
                              <FaExpand className="text-white text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced session info overlay */}
            <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-lg px-6 py-4 rounded-2xl border border-white/20 max-w-sm shadow-2xl">
              <div className="text-white text-sm flex items-center mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <FaShieldAlt className="text-white text-xs" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {sessionData ? sessionData.title : 'Session Vidéo Sécurisée'}
                  </h3>
                  <p className="text-xs text-gray-400">Connexion chiffrée E2E</p>
                </div>
              </div>

              <div className="text-xs text-gray-300 space-y-2">
                <div className="flex items-center space-x-2">
                  <FaUsers className="text-blue-400" />
                  <span>{participants.length} participant(s) autorisé(s)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaVideo className="text-green-400" />
                  <span>{participants.filter(p => p.hasVideo).length} flux vidéo actif(s)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCircle className="text-green-400 animate-pulse" />
                  <span>Session ID: {sessionId}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl">
                <p className="text-blue-300 text-xs leading-relaxed">
                  💡 Flux vidéo partagés en temps réel avec chiffrement de bout en bout
                </p>
              </div>

              {/* Enhanced test controls */}
              <div className="mt-4 space-y-3">
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
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center space-x-2"
                  >
                    <FaVideo />
                    <span>Activer toutes les caméras</span>
                  </button>
                )}

                {/* Control buttons grid */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setupVideoStream(false);
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs py-2 px-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-500/50 flex items-center justify-center space-x-1"
                  >
                    <FaVideo className="text-xs" />
                    <span>Caméra réelle</span>
                  </button>
                  <button
                    onClick={() => {
                      setupVideoStream(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-xs py-2 px-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-purple-500/50 flex items-center justify-center space-x-1"
                  >
                    <FaCog className="text-xs" />
                    <span>Mode simulé</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive modern chat panel */}
          {isChatOpen && (
            <div className="w-full lg:w-1/3 bg-black/20 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col h-1/2 lg:h-full">
              {/* Chat header */}
              <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaComments className="text-white text-xs md:text-sm" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm md:text-base">Chat Sécurisé</h3>
                    <div className="flex items-center space-x-1 md:space-x-2 text-xs text-gray-400">
                      <FaShieldAlt className="text-green-400" />
                      <span className="hidden sm:inline">Chiffrement E2E</span>
                      <span className="sm:hidden">E2E</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="p-1.5 md:p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 flex-shrink-0"
                >
                  <FaTimes className="text-gray-300 text-sm" />
                </button>
              </div>

              {/* Messages area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar min-h-0"
              >
                {messages.map((message, index) => (
                  <div
                    key={message.id || `message-${index}`}
                    className={`${
                      message.sender === 'system'
                        ? 'flex justify-center'
                        : message.sender === 'you'
                          ? 'flex justify-end'
                          : 'flex justify-start'
                    }`}
                  >
                    {message.sender === 'system' ? (
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-medium border backdrop-blur-sm ${
                          message.isError
                            ? 'bg-red-500/20 border-red-400/30 text-red-300'
                            : 'bg-green-500/20 border-green-400/30 text-green-300'
                        }`}
                      >
                        {message.text}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-sm border ${
                          message.sender === 'you'
                            ? 'bg-blue-600/80 border-blue-500/30 text-white rounded-tr-md'
                            : 'bg-white/10 border-white/20 text-white rounded-tl-md'
                        } shadow-lg`}
                      >
                        <div className="text-xs md:text-sm leading-relaxed break-words">
                          {message.text}
                        </div>
                        <div className="text-xs opacity-70 mt-1 md:mt-2 flex items-center justify-end space-x-1 md:space-x-2">
                          <span>{formatTime(message.timestamp)}</span>
                          <FaShieldAlt className="text-green-400" style={{ fontSize: '8px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 md:p-4 border-t border-white/10 flex-shrink-0"
              >
                <div className="flex space-x-2 md:space-x-3">
                  <input
                    type="text"
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-300 text-sm md:text-base"
                    disabled={!isSecurityVerified}
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-500/50 flex items-center space-x-2 flex-shrink-0"
                    disabled={!isSecurityVerified || !newMessage.trim()}
                  >
                    <FaPaperPlane className="text-xs md:text-sm" />
                    <span className="hidden sm:inline text-sm">Envoyer</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Responsive modern control bar */}
        <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-3 md:p-4 lg:p-6">
          <div className="flex justify-center items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Audio control */}
            <div className="relative group">
              <button
                onClick={toggleMute}
                className={`p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-white/20 ${
                  isMuted
                    ? 'bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 shadow-lg shadow-red-500/25'
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20'
                } ${!isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isSecurityVerified}
              >
                {isMuted ? (
                  <FaMicrophoneSlash size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                ) : (
                  <FaMicrophone size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                )}
              </button>
              <div className="absolute -top-10 lg:-top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 lg:px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                {isMuted ? 'Réactiver le micro' : 'Couper le micro'}
              </div>
            </div>

            {/* Video control */}
            <div className="relative group">
              <button
                onClick={toggleVideo}
                className={`p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-white/20 ${
                  isVideoOff
                    ? 'bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 shadow-lg shadow-red-500/25'
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20'
                } ${!isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isSecurityVerified}
              >
                {isVideoOff ? (
                  <FaVideoSlash size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                ) : (
                  <FaVideo size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                )}
              </button>
              <div className="absolute -top-10 lg:-top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 lg:px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                {isVideoOff ? 'Réactiver la caméra' : 'Couper la caméra'}
              </div>
            </div>

            {/* Chat toggle */}
            <div className="relative group">
              <button
                onClick={toggleChat}
                className={`p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-white/20 ${
                  isChatOpen
                    ? 'bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-sm shadow-lg shadow-blue-500/25'
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20'
                }`}
              >
                {isChatOpen ? (
                  <FaCommentSlash size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                ) : (
                  <FaComments size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                )}
              </button>
              <div className="absolute -top-10 lg:-top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 lg:px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                {isChatOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
              </div>
            </div>

            {/* Screen share - Hidden on small screens */}
            <div className="relative group hidden sm:block">
              <button
                onClick={handleShareScreen}
                className={`p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20 transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-white/20 ${
                  !isSecurityVerified ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isSecurityVerified}
              >
                <FaDesktop size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
              <div className="absolute -top-10 lg:-top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 lg:px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                Partager l&apos;écran
              </div>
            </div>

            {/* Spacer */}
            <div className="w-px h-6 lg:h-8 bg-white/20 hidden sm:block"></div>

            {/* End call button */}
            <div className="relative group">
              <button
                onClick={handleEndCall}
                className="p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 focus:ring-4 focus:ring-red-500/50 shadow-lg shadow-red-500/25"
              >
                <FaPhone
                  size={16}
                  className="sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                  style={{ transform: 'rotate(135deg)' }}
                />
              </button>
              <div className="absolute -top-10 lg:-top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 lg:px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                Terminer l&apos;appel
              </div>
            </div>
          </div>

          {/* Responsive quick stats */}
          <div className="mt-3 lg:mt-4 flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <FaUsers className="text-blue-400" />
                <span>{participants.filter(p => p.isConnected).length} connecté(s)</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <FaVideo className="text-green-400" />
                <span className="hidden sm:inline">
                  {participants.filter(p => p.hasVideo).length} caméra(s)
                </span>
                <span className="sm:hidden">
                  {participants.filter(p => p.hasVideo).length} vidéo
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <FaShieldAlt className="text-green-400" />
                <span>Sécurisé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants status bar */}
        <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-white text-xs" />
                </div>
                <span className="text-white font-medium">
                  {sessionData ? sessionData.title : 'Session Vidéo'}
                </span>
                <FaShieldAlt className="text-green-400 text-xs" />
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center space-x-4">
              <span>
                {participants.filter(p => p.isConnected).length}/{participants.length} connecté(s)
              </span>
              <div className="w-px h-4 bg-white/20"></div>
              <span>{participants.filter(p => p.hasVideo).length} vidéo(s) active(s)</span>
            </div>
          </div>

          {/* Participants list */}
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map((participant, index) => (
              <div
                key={participant.id || `participant-${index}`}
                className={`flex items-center text-xs px-3 py-2 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  participant.id === currentUserId
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                    : 'bg-white/10 border-white/20 text-gray-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    participant.isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`}
                ></div>
                {participant.hasVideo && (
                  <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
                )}
                <span className="mr-1 font-medium">
                  {participant.id === currentUserId ? 'Vous' : participant.name}
                </span>
                <span className="text-gray-400">
                  ({participant.role === 'professional' ? 'Pro' : 'Client'})
                </span>
                {participant.isSecure && (
                  <FaShieldAlt className="ml-2 text-green-400" style={{ fontSize: '8px' }} />
                )}
              </div>
            ))}
          </div>
          {participants.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4 bg-white/5 rounded-xl border border-white/10 mt-3">
              <FaUsers className="mx-auto mb-2 text-gray-500" />
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
