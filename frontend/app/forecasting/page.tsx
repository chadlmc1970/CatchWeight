'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { DashboardGrid, GridCell, ChartCard, CompactKPICard } from '@/components/dashboard';

interface SupplierPerformance {
  material_id: string;
  supplier_code: string;
  receipt_count: number;
  avg_drift_pct: number;
  drift_volatility: number;
  reliability_score: number;
  forecast_range: { min: number; max: number };
  financial_exposure: number;
}

interface ReorderAlert {
  material_id: string;
  plant_id: string;
  storage_location: string;
  current_stock: number;
  avg_daily_consumption: number;
  last_movement_date: string | null;
  days_of_stock_remaining: number | null;
  alert_level: string;
}

interface MarginTrend {
  historical: Array<{ date: string; erosion: number; avg_erosion_pct: number; transaction_count: number }>;
  forecast: Array<{
    date: string;
    predicted_erosion: number;
    confidence_lower: number;
    confidence_upper: number;
    confidence: string;
  }>;
  forecast_method: string;
  forecast_days: number;
}

interface ForecastingSummary {
  total_suppliers: number;
  worst_reliability_score: number;
  best_reliability_score: number;
  avg_reliability: number;
  total_materials_tracked: number;
  critical_alerts: number;
  warning_alerts: number;
  next_reorder_in_days: number | null;
  avg_daily_erosion: number;
  total_erosion_90days: number;
  high_risk_suppliers: number;
  total_exposure: number;
}

export default function ForecastingPage() {
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [marginTrend, setMarginTrend] = useState<MarginTrend | null>(null);
  const [summary, setSummary] = useState<ForecastingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical'>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [suppliers, alerts, margin, summaryData] = await Promise.all([
          apiFetch<SupplierPerformance[]>('/v1/forecasting/supplier-performance'),
          apiFetch<ReorderAlert[]>('/v1/forecasting/reorder-alerts'),
          apiFetch<MarginTrend>('/v1/forecasting/margin-trend'),
          apiFetch<ForecastingSummary>('/v1/forecasting/summary'),
        ]);

        setSupplierPerformance(suppliers);
        setReorderAlerts(alerts);
        setMarginTrend(margin);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching forecasting data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading AI Insights...</div>
        </div>
      </div>
    );
  }

  const chartHeight = 'compact';

  // Prepare chart data - WORST performers = lowest reliability scores (ascending sort)
  const sortedByReliability = [...supplierPerformance].sort(
    (a, b) => a.reliability_score - b.reliability_score
  );

  // Prepare chart data with proper overlap for seamless line transition
  const combinedMarginData = [
    // Historical data points
    ...(marginTrend?.historical || []).map((h: any) => ({
      date: h.date,
      historical: h.erosion,
      forecast: null,
    })),
    // Overlap point - last historical value shown as first forecast point
    ...((marginTrend?.historical?.length ?? 0) > 0
      ? [{
          date: marginTrend!.historical[marginTrend!.historical.length - 1].date,
          historical: null,
          forecast: marginTrend!.historical[marginTrend!.historical.length - 1].erosion,
        }]
      : []
    ),
    // Forecast data points
    ...(marginTrend?.forecast || []).map((f: any) => ({
      date: f.date,
      historical: null,
      forecast: f.predicted_erosion,
    })),
  ];

  const criticalAlerts = reorderAlerts.filter(a => a.alert_level === 'CRITICAL');
  const warningAlerts = reorderAlerts.filter(a => a.alert_level === 'WARNING');
  const displayAlerts = alertFilter === 'critical' ? criticalAlerts : reorderAlerts;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with KPIs */}
      <div className="bg-white border-b border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">✨ AI Insights & Forecasting</h1>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Compact KPIs - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompactKPICard
            icon="🎯"
            value={`${(summary?.avg_reliability || 0).toFixed(1)}%`}
            label="Avg Supplier Reliability"
            status={
              (summary?.avg_reliability || 0) > 90
                ? 'success'
                : (summary?.avg_reliability || 0) > 70
                ? 'warning'
                : 'danger'
            }
          />
          <CompactKPICard
            icon="⚠️"
            value={summary?.critical_alerts || 0}
            label="Critical Reorder Alerts"
            status="danger"
          />
          <CompactKPICard
            icon="📉"
            value={`$${((summary?.avg_daily_erosion || 0) * 1).toFixed(0)}`}
            label="Avg Daily Erosion"
            status="warning"
          />
        </div>
      </div>

      {/* 2x2 Dashboard Grid */}
      <div className="p-6">
        <DashboardGrid cols={2} rows={2} gap={4}>
          {/* Supplier Reliability - Top 10 Risk */}
          <GridCell>
            <ChartCard
              title="Supplier Reliability - Top 10 Risk"
              height={chartHeight}
              infoText="The 10 suppliers with lowest reliability scores based on historical weight variance patterns. Red bars (<70%) indicate high risk requiring immediate attention."
            >
              <div className="space-y-2 h-full overflow-y-auto pr-2">
                {sortedByReliability.slice(0, 10).map((supplier, idx) => (
                  <div key={`${supplier.material_id}-${supplier.supplier_code}`} className="flex items-center gap-3">
                    <div className="w-6 text-xs text-slate-500 font-mono">#{idx + 1}</div>
                    <div className="min-w-fit text-xs font-medium text-slate-900">
                      {supplier.supplier_code}
                    </div>
                    <div className="min-w-fit text-xs text-slate-600 font-mono">
                      {supplier.material_id}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-7 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-end px-2 text-xs font-semibold transition-all ${
                            supplier.reliability_score > 90
                              ? 'bg-green-500 text-white'
                              : supplier.reliability_score > 70
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                          style={{ width: `${supplier.reliability_score}%` }}
                        >
                          {supplier.reliability_score.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs text-slate-600">
                      ${(supplier.financial_exposure / 1000).toFixed(0)}k
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </GridCell>

          {/* Margin Erosion Forecast */}
          <GridCell>
            <ChartCard
              title="Margin Erosion: Historical & Forecast"
              height={chartHeight}
              infoText="Daily margin impact from weight variance. Historical data (red solid) shows actual losses. Forecast (blue dashed) projects 30-day trend using exponential smoothing with natural volatility. Negative values = cost to business."
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedMarginData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Daily Impact ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string | undefined) => [
                      value ? `$${value.toFixed(2)}` : null,
                      name === 'historical' ? 'Actual' : 'Predicted'
                    ]}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="line"
                    formatter={(value: any) => value === 'historical' ? 'Historical (Actual)' : 'Forecast (Predicted)'}
                  />
                  {/* Reference line at forecast start */}
                  {marginTrend?.historical && marginTrend.historical.length > 0 && (
                    <ReferenceLine
                      x={marginTrend.historical[marginTrend.historical.length - 1].date}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      label={{ value: 'Today', position: 'top', fontSize: 10, fill: '#64748b' }}
                    />
                  )}
                  {/* Historical line - solid red */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="historical"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                  {/* Forecast line - dashed blue */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="forecast"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </GridCell>

          {/* Reorder Alerts - Scrollable */}
          <GridCell>
            <ChartCard
              title="Inventory Reorder Alerts"
              height="auto"
              infoText="Materials at risk of stockout using consumption-based forecasting. Critical alerts (<7 days) require immediate action to prevent production disruptions."
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={() => setAlertFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      alertFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    All ({reorderAlerts.length})
                  </button>
                  <button
                    onClick={() => setAlertFilter('critical')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      alertFilter === 'critical'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Critical ({criticalAlerts.length})
                  </button>
                </div>
              }
            >
              <div className="flex flex-col space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {displayAlerts.length > 0 ? (
                  displayAlerts.map((alert) => (
                    <div
                      key={`${alert.material_id}-${alert.plant_id}-${alert.storage_location}`}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.alert_level === 'CRITICAL'
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-semibold text-sm text-slate-900">
                          {alert.material_id}
                        </div>
                        <div
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            alert.alert_level === 'CRITICAL'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {alert.alert_level}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div>Stock: {alert.current_stock.toFixed(0)} units</div>
                        <div>
                          Days Remaining:{' '}
                          <span className="font-semibold">
                            {alert.days_of_stock_remaining?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {alert.plant_id} / {alert.storage_location}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No alerts to display
                  </div>
                )}
              </div>
            </ChartCard>
          </GridCell>

          {/* Variance Predictions Summary */}
          <GridCell>
            <ChartCard
              title="Weight Variance Predictions"
              height="auto"
              infoText="Summary statistics for predicted weight drift ranges across all supplier-material combinations. Shows high-risk suppliers requiring contract renegotiation."
            >
              <div className="flex flex-col space-y-3">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Total Suppliers Tracked</div>
                  <div className="text-3xl font-bold text-slate-900">
                    {summary?.total_suppliers || 0}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Materials Under Monitoring</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {summary?.total_materials_tracked || 0}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-sm text-red-700 mb-1">High-Risk Suppliers</div>
                  <div className="text-2xl font-bold text-red-600">
                    {summary?.high_risk_suppliers || 0}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Reliability {'<'} 70%
                  </div>
                </div>
              </div>
            </ChartCard>
          </GridCell>
        </DashboardGrid>
      </div>
    </div>
  );
}
