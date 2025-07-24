import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Link } from 'react-router-dom';

const RecentMessageCard = ({ message, onMessageClick }) => {
  const handleClick = () => {
    if (onMessageClick) {
      onMessageClick(message);
    }
  };

  return (
    <div
      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        {message.avatar ? (
          <img
            src={message.avatar}
            alt={message.senderName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-white">
              {message.senderName ? message.senderName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-gray-900 text-sm truncate">
            {message.senderName || 'Utilisateur'}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{message.timeAgo}</span>
            {!message.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full"></div>}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{message.content}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-xs text-gray-400">
            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
            <span>Message</span>
          </div>

          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
};

const RecentMessagesSection = ({ messages = [], onViewAll, onMessageClick }) => {
  // Debug: Log the messages received

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mx-auto h-16 w-16 text-gray-300 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
          <ChatBubbleLeftRightIcon className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Aucun message récent</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Les messages de vos clients apparaîtront ici. Ils pourront vous contacter pour poser des
          questions ou réserver vos services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        return (
          <RecentMessageCard
            key={message.id || index}
            message={message}
            onMessageClick={onMessageClick}
          />
        );
      })}

      {messages.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          {onViewAll ? (
            <button
              onClick={onViewAll}
              className="w-full btn-secondary text-sm flex justify-center items-center hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Voir tous les messages
            </button>
          ) : (
            <Link
              to="/dashboard/professional/messages"
              className="w-full btn-secondary text-sm flex justify-center items-center hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Voir tous les messages
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentMessagesSection;
export { RecentMessageCard };
