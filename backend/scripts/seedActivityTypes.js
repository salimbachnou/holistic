const mongoose = require('mongoose');
const ActivityType = require('../models/ActivityType');
require('dotenv').config();

const initialActivityTypes = [
  { value: 'yoga', label: 'Yoga', category: 'wellness', order: 1 },
  { value: 'meditation', label: 'Méditation', category: 'wellness', order: 2 },
  { value: 'naturopathy', label: 'Naturopathie', category: 'therapy', order: 3 },
  { value: 'massage', label: 'Massage', category: 'therapy', order: 4 },
  { value: 'acupuncture', label: 'Acupuncture', category: 'therapy', order: 5 },
  { value: 'osteopathy', label: 'Ostéopathie', category: 'therapy', order: 6 },
  { value: 'chiropractic', label: 'Chiropractie', category: 'therapy', order: 7 },
  { value: 'nutrition', label: 'Nutrition', category: 'wellness', order: 8 },
  { value: 'psychology', label: 'Psychologie', category: 'therapy', order: 9 },
  { value: 'coaching', label: 'Coaching', category: 'wellness', order: 10 },
  { value: 'reiki', label: 'Reiki', category: 'therapy', order: 11 },
  { value: 'aromatherapy', label: 'Aromathérapie', category: 'therapy', order: 12 },
  { value: 'reflexology', label: 'Réflexologie', category: 'therapy', order: 13 },
  { value: 'ayurveda', label: 'Ayurveda', category: 'therapy', order: 14 },
  { value: 'hypnotherapy', label: 'Hypnothérapie', category: 'therapy', order: 15 },
  { value: 'sophrology', label: 'Sophrologie', category: 'therapy', order: 16 },
  { value: 'spa', label: 'Spa', category: 'beauty', order: 17 },
  { value: 'beauty', label: 'Beauté', category: 'beauty', order: 18 },
  { value: 'wellness', label: 'Bien-être', category: 'wellness', order: 19 },
  { value: 'fitness', label: 'Fitness', category: 'fitness', order: 20 },
  { value: 'therapist', label: 'Thérapeute', category: 'therapy', order: 21 },
  { value: 'nutritionist', label: 'Nutritionniste', category: 'wellness', order: 22 },
  { value: 'other', label: 'Autre', category: 'other', order: 23 }
];

async function seedActivityTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holistic', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if activity types already exist
    const existingCount = await ActivityType.countDocuments();
    if (existingCount > 0) {
      console.log(`Activity types already exist (${existingCount} found). Skipping seeding.`);
      return;
    }

    // Create a default admin user for the createdBy field
    const User = require('../models/User');
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating default admin...');
      adminUser = new User({
        email: 'admin@holistic.ma',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Holistic',
        name: 'Admin Holistic',
        role: 'admin',
        isVerified: true
      });
      await adminUser.save();
      console.log('Default admin user created');
    }

    // Create activity types
    const activityTypesToCreate = initialActivityTypes.map(type => ({
      ...type,
      createdBy: adminUser._id,
      isActive: true
    }));

    const createdActivityTypes = await ActivityType.insertMany(activityTypesToCreate);

    console.log(`✅ Successfully seeded ${createdActivityTypes.length} activity types:`);
    createdActivityTypes.forEach(type => {
      console.log(`  - ${type.label} (${type.value})`);
    });

  } catch (error) {
    console.error('Error seeding activity types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedActivityTypes(); 