# Deploy CatchWeight POC to Render

## Prerequisites
- Render account at https://render.com
- GitHub repository pushed with latest changes
- Neon PostgreSQL database URL

## Step 1: Deploy Backend API

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the backend service**:
   - **Name**: `catchweight-api`
   - **Region**: Oregon (or closest to you)
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd src && uvicorn catchweight.api.main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variable**:
   - Click "Environment" tab
   - Add: `DATABASE_URL` = `postgresql://neondb_owner:npg_V2ALZjiI5qtr@ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

6. **Deploy** - Wait 2-3 minutes for build

7. **Copy your backend URL** - Will be something like:
   `https://catchweight-api.onrender.com`

8. **Test it** - Visit:
   `https://catchweight-api.onrender.com/health`

## Step 2: Deploy Frontend Dashboard

1. **Back in Render Dashboard** → **"New +"** → **"Static Site"**
2. **Connect same GitHub repository**
3. **Configure the frontend service**:
   - **Name**: `catchweight-dashboard`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`

4. **Add Environment Variable**:
   - Click "Environment" tab
   - Add: `NEXT_PUBLIC_API_URL` = `https://catchweight-api.onrender.com` (your backend URL from Step 1)

5. **Deploy** - Wait 2-3 minutes for build

6. **Get your frontend URL** - Will be something like:
   `https://catchweight-dashboard.onrender.com`

## Step 3: Update Backend CORS (If Needed)

If your frontend URL is different from the wildcards we added, update [backend/src/catchweight/api/main.py](backend/src/catchweight/api/main.py) line 30-37 to include your specific domain.

## Step 4: Test the Deployment

Visit your frontend URL and verify:
- ✅ Overview page loads
- ✅ Analytics dashboard shows data
- ✅ All KPI cards display correctly
- ✅ Charts render with data

## URLs for Your Email

Replace the localhost URLs in your internal team email with:
- **Overview**: `https://catchweight-dashboard.onrender.com`
- **Analytics**: `https://catchweight-dashboard.onrender.com/analytics`
- **API Health**: `https://catchweight-api.onrender.com/health`

## Troubleshooting

**Backend Issues:**
- Check logs in Render dashboard → Backend service → "Logs" tab
- Verify DATABASE_URL environment variable is set
- Test `/health` endpoint

**Frontend Issues:**
- Check logs in Render dashboard → Frontend service → "Logs" tab
- Verify NEXT_PUBLIC_API_URL points to your backend
- Check browser console for API errors

**Free Tier Notes:**
- Backend may sleep after 15 minutes of inactivity (first request takes ~30 seconds to wake up)
- Keep it awake by upgrading to paid tier ($7/month) or use a service like UptimeRobot to ping it every 14 minutes
