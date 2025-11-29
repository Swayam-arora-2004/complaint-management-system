# Quick Deployment Guide

## 🚀 Fast Track Deployment

### Step 1: Push to GitHub

```bash
# If not already a git repo
git init
git add .
git commit -m "Ready for deployment"

# Add your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/complaint-compass.git
git push -u origin main
```

### Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Click **+ New** → **Service** → Select your repo
5. In **Settings** → Set **Root Directory** to `server`
6. Go to **Variables** tab and add:

```env
PORT=5001
FRONTEND_URL=https://your-app.vercel.app (update after Vercel deploy)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/complaint-compass
JWT_SECRET=generate_a_random_secure_string_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL="Complaint System <your_email@gmail.com>"
```

7. Copy the **Public Domain** URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → Import your repository
3. Vercel auto-detects Vite - just click **Deploy**
4. After deployment, go to **Settings** → **Environment Variables**:

```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
VITE_GROQ_API_KEY=your_groq_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

5. Copy your Vercel URL (e.g., `https://complaint-compass.vercel.app`)

### Step 4: Update URLs

1. **Railway**: Update `FRONTEND_URL` with your Vercel URL
2. **Vercel**: Update `VITE_API_BASE_URL` with your Railway URL
3. Both will auto-redeploy

### Step 5: MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. **Database Access** → Create user (save password!)
4. **Network Access** → Allow from anywhere (or add Railway IPs)
5. **Clusters** → Connect → Get connection string
6. Replace `<password>` in connection string
7. Add to Railway as `MONGODB_URI`

## ✅ Done!

Your app is live:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

## 🔧 Troubleshooting

**Backend not working?**
- Check Railway logs
- Verify all env variables are set
- Check MongoDB connection

**Frontend can't connect?**
- Verify `VITE_API_BASE_URL` is correct
- Check CORS in backend
- Check browser console

**Need help?** Check `DEPLOYMENT.md` for detailed guide.

