# Realistic Catch Weight Data - Tyson Scenarios

## Overview

The seed data has been updated with realistic weight variances that Tyson would actually see in real-world operations.

## Key Changes from Original Data

### 1. **Realistic Variance Ranges**

| Product Type | MARM Baseline | Actual Variance Range | Industry Standard |
|-------------|---------------|----------------------|-------------------|
| **Chicken** | 25-40 LB/CS | **±2-4%** | Biological variation in bird sizes |
| **Pork** | 18-35 LB/CS | **±3-6%** | Bone-in cuts have higher variance |
| **Beef** | 20-45 LB/CS | **±4-8%** | Premium cuts vary significantly |
| **Value-Added** | 12-15 LB/CS | **±1-3%** | More consistent (processed/portioned) |

### 2. **Supplier Patterns** (Real-World Behavior)

#### **Supplier A (Premium - Over-delivers)**
- Chicken Breast: **+2.6% to +2.9%** drift
- Chicken Wings: **+2.8% to +3.2%** drift
- Chicken Thighs: **+3.3%** drift
- **Pattern:** Consistently delivers 2-3% over target weight
- **Business Impact:** Better than expected, good supplier relationship

#### **Supplier B (Budget - Under-delivers)**
- Chicken Breast: **-3.0% to -3.4%** drift
- Chicken Tenders: **-3.0%** drift
- Whole Chickens: **-3.0%** drift (smaller birds)
- **Pattern:** Consistently delivers 3% under target weight
- **Business Impact:** Cost savings but lower quality/size

#### **Supplier C (Pork - High Variance)**
- Pork Ribs: **+5.1%** drift (bone-in, variable trimming)
- Pork Chops: **-4.7%** drift
- Pork Sausage: **+3.6%** drift
- **Pattern:** 3-6% variance typical for bone-in pork
- **Business Impact:** Need better forecasting, inventory planning

#### **Supplier D (Beef - Premium Cuts)**
- Ground Beef: **+7.3% to +8.0%** drift
- Strip Steaks: **-4.0%** drift (premium trim removes weight)
- Beef Patties: **+7.5%** drift
- **Pattern:** 4-8% variance due to cut quality and trimming
- **Business Impact:** Highest variance, premium pricing justifies

### 3. **Margin Erosion Scenarios** (Real Shrinkage)

#### **Storage & Handling Loss:**
- **Chicken (Premium batch):** -1.0% shrinkage during storage
- **Chicken (Budget batch):** -1.7% shrinkage (lower quality loses more)
- **Chicken Wings:** -0.8% loss to production
- **Pork Ribs:** -2.2% loss (bone drying in cold storage)
- **Beef Strip Steaks:** -1.6% moisture loss

#### **Inventory Shrinkage:**
- **Chicken Wings:** -16% physical count shrinkage (20 CS missing)
  - Realistic scenario: 2 weeks of spoilage/waste
- **Ground Beef:** -1.0% moisture loss during cold storage
  - Realistic scenario: Natural moisture evaporation

### 4. **Financial Impact Examples**

#### **Weight Drift (Planning Accuracy):**

**Supplier A - Chicken Breast (150 CS)**
- Expected: 150 CS × 25.0 LB/CS = 3,750 LB
- Actual: 3,847.50 LB
- Drift: **+97.5 LB (+2.6%)**
- Financial Exposure: 97.5 LB × $3.25/LB = **+$316.88**
- **Interpretation:** Got more than planned - GOOD!

**Supplier B - Chicken Breast (180 CS)**
- Expected: 180 CS × 25.0 LB/CS = 4,500 LB
- Actual: 4,347.00 LB
- Drift: **-153 LB (-3.4%)**
- Financial Exposure: -153 LB × $3.25/LB = **-$497.25**
- **Interpretation:** Got less than planned - need to adjust MARM or negotiate

**Beef Supplier D - Ground Beef (80 CS)**
- Expected: 80 CS × 20.0 LB/CS = 1,600 LB
- Actual: 1,716.00 LB
- Drift: **+116 LB (+7.3%)**
- Financial Exposure: 116 LB × $5.20/LB = **+$603.20**
- **Interpretation:** Significant over-delivery - verify scale calibration

#### **Margin Erosion (Operational Loss):**

**Chicken Breast - Premium Supplier A**
- Received: 50 CS @ 25.65 LB/CS = 1,282.50 LB
- Issued: 50 CS @ 25.40 LB/CS = 1,270.00 LB
- Erosion: **-12.5 LB (-1.0%)**
- Margin Loss: 12.5 LB × $3.25/LB = **-$40.63**
- **Root Cause:** Normal cold storage moisture loss

**Chicken Breast - Budget Supplier B**
- Received: 60 CS @ 24.15 LB/CS = 1,449.00 LB
- Issued: 60 CS @ 23.75 LB/CS = 1,425.00 LB
- Erosion: **-24 LB (-1.7%)**
- Margin Loss: 24 LB × $3.25/LB = **-$78.00**
- **Root Cause:** Lower quality product loses more weight in storage

**Chicken Wings - Spoilage**
- Received: 125 CS @ 30.85 LB/CS = 3,856.25 LB
- Found in inventory: 105 CS @ 30.85 LB/CS = 3,239.25 LB
- Loss: **20 CS / 617 LB (-16%)**
- Margin Loss: 617 LB × $2.10/LB = **-$1,295.70**
- **Root Cause:** Spoilage/waste over 2-week period - investigate!

### 5. **Data Product Insights**

#### **Weight Drift Trend Dashboard Will Show:**
- Supplier A consistently over-delivers (+2.6% to +3.3%)
- Supplier B consistently under-delivers (-2.9% to -3.4%)
- Pork has highest variance (±3-6%)
- Beef premium cuts have highest variance (±4-8%)
- Action: Update MARM baselines based on actual supplier performance

#### **Margin Erosion Dashboard Will Show:**
- Budget suppliers have higher shrinkage rates (-1.7% vs -1.0%)
- Bone-in products (pork ribs) lose more weight (-2.2%)
- Spoilage is a significant issue (chicken wings: -16%)
- Action: Improve cold storage practices, faster inventory turnover

## Business Recommendations

### Immediate Actions:
1. **Negotiate with Supplier B:** Either improve quality or adjust pricing for 3% under-delivery
2. **Investigate chicken wings spoilage:** 16% loss is unacceptable
3. **Update MARM baselines:** Supplier A = 25.7 LB/CS, Supplier B = 24.2 LB/CS

### Strategic Actions:
1. **Supplier Scorecard:** Track drift % by supplier for performance reviews
2. **Inventory Velocity:** Faster turnover reduces shrinkage (especially for wings)
3. **Cold Storage Audit:** Investigate why budget chicken has 70% higher shrinkage
4. **Scale Calibration:** Verify beef supplier (+7-8% seems high)

## Timeline

The data now spans **3 weeks** (Feb 18 - Mar 7, 2026) with realistic transaction patterns:
- **Week 1 (Feb 18-21):** Early receipts showing initial supplier patterns
- **Week 2 (Feb 24-28):** Mix of receipts and first goods issues
- **Week 3 (Mar 3-7):** Current week with inventory adjustments

This provides enough data for meaningful trend analysis while keeping the dataset manageable.

## How to Load

1. **Via API:** `POST /v1/seed` (endpoint already configured)
2. **Via SQL:** Run `/Users/I870089/CatchWeight/backend/sql/004_seed.sql`

The new seed file will clear all existing data and load realistic Tyson scenarios.

---

**Summary:** The data now reflects real-world catch weight challenges that Tyson actually faces, making the POC much more credible for executive presentations.
