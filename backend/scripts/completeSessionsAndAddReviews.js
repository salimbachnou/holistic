const mongoose = require('mongoose');
const Session = require('../models/Session');
const Review = require('../models/Review');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Booking = require('../models/Booking');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic_app';

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

async function completeSessionsAndAddReviews() {
  try {
    console.log('🌱 Démarrage du processus de completion des sessions et ajout des reviews...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer quelques sessions programmées dans le passé
    const pastSessions = await Session.find({ 
      status: 'scheduled',
      startTime: { $lt: new Date() }
    }).limit(10);

    console.log(`📊 Trouvé ${pastSessions.length} sessions passées à terminer`);

    if (pastSessions.length === 0) {
      console.log('❌ Aucune session passée trouvée. Créons quelques sessions de test...');
      await createTestSessions();
      return;
    }

    // Récupérer tous les utilisateurs clients
    const clients = await User.find({ role: 'client' });
    console.log(`👥 Trouvé ${clients.length} clients`);

    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé. Créons quelques clients de test...');
      await createTestClients();
      return;
    }

    let sessionsCompleted = 0;
    let reviewsCreated = 0;

    // Pour chaque session passée, la marquer comme terminée et ajouter des reviews
    for (const session of pastSessions) {
      console.log(`\n🎯 Traitement de la session: ${session.title}`);

      // Marquer la session comme terminée
      session.status = 'completed';
      await session.save();
      sessionsCompleted++;
      console.log(`   ✅ Session marquée comme terminée`);

      // Générer entre 2 et 5 reviews par session
      const numberOfReviews = Math.floor(Math.random() * 4) + 2;
      console.log(`   📝 Génération de ${numberOfReviews} reviews`);

      // Mélanger les clients et prendre les premiers
      const shuffledClients = clients.sort(() => 0.5 - Math.random());
      const selectedClients = shuffledClients.slice(0, numberOfReviews);

      for (const client of selectedClients) {
        try {
          // Vérifier si une review existe déjà pour ce client et cette session
          const existingReview = await Review.findOne({
            clientId: client._id,
            contentId: session._id,
            contentType: 'session'
          });

          if (existingReview) {
            console.log(`   ⚠️  Review déjà existante pour ${client.firstName} ${client.lastName}`);
            continue;
          }

          // Créer une réservation confirmée pour ce client (si elle n'existe pas)
          let booking = await Booking.findOne({
            'service.sessionId': session._id,
            client: client._id
          });

          if (!booking) {
            booking = new Booking({
              client: client._id,
              professional: session.professionalId,
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
              createdAt: new Date(session.startTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Créé dans les 7 jours avant la session
            });
            await booking.save();
            console.log(`   ✅ Réservation créée pour ${client.firstName} ${client.lastName}`);
          }

          // Générer une note aléatoire (biaisée vers les bonnes notes)
          const ratings = [3, 4, 4, 4, 5, 5, 5, 5]; // Plus de 4 et 5 étoiles
          const rating = ratings[Math.floor(Math.random() * ratings.length)];

          // Choisir un commentaire aléatoire
          const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];

          // Créer la review
          const review = new Review({
            clientId: client._id,
            professionalId: session.professionalId,
            contentId: session._id,
            contentType: 'session',
            contentTitle: session.title,
            rating: rating,
            comment: comment,
            status: 'approved',
            createdAt: new Date(session.startTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Créé dans les 7 jours après la session
          });

          await review.save();
          reviewsCreated++;

          console.log(`   ✅ Review créée: ${client.firstName} ${client.lastName} - ${rating}⭐`);

        } catch (error) {
          console.error(`   ❌ Erreur lors de la création de la review pour ${client.firstName} ${client.lastName}:`, error.message);
        }
      }

      // Mettre à jour les statistiques de cette session
      await updateSessionAverageRating(session._id);
      console.log(`   📊 Statistiques mises à jour pour la session`);
    }

    console.log('\n🎉 Processus terminé !');
    console.log(`✅ ${sessionsCompleted} sessions terminées`);
    console.log(`✅ ${reviewsCreated} reviews créées`);

  } catch (error) {
    console.error('❌ Erreur lors du processus:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Fonction pour créer des sessions de test
async function createTestSessions() {
  try {
    console.log('🏗️  Création de sessions de test...');
    
    // Récupérer un professionnel
    const professional = await Professional.findOne({});
    if (!professional) {
      console.log('❌ Aucun professionnel trouvé. Veuillez d\'abord créer un professionnel.');
      return;
    }

    // Créer quelques sessions passées
    const sessionsToCreate = [
      {
        title: "Session de méditation guidée",
        description: "Une session relaxante de méditation pour débutants",
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        duration: 60,
        maxParticipants: 8,
        price: 50,
        category: 'group',
        status: 'scheduled'
      },
      {
        title: "Séance de yoga matinal",
        description: "Réveillez votre corps avec une séance de yoga douce",
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
        duration: 90,
        maxParticipants: 10,
        price: 40,
        category: 'group',
        status: 'scheduled'
      },
      {
        title: "Consultation nutritionnelle",
        description: "Bilan nutritionnel personnalisé",
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        duration: 45,
        maxParticipants: 1,
        price: 80,
        category: 'individual',
        status: 'scheduled'
      }
    ];

    for (const sessionData of sessionsToCreate) {
      const session = new Session({
        ...sessionData,
        professionalId: professional._id
      });
      await session.save();
      console.log(`   ✅ Session créée: ${session.title}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des sessions de test:', error);
  }
}

// Fonction pour créer des clients de test
async function createTestClients() {
  try {
    console.log('👥 Création de clients de test...');
    
    const clientsToCreate = [
      {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie.dupont@test.com",
        role: "client"
      },
      {
        firstName: "Jean",
        lastName: "Martin",
        email: "jean.martin@test.com",
        role: "client"
      },
      {
        firstName: "Sophie",
        lastName: "Bernard",
        email: "sophie.bernard@test.com",
        role: "client"
      },
      {
        firstName: "Pierre",
        lastName: "Dubois",
        email: "pierre.dubois@test.com",
        role: "client"
      }
    ];

    for (const clientData of clientsToCreate) {
      const client = new User({
        ...clientData,
        password: 'password123', // Mot de passe temporaire
        isEmailVerified: true
      });
      await client.save();
      console.log(`   ✅ Client créé: ${client.firstName} ${client.lastName}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des clients de test:', error);
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

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des statistiques de la session:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  completeSessionsAndAddReviews();
}

module.exports = { completeSessionsAndAddReviews }; 