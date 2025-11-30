#!/usr/bin/env node

/**
 * Fix MongoDB URI - Add database name if missing
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let updated = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('MONGODB_URI=') || lines[i].trim().startsWith('MONGO_URI=')) {
    const line = lines[i];
    const uri = line.split('=').slice(1).join('=').trim();
    
    // Check if database name is missing (no /database before ?)
    if (!uri.match(/\/[^?]+(\?|$)/)) {
      console.log('⚠️  Database name missing in MongoDB URI');
      console.log('   Adding /complaint-compass...\n');
      
      // Add database name before the ?
      const fixedUri = uri.replace(/(\.mongodb\.net\/)(\?|$)/, '$1complaint-compass$2');
      
      lines[i] = line.replace(uri, fixedUri);
      updated = true;
      
      console.log('✅ Updated URI:');
      const hidden = fixedUri.replace(/:([^:@]+)@/, ':****@');
      console.log(`   ${hidden.substring(0, 100)}...\n`);
    } else {
      console.log('✅ Database name already present');
    }
    break;
  }
}

if (updated) {
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
  console.log('💡 Restart your server to apply changes:');
  console.log('   npm run dev\n');
} else {
  console.log('✅ No changes needed\n');
}

