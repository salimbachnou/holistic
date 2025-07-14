import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaEuroSign, FaUser } from 'react-icons/fa';

import { useAuth } from '../../contexts/AuthContext';

const BookingModal = ({ session, professional, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Réserver une session</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>

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
                <FaEuroSign className="text-gray-500 mr-2" />
                <span className="text-gray-700">
                  {session.price?.amount || session.price} {session.price?.currency || 'MAD'}
                </span>
              </div>
              <div className="flex items-center">
                <FaUser className="text-gray-500 mr-2" />
                <span className="text-gray-700">
                  Places disponibles:{' '}
                  {session.maxParticipants - (session.participants?.length || 0)}
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

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes ou questions pour le professionnel (optionnel)
              </label>
              <textarea
                id="notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ajoutez des informations supplémentaires ou des questions..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
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

              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  {professional.bookingMode === 'auto'
                    ? 'Votre réservation sera confirmée immédiatement.'
                    : 'Votre demande sera envoyée au professionnel pour confirmation.'}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  {professional.paymentEnabled
                    ? 'Continuer vers le paiement'
                    : 'Confirmer la réservation'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
