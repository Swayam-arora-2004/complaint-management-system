# Quick Render Setup (5 Minutes)

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

## Step 2: Connect Repository
1. Select your GitHub repo: `complaint-compass-main`
2. Click **"Connect"**

## Step 3: Configure Service

**Settings**:
- **Name**: `complaint-compass-api`
- **Root Directory**: `server` ⚠️ **CRITICAL**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

## Step 4: Add Environment Variables

Click **"Environment"** → Add these:

```env
MONGODB_URI=mongodb+srv://aroraswayam0:1234@cmscluster.nwbrc4v.mongodb.net/complaint-compass?appName=CMSCluster
JWT_SECRET=run_node_generate-secrets.js_to_get_this
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

## Step 5: Deploy

Click **"Create Web Service"** and wait 2-5 minutes.

## Step 6: Get Your URL

After deployment, you'll get:
```
https://complaint-compass-api.onrender.com
```

Use this in your frontend:
```env
VITE_API_BASE_URL=https://complaint-compass-api.onrender.com/api
```

## Done! ✅

Test it:
```
https://complaint-compass-api.onrender.com/api/health
```

Should return: `{"status":"OK","message":"Server is running"}`

---

**That's it!** Render is much simpler than Railway. 🚀

