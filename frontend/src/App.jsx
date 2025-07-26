import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from './components/admin/AdminLayout';
import ApiTest from './components/ApiTest';
import AuthChecker from './components/Common/AuthChecker';
import LoadingSpinner from './components/Common/LoadingSpinner';
import Layout from './components/Layout/Layout';
import ProfessionalLayout from './components/professional/ProfessionalLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AboutPage from './pages/AboutPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminContactsPage from './pages/admin/AdminContactsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProfessionalsPage from './pages/admin/AdminProfessionalsPage';
import AdminSessionsPage from './pages/admin/AdminSessionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
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
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import FavoritesPage from './pages/FavoritesPage';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import OrderReviewPage from './pages/OrderReviewPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductReviewsPage from './pages/ProductReviewsPage';
import ProductsPage from './pages/ProductsPage';
import ProfessionalAnalyticsPage from './pages/professional/ProfessionalAnalyticsPage';
import ProfessionalClientsPage from './pages/professional/ProfessionalClientsPage';
import ProfessionalDashboardPage from './pages/professional/ProfessionalDashboardPage';
import ProfessionalEventBookingsPage from './pages/professional/ProfessionalEventBookingsPage';
import ProfessionalEventsPage from './pages/professional/ProfessionalEventsPage';
import ProfessionalMessagesPage from './pages/professional/ProfessionalMessagesPage';
import ProfessionalNotificationsPage from './pages/professional/ProfessionalNotificationsPage';
import ProfessionalOrdersPage from './pages/professional/ProfessionalOrdersPage';
import ProfessionalProductsPage from './pages/professional/ProfessionalProductsPage';
import ProfessionalReviewsPage from './pages/professional/ProfessionalReviewsPage';
import ProfessionalSessionBookingsPage from './pages/professional/ProfessionalSessionBookingsPage';
import ProfessionalSessionsPage from './pages/professional/ProfessionalSessionsPage';
import ProfessionalSettingsPage from './pages/professional/ProfessionalSettingsPage';
import ProfessionalDetailPage from './pages/ProfessionalDetailPage';
import ProfessionalPublicEventsPage from './pages/ProfessionalEventsPage';
import ProfessionalPublicProductsPage from './pages/ProfessionalProductsPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ProfilePage from './pages/ProfilePage';
import SessionReviewPage from './pages/SessionReviewPage';
// VideoCallPage removed - using external links only

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
    return <Navigate to="/profile" replace />;
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
            path="/professionals/:id/events"
            element={
              <Layout>
                <ProfessionalPublicEventsPage />
              </Layout>
            }
          />
          <Route
            path="/professionals/:id/products"
            element={
              <Layout>
                <ProfessionalPublicProductsPage />
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

          {/* Products Routes */}
          <Route
            path="/products/:id"
            element={
              <Layout>
                <ProductDetailPage />
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
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
          <Route path="/auth/callback" element={<GoogleAuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <ClientProfilePage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <BookingsPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <ClientSessionsPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          {/* Video call route removed - using external links only */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <FavoritesPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <ProductsPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/review"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <OrderReviewPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:sessionId/review"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <SessionReviewPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:productId/reviews"
            element={
              <Layout>
                <ProductReviewsPage />
              </Layout>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <ConversationsPage />
                  </Layout>
                </AuthChecker>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:professionalId"
            element={
              <ProtectedRoute>
                <AuthChecker>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </AuthChecker>
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
            <Route path="session-bookings" element={<ProfessionalSessionBookingsPage />} />
            <Route path="products" element={<ProfessionalProductsPage />} />
            <Route path="events" element={<ProfessionalEventsPage />} />
            <Route path="event-bookings" element={<ProfessionalEventBookingsPage />} />
            <Route path="messages" element={<ProfessionalMessagesPage />} />
            <Route path="orders" element={<ProfessionalOrdersPage />} />
            <Route path="profile" element={<ProfessionalProfilePage />} />
            <Route path="settings" element={<ProfessionalSettingsPage />} />
            <Route path="clients" element={<ProfessionalClientsPage />} />
            <Route path="analytics" element={<ProfessionalAnalyticsPage />} />
            <Route path="notifications" element={<ProfessionalNotificationsPage />} />
            <Route path="reviews" element={<ProfessionalReviewsPage />} />
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
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="professionals" element={<AdminProfessionalsPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="contacts" element={<AdminContactsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="sessions" element={<AdminSessionsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
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
            duration: 3000,
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
      <SettingsProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
