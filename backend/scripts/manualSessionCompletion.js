const mongoose = require('mongoose');
const SessionReviewService = require('../services/sessionReviewService');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic';

/**
 * Script pour finaliser manuellement une session spécifique
 * et envoyer les demandes d'avis aux participants
 */
async function manualSessionCompletion(sessionId, professionalUserId) {
  try {
    console.log('=== MANUAL SESSION COMPLETION SCRIPT ===');
    console.log('Starting at:', new Date().toISOString());
    console.log('Session ID:', sessionId);
    console.log('Professional User ID:', professionalUserId);

    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Vérifier que la session existe
    const session = await Session.findById(sessionId).populate('professionalId', 'businessName userId');
    if (!session) {
      console.error('❌ Session not found with ID:', sessionId);
      process.exit(1);
    }

    console.log('✅ Session found:', {
      id: session._id,
      title: session.title,
      status: session.status,
      startTime: session.startTime,
      professional: session.professionalId.businessName
    });

    // Vérifier que l'utilisateur professionnel existe
    const professional = await Professional.findOne({ userId: professionalUserId }).populate('userId');
    if (!professional) {
      console.error('❌ Professional not found with userId:', professionalUserId);
      process.exit(1);
    }

    console.log('✅ Professional found:', {
      id: professional._id,
      businessName: professional.businessName,
      user: `${professional.userId.firstName} ${professional.userId.lastName}`
    });

    // Vérifier que le professionnel est bien le propriétaire de la session
    if (!session.professionalId._id.equals(professional._id)) {
      console.error('❌ Access denied. This professional is not the owner of this session.');
      console.error('Session professional ID:', session.professionalId._id);
      console.error('Current professional ID:', professional._id);
      process.exit(1);
    }

    console.log('✅ Professional ownership verified');

    // Exécuter le service de finalisation
    console.log('\n🔄 Completing session and sending review requests...');
    const result = await SessionReviewService.completeSession(sessionId, professionalUserId);

    console.log('\n=== COMPLETION RESULTS ===');
    console.log('✅ Success:', result.success);
    console.log('📝 Message:', result.message);
    console.log('👥 Total participants:', result.totalParticipants);
    console.log('📧 Review requests sent:', result.reviewRequests.length);

    // Afficher les détails des demandes d'avis
    if (result.reviewRequests.length > 0) {
      console.log('\n📋 Review requests details:');
      result.reviewRequests.forEach((request, index) => {
        console.log(`  ${index + 1}. ${request.clientName}`);
        console.log(`     - Client ID: ${request.clientId}`);
        console.log(`     - Booking ID: ${request.bookingId}`);
        console.log(`     - Status: ${request.status}`);
        if (request.error) {
          console.log(`     - Error: ${request.error}`);
        }
      });
    }

    // Statistiques finales
    const successfulRequests = result.reviewRequests.filter(r => r.status === 'sent').length;
    const failedRequests = result.reviewRequests.filter(r => r.status === 'error').length;

    console.log('\n=== FINAL STATISTICS ===');
    console.log('✅ Successful review requests:', successfulRequests);
    console.log('❌ Failed review requests:', failedRequests);
    console.log('📊 Success rate:', result.totalParticipants > 0 ? `${Math.round((successfulRequests / result.totalParticipants) * 100)}%` : '0%');

    if (successfulRequests > 0) {
      console.log('\n🎉 Session completed successfully and review notifications sent to clients!');
      console.log('💡 Clients will receive notifications asking them to review the session.');
      console.log('🔗 They can access the review page at: /sessions/' + sessionId + '/review');
    } else {
      console.log('\n⚠️  Session completed but no review notifications were sent.');
      console.log('💡 This might be because there were no confirmed bookings for this session.');
    }

    return result;

  } catch (error) {
    console.error('\n❌ ERROR in manual session completion:', error);
    throw error;
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('Script completed at:', new Date().toISOString());
  }
}

/**
 * Fonction pour lister les sessions d'un professionnel
 */
async function listProfessionalSessions(professionalUserId) {
  try {
    console.log('=== LISTING PROFESSIONAL SESSIONS ===');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Trouver le professionnel
    const professional = await Professional.findOne({ userId: professionalUserId }).populate('userId');
    if (!professional) {
      console.error('❌ Professional not found with userId:', professionalUserId);
      process.exit(1);
    }

    console.log('✅ Professional found:', professional.businessName);

    // Trouver toutes les sessions du professionnel
    const sessions = await Session.find({ professionalId: professional._id })
      .sort({ startTime: -1 })
      .limit(20);

    console.log(`\n📋 Found ${sessions.length} sessions (showing last 20):`);
    
    sessions.forEach((session, index) => {
      const status = session.status;
      const date = session.startTime.toLocaleDateString('fr-FR');
      const time = session.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const participantsCount = session.participants?.length || 0;
      
      console.log(`  ${index + 1}. ${session.title}`);
      console.log(`     - ID: ${session._id}`);
      console.log(`     - Status: ${status}`);
      console.log(`     - Date: ${date} at ${time}`);
      console.log(`     - Participants: ${participantsCount}/${session.maxParticipants}`);
      console.log(`     - Can be completed: ${status === 'scheduled' ? 'Yes' : 'No'}`);
      console.log('');
    });

    return sessions;

  } catch (error) {
    console.error('\n❌ ERROR listing sessions:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Fonction utilitaire pour utiliser le script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node manualSessionCompletion.js complete <sessionId> <professionalUserId>');
    console.log('  node manualSessionCompletion.js list <professionalUserId>');
    console.log('');
    console.log('Examples:');
    console.log('  node manualSessionCompletion.js complete 60d5ec9af682fbd12a0f9a10 60d5ec9af682fbd12a0f9a01');
    console.log('  node manualSessionCompletion.js list 60d5ec9af682fbd12a0f9a01');
    process.exit(1);
  }

  const command = args[0];
  
  if (command === 'complete') {
    if (args.length !== 3) {
      console.error('❌ Usage: node manualSessionCompletion.js complete <sessionId> <professionalUserId>');
      process.exit(1);
    }
    
    const sessionId = args[1];
    const professionalUserId = args[2];
    
    try {
      await manualSessionCompletion(sessionId, professionalUserId);
      console.log('\n🎉 Manual session completion finished successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    }
  } else if (command === 'list') {
    if (args.length !== 2) {
      console.error('❌ Usage: node manualSessionCompletion.js list <professionalUserId>');
      process.exit(1);
    }
    
    const professionalUserId = args[1];
    
    try {
      await listProfessionalSessions(professionalUserId);
      console.log('\n🎉 Session listing finished successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    }
  } else {
    console.error('❌ Unknown command:', command);
    console.error('Available commands: complete, list');
    process.exit(1);
  }
}

// Exporter les fonctions pour utilisation externe
module.exports = {
  manualSessionCompletion,
  listProfessionalSessions
};

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
} 