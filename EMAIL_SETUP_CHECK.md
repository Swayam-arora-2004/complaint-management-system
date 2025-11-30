# Email Alerts Setup Check

## Current Status

Email alerts are not working. Here's how to fix it:

## Step 1: Check Backend Environment Variables

Your backend (Render/Railway) needs these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
```

## Step 2: Get Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App Passwords
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Use it as `SMTP_PASS` in your backend environment variables

## Step 3: Add to Render/Railway

### For Render:
1. Dashboard → Your Service → Environment
2. Add each variable:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-16-char-app-password`
   - `FROM_EMAIL` = `your-email@gmail.com`

### For Railway:
1. Dashboard → Your Service → Variables
2. Add the same variables as above

## Step 4: Verify Email Configuration

Check your backend logs after adding variables. You should see:

```
✅ Email server is ready to send messages
```

If you see:
```
⚠️  Email not configured properly. Email notifications disabled.
```

Then the SMTP settings are incorrect.

## Step 5: Test Email Sending

After adding the variables:

1. Submit a new complaint
2. Check backend logs for:
   ```
   📧 Attempting to send email to: user@example.com
   ✅ Email sent successfully!
   ```

## Common Issues

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Fix**: Use Gmail App Password, not your regular password

### Issue: "Email skipped (not configured)"
**Fix**: Make sure all SMTP variables are set in backend environment

### Issue: No emails received
**Fix**: 
- Check spam folder
- Verify email address is correct
- Check backend logs for errors

## Email Types Sent

1. **Complaint Submission**: When user submits a complaint
2. **Status Update**: When admin changes complaint status
3. **New Comment**: When admin/support agent comments on complaint
4. **Password Reset**: When user requests password reset

All emails are sent from the backend, so make sure backend environment variables are configured!

