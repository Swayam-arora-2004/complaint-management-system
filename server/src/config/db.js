const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MongoDB URI is not defined in environment variables');
      console.error('   Please set MONGODB_URI in your .env file or Railway environment variables');
      process.exit(1);
    }

    // Clean the URI - remove any trailing whitespace or invalid characters
    let cleanUri = mongoUri.trim();
    
    // Remove any trailing invalid characters (like $, @, etc.)
    cleanUri = cleanUri.replace(/[^a-zA-Z0-9?=&._-]+$/, '');
    
    // Validate URI format
    if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
      console.error('❌ Error: Invalid MongoDB URI format');
      console.error('   URI must start with mongodb:// or mongodb+srv://');
      console.error('   Current URI starts with:', cleanUri.substring(0, 20) + '...');
      process.exit(1);
    }

    // Check for password encoding issues
    const passwordMatch = cleanUri.match(/mongodb\+?srv?:\/\/[^:]+:([^@]+)@/);
    if (passwordMatch) {
      const rawPassword = passwordMatch[1];
      if (/[@#$%&+=\/? ]/.test(rawPassword) && !rawPassword.includes('%')) {
        console.error('❌ Error: Password contains special characters that need URL encoding');
        console.error('   Special characters found in password (not encoded)');
        console.error('   Please URL-encode special characters: @ → %40, $ → %24, etc.');
        console.error('   Run: node -e "console.log(encodeURIComponent(\'your-password\'))"');
        process.exit(1);
      }
    }

    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('   URI format:', cleanUri.startsWith('mongodb+srv://') ? 'Atlas (SRV)' : 'Standard');
    
    // Log hostname for debugging (without password)
    const hostnameMatch = cleanUri.match(/@([^/]+)\//);
    if (hostnameMatch) {
      const hostname = hostnameMatch[1];
      console.log('   Hostname:', hostname);
      
      // Check for invalid characters in hostname
      if (/[^a-zA-Z0-9.-]/.test(hostname)) {
        const invalidChars = hostname.match(/([^a-zA-Z0-9.-]+)/g);
        console.error('   ❌ Invalid characters in hostname:', invalidChars.join(', '));
        console.error('   This usually means the password contains unencoded special characters!');
        console.error('   The @ symbol in password is being interpreted as hostname separator.');
        process.exit(1);
      }
    } else {
      console.warn('   ⚠️  Could not extract hostname from URI');
    }
    
    // Log a sanitized version for debugging
    const sanitizedUri = cleanUri.replace(/:([^:@]+)@/, ':****@');
    console.log('   URI (sanitized):', sanitizedUri.substring(0, 100) + (sanitizedUri.length > 100 ? '...' : ''));
    
    const conn = await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Provide helpful error messages
    if (error.message.includes('EBADNAME') || error.message.includes('querySrv')) {
      console.error('\n💡 This error usually means:');
      console.error('   1. The MongoDB URI format is incorrect');
      console.error('   2. There are invalid characters in the connection string');
      console.error('   3. The password contains special characters that need URL encoding');
      console.error('\n   Example correct format:');
      console.error('   mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('\n   If your password has special characters, URL encode them:');
      console.error('   @ → %40, # → %23, $ → %24, etc.');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   1. Username is correct');
      console.error('   2. Password is correct (URL encode special characters)');
      console.error('   3. Database user has proper permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Cannot reach MongoDB server. Check:');
      console.error('   1. Internet connection');
      console.error('   2. MongoDB Atlas cluster is running');
      console.error('   3. IP address is whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;

