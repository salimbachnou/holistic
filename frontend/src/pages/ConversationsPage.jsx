import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';

const ConversationsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour accéder à vos messages');
      navigate('/login', { state: { from: '/messages' } });
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/messages/conversations');

        if (response.data && response.data.conversations) {
          setConversations(response.data.conversations);
        } else if (response.data && Array.isArray(response.data)) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Erreur lors du chargement des conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isAuthenticated, navigate]);

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(
    conversation =>
      `${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-600 font-medium">Chargement de vos conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
              <p className="text-slate-600">Gérez vos conversations avec les professionnels</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {conversations.length > 0 && (
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {filteredConversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? "Essayez de modifier votre recherche ou vérifiez l'orthographe."
                  : "Vous n'avez pas encore de messages. Explorez nos professionnels et commencez une conversation."}
              </p>
              {!searchTerm && (
                <Link
                  to="/for-you"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Découvrir des professionnels
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conversation, index) => (
                <Link
                  key={conversation.conversationId}
                  to={`/messages/${conversation.otherPerson._id}`}
                  className="block hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                >
                  <div className="flex items-center p-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mr-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-200">
                        <img
                          src={
                            conversation.otherPerson.profileImage ||
                            'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(
                                `${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`
                              ) +
                              '&background=6366f1&color=fff&size=56'
                          }
                          alt={`${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`}
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(
                                `${conversation.otherPerson.firstName} ${conversation.otherPerson.lastName}`
                              ) +
                              '&background=6366f1&color=fff&size=56';
                          }}
                        />
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold text-slate-900 truncate ${
                            conversation.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'
                          } group-hover:text-blue-700 transition-colors duration-200`}
                        >
                          {conversation.otherPerson.firstName} {conversation.otherPerson.lastName}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium ml-2 flex-shrink-0">
                          {formatDate(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          conversation.unreadCount > 0
                            ? 'font-medium text-slate-800'
                            : 'text-slate-600'
                        } group-hover:text-slate-700 transition-colors duration-200`}
                      >
                        {conversation.lastMessage.content}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {conversations.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {filteredConversations.length} sur {conversations.length} conversation
              {conversations.length !== 1 ? 's' : ''} affichée
              {filteredConversations.length !== 1 ? 's' : ''}
              {searchTerm && ` • Recherche: "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
