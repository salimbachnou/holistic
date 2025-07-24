import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaTimes, FaCalendarAlt, FaClock, FaUser, FaLock, FaEnvelope } from 'react-icons/fa';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/axiosConfig';

import PaymentModal from './PaymentModal';

const EnhancedBookingModal = ({ session, professional, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [bookingType, setBookingType] = useState('direct'); // 'direct' or 'message'
  const handleSubmit = async e => {
    e.preventDefault();

    if (!user) {
      toast.error('Veuillez vous connecter pour réserver une session');
      return;
    }

    setIsProcessing(true);

    try {
      const bookingData = {
        professionalId: professional._id,
        sessionId: session._id,
        notes: notes,
        bookingType: bookingType,
      };

      const response = await apiService.post('/bookings', bookingData);

      setBookingId(response.data.booking._id);

      // Handle different booking modes
      if (bookingType === 'message') {
        toast.success('Votre demande de réservation a été envoyée au professionnel');
        onSuccess && onSuccess(response.data.booking);
        onClose();
      } else if (professional.paymentEnabled) {
        // If payment is enabled, show payment modal
        setPaymentStep(true);
        setShowPaymentModal(true);
      } else {
        // Direct booking without payment
        toast.success(
          professional.bookingMode === 'auto'
            ? 'Votre réservation a été confirmée'
            : 'Votre demande de réservation a été envoyée au professionnel'
        );
        onSuccess && onSuccess(response.data.booking);
        onClose();
      }
    } catch (err) {
      console.error('Error booking session:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = async paymentMethod => {
    try {
      await apiService.post(`/bookings/${bookingId}/payment`, {
        paymentMethod: paymentMethod,
      });

      toast.success('Paiement effectué avec succès! Votre réservation est confirmée.');
      setShowPaymentModal(false);
      onSuccess && onSuccess({ _id: bookingId, paymentStatus: 'paid' });
      onClose();
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error(err.response?.data?.message || 'Erreur lors du paiement');
    }
  };

  const getBookingActionText = () => {
    if (bookingType === 'message') {
      return 'Envoyer une demande';
    } else if (professional.paymentEnabled) {
      return 'Continuer vers le paiement';
    } else if (professional.bookingMode === 'auto') {
      return 'Réserver maintenant';
    } else {
      return 'Demander une réservation';
    }
  };

  const BookingForm = () => (
    <>
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{session.title}</h3>
        <p className="text-gray-600 mb-4">{session.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <span className="text-gray-700">
              {format(parseISO(session.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center">
            <FaClock className="text-gray-500 mr-2" />
            <span className="text-gray-700">
              {format(parseISO(session.startTime), 'HH:mm')} ({session.duration} min)
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2 text-sm font-medium">MAD</span>
            <span className="text-gray-700">
              {session.price?.amount || session.price} {session.price?.currency || 'MAD'}
            </span>
          </div>
          <div className="flex items-center">
            <FaUser className="text-gray-500 mr-2" />
            <span className="text-gray-700">
              Places disponibles: {session.maxParticipants - (session.participants?.length || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Professionnel</h3>
        <p className="text-gray-700 font-medium">{professional.businessName}</p>
        <p className="text-gray-600 capitalize">{professional.businessType}</p>
        {professional.businessAddress && (
          <p className="text-gray-600 text-sm mt-1">
            {professional.businessAddress.street}, {professional.businessAddress.city}
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Type de réservation</h3>
        <div className="flex space-x-4 mb-4">
          {professional.bookingMode === 'auto' && (
            <button
              type="button"
              onClick={() => setBookingType('direct')}
              className={`flex-1 py-3 px-4 rounded-md border ${
                bookingType === 'direct'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex justify-center items-center">
                <FaCalendarAlt className="mr-2" />
                <span>Réservation directe</span>
              </div>
              <p className="text-xs mt-1 text-gray-500">
                Réservez directement un créneau sur le planning
              </p>
            </button>
          )}
          <button
            type="button"
            onClick={() => setBookingType('message')}
            className={`flex-1 py-3 px-4 rounded-md border ${
              bookingType === 'message'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex justify-center items-center">
              <FaEnvelope className="mr-2" />
              <span>Contacter</span>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              Envoyez un message au professionnel pour cette session
            </p>
          </button>
        </div>
        <div className="text-sm bg-gray-50 p-3 rounded">
          {bookingType === 'direct' &&
          professional.bookingMode === 'auto' &&
          professional.paymentEnabled ? (
            <div className="flex items-start">
              <FaLock className="text-green-600 mr-2 mt-0.5" />
              <p>
                Le paiement en ligne est activé. Votre réservation sera confirmée immédiatement
                après le paiement.
              </p>
            </div>
          ) : bookingType === 'direct' && professional.bookingMode === 'auto' ? (
            <div className="flex items-start">
              <FaCalendarAlt className="text-green-600 mr-2 mt-0.5" />
              <p>Votre réservation sera confirmée immédiatement.</p>
            </div>
          ) : bookingType === 'direct' ? (
            <div className="flex items-start">
              <FaCalendarAlt className="text-yellow-600 mr-2 mt-0.5" />
              <p>Votre demande de réservation sera envoyée au professionnel pour confirmation.</p>
            </div>
          ) : (
            <div className="flex items-start">
              <FaEnvelope className="text-blue-600 mr-2 mt-0.5" />
              <p>
                Votre message sera envoyé au professionnel qui vous contactera pour finaliser la
                réservation.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          {bookingType === 'message' ? 'Votre message' : 'Notes ou questions (optionnel)'}
        </label>
        <textarea
          id="notes"
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={
            bookingType === 'message'
              ? 'Indiquez vos disponibilités et questions au professionnel...'
              : 'Ajoutez des informations supplémentaires ou des questions...'
          }
          value={notes}
          onChange={e => setNotes(e.target.value)}
          required={bookingType === 'message'}
        ></textarea>
      </div>

      <div className="bg-gray-50 -m-6 mt-2 p-6">
        <div className="mb-4">
          <p className="text-gray-700 font-medium">Détails de la réservation</p>
          <div className="flex justify-between mt-2">
            <span className="text-gray-600">Nom du client:</span>
            <span className="text-gray-800">{user?.name || user?.email}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Email:</span>
            <span className="text-gray-800">{user?.email}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Prix:</span>
            <span className="text-gray-800 font-medium">
              {session.price?.amount || session.price} {session.price?.currency || 'MAD'}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isProcessing}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 flex justify-center items-center"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Traitement...
              </>
            ) : (
              getBookingActionText()
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {paymentStep ? 'Paiement de la réservation' : 'Réserver une session'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>{!paymentStep && <BookingForm />}</form>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          session={session}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default EnhancedBookingModal;
