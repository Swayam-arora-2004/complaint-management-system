# Deployment Guide

> **Note**: This guide covers both Railway and Render. Render is recommended for easier setup.

This guide will help you deploy the Complaint Management System to production.

## 🎯 Deployment Strategy

- **Frontend**: Vercel (recommended) or GitHub Pages
- **Backend**: Railway (recommended) or Render
- **Database**: MongoDB Atlas (cloud database)

## 📋 Prerequisites

1. GitHub account
2. Vercel account (free tier available)
3. Railway account (free tier available) or Render account
4. MongoDB Atlas account (free tier available)

---

## 🚀 Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
cd complaint-compass-main
git init
git add .
git commit -m "Initial commit - Complaint Management System"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `complaint-compass` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license

### 1.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/complaint-compass.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new cluster (choose free tier M0)

### 2.2 Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Create username and password (save these!)
3. Set privileges to **Read and write to any database**


### 2.3 Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (for development)
3. Or add specific IPs for production

### 2.4 Get Connection String

1. Go to **Clusters** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Example: `mongodb+srv://username:password@cluster.mongodb.net/complaint-compass`

---

## 🚂 Step 3: Deploy Backend to Railway

### 3.1 Create Railway Account

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**

### 3.2 Connect Repository

1. Select your `complaint-compass` repository
2. Railway will detect the project

### 3.3 Configure Backend Deployment

1. Click on the project
2. Click **+ New** → **Service**
3. Select **GitHub Repo** → Your repository
4. In **Settings** → **Root Directory**: Set to `server`

### 3.4 Set Environment Variables

Go to **Variables** tab and add:

```env
PORT=5001
FRONTEND_URL=https://your-frontend-url.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint-compass
JWT_SECRET=your_very_secure_random_string_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL="Complaint System <your_email@gmail.com>"
```

### 3.5 Deploy

1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy the **Public Domain** URL (e.g., `https://your-app.railway.app`)

### 3.6 Update CORS in Backend

The backend should already be configured, but verify in `server/src/index.js` that your Vercel URL is in the CORS allowed origins.

---

## ⚡ Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Click **Add New Project**

### 4.2 Import Repository

1. Select your `complaint-compass` repository
2. Vercel will auto-detect Vite configuration

### 4.3 Configure Build Settings

Vercel should auto-detect, but verify:
- **Framework Preset**: Vite
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4.4 Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
VITE_GROQ_API_KEY=your_groq_api_key
VITE_OPENAI_API_KEY=your_openai_api_key (optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4.5 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Copy your deployment URL (e.g., `https://complaint-compass.vercel.app`)

### 4.6 Update Backend CORS

Go back to Railway and update `FRONTEND_URL` environment variable with your Vercel URL.

---

## 🔄 Step 5: Update Configuration

### 5.1 Update Frontend API URL

After getting your Railway backend URL, update Vercel environment variable:
- `VITE_API_BASE_URL` = `https://your-backend.railway.app/api`

### 5.2 Update Backend Frontend URL

In Railway, update:
- `FRONTEND_URL` = `https://your-frontend.vercel.app`

### 5.3 Redeploy

Both services will auto-redeploy when you update environment variables, or you can manually trigger redeploy.

---

## ✅ Step 6: Verify Deployment

### 6.1 Test Frontend

1. Visit your Vercel URL
2. Try to register a new user
3. Test login functionality

### 6.2 Test Backend

1. Check Railway logs for any errors
2. Test API endpoints using Postman or browser
3. Verify database connection

### 6.3 Test Email

1. Request password reset
2. Check if email is received
3. Verify reset link works

---

## 🔧 Troubleshooting

### Backend Not Starting

- Check Railway logs for errors
- Verify all environment variables are set
- Check MongoDB connection string
- Ensure port is set correctly

### Frontend Can't Connect to Backend

- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Verify backend is running (check Railway logs)
- Check browser console for errors

### Database Connection Issues

- Verify MongoDB Atlas IP whitelist includes Railway IPs
- Check connection string format
- Verify database user credentials

### Email Not Sending

- Verify Gmail App Password is correct
- Check SMTP settings
- Check Railway logs for email errors

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and running on Railway
- [ ] Frontend deployed and running on Vercel
- [ ] MongoDB Atlas database connected
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Email service working
- [ ] User registration working
- [ ] Login working
- [ ] Password reset working
- [ ] File uploads working
- [ ] Admin access working

---

## 🔐 Security Notes

1. **Change Admin Credentials**: Update admin username/password in production
2. **Use Strong JWT Secret**: Generate a secure random string for `JWT_SECRET`
3. **MongoDB Security**: Use strong database passwords
4. **Environment Variables**: Never commit `.env` files to GitHub
5. **HTTPS**: Both Vercel and Railway provide HTTPS by default

---

## 🎉 You're Done!

Your application should now be live and accessible at your Vercel URL!

**Frontend**: `https://your-app.vercel.app`  
**Backend**: `https://your-app.railway.app`

