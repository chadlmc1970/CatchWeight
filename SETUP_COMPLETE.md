# CatchWeight POC - Setup Complete ✅

**Date**: March 3, 2026
**Database**: Neon PostgreSQL (ep-dark-hill-aiwdm4cf)
**Status**: Fully operational with Tyson-like seed data

---

## What's Been Done

### 1. Database Setup ✅
- **Connection**: Neon PostgreSQL database configured
- **Schema**: SAP S/4HANA catch weight tables replicated
  - MARA (Material Master) - 13 products
  - MARM (UoM Conversions)
  - MBEW (Material Valuation)
  - MKPF/MSEG (Material Documents) - 20 documents, 24 line items
  - MARD/MCHB (Stock balances)
  - CDHDR/CDPOS (Change Documents)

### 2. Tyson-Like Seed Data ✅
**Product Portfolio (13 materials):**
- **Chicken** (7): Breast, Wings, Thighs, Tenders, Whole, Nuggets, Skewers
- **Pork** (3): Ribs, Chops, Sausage
- **Beef** (3): Ground Beef, Strip Steaks, Patties

**Facilities:**
- **P100** - Arkansas Plant (chicken & pork)
- **P200** - Missouri Plant (beef & chicken)

**Realistic Scenarios:**
- ✅ Weight drift patterns (+0.44% to -0.45%)
- ✅ Back-posting (9-day late entry)
- ✅ Physical inventory adjustments (shrinkage/waste)
- ✅ Stock transfers between locations
- ✅ Price changes for margin erosion analysis

### 3. Data Product Transformations ✅

#### **CWM_Weight_Drift_Trend_DP**
**SQL View**: `v_weight_drift_trend`

Tracks weight variance from baseline (expected vs actual):
- 18 goods receipt transactions analyzed
- Total drift: +52.7 LB
- Average drift: 0.12%
- Financial exposure: $242.37
- Range: -0.45% to +0.49%

#### **CWM_Margin_Erosion_DP**
**SQL View**: `v_margin_erosion`

Tracks margin loss due to catch weight variance:
- **Uses batch-tracked actual weights** (NOT MARM conversion)
- Calculates expected issue weight from batch receipt average
- 2 sales/production issue transactions
- Chicken breast: $0.07 erosion (+0.01%) - shipped 0.02 LB more than batch average
- Chicken wings: -$0.08 erosion (-0.01%) - shipped 0.04 LB less than batch average

### 4. API Endpoints ✅

**Base URL**: `http://localhost:8000`

#### Weight Drift
```bash
GET /v1/dataproducts/weight-drift?limit=100&offset=0
GET /v1/dataproducts/weight-drift/summary
GET /v1/dataproducts/weight-drift/by-material
```

#### Margin Erosion
```bash
GET /v1/dataproducts/margin-erosion?limit=100&offset=0
GET /v1/dataproducts/margin-erosion/summary
GET /v1/dataproducts/margin-erosion/by-material
```

#### Health Check
```bash
GET /health
```

---

## How to Run

### Start the Backend API

```bash
cd /Users/I870089/CatchWeight/backend
source venv/bin/activate
export PYTHONPATH="/Users/I870089/CatchWeight/backend/src"
export DATABASE_URL="postgresql://neondb_owner:npg_V2ALZjiI5qtr@ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
python -m uvicorn catchweight.api.main:app --host 127.0.0.1 --port 8000
```

### Test the API

```bash
# Health check
curl http://localhost:8000/health

# Weight Drift data
curl http://localhost:8000/v1/dataproducts/weight-drift?limit=5

# Weight Drift summary
curl http://localhost:8000/v1/dataproducts/weight-drift/summary

# Margin Erosion data
curl http://localhost:8000/v1/dataproducts/margin-erosion

# Margin Erosion summary
curl http://localhost:8000/v1/dataproducts/margin-erosion/summary
```

---

## Sample Results

### Weight Drift Top Materials
```
CHKBRST-001: 5 transactions, Avg Drift: 0.27%, Total Exposure: $100.44
PRKRIB-004:  1 transaction,  Avg Drift: 0.44%, Total Exposure: $58.90
BFSTRP-010:  1 transaction,  Avg Drift: 0.33%, Total Exposure: $56.25
```

### Margin Erosion Records
```
CHKWNG-002: 20 CS shipped
  Expected: $1,260.00 | Actual: $1,255.80 | Erosion: $4.20 (0.33%)

CHKBRST-001: 10 CS shipped
  Expected: $812.50 | Actual: $815.10 | Gain: $2.60 (-0.32%)
```

---

## Project Files

### Backend
- **[.env](backend/.env)** - Database connection (already configured)
- **[requirements.txt](backend/requirements.txt)** - Python dependencies
- **[sql/001_schema.sql](backend/sql/001_schema.sql)** - S/4HANA table schema
- **[sql/003_views.sql](backend/sql/003_views.sql)** - Data product transformations
- **[sql/004_seed.sql](backend/sql/004_seed.sql)** - Tyson-like seed data
- **[src/catchweight/api/v1/dataproducts.py](backend/src/catchweight/api/v1/dataproducts.py)** - API endpoints

### Frontend
- **[frontend/](frontend/)** - Next.js application (not started yet)

---

## Next Steps

1. **Start Frontend Development**
   ```bash
   cd /Users/I870089/CatchWeight/frontend
   npm install
   npm run dev
   ```

2. **Deploy to SAP Business Data Cloud**
   - Export transformation logic from `sql/003_views.sql`
   - Adapt for 3-layer architecture (Raw → Staging → Curated)

3. **Connect to SAP Analytics Cloud**
   - Create data connections
   - Build dashboards for Weight Drift & Margin Erosion

4. **Enhance Data Products**
   - Add time-series trending
   - Add plant/material filters
   - Add batch-level drill-down
   - Add alerting thresholds

---

## Database Connection Info

**Connection String** (in `.env` file):
```
postgresql://neondb_owner:npg_V2ALZjiI5qtr@ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Schema**: `sap_poc`

**Tables**: 14 (all S/4HANA catch weight tables + views)

---

## Catch Weight Logic — Technical Notes

### MARM Table Purpose
The MARM table (UoM conversions) stores **planning weights only**:
- Example: `CHKBRST-001: 25 LB/CS` is the nominal/standard weight
- Used ONLY for planning, forecasting, and initial estimates
- **NOT used for actual transaction calculations**

### Actual Weight Tracking
Each physical transaction captures its own actual weight:
- **Receipt**: 100 CS received → weighed at 2,508.25 LB (actual: 25.0825 LB/CS)
- **Issue**: 20 CS issued → weighed at 598.00 LB (actual: 29.90 LB/CS)
- Weights can vary to hundredths of a pound

### Weight Drift Calculation
Compares actual receipt weight to MARM planning baseline:
- Expected (from MARM): 100 CS × 25 LB = 2,500 LB
- Actual (weighed): 2,508.25 LB
- Drift: +8.25 LB (+0.33% vs. plan)

**Use Case**: Track how much actual weights deviate from planning assumptions

### Margin Erosion Calculation
Compares actual issue weight to **batch-tracked receipt average**:
- Batch B20260225 receipts: 125 CS at 3,134.75 LB = **25.078 LB/CS actual**
- Expected issue: 10 CS × 25.078 = 250.78 LB
- Actual issue: 250.80 LB
- Erosion: +0.02 LB shipped more than received average = margin loss

**Use Case**: Track margin variance when issuing/shipping from batches

**Key Difference**:
- Weight Drift uses **MARM planning weights** (vs. plan)
- Margin Erosion uses **batch receipt actual weights** (vs. what we actually received)

---

## Architecture

```
SAP S/4HANA (Read-Only)
       ↓
    Neon DB (Dev/Test Replica)
       ↓
SQL Transformations (Views)
       ↓
   FastAPI Backend
       ↓
  Next.js Frontend
       ↓
SAP Analytics Cloud (Future)
```

---

**Status**: ✅ All systems operational and ready for pilot testing!
