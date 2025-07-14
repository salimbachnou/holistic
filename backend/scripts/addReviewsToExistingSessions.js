const mongoose = require('mongoose');
const Session = require('../models/Session');
const Review = require('../models/Review');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

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

async function addReviewsToExistingSessions() {
  try {
    console.log('🌱 Ajout de reviews aux sessions existantes...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer toutes les sessions terminées
    const sessions = await Session.find({ status: 'completed' });
    console.log(`📊 Trouvé ${sessions.length} sessions terminées`);

    if (sessions.length === 0) {
      console.log('❌ Aucune session terminée trouvée');
      return;
    }

    // Récupérer tous les utilisateurs clients
    const clients = await User.find({ role: 'client' });
    console.log(`👥 Trouvé ${clients.length} clients`);

    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé');
      return;
    }

    let reviewsCreated = 0;
    let reviewsSkipped = 0;

    // Pour chaque session terminée, ajouter des reviews
    for (const session of sessions) {
      console.log(`\n🎯 Traitement de la session: ${session.title}`);

      // Vérifier s'il y a déjà des reviews pour cette session
      const existingReviews = await Review.find({
        contentId: session._id,
        contentType: 'session'
      });

      if (existingReviews.length > 0) {
        console.log(`   ⚠️  ${existingReviews.length} reviews déjà existantes pour cette session`);
        reviewsSkipped += existingReviews.length;
        continue;
      }

      // Générer entre 2 et 5 reviews par session
      const numberOfReviews = Math.floor(Math.random() * 4) + 2;
      console.log(`   📝 Génération de ${numberOfReviews} reviews`);

      // Mélanger les clients et prendre les premiers
      const shuffledClients = clients.sort(() => 0.5 - Math.random());
      const selectedClients = shuffledClients.slice(0, numberOfReviews);

      for (const client of selectedClients) {
        try {
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

    console.log('\n🎉 Processus terminé !');
    console.log(`✅ ${reviewsCreated} reviews créées`);
    console.log(`⚠️  ${reviewsSkipped} reviews ignorées (déjà existantes)`);

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
  addReviewsToExistingSessions();
}

module.exports = { addReviewsToExistingSessions }; 