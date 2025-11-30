# Email Alerts Setup - Complete Guide

## ⚠️ EXTREMELY IMPORTANT - Email Alerts Setup

Email alerts are critical for your complaint management system. Follow these steps carefully.

---

## Step 1: Get Gmail App Password

### 1.1 Enable 2-Step Verification

1. Go to [Google Account](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to enable it (you'll need your phone)

### 1.2 Generate App Password

1. Go back to **Security** page
2. Under "How you sign in to Google", click **App Passwords**
   - If you don't see this, make sure 2-Step Verification is enabled first
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **Complaint System**
6. Click **Generate**
7. **COPY THE 16-CHARACTER PASSWORD** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **You can only see this once!** Copy it immediately
   - Remove spaces when using it (use: `abcdefghijklmnop`)

---

## Step 2: Add to Backend Environment

### For Local Development

Edit `server/.env` file and add these lines:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
FROM_EMAIL=your-email@gmail.com
```

**Important**:
- Replace `your-email@gmail.com` with YOUR Gmail address
- Replace `abcdefghijklmnop` with your 16-character App Password (NO SPACES)
- Make sure there are NO quotes around the values

### Example:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aroraswayam0@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
FROM_EMAIL=aroraswayam0@gmail.com
```

**Wait!** Remove spaces from the password:
```env
SMTP_PASS=abcdefghijklmnop
```

---

## Step 3: Restart Backend

After adding the variables:

1. **Stop** the backend (press `Ctrl+C` in the terminal)
2. **Restart** it:
   ```bash
   cd server
   npm run dev
   ```

3. **Look for this message**:
   ```
   ✅ Email server is ready to send messages
   ```

If you see:
```
⚠️  Email not configured
```
Then check your `.env` file again - there might be a typo.

---

## Step 4: Test Email

### Test 1: Submit a Complaint

1. Log in to your app
2. Submit a new complaint
3. Check backend logs - should see:
   ```
   📧 Attempting to send email to: your-email@gmail.com
   ✅ Email sent successfully!
   ```
4. Check your email inbox (and spam folder)

### Test 2: Check Backend Logs

When backend starts, you should see:
```
✅ Email server is ready to send messages
```

If you see errors, check:
- App Password is correct (no spaces)
- Email address is correct
- 2-Step Verification is enabled

---

## Step 5: For Production (Render/Railway)

If your backend is deployed, add these same variables in your hosting platform:

### Render:
1. Dashboard → Your Service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Add each variable:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-16-char-app-password` (no spaces)
   - `FROM_EMAIL` = `your-email@gmail.com`
4. Service will auto-redeploy

### Railway:
1. Dashboard → Your Service → **Variables** tab
2. Click **"New Variable"**
3. Add the same variables as above

---

## Email Types Sent

Your system sends emails for:

1. ✅ **Complaint Submission** - When user submits a complaint
2. ✅ **Status Update** - When admin changes complaint status
3. ✅ **New Comment** - When admin/support agent comments
4. ✅ **Password Reset** - When user requests password reset

---

## Troubleshooting

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Fix**:
- Make sure you're using **App Password**, not your regular Gmail password
- Remove spaces from the App Password
- Verify 2-Step Verification is enabled

### Issue: "Email skipped (not configured)"

**Fix**:
- Check `server/.env` file exists
- Verify all 5 variables are set (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL)
- Make sure there are no typos
- Restart backend after adding variables

### Issue: "Connection timeout"

**Fix**:
- Check your internet connection
- Verify SMTP_PORT is `587` (not 465)
- Check firewall allows outbound connections on port 587

### Issue: No emails received

**Fix**:
- Check spam folder
- Verify email address is correct
- Check backend logs for errors
- Make sure backend is actually sending (check logs)

---

## Quick Verification

Run this to test your email config:

```bash
cd server
node -e "
require('dotenv').config();
const { sendEmail } = require('./src/config/mailer');
sendEmail(
  process.env.SMTP_USER,
  'Test Email',
  'This is a test email from your complaint system.',
  '<h1>Test Email</h1><p>If you receive this, email is working!</p>'
).then(result => {
  console.log('Result:', result);
  process.exit(0);
});
"
```

If you see `✅ Email sent successfully!`, then email is working!

---

## Still Not Working?

Share:
1. Backend startup logs (what you see when running `npm run dev`)
2. Contents of `server/.env` (hide the password, just show the variable names)
3. Any error messages from backend logs

Email alerts are critical - let's get them working! 🚀

