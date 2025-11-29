#!/usr/bin/env node

// Script to generate secure secrets for deployment
const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Deployment\n');
console.log('='.repeat(50));
console.log('\n1. JWT_SECRET:');
console.log(crypto.randomBytes(32).toString('base64'));
console.log('\n2. Another JWT_SECRET (backup):');
console.log(crypto.randomBytes(32).toString('base64'));
console.log('\n' + '='.repeat(50));
console.log('\n✅ Copy these values to your environment variables');
console.log('⚠️  Keep them secure and never commit to Git!\n');

