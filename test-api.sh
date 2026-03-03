#!/bin/bash
# CatchWeight API Test Script
# Tests all data product endpoints

set -e

BASE_URL="http://localhost:8000"

echo "🧪 CatchWeight API Test Suite"
echo "=============================="
echo ""

# Check if API is running
echo "1. Testing health endpoint..."
curl -sf "$BASE_URL/health" > /dev/null && echo "   ✅ API is healthy" || { echo "   ❌ API is not running. Start it first!"; exit 1; }
echo ""

# Weight Drift
echo "2. Testing Weight Drift endpoints..."
echo "   📊 Weight Drift data (top 3):"
curl -s "$BASE_URL/v1/dataproducts/weight-drift?limit=3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for r in data:
    print(f\"      • {r['material_id']}: {r['qty_cases']:.0f} CS, Drift: {r['drift_pct']:.2f}%, \${r['financial_exposure_usd']:.2f}\")
"

echo ""
echo "   📈 Weight Drift summary:"
curl -s "$BASE_URL/v1/dataproducts/weight-drift/summary" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"      Total transactions: {data['total_transactions']}\")
print(f\"      Total drift: {data['total_drift_lb']:.2f} LB\")
print(f\"      Avg drift: {data['avg_drift_pct']:.2f}%\")
print(f\"      Financial exposure: \${data['total_financial_exposure']:.2f}\")
"

echo ""
echo "   📊 Weight Drift by material (top 3):"
curl -s "$BASE_URL/v1/dataproducts/weight-drift/by-material" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for r in data[:3]:
    print(f\"      • {r['material_id']}: {r['transaction_count']} txns, Avg: {r['avg_drift_pct']:.2f}%, \${r['total_exposure']:.2f}\")
"

echo ""
echo ""

# Margin Erosion
echo "3. Testing Margin Erosion endpoints..."
echo "   💸 Margin Erosion data:"
curl -s "$BASE_URL/v1/dataproducts/margin-erosion" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"      Found {len(data)} records:\")
for r in data:
    print(f\"      • {r['material_id']}: {abs(r['qty_cases']):.0f} CS\")
    print(f\"        Expected: \${r['expected_margin_usd']:.2f}, Actual: \${r['actual_margin_usd']:.2f}\")
    print(f\"        Erosion: \${r['margin_erosion_usd']:.2f} ({r['erosion_pct']:.2f}%)\")
"

echo ""
echo "   📈 Margin Erosion summary:"
curl -s "$BASE_URL/v1/dataproducts/margin-erosion/summary" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"      Total transactions: {data['total_transactions']}\")
print(f\"      Total erosion: \${data['total_margin_erosion']:.2f}\")
print(f\"      Avg erosion: {data['avg_erosion_pct']:.2f}%\")
"

echo ""
echo ""
echo "✅ All tests passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the frontend: cd frontend && npm install && npm run dev"
echo "   2. View the API docs: open http://localhost:8000/docs"
echo "   3. Check the setup guide: cat SETUP_COMPLETE.md"
