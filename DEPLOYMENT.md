# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (connected to GitHub)
- Railway account
- OpenAI API key

## Architecture
- **Frontend**: React/Vite hosted on Vercel
- **Backend**: Node.js/Express hosted on Railway

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
cd "/Users/jaywadhwani/Desktop/AI Projects/Interview Assistant"
git init
git add .
git commit -m "Initial commit - Interview Assistant"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy Backend to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js app in the `server/` folder
5. Set environment variables in Railway:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3001 (Railway will override this automatically)
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: Will add after Vercel deployment

6. Railway will give you a URL like: `https://your-app.railway.app`
7. **Note this URL** - you'll need it for the frontend

### 3. Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - `VITE_API_BASE_URL`: Your Railway backend URL (from step 2)
6. Click "Deploy"

### 4. Update CORS Settings

1. Go back to Railway
2. Update the `CORS_ORIGIN` environment variable with your Vercel URL
3. Example: `https://your-app.vercel.app`
4. Railway will automatically redeploy

### 5. Test Your App

Visit your Vercel URL and test all features:
- ✅ Start interview
- ✅ Voice commands work
- ✅ Audio plays correctly
- ✅ Feedback is provided
- ✅ Session management

## Environment Variables Summary

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://your-backend.railway.app
```

### Backend (Railway)
```
OPENAI_API_KEY=sk-...
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
```

## Troubleshooting

### Backend not connecting
- Check Railway logs
- Verify OPENAI_API_KEY is set correctly
- Ensure CORS_ORIGIN matches your Vercel domain

### Frontend not loading
- Check Vercel build logs
- Verify VITE_API_BASE_URL points to Railway backend
- Clear browser cache and hard refresh

### Audio not playing
- Check browser console for errors
- Verify API responses in Network tab
- Ensure OpenAI API key has credits

## Custom Domain (Optional)

### Add custom domain to Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your domain
4. Follow DNS configuration instructions

### Update Railway CORS:
1. Update `CORS_ORIGIN` to include your custom domain
2. Example: `https://yourdomain.com,https://your-app.vercel.app`

## Monitoring

- **Vercel**: Built-in analytics and error tracking
- **Railway**: Built-in metrics and logs
- **OpenAI**: Monitor API usage in OpenAI dashboard

## Scaling

- **Vercel**: Auto-scales, no configuration needed
- **Railway**: Scales based on usage, upgrade plan if needed
- **OpenAI**: Monitor rate limits, upgrade tier if needed

## Cost Estimates

- **Vercel**: Free tier (10K requests/month)
- **Railway**: $5/month (500 hours) + usage
- **OpenAI**: ~$0.006 per interview (TTS costs)

## Support

For issues:
1. Check logs in Railway and Vercel
2. Review OpenAI API status
3. Test locally first to isolate production issues

