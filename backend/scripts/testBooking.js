const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to create a test booking
const createTestBooking = async () => {
  try {
    console.log('🚀 Création d\'une réservation de test...');

    // Trouver un professionnel
    const professional = await Professional.findOne().populate('userId');
    if (!professional) {
      console.log('❌ Aucun professionnel trouvé');
      process.exit(1);
    }

    // Trouver une session du professionnel
    const session = await Session.findOne({ professionalId: professional._id });
    if (!session) {
      console.log('❌ Aucune session trouvée pour ce professionnel');
      process.exit(1);
    }

    // Trouver un utilisateur client
    const client = await User.findOne({ role: 'client' });
    if (!client) {
      console.log('❌ Aucun client trouvé');
      process.exit(1);
    }

    console.log('✅ Données trouvées:');
    console.log('  - Professionnel:', professional.businessName);
    console.log('  - Session:', session.title);
    console.log('  - Client:', `${client.firstName} ${client.lastName}`);

    // Créer une réservation de test
    const bookingData = {
      client: client._id,
      professional: professional._id,
      service: {
        name: session.title,
        description: session.description,
        duration: session.duration,
        price: {
          amount: session.price,
          currency: 'MAD'
        },
        sessionId: session._id
      },
      appointmentDate: session.startTime,
      appointmentTime: {
        start: session.startTime.toISOString().substring(11, 16),
        end: new Date(session.startTime.getTime() + session.duration * 60000)
          .toISOString()
          .substring(11, 16)
      },
      location: {
        type: session.category === 'online' ? 'online' : 'in_person',
        address: session.category !== 'online' ? {
          street: session.location,
          city: professional.businessAddress?.city || 'Casablanca',
          postalCode: professional.businessAddress?.postalCode || '20000',
          country: professional.businessAddress?.country || 'Morocco'
        } : undefined,
        onlineLink: session.category === 'online' ? session.meetingLink : undefined
      },
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: {
        amount: session.price,
        currency: 'MAD'
      },
      clientNotes: 'Réservation de test créée automatiquement'
    };

    // Générer le numéro de réservation
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const lastBooking = await Booking.findOne({
      bookingNumber: new RegExp(`^BK${year}${month}${day}`)
    }).sort({ bookingNumber: -1 });
    
    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    bookingData.bookingNumber = `BK${year}${month}${day}${String(sequence).padStart(4, '0')}`;

    const booking = new Booking(bookingData);
    await booking.save();

    console.log('✅ Réservation de test créée avec succès!');
    console.log('  - ID:', booking._id);
    console.log('  - Numéro:', booking.bookingNumber);
    console.log('  - Statut:', booking.status);
    console.log('  - Session:', session.title);
    console.log('  - Client:', `${client.firstName} ${client.lastName}`);

    // Vérifier que la réservation apparaît dans les demandes de la session
    const sessionBookings = await Booking.find({
      'service.sessionId': session._id
    }).populate('client', 'firstName lastName');

    console.log(`📊 Réservations pour la session "${session.title}":`);
    sessionBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.client.firstName} ${booking.client.lastName} - ${booking.status} (${booking.createdAt})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la réservation de test:', error);
    process.exit(1);
  }
};

// Exécuter le script
createTestBooking(); 