const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.SMTP_HOST && 
         process.env.SMTP_USER && 
         process.env.SMTP_PASS &&
         process.env.SMTP_PASS !== 'your_app_password';
};

// Create transporter for sending emails (only if configured)
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection (non-blocking, don't throw errors)
  transporter.verify(function (error, success) {
    if (error) {
      // Only show a simple warning, not the full error stack
      console.warn('⚠️  Email not configured properly. Email notifications disabled.');
      console.warn('   To enable: Set up Gmail App Password (see EMAIL_SETUP.md)');
      // Set transporter to null so sendEmail will skip
      transporter = null;
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} else {
  console.warn('⚠️  Email not configured. Email notifications will be disabled.');
  console.warn('   To enable: Configure SMTP settings in server/.env');
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  // If email is not configured, skip silently
  if (!transporter || !isEmailConfigured()) {
    console.log('📧 Email skipped (not configured):', subject);
    console.log('   Configure SMTP settings in server/.env to enable email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Subject:', subject);
    
    // Clean FROM_EMAIL - remove quotes if present
    const fromEmailRaw = process.env.FROM_EMAIL || process.env.SMTP_USER || '';
    const fromEmail = fromEmailRaw.replace(/^["']|["']$/g, '');
    
    console.log('📧 From:', fromEmail);
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log detailed error
    console.error('❌ Error sending email:');
    console.error('   To:', to);
    console.error('   Subject:', subject);
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, transporter };

