# Railway Deployment Guide

## 🚀 How to Deploy on Railway

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Code review bot backend"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Select your repository
5. Choose the `backend` directory as root

### Step 3: Set Environment Variables
In Railway Dashboard → Project Settings → Variables:

```
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://hghtredevzkmfxbuopiq.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
FRONTEND_URL=https://your-frontend-domain.vercel.app
PORT=$PORT
```

### Step 4: Configure Port
Railway automatically sets PORT environment variable. Procfile handles this:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Step 5: Check Logs
In Railway Dashboard → Deployments → View Logs

You should see:
```
==================================================
🚀 Code Review Bot Backend Starting
==================================================
✅ Groq client: initialized
✅ Supabase client: initialized
📍 Port: 8000
🌐 Frontend URL: https://your-frontend.vercel.app
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## ❌ Common Deployment Issues & Fixes

### Issue 1: "GROQ_API_KEY not configured"
```
Error: Groq API not configured. Set GROQ_API_KEY environment variable.
```
**Solution:**
1. Go to Railway Dashboard
2. Project Settings → Variables
3. Add: `GROQ_API_KEY=your_key_here`
4. Redeploy

### Issue 2: "Module not found"
```
Error: ModuleNotFoundError: No module named 'groq'
```
**Solution:** Ensure `requirements.txt` has all packages:
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements"
git push
```

### Issue 3: "Cannot find PORT"
```
Error: Address already in use
```
**Solution:** The code now reads from Railway's PORT env var automatically.
Make sure Procfile contains:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Issue 4: "Connection Timeout"
```
Error: Backend se connect nahi ho pa raha
```
**Solution:**
1. Check FRONTEND_URL is set correctly in Railway
2. Update frontend .env.local with correct Railway URL
3. Check CORS is enabled (it is by default)

---

## 🔍 Debugging on Railway

### Check Configuration
Visit: `https://your-app.railway.app/config`

Response:
```json
{
  "groq_api_key_set": true,
  "supabase_url_set": true,
  "supabase_key_set": true,
  "frontend_url": "https://your-frontend.vercel.app",
  "port": "8000",
  "python_version": "3.12.x"
}
```

### Check Health
Visit: `https://your-app.railway.app/health`

Response:
```json
{
  "status": "ok",
  "service": "code-review-bot",
  "groq_configured": true,
  "supabase_configured": true
}
```

### View Logs in Railway
1. Dashboard → Deployments
2. Click on latest deployment
3. View Logs tab shows real-time logs
4. Search for errors/warnings

---

## 📋 Pre-Deployment Checklist

- [ ] All dependencies in `requirements.txt`
- [ ] `.env` file NOT committed (in .gitignore)
- [ ] `Procfile` configured correctly
- [ ] `runtime.txt` specifies Python version
- [ ] Code has no hardcoded API keys
- [ ] Error handling in place (startup won't crash)
- [ ] Logging configured for debugging
- [ ] Environment variable names correct

---

## 🚀 Deploy from GitHub

### Auto-Deploy Setup
1. Go to Railway Project Settings
2. Enable "Deploy on Push"
3. Select branch (main)
4. Each push automatically deploys

### Manual Deploy
1. Push to GitHub: `git push origin main`
2. Railway auto-detects and deploys
3. Or click "Deploy" in Railway dashboard

---

## 🌐 Update Frontend for Production

In `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

Or set during build in Vercel:
```
Environment Variables → NEXT_PUBLIC_BACKEND_URL
```

---

## 🔐 Environment Variables Required

| Variable | Required | Purpose |
|----------|----------|---------|
| GROQ_API_KEY | ✅ Yes | Code review AI |
| SUPABASE_URL | ❌ No | Database (optional) |
| SUPABASE_SERVICE_KEY | ❌ No | Database (optional) |
| RAZORPAY_KEY_ID | ❌ No | Payments (optional) |
| RAZORPAY_KEY_SECRET | ❌ No | Payments (optional) |
| FRONTEND_URL | ❌ No | CORS (optional) |
| PORT | ✅ Auto | Railway sets this |

---

## 📊 Monitoring

### Check Status
```bash
curl https://your-app.railway.app/
# Response: {"status": "Backend chal raha hai! 🚀"}
```

### Get Health
```bash
curl https://your-app.railway.app/health
# Response: {"status": "ok", "service": "code-review-bot", ...}
```

### Debug Config
```bash
curl https://your-app.railway.app/config
# Shows which env vars are set
```

---

## ✅ Deployment Successful!

Once deployed, you should see:
- ✅ Backend running on Railway URL
- ✅ Health check responding
- ✅ Config showing all variables set
- ✅ Frontend connecting successfully
- ✅ Code reviews working

**Troubleshoot:** Check Railway logs if something fails

---

## 🎯 Next Steps

1. Test backend: `curl https://your-backend.railway.app/health`
2. Update frontend URL in .env
3. Deploy frontend to Vercel
4. Test full integration
5. Share your code review bot! 🎉
