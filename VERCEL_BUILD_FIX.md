# Vercel Build Fix - vite: command not found

## The Problem

Error: `sh: line 1: vite: command not found`

**Cause**: `vite` is in `devDependencies`, and Vercel might skip dev dependencies during install.

## The Fix

I've updated `vercel.json` to explicitly install dev dependencies:

```json
{
  "installCommand": "npm install --include=dev"
}
```

## Alternative Solutions

### Option 1: Move vite to dependencies (Quick Fix)

If the above doesn't work, you can move `vite` from `devDependencies` to `dependencies` in `package.json`:

```json
{
  "dependencies": {
    // ... existing dependencies
    "vite": "^5.4.21"
  },
  "devDependencies": {
    // Remove vite from here
  }
}
```

### Option 2: Configure in Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Settings
2. Go to **Build & Development Settings**
3. Set **Install Command** to: `npm install --include=dev`
4. Save and redeploy

### Option 3: Use .npmrc (Recommended)

Create a `.npmrc` file in the root:

```
production=false
```

This tells npm to always install dev dependencies.

## Verify Fix

After pushing the changes:

1. Push to GitHub
2. Vercel will automatically redeploy
3. Check build logs - should see `vite build` running successfully

## Expected Build Output

After fix, you should see:

```
Running "install" command: npm install --include=dev
added 279 packages...
Running "build" command: npm run build
> vite build
vite v5.4.21 building for production...
✓ built in X.XXs
```

## Still Having Issues?

If it still fails:

1. **Check Vercel Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --include=dev`

2. **Check package.json**:
   - Make sure `vite` is listed (in dependencies or devDependencies)
   - Make sure `build` script exists: `"build": "vite build"`

3. **Try clearing cache**:
   - Vercel Dashboard → Settings → Clear Build Cache
   - Redeploy

The fix has been applied to `vercel.json`. Push the changes and redeploy! 🚀
