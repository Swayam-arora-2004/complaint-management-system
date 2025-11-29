# Deployment Checklist

Use this checklist to ensure everything is configured correctly before and after deployment.

## Pre-Deployment

### Code Preparation
- [ ] All code committed to GitHub
- [ ] `.env` files are in `.gitignore` (not committed)
- [ ] No sensitive data in code
- [ ] Admin credentials changed from default
- [ ] All features tested locally

### Environment Variables Prepared
- [ ] MongoDB Atlas connection string ready
- [ ] Gmail App Password generated
- [ ] JWT Secret generated (use: `openssl rand -base64 32`)
- [ ] Groq API key ready
- [ ] Supabase credentials ready

## Backend Deployment (Railway)

### Railway Setup
- [ ] Account created at railway.app
- [ ] Project created and connected to GitHub
- [ ] Service created with root directory: `server`
- [ ] All environment variables added:
  - [ ] `PORT=5001`
  - [ ] `MONGODB_URI` (MongoDB Atlas connection string)
  - [ ] `JWT_SECRET` (secure random string)
  - [ ] `FRONTEND_URL` (will update after Vercel deploy)
  - [ ] `SMTP_HOST=smtp.gmail.com`
  - [ ] `SMTP_PORT=587`
  - [ ] `SMTP_USER` (your Gmail)
  - [ ] `SMTP_PASS` (Gmail App Password)
  - [ ] `FROM_EMAIL` (formatted email)

### Backend Verification
- [ ] Deployment successful (green status)
- [ ] Public domain URL copied
- [ ] Health check endpoint working: `https://your-app.railway.app/api/health`
- [ ] Logs show no errors
- [ ] Database connection successful (check logs)

## Frontend Deployment (Vercel)

### Vercel Setup
- [ ] Account created at vercel.com
- [ ] Project imported from GitHub
- [ ] Build settings verified:
  - [ ] Framework: Vite
  - [ ] Root Directory: `./`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] All environment variables added:
  - [ ] `VITE_API_BASE_URL` (Railway backend URL + `/api`)
  - [ ] `VITE_GROQ_API_KEY`
  - [ ] `VITE_OPENAI_API_KEY` (optional)
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`

### Frontend Verification
- [ ] Deployment successful
- [ ] Vercel URL copied
- [ ] Site loads without errors
- [ ] No console errors in browser

## Post-Deployment Configuration

### Update URLs
- [ ] Railway: Update `FRONTEND_URL` with Vercel URL
- [ ] Vercel: Update `VITE_API_BASE_URL` with Railway URL
- [ ] Both services redeploy automatically

### MongoDB Atlas
- [ ] Database user created
- [ ] Network access configured (allow from anywhere or specific IPs)
- [ ] Connection string tested
- [ ] Database accessible from Railway

## Testing After Deployment

### Authentication
- [ ] User registration works
- [ ] Email/password login works
- [ ] Google OAuth works (if configured)
- [ ] Apple OAuth works (if configured)
- [ ] Password reset email received
- [ ] Password reset link works
- [ ] Admin login works

### User Features
- [ ] Submit complaint works
- [ ] File upload works
- [ ] View complaints works
- [ ] Add comments works
- [ ] View attachments works
- [ ] Status updates work

### Admin Features
- [ ] Admin dashboard loads
- [ ] View all complaints works
- [ ] Update status works
- [ ] Add support comments works
- [ ] View attachments works

### Email
- [ ] Registration email received (if implemented)
- [ ] Complaint submission email received
- [ ] Status update email received
- [ ] Password reset email received

## Security Checklist

- [ ] Admin credentials changed
- [ ] JWT_SECRET is strong and random
- [ ] MongoDB password is strong
- [ ] Gmail App Password is secure
- [ ] No `.env` files in repository
- [ ] CORS configured correctly
- [ ] HTTPS enabled (automatic on Vercel/Railway)

## Monitoring

- [ ] Railway logs monitored
- [ ] Vercel analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Database monitoring enabled

## Final Steps

- [ ] Test complete user flow
- [ ] Test complete admin flow
- [ ] Document production URLs
- [ ] Share access with team (if applicable)
- [ ] Set up backups (MongoDB Atlas has automatic backups)

---

## Quick Commands

### Generate JWT Secret
```bash
openssl rand -base64 32
```

### Test Backend Health
```bash
curl https://your-app.railway.app/api/health
```

### Test Frontend
```bash
# Just open in browser
https://your-app.vercel.app
```

