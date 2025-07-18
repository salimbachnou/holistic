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

async function seedSessionReviews() {
  try {
    console.log('🌱 Démarrage du seed des reviews de sessions...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer toutes les sessions terminées
    const completedSessions = await Session.find({ status: 'completed' });
    console.log(`📊 Trouvé ${completedSessions.length} sessions terminées`);

    if (completedSessions.length === 0) {
      console.log('❌ Aucune session terminée trouvée. Veuillez d\'abord créer et terminer des sessions.');
      return;
    }

    // Récupérer tous les utilisateurs clients
    const clients = await User.find({ role: 'client' });
    console.log(`👥 Trouvé ${clients.length} clients`);

    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé. Veuillez d\'abord créer des comptes clients.');
      return;
    }

    let reviewsCreated = 0;
    let reviewsSkipped = 0;

    // Pour chaque session terminée, créer quelques reviews
    for (const session of completedSessions) {
      console.log(`\n🎯 Traitement de la session: ${session.title}`);

      // Générer entre 1 et 5 reviews par session
      const numberOfReviews = Math.floor(Math.random() * 5) + 1;
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
            reviewsSkipped++;
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
    }

    // Mettre à jour les statistiques des sessions
    console.log('\n📊 Mise à jour des statistiques des sessions...');
    await updateAllSessionRatings();

    console.log('\n🎉 Seed terminé !');
    console.log(`✅ ${reviewsCreated} reviews créées`);
    console.log(`⚠️  ${reviewsSkipped} reviews ignorées (déjà existantes)`);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Fonction pour mettre à jour les statistiques de toutes les sessions
async function updateAllSessionRatings() {
  try {
    const sessions = await Session.find({});
    
    for (const session of sessions) {
      await updateSessionAverageRating(session._id);
    }
    
    console.log('📊 Statistiques mises à jour pour toutes les sessions');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des statistiques:', error);
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
  seedSessionReviews();
}

module.exports = { seedSessionReviews, updateAllSessionRatings }; 