#!/bin/bash
# Run admin and forecasting migrations

echo "🔄 Running admin and forecasting migrations..."

cd /Users/I870089/CatchWeight/backend

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please set it first:"
    echo "   export DATABASE_URL='your_postgres_connection_string'"
    exit 1
fi

# Run admin audit log migration
echo "📊 Creating admin_audit_log table..."
psql "$DATABASE_URL" -f sql/007_admin_audit.sql

if [ $? -ne 0 ]; then
    echo "❌ Error creating admin audit table"
    exit 1
fi

# Run forecasting views migration
echo "🔮 Creating forecasting views..."
psql "$DATABASE_URL" -f sql/008_forecasting_views.sql

if [ $? -ne 0 ]; then
    echo "❌ Error creating forecasting views"
    exit 1
fi

echo "✅ Migrations completed successfully!"
echo ""
echo "📊 Created:"
echo "  - admin_audit_log table"
echo "  - v_supplier_performance_profile view"
echo "  - v_reorder_recommendations view"
echo "  - v_margin_erosion_daily view"
echo "  - v_forecasting_summary view"
