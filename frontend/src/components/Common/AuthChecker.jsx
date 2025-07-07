import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

// List of client routes that admin users shouldn't access
const clientRoutes = [
  '/dashboard',
  '/profile',
  '/bookings',
  '/sessions',
  '/favorites',
  '/messages',
  '/products',
  '/notifications',
];

const AuthChecker = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is admin and trying to access client routes
    if (user && isAdmin() && clientRoutes.some(route => location.pathname.startsWith(route))) {
      toast.error("En tant qu'administrateur, vous n'avez pas accès à cette partie");
      navigate('/admin/dashboard');
    }
  }, [user, location.pathname, navigate, isAdmin]);

  return <>{children}</>;
};

export default AuthChecker;
