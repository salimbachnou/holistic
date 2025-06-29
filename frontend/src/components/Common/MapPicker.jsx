import L from 'leaflet';
import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

// Create a custom icon for the marker
const createCustomIcon = (color = '#4F46E5') => {
  const iconHtml = renderToString(
    <div className="relative">
      <FaMapMarkerAlt className="text-3xl" style={{ color }} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

const MapPicker = ({
  initialAddress = '',
  initialCoordinates = null,
  onAddressSelected,
  height = '400px',
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize the map
  useEffect(() => {
    // Initialize map
    const mapContainer = L.DomUtil.get('map-picker');

    if (mapContainer !== null) {
      mapContainer._leaflet_id = null;
    }

    // Create the map with Morocco as the default center if no coordinates provided
    const map = L.map('map-picker').setView(
      coordinates ? [coordinates.lat, coordinates.lng] : [31.7917, -7.0926],
      coordinates ? 13 : 5
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create initial marker if coordinates provided
    if (coordinates) {
      markerRef.current = L.marker([coordinates.lat, coordinates.lng], {
        icon: createCustomIcon(),
        draggable: true,
      }).addTo(map);

      // Listen for marker drag end event
      markerRef.current.on('dragend', async function (_e) {
        const position = markerRef.current.getLatLng();
        setCoordinates({ lat: position.lat, lng: position.lng });

        // Reverse geocode to get address
        try {
          const addressFromCoords = await reverseGeocode(position.lat, position.lng);
          setAddress(addressFromCoords);
          if (onAddressSelected) {
            onAddressSelected({
              address: addressFromCoords,
              coordinates: { lat: position.lat, lng: position.lng },
            });
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      });
    }

    // Handle map click to set/move marker
    map.on('click', async function (e) {
      const { lat, lng } = e.latlng;

      // If marker already exists, move it
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        // Create a new marker
        markerRef.current = L.marker([lat, lng], {
          icon: createCustomIcon(),
          draggable: true,
        }).addTo(map);

        // Listen for marker drag end event
        markerRef.current.on('dragend', async function (_e) {
          const position = markerRef.current.getLatLng();
          setCoordinates({ lat: position.lat, lng: position.lng });

          // Reverse geocode to get address
          try {
            const addressFromCoords = await reverseGeocode(position.lat, position.lng);
            setAddress(addressFromCoords);
            if (onAddressSelected) {
              onAddressSelected({
                address: addressFromCoords,
                coordinates: { lat: position.lat, lng: position.lng },
              });
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        });
      }

      setCoordinates({ lat, lng });

      // Reverse geocode to get address
      try {
        const addressFromCoords = await reverseGeocode(lat, lng);
        setAddress(addressFromCoords);
        if (onAddressSelected) {
          onAddressSelected({
            address: addressFromCoords,
            coordinates: { lat, lng },
          });
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);
      }
    });

    mapRef.current = map;

    // Clean up on unmount
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr-FR,fr', // Prefer French results
          },
        }
      );
      const data = await response.json();

      if (data && data.address) {
        // Construire une adresse formatée et plus lisible
        const address = data.address;

        // Extraire les composants de l'adresse dans un ordre logique
        const street = address.road || address.street || address.pedestrian || '';
        const houseNumber = address.house_number || '';
        const neighbourhood = address.neighbourhood || address.suburb || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const state = address.state || address.region || '';
        const country = address.country || 'Morocco';

        // Construire l'adresse en fonction des composants disponibles
        let formattedAddress = '';

        if (houseNumber && street) {
          formattedAddress += `${houseNumber} ${street}`;
        } else if (street) {
          formattedAddress += street;
        }

        if (neighbourhood && !formattedAddress.includes(neighbourhood)) {
          formattedAddress += formattedAddress ? `, ${neighbourhood}` : neighbourhood;
        }

        if (city && !formattedAddress.includes(city)) {
          formattedAddress += formattedAddress ? `, ${city}` : city;
        }

        if (state && !formattedAddress.includes(state) && state !== city) {
          formattedAddress += formattedAddress ? `, ${state}` : state;
        }

        if (country && !formattedAddress.includes(country)) {
          formattedAddress += formattedAddress ? `, ${country}` : country;
        }

        return formattedAddress || data.display_name;
      }

      // Fallback à l'adresse complète si on ne peut pas construire une adresse formatée
      if (data && data.display_name) {
        return data.display_name;
      }

      return 'Adresse non trouvée';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Erreur de géocodage';
    }
  };

  // Function to search for an address and show results
  const searchAddress = async searchTerm => {
    if (!searchTerm || searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchTerm
        )}&limit=5&countrycodes=ma&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr-FR,fr', // Prefer French results
          },
        }
      );
      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = result => {
    setAddress(result.display_name);
    setCoordinates({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });

    // Move map to the selected location
    if (mapRef.current) {
      mapRef.current.setView([parseFloat(result.lat), parseFloat(result.lon)], 15);

      // Add or move marker
      if (markerRef.current) {
        markerRef.current.setLatLng([parseFloat(result.lat), parseFloat(result.lon)]);
      } else {
        markerRef.current = L.marker([parseFloat(result.lat), parseFloat(result.lon)], {
          icon: createCustomIcon(),
          draggable: true,
        }).addTo(mapRef.current);

        // Listen for marker drag end event
        markerRef.current.on('dragend', async function (_e) {
          const position = markerRef.current.getLatLng();
          setCoordinates({ lat: position.lat, lng: position.lng });

          // Reverse geocode to get address
          try {
            const addressFromCoords = await reverseGeocode(position.lat, position.lng);
            setAddress(addressFromCoords);
            if (onAddressSelected) {
              onAddressSelected({
                address: addressFromCoords,
                coordinates: { lat: position.lat, lng: position.lng },
              });
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        });
      }
    }

    // Clear search results
    setSearchResults([]);

    // Call the callback with selected address and coordinates
    if (onAddressSelected) {
      onAddressSelected({
        address: result.display_name,
        coordinates: { lat: parseFloat(result.lat), lng: parseFloat(result.lon) },
      });
    }
  };

  return (
    <div className="map-picker-container">
      {/* Search box */}
      <div className="relative mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={address}
              onChange={e => {
                setAddress(e.target.value);
                searchAddress(e.target.value);
              }}
              placeholder="Rechercher une adresse..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelectSearchResult(result)}
                className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm"
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500 mb-2">
        Cliquez sur la carte pour sélectionner votre emplacement ou recherchez une adresse
        ci-dessus.
      </p>

      {/* Map container */}
      <div
        id="map-picker"
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300"
      ></div>
    </div>
  );
};

export default MapPicker;
