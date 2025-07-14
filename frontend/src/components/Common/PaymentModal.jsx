import React, { useState } from 'react';
import { FaTimes, FaCreditCard, FaMobileAlt, FaMoneyBill, FaLock } from 'react-icons/fa';

const PaymentModal = ({ session, onClose, onSubmit }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Le numéro de carte est requis';
    } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Le numéro de carte doit contenir 16 chiffres';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'Le nom sur la carte est requis';
    }

    if (!expiry.trim()) {
      newErrors.expiry = "La date d'expiration est requise";
    } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = 'Format invalide (MM/YY)';
    }

    if (!cvv.trim()) {
      newErrors.cvv = 'Le code de sécurité est requis';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'Le code de sécurité doit contenir 3 ou 4 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (paymentMethod === 'credit_card' && !validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // In a real app, you would process the payment with a secure payment gateway
      // For this demo, we'll just simulate a successful payment
      setTimeout(() => {
        onSubmit(paymentMethod);
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  const formatCardNumber = value => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = e => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = e => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    setExpiry(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Paiement sécurisé</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>

          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Session</p>
              <p className="text-gray-800 font-medium">{session.title}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-600">Prix</p>
              <p className="text-gray-800 font-semibold">
                {session.price?.amount || session.price} {session.price?.currency || 'MAD'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Mode de paiement</h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={() => setPaymentMethod('credit_card')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="credit_card" className="ml-3 flex items-center">
                    <FaCreditCard className="text-gray-600 mr-2" />
                    <span className="text-gray-700">Carte de crédit/débit</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="mobile_payment"
                    name="paymentMethod"
                    value="mobile_payment"
                    checked={paymentMethod === 'mobile_payment'}
                    onChange={() => setPaymentMethod('mobile_payment')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="mobile_payment" className="ml-3 flex items-center">
                    <FaMobileAlt className="text-gray-600 mr-2" />
                    <span className="text-gray-700">Paiement mobile</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="cash" className="ml-3 flex items-center">
                    <FaMoneyBill className="text-gray-600 mr-2" />
                    <span className="text-gray-700">Paiement à l'arrivée</span>
                  </label>
                </div>
              </div>
            </div>

            {paymentMethod === 'credit_card' && (
              <div className="mb-6 space-y-4">
                <div>
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Numéro de carte
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className={`w-full px-3 py-2 border ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="cardName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom sur la carte
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      errors.cardName ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  />
                  {errors.cardName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expiry"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date d'expiration
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      placeholder="MM/YY"
                      maxLength="5"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className={`w-full px-3 py-2 border ${
                        errors.expiry ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    />
                    {errors.expiry && <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>}
                  </div>

                  <div>
                    <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                      Code de sécurité (CVV)
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      placeholder="123"
                      maxLength="4"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3 py-2 border ${
                        errors.cvv ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    />
                    {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'mobile_payment' && (
              <div className="p-4 bg-gray-50 rounded-md mb-6">
                <p className="text-gray-700">
                  Instructions pour le paiement mobile seront envoyées à votre téléphone.
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="p-4 bg-gray-50 rounded-md mb-6">
                <p className="text-gray-700">
                  Vous paierez directement au professionnel lors de votre rendez-vous.
                </p>
              </div>
            )}

            <div className="flex items-center mb-6">
              <FaLock className="text-green-600 mr-2" />
              <p className="text-sm text-gray-600">
                Toutes vos informations de paiement sont sécurisées et cryptées
              </p>
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
                  'Payer maintenant'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
