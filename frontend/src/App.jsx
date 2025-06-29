import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from './components/admin/AdminLayout';
import ApiTest from './components/ApiTest';
import LoadingSpinner from './components/Common/LoadingSpinner';
import Layout from './components/Layout/Layout';
import ProfessionalLayout from './components/professional/ProfessionalLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AboutPage from './pages/AboutPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminContactsPage from './pages/admin/AdminContactsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProfessionalsPage from './pages/admin/AdminProfessionalsPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import GoogleAuthCallbackPage from './pages/auth/GoogleAuthCallbackPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterProfessionalPage from './pages/auth/RegisterProfessionalPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthTestPage from './pages/AuthTestPage';
import BookingsPage from './pages/BookingsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import ClientSessionsPage from './pages/ClientSessionsPage';
import ContactPage from './pages/ContactPage';
import ConversationsPage from './pages/ConversationsPage';
import DashboardPage from './pages/DashboardPage';
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import FavoritesPage from './pages/FavoritesPage';
import ForYouPage from './pages/ForYouPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import ProductsPage from './pages/ProductsPage';
import ProfessionalAnalyticsPage from './pages/professional/ProfessionalAnalyticsPage';
import ProfessionalClientsPage from './pages/professional/ProfessionalClientsPage';
import ProfessionalDashboardPage from './pages/professional/ProfessionalDashboardPage';
import ProfessionalEventsPage from './pages/professional/ProfessionalEventsPage';
import ProfessionalMessagesPage from './pages/professional/ProfessionalMessagesPage';
import ProfessionalProductsPage from './pages/professional/ProfessionalProductsPage';
import ProfessionalSessionsPage from './pages/professional/ProfessionalSessionsPage';
import ProfessionalSettingsPage from './pages/professional/ProfessionalSettingsPage';
import ProfessionalDetailEnhanced from './pages/ProfessionalDetailEnhanced';
import ProfessionalDetailPage from './pages/ProfessionalDetailPage';
import ProfessionalDetailsPage from './pages/ProfessionalDetailsPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ProfilePage from './pages/ProfilePage';
import VideoCallPage from './pages/VideoCallPage';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    toast.error("Vous n'avez pas les droits d'accès à cette section");
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Professional Protected Route Component
const ProfessionalProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'professional') {
    toast.error("Vous n'avez pas les droits d'accès à l'espace professionnel");
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <AboutPage />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <ContactPage />
              </Layout>
            }
          />
          <Route
            path="/professionals"
            element={
              <Layout>
                <ProfessionalsPage />
              </Layout>
            }
          />
          <Route
            path="/professionals/:id"
            element={
              <Layout>
                <ProfessionalDetailPage />
              </Layout>
            }
          />
          <Route
            path="/for-you"
            element={
              <Layout>
                <ForYouPage />
              </Layout>
            }
          />
          <Route
            path="/professionals/enhanced/:id"
            element={
              <Layout>
                <ProfessionalDetailEnhanced />
              </Layout>
            }
          />

          {/* Events Routes */}
          <Route
            path="/events"
            element={
              <Layout>
                <EventsPage />
              </Layout>
            }
          />
          <Route
            path="/events/:id"
            element={
              <Layout>
                <EventDetailPage />
              </Layout>
            }
          />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/professional" element={<RegisterProfessionalPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
          <Route path="/auth/callback" element={<GoogleAuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <Layout>
                  <BookingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientSessionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-call/:sessionId"
            element={
              <ProtectedRoute>
                <VideoCallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Layout>
                  <FavoritesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConversationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:professionalId"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessagesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Professional Routes - Using the new ProfessionalLayout */}
          <Route
            path="/dashboard/professional"
            element={
              <ProfessionalProtectedRoute>
                <ProfessionalLayout />
              </ProfessionalProtectedRoute>
            }
          >
            <Route index element={<ProfessionalDashboardPage />} />
            <Route path="sessions" element={<ProfessionalSessionsPage />} />
            <Route path="products" element={<ProfessionalProductsPage />} />
            <Route path="events" element={<ProfessionalEventsPage />} />
            <Route path="messages" element={<ProfessionalMessagesPage />} />
            <Route path="profile" element={<ProfessionalProfilePage />} />
            <Route path="settings" element={<ProfessionalSettingsPage />} />
            <Route path="clients" element={<ProfessionalClientsPage />} />
            <Route path="analytics" element={<ProfessionalAnalyticsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            {/* Admin nested routes */}
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="professionals" element={<AdminProfessionalsPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="contacts" element={<AdminContactsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route
              path="orders"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
                  <p className="text-gray-600 mt-2">Page en construction...</p>
                </div>
              }
            />
            <Route
              path="bookings"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Gestion des Réservations</h1>
                  <p className="text-gray-600 mt-2">Page en construction...</p>
                </div>
              }
            />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route
              path="settings"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Paramètres</h1>
                  <p className="text-gray-600 mt-2">Page en construction...</p>
                </div>
              }
            />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/api-test"
            element={
              <Layout>
                <ApiTest />
              </Layout>
            }
          />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              <Layout>
                <NotFoundPage />
              </Layout>
            }
          />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3001,
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              style: {
                background: '#e6f7e6',
                border: '1px solid #c3e6cb',
                color: '#155724',
              },
            },
            error: {
              style: {
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
              },
              duration: 5000,
            },
          }}
        />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
