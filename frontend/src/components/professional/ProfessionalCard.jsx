import { motion } from 'framer-motion';
import React from 'react';

const ProfessionalCard = ({
  children,
  title,
  icon: Icon,
  color = 'primary',
  actionButtons,
  className = '',
  padded = true,
  hover = false,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          border: 'border-primary-100',
          headerBg: 'bg-primary-50',
          headerText: 'text-primary-700',
          icon: 'text-primary-600',
        };
      case 'purple':
        return {
          border: 'border-purple-100',
          headerBg: 'bg-purple-50',
          headerText: 'text-purple-700',
          icon: 'text-purple-600',
        };
      case 'indigo':
        return {
          border: 'border-indigo-100',
          headerBg: 'bg-indigo-50',
          headerText: 'text-indigo-700',
          icon: 'text-indigo-600',
        };
      case 'blue':
        return {
          border: 'border-blue-100',
          headerBg: 'bg-blue-50',
          headerText: 'text-blue-700',
          icon: 'text-blue-600',
        };
      case 'green':
        return {
          border: 'border-green-100',
          headerBg: 'bg-green-50',
          headerText: 'text-green-700',
          icon: 'text-green-600',
        };
      case 'yellow':
        return {
          border: 'border-yellow-100',
          headerBg: 'bg-yellow-50',
          headerText: 'text-yellow-700',
          icon: 'text-yellow-600',
        };
      case 'red':
        return {
          border: 'border-red-100',
          headerBg: 'bg-red-50',
          headerText: 'text-red-700',
          icon: 'text-red-600',
        };
      case 'lotus':
      default:
        return {
          border: 'border-primary-100',
          headerBg: 'bg-gradient-to-r from-primary-50 to-purple-50',
          headerText: 'text-primary-700',
          icon: 'text-primary-600',
        };
    }
  };

  const colorClasses = getColorClasses();

  const CardComponent = hover ? motion.div : 'div';
  const hoverProps = hover
    ? {
        whileHover: { y: -5, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <CardComponent
      className={`bg-white rounded-xl shadow-md overflow-hidden ${colorClasses.border} ${className} ${
        hover ? 'transition-all duration-300' : ''
      }`}
      {...hoverProps}
    >
      {title && (
        <div
          className={`${colorClasses.headerBg} ${colorClasses.headerText} px-5 py-4 border-b border-gray-200 flex justify-between items-center`}
        >
          <div className="flex items-center">
            {Icon && <Icon className={`h-5 w-5 ${colorClasses.icon} mr-2.5`} />}
            <h3 className="font-medium">{title}</h3>
          </div>
          {actionButtons && <div className="flex space-x-2">{actionButtons}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </CardComponent>
  );
};

export default ProfessionalCard;
