# SAP S/4HANA Catch Weight POC: Architecture & Process Flow

## Database Schema Design: Replicating S/4HANA CWM

The backend PostgreSQL database has been carefully architected to mirror the core SAP S/4HANA tables that support Catch Weight Material (CWM) management. We replicated five essential SAP tables with their authentic field structures and relationships:

**MARA (Material Master)** serves as the foundation, defining which materials are catch-weight enabled through the `catch_weight_flag` field. This boolean indicator is critical in S/4HANA as it determines whether a material requires parallel unit-of-measure tracking. Our POC includes 13 catch-weight materials representing real-world scenarios like chicken breasts (CHKBRST-001), beef strips (BFSTRP-010), and pork ribs (PRKRIB-004) – all materials where the actual weight varies significantly from case counts.

**MARM (Material UoM Conversions)** stores the conversion factors between base units (cases) and parallel units (pounds). In S/4HANA CWM, these conversion factors represent the *expected* or *average* weight per case. For example, a case of chicken wings might have a conversion factor of 30.1 pounds per case. This expected weight becomes the baseline against which actual receipts are measured, creating the variance that drives our analytics.

**MKPF (Material Document Headers)** and **MSEG (Material Document Segments)** form the transactional backbone, mirroring S/4HANA's goods movement architecture. Each transaction captures both `quantity_base_uom` (case count) and `quantity_parallel_uom` (actual weighed pounds), demonstrating the dual-quantity paradigm that defines catch-weight processing. The headers (MKPF) contain document-level metadata like posting dates and user IDs, while segments (MSEG) contain the line-item details including material, plant, storage location, batch, and critically – both quantities in both units of measure.

**MBEW (Material Valuation)** provides the financial pricing foundation, storing both standard prices (S) and moving average prices (V) per material and plant. This table enables the POC to calculate the financial impact of weight variances – when actual weight differs from expected weight, there's a direct monetary consequence that affects inventory valuation and margin calculations.

## Process Flow: From Raw Tables to Executive Analytics

The journey from raw S/4HANA-style tables to executive-ready analytics follows a carefully designed three-layer architecture that mirrors best practices in SAP Business Data Cloud (BDC) and modern data product thinking.

**Layer 1: Foundation Views** establish the analytical baseline. The `v_inventory_rebuild` view demonstrates a critical S/4HANA concept: reconstructing current inventory positions by summing all material document movements. Rather than trusting a single balance table, this view aggregates MSEG transactions to compute the "source of truth" stock levels. This reconstruction approach is essential for catch-weight scenarios where discrepancies between expected and actual quantities must be systematically tracked and reconciled. The `v_inventory_valuation` view then layers financial intelligence onto these quantities, applying either standard or moving average prices based on the valuation strategy defined in MBEW.

**Layer 2: Data Products** transform foundation data into business-relevant insights through two distinct but complementary analytics:

**Data Product 1: Weight Drift Trend** (`v_weight_drift_trend`) measures forecast accuracy at the point of receipt. For each goods receipt (movement type 101), it calculates the *expected weight* using the MARM conversion factor (planning baseline: 25 LB/CS), compares it to the *actual weight* recorded on the scale, and computes drift percentage and financial exposure. This answers the question: "How accurate is our planning data? Are suppliers consistently over/under-delivering relative to our expected weights?" MARM serves as the planning benchmark – the weight we *expected* based on historical averages and master data.

**Data Product 2: Margin Erosion** (`v_margin_erosion`) measures operational variance at the point of issue. **Critical distinction**: This data product does NOT use MARM conversions. Instead, it uses **batch-tracked actual receipt weights** as the baseline. Here's the logic:
- When batch B20260225 is received: 125 CS at 3,134.75 LB = **25.078 LB/CS actual**
- When we issue 10 CS from batch B20260225, expected weight = 10 × 25.078 = **250.78 LB** (from what we actually received)
- If actual issue weight = 250.80 LB, then erosion = +0.02 LB = **$0.07 margin loss**

The key insight: **"There is no 'conversion logic' for one UOM to another in catchweight other than to use the stored actual weight. Each logistical unit has its own specific weight captured."** Once material is received and weighed, that batch's actual weight per case becomes the operational truth. MARM is planning-only. Margin erosion measures: "Are we shipping more/less weight than we actually received in this batch?" This reveals inventory shrinkage, handling variance, and operational inefficiencies separate from planning accuracy.

**Layer 3: SAC Dashboard** provides executive visualization of these data products through a modern, responsive web interface styled after SAP Analytics Cloud. The dashboard doesn't just display charts – it tells a story. Executive summary KPI cards provide at-a-glance metrics: total transactions, financial exposure, margin erosion, and average drift percentage. The Weight Drift Trend section features an area chart showing drift patterns over time, helping identify systematic issues (e.g., consistent over-receipt from a specific supplier), alongside a horizontal bar chart ranking materials by financial exposure. The Margin Erosion section uses a pie chart to show which materials contribute most to margin loss, complemented by a detailed ranked list with progress bars. Every chart is interactive, every metric is contextualized, and every visualization is designed for decision-making, not just observation.

## From POC to Production: The BDC Implementation Path

This POC architecture directly maps to production-scale SAP Business Data Cloud implementation with minimal translation. The five PostgreSQL tables would be replicated from S/4HANA via standard CDS views or SLT/Datasphere replication, maintaining the same schema we've validated in this proof of concept. The three analytical views (inventory rebuild, weight drift, margin erosion) would be recreated as BDC SQL views or calculation views, with identical logic but production-scale performance optimizations like partitioning and indexing strategies.

The critical insight is that BDC treats these views as *Data Products* – semantically rich, governed, discoverable assets with defined refresh schedules, quality metrics, and access policies. In production, `v_weight_drift_trend` wouldn't just be a view; it would be a published Data Product with metadata describing its purpose ("tracks weight variance from baseline"), ownership (supply chain analytics team), refresh frequency (real-time or hourly), and consumer applications (SAC, Snowflake, custom APIs). This transforms raw S/4HANA data into trusted, business-ready analytics that scale from proof-of-concept to enterprise deployment without architectural rework.

The SAC dashboard demonstrated in this POC uses the Recharts library to achieve an SAC-like aesthetic, but in production, these same data products would be consumed by actual SAP Analytics Cloud stories, leveraging live data connections to BDC. The visualizations, KPIs, and analytical narratives proven in this POC translate directly to SAC widgets, maintaining the same business logic and user experience while gaining SAC's enterprise features like scheduled distribution, mobile access, planning integration, and augmented analytics powered by Business AI.

## Technical Innovation: Why This Approach Works

The elegance of this architecture lies in its separation of concerns and progressive value addition. Raw S/4HANA tables remain untouched and unmodified – we're not changing core ERP behavior. Foundation views provide a reconciliation and valuation layer that could serve multiple analytical use cases. Data products add business semantics specific to catch-weight challenges: drift, exposure, erosion. The dashboard provides decision-support visualization. Each layer is independently valuable, testable, and replaceable without disrupting others.

Most importantly, this POC validates that complex catch-weight analytics – traditionally requiring custom ABAP reports, batch jobs, and manual Excel analysis – can be delivered as real-time, self-service data products. Supply chain managers don't need to wait for month-end reports to understand weight variance trends. Finance teams can quantify margin erosion daily instead of quarterly. Procurement can identify problematic vendors or materials immediately. This shift from reactive reporting to proactive analytics represents the core value proposition of modern data architecture applied to classic ERP challenges.
