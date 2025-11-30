# Deploy Backend to Render

## Quick Setup Guide

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up (free tier available)
3. Connect your GitHub account

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository: `complaint-compass-main`

### Step 3: Configure Service

**Basic Settings**:
- **Name**: `complaint-compass-api` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` ⚠️ **IMPORTANT**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan**: Select **Free** (or paid if you prefer)

### Step 4: Add Environment Variables

Click **"Environment"** tab and add these variables:

#### Required Variables:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://aroraswayam0:1234@cmscluster.nwbrc4v.mongodb.net/complaint-compass?appName=CMSCluster
JWT_SECRET=your_random_secure_string_here
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Optional Variables (for email):

```env
FROM_EMAIL=your-email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**How to add**:
1. Click **"Add Environment Variable"**
2. Enter **Key** (e.g., `MONGODB_URI`)
3. Enter **Value** (e.g., your MongoDB connection string)
4. Click **"Save Changes"**

### Step 5: Generate JWT_SECRET

Run locally to generate a secure secret:

```bash
node generate-secrets.js
```

Copy the output and use it as `JWT_SECRET` value.

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Wait for deployment to complete (2-5 minutes)

### Step 7: Get Your Backend URL

After deployment:
1. Render will show your service URL
2. It will look like: `https://complaint-compass-api.onrender.com`
3. Copy this URL - you'll need it for your frontend!

### Step 8: Update Frontend

Update your frontend `.env` or Vercel environment variables:

```env
VITE_API_BASE_URL=https://complaint-compass-api.onrender.com/api
```

## Verify Deployment

### Test Health Endpoint

Visit in browser:
```
https://your-service.onrender.com/api/health
```

Should return:
```json
{"status":"OK","message":"Server is running"}
```

### Check Logs

1. Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Look for:
   - `✅ Server running on port 5001`
   - `✅ MongoDB Connected: cmscluster.nwbrc4v.mongodb.net`

## Troubleshooting

### Build Fails

**Error**: "Cannot find module"
- **Fix**: Make sure **Root Directory** is set to `server`

**Error**: "Command not found"
- **Fix**: Check **Start Command** is `npm start`

### Deploy Fails

**Error**: "MongoDB URI is not defined"
- **Fix**: Add `MONGODB_URI` in Environment Variables

**Error**: "Port already in use"
- **Fix**: Remove `PORT` variable (Render sets it automatically)

### Service Keeps Restarting

**Check Logs** for:
- MongoDB connection errors → Check `MONGODB_URI`
- Missing environment variables → Add required vars
- Port conflicts → Remove `PORT` variable

## Render vs Railway

### Advantages of Render:
- ✅ Simpler configuration
- ✅ Better free tier (no credit card required)
- ✅ Automatic HTTPS
- ✅ Better dashboard UI
- ✅ Easier environment variable management

### Free Tier Limitations:
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds
- ⚠️ 750 hours/month free (enough for always-on if you upgrade)

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get backend URL
3. ✅ Update frontend `VITE_API_BASE_URL`
4. ✅ Deploy frontend to Vercel
5. ✅ Test the full application

## Quick Reference

**Backend URL**: `https://your-service.onrender.com`  
**API Base**: `https://your-service.onrender.com/api`  
**Health Check**: `https://your-service.onrender.com/api/health`

Good luck with Render! It's often easier than Railway. 🚀

