#!/usr/bin/env node

/**
 * MongoDB URI Validator and Fixer
 * This script helps identify and fix issues with your MongoDB connection string
 */

require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('🔍 MongoDB URI Validator\n');

if (!mongoUri) {
  console.error('❌ No MONGODB_URI found in environment variables');
  console.log('\n💡 Add it to your server/.env file:');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
  process.exit(1);
}

console.log('📋 Current URI (password hidden):');
const hiddenUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
console.log(`   ${hiddenUri}\n`);

// Check for common issues
const issues = [];
const fixes = [];

// 1. Check for trailing invalid characters
if (mongoUri.match(/[^a-zA-Z0-9?=&._-]$/)) {
  const match = mongoUri.match(/([^a-zA-Z0-9?=&._-]+)$/);
  issues.push(`❌ Trailing invalid characters: "${match[1]}"`);
  fixes.push(`   Remove: "${match[1]}"`);
}

// 2. Check for spaces
if (mongoUri.includes(' ')) {
  issues.push('❌ URI contains spaces');
  fixes.push('   Remove all spaces from the URI');
}

// 3. Check for newlines
if (mongoUri.includes('\n') || mongoUri.includes('\r')) {
  issues.push('❌ URI contains newlines');
  fixes.push('   Remove all newlines from the URI');
}

// 4. Check format
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  issues.push('❌ URI does not start with mongodb:// or mongodb+srv://');
  fixes.push('   URI must start with mongodb:// or mongodb+srv://');
}

// 5. Check for @ symbol in password (should be encoded)
const passwordMatch = mongoUri.match(/mongodb\+?srv?:\/\/[^:]+:([^@]+)@/);
if (passwordMatch && passwordMatch[1].includes('@') && !passwordMatch[1].includes('%40')) {
  issues.push('❌ Password contains @ symbol (should be URL encoded as %40)');
  fixes.push('   Encode @ as %40 in the password');
}

// 6. Check for # in password (should be encoded)
if (passwordMatch && passwordMatch[1].includes('#') && !passwordMatch[1].includes('%23')) {
  issues.push('❌ Password contains # symbol (should be URL encoded as %23)');
  fixes.push('   Encode # as %23 in the password');
}

// 7. Check for $ in password (should be encoded)
if (passwordMatch && passwordMatch[1].includes('$') && !passwordMatch[1].includes('%24')) {
  issues.push('❌ Password contains $ symbol (should be URL encoded as %24)');
  fixes.push('   Encode $ as %24 in the password');
}

// 8. Check hostname format
const hostnameMatch = mongoUri.match(/@([^/]+)\//);
if (hostnameMatch) {
  const hostname = hostnameMatch[1];
  if (!hostname.includes('.mongodb.net') && !hostname.includes('.mongodb.com')) {
    issues.push(`❌ Invalid hostname format: "${hostname}"`);
    fixes.push('   Hostname should be like: cluster0.xxxxx.mongodb.net');
  }
  if (hostname.match(/[^a-zA-Z0-9.-]/)) {
    const invalidChars = hostname.match(/([^a-zA-Z0-9.-]+)/g);
    issues.push(`❌ Invalid characters in hostname: "${invalidChars.join(', ')}"`);
    fixes.push('   Hostname should only contain letters, numbers, dots, and hyphens');
  }
}

// Display results
if (issues.length === 0) {
  console.log('✅ URI format looks correct!\n');
  console.log('💡 If you\'re still getting connection errors, check:');
  console.log('   1. Username and password are correct');
  console.log('   2. IP address is whitelisted in MongoDB Atlas');
  console.log('   3. Database user has proper permissions');
  console.log('   4. Cluster is running and accessible');
} else {
  console.log('⚠️  Found issues:\n');
  issues.forEach((issue, i) => {
    console.log(issue);
    if (fixes[i]) {
      console.log(fixes[i]);
    }
    console.log('');
  });
  
  console.log('\n🔧 How to fix:\n');
  console.log('1. Open server/.env file');
  console.log('2. Find the MONGODB_URI line');
  console.log('3. Apply the fixes above');
  console.log('4. Save and restart the server\n');
  
  console.log('💡 Quick password encoding:');
  console.log('   Run: node -e "console.log(encodeURIComponent(\'your-password\'))"');
}

// Try to parse and suggest a cleaned version
try {
  const cleanedUri = mongoUri.trim().replace(/\s+/g, '');
  if (cleanedUri !== mongoUri) {
    console.log('\n🧹 Suggested cleaned URI (password hidden):');
    const cleanedHidden = cleanedUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`   ${cleanedHidden}`);
    console.log('\n   (Remove this line and use the cleaned version in your .env)');
  }
} catch (e) {
  // Ignore
}

console.log('');

