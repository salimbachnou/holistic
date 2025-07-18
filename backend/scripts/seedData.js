const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Professional = require('../models/Professional');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    const admin = new User({
      email: 'admin@holistic.ma',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'Holistic',
      role: 'admin',
      isVerified: true
    });

    await admin.save();
    console.log('✅ Admin user created: admin@holistic.ma / admin123');
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create test client user
const createTestClient = async () => {
  try {
    const existingClient = await User.findOne({ email: 'client@test.com' });
    if (existingClient) {
      console.log('Test client already exists');
      return existingClient;
    }

    const client = new User({
      email: 'client@test.com',
      password: 'client123',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+212612345678',
      role: 'client',
      isVerified: true
    });

    await client.save();
    console.log('✅ Test client created: client@test.com / client123');
    return client;
  } catch (error) {
    console.error('Error creating test client:', error);
  }
};

// Create test professional user
const createTestProfessional = async () => {
  try {
    const existingProfessional = await User.findOne({ email: 'professionnel@test.com' });
    if (existingProfessional) {
      console.log('Test professional already exists');
      
      // Check if professional profile exists
      const professionalProfile = await Professional.findOne({ userId: existingProfessional._id });
      if (!professionalProfile) {
        // Create professional profile
        const professional = new Professional({
          userId: existingProfessional._id,
          businessName: 'Centre Bien-être Harmonie',
          businessType: 'yoga',
          description: 'Centre spécialisé en yoga et méditation pour un bien-être Holistic.',
          contactInfo: {
            phone: '+212612345679'
          },
          businessAddress: {
            street: '123 Avenue Mohammed V',
            city: 'Casablanca',
            postalCode: '20000',
            country: 'Morocco',
            coordinates: {
              lat: 33.5731,
              lng: -7.5898
            }
          },
          isVerified: true,
          isActive: true
        });

        await professional.save();
        console.log('✅ Professional profile created for existing user');
      }
      
      return existingProfessional;
    }

    const professionalUser = new User({
      email: 'professionnel@test.com',
      password: 'prof123',
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+212612345679',
      role: 'professional',
      isVerified: true
    });

    await professionalUser.save();

    // Create professional profile
    const professional = new Professional({
      userId: professionalUser._id,
      businessName: 'Centre Bien-être Harmonie',
      businessType: 'yoga',
      description: 'Centre spécialisé en yoga et méditation pour un bien-être Holistic.',
      contactInfo: {
        phone: '+212612345679'
      },
      businessAddress: {
        street: '123 Avenue Mohammed V',
        city: 'Casablanca',
        postalCode: '20000',
        country: 'Morocco',
        coordinates: {
          lat: 33.5731,
          lng: -7.5898
        }
      },
      services: [
        {
          name: 'Cours de Yoga',
          description: 'Cours de yoga pour tous niveaux',
          duration: 60,
          price: { amount: 200, currency: 'MAD' },
          category: 'group',
          isActive: true
        },
        {
          name: 'Séance de Méditation',
          description: 'Séance guidée de méditation',
          duration: 45,
          price: { amount: 150, currency: 'MAD' },
          category: 'individual',
          isActive: true
        }
      ],
      businessHours: [
        {
          day: 'monday',
          isOpen: true,
          openTime: '09:00',
          closeTime: '18:00'
        },
        {
          day: 'tuesday',
          isOpen: true,
          openTime: '09:00',
          closeTime: '18:00'
        },
        {
          day: 'wednesday',
          isOpen: true,
          openTime: '09:00',
          closeTime: '18:00'
        },
        {
          day: 'thursday',
          isOpen: true,
          openTime: '09:00',
          closeTime: '18:00'
        },
        {
          day: 'friday',
          isOpen: true,
          openTime: '09:00',
          closeTime: '18:00'
        },
        {
          day: 'saturday',
          isOpen: true,
          openTime: '10:00',
          closeTime: '16:00'
        },
        {
          day: 'sunday',
          isOpen: false
        }
      ],
      isVerified: true,
      isActive: true
    });

    await professional.save();
    console.log('✅ Test professional created: professionnel@test.com / prof123');
    return professionalUser;
  } catch (error) {
    console.error('Error creating test professional:', error);
  }
};

// Main seeding function
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    await createAdminUser();
    await createTestClient();
    await createTestProfessional();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test accounts created:');
    console.log('👤 Admin: admin@holistic.ma / admin123');
    console.log('👤 Client: client@test.com / client123');
    console.log('👤 Professional: professionnel@test.com / prof123');
    console.log('\n💡 You can now test the login system with these accounts.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, createAdminUser, createTestClient, createTestProfessional }; 