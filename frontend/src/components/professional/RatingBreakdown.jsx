import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import React from 'react';

const RatingBreakdown = ({ rating }) => {
  if (!rating || !rating.sourceBreakdown) {
    return null;
  }

  const { sourceBreakdown, distribution } = rating;

  const renderStars = (average, size = 'small') => {
    const stars = [];
    const fullStars = Math.floor(average);
    const hasHalfStar = average % 1 >= 0.5;

    const starSize = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className={`${starSize} text-yellow-400`} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className={`${starSize} relative`}>
            <StarOutlineIcon className={`${starSize} text-gray-300 absolute`} />
            <StarIcon
              className={`${starSize} text-yellow-400`}
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </div>
        );
      } else {
        stars.push(<StarOutlineIcon key={i} className={`${starSize} text-gray-300`} />);
      }
    }

    return <div className="flex">{stars}</div>;
  };

  const sources = [
    { key: 'events', label: 'Événements', icon: '🎪' },
    { key: 'sessions', label: 'Sessions', icon: '🧘' },
    { key: 'products', label: 'Produits', icon: '🛍️' },
  ];

  const hasAnyReviews = sources.some(source => sourceBreakdown[source.key]?.count > 0);

  if (!hasAnyReviews) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">Aucun avis disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900 mb-4">Détail des avis</h4>

      {/* Source breakdown */}
      <div className="space-y-3 mb-4">
        {sources.map(source => {
          const sourceData = sourceBreakdown[source.key];
          if (!sourceData || sourceData.count === 0) return null;

          return (
            <div key={source.key} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">{source.icon}</span>
                <span className="text-sm font-medium text-gray-700">{source.label}</span>
                <span className="text-xs text-gray-500 ml-2">({sourceData.count})</span>
              </div>
              <div className="flex items-center">
                {renderStars(sourceData.average)}
                <span className="text-sm text-gray-600 ml-2">{sourceData.average.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution */}
      {distribution && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Distribution des notes</h5>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star] || 0;
              const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center text-sm">
                  <span className="w-8 text-gray-600">{star}</span>
                  <StarIcon className="h-4 w-4 text-yellow-400 mr-2" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingBreakdown;
