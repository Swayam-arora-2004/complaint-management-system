// Quick test script to verify email configuration
require('dotenv').config();
const { sendEmail } = require('./src/config/mailer');

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('  FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
  console.log('');
  
  // Test email
  const testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER;
  console.log('Sending test email to:', testEmail);
  
  const result = await sendEmail(
    testEmail,
    'Test Email - Password Reset System',
    'This is a test email to verify email configuration is working.',
    '<h2>Test Email</h2><p>This is a test email to verify email configuration is working.</p>'
  );
  
  console.log('\nResult:', result);
  
  if (result.success) {
    console.log('✅ Email sent successfully!');
  } else {
    console.log('❌ Email failed:', result.error);
  }
  
  process.exit(result.success ? 0 : 1);
}

testEmail().catch(console.error);

