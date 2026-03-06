# Deploying Admin & Forecasting Features to Render

## Quick Deployment Steps

### 1. Run Database Migrations on Render
Since the database is on Neon and accessible via the DATABASE_URL in render.yaml, you can run migrations directly:

```bash
# Export the DATABASE_URL from your environment variables
# Get this from your Render dashboard or Neon console
export DATABASE_URL="<your-database-url-here>"

# Run migrations locally against production database
cd /Users/I870089/CatchWeight
./run_migrations.sh
```

**⚠️ Important**: This runs migrations against your production Neon database. Make sure you're comfortable with this.

### 2. Commit and Push New Code

```bash
cd /Users/I870089/CatchWeight

# Add all new files
git add backend/sql/007_admin_audit.sql
git add backend/sql/008_forecasting_views.sql
git add backend/src/catchweight/api/v1/admin.py
git add backend/src/catchweight/api/v1/forecasting.py
git add backend/src/catchweight/api/main.py
git add frontend/app/admin/
git add frontend/app/forecasting/
git add frontend/components/Nav.tsx
git add run_migrations.sh
git add IMPLEMENTATION_COMPLETE.md

# Commit changes
git commit -m "Add admin page with data reset and forecasting dashboard

Features:
- Admin page with 90-day data reset functionality
- Multi-step confirmation and audit logging
- Supplier performance scoring with reliability metrics
- Inventory reorder alerts based on consumption patterns
- Margin erosion 30-day forecasting
- 4 new database views and admin_audit_log table
- 8 new API endpoints for admin and forecasting

Closes #<issue-number>"

# Push to main branch
git push origin main
```

### 3. Render Will Auto-Deploy
Once you push to the `main` branch, Render will automatically:
- Detect changes in `backend/` and `frontend/` directories
- Rebuild both services (catchweight-api and catchweight-dashboard)
- Deploy the new versions

Monitor deployment at:
- Backend: https://dashboard.render.com/web/catchweight-api
- Frontend: https://dashboard.render.com/web/catchweight-dashboard

### 4. Verify Deployment

**Backend API:**
```bash
# Check health
curl https://catchweight-api.onrender.com/health

# Test admin endpoints
curl https://catchweight-api.onrender.com/v1/admin/status
curl https://catchweight-api.onrender.com/v1/admin/audit-log

# Test forecasting endpoints
curl https://catchweight-api.onrender.com/v1/forecasting/supplier-performance
curl https://catchweight-api.onrender.com/v1/forecasting/summary
```

**Frontend Dashboard:**
- Admin Page: https://catchweight-dashboard.onrender.com/admin
- Forecasting: https://catchweight-dashboard.onrender.com/forecasting

---

## Alternative: Add Migrations to Build Command

If you prefer migrations to run automatically on deployment, update `render.yaml`:

```yaml
services:
  - type: web
    name: catchweight-api
    runtime: python
    region: oregon
    repo: https://github.com/chadlmc1970/CatchWeight
    branch: main
    rootDir: backend
    buildCommand: |
      pip install -r requirements.txt
      cd .. && psql $DATABASE_URL -f backend/sql/007_admin_audit.sql
      cd .. && psql $DATABASE_URL -f backend/sql/008_forecasting_views.sql
    startCommand: cd src && uvicorn catchweight.api.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: neondb
          property: connectionString
      - key: PYTHON_VERSION
        value: "3.11.0"
```

This will run migrations automatically on every deploy (idempotent since we use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE VIEW`).

---

## Deployment Checklist

- [ ] Run migrations against Neon database
- [ ] Verify migrations succeeded (check admin_audit_log table exists)
- [ ] Add and commit all new files
- [ ] Push to main branch
- [ ] Monitor Render deployment logs
- [ ] Test backend health endpoint
- [ ] Test admin API endpoints
- [ ] Test forecasting API endpoints
- [ ] Navigate to frontend /admin page
- [ ] Navigate to frontend /forecasting page
- [ ] Perform test data reset
- [ ] Verify forecasting charts load correctly

---

## Rollback Plan

If something goes wrong:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Revert database migrations:**
   ```sql
   -- Connect to Neon database
   DROP TABLE IF EXISTS admin_audit_log CASCADE;
   DROP VIEW IF EXISTS v_forecasting_summary CASCADE;
   DROP VIEW IF EXISTS v_margin_erosion_daily CASCADE;
   DROP VIEW IF EXISTS v_reorder_recommendations CASCADE;
   DROP VIEW IF EXISTS v_supplier_performance_profile CASCADE;
   ```

---

## Production URLs

- **Backend API**: https://catchweight-api.onrender.com
- **Frontend Dashboard**: https://catchweight-dashboard.onrender.com
- **Neon Database**: ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech

Ready to deploy! 🚀
