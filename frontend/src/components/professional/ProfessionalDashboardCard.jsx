import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

const ProfessionalDashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
  link,
  color = 'primary',
  trend,
  trendValue,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          background: 'bg-gradient-to-br from-primary-600 to-primary-700',
          icon: 'bg-primary-100 text-primary-600',
          text: 'text-primary-600',
        };
      case 'purple':
        return {
          background: 'bg-gradient-to-br from-purple-600 to-purple-700',
          icon: 'bg-purple-100 text-purple-600',
          text: 'text-purple-600',
        };
      case 'indigo':
        return {
          background: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
          icon: 'bg-indigo-100 text-indigo-600',
          text: 'text-indigo-600',
        };
      case 'blue':
        return {
          background: 'bg-gradient-to-br from-blue-600 to-blue-700',
          icon: 'bg-blue-100 text-blue-600',
          text: 'text-blue-600',
        };
      case 'green':
        return {
          background: 'bg-gradient-to-br from-green-600 to-green-700',
          icon: 'bg-green-100 text-green-600',
          text: 'text-green-600',
        };
      case 'yellow':
        return {
          background: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          icon: 'bg-yellow-100 text-yellow-600',
          text: 'text-yellow-600',
        };
      case 'red':
        return {
          background: 'bg-gradient-to-br from-red-600 to-red-700',
          icon: 'bg-red-100 text-red-600',
          text: 'text-red-600',
        };
      case 'lotus':
      default:
        return {
          background: 'bg-gradient-lotus',
          icon: 'bg-primary-100 text-primary-600',
          text: 'text-primary-600',
        };
    }
  };

  const colorClasses = getColorClasses();

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg
          className="w-3 h-3 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg
          className="w-3 h-3 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return null;
  };

  const getTrendTextColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  const cardContent = (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-0.5">
        <div className={`h-1.5 w-full ${colorClasses.background} rounded-t-lg`}></div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`p-3 rounded-lg ${colorClasses.icon} mr-4 flex items-center justify-center`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center ${getTrendTextColor()} text-xs font-medium`}>
              {getTrendIcon()}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-end">
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            {description && <div className="text-xs text-gray-500 ml-2 mb-1">{description}</div>}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return link ? <Link to={link}>{cardContent}</Link> : cardContent;
};

export default ProfessionalDashboardCard;
