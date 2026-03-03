# SAC-Style Analytics Dashboard for Catch Weight Data Products

## Overview

This analytics dashboard mimics SAP Analytics Cloud (SAC) design and showcases the two primary data products from the catch weight proof of concept:

1. **Weight Drift Trend (DP1)** - Tracks weight variance from baseline
2. **Margin Erosion Analysis (DP2)** - Analyzes margin loss due to catch weight variance

## Features

### Data Product 1: Weight Drift Trend
- **KPI Cards**:
  - Total transactions
  - Average drift percentage
  - Total drift (in pounds)
  - Financial exposure (USD)
- **Visualizations**:
  - Recent weight drift transactions with color-coded trends
  - Top materials by financial exposure with bar charts
  - Drift percentage indicators

### Data Product 2: Margin Erosion Analysis
- **KPI Cards**:
  - Total transactions
  - Total margin erosion (USD)
  - Expected margin
  - Average erosion percentage
- **Visualizations**:
  - Ranked list of top materials by margin erosion
  - Progress bars showing relative erosion
  - Transaction counts per material

## Backend API Endpoints

The following REST API endpoints have been created:

### Weight Drift Endpoints
- `GET /v1/dataproducts/weight-drift` - Get detailed weight drift records
- `GET /v1/dataproducts/weight-drift/summary` - Get summary statistics
- `GET /v1/dataproducts/weight-drift/by-material` - Get drift aggregated by material

### Margin Erosion Endpoints
- `GET /v1/dataproducts/margin-erosion` - Get detailed margin erosion records
- `GET /v1/dataproducts/margin-erosion/summary` - Get summary statistics
- `GET /v1/dataproducts/margin-erosion/by-material` - Get erosion aggregated by material

## How to Run

### Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn catchweight.api.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access the Dashboard
1. Navigate to http://localhost:3000
2. Click on "📊 Analytics" in the navigation bar
3. The dashboard will load data from both data products

## SAC Design Elements

The dashboard incorporates key SAC design principles:

- **Clean, modern interface** with subtle shadows and borders
- **Card-based layout** for KPIs and metrics
- **Blue and pink color scheme** matching SAP design guidelines
- **Data density** without overwhelming the user
- **Responsive grid layout** that adapts to screen sizes
- **Progress bars and visual indicators** for quick data comprehension
- **Hover effects** for interactivity
- **Status badges** to identify data products

## Data Sources

All data is pulled from the PostgreSQL views defined in `backend/sql/003_views.sql`:
- `v_weight_drift_trend` - Core view for Data Product 1
- `v_margin_erosion` - Core view for Data Product 2

## Customization

You can customize the dashboard by:
- Adjusting the number of records shown (modify `limit` parameter in API calls)
- Adding date range filters
- Implementing drill-down functionality
- Adding export functionality to the Export button
- Connecting the Refresh button to reload data

## Technical Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, Pydantic
- **Database**: PostgreSQL with SAP S/4HANA schema simulation
