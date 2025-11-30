#!/usr/bin/env node

/**
 * Test Email Configuration
 * Run this to verify your email setup is working
 */

require('dotenv').config();
const { sendEmail } = require('./src/config/mailer');

async function testEmail() {
  console.log('🧪 Testing Email Configuration\n');
  
  // Check if variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Add these to server/.env file');
    process.exit(1);
  }
  
  console.log('✅ All required variables are set');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 587}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || process.env.SMTP_USER}\n`);
  
  // Test sending email
  const testEmail = process.env.SMTP_USER;
  console.log(`📧 Sending test email to: ${testEmail}\n`);
  
  try {
    const result = await sendEmail(
      testEmail,
      'Test Email - Complaint System',
      'This is a test email from your complaint management system. If you receive this, email alerts are working correctly!',
      `
        <h1>✅ Email Test Successful!</h1>
        <p>This is a test email from your complaint management system.</p>
        <p>If you receive this email, your email alerts are configured correctly!</p>
        <p>You will now receive emails for:</p>
        <ul>
          <li>Complaint submissions</li>
          <li>Status updates</li>
          <li>New comments from support agents</li>
          <li>Password reset requests</li>
        </ul>
        <p>Thank you for using Complaint Compass!</p>
      `
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your inbox: ${testEmail}`);
      console.log('   (Also check spam folder if not in inbox)\n');
      process.exit(0);
    } else {
      console.error('❌ Failed to send email');
      console.error(`   Error: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing email:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

testEmail();

