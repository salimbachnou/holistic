const mongoose = require('mongoose');
const Session = require('../models/Session');
const Review = require('../models/Review');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Booking = require('../models/Booking');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic';

// Exemples de commentaires pour les reviews
const sampleComments = [
  "Excellente session ! J'ai beaucoup appris et le professionnel était très compétent.",
  "Session très enrichissante, je recommande vivement. L'ambiance était parfaite.",
  "Bonne session dans l'ensemble, quelques points à améliorer mais globalement satisfait.",
  "Session exceptionnelle ! Dépassé mes attentes. Très professionnel et à l'écoute.",
  "Très bonne expérience, j'ai pu poser toutes mes questions et obtenir des réponses claires.",
  "Session intéressante mais un peu courte à mon goût. Sinon très bien organisée.",
  "Parfait ! Exactement ce que je cherchais. Je reviendrai certainement.",
  "Session de qualité avec des conseils pratiques très utiles.",
  "Très satisfait de cette session. Le professionnel maîtrise parfaitement son sujet.",
  "Bonne session, bien structurée et interactive. Je recommande."
];

async function createTestSessionsWithReviews() {
  try {
    console.log('🌱 Création de sessions de test avec reviews...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer le premier professionnel
    const professional = await Professional.findOne({});
    if (!professional) {
      console.log('❌ Aucun professionnel trouvé');
      return;
    }
    console.log(`👨‍💼 Professionnel trouvé: ${professional.businessName}`);

    // Récupérer tous les utilisateurs clients
    const clients = await User.find({ role: 'client' });
    console.log(`👥 Trouvé ${clients.length} clients`);

    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé');
      return;
    }

    // Créer des sessions de test (certaines terminées, d'autres programmées)
    const sessionsToCreate = [
      {
        title: "Session de méditation guidée",
        description: "Une session relaxante de méditation pour débutants",
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        duration: 60,
        maxParticipants: 8,
        price: 50,
        category: 'group',
        location: "Centre de bien-être, 123 Rue de la Paix, Casablanca",
        status: 'completed'
      },
      {
        title: "Séance de yoga matinal",
        description: "Réveillez votre corps avec une séance de yoga douce",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
        duration: 90,
        maxParticipants: 10,
        price: 40,
        category: 'group',
        location: "Studio Yoga Zen, 456 Avenue Mohammed V, Rabat",
        status: 'completed'
      },
      {
        title: "Consultation nutritionnelle",
        description: "Bilan nutritionnel personnalisé",
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        duration: 45,
        maxParticipants: 1,
        price: 80,
        category: 'individual',
        location: "Cabinet de nutrition, 789 Rue Hassan II, Fès",
        status: 'completed'
      },
      {
        title: "Atelier de respiration",
        description: "Techniques de respiration pour la relaxation",
        startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Il y a 4 jours
        duration: 75,
        maxParticipants: 12,
        price: 35,
        category: 'workshop',
        location: "Salle de conférence, Hôtel Atlas, Marrakech",
        status: 'completed'
      },
      {
        title: "Session de thérapie holistique",
        description: "Approche globale du bien-être",
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        duration: 90,
        maxParticipants: 6,
        price: 100,
        category: 'group',
        location: "Centre holistique Harmonie, 321 Boulevard Zerktouni, Casablanca",
        status: 'completed'
      },
      {
        title: "Session en ligne de méditation",
        description: "Session de méditation avancée en ligne",
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
        duration: 60,
        maxParticipants: 8,
        price: 55,
        category: 'online',
        meetingLink: "https://zoom.us/j/123456789",
        status: 'scheduled'
      }
    ];

    let sessionsCreated = 0;
    let reviewsCreated = 0;

    // Créer les sessions
    for (const sessionData of sessionsToCreate) {
      const session = new Session({
        ...sessionData,
        professionalId: professional._id
      });
      await session.save();
      sessionsCreated++;
      console.log(`✅ Session créée: ${session.title} (${session.status})`);

      // Si la session est terminée, ajouter des reviews
      if (session.status === 'completed') {
        // Générer entre 2 et 5 reviews par session
        const numberOfReviews = Math.floor(Math.random() * 4) + 2;
        console.log(`   📝 Génération de ${numberOfReviews} reviews`);

        // Mélanger les clients et prendre les premiers
        const shuffledClients = clients.sort(() => 0.5 - Math.random());
        const selectedClients = shuffledClients.slice(0, numberOfReviews);

        for (const client of selectedClients) {
          try {
            // Créer une réservation confirmée pour ce client
            const booking = new Booking({
              client: client._id,
              professional: professional._id,
              service: {
                type: 'session',
                sessionId: session._id,
                title: session.title,
                date: session.startTime,
                duration: session.duration,
                price: session.price
              },
              status: 'completed',
              totalAmount: session.price,
              paymentStatus: 'completed',
              createdAt: new Date(session.startTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
            await booking.save();

            // Générer une note aléatoire (biaisée vers les bonnes notes)
            const ratings = [3, 4, 4, 4, 5, 5, 5, 5]; // Plus de 4 et 5 étoiles
            const rating = ratings[Math.floor(Math.random() * ratings.length)];

            // Choisir un commentaire aléatoire
            const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];

            // Créer la review
            const review = new Review({
              clientId: client._id,
              professionalId: professional._id,
              contentId: session._id,
              contentType: 'session',
              contentTitle: session.title,
              rating: rating,
              comment: comment,
              status: 'approved',
              createdAt: new Date(session.startTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            });

            await review.save();
            reviewsCreated++;

            console.log(`   ✅ Review créée: ${client.firstName} ${client.lastName} - ${rating}⭐`);

          } catch (error) {
            console.error(`   ❌ Erreur pour ${client.firstName} ${client.lastName}:`, error.message);
          }
        }

        // Mettre à jour les statistiques de cette session
        await updateSessionAverageRating(session._id);
        console.log(`   📊 Statistiques mises à jour pour la session`);
      }
    }

    console.log('\n🎉 Processus terminé !');
    console.log(`✅ ${sessionsCreated} sessions créées`);
    console.log(`✅ ${reviewsCreated} reviews créées`);

  } catch (error) {
    console.error('❌ Erreur lors du processus:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Fonction helper pour mettre à jour les statistiques d'une session
async function updateSessionAverageRating(sessionId) {
  try {
    const avgRating = await Review.aggregate([
      { $match: { contentId: sessionId, contentType: 'session', status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const rating = avgRating[0]?.avgRating || 0;
    const reviewCount = avgRating[0]?.count || 0;

    await Session.findByIdAndUpdate(sessionId, {
      averageRating: rating,
      reviewCount: reviewCount
    });

    console.log(`     📊 Session mise à jour: ${rating.toFixed(1)}⭐ (${reviewCount} avis)`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des statistiques de la session:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTestSessionsWithReviews();
}

module.exports = { createTestSessionsWithReviews }; 