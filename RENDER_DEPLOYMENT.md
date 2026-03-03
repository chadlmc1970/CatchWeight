# Render Deployment - Quick Reference

## Repository
**GitHub URL**: `https://github.com/chadlmc1970/CatchWeight`

---

## Backend API Deployment

### Service Settings
- **Type**: Web Service
- **Name**: `catchweight-api`
- **Repository**: `chadlmc1970/CatchWeight`
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Python 3

### Build & Start
- **Build Command**:
  ```
  pip install -r requirements.txt
  ```

- **Start Command**:
  ```
  cd src && uvicorn catchweight.api.main:app --host 0.0.0.0 --port $PORT
  ```

### Environment Variables
| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_V2ALZjiI5qtr@ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

### After Deploy
✅ Copy your backend URL (e.g., `https://catchweight-api.onrender.com`)

---

## Frontend Dashboard Deployment

### Service Settings
- **Type**: Static Site
- **Name**: `catchweight-dashboard`
- **Repository**: `chadlmc1970/CatchWeight`
- **Branch**: `main`
- **Root Directory**: `frontend`

### Build Settings
- **Build Command**:
  ```
  npm install && npm run build
  ```

- **Publish Directory**:
  ```
  .next
  ```

### Environment Variables
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `[YOUR_BACKEND_URL_FROM_STEP_1]` |

**Example**: `https://catchweight-api.onrender.com`

---

## Deployment Steps

1. ✅ **Backend First** - Deploy and get the URL
2. ✅ **Frontend Second** - Use backend URL in environment variable
3. ✅ **Test** - Visit `/health` endpoint on backend
4. ✅ **Test** - Visit frontend URL and check Analytics page

---

## Testing URLs (after deployment)

- **Backend Health**: `https://catchweight-api.onrender.com/health`
- **Frontend Home**: `https://catchweight-dashboard.onrender.com`
- **Analytics Dashboard**: `https://catchweight-dashboard.onrender.com/analytics`

---

## Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Verify DATABASE_URL is set correctly
- Test `/health` endpoint

**Frontend shows "Failed to fetch"?**
- Check NEXT_PUBLIC_API_URL environment variable
- Verify backend is running and healthy
- Check browser console for CORS errors

**Free tier notes:**
- Backend sleeps after 15 min inactivity
- First request after sleep takes ~30 seconds
- Upgrade to $7/month to keep it always on
