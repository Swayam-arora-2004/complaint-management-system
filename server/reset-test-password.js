// Script to reset password for test account
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./src/models/User');

const TEST_EMAIL = 'test1763902969@test.com';
const NEW_PASSWORD = 'test123456'; // You can change this

async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/complaint-compass');
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log(`❌ User with email ${TEST_EMAIL} not found.`);
      console.log('Creating new user with this email...');
      
      // Create the user if it doesn't exist
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
      const newUser = await User.create({
        name: 'Test User',
        email: TEST_EMAIL,
        passwordHash,
        authProvider: 'local',
        role: 'user',
      });
      
      console.log('✅ User created successfully!');
      console.log(`📧 Email: ${TEST_EMAIL}`);
      console.log(`🔑 Password: ${NEW_PASSWORD}`);
    } else {
      // Reset password for existing user
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
      user.passwordHash = passwordHash;
      await user.save();
      
      console.log('✅ Password reset successfully!');
      console.log(`📧 Email: ${TEST_EMAIL}`);
      console.log(`🔑 New Password: ${NEW_PASSWORD}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();

