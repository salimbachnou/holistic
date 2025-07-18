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

const MapView = ({
  sessions,
  professionals,
  height = '500px',
  userLocation,
  onProfessionalSelect,
  dataType = 'sessions', // 'sessions' or 'professionals'
}) => {
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
      map.setView([userLocation.lat, userLocation.lng], 10);
    }

    const bounds = L.latLngBounds();

    // Handle sessions data
    if (dataType === 'sessions' && sessions && sessions.length > 0) {
      sessions.forEach(session => {
        if (
          session.locationCoordinates &&
          session.locationCoordinates.lat &&
          session.locationCoordinates.lng
        ) {
          const { lat, lng } = session.locationCoordinates;
          L.marker([lat, lng], {
            icon: createCustomIcon('#4F46E5'),
          }).addTo(map).bindPopup(`
              <div style="width: 220px">
                <strong style="font-size: 16px;">${session.title}</strong>
                <p style="margin: 0; font-size: 13px; color: #666;">${session.location || ''}</p>
                <p style="margin: 0; font-size: 13px; color: #666;">
                  <b>Date :</b> ${session.startTime ? new Date(session.startTime).toLocaleString() : ''}
                </p>
                <p style="margin: 0; font-size: 13px; color: #666;">
                  <b>Durée :</b> ${session.duration} min
                </p>
                <p style="margin: 0; font-size: 13px; color: #666;">
                  <b>Catégorie :</b> ${session.category || ''}
                </p>
                <p style="margin: 0; font-size: 13px; color: #444;">
                  <b>Description :</b> ${session.description || ''}
                </p>
              </div>
            `);
          bounds.extend([lat, lng]);
        }
      });
    }

    // Handle professionals data
    if (dataType === 'professionals' && professionals && professionals.length > 0) {
      professionals.forEach(professional => {
        if (
          professional.businessAddress &&
          professional.businessAddress.coordinates &&
          professional.businessAddress.coordinates.lat &&
          professional.businessAddress.coordinates.lng
        ) {
          const { lat, lng } = professional.businessAddress.coordinates;

          // Get image URL for professional
          let imageUrl = null;
          if (professional.profilePhoto) {
            imageUrl = professional.profilePhoto;
          } else if (professional.coverImages && professional.coverImages.length > 0) {
            imageUrl = professional.coverImages[0];
          } else if (professional.userId?.profileImage) {
            imageUrl = professional.userId.profileImage;
          }

          const marker = L.marker([lat, lng], {
            icon: createCustomIcon('#10B981', imageUrl), // Green color for professionals
          }).addTo(map);

          // Create popup content
          const popupContent = `
            <div style="width: 250px">
              <strong style="font-size: 16px;">${professional.businessName || professional.title}</strong>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">${professional.businessType || ''}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">
                <b>Adresse :</b> ${
                  professional.address ||
                  (professional.businessAddress
                    ? `${professional.businessAddress.street || ''}, ${professional.businessAddress.city || ''}, ${professional.businessAddress.country || ''}`
                    : '')
                }
              </p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">
                <b>Note :</b> ${professional.rating?.average || 0}/5 (${professional.rating?.totalReviews || 0} avis)
              </p>
              <p style="margin: 5px 0; font-size: 13px; color: #444;">
                <b>Description :</b> ${professional.description || ''}
              </p>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Add click handler if onProfessionalSelect is provided
          if (onProfessionalSelect) {
            marker.on('click', () => {
              onProfessionalSelect(professional._id);
            });
          }

          bounds.extend([lat, lng]);
        }
      });
    }

    // Fit bounds if we have valid coordinates
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Clean up on unmount
    return () => {
      map.remove();
    };
  }, [sessions, professionals, userLocation, dataType, onProfessionalSelect]);

  return <div id="map" style={{ height, width: '100%' }} className="rounded-lg"></div>;
};

export default MapView;
