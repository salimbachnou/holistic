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
} from 'react-icons/fa';

const VideoCallComponent = memo(
  ({ sessionId, professionalId, clientId, onEndCall, currentUserId, currentUserRole }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Debug logging
    console.log('=== VideoCallComponent Debug ===');
    console.log('currentUserId:', currentUserId);
    console.log('professionalId:', professionalId);
    console.log('currentUserRole:', currentUserRole);

    // Determine if current user is the professional
    const isCurrentUserProfessional =
      currentUserId === professionalId || currentUserRole === 'professional';

    console.log('isCurrentUserProfessional:', isCurrentUserProfessional);

    // Simulated participant data (in a real app, this would come from the backend)
    const [participants, setParticipants] = useState(() => [
      {
        id: clientId || 'client',
        name: isCurrentUserProfessional ? 'Client' : 'You (Client)',
        role: 'client',
        isConnected: !isCurrentUserProfessional,
      },
      {
        id: professionalId || 'professional',
        name: isCurrentUserProfessional ? 'You (Professional)' : 'Professional',
        role: 'professional',
        isConnected: isCurrentUserProfessional,
      },
    ]);

    // Update participants when props change
    useEffect(() => {
      const isCurrentUserProfessional =
        currentUserId === professionalId || currentUserRole === 'professional';

      setParticipants([
        {
          id: clientId || 'client',
          name: isCurrentUserProfessional ? 'Client' : 'You (Client)',
          role: 'client',
          isConnected: !isCurrentUserProfessional,
        },
        {
          id: professionalId || 'professional',
          name: isCurrentUserProfessional ? 'You (Professional)' : 'Professional',
          role: 'professional',
          isConnected: isCurrentUserProfessional,
        },
      ]);
    }, [clientId, professionalId, currentUserId, currentUserRole]);

    useEffect(() => {
      // This would be replaced with actual WebRTC setup in a real implementation
      setupMockVideoStream();

      // Add initial system message based on who the current user is
      const isCurrentUserProfessional =
        currentUserId === professionalId || currentUserRole === 'professional';

      setMessages([
        {
          id: Date.now(),
          sender: 'system',
          text: isCurrentUserProfessional
            ? 'You have joined the call as professional. Waiting for client to join...'
            : 'You have joined the call. Waiting for professional to join...',
          timestamp: new Date(),
        },
      ]);

      // Simulate the other participant joining after 3 seconds
      const timer = setTimeout(() => {
        if (isCurrentUserProfessional) {
          // If current user is professional, simulate client joining
          setParticipants(prev =>
            prev.map(p => (p.role === 'client' ? { ...p, isConnected: true } : p))
          );

          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: 'Client has joined the call',
              timestamp: new Date(),
            },
          ]);
        } else {
          // If current user is client, simulate professional joining
          setParticipants(prev =>
            prev.map(p =>
              p.id === (professionalId || 'professional') ? { ...p, isConnected: true } : p
            )
          );

          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              sender: 'system',
              text: 'Professional has joined the call',
              timestamp: new Date(),
            },
          ]);
        }
      }, 3001);

      return () => {
        clearTimeout(timer);
        // Clean up video streams when component unmounts
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          const tracks = remoteVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    }, [professionalId, currentUserId, currentUserRole]);

    useEffect(() => {
      // Scroll chat to bottom when messages change
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [messages]);

    const setupMockVideoStream = async () => {
      try {
        // In a real app, this would use actual WebRTC connections
        // For this prototype, we'll just show the local camera feed
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Don't set initial message here - it's handled in the main useEffect
      } catch (error) {
        console.error('Error accessing media devices:', error);

        let errorMessage = 'Failed to access camera and microphone';
        if (error.name === 'NotReadableError') {
          errorMessage =
            'Camera is being used by another application. Please close other apps using the camera.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and refresh.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found on this device.';
        }

        // Add error message
        setMessages([
          {
            id: Date.now(),
            sender: 'system',
            text: errorMessage,
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);

      // In a real app, this would toggle the audio track
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = isMuted; // Toggle to opposite of current state
        });
      }
    };

    const toggleVideo = () => {
      setIsVideoOff(!isVideoOff);

      // In a real app, this would toggle the video track
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = isVideoOff; // Toggle to opposite of current state
        });
      }
    };

    const toggleChat = () => {
      setIsChatOpen(!isChatOpen);
    };

    const handleEndCall = () => {
      // In a real app, close connections and notify server
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      if (onEndCall) {
        onEndCall();
      }
    };

    const handleShareScreen = async () => {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // In a real app, this would be sent to peers
        // For this prototype, we'll just replace our video
        if (localVideoRef.current) {
          const currentStream = localVideoRef.current.srcObject;

          // Stop current video tracks before switching
          if (currentStream) {
            const videoTracks = currentStream.getVideoTracks();
            videoTracks.forEach(track => track.stop());
          }

          // Use screen share video with existing audio
          const audioTracks = currentStream ? currentStream.getAudioTracks() : [];
          if (audioTracks.length > 0) {
            screenStream.addTrack(audioTracks[0]);
          }

          localVideoRef.current.srcObject = screenStream;

          // Add screen share ended event listener
          screenStream.getVideoTracks()[0].onended = () => {
            // Restore camera stream when screen share ends
            setupMockVideoStream();
          };
        }

        // Add system message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'system',
            text: 'You started sharing your screen',
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
            text: 'Failed to share screen',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    };

    const handleSendMessage = e => {
      e.preventDefault();
      if (!newMessage.trim()) return;

      // Add message to chat
      const message = {
        id: Date.now(),
        sender: 'you',
        text: newMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Simulate professional response after 2 seconds
      setTimeout(() => {
        const response = {
          id: Date.now(),
          sender: 'professional',
          text: 'Thanks for your message. How can I help you today?',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    };

    const formatTime = date => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="bg-gray-900 text-white h-screen flex flex-col">
        {/* Call header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="text-lg font-medium">Session en ligne</div>
          <div className="text-sm">Session ID: {sessionId}</div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex">
          {/* Video area */}
          <div className={`flex-1 relative ${isChatOpen ? 'lg:w-3/4' : 'w-full'}`}>
            {/* Remote video - In a real app, this would show the other participant */}
            <div className="w-full h-full bg-black flex items-center justify-center">
              {(() => {
                const isCurrentUserProfessional =
                  currentUserId === professionalId || currentUserRole === 'professional';
                const otherParticipant = participants.find(p =>
                  isCurrentUserProfessional ? p.role === 'client' : p.role === 'professional'
                );

                return otherParticipant?.isConnected ? (
                  <video
                    ref={remoteVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                  >
                    <track kind="captions" src="" label="English captions" />
                    Your browser does not support video.
                  </video>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-3xl">{isCurrentUserProfessional ? '👤' : '👨‍⚕️'}</span>
                    </div>
                    <p>
                      {isCurrentUserProfessional
                        ? 'Waiting for client to join...'
                        : 'Waiting for professional to join...'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Local video (small overlay) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
              <video
                ref={localVideoRef}
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                autoPlay
                playsInline
                muted
              >
                <track kind="captions" src="" label="English captions" />
                Your browser does not support video.
              </video>
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat panel */}
          {isChatOpen && (
            <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-3 border-b border-gray-700 font-medium">Chat</div>

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
                        className={`py-1 px-3 rounded-full text-xs ${message.isError ? 'bg-red-900' : 'bg-gray-700'}`}
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
                        <div className="text-xs opacity-70 text-right mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded-l-lg px-3 py-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 rounded-r-lg hover:bg-primary-700"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 flex justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
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
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <FaDesktop size={20} />
          </button>

          <button onClick={handleEndCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
            <FaPhone size={20} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>

        {/* Participants */}
        <div className="bg-gray-800 border-t border-gray-700 p-2">
          <div className="text-xs text-gray-400 mb-2">Participants</div>
          <div className="flex space-x-3">
            {participants.map((participant, index) => (
              <div
                key={participant.id || `participant-${index}`}
                className="flex items-center text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${participant.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}
                ></div>
                {participant.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

VideoCallComponent.displayName = 'VideoCallComponent';

export default VideoCallComponent;
