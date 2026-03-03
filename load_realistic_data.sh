#!/bin/bash
# Load realistic Tyson seed data

echo "🔄 Loading realistic catch weight data..."

cd /Users/I870089/CatchWeight/backend

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please set it first:"
    echo "   export DATABASE_URL='your_postgres_connection_string'"
    exit 1
fi

# Run the seed SQL
psql "$DATABASE_URL" -f sql/004_seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Realistic data loaded successfully!"
    echo ""
    echo "📊 Summary:"
    echo "  - 3 weeks of transactions (Feb 18 - Mar 7, 2026)"
    echo "  - 4 suppliers with distinct variance patterns:"
    echo "    • Supplier A (Premium): +2-3% over-delivery"
    echo "    • Supplier B (Budget): -3% under-delivery"
    echo "    • Supplier C (Pork): ±3-6% variance"
    echo "    • Supplier D (Beef): ±4-8% variance"
    echo "  - Realistic shrinkage scenarios (1-3%)"
    echo "  - 16% spoilage event (chicken wings)"
    echo ""
    echo "📄 See REALISTIC_DATA_GUIDE.md for details"
else
    echo "❌ Error loading data"
    exit 1
fi
