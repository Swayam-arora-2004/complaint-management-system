# Quick Fix Checklist

## Google Login Not Working? ✅

### Step 1: Check Backend is Running
```bash
cd server
npm run dev
```
Should see: `✅ Server running on port 5001`

### Step 2: Check Frontend .env
File: `.env` (root directory)
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### Step 3: Check Browser Console
1. Open DevTools (F12)
2. Click "Sign in with Google"
3. Look for errors in Console tab
4. Share the error message

### Step 4: Check Network Tab
1. DevTools → Network tab
2. Click "Sign in with Google"
3. Find request to `/api/auth/google`
4. Check if it's successful (200) or failed (400/500)
5. Click on it → Response tab → See error message

---

## Email Not Working? ✅

### Step 1: Get Gmail App Password
1. [Google Account](https://myaccount.google.com) → Security
2. Enable 2-Step Verification
3. App Passwords → Generate for "Mail"
4. Copy 16-character password

### Step 2: Add to Backend .env
File: `server/.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

### Step 3: Restart Backend
```bash
# Stop backend (Ctrl+C)
# Then restart
cd server
npm run dev
```

### Step 4: Check Backend Logs
Should see:
```
✅ Email server is ready to send messages
```

If you see:
```
⚠️  Email not configured
```
Then SMTP variables are missing or incorrect.

---

## Still Not Working?

**For Google Login**:
- Share browser console errors
- Share network tab response
- Check if backend is actually running

**For Email**:
- Share backend console logs
- Verify SMTP variables are in `server/.env`
- Make sure you're using App Password (not regular password)

