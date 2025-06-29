import L from 'leaflet';
import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';

// Create a custom icon for markers
const createCustomIcon = (color = '#4F46E5', imgUrl = null) => {
  const iconHtml = renderToString(
    <div className="relative">
      {imgUrl ? (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${color}`,
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          }}
        >
          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <FaMapMarkerAlt className="text-3xl" style={{ color }} />
      )}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const getImageUrl = professional => {
  // Check for profile photo first
  if (professional.profilePhoto) {
    return professional.profilePhoto.startsWith('http')
      ? professional.profilePhoto
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${professional.profilePhoto}`;
  }

  // Fall back to cover images
  if (professional.coverImages && professional.coverImages.length > 0) {
    return professional.coverImages[0].startsWith('http')
      ? professional.coverImages[0]
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${professional.coverImages[0]}`;
  }

  // Return null if no image available
  return null;
};

const MapView = ({ professionals, height = '500px', onProfessionalSelect, userLocation }) => {
  useEffect(() => {
    // Initialize map
    const mapContainer = L.DomUtil.get('map');

    if (mapContainer !== null) {
      mapContainer._leaflet_id = null;
    }

    const map = L.map('map').setView([31.7917, -7.0926], 5); // Default center on Morocco

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add user location marker if available
    if (userLocation && userLocation.lat && userLocation.lng) {
      L.marker([userLocation.lat, userLocation.lng], {
        icon: createCustomIcon('#2563EB'),
      })
        .addTo(map)
        .bindPopup('Votre position')
        .openPopup();

      // Center map on user location
      map.setView([userLocation.lat, userLocation.lng], 10);
    }

    // Add professionals markers
    if (professionals && professionals.length > 0) {
      const bounds = L.latLngBounds();

      professionals.forEach(professional => {
        if (
          professional.businessAddress &&
          professional.businessAddress.coordinates &&
          professional.businessAddress.coordinates.lat &&
          professional.businessAddress.coordinates.lng
        ) {
          const { lat, lng } = professional.businessAddress.coordinates;
          const imgUrl = getImageUrl(professional);

          // Create marker without storing reference since we don't need it later
          L.marker([lat, lng], {
            icon: createCustomIcon('#4F46E5', imgUrl),
          }).addTo(map).bindPopup(`
            <div style="width: 200px">
              <div style="display: flex; align-items: center; margin-bottom: 8px">
                ${
                  imgUrl
                    ? `<img src="${imgUrl}" alt="" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 8px" />`
                    : `<div style="width: 40px; height: 40px; border-radius: 50%; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center; margin-right: 8px">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px; color: #9ca3af">
                        <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                      </svg>
                    </div>`
                }
                <div>
                  <strong>${professional.businessName}</strong>
                  <p style="margin: 0; font-size: 12px">${professional.businessType}</p>
                </div>
              </div>
              <button 
                style="width: 100%; padding: 4px 8px; background-color: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer"
                onclick="window.selectProfessional('${professional._id}')"
              >
                Voir profil
              </button>
            </div>
          `);

          bounds.extend([lat, lng]);
        }
      });

      // Fit map to bounds if we have professionals with coordinates
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Clean up on unmount
    return () => {
      map.remove();
    };
  }, [professionals, userLocation]);

  // Define global function to handle professional selection from popup
  useEffect(() => {
    window.selectProfessional = id => {
      if (onProfessionalSelect) {
        onProfessionalSelect(id);
      }
    };

    return () => {
      delete window.selectProfessional;
    };
  }, [onProfessionalSelect]);

  return <div id="map" style={{ height, width: '100%' }} className="rounded-lg"></div>;
};

export default MapView;
