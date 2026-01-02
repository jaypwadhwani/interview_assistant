# Testing Guide

## Pre-Deployment Testing (Local)

### Test Backend Locally

```bash
cd server
node index.js
```

**Check these logs:**
- ✅ "Starting server..."
- ✅ "OpenAI client initialized"
- ✅ "Server listening on port 3001"

**Test the health endpoint:**
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","openai":"ready"}
```

**Test interview start:**
```bash
curl -X POST http://localhost:3001/api/start-interview \
  -H "Content-Type: application/json" \
  -d '{"jobDetails":{"jobTitle":"Software Engineer","jobDescription":"","notes":""}}'
```

Expected: JSON response with `questionText` and `questionAudioDataUrl`

---

### Test Frontend Locally

```bash
# From project root
npm run dev
```

**Manual Testing Checklist:**
1. ✅ Page loads at http://localhost:5173
2. ✅ Enter job details form appears
3. ✅ Can enter job title, description, notes
4. ✅ Click "Start Practice Interview" button
5. ✅ Interview session loads
6. ✅ Click microphone button
7. ✅ Audio plays (OpenAI voice)
8. ✅ Can speak and see transcript
9. ✅ Say "thank you" to submit answer
10. ✅ Feedback appears with score
11. ✅ Next question plays
12. ✅ Pause button works
13. ✅ End session works

**Check Browser Console:**
- Should see `[AudioManager] Created instance: ...`
- Should NOT see any errors
- Should see API calls to `/api/start-interview` and `/api/interview`

---

## Post-Deployment Testing

### Test Railway Backend (After Deploy)

**1. Check Railway Logs:**
- Go to Railway → Your service → Deployments → View logs
- Look for: "OpenAI client initialized", "Server listening"

**2. Test Health Endpoint:**
```bash
curl https://YOUR-RAILWAY-URL.railway.app/api/health
```

**3. Test Interview Endpoint:**
```bash
curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/start-interview \
  -H "Content-Type: application/json" \
  -d '{"jobDetails":{"jobTitle":"Software Engineer"}}'
```

**Common Issues:**
- ❌ `OpenAI client not initialized` → Check OPENAI_API_KEY in Railway
- ❌ `500 error` → Check Railway logs for details
- ❌ `CORS error` → Update CORS_ORIGIN variable

---

### Test Vercel Frontend (After Deploy)

**1. Visit Your Vercel URL**
```
https://your-app.vercel.app
```

**2. Open Browser DevTools (F12)**
- Go to Console tab
- Go to Network tab

**3. Complete Full Interview Flow:**
1. Enter job details
2. Start interview
3. Listen for audio
4. Speak an answer
5. Say "thank you"
6. Get feedback
7. Continue or end

**4. Check Network Tab:**
- Look for calls to `/api/start-interview`
- Should go to your Railway URL
- Should return 200 status
- Check response has `questionText` and audio

**Common Issues:**
- ❌ No audio plays → Check OPENAI_API_KEY
- ❌ API calls fail → Check VITE_API_BASE_URL is set
- ❌ CORS error → Update CORS_ORIGIN in Railway
- ❌ White screen → Check Vercel build logs

---

## End-to-End Testing Checklist

### Happy Path
- [ ] 1. Load site → See job details form
- [ ] 2. Enter "Software Engineer" as job title
- [ ] 3. Add job description (optional)
- [ ] 4. Add notes (optional)
- [ ] 5. Click "Start Practice Interview"
- [ ] 6. See interview interface with microphone
- [ ] 7. Click microphone button
- [ ] 8. Hear AI voice asking question
- [ ] 9. Speak your answer (30+ seconds)
- [ ] 10. Say "thank you" clearly
- [ ] 11. Hear feedback with score
- [ ] 12. Say "yes" when asked if ready for next question
- [ ] 13. Hear next question
- [ ] 14. Click "End Session"
- [ ] 15. Audio stops immediately
- [ ] 16. Return to job details form

### Edge Cases
- [ ] Rapid clicking microphone button (should not duplicate audio)
- [ ] Pause during question (audio stops)
- [ ] Resume (audio continues where left off)
- [ ] Skip question (moves to next)
- [ ] Say "no" when asked if ready (offers to end)
- [ ] Timeout (15 seconds of silence ends session)
- [ ] Refresh page mid-interview (should recover)

### Error Scenarios
- [ ] Invalid OpenAI API key (shows error)
- [ ] Network disconnect (shows error, can retry)
- [ ] Microphone blocked (shows permission error)
- [ ] No audio output device (shows error)

---

## Performance Testing

### Audio Latency
- Time from clicking button to hearing voice: < 3 seconds
- Time from saying "thank you" to hearing feedback: < 5 seconds

### API Response Times
```bash
# Test API latency
time curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/start-interview \
  -H "Content-Type: application/json" \
  -d '{"jobDetails":{"jobTitle":"Test"}}'
```

Should be < 2 seconds

---

## Monitoring After Launch

### Check Railway Logs
```bash
# Railway CLI (if installed)
railway logs
```

Or via web dashboard: Railway → Service → View Logs

**Look for:**
- API request logs
- Error messages
- OpenAI API calls
- Response times

### Check Vercel Analytics
- Go to Vercel dashboard → Your project → Analytics
- Monitor:
  - Page views
  - API calls
  - Error rates
  - Response times

### Monitor OpenAI Usage
- Go to platform.openai.com → Usage
- Check:
  - API calls per day
  - Cost per day
  - Rate limit usage

---

## Debugging Tools

### Browser DevTools
```javascript
// Check API base URL
console.log(import.meta.env.VITE_API_BASE_URL)

// Check if AudioManager is created
console.log(window.__globalAudioManager)

// Check localStorage
console.log(localStorage.getItem('currentSession'))
```

### Test Audio Directly
```bash
# Download and play test audio
curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test"}' \
  -o test-audio.json

# Extract audioDataUrl and open in browser
```

---

## Load Testing (Optional)

### Simple Load Test
```bash
# Install Apache Bench
brew install httpd  # Mac
# or sudo apt install apache2-utils  # Linux

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 -p payload.json -T application/json \
  https://YOUR-RAILWAY-URL.railway.app/api/health
```

### Expected Performance
- Railway free tier: ~500 requests/minute
- OpenAI API: 500 requests/minute (tier 1)
- Vercel: Auto-scales to demand

---

## Rollback Plan

If deployment fails:

### Rollback Railway
1. Go to Railway → Deployments
2. Find previous working deployment
3. Click "Redeploy"

### Rollback Vercel
1. Go to Vercel → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Emergency: Disable Site
```bash
# Update Vercel environment variable
VITE_API_BASE_URL=http://localhost:3001
```

This will break the site for users (shows in Vercel dashboard)

---

## Success Criteria

✅ Backend health check returns 200
✅ Frontend loads without errors
✅ Can complete full interview flow
✅ Audio plays without duplicates
✅ Feedback is accurate and relevant
✅ Session persists across page refresh
✅ No console errors
✅ API response times < 5 seconds
✅ No CORS errors
✅ Microphone permissions work
✅ Voice commands work reliably

All green? You're ready for production! 🚀

