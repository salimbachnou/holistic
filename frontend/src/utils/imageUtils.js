/**
 * Image utilities for handling professional images and fallbacks
 */

export const getImageUrl = (imagePath, basePath = '/uploads/profiles') => {
  if (!imagePath) return null;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it already starts with /uploads, prepend the API URL
  if (imagePath.startsWith('/uploads')) {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiUrl}${imagePath}`;
  }

  // Otherwise, construct the full path
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${apiUrl}${basePath}/${imagePath}`;
};

export const getDefaultFallbackImage = () => {
  return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000';
};

export const getPlaceholderImage = () => {
  return '/placeholder-image.svg';
};

export const handleImageError = (event, fallbackUrl = null) => {
  const img = event.target;

  // Prevent infinite loop
  if (img.getAttribute('data-error-handled')) {
    return;
  }

  img.setAttribute('data-error-handled', 'true');
  img.onerror = null;

  // Use provided fallback or default
  img.src = fallbackUrl || getDefaultFallbackImage();

  console.log('Image error handled:', img.src);
};

export const getProfessionalImage = (professional, imageType = 'cover') => {
  if (!professional) return getDefaultFallbackImage();

  switch (imageType) {
    case 'profile':
      if (professional.profilePhoto) {
        return getImageUrl(professional.profilePhoto);
      }
      if (professional.userId?.profileImage) {
        return getImageUrl(professional.userId.profileImage);
      }
      break;

    case 'cover':
    default:
      if (professional.coverImages && professional.coverImages.length > 0) {
        return getImageUrl(professional.coverImages[0]);
      }
      if (professional.profilePhoto) {
        return getImageUrl(professional.profilePhoto);
      }
      if (professional.userId?.profileImage) {
        return getImageUrl(professional.userId.profileImage);
      }
      break;
  }

  return getDefaultFallbackImage();
};
