# Catch Weight Analytics: Weight Drift vs. Margin Erosion

## Executive Summary

This POC implements two distinct but complementary catch weight analytics. Understanding the difference is critical to interpreting the metrics correctly.

---

## The Two Data Products

### 📊 Data Product 1: Weight Drift Trend
**Purpose**: Measures forecast accuracy
**Baseline**: MARM conversion factors (planning data)
**Movement Types**: 101 (Goods Receipts)
**Question Answered**: "How accurate is our planning data?"

#### Logic Flow:
1. **Expected Weight** = Quantity (CS) × MARM Conversion Factor
   - Example: 10 CS × 25.0 LB/CS (from MARM) = 250.0 LB expected
2. **Actual Weight** = Quantity recorded on scale at receipt
   - Example: 250.5 LB actual
3. **Drift** = Actual - Expected
   - Example: 250.5 - 250.0 = +0.5 LB drift (+0.2% variance)
4. **Financial Exposure** = Drift × Unit Price
   - Example: 0.5 LB × $3.45/LB = $1.73 exposure

#### Business Value:
- Identifies suppliers consistently over/under-delivering
- Highlights materials with poor forecast accuracy
- Helps procurement update master data (MARM) with better conversion factors
- Measures planning quality, not operational efficiency

---

### 💰 Data Product 2: Margin Erosion
**Purpose**: Measures operational variance
**Baseline**: Batch-tracked actual receipt weights
**Movement Types**: 601 (Customer Sales), 261 (Production Issues)
**Question Answered**: "Are we shipping more/less than we received?"

#### Logic Flow:
1. **Calculate Batch Average** from receipts (movement type 101):
   - Batch B20260225 received: 125 CS at 3,134.75 LB
   - Batch average = 3,134.75 ÷ 125 = **25.078 LB/CS actual**
2. **Expected Shipped Weight** = Quantity × Batch Average
   - Example: 10 CS × 25.078 LB/CS = 250.78 LB expected
3. **Actual Shipped Weight** = Quantity recorded on scale at issue
   - Example: 250.80 LB actual
4. **Erosion** = Actual Shipped - Expected Shipped
   - Example: 250.80 - 250.78 = +0.02 LB erosion
5. **Margin Impact** = Erosion × Unit Price
   - Example: 0.02 LB × $3.45/LB = **$0.07 margin loss**

#### Critical Distinction:
**❌ WRONG**: Compare issue to MARM (planning baseline)
**✅ CORRECT**: Compare issue to batch receipt actuals

**Why?** As you correctly stated: *"There is no 'conversion logic' for one UOM to another in catchweight other than to use the stored actual weight. Each logistical unit has its own specific weight captured."*

MARM is for planning. Once material is received and weighed, that batch's actual weight becomes operational truth.

#### Business Value:
- Detects inventory shrinkage (lost weight during storage/handling)
- Identifies operational inefficiencies (spillage, evaporation, trimming)
- Measures weight variance separate from planning accuracy
- Quantifies margin impact of shipping more/less than received

---

## Real-World Example

### Scenario: CHKBRST-001 (Chicken Breasts)

**MARM Master Data** (Planning):
- 1 CS = 25.0 LB (conversion factor)

**Receipt Transaction** (Batch B20260225):
- Received: 125 CS
- Actual weight: 3,134.75 LB
- Batch average: **25.078 LB/CS**

**Analysis**:

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Weight Drift** | +0.078 LB/CS | 25.078 actual - 25.0 MARM |
| **Drift %** | +0.31% | 0.078 ÷ 25.0 × 100 |
| **Exposure** | +$33.66 | 125 CS × 0.078 LB × $3.45/LB |

*Interpretation*: Supplier delivered 0.31% heavier than planning baseline. Good news – we got more than expected!

**Issue Transaction** (Sales to Customer):
- Issued: 10 CS from batch B20260225
- Expected: 250.78 LB (10 × 25.078 batch average)
- Actual: 250.80 LB
- Erosion: +0.02 LB

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Margin Erosion** | $0.07 | 0.02 LB × $3.45/LB |
| **Erosion %** | +0.008% | 0.02 ÷ 250.78 × 100 |

*Interpretation*: We shipped 0.02 LB more than we received (per this issue). Margin loss: $0.07. Likely operational variance (trimming, handling).

---

## Key Takeaways

1. **Weight Drift = Planning Accuracy**
   Baseline: MARM conversion factors
   Measures: Supplier delivery vs. forecast

2. **Margin Erosion = Operational Efficiency**
   Baseline: Batch-tracked receipt actuals
   Measures: Issue variance vs. what was actually received

3. **MARM is Planning-Only**
   Once material is received and weighed, use batch actuals
   MARM should NOT be used for margin erosion calculations

4. **Positive Drift ≠ Positive Margin**
   - Positive drift = received more than MARM expected (good for inventory)
   - Positive erosion = shipped more than received (bad for margin)

5. **Both Metrics Matter**
   - Weight drift improves procurement/planning
   - Margin erosion improves operations/handling

---

## SQL Implementation

### Weight Drift (uses MARM):
```sql
SELECT
    seg.quantity_base_uom AS qty_cases,
    seg.quantity_base_uom * marm.conversion_factor AS expected_weight_lb,  -- MARM
    ABS(seg.quantity_parallel_uom) AS actual_weight_lb,                    -- Scale
    (ABS(seg.quantity_parallel_uom) - seg.quantity_base_uom * marm.conversion_factor) AS drift_lb
FROM mseg seg
JOIN marm ON seg.material_id = marm.material_id
WHERE seg.movement_type = '101'  -- Receipts
```

### Margin Erosion (uses batch actuals):
```sql
WITH batch_receipt_weights AS (
    -- Calculate actual average from receipts
    SELECT
        material_id, plant_id, storage_location, batch_id,
        SUM(quantity_parallel_uom) / NULLIF(SUM(quantity_base_uom), 0) AS batch_avg_weight_per_case
    FROM mseg
    WHERE movement_type = '101'  -- Receipts
    GROUP BY material_id, plant_id, storage_location, batch_id
)
SELECT
    seg.quantity_base_uom AS qty_cases,
    ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case AS expected_shipped_lb,  -- Batch actual
    ABS(seg.quantity_parallel_uom) AS actual_shipped_lb,                                 -- Scale
    (ABS(seg.quantity_parallel_uom) - ABS(seg.quantity_base_uom) * brw.batch_avg_weight_per_case) AS erosion_lb
FROM mseg seg
JOIN batch_receipt_weights brw ON seg.batch_id = brw.batch_id
WHERE seg.movement_type IN ('601', '261')  -- Issues
```

---

## For Your Internal Team Email

Use this simplified explanation:

> **Weight Drift** tells us if suppliers are delivering what we planned for (compares receipts to MARM baseline).
>
> **Margin Erosion** tells us if we're shipping more/less weight than we actually received (compares issues to batch receipt actuals).
>
> Think of it as: *Did we get what we expected?* (drift) vs. *Did we ship what we got?* (erosion)
