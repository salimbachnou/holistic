// Script pour ajouter des favoris de test au localStorage pour tester l'interface
const testFavorites = {
  sessions: [
    {
      id: 'session1',
      title: 'Session de Yoga Matinal',
      description: 'Commencez votre journée avec une session de yoga relaxante',
      images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
      price: { amount: 50 },
      startTime: new Date().toISOString(),
    },
    {
      id: 'session2',
      title: 'Méditation Guidée',
      description: 'Session de méditation pour la sérénité intérieure',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      price: { amount: 30 },
      startTime: new Date(Date.now() + 86400000).toISOString(),
    }
  ],
  products: [
    {
      id: 'product1',
      title: 'Huile Essentielle de Lavande',
      description: 'Huile essentielle 100% naturelle pour la relaxation',
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400'],
      price: 25,
      currency: 'MAD',
      rating: { average: 4.5 }
    },
    {
      id: 'product2',
      title: 'Tapis de Yoga Premium',
      description: 'Tapis de yoga antidérapant en matériaux écologiques',
      images: ['https://images.unsplash.com/photo-1601925260368-60b87ac08bf8?w=400'],
      price: 120,
      currency: 'MAD',
      rating: { average: 4.8 }
    }
  ],
  professionals: [
    {
      id: 'prof1',
      businessName: 'Centre Bien-être Zen',
      businessType: 'yoga',
      description: 'Spécialiste en yoga et méditation',
      coverImages: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      rating: { average: 4.7, totalReviews: 45 }
    },
    {
      id: 'prof2',
      businessName: 'Aromathérapie Naturelle',
      businessType: 'aromatherapy',
      description: 'Expert en huiles essentielles et aromathérapie',
      profilePhoto: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      rating: { average: 4.6, totalReviews: 32 }
    }
  ],
  events: [
    {
      id: 'event1',
      title: 'Retraite Yoga Weekend',
      description: 'Weekend de retraite yoga dans les montagnes',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      time: '09:00',
      pricing: { amount: 350, currency: 'MAD' }
    },
    {
      id: 'event2', 
      title: 'Atelier Aromathérapie',
      description: 'Apprenez les bases de l\'aromathérapie',
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400'],
      date: new Date(Date.now() + 14 * 86400000).toISOString(),
      time: '14:00',
      pricing: { amount: 150, currency: 'MAD' }
    }
  ]
};

// Fonction pour ajouter les favoris de test au localStorage
function addTestFavoritesToLocalStorage(userId = 'test-user') {
  try {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(testFavorites));
    console.log('✅ Favoris de test ajoutés au localStorage');
    console.log('Favoris ajoutés:', testFavorites);
    
    // Afficher un résumé
    console.log(`
📊 Résumé des favoris de test:
🔵 Sessions: ${testFavorites.sessions.length}
🟢 Produits: ${testFavorites.products.length} 
🟣 Professionnels: ${testFavorites.professionals.length}
🟠 Événements: ${testFavorites.events.length}
📊 Total: ${Object.values(testFavorites).reduce((sum, arr) => sum + arr.length, 0)}
    `);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des favoris:', error);
  }
}

// Fonction pour vider les favoris
function clearTestFavorites(userId = 'test-user') {
  try {
    localStorage.removeItem(`favorites_${userId}`);
    console.log('🗑️ Favoris supprimés du localStorage');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des favoris:', error);
  }
}

// Fonction pour afficher les favoris actuels
function showCurrentFavorites(userId = 'test-user') {
  try {
    const favorites = localStorage.getItem(`favorites_${userId}`);
    if (favorites) {
      console.log('📋 Favoris actuels:', JSON.parse(favorites));
    } else {
      console.log('❌ Aucun favori trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture des favoris:', error);
  }
}

// Exporter les fonctions pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  window.addTestFavoritesToLocalStorage = addTestFavoritesToLocalStorage;
  window.clearTestFavorites = clearTestFavorites;
  window.showCurrentFavorites = showCurrentFavorites;
}

// Instructions d'utilisation
console.log(`
🔧 Fonctions disponibles:
- addTestFavoritesToLocalStorage('your-user-id') : Ajouter des favoris de test
- clearTestFavorites('your-user-id') : Vider les favoris
- showCurrentFavorites('your-user-id') : Afficher les favoris actuels

💡 Usage typique:
addTestFavoritesToLocalStorage('68377d614ed922ff666d59c9'); // Remplacez par l'ID utilisateur réel
`);

module.exports = { testFavorites, addTestFavoritesToLocalStorage, clearTestFavorites, showCurrentFavorites };
