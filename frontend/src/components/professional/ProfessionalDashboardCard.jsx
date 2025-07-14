import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import React from 'react';

const ProfessionalDashboardCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend = 'up',
  trendValue = '+0%',
  description = '',
  link = null,
}) => {
  const colorClasses = {
    primary: 'text-primary-600',
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-500',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };

  const trendColorClasses = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const CardContent = () => (
    <div className="lotus-card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && <span className="text-sm text-gray-500 ml-1">{description}</span>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Icon className={`h-8 w-8 ${colorClasses[color] || colorClasses.primary}`} />
          <div className="flex flex-col items-end">
            <span
              className={`text-sm font-medium ${trendColorClasses[trend] || trendColorClasses.neutral}`}
            >
              {trendValue}
            </span>
            {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />}
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block">
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
};

export default ProfessionalDashboardCard;
