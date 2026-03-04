# SAP Business Data Cloud Migration Plan
## Catch Weight Analytics - Technical Implementation Guide

---

**Document Version:** 1.0
**Date:** March 3, 2026
**Type:** Technical Implementation Plan
**Audience:** Technical Team, Solution Architects

---

## 1. SQL Conversion Guide: PostgreSQL → HANA SQL

### 1.1 Compatibility Matrix

| Feature | PostgreSQL | HANA SQL | Conversion Required |
|---------|-----------|----------|-------------------|
| SELECT/FROM/WHERE | Standard | Standard | ✅ No change |
| JOINs (INNER/LEFT/RIGHT) | Standard | Standard | ✅ No change |
| Aggregations (SUM/AVG/COUNT) | Standard | Standard | ✅ No change |
| GROUP BY / HAVING | Standard | Standard | ✅ No change |
| CTEs (WITH clause) | Supported | Supported | ✅ No change |
| Window Functions | Supported | Supported | ✅ No change |
| LIMIT n | Supported | TOP n or LIMIT n | ⚠️ Minor change |
| NULLIF | Supported | Supported | ✅ No change |
| CASE statements | Standard | Standard | ✅ No change |
| Date functions | PostgreSQL-specific | HANA-specific | ⚠️ Conversion needed |
| String functions | Some differences | HANA functions | ⚠️ Check functions |

### 1.2 View Conversion Examples

#### View 1: v_inventory_rebuild (No changes required)

**PostgreSQL Version:**
```sql
CREATE OR REPLACE VIEW sap_poc.v_inventory_rebuild AS
SELECT
    material_id,
    plant_id,
    storage_location,
    batch_id,
    SUM(CASE WHEN quantity_base_uom > 0 THEN quantity_base_uom ELSE 0 END) as total_receipts_base,
    SUM(CASE WHEN quantity_base_uom < 0 THEN ABS(quantity_base_uom) ELSE 0 END) as total_issues_base,
    SUM(quantity_base_uom) as stock_base_uom,
    SUM(quantity_parallel_uom) as stock_parallel_uom
FROM mseg
GROUP BY material_id, plant_id, storage_location, batch_id
HAVING SUM(quantity_base_uom) != 0;
```

**HANA SQL Version (Identical):**
```sql
CREATE VIEW "SAP_POC"."v_inventory_rebuild" AS
SELECT
    "material_id",
    "plant_id",
    "storage_location",
    "batch_id",
    SUM(CASE WHEN "quantity_base_uom" > 0 THEN "quantity_base_uom" ELSE 0 END) as "total_receipts_base",
    SUM(CASE WHEN "quantity_base_uom" < 0 THEN ABS("quantity_base_uom") ELSE 0 END) as "total_issues_base",
    SUM("quantity_base_uom") as "stock_base_uom",
    SUM("quantity_parallel_uom") as "stock_parallel_uom"
FROM "mseg"
GROUP BY "material_id", "plant_id", "storage_location", "batch_id"
HAVING SUM("quantity_base_uom") != 0;
```

**Changes:**
- ✅ No logic changes
- ⚠️ Add quotes around column names (BDC best practice for case sensitivity)
- ⚠️ Schema name format: `"SPACE_NAME"."VIEW_NAME"`

---

#### View 2: v_weight_drift_trend (Minor changes)

**PostgreSQL Version:**
```sql
CREATE OR REPLACE VIEW sap_poc.v_weight_drift_trend AS
SELECT
    seg.material_id,
    seg.plant_id,
    seg.storage_location,
    seg.batch_id,
    hdr.posting_date,
    seg.quantity_base_uom AS qty_cases,

    -- Expected weight from MARM conversion
    seg.quantity_base_uom * (marm.numerator / marm.denominator) AS expected_weight_lb,

    -- Actual weight from scale
    ABS(seg.quantity_parallel_uom) AS actual_weight_lb,

    -- Drift calculation
    (ABS(seg.quantity_parallel_uom) -
     seg.quantity_base_uom * (marm.numerator / marm.denominator)) AS drift_lb,

    -- Drift percentage
    ((ABS(seg.quantity_parallel_uom) -
      seg.quantity_base_uom * (marm.numerator / marm.denominator)) /
     NULLIF(seg.quantity_base_uom * (marm.numerator / marm.denominator), 0) * 100) AS drift_pct,

    -- Financial exposure
    ((ABS(seg.quantity_parallel_uom) -
      seg.quantity_base_uom * (marm.numerator / marm.denominator)) *
     val.price_per_unit) AS financial_exposure_usd,

    hdr.user_id
FROM mseg seg
JOIN mkpf hdr ON seg.document_number = hdr.document_number
              AND seg.document_year = hdr.document_year
JOIN mara mat ON seg.material_id = mat.material_id
JOIN marm ON seg.material_id = marm.material_id
          AND mat.base_uom = marm.alt_uom
JOIN mbew val ON seg.material_id = val.material_id
              AND seg.plant_id = val.plant_id
WHERE seg.movement_type = '101'  -- Goods receipts only
  AND mat.catch_weight_flag = TRUE;
```

**HANA SQL Version:**
```sql
CREATE VIEW "SAP_POC"."v_weight_drift_trend" AS
SELECT
    seg."material_id",
    seg."plant_id",
    seg."storage_location",
    seg."batch_id",
    hdr."posting_date",
    seg."quantity_base_uom" AS "qty_cases",

    -- Expected weight from MARM conversion
    seg."quantity_base_uom" * (marm."numerator" / marm."denominator") AS "expected_weight_lb",

    -- Actual weight from scale
    ABS(seg."quantity_parallel_uom") AS "actual_weight_lb",

    -- Drift calculation
    (ABS(seg."quantity_parallel_uom") -
     seg."quantity_base_uom" * (marm."numerator" / marm."denominator")) AS "drift_lb",

    -- Drift percentage
    ((ABS(seg."quantity_parallel_uom") -
      seg."quantity_base_uom" * (marm."numerator" / marm."denominator")) /
     NULLIF(seg."quantity_base_uom" * (marm."numerator" / marm."denominator"), 0) * 100) AS "drift_pct",

    -- Financial exposure
    ((ABS(seg."quantity_parallel_uom") -
      seg."quantity_base_uom" * (marm."numerator" / marm."denominator")) *
     val."price_per_unit") AS "financial_exposure_usd",

    hdr."user_id"
FROM "mseg" seg
INNER JOIN "mkpf" hdr
    ON seg."document_number" = hdr."document_number"
    AND seg."document_year" = hdr."document_year"
INNER JOIN "mara" mat
    ON seg."material_id" = mat."material_id"
INNER JOIN "marm"
    ON seg."material_id" = marm."material_id"
    AND mat."base_uom" = marm."alt_uom"
INNER JOIN "mbew" val
    ON seg."material_id" = val."material_id"
    AND seg."plant_id" = val."plant_id"
WHERE seg."movement_type" = '101'  -- Goods receipts only
  AND mat."catch_weight_flag" = TRUE;
```

**Changes:**
- ✅ Logic identical
- ⚠️ Added quotes around identifiers
- ⚠️ Changed `JOIN` to `INNER JOIN` (explicit syntax preferred in HANA)

**Performance Optimization Options:**
```sql
-- Option 1: Add calculated columns to mseg for better performance
ALTER TABLE "mseg" ADD ("weight_conversion" DECIMAL(15,3)
    AS "quantity_base_uom" * (SELECT "numerator"/"denominator" FROM "marm"
                               WHERE "marm"."material_id" = "mseg"."material_id"));

-- Option 2: Create indexed view (HANA supports)
CREATE VIEW "v_weight_drift_trend_indexed" AS ... WITH STRUCTURED PRIVILEGE CHECK;
```

---

#### View 3: v_margin_erosion (CTE conversion)

**PostgreSQL Version:**
```sql
CREATE OR REPLACE VIEW sap_poc.v_margin_erosion AS
WITH batch_receipt_weights AS (
    SELECT
        material_id,
        plant_id,
        storage_location,
        batch_id,
        SUM(quantity_parallel_uom) / NULLIF(SUM(quantity_base_uom), 0) AS batch_avg_weight_per_case
    FROM mseg
    WHERE movement_type = '101'
    GROUP BY material_id, plant_id, storage_location, batch_id
)
SELECT
    seg.material_id,
    seg.plant_id,
    seg.storage_location,
    seg.batch_id,
    hdr.posting_date,
    ABS(seg.quantity_base_uom) AS qty_cases,

    -- Expected shipped weight based on what we received
    ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case AS expected_shipped_lb,

    -- Actual shipped weight
    ABS(seg.quantity_parallel_uom) AS actual_shipped_lb,

    -- Expected margin (what we should have made)
    ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case * val.price_per_unit AS expected_margin_usd,

    -- Actual margin
    ABS(seg.quantity_parallel_uom) * val.price_per_unit AS actual_margin_usd,

    -- Margin erosion
    (ABS(seg.quantity_parallel_uom) -
     ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case) * val.price_per_unit AS margin_erosion_usd,

    -- Erosion percentage
    ((ABS(seg.quantity_parallel_uom) - ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case) /
     NULLIF(ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case, 0) * 100) AS erosion_pct,

    val.price_per_unit AS price_per_lb,
    seg.movement_type,
    hdr.user_id
FROM mseg seg
JOIN mkpf hdr ON seg.document_number = hdr.document_number
              AND seg.document_year = hdr.document_year
JOIN batch_receipt_weights brw
    ON seg.material_id = brw.material_id
    AND seg.plant_id = brw.plant_id
    AND seg.storage_location = brw.storage_location
    AND seg.batch_id = brw.batch_id
JOIN mbew val ON seg.material_id = val.material_id
              AND seg.plant_id = val.plant_id
WHERE seg.movement_type IN ('601', '261');  -- Issues only
```

**HANA SQL Version (Identical CTEs supported):**
```sql
CREATE VIEW "SAP_POC"."v_margin_erosion" AS
WITH "batch_receipt_weights" AS (
    SELECT
        "material_id",
        "plant_id",
        "storage_location",
        "batch_id",
        SUM("quantity_parallel_uom") / NULLIF(SUM("quantity_base_uom"), 0) AS "batch_avg_weight_per_case"
    FROM "mseg"
    WHERE "movement_type" = '101'
    GROUP BY "material_id", "plant_id", "storage_location", "batch_id"
)
SELECT
    seg."material_id",
    seg."plant_id",
    seg."storage_location",
    seg."batch_id",
    hdr."posting_date",
    ABS(seg."quantity_base_uom") AS "qty_cases",

    -- Expected shipped weight based on what we received
    ABS(seg."quantity_base_uom") * brw."batch_avg_weight_per_case" AS "expected_shipped_lb",

    -- Actual shipped weight
    ABS(seg."quantity_parallel_uom") AS "actual_shipped_lb",

    -- Expected margin
    ABS(seg."quantity_base_uom") * brw."batch_avg_weight_per_case" * val."price_per_unit" AS "expected_margin_usd",

    -- Actual margin
    ABS(seg."quantity_parallel_uom") * val."price_per_unit" AS "actual_margin_usd",

    -- Margin erosion
    (ABS(seg."quantity_parallel_uom") -
     ABS(seg."quantity_base_uom") * brw."batch_avg_weight_per_case") * val."price_per_unit" AS "margin_erosion_usd",

    -- Erosion percentage
    ((ABS(seg."quantity_parallel_uom") - ABS(seg."quantity_base_uom") * brw."batch_avg_weight_per_case") /
     NULLIF(ABS(seg."quantity_base_uom") * brw."batch_avg_weight_per_case", 0) * 100) AS "erosion_pct",

    val."price_per_unit" AS "price_per_lb",
    seg."movement_type",
    hdr."user_id"
FROM "mseg" seg
INNER JOIN "mkpf" hdr
    ON seg."document_number" = hdr."document_number"
    AND seg."document_year" = hdr."document_year"
INNER JOIN "batch_receipt_weights" brw
    ON seg."material_id" = brw."material_id"
    AND seg."plant_id" = brw."plant_id"
    AND seg."storage_location" = brw."storage_location"
    AND seg."batch_id" = brw."batch_id"
INNER JOIN "mbew" val
    ON seg."material_id" = val."material_id"
    AND seg."plant_id" = val."plant_id"
WHERE seg."movement_type" IN ('601', '261');
```

**Changes:**
- ✅ CTEs fully supported in HANA SQL
- ⚠️ Quoted identifiers for case sensitivity

**Performance Tip:**
```sql
-- Materialize batch weights as a separate view for better performance
CREATE VIEW "v_batch_receipt_weights" AS
SELECT
    "material_id",
    "plant_id",
    "storage_location",
    "batch_id",
    SUM("quantity_parallel_uom") / NULLIF(SUM("quantity_base_uom"), 0) AS "batch_avg_weight_per_case"
FROM "mseg"
WHERE "movement_type" = '101'
GROUP BY "material_id", "plant_id", "storage_location", "batch_id";

-- Then reference in main view
CREATE VIEW "v_margin_erosion" AS
SELECT ...
FROM "mseg" seg
INNER JOIN "v_batch_receipt_weights" brw ...
```

---

### 1.3 Date Function Conversions

| PostgreSQL | HANA SQL | Example |
|-----------|----------|---------|
| `CURRENT_DATE` | `CURRENT_DATE` | ✅ Same |
| `NOW()` | `CURRENT_TIMESTAMP` | Use CURRENT_TIMESTAMP |
| `TO_CHAR(date, 'YYYY-MM-DD')` | `TO_VARCHAR(date, 'YYYY-MM-DD')` | Change TO_CHAR → TO_VARCHAR |
| `DATE_TRUNC('month', date)` | `ADD_MONTHS(TO_DATE(date, 'YYYY-MM-DD'), 0)` | Use ADD_MONTHS or custom logic |
| `EXTRACT(YEAR FROM date)` | `YEAR(date)` | Use YEAR() function |

**Example Conversion:**
```sql
-- PostgreSQL
SELECT TO_CHAR(posting_date, 'YYYY-MM') as month
FROM mkpf;

-- HANA SQL
SELECT TO_VARCHAR("posting_date", 'YYYY-MM') as "month"
FROM "mkpf";
```

---

## 2. SAC Dashboard Design Guide

### 2.1 Dashboard Architecture

**Current POC Dashboard Structure:**
```
+---------------------------------------------------------+
| Header: "Catch Weight Analytics Dashboard"              |
+---------------------------------------------------------+
| Executive Summary (4 KPI Cards)                         |
| +--------+ +--------+ +--------+ +--------+            |
| | Total  | | Total  | | Total  | | Avg    |            |
| | Trans  | | Drift  | | Margin | | Drift  |            |
| +--------+ +--------+ +--------+ +--------+            |
+---------------------------------------------------------+
| Section 1: Weight Drift Trend                           |
| +-------------------------------------------+           |
| | Area Chart: Drift Over Time               |           |
| +-------------------------------------------+           |
| +-------------------------------------------+           |
| | Bar Chart: Top Materials by Exposure      |           |
| +-------------------------------------------+           |
+---------------------------------------------------------+
| Section 2: Margin Erosion                               |
| +------------------+ +----------------------+          |
| | Pie Chart:       | | Ranked List:         |          |
| | Erosion by       | | Materials with       |          |
| | Material         | | Highest Erosion      |          |
| +------------------+ +----------------------+          |
+---------------------------------------------------------+
```

### 2.2 SAC Widget Mapping

#### 2.2.1 KPI Cards → Numeric Point Charts

**React Component (Current):**
```jsx
<Card>
  <CardTitle>Total Transactions</CardTitle>
  <CardValue>{summary.total_transactions}</CardValue>
</Card>
```

**SAC Equivalent:**
1. Insert → Chart → Numeric Point
2. Data source: BDC Data Product `v_weight_drift_trend`
3. Measure: Count of records
4. Styling:
   - Title: "Total Transactions"
   - Font size: 32pt
   - Color: #0070c0 (SAP blue)
   - Show comparison (vs. previous period)

**SAC Configuration:**
```json
{
  "widgetType": "NumericPoint",
  "dataSource": "BDC_Weight_Drift_Trend",
  "measure": {
    "aggregation": "COUNT",
    "field": "*"
  },
  "styling": {
    "title": "Total Transactions",
    "valueFormat": "#,##0",
    "fontSize": 32,
    "color": "#0070c0"
  },
  "comparison": {
    "enabled": true,
    "type": "previousPeriod",
    "dateField": "posting_date"
  }
}
```

---

#### 2.2.2 Area Chart → SAC Time Series Chart

**Recharts Component (Current):**
```jsx
<AreaChart data={weightDriftData}>
  <XAxis dataKey="posting_date" />
  <YAxis />
  <Area type="monotone" dataKey="drift_pct" fill="#8884d8" />
  <Tooltip />
</AreaChart>
```

**SAC Configuration Steps:**
1. Insert → Chart → Time Series
2. Data source: `v_weight_drift_trend`
3. Date dimension: `posting_date`
4. Measure: `drift_pct` (average or sum)
5. Chart type: Area
6. Styling:
   - Color palette: SAP Belize
   - Show data labels: Yes
   - Enable drill-down by material

**Builder Panel Settings:**
```
Data:
  +- Dimensions: [posting_date]
  +- Measures: [drift_pct, financial_exposure_usd]

Chart Structure:
  +- Chart Type: Area Chart
  +- Time Axis: posting_date (Day/Week/Month)
  +- Value Axis: drift_pct (%)

Styling:
  +- Color: #0070c0
  +- Transparency: 30%
  +- Line width: 2px
  +- Data labels: On trend peaks

Interactions:
  +- Drill-down: Enable by material_id
  +- Filter: Date range selector
  +- Cross-filtering: Enable with bar chart
```

---

#### 2.2.3 Bar Chart → SAC Ranked Bar Chart

**Recharts Component (Current):**
```jsx
<BarChart data={materialRanking} layout="horizontal">
  <XAxis type="number" />
  <YAxis dataKey="material_id" type="category" />
  <Bar dataKey="total_exposure" fill="#82ca9d" />
</BarChart>
```

**SAC Configuration:**
1. Insert → Chart → Bar/Column
2. Data source: Aggregated query on `v_weight_drift_trend`
3. Dimension: `material_id`
4. Measure: SUM of `financial_exposure_usd`
5. Ranking: Top 10
6. Orientation: Horizontal

**Builder Configuration:**
```
Data:
  +- Dimension: material_id
  +- Measure: SUM(financial_exposure_usd)

Chart Structure:
  +- Chart Type: Horizontal Bar
  +- Ranking: Top 10 (descending)
  +- Sort: By value (highest first)

Styling:
  +- Color: Gradient (light to dark blue)
  +- Show values: Yes (on bars)
  +- Bar thickness: Medium
  +- Axis labels: Material ID with description

Interactions:
  +- Tooltip: Show material details
  +- Click action: Navigate to material detail page
  +- Cross-filter: Filter time series by selected material
```

---

#### 2.2.4 Pie Chart → SAC Donut Chart

**Recharts Component (Current):**
```jsx
<PieChart>
  <Pie
    data={marginErosionData}
    dataKey="total_erosion"
    nameKey="material_id"
    cx="50%"
    cy="50%"
    outerRadius={80}
  />
</PieChart>
```

**SAC Configuration:**
1. Insert → Chart → Donut
2. Data source: `v_margin_erosion` (aggregated)
3. Dimension: `material_id`
4. Measure: SUM of `margin_erosion_usd`
5. Limit: Top 8 materials (others grouped as "Other")

**Builder Configuration:**
```
Data:
  +- Dimension: material_id
  +- Measure: SUM(margin_erosion_usd)

Chart Structure:
  +- Chart Type: Donut
  +- Show top: 8 items (group rest as "Other")
  +- Inner radius: 40%

Styling:
  +- Color palette: SAP Belize Diverging
  +- Show percentages: Yes
  +- Show values: On hover
  +- Legend position: Right

Interactions:
  +- Tooltip: Material ID + Erosion amount + %
  +- Click: Filter other widgets by material
  +- Drill-to-detail: Batch-level erosion
```

---

### 2.3 SAC Layout Design

**Responsive Canvas Layout:**

```
Page 1: Executive Summary
+- Section: Header (fixed height: 80px)
|  +- Title: "Catch Weight Analytics Dashboard"
|
+- Section: KPIs (fixed height: 150px)
|  +- Column 1: Total Transactions (25% width)
|  +- Column 2: Total Drift LB (25% width)
|  +- Column 3: Total Margin Erosion (25% width)
|  +- Column 4: Average Drift % (25% width)
|
+- Section: Weight Drift Analysis (flexible height)
|  +- Row 1: Area Chart (70% height)
|  |  +- Chart: Weight Drift Trend Over Time
|  +- Row 2: Bar Chart (30% height)
|      +- Chart: Top Materials by Financial Exposure
|
+- Section: Margin Erosion Analysis (flexible height)
|  +- Column 1: Donut Chart (40% width)
|  |  +- Chart: Erosion by Material
|  +- Column 2: Table (60% width)
|      +- Widget: Ranked Material List

Page 2: Detailed Analysis (drill-through)
+- Material-level details
+- Batch-level transactions
+- Historical trends
```

**SAC Canvas Setup:**
1. Create new Story → Canvas mode
2. Page size: 1920 x 1080 (Full HD)
3. Enable responsive design
4. Set grid: 12 columns, 20px gutter

---

### 2.4 SAC Filters & Input Controls

**Global Filters (Apply to all widgets):**

1. **Date Range Filter**
```
Type: Date Range Input Control
Field: posting_date
Default: Last 90 days
Options: Today, Last 7 days, Last 30 days, Last 90 days, Year to Date, Custom
```

2. **Plant Filter**
```
Type: Dropdown (Multi-select)
Field: plant_id
Default: All plants
Source: Dimension members from mara table
```

3. **Material Type Filter**
```
Type: Dropdown (Multi-select)
Field: material_type
Default: All types
Filter: Only catch-weight materials (catch_weight_flag = TRUE)
```

4. **Movement Type Filter** (for Margin Erosion section only)
```
Type: Dropdown
Field: movement_type
Options: 601 (Customer Sales), 261 (Production Issue), All
Default: All
```

**Filter Implementation:**
```javascript
// SAC Script for dynamic filtering
var plantFilter = Application.getSelectedPlant();
var dateRange = Application.getDateRange();

// Apply to all data sources
WeightDriftTrend.getDataSource().setDimensionFilter("plant_id", plantFilter);
WeightDriftTrend.getDataSource().setDimensionFilter("posting_date", dateRange);

MarginErosion.getDataSource().setDimensionFilter("plant_id", plantFilter);
MarginErosion.getDataSource().setDimensionFilter("posting_date", dateRange);

// Refresh all widgets
Application.refreshAll();
```

---

### 2.5 SAC Data Connections

**Option 1: Live Connection (Recommended)**
```
Connection Type: SAP BDC Live Connection
Benefits:
  ✅ Real-time data (no refresh lag)
  ✅ No data duplication
  ✅ Direct query to HANA
  ✅ Automatic security propagation

Setup Steps:
  1. SAC → Connections → Add Connection
  2. Type: SAP Datasphere (BDC)
  3. URL: https://<tenant>.us1.hcs.cloud.sap
  4. Authentication: OAuth 2.0
  5. Select Space: SAP_POC
  6. Select Data Products: v_weight_drift_trend, v_margin_erosion
```

**Option 2: Acquired Data (for offline access)**
```
Connection Type: Import Model
Benefits:
  ✅ Faster query performance (data cached in SAC)
  ✅ Works offline
  ✅ Blending with non-BDC data sources

Setup Steps:
  1. SAC → Modeler → Create Model
  2. Source: Import from BDC
  3. Schedule: Refresh daily at 2 AM
  4. Data volume: Full extract (or delta if large)
```

**Recommended: Hybrid Approach**
- Executive KPIs: Live connection (real-time)
- Detailed drill-downs: Acquired model (performance)

---

### 2.6 SAC Advanced Features

#### 2.6.1 Smart Insights (AI-powered)

**Enable Smart Insights:**
```
1. Select chart (e.g., Weight Drift Area Chart)
2. Right-click → Add → Smart Insights
3. SAC automatically identifies:
   - Trend: "Drift increasing 15% over last 30 days"
   - Outliers: "Material CHKBRST-001 has unusually high drift"
   - Forecast: "Expected drift next week: +2.3%"
```

#### 2.6.2 Thresholds & Alerts

**Configure Drift Alert:**
```javascript
// SAC Threshold Configuration
WeightDriftChart.addThreshold({
  measure: "drift_pct",
  condition: "greaterThan",
  value: 5.0,  // Alert if drift > 5%
  color: "#FF0000",
  label: "Critical Variance",
  action: "sendEmail",
  recipients: ["supply-chain@company.com"]
});
```

**Visual Threshold Bands:**
```
Green zone: drift_pct between -2% and +2% (acceptable)
Yellow zone: drift_pct between -5% to -2% or +2% to +5% (warning)
Red zone: drift_pct < -5% or > 5% (critical)
```

#### 2.6.3 Variance Analysis

**Actual vs. Expected Comparison:**
```
Chart Type: Variance Chart (Waterfall)
Starting point: Expected margin (based on MARM)
Components:
  + Positive drift (supplier over-delivery)
  - Negative drift (supplier under-delivery)
  - Operational erosion (handling losses)
Ending point: Actual margin
```

#### 2.6.4 Drill-to-Detail

**Navigation Path:**
```
Executive Dashboard (Page 1)
  ↓ Click on material in bar chart
Material Detail Page (Page 2)
  - Historical drift trend for this material
  - Batch-level breakdown
  - Supplier performance
  ↓ Click on specific batch
Batch Transaction Detail (Page 3)
  - All receipts and issues for this batch
  - Actual weights recorded
  - User who posted transactions
```

**Implementation:**
```javascript
// SAC onClick Script
WeightDriftBarChart.onClick(function(event) {
  var selectedMaterial = event.dataPoint.material_id;

  // Navigate to detail page with material context
  Application.navigateToPage("MaterialDetail", {
    materialId: selectedMaterial,
    dateRange: Application.getDateRange()
  });
});
```

---

## 3. BDC Space Configuration

### 3.1 Space Design

**Space Name:** `SAP_S4_CATCHWEIGHT_ANALYTICS`

**Purpose:** Analytical layer for catch weight variance and margin analysis

**Structure:**
```
SAP_S4_CATCHWEIGHT_ANALYTICS/
+- Tables (Replicated from S/4HANA)
|  +- mara (Material Master)
|  +- marm (UoM Conversions)
|  +- mkpf (Document Headers)
|  +- mseg (Document Segments)
|  +- mbew (Valuation)
+- Views (Foundation Layer)
|  +- v_inventory_rebuild
|  +- v_inventory_valuation
|  +- v_reconciliation
+- Data Products (Published Assets)
|  +- v_weight_drift_trend [Published]
|  +- v_margin_erosion [Published]
+- Business Entities (Semantic Layer)
   +- Material (with attributes)
   +- Plant (with hierarchy)
   +- Batch (with tracking)
```

### 3.2 Table Replication Configuration

#### Remote Tables vs. Local Tables

**MARA, MARM, MBEW: Remote Tables**
```
Type: Remote Table
Connection: S4HANA_PROD
Source: <SCHEMA>.MARA
Refresh: On-demand (or cache for 24 hours)
Reason: Slow-changing dimensions, low data volume
```

**MKPF, MSEG: Replication Flows**
```
Type: Local Table (Replicated)
Connection: S4HANA_PROD
Source: <SCHEMA>.MSEG
Replication:
  - Mode: Delta (change data capture)
  - Frequency: Every 15 minutes
  - Filter: Only catch-weight materials (join to MARA where catch_weight_flag = TRUE)
Reason: High transaction volume, frequent queries, performance optimization
```

**Replication Flow Configuration (MSEG):**
```json
{
  "name": "MSEG_Replication",
  "source": {
    "connection": "S4HANA_PROD",
    "object": "SAPHANADB.MSEG",
    "type": "Table"
  },
  "target": {
    "space": "SAP_S4_CATCHWEIGHT_ANALYTICS",
    "table": "mseg",
    "type": "Local Table"
  },
  "replication": {
    "mode": "delta",
    "frequency": "*/15 * * * *",  // Every 15 minutes
    "initialLoad": "full",
    "deltaDetection": "timestamp",  // Use entry_timestamp column
    "filter": "EXISTS (SELECT 1 FROM MARA WHERE MARA.material_id = MSEG.material_id AND MARA.catch_weight_flag = TRUE)"
  },
  "transformations": [
    {
      "type": "dataType",
      "column": "quantity_base_uom",
      "targetType": "DECIMAL(15,3)"
    },
    {
      "type": "dataType",
      "column": "quantity_parallel_uom",
      "targetType": "DECIMAL(15,3)"
    }
  ],
  "partitioning": {
    "enabled": true,
    "column": "posting_date",
    "interval": "MONTH"
  }
}
```

### 3.3 Data Product Publishing

**Data Product 1: Weight Drift Trend**

```json
{
  "name": "Weight Drift Trend",
  "technicalName": "v_weight_drift_trend",
  "type": "Analytical Dataset",
  "baseView": "SAP_S4_CATCHWEIGHT_ANALYTICS.v_weight_drift_trend",
  "businessMetadata": {
    "displayName": "Weight Drift Trend Analysis",
    "description": "Measures supplier delivery accuracy vs. planning baseline (MARM conversion factors). Identifies materials with poor forecast accuracy and quantifies financial exposure from weight variances.",
    "tags": ["catch-weight", "variance-analysis", "procurement", "quality"],
    "owner": "Supply Chain Analytics Team",
    "steward": "john.smith@company.com",
    "domain": "Supply Chain",
    "classification": "Internal Use"
  },
  "technicalMetadata": {
    "refreshSchedule": "Real-time (live query)",
    "dataRetention": "2 years",
    "granularity": "Transaction-level",
    "latency": "< 1 minute"
  },
  "semanticLayer": {
    "dimensions": [
      {
        "name": "material_id",
        "displayName": "Material",
        "description": "Material identifier",
        "dataType": "string",
        "hierarchy": "Material Group > Material"
      },
      {
        "name": "plant_id",
        "displayName": "Plant",
        "description": "Manufacturing or warehouse plant",
        "dataType": "string",
        "hierarchy": "Region > Country > Plant"
      },
      {
        "name": "posting_date",
        "displayName": "Posting Date",
        "description": "Date of goods receipt",
        "dataType": "date",
        "hierarchies": ["Year > Quarter > Month > Day"]
      }
    ],
    "measures": [
      {
        "name": "drift_lb",
        "displayName": "Weight Drift (LB)",
        "description": "Actual weight minus expected weight (from MARM)",
        "dataType": "decimal",
        "unit": "LB",
        "aggregation": "SUM",
        "format": "#,##0.00"
      },
      {
        "name": "drift_pct",
        "displayName": "Drift %",
        "description": "Weight variance as percentage of expected",
        "dataType": "decimal",
        "unit": "%",
        "aggregation": "AVG",
        "format": "#,##0.00%"
      },
      {
        "name": "financial_exposure_usd",
        "displayName": "Financial Exposure",
        "description": "Monetary value of weight variance",
        "dataType": "decimal",
        "unit": "USD",
        "aggregation": "SUM",
        "format": "$#,##0.00"
      }
    ]
  },
  "dataQuality": {
    "rules": [
      {
        "name": "NoNullBatches",
        "condition": "batch_id IS NOT NULL",
        "severity": "ERROR"
      },
      {
        "name": "ReasonableDrift",
        "condition": "ABS(drift_pct) < 50",
        "severity": "WARNING",
        "message": "Drift > 50% may indicate data quality issue"
      }
    ],
    "monitoring": {
      "enabled": true,
      "frequency": "hourly",
      "alertRecipients": ["data-quality@company.com"]
    }
  },
  "accessControl": {
    "defaultAccess": "READ",
    "roleAssignments": [
      {
        "role": "Supply Chain Analyst",
        "permissions": ["READ", "EXPORT"]
      },
      {
        "role": "Supply Chain Manager",
        "permissions": ["READ", "EXPORT", "SHARE"]
      },
      {
        "role": "Data Engineer",
        "permissions": ["READ", "WRITE", "DELETE"]
      }
    ],
    "rowLevelSecurity": {
      "enabled": true,
      "filter": "plant_id IN (SELECT plant_id FROM user_plant_access WHERE user_id = SESSION_USER)"
    }
  },
  "consumption": {
    "exposedAs": ["OData", "GraphQL", "SAC Live Connection"],
    "sampleQuery": "SELECT material_id, SUM(financial_exposure_usd) FROM v_weight_drift_trend WHERE posting_date >= ADD_DAYS(CURRENT_DATE, -30) GROUP BY material_id ORDER BY 2 DESC LIMIT 10"
  }
}
```

**Data Product 2: Margin Erosion**

*(Similar structure, key differences:)*
```json
{
  "name": "Margin Erosion Analysis",
  "description": "Measures operational variance (issued vs. received weights). Detects inventory shrinkage, handling losses, and calculates margin impact separate from planning accuracy.",
  "baseView": "v_margin_erosion",
  "businessMetadata": {
    "tags": ["catch-weight", "margin-analysis", "shrinkage", "operations"]
  },
  "measures": [
    {
      "name": "margin_erosion_usd",
      "displayName": "Margin Erosion",
      "description": "Financial impact of shipping more/less than received",
      "unit": "USD"
    },
    {
      "name": "erosion_pct",
      "displayName": "Erosion %",
      "description": "Variance as % of expected shipped weight"
    }
  ]
}
```

---

## 4. Detailed Implementation Timeline

### Week 1-2: Foundation Setup

**Week 1: BDC Tenant & Connections**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | BDC tenant provisioning | SAP Basis | Tenant URL + admin credentials |
| Tue | Create Space "SAP_S4_CATCHWEIGHT_ANALYTICS" | BDC Architect | Space configured |
| Wed | S/4HANA connection setup | S/4 Basis + BDC Architect | Connection tested |
| Thu | Configure Remote Tables (MARA, MARM, MBEW) | BDC Developer | Tables accessible |
| Fri | Validate remote table data | QA Engineer | Data quality report |

**Week 2: Data Replication**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Configure replication flow for MKPF | BDC Developer | Initial full load complete |
| Tue | Configure replication flow for MSEG (with catch-weight filter) | BDC Developer | Delta replication active |
| Wed | Implement partitioning strategy (by posting_date) | BDC Architect | Partitioned tables |
| Thu | Performance testing (query response times) | BDC Developer | Performance baseline |
| Fri | Data validation & reconciliation | QA Engineer | Reconciliation report |

---

### Week 3-4: Analytical Layer

**Week 3: Foundation Views**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Port v_inventory_rebuild to HANA SQL | BDC Developer | View created & tested |
| Tue | Port v_inventory_valuation | BDC Developer | View created & tested |
| Wed | Port v_reconciliation | BDC Developer | View created & tested |
| Thu | Unit testing (compare POC vs. BDC results) | QA Engineer | Test results (100% match) |
| Fri | Performance tuning (indexing, calculated columns) | BDC Architect | Optimized views |

**Week 4: Data Products**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Port v_weight_drift_trend | BDC Developer | View created |
| Tue | Port v_margin_erosion (with batch CTE) | BDC Developer | View created |
| Wed | Data quality validation | QA Engineer | QA report |
| Thu | Performance testing (1M+ MSEG records) | BDC Developer | Performance metrics |
| Fri | Bug fixes & optimization | BDC Developer | Production-ready views |

---

### Week 5: Data Product Publishing

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Publish Weight Drift Trend as Data Product | BDC Architect | Published with metadata |
| Tue | Publish Margin Erosion as Data Product | BDC Architect | Published with metadata |
| Wed | Configure access policies (role-based, RLS) | BDC Architect + Security | Security configured |
| Thu | Set up data quality rules & monitoring | BDC Developer | DQ monitoring active |
| Fri | Documentation (data dictionary, lineage) | Business Analyst | User documentation |

---

### Week 6-7: Consumption Layer

**Week 6: SAC Dashboard (Option A)**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | SAC connection to BDC | SAC Designer | Live connection established |
| Tue | Build executive KPI cards | SAC Designer | 4 KPI widgets |
| Wed | Build Weight Drift area chart + bar chart | SAC Designer | 2 charts completed |
| Thu | Build Margin Erosion pie chart + table | SAC Designer | 2 widgets completed |
| Fri | Implement filters, styling, responsive layout | SAC Designer | Functional dashboard |

**Week 7: Testing & Refinement**

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | UAT with business users | Supply Chain Team | Feedback collected |
| Tue | Refinements based on feedback | SAC Designer | Updated dashboard |
| Wed | Mobile responsiveness testing | SAC Designer | Mobile-optimized |
| Thu | Performance testing (concurrent users) | DevOps | Load test results |
| Fri | Final UAT sign-off | Business Sponsor | Go-live approved |

---

### Week 8: Production Deployment

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| Mon | Security audit & penetration testing | Security Team | Security clearance |
| Tue | Monitoring & alerting setup | DevOps | Monitoring dashboards |
| Wed | User training sessions | Business Analyst | Training materials |
| Thu | Go-live cutover | Full Team | Production deployment |
| Fri | Post-deployment support & monitoring | Full Team | Hypercare support |

---

## 5. Testing Strategy

### 5.1 Unit Testing (Views)

**Test v_weight_drift_trend:**

```sql
-- Test Case 1: Verify drift calculation
-- Expected: drift_lb = actual_weight_lb - expected_weight_lb

WITH test_data AS (
    SELECT
        'TEST_MAT' as material_id,
        100.0 as quantity_base_uom,
        2520.0 as quantity_parallel_uom,  -- Actual weight
        25.0 as marm_conversion            -- Expected: 25 LB/CS
    FROM DUMMY
),
expected AS (
    SELECT
        100.0 * 25.0 as expected_weight,  -- 2500 LB
        2520.0 - (100.0 * 25.0) as expected_drift  -- 20 LB
    FROM DUMMY
)
SELECT
    v.*,
    e.expected_drift,
    CASE
        WHEN ABS(v.drift_lb - e.expected_drift) < 0.01 THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM v_weight_drift_trend v
CROSS JOIN expected e
WHERE v.material_id = 'TEST_MAT';

-- Expected output: test_result = 'PASS'
```

**Test v_margin_erosion:**

```sql
-- Test Case 1: Verify batch average calculation

-- Setup: Create test batch with known weights
-- Batch B001 receipts: 100 CS at 2,500 LB = 25.00 LB/CS average
-- Issue: 10 CS at 251 LB (should be 250 LB)
-- Expected erosion: 1 LB = $3.50 (if price = $3.50/LB)

WITH batch_avg_test AS (
    SELECT
        batch_id,
        SUM(quantity_parallel_uom) / SUM(quantity_base_uom) as calculated_avg
    FROM mseg
    WHERE batch_id = 'B001' AND movement_type = '101'
    GROUP BY batch_id
)
SELECT
    v.*,
    bat.calculated_avg as batch_avg,
    v.expected_shipped_lb,
    v.actual_shipped_lb,
    v.margin_erosion_usd,
    CASE
        WHEN ABS(v.expected_shipped_lb - (v.qty_cases * bat.calculated_avg)) < 0.01
             AND ABS(v.margin_erosion_usd - ((v.actual_shipped_lb - v.expected_shipped_lb) * v.price_per_lb)) < 0.01
        THEN 'PASS'
        ELSE 'FAIL'
    END as test_result
FROM v_margin_erosion v
JOIN batch_avg_test bat ON v.batch_id = bat.batch_id
WHERE v.batch_id = 'B001' AND v.movement_type = '601';
```

### 5.2 Integration Testing

**End-to-End Data Flow Test:**

1. **Insert test transaction in S/4HANA (or simulated MSEG)**
```sql
-- Insert goods receipt
INSERT INTO mseg VALUES (
    '5000000001', '2026', '0001',  -- doc_number, doc_year, line_item
    'TEST_MAT_E2E', 'P001', 'S001', 'B_E2E',  -- material, plant, sloc, batch
    '101',  -- movement_type
    100.0,  -- quantity_base_uom (cases)
    2530.0,  -- quantity_parallel_uom (actual weight)
    'CS', 'LB',  -- UOMs
    CURRENT_DATE  -- posting_date
);
```

2. **Wait for replication** (15 min delta interval)

3. **Verify in BDC view**
```sql
SELECT *
FROM v_weight_drift_trend
WHERE material_id = 'TEST_MAT_E2E'
  AND batch_id = 'B_E2E';

-- Expected:
--   drift_lb = 2530 - (100 * 25) = +30 LB (assuming MARM = 25)
--   drift_pct = (30 / 2500) * 100 = +1.2%
```

4. **Verify in SAC Dashboard**
- Open dashboard
- Apply filter: Material = TEST_MAT_E2E
- Verify KPI card updates
- Verify chart shows new data point

### 5.3 Performance Testing

**Load Test Scenarios:**

| Scenario | Query | Target Response Time | Expected Load |
|----------|-------|---------------------|---------------|
| Dashboard KPIs (4 cards) | SUM/COUNT on v_weight_drift_trend | < 1 second | 50 concurrent users |
| Weight Drift Chart (30 days) | Time series aggregation | < 2 seconds | 50 concurrent users |
| Material Drill-down | Filter by material_id | < 1 second | 20 concurrent users |
| Full dashboard load | All widgets | < 5 seconds | 50 concurrent users |
| Data refresh (replication) | MSEG delta load (10K rows) | < 5 minutes | Background job |

**Performance Test Script:**
```sql
-- Simulate 50 concurrent users querying dashboard
DO BEGIN
    DECLARE i INT := 1;
    DECLARE start_time TIMESTAMP;
    DECLARE end_time TIMESTAMP;

    WHILE i <= 50 DO
        start_time := CURRENT_TIMESTAMP;

        -- Execute typical dashboard query
        SELECT
            COUNT(*) as total_transactions,
            SUM(financial_exposure_usd) as total_exposure,
            AVG(drift_pct) as avg_drift
        FROM v_weight_drift_trend
        WHERE posting_date >= ADD_DAYS(CURRENT_DATE, -30);

        end_time := CURRENT_TIMESTAMP;

        INSERT INTO performance_log VALUES (
            i, start_time, end_time,
            SECONDS_BETWEEN(end_time, start_time)
        );

        i := i + 1;
    END WHILE;
END;

-- Analyze results
SELECT
    AVG(duration_seconds) as avg_response_time,
    MAX(duration_seconds) as max_response_time,
    MIN(duration_seconds) as min_response_time
FROM performance_log;

-- Target: avg < 1 second, max < 2 seconds
```

---

## 6. Rollback & Contingency Plan

### 6.1 Rollback Scenarios

| Scenario | Trigger | Rollback Action | Recovery Time |
|----------|---------|-----------------|---------------|
| **Critical bug in BDC views** | Incorrect calculations detected | Revert to previous view version | < 1 hour |
| **Performance degradation** | Query times > 10 seconds | Switch SAC to cached model (not live) | < 2 hours |
| **Data quality issues** | Drift > 50% for all materials (data error) | Pause replication, investigate source | < 4 hours |
| **S/4HANA connection failure** | Cannot connect to source | Use cached data, engage S/4 BASIS | < 4 hours |
| **Complete BDC failure** | Tenant unavailable | Fallback to POC PostgreSQL | < 8 hours |

### 6.2 Fallback Architecture

**Maintain POC as hot standby for first 30 days:**

```
Primary: BDC + SAC
  ↓ (if failure)
Fallback: PostgreSQL POC + React Dashboard

Cutover process:
1. Update DNS/load balancer to point to POC API
2. Notify users of temporary service disruption
3. Continue POC data load from S/4HANA
4. Troubleshoot BDC issue in parallel
5. Cut back to BDC once resolved
```

---

## 7. Knowledge Transfer & Documentation

### 7.1 Technical Documentation Deliverables

1. **Architecture Document** (20-30 pages)
   - Data model (ERD)
   - Data flow diagrams
   - View dependencies
   - Security model

2. **Developer Guide** (15-20 pages)
   - SQL view development standards
   - BDC Space navigation
   - Data Product publishing process
   - Troubleshooting common issues

3. **Operations Runbook** (10-15 pages)
   - Monitoring procedures
   - Alert response procedures
   - Replication failure recovery
   - Performance tuning guidelines

4. **User Manual** (10-12 pages)
   - Dashboard navigation
   - Filter usage
   - Drill-down procedures
   - Exporting data

### 7.2 Training Plan

**Week 1: Technical Team Training (3 days)**
- Day 1: BDC Fundamentals (8 hours)
- Day 2: SQL View Development (8 hours)
- Day 3: SAC Story Building (8 hours)

**Week 2: Business User Training (4 hours)**
- Session 1: Dashboard overview (1 hour)
- Session 2: Interpreting metrics (Weight Drift vs. Margin Erosion) (1.5 hours)
- Session 3: Hands-on practice (1.5 hours)

**Week 3: Train-the-Trainer (2 hours)**
- Power users learn to train others
- Q&A and advanced topics

---

## 8. Success Metrics

### 8.1 Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Data Freshness** | < 15 minutes lag | Delta replication monitoring |
| **Query Performance** | < 2 seconds (P95) | BDC query logs |
| **Dashboard Load Time** | < 5 seconds | SAC performance monitoring |
| **Uptime** | 99.5% | BDC tenant availability |
| **Data Quality** | 99.9% accuracy | Automated DQ rules |
| **Replication Success Rate** | 99.9% | Replication flow logs |

### 8.2 Business KPIs

| Metric | Baseline (POC) | Target (6 months) |
|--------|----------------|-------------------|
| **Time to Insight** | 2-3 days (manual Excel) | Real-time (< 1 hour) |
| **User Adoption** | 5 users (POC testing) | 50+ users |
| **Margin Protection** | $0 (no visibility) | $200K+ annually |
| **Forecast Accuracy** | 85% (estimated) | 92%+ (MARM updates based on drift data) |
| **Supplier Scorecard** | Manual, monthly | Automated, daily |

---

## 9. Post-Go-Live Roadmap

### Phase 2 Enhancements (Months 2-4)

1. **ML-Powered Predictive Analytics**
   - Train model on historical drift data
   - Predict future drift by supplier/material
   - Prescriptive recommendations: "Update MARM for MAT123 to 25.5 LB/CS"

2. **IoT Integration**
   - Connect industrial scales directly to BDC
   - Real-time weight capture (eliminate manual entry)
   - Automated variance alerts

3. **Extended Data Products**
   - Lot Traceability (FDA 21 CFR Part 11 compliance)
   - Expiry Date Analytics (FEFO optimization)
   - Supplier Performance Scorecard

4. **Mobile App**
   - Warehouse manager mobile dashboard
   - Push notifications for critical variances
   - Barcode scanning for batch lookup

### Phase 3 Enhancements (Months 5-6)

1. **Planning Integration**
   - Push MARM updates back to S/4HANA based on drift trends
   - Integrated Business Planning (IBP) connection
   - Safety stock optimization based on variance patterns

2. **Financial Integration**
   - Automated journal entries for margin erosion
   - Month-end close acceleration
   - Variance reporting to Finance

---

## Appendix A: SQL Cheat Sheet (PostgreSQL → HANA)

| PostgreSQL | HANA SQL | Notes |
|-----------|----------|-------|
| `LIMIT 10` | `LIMIT 10` or `TOP 10` | Both work in recent HANA |
| `OFFSET 5` | `LIMIT 10 OFFSET 5` | Same syntax |
| `NOW()` | `CURRENT_TIMESTAMP` | Preferred in HANA |
| `CURRENT_DATE` | `CURRENT_DATE` | Same |
| `TO_CHAR(date, 'YYYY-MM-DD')` | `TO_VARCHAR(date, 'YYYY-MM-DD')` | Function name change |
| `EXTRACT(YEAR FROM date)` | `YEAR(date)` | Simpler function |
| `STRING_AGG(col, ',')` | `STRING_AGG(col, ',')` | Same (HANA 2.0 SPS03+) |
| `REGEXP_REPLACE` | `REPLACE_REGEXPR` | Different function name |
| `COALESCE` | `COALESCE` or `IFNULL` | Same |
| `NULLIF` | `NULLIF` | Same |
| `GREATEST(a,b)` | `GREATEST(a,b)` | Same |
| `RANDOM()` | `RAND()` | Function name change |

---

## Appendix B: BDC OData API Examples

**Endpoint:** `https://<tenant>.us1.hcs.cloud.sap/api/v1/dwc/consumption/relational/<space>/v_weight_drift_trend`

**Example 1: Get all records (with pagination)**
```http
GET /api/v1/dwc/consumption/relational/SAP_S4_CATCHWEIGHT_ANALYTICS/v_weight_drift_trend?$top=100&$skip=0
Authorization: Bearer <token>

Response:
{
  "value": [
    {
      "material_id": "CHKBRST-001",
      "plant_id": "P001",
      "posting_date": "2026-03-01",
      "drift_lb": 2.5,
      "drift_pct": 0.12,
      "financial_exposure_usd": 8.75
    },
    ...
  ],
  "@odata.nextLink": "...?$skip=100"
}
```

**Example 2: Filter by date range**
```http
GET /api/v1/dwc/.../v_weight_drift_trend?$filter=posting_date ge '2026-02-01' and posting_date le '2026-02-28'
```

**Example 3: Aggregation**
```http
GET /api/v1/dwc/.../v_weight_drift_trend?$apply=groupby((material_id), aggregate(financial_exposure_usd with sum as total_exposure))&$orderby=total_exposure desc&$top=10
```

---

**End of Technical Implementation Guide**

*For questions or clarifications, contact the BDC implementation team.*
