import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Users,
  Euro,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import React, { useState } from 'react';

// Composant pour afficher une session avec navigation
const SessionCarousel = ({ sessions, onBookSession, isDesktop = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (sessions.length === 0) return null;

  const session = sessions[currentIndex];
  const sessionDate = parseISO(session.startTime);
  const isPast = sessionDate < new Date();
  const isAvailable = (session.participants?.length || 0) < session.maxParticipants;

  const nextSession = () => {
    setCurrentIndex(prev => (prev + 1) % sessions.length);
  };

  const prevSession = () => {
    setCurrentIndex(prev => (prev - 1 + sessions.length) % sessions.length);
  };

  return (
    <div className="relative w-full">
      {/* Navigation buttons */}
      {sessions.length > 1 && (
        <>
          <button
            onClick={prevSession}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="h-3 w-3 text-gray-600" />
          </button>
          <button
            onClick={nextSession}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="h-3 w-3 text-gray-600" />
          </button>
        </>
      )}

      {/* Session simple */}
      <div className={`${sessions.length > 1 ? 'mx-4' : ''}`}>
        {/* Titre de la session */}
        <div className="text-center mb-1">
          <h3
            className={`font-semibold text-gray-900 ${isDesktop ? 'text-xs' : 'text-sm'} truncate`}
          >
            {session.title}
          </h3>
        </div>

        {/* Status */}
        <div className="text-center mb-2">
          {isPast ? (
            <span className={`font-semibold text-gray-600 ${isDesktop ? 'text-sm' : 'text-base'}`}>
              Terminée
            </span>
          ) : !isAvailable ? (
            <span className={`font-semibold text-red-600 ${isDesktop ? 'text-sm' : 'text-base'}`}>
              Complet
            </span>
          ) : (
            <span className={`font-semibold text-green-600 ${isDesktop ? 'text-sm' : 'text-base'}`}>
              Disponible
            </span>
          )}
        </div>

        {/* Heure */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center mb-1">
            <Clock className={`text-blue-600 mr-1 ${isDesktop ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className={`font-bold text-blue-600 ${isDesktop ? 'text-sm' : 'text-base'}`}>
              {format(parseISO(session.startTime), 'HH:mm')}
            </span>
          </div>
          <p className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-sm'}`}>
            ({session.duration} min)
          </p>
        </div>

        {/* Prix et Places */}
        <div className="text-center space-y-1 mb-2">
          <div className="flex items-center justify-center">
            <Euro className="w-3 h-3 text-green-600 mr-1" />
            <span className={`font-semibold text-green-600 ${isDesktop ? 'text-xs' : 'text-sm'}`}>
              {session.price?.amount || session.price} {session.price?.currency || 'MAD'}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <Users className="w-3 h-3 text-gray-500 mr-1" />
            <span className={`text-gray-700 ${isDesktop ? 'text-xs' : 'text-sm'}`}>
              {session.participants?.length || 0}/{session.maxParticipants} places
            </span>
          </div>
        </div>

        {/* Bouton d'action */}
        {!isPast && isAvailable ? (
          <button
            onClick={() => onBookSession(session)}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200 ${isDesktop ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-sm'}`}
          >
            Réserver
          </button>
        ) : !isPast && !isAvailable ? (
          <div
            className={`w-full bg-gray-400 text-white font-medium rounded text-center ${isDesktop ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-sm'}`}
          >
            Complet
          </div>
        ) : (
          <div
            className={`w-full bg-gray-300 text-gray-600 font-medium rounded text-center ${isDesktop ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-sm'}`}
          >
            Terminée
          </div>
        )}
      </div>

      {/* Indicators */}
      {sessions.length > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {sessions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PlanningSection = ({
  currentWeekStart,
  weekDays,
  handlePreviousWeek,
  handleNextWeek,
  getDaysSessions,
  handleBookSession,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header Section */}
      <div className="bg-gray-50 p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Planning des Sessions</h2>
              <p className="text-gray-600">
                {format(currentWeekStart, 'd MMMM', { locale: fr })} -{' '}
                {format(addDays(currentWeekStart, 6), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors duration-200 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </button>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors duration-200 flex items-center"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Mobile View */}
        <div className="block lg:hidden space-y-4">
          {weekDays.map((day, index) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div key={index} className="bg-gray-50 rounded-lg border border-gray-200">
                {/* Mobile Day Header */}
                <div className={`p-4 border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="font-semibold">{format(day, 'd', { locale: fr })}</span>
                      </div>
                      <div>
                        <p className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {format(day, 'EEEE', { locale: fr })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(day, 'MMM', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {getDaysSessions(day).length} session
                      {getDaysSessions(day).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Mobile Sessions */}
                <div className="p-3 min-h-[200px] flex items-center">
                  {getDaysSessions(day).length > 0 ? (
                    <SessionCarousel
                      sessions={getDaysSessions(day)}
                      onBookSession={handleBookSession}
                      isDesktop={false}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center w-full">
                      <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Aucune session programmée</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid lg:grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Desktop Day Header */}
                <div
                  className={`p-4 text-center border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {format(day, 'EEEE', { locale: fr })}
                  </p>
                  <div
                    className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="font-semibold">{format(day, 'd', { locale: fr })}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format(day, 'MMM', { locale: fr })}</p>
                </div>

                {/* Desktop Sessions */}
                <div className="p-2 min-h-[300px] flex items-center relative">
                  {getDaysSessions(day).length > 0 ? (
                    <div className="w-full">
                      <SessionCarousel
                        sessions={getDaysSessions(day)}
                        onBookSession={handleBookSession}
                        isDesktop={true}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center w-full">
                      <Calendar className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-xs">Aucune session</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanningSection;
