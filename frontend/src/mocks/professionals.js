// Données fictives pour les professionnels à utiliser quand l'API n'est pas disponible
export const mockProfessionals = [
  {
    _id: '1',
    userId: '1001',
    title: 'Instructeur de Yoga certifié',
    businessName: 'Yoga Zen Center',
    businessType: 'yoga',
    description:
      'Un centre de yoga moderne offrant diverses pratiques de yoga pour tous les niveaux.',
    coverImages: ['https://images.unsplash.com/photo-1588286840104-8957b019727f?q=80&w=1000'],
    businessAddress: {
      street: '123 Rue de la Paix',
      city: 'Casablanca',
      country: 'Morocco',
      coordinates: {
        lat: 33.5731,
        lng: -7.5898,
      },
    },
    address: '123 Rue de la Paix, Casablanca, Morocco',
    contactInfo: {
      phone: '0612345678',
      email: 'contact@yogazencenter.ma',
      website: 'www.yogazencenter.ma',
    },
    activities: ['Yoga', 'Méditation', 'Relaxation'],
    rating: {
      average: 4.8,
      totalReviews: 24,
    },
    services: [
      {
        name: 'Yoga Hatha',
        price: {
          amount: 150,
          currency: 'MAD',
        },
        description: 'Session de yoga traditionnelle adaptée à tous les niveaux',
        duration: 60,
      },
      {
        name: 'Yoga Vinyasa',
        price: {
          amount: 180,
          currency: 'MAD',
        },
        description: 'Session dynamique pour développer force et souplesse',
        duration: 75,
      },
    ],
    businessHours: [
      { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '19:00' },
      { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'sunday', isOpen: false },
    ],
    paymentEnabled: true,
    bookingMode: 'auto',
    isVerified: true,
    isActive: true,
    subscription: {
      plan: 'premium',
      isActive: true,
      startDate: new Date('2025-01-15').toISOString(),
    },
    sessions: [],
    events: [],
    products: [],
    certifications: [
      {
        name: 'Yoga Alliance RYT-200',
        issuer: 'Yoga Alliance',
        year: 2020,
      },
    ],
    createdAt: new Date('2024-12-01').toISOString(),
    updatedAt: new Date('2025-05-15').toISOString(),
  },
  {
    _id: '2',
    userId: '1002',
    title: 'Thérapeute en massages holistiques',
    businessName: 'Massage & Bien-être',
    businessType: 'massage',
    description: 'Massages thérapeutiques et relaxants dans un environnement calme et apaisant.',
    coverImages: ['https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=1000'],
    businessAddress: {
      street: '45 Avenue Mohammed V',
      city: 'Rabat',
      country: 'Morocco',
      coordinates: {
        lat: 34.0209,
        lng: -6.8416,
      },
    },
    address: '45 Avenue Mohammed V, Rabat, Morocco',
    contactInfo: {
      phone: '0661234567',
      email: 'contact@massage-bien-etre.ma',
      website: 'www.massage-bien-etre.ma',
    },
    activities: ['Massage', 'Relaxation', 'Thérapie holistique'],
    rating: {
      average: 4.5,
      totalReviews: 18,
    },
    services: [
      {
        name: 'Massage relaxant',
        price: {
          amount: 300,
          currency: 'MAD',
        },
        description: 'Massage complet du corps pour une relaxation profonde',
        duration: 60,
      },
      {
        name: 'Massage thérapeutique',
        price: {
          amount: 350,
          currency: 'MAD',
        },
        description: 'Massage ciblé pour soulager les tensions et douleurs musculaires',
        duration: 60,
      },
    ],
    businessHours: [
      { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'saturday', isOpen: true, openTime: '10:00', closeTime: '15:00' },
      { day: 'sunday', isOpen: false },
    ],
    paymentEnabled: false,
    bookingMode: 'manual',
    isVerified: true,
    isActive: true,
    subscription: {
      plan: 'basic',
      isActive: true,
      startDate: new Date('2025-02-10').toISOString(),
    },
    sessions: [],
    events: [],
    products: [],
    certifications: [
      {
        name: 'Certification en Massage Thérapeutique',
        issuer: 'École Internationale de Massage',
        year: 2019,
      },
    ],
    createdAt: new Date('2025-01-15').toISOString(),
    updatedAt: new Date('2025-05-10').toISOString(),
  },
  {
    _id: '3',
    userId: '1003',
    title: 'Instructeur de méditation et pleine conscience',
    businessName: 'Méditation Pleine Conscience',
    businessType: 'meditation',
    description: 'Pratiques de méditation pour réduire le stress et améliorer le bien-être mental.',
    coverImages: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000'],
    businessAddress: {
      street: '78 Rue des Jardins',
      city: 'Marrakech',
      country: 'Morocco',
      coordinates: {
        lat: 31.6295,
        lng: -7.9811,
      },
    },
    address: '78 Rue des Jardins, Marrakech, Morocco',
    contactInfo: {
      phone: '0671234567',
      email: 'contact@meditation-pleine-conscience.ma',
      website: 'www.meditation-pleine-conscience.ma',
    },
    activities: ['Méditation', 'Pleine conscience', 'Gestion du stress'],
    rating: {
      average: 4.9,
      totalReviews: 32,
    },
    services: [
      {
        name: 'Séance de groupe',
        price: {
          amount: 100,
          currency: 'MAD',
        },
        description: 'Méditation guidée en groupe pour tous niveaux',
        duration: 45,
      },
      {
        name: 'Séance individuelle',
        price: {
          amount: 250,
          currency: 'MAD',
        },
        description: 'Accompagnement personnalisé pour une pratique adaptée à vos besoins',
        duration: 60,
      },
    ],
    businessHours: [
      { day: 'monday', isOpen: true, openTime: '07:00', closeTime: '20:00' },
      { day: 'tuesday', isOpen: true, openTime: '07:00', closeTime: '20:00' },
      { day: 'wednesday', isOpen: true, openTime: '07:00', closeTime: '20:00' },
      { day: 'thursday', isOpen: true, openTime: '07:00', closeTime: '20:00' },
      { day: 'friday', isOpen: true, openTime: '07:00', closeTime: '20:00' },
      { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'sunday', isOpen: true, openTime: '09:00', closeTime: '12:00' },
    ],
    paymentEnabled: true,
    bookingMode: 'auto',
    isVerified: true,
    isActive: true,
    subscription: {
      plan: 'premium',
      isActive: true,
      startDate: new Date('2025-01-05').toISOString(),
    },
    sessions: [],
    events: [],
    products: [],
    certifications: [
      {
        name: 'Certification en Méditation et Pleine Conscience',
        issuer: 'Institut Mindfulness',
        year: 2021,
      },
    ],
    createdAt: new Date('2024-11-20').toISOString(),
    updatedAt: new Date('2025-05-20').toISOString(),
  },
  {
    _id: '4',
    userId: '1004',
    title: 'Maître Reiki',
    businessName: 'Équilibre Énergétique',
    businessType: 'reiki',
    description:
      "Séances de Reiki pour harmoniser votre énergie vitale et favoriser la guérison naturelle du corps et de l'esprit.",
    coverImages: ['https://images.unsplash.com/photo-1601286794459-1da6a20e3587?q=80&w=1000'],
    businessAddress: {
      street: '15 Rue Al Houria',
      city: 'Tanger',
      country: 'Morocco',
      coordinates: {
        lat: 35.7633,
        lng: -5.8335,
      },
    },
    address: '15 Rue Al Houria, Tanger, Morocco',
    contactInfo: {
      phone: '0661122334',
      email: 'contact@equilibre-energetique.ma',
      website: 'www.equilibre-energetique.ma',
    },
    activities: ['Reiki', 'Soins énergétiques', 'Relaxation profonde'],
    rating: {
      average: 4.7,
      totalReviews: 15,
    },
    services: [
      {
        name: 'Séance de Reiki',
        price: {
          amount: 280,
          currency: 'MAD',
        },
        description: 'Harmonisation énergétique complète',
        duration: 60,
      },
      {
        name: 'Initiation au Reiki niveau 1',
        price: {
          amount: 1200,
          currency: 'MAD',
        },
        description: 'Formation pour apprendre les bases du Reiki',
        duration: 240,
      },
    ],
    businessHours: [
      { day: 'monday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'tuesday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'wednesday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'thursday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'friday', isOpen: true, openTime: '10:00', closeTime: '16:00' },
      { day: 'saturday', isOpen: false },
      { day: 'sunday', isOpen: false },
    ],
    paymentEnabled: true,
    bookingMode: 'manual',
    isVerified: true,
    isActive: true,
    subscription: {
      plan: 'basic',
      isActive: true,
      startDate: new Date('2025-03-01').toISOString(),
    },
    sessions: [],
    events: [],
    products: [],
    certifications: [
      {
        name: 'Maître Reiki Usui',
        issuer: 'Fédération Internationale de Reiki',
        year: 2018,
      },
    ],
    createdAt: new Date('2025-03-01').toISOString(),
    updatedAt: new Date('2025-05-15').toISOString(),
  },
];

// Fonction pour filtrer les professionnels selon des critères
export const filterProfessionals = (professionals, filters = {}) => {
  return professionals.filter(professional => {
    // Filtre par recherche textuelle
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = professional.businessName.toLowerCase().includes(searchLower);
      const typeMatch = professional.businessType.toLowerCase().includes(searchLower);
      const descMatch =
        professional.description && professional.description.toLowerCase().includes(searchLower);
      const titleMatch =
        professional.title && professional.title.toLowerCase().includes(searchLower);
      const activitiesMatch =
        professional.activities &&
        professional.activities.some(activity => activity.toLowerCase().includes(searchLower));

      if (!nameMatch && !typeMatch && !descMatch && !titleMatch && !activitiesMatch) {
        return false;
      }
    }

    // Filtre par catégorie
    if (filters.category && filters.category !== '') {
      if (professional.businessType !== filters.category) {
        return false;
      }
    }

    return true;
  });
};
