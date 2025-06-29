// Configuration pour Google Maps
// Remplacez cette valeur par votre clé API Google Maps
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAbJxHdER6PJovSrk8NJm38dPxMBAVWFOg';

// Options par défaut pour la carte
export const defaultMapOptions = {
  center: {
    lat: 33.589886, // Centre du Maroc
    lng: -7.603869, // Casablanca
  },
  zoom: 13,
  libraries: ['places'],
  mapContainerStyle: {
    width: '100%',
  },
};
