const mongoose = require('mongoose');
const SessionReviewService = require('../services/sessionReviewService');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic-platform';

/**
 * Script pour finaliser automatiquement les sessions expirées
 * et envoyer les demandes d'avis aux participants
 */
async function autoCompleteExpiredSessions() {
  try {
    console.log('=== AUTO COMPLETE EXPIRED SESSIONS SCRIPT ===');
    console.log('Starting at:', new Date().toISOString());

    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Exécuter le service de finalisation automatique
    const result = await SessionReviewService.autoCompleteExpiredSessions();

    console.log('\n=== RESULTS ===');
    console.log('Message:', result.message);
    console.log('Sessions processed:', result.results.length);

    // Afficher les détails de chaque session traitée
    result.results.forEach((sessionResult, index) => {
      console.log(`\n--- Session ${index + 1} ---`);
      console.log('Session ID:', sessionResult.sessionId);
      console.log('Title:', sessionResult.sessionTitle);
      console.log('Status:', sessionResult.status);
      
      if (sessionResult.status === 'completed') {
        console.log('Review requests sent:', sessionResult.reviewRequestsSent);
      } else if (sessionResult.status === 'error') {
        console.log('Error:', sessionResult.error);
      }
    });

    // Statistiques finales
    const completed = result.results.filter(r => r.status === 'completed').length;
    const errors = result.results.filter(r => r.status === 'error').length;
    const totalReviewRequests = result.results
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.reviewRequestsSent || 0), 0);

    console.log('\n=== FINAL STATISTICS ===');
    console.log('✅ Sessions completed:', completed);
    console.log('❌ Errors:', errors);
    console.log('📧 Total review requests sent:', totalReviewRequests);

    if (completed > 0) {
      console.log('\n✨ Sessions have been automatically completed and review requests sent to participants!');
    } else if (result.results.length === 0) {
      console.log('\n💡 No expired sessions found to complete.');
    }

  } catch (error) {
    console.error('\n❌ ERROR in auto-complete script:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('Script completed at:', new Date().toISOString());
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  autoCompleteExpiredSessions()
    .then(() => {
      console.log('\n🎉 Auto-complete script finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = autoCompleteExpiredSessions; 