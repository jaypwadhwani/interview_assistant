# Deployment Guide - Step by Step

This guide will walk you through deploying the backend to Railway and frontend to Vercel.

---

## Prerequisites

1. **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
   - Sign up/login to OpenAI
   - Go to API Keys section
   - Click "Create new secret key"
   - Copy it and save it somewhere safe (you'll need it)

2. **GitHub Account**: Both Railway and Vercel can deploy from GitHub
   - If your code isn't on GitHub yet, push it there first

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up (you can use GitHub to sign in)
3. You should see a dashboard

### Step 2: Create New Project
1. Click the big "+ New Project" button
2. Select "Deploy from GitHub repo" (or "Empty Project" if you prefer)
3. If using GitHub:
   - Authorize Railway to access your GitHub
   - Select your repository
   - Railway will try to auto-detect the project

### Step 3: Configure the Project
1. Railway might ask "Which service?" - select your repo
2. Click on your service/project name
3. Railway will try to auto-detect, but we need to tell it:
   - **Root Directory**: Set to `server` (click Settings → Root Directory → enter `server`)
   - **Build Command**: Leave empty or delete it (we don't need to build Node.js)
   - **Start Command**: Should be `npm start` (Railway should auto-detect this)

### Step 4: Add Environment Variables
1. In your Railway project, click on the "Variables" tab (or click your service → Variables)
2. Click "+ New Variable"
3. Add these variables one by one:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI API key
   - Click "Add"
   
   - **Name**: `PORT` (optional, Railway sets this automatically, but you can set it to `3001` if you want)

### Step 5: Deploy
1. Railway should automatically start deploying
2. You'll see logs showing `npm install` and then `npm start`
3. Wait for it to finish (should say "Deployed" or show a green checkmark)
4. Railway will give you a URL like: `https://your-project-name.up.railway.app`
5. **COPY THIS URL** - you'll need it for the frontend!
6. Test it: Open `https://your-project-name.up.railway.app/api/health` in a browser
   - You should see: `{"ok":true,"status":"healthy"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up (you can use GitHub to sign in)

### Step 2: Import Project
1. Click "+ New Project" or "Add New..." → "Project"
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### Step 3: Configure Build Settings
1. **Framework Preset**: Should auto-detect as "Vite"
2. **Root Directory**: Leave as `.` (root) - the frontend is in the root
3. **Build Command**: Should be `npm run build` (auto-detected)
4. **Output Directory**: Should be `dist` (auto-detected)
5. **Install Command**: Should be `npm install` (auto-detected)

### Step 4: Add Environment Variable
1. In the "Environment Variables" section, click "Add"
2. **Key**: `VITE_API_BASE_URL`
3. **Value**: Paste your Railway backend URL (e.g., `https://your-project-name.up.railway.app`)
   - **Important**: Do NOT add `/api` at the end, just the base URL
4. Make sure it's set for all environments (Production, Preview, Development)
5. Click "Add"

### Step 5: Deploy
1. Click "Deploy" button
2. Vercel will build and deploy your frontend
3. Wait for it to finish (usually takes 1-2 minutes)
4. You'll get a URL like: `https://your-project-name.vercel.app`
5. **Open this URL** - your app should be live!

---

## Part 3: Testing

1. Open your Vercel URL in Chrome (Chrome works best for voice features)
2. Fill in job details (Job Title is required)
3. Click the microphone button
4. You should hear the AI speak!
5. Answer the question when prompted
6. The conversation should flow naturally

---

## Troubleshooting

### Backend Issues:
- **"OPENAI_API_KEY not found"**: Make sure you added it in Railway Variables
- **Health check fails**: Check Railway logs (click on your service → Deployments → Click the latest → View Logs)
- **Port issues**: Railway sets PORT automatically, you shouldn't need to change it

### Frontend Issues:
- **Can't connect to backend**: 
  - Check that `VITE_API_BASE_URL` in Vercel matches your Railway URL exactly
  - Make sure the Railway backend is running (check Railway dashboard)
  - Open browser console (F12) and look for error messages
- **"Failed to start interview"**: Check Railway logs for backend errors

### General:
- Both Railway and Vercel show logs - check them if something doesn't work
- Make sure your OpenAI API key has credits/billing set up

---

## Local Development (Optional)

If you want to test locally first:

### Backend:
```bash
cd server
npm install
# Create a .env file with: OPENAI_API_KEY=your_key_here
npm start
# Backend runs on http://localhost:3001
```

### Frontend:
```bash
# In the root directory
npm install
# Create a .env file with: VITE_API_BASE_URL=http://localhost:3001
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Need Help?

- Check Railway logs: Railway dashboard → Your service → Deployments → Latest → Logs
- Check Vercel logs: Vercel dashboard → Your project → Deployments → Latest → Logs
- Check browser console (F12) for frontend errors

