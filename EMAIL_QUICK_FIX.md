# Email Alerts - Quick Fix

## ✅ Good News!

Your `server/.env` file already has SMTP variables configured. Let's verify they're working.

## Step 1: Test Email Configuration

Run this command to test your email setup:

```bash
cd server
node test-email-config.js
```

**Expected Output** (if working):
```
✅ All required variables are set
📧 Sending test email to: your-email@gmail.com
✅ Email sent successfully!
   Check your inbox: your-email@gmail.com
```

**If you see errors**, the most common issues are:

### Issue 1: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Fix**: You're using your regular Gmail password instead of App Password

1. Go to [Google Account](https://myaccount.google.com) → Security
2. Enable **2-Step Verification** (if not enabled)
3. Go to **App Passwords**
4. Generate new password for "Mail"
5. Copy the 16-character password (remove spaces)
6. Update `server/.env`:
   ```env
   SMTP_PASS=your-16-char-app-password-no-spaces
   ```
7. Restart backend: `npm run dev`

### Issue 2: "Email skipped (not configured)"

**Fix**: Check your `.env` file format

Make sure `server/.env` looks like this (NO QUOTES):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
FROM_EMAIL=your-email@gmail.com
```

**Common mistakes**:
- ❌ `SMTP_PASS="abcd efgh ijkl mnop"` (quotes and spaces)
- ✅ `SMTP_PASS=abcdefghijklmnop` (no quotes, no spaces)

## Step 2: Restart Backend

After fixing the password:

```bash
cd server
# Stop backend (Ctrl+C)
npm run dev
```

Look for:
```
✅ Email server is ready to send messages
```

## Step 3: Test by Submitting Complaint

1. Submit a new complaint in your app
2. Check backend logs - should see:
   ```
   📧 Attempting to send email to: your-email@gmail.com
   ✅ Email sent successfully!
   ```
3. Check your email inbox

## Step 4: Verify All Email Types Work

Your system sends emails for:

1. ✅ **Complaint Submission** - When you submit a complaint
2. ✅ **Status Update** - When admin changes status
3. ✅ **New Comment** - When admin comments
4. ✅ **Password Reset** - When user resets password

Test each one and verify emails are received.

## Still Not Working?

Run the test script and share the output:

```bash
cd server
node test-email-config.js
```

Share:
1. The output from the test script
2. Backend startup logs (what you see when running `npm run dev`)
3. Any error messages

Email alerts are critical - let's get them working! 🚀

