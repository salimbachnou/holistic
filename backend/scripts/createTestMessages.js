const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestMessages() {
  try {
    console.log('🔍 Recherche des professionnels...');
    
    // Find all professionals
    const professionals = await Professional.find().populate('userId', 'firstName lastName email');
    
    if (professionals.length === 0) {
      console.log('❌ Aucun professionnel trouvé');
      return;
    }
    
    console.log(`✅ ${professionals.length} professionnels trouvés`);
    
    // Find some clients to send messages
    const clients = await User.find({ role: 'client' }).limit(5);
    
    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé');
      return;
    }
    
    console.log(`✅ ${clients.length} clients trouvés`);
    
    const sampleMessages = [
      "Bonjour, j'aimerais réserver une session de yoga pour demain. Avez-vous des créneaux disponibles ?",
      "Merci pour la séance d'hier, c'était fantastique ! À bientôt 😊",
      "Est-ce que vous proposez des cours pour débutants ? Je n'ai jamais fait de méditation.",
      "Pouvez-vous me dire le prix de vos produits de bien-être ?",
      "J'ai une question sur les horaires de vos sessions du weekend.",
      "Super séance aujourd'hui ! Merci beaucoup pour vos conseils.",
      "Je voudrais annuler ma réservation de vendredi, est-ce possible ?",
      "Avez-vous des recommandations pour continuer la pratique à la maison ?",
      "Bonjour, je suis intéressé(e) par vos événements. Comment puis-je m'inscrire ?",
      "Merci pour votre professionnalisme et votre bienveillance ! 🙏"
    ];
    
    let messagesCreated = 0;
    
    // Create messages for each professional
    for (const professional of professionals) {
      const professionalUserId = professional.userId._id;
      
      console.log(`📝 Création de messages pour ${professional.userId.firstName} ${professional.userId.lastName}...`);
      
      // Create 2-3 messages from different clients
      const numMessages = Math.floor(Math.random() * 3) + 2; // 2 to 4 messages
      
      for (let i = 0; i < numMessages; i++) {
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        
        // Create message timestamp (last 7 days)
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
        
        // Generate conversationId manually
        const sortedIds = [randomClient._id.toString(), professionalUserId.toString()].sort();
        const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
        
        const message = new Message({
          senderId: randomClient._id,
          receiverId: professionalUserId,
          text: randomMessage,
          timestamp: timestamp,
          conversationId: conversationId,
          messageType: 'text',
          isRead: Math.random() > 0.3, // 70% chance of being read
          deliveryStatus: 'delivered'
        });
        
        await message.save();
        messagesCreated++;
        
        console.log(`  ✉️ Message de ${randomClient.firstName} ${randomClient.lastName}: "${randomMessage.substring(0, 50)}..."`);
      }
    }
    
    console.log(`\n🎉 ${messagesCreated} messages de test créés avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des messages:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  createTestMessages();
}

module.exports = createTestMessages; 