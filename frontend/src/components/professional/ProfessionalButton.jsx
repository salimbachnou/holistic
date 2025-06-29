import React from 'react';
import { Link } from 'react-router-dom';

const ProfessionalButton = ({
  children,
  onClick,
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none';

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-lotus text-white hover:shadow-lotus-hover active:opacity-90';
      case 'secondary':
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100';
      case 'outline':
        return 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100';
      case 'ghost':
        return 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100';
      case 'danger':
        return 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:shadow-md active:opacity-90';
      case 'success':
        return 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-md active:opacity-90';
      default:
        return 'bg-gradient-lotus text-white hover:shadow-lotus-hover active:opacity-90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-2.5 py-1.5 text-xs';
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2.5 text-sm';
      case 'lg':
        return 'px-5 py-3 text-base';
      case 'xl':
        return 'px-6 py-3.5 text-base';
      default:
        return 'px-4 py-2.5 text-sm';
    }
  };

  const allClasses = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${
    fullWidth ? 'w-full' : ''
  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={allClasses}>
        {Icon && <Icon className={`h-5 w-5 ${children ? 'mr-2' : ''}`} />}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={allClasses} disabled={disabled}>
      {Icon && <Icon className={`h-5 w-5 ${children ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};

export default ProfessionalButton;
