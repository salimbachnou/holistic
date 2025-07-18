const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const Product = require('../models/Product');
const Event = require('../models/Event');
const User = require('../models/User');
const Review = require('../models/Review');
require('dotenv').config();

const seedHomepageData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://salimbachnou:sasaSASA13%40%40@cluster0.b01i0ev.mongodb.net/holistic?retryWrites=true&w=majority&appName=Cluster0/holistic');
    console.log('Connected to MongoDB');

    // Mark some professionals as featured
    const professionals = await Professional.find({ isActive: true, isVerified: true }).limit(10);
    if (professionals.length > 0) {
      // Mark first 4 as featured
      await Professional.updateMany(
        { _id: { $in: professionals.slice(0, 4).map(p => p._id) } },
        { featured: true }
      );
      console.log('✅ Updated featured professionals');
    }

    // Mark some products as featured
    const products = await Product.find({ status: 'approved', isActive: true }).limit(10);
    if (products.length > 0) {
      // Mark first 3 as featured
      await Product.updateMany(
        { _id: { $in: products.slice(0, 3).map(p => p._id) } },
        { featured: true }
      );
      console.log('✅ Updated featured products');
    }

    // Create some sample reviews if none exist
    const reviewCount = await Review.countDocuments({ status: 'approved' });
    if (reviewCount === 0) {
      console.log('Creating sample reviews...');
      
      // Get some users and professionals
      const users = await User.find({ role: 'client' }).limit(5);
      const professionalsForReviews = await Professional.find({ isActive: true }).limit(3);
      
      if (users.length > 0 && professionalsForReviews.length > 0) {
        const sampleReviews = [
          {
            clientId: users[0]._id,
            professionalId: professionalsForReviews[0]._id,
            contentType: 'session',
            contentId: new mongoose.Types.ObjectId(),
            contentTitle: 'Séance de yoga',
            rating: 5,
            comment: 'Excellente séance de yoga ! J\'ai appris de nouvelles techniques de respiration qui m\'aident au quotidien.',
            status: 'approved'
          },
          {
            clientId: users[1]._id,
            professionalId: professionalsForReviews[1]._id,
            contentType: 'product',
            contentId: new mongoose.Types.ObjectId(),
            contentTitle: 'Huile essentielle de lavande',
            rating: 4,
            comment: 'Produit de très bonne qualité, l\'odeur est apaisante et aide vraiment pour le sommeil.',
            status: 'approved'
          },
          {
            clientId: users[2]._id,
            professionalId: professionalsForReviews[2]._id,
            contentType: 'event',
            contentId: new mongoose.Types.ObjectId(),
            contentTitle: 'Atelier méditation',
            rating: 5,
            comment: 'Atelier très enrichissant, j\'ai découvert de nouvelles techniques de méditation. Ambiance très bienveillante.',
            status: 'approved'
          }
        ];

        await Review.insertMany(sampleReviews);
        console.log('✅ Created sample reviews');
      }
    }

    // Update some events to be approved and upcoming
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
      status: 'pending'
    }).limit(5);

    if (upcomingEvents.length > 0) {
      await Event.updateMany(
        { _id: { $in: upcomingEvents.map(e => e._id) } },
        { status: 'approved' }
      );
      console.log('✅ Approved upcoming events');
    }

    // Create some future events if none exist
    const futureEventsCount = await Event.countDocuments({
      date: { $gte: new Date() },
      status: 'approved'
    });

    if (futureEventsCount === 0) {
      console.log('Creating sample future events...');
      
      const professionalUsers = await User.find({ role: 'professional' }).limit(3);
      
      if (professionalUsers.length > 0) {
        const sampleEvents = [
          {
            title: 'Atelier méditation pleine conscience',
            description: 'Découvrez les techniques de méditation pour réduire le stress et améliorer votre bien-être.',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            address: 'Casablanca, Maroc',
            price: 150,
            currency: 'MAD',
            maxParticipants: 20,
            professional: professionalUsers[0]._id,
            bookingType: 'in_person_payment',
            status: 'approved'
          },
          {
            title: 'Retraite yoga weekend',
            description: 'Un weekend complet de yoga et de détente dans un cadre naturel exceptionnel.',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 days later
            address: 'Marrakech, Maroc',
            price: 800,
            currency: 'MAD',
            maxParticipants: 15,
            professional: professionalUsers[1]._id,
            bookingType: 'online_payment',
            status: 'approved'
          },
          {
            title: 'Conférence alimentation & santé',
            description: 'Apprenez comment adopter une alimentation saine et équilibrée pour votre bien-être.',
            date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
            endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
            address: 'Rabat, Maroc',
            price: 100,
            currency: 'MAD',
            maxParticipants: 50,
            professional: professionalUsers[2]._id,
            bookingType: 'in_person_payment',
            status: 'approved'
          }
        ];

        await Event.insertMany(sampleEvents);
        console.log('✅ Created sample future events');
      }
    }

    console.log('🎉 Homepage data seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding homepage data:', error);
    process.exit(1);
  }
};

// Run the seeding
seedHomepageData(); 