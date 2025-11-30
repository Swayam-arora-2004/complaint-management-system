# Fixes Applied - Google Login & Email Alerts

## Issue 1: Google Login Not Working ✅ FIXED

### Problem
Google OAuth was redirecting to `http://localhost:3000/#access_token=...` but the callback handler wasn't processing the URL hash correctly.

### Solution
Updated `src/pages/OAuthCallback.tsx` to:
1. **Parse URL hash parameters** - Extract `access_token` and `refresh_token` from the URL hash
2. **Set Supabase session** - Use `supabase.auth.setSession()` to establish the session from URL tokens
3. **Extract user info** - Get email, name, and provider from Supabase user object
4. **Get provider ID** - Use `user.user_metadata.sub` (Google's user ID) instead of Supabase's internal ID
5. **Clear URL hash** - Remove hash from URL after processing for cleaner navigation
6. **Better error handling** - Added fallback to get existing session if hash parsing fails

### Changes Made
- `src/pages/OAuthCallback.tsx` - Complete rewrite of OAuth callback handler
- `server/src/routes/oauthRoutes.js` - Added `role` to response and email normalization

### Testing
1. Click "Sign in with Google"
2. Complete Google authentication
3. Should redirect to `/dashboard` or `/admin/dashboard` based on role
4. URL should be clean (no hash parameters)

---

## Issue 2: Email Alerts Not Working ⚠️ REQUIRES CONFIGURATION

### Problem
Email alerts are not being sent because SMTP configuration is missing in backend environment variables.

### Solution
Add SMTP environment variables to your backend (Render/Railway):

### Required Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
```

### How to Get Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable if not enabled)
3. **Security** → **App Passwords**
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Use it as `SMTP_PASS` in backend environment variables

### Where to Add Variables

#### For Render:
1. Dashboard → Your Service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Add each variable listed above
4. Click **"Save Changes"**
5. Service will automatically redeploy

#### For Railway:
1. Dashboard → Your Service → **Variables** tab
2. Click **"New Variable"**
3. Add each variable listed above
4. Service will automatically redeploy

### Verify Email Configuration

After adding variables, check backend logs. You should see:

```
✅ Email server is ready to send messages
```

If you see:
```
⚠️  Email not configured properly. Email notifications disabled.
```

Then double-check your SMTP settings.

### Email Types Sent

1. **Complaint Submission** - When user submits a complaint
2. **Status Update** - When admin changes complaint status
3. **New Comment** - When admin/support agent comments
4. **Password Reset** - When user requests password reset

### Testing Email

1. Submit a new complaint
2. Check backend logs for:
   ```
   📧 Attempting to send email to: user@example.com
   ✅ Email sent successfully!
   ```
3. Check your email inbox (and spam folder)

---

## Next Steps

1. ✅ **Google Login** - Should work now after code changes
2. ⚠️ **Email Alerts** - Add SMTP environment variables to backend

## Still Having Issues?

### Google Login Still Not Working?
- Check browser console for errors
- Verify Supabase redirect URL is correct: `${window.location.origin}/oauth/callback`
- Check backend logs for OAuth errors

### Email Still Not Working?
- Verify all SMTP variables are set correctly
- Check backend logs for email errors
- Make sure Gmail App Password is correct (not regular password)
- Check spam folder

Both fixes are now in place! 🚀

