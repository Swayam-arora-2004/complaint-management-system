#!/usr/bin/env node

/**
 * MongoDB URI Auto-Fixer
 * This script helps fix common MongoDB URI issues
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixMongoDBUri() {
  console.log('🔧 MongoDB URI Auto-Fixer\n');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    console.log('\n💡 Create a .env file in the server directory with:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }
  
  // Read current .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  // Find MONGODB_URI line
  let uriLineIndex = -1;
  let currentUri = '';
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('MONGODB_URI=')) {
      uriLineIndex = i;
      currentUri = lines[i].split('=').slice(1).join('=').trim();
      break;
    }
  }
  
  if (uriLineIndex === -1) {
    console.error('❌ MONGODB_URI not found in .env file');
    console.log('\n💡 Add this line to your .env file:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }
  
  console.log('📋 Current URI (password hidden):');
  const hiddenUri = currentUri.replace(/:([^:@]+)@/, ':****@');
  console.log(`   ${hiddenUri}\n`);
  
  // Detect the issue
  const passwordMatch = currentUri.match(/mongodb\+?srv?:\/\/[^:]+:([^@]+)@/);
  const hostnameMatch = currentUri.match(/@([^/]+)\//);
  
  if (!passwordMatch || !hostnameMatch) {
    console.error('❌ Could not parse MongoDB URI format');
    console.log('\n💡 Expected format:');
    console.log('   mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }
  
  const rawPassword = passwordMatch[1];
  const hostname = hostnameMatch[1];
  
  // Check if password needs encoding
  const needsEncoding = /[@#$%&+=\/? ]/.test(rawPassword);
  const hasInvalidHostname = /[^a-zA-Z0-9.-]/.test(hostname);
  
  if (!needsEncoding && !hasInvalidHostname) {
    console.log('✅ URI format looks correct!');
    console.log('\n💡 If you\'re still getting errors, check:');
    console.log('   1. Username and password are correct');
    console.log('   2. IP address is whitelisted in MongoDB Atlas');
    console.log('   3. Database user has proper permissions');
    rl.close();
    return;
  }
  
  console.log('⚠️  Issues detected:\n');
  
  if (needsEncoding) {
    console.log('❌ Password contains special characters that need URL encoding');
    console.log(`   Current password (first 10 chars): ${rawPassword.substring(0, 10)}...`);
    console.log('\n   Special characters found:');
    if (rawPassword.includes('@')) console.log('     @ → needs to be %40');
    if (rawPassword.includes('$')) console.log('     $ → needs to be %24');
    if (rawPassword.includes('#')) console.log('     # → needs to be %23');
    if (rawPassword.includes('%')) console.log('     % → needs to be %25');
    if (rawPassword.includes('&')) console.log('     & → needs to be %26');
    if (rawPassword.includes('+')) console.log('     + → needs to be %2B');
    if (rawPassword.includes('=')) console.log('     = → needs to be %3D');
    if (rawPassword.includes('/')) console.log('     / → needs to be %2F');
    if (rawPassword.includes('?')) console.log('     ? → needs to be %3F');
    if (rawPassword.includes(' ')) console.log('     (space) → needs to be %20');
  }
  
  if (hasInvalidHostname) {
    console.log('❌ Hostname contains invalid characters');
    console.log(`   Hostname: ${hostname}`);
  }
  
  console.log('\n🔧 Auto-fix options:\n');
  console.log('1. Auto-encode password (recommended)');
  console.log('2. Show encoded password (manual fix)');
  console.log('3. Cancel\n');
  
  const choice = await question('Choose an option (1-3): ');
  
  if (choice === '3') {
    console.log('\n❌ Cancelled');
    rl.close();
    return;
  }
  
  if (choice === '1') {
    // Auto-fix: encode password
    const encodedPassword = encodeURIComponent(rawPassword);
    const fixedUri = currentUri.replace(`:${rawPassword}@`, `:${encodedPassword}@`);
    
    // Also ensure database name is included
    let finalUri = fixedUri;
    if (!finalUri.match(/\/[^?]+(\?|$)/)) {
      // No database name, add one
      finalUri = finalUri.replace(/(\.mongodb\.net\/)(\?|$)/, '$1complaint-compass$2');
    }
    
    // Update the line
    lines[uriLineIndex] = `MONGODB_URI=${finalUri}`;
    
    // Write back to file
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
    
    console.log('\n✅ Fixed! Updated .env file');
    console.log('\n📋 New URI (password hidden):');
    const newHiddenUri = finalUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`   ${newHiddenUri}\n`);
    console.log('💡 Restart your server to apply changes:');
    console.log('   npm run dev\n');
    
  } else if (choice === '2') {
    // Show encoded password
    const encodedPassword = encodeURIComponent(rawPassword);
    console.log('\n📋 Encoded password:');
    console.log(`   Original: ${rawPassword}`);
    console.log(`   Encoded:  ${encodedPassword}\n`);
    console.log('💡 Update your .env file manually:');
    console.log(`   Replace: :${rawPassword}@`);
    console.log(`   With:    :${encodedPassword}@\n`);
    console.log('💡 Also make sure you have a database name:');
    console.log('   mongodb+srv://...@cluster.mongodb.net/complaint-compass?appName=...\n');
  } else {
    console.log('\n❌ Invalid choice');
  }
  
  rl.close();
}

fixMongoDBUri().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});

