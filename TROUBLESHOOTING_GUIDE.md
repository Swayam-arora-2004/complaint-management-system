# Troubleshooting Guide - Google Login & Email

## Issue 1: Google Login Not Working

### Check Browser Console
Open browser DevTools (F12) → Console tab and look for errors when clicking "Sign in with Google".

### Common Issues:

#### 1. Backend Not Running
**Error**: `Failed to fetch` or `Network error`

**Fix**: 
- Make sure backend is running: `cd server && npm run dev`
- Check backend URL in `.env`: `VITE_API_BASE_URL=http://localhost:5001/api`

#### 2. CORS Error
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix**: 
- Check backend CORS configuration in `server/src/index.js`
- Make sure frontend URL is in allowed origins

#### 3. Backend API Not Responding
**Error**: `Failed to login with Google` or `Server error`

**Fix**:
- Check backend logs for errors
- Verify `/api/auth/google` endpoint exists
- Test with Postman: `POST http://localhost:5001/api/auth/google`

#### 4. Supabase Redirect Issue
**Error**: URL shows hash but doesn't redirect

**Fix**:
- Check Supabase redirect URL is: `http://localhost:3000/oauth/callback` (or your frontend URL)
- Verify route exists in `src/App.tsx`

### Debug Steps:

1. **Check Console Logs**:
   - Look for: `OAuth callback triggered`
   - Look for: `Calling backend with:`
   - Look for: `Backend response:`

2. **Check Network Tab**:
   - Open DevTools → Network tab
   - Click "Sign in with Google"
   - Look for request to `/api/auth/google`
   - Check response status and body

3. **Test Backend Directly**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{"googleId":"test123","email":"test@example.com","name":"Test User"}'
   ```

---

## Issue 2: Email Not Working

### Check Backend Logs
Look for these messages in your backend console:

**✅ Working**:
```
✅ Email server is ready to send messages
📧 Attempting to send email to: user@example.com
✅ Email sent successfully!
```

**❌ Not Working**:
```
⚠️  Email not configured. Email notifications will be disabled.
📧 Email skipped (not configured): Complaint Submitted
```

### Fix Email Configuration

#### Step 1: Get Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable if not enabled)
3. **Security** → **App Passwords**
4. Generate new app password for "Mail"
5. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

#### Step 2: Add to Backend Environment

**For Local Development** (`server/.env`):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

**For Production (Render/Railway)**:
1. Go to your backend service dashboard
2. **Environment** or **Variables** tab
3. Add each variable:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-16-char-app-password` (no spaces)
   - `FROM_EMAIL` = `your-email@gmail.com`

#### Step 3: Restart Backend

After adding variables:
- **Local**: Stop and restart `npm run dev`
- **Production**: Service will auto-redeploy

#### Step 4: Verify

Check backend logs. You should see:
```
✅ Email server is ready to send messages
```

### Test Email

1. Submit a new complaint
2. Check backend logs for email sending attempt
3. Check your email inbox (and spam folder)

### Common Email Errors

**Error**: `Invalid login: 535-5.7.8 Username and Password not accepted`
- **Fix**: Use Gmail App Password, not your regular password

**Error**: `Email skipped (not configured)`
- **Fix**: Add all SMTP variables to backend environment

**Error**: `Connection timeout`
- **Fix**: Check firewall/network allows SMTP (port 587)

---

## Quick Diagnostic Commands

### Check Backend is Running
```bash
curl http://localhost:5001/api/health
```
Should return: `{"status":"OK","message":"Server is running"}`

### Check Frontend API URL
```bash
# In browser console
console.log(import.meta.env.VITE_API_BASE_URL)
```
Should show: `http://localhost:5001/api` (or your backend URL)

### Test Google Login Endpoint
```bash
curl -X POST http://localhost:5001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"googleId":"test","email":"test@test.com","name":"Test"}'
```

---

## Still Not Working?

Share these details:

1. **Browser Console Errors** (screenshot or copy/paste)
2. **Backend Logs** (from terminal where server is running)
3. **Network Tab** (screenshot of failed request)
4. **Backend URL** (what's in your `.env` file)

This will help identify the exact issue!

