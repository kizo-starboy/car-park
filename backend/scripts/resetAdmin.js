const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpark');
    console.log('Connected to MongoDB');

    // Drop the users collection to remove any old indexes
    try {
      await mongoose.connection.db.collection('users').drop();
      console.log('Users collection dropped');
    } catch (error) {
      console.log('Users collection does not exist or already dropped');
    }

    // Create admin user
    console.log('Creating new admin user...');
    const adminUser = new User({
      username: 'admin',
      password: '123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');

    // Test the password
    const savedAdmin = await User.findOne({ username: 'admin' });
    const isMatch = await savedAdmin.comparePassword('123');
    console.log('✅ Password test result:', isMatch);

    if (isMatch) {
      console.log('🎉 Admin user is ready to use!');
      console.log('   Username: admin');
      console.log('   Password: 123');
    } else {
      console.log('❌ Password test failed');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

resetAdmin();
