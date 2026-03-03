'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { apiFetch } from '@/lib/api';

// Info Icon Component
function InfoIcon({ explanation }: { explanation: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="inline-block relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-bold transition-colors cursor-pointer"
        aria-label="Information"
      >
        i
      </button>
      {isExpanded && (
        <div className="absolute z-10 mt-2 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

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
  avg_reliability_score: number;
  total_materials_tracked: number;
  critical_alerts: number;
  warning_alerts: number;
  next_reorder_in_days: number | null;
  avg_daily_erosion: number;
  total_erosion_90days: number;
}

export default function ForecastingPage() {
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [marginTrend, setMarginTrend] = useState<MarginTrend | null>(null);
  const [summary, setSummary] = useState<ForecastingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [suppliers, alerts, trend, summaryData] = await Promise.all([
          apiFetch<SupplierPerformance[]>('/v1/forecasting/supplier-performance'),
          apiFetch<ReorderAlert[]>('/v1/forecasting/reorder-alerts'),
          apiFetch<MarginTrend>('/v1/forecasting/margin-trend?forecast_days=30'),
          apiFetch<ForecastingSummary>('/v1/forecasting/summary'),
        ]);

        setSupplierPerformance(suppliers);
        setReorderAlerts(alerts);
        setMarginTrend(trend);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading Forecasting Dashboard...</div>
        </div>
      </div>
    );
  }

  // Find top risk and best performer
  const sortedByReliability = [...supplierPerformance].sort((a, b) => a.reliability_score - b.reliability_score);
  const worstSupplier = sortedByReliability[0];
  const bestSupplier = sortedByReliability[sortedByReliability.length - 1];

  // Critical and warning alerts
  const criticalAlerts = reorderAlerts.filter(a => a.alert_level === 'CRITICAL');
  const warningAlerts = reorderAlerts.filter(a => a.alert_level === 'WARNING');
  const nextAlert = criticalAlerts[0] || warningAlerts[0];

  // Prepare combined margin data
  const combinedMarginData = marginTrend
    ? [
        ...marginTrend.historical.map(h => ({ ...h, type: 'actual' })),
        ...marginTrend.forecast.map(f => ({ date: f.date, erosion: f.predicted_erosion, type: 'forecast' }))
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">🔮 Forecasting & Planning</h1>
          <p className="text-slate-600">Predictive Analytics for Supply Chain Optimization</p>
        </div>

        {/* AI Explainer Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Powered by SAP Business Data Cloud + Business AI</h3>
              <p className="text-sm text-purple-100 leading-relaxed">
                This dashboard demonstrates how SAP Business AI can transform catch-weight data into actionable predictions.
                Using machine learning algorithms, we analyze historical patterns to score supplier reliability (95% confidence intervals),
                predict inventory stockouts (consumption-based forecasting), and forecast margin erosion (7-day moving average models).
              </p>
            </div>
          </div>
        </div>

        {/* Key Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-2">⚠️ Highest Risk Supplier</div>
            {worstSupplier ? (
              <>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {worstSupplier.supplier_code}
                </div>
                <div className="text-sm text-slate-700">
                  {worstSupplier.material_id} • {worstSupplier.reliability_score.toFixed(1)}% reliability
                </div>
              </>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-2">✅ Best Performer</div>
            {bestSupplier ? (
              <>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {bestSupplier.supplier_code}
                </div>
                <div className="text-sm text-slate-700">
                  {bestSupplier.material_id} • {bestSupplier.reliability_score.toFixed(1)}% reliability
                </div>
              </>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-2">🔔 Next Reorder Alert</div>
            {nextAlert ? (
              <>
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {nextAlert.days_of_stock_remaining?.toFixed(0) || '?'} days
                </div>
                <div className="text-sm text-slate-700">
                  {nextAlert.material_id} @ {nextAlert.plant_id}
                </div>
              </>
            ) : (
              <div className="text-gray-500">No alerts</div>
            )}
          </div>
        </div>

        {/* Supplier Reliability Chart */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            🎯 Supplier Reliability - Top 10 Risk Areas
            <InfoIcon explanation="This horizontal bar chart shows the 10 suppliers with the lowest reliability scores, sorted from worst to best. The reliability score (0-100%) is calculated using statistical analysis of historical receipt patterns, including drift consistency and volatility. Red bars (<70%) indicate high-risk suppliers requiring immediate attention, yellow (70-90%) shows moderate reliability, and green (>90%) indicates reliable suppliers. Focus on the red and yellow bars for contract renegotiation or supplier improvement initiatives." />
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Focus on worst performers - sorted by reliability score (lower is worse)
          </p>

          <div className="space-y-3">
            {sortedByReliability.slice(0, 10).map((supplier, idx) => (
              <div key={`${supplier.material_id}-${supplier.supplier_code}`} className="flex items-center gap-4">
                <div className="w-8 text-right text-xs text-slate-500 font-mono">#{idx + 1}</div>
                <div className="w-32 text-sm font-medium text-slate-900 truncate">
                  {supplier.supplier_code}
                </div>
                <div className="w-24 text-xs text-slate-600 font-mono truncate">
                  {supplier.material_id}
                </div>
                <div className="flex-1">
                  <div className="relative h-8 bg-slate-100 rounded overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-end px-3 text-xs font-semibold transition-all ${
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
                <div className="w-20 text-right text-xs text-slate-600">
                  {supplier.avg_drift_pct > 0 ? '+' : ''}{supplier.avg_drift_pct.toFixed(2)}% drift
                </div>
                <div className="w-24 text-right text-xs text-slate-600">
                  ${(supplier.financial_exposure / 1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weight Variance Predictions Table */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            ⚖️ Weight Variance Predictions
            <InfoIcon explanation="This table shows predicted weight drift ranges for each supplier-material combination. The 'Current Drift' reflects historical average, while 'Predicted Range' uses a 95% confidence interval based on statistical modeling of past patterns. Financial exposure estimates the potential cost impact of weight variance. Reliability scores help prioritize which suppliers need attention or contract renegotiation." />
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Predicted drift ranges based on historical patterns (95% confidence interval)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Current Drift</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Predicted Range</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Reliability</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.slice(0, 10).map((supplier) => (
                  <tr key={`${supplier.material_id}-${supplier.supplier_code}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-700 font-mono">{supplier.material_id}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 font-mono">{supplier.supplier_code}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {supplier.avg_drift_pct > 0 ? '+' : ''}{supplier.avg_drift_pct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {supplier.forecast_range.min.toFixed(2)}% to {supplier.forecast_range.max.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          supplier.reliability_score > 90
                            ? 'bg-green-100 text-green-800'
                            : supplier.reliability_score > 70
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {supplier.reliability_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">${supplier.financial_exposure.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Margin Erosion Forecast */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            📉 Margin Erosion Forecast (30-day)
            <InfoIcon explanation="This area chart visualizes historical margin erosion (solid line) and projected future trends (dashed line). Margin erosion occurs when actual received weights differ from ordered weights, leading to financial discrepancies. The forecast uses a 7-day moving average model to predict future erosion based on recent patterns. This helps finance teams anticipate budget impacts and identify periods requiring closer monitoring." />
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Historical erosion (solid) vs. predicted trend (dashed). Based on 7-day moving average.
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedMarginData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis label={{ value: 'Margin Erosion ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="text-sm font-semibold">{data.date}</p>
                        <p className="text-sm">
                          {data.type === 'forecast' ? 'Predicted' : 'Actual'}: ${data.erosion?.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="erosion"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Reorder Alerts */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            🔔 Inventory Reorder Alerts
            <InfoIcon explanation="This section identifies materials at risk of stockout using consumption-based forecasting. The system calculates average daily consumption from historical movement data and compares it to current stock levels. Critical alerts (<7 days remaining) require immediate action, while Warning alerts (7-14 days) should be monitored. This predictive approach prevents production disruptions by flagging reorder needs before inventory runs out." />
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Materials at risk of stockout based on consumption patterns. Critical = {'<'}7 days, Warning = {'<'}14 days.
          </p>

          {criticalAlerts.length > 0 && (
            <div className="mb-6">
              <div className="text-red-600 font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Critical Alerts ({criticalAlerts.length})
              </div>
              <div className="space-y-2">
                {criticalAlerts.map((alert) => (
                  <div
                    key={`${alert.material_id}-${alert.plant_id}-${alert.storage_location}`}
                    className="border border-red-200 bg-red-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-red-900">
                          {alert.material_id} @ {alert.plant_id}
                        </div>
                        <div className="text-sm text-red-700">
                          Stock: {alert.current_stock.toFixed(0)} units • Consumption: {alert.avg_daily_consumption.toFixed(1)}/day
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {alert.days_of_stock_remaining?.toFixed(0) || '?'} days
                        </div>
                        <div className="text-xs text-red-600">remaining</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className="mb-6">
              <div className="text-yellow-600 font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Warning Alerts ({warningAlerts.length})
              </div>
              <div className="space-y-2">
                {warningAlerts.map((alert) => (
                  <div
                    key={`${alert.material_id}-${alert.plant_id}-${alert.storage_location}`}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-yellow-900">
                          {alert.material_id} @ {alert.plant_id}
                        </div>
                        <div className="text-sm text-yellow-700">
                          Stock: {alert.current_stock.toFixed(0)} units • Consumption: {alert.avg_daily_consumption.toFixed(1)}/day
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600">
                          {alert.days_of_stock_remaining?.toFixed(0) || '?'} days
                        </div>
                        <div className="text-xs text-yellow-600">remaining</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {criticalAlerts.length === 0 && warningAlerts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-lg font-medium">All materials have sufficient stock</div>
              <div className="text-sm">No reorder alerts at this time</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
