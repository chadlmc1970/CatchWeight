'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { apiFetch } from '@/lib/api';

interface WeightDriftSummary {
  total_transactions: number;
  total_drift_lb: number;
  avg_drift_pct: number;
  total_financial_exposure: number;
  max_drift_pct: number;
  min_drift_pct: number;
}

interface MarginErosionSummary {
  total_transactions: number;
  total_margin_erosion: number;
  avg_erosion_pct: number;
  total_expected_margin: number;
  total_actual_margin: number;
}

interface MaterialMetric {
  material_id: string;
  transaction_count: number;
  avg_drift_pct?: number;
  total_exposure?: number;
  total_erosion?: number;
  avg_erosion_pct?: number;
}

interface WeightDriftRecord {
  material_id: string;
  plant_id: string;
  posting_date: string;
  qty_cases: number;
  drift_pct: number;
  financial_exposure_usd: number;
  drift_lb: number;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];
const SAP_BLUE = '#0070F3';
const SAP_DARK_BLUE = '#0053BA';

export default function DataProductsPage() {
  const [weightDriftSummary, setWeightDriftSummary] = useState<WeightDriftSummary | null>(null);
  const [marginErosionSummary, setMarginErosionSummary] = useState<MarginErosionSummary | null>(null);
  const [weightDriftByMaterial, setWeightDriftByMaterial] = useState<MaterialMetric[]>([]);
  const [marginErosionByMaterial, setMarginErosionByMaterial] = useState<MaterialMetric[]>([]);
  const [weightDriftRecords, setWeightDriftRecords] = useState<WeightDriftRecord[]>([]);
  const [forecastingSummary, setForecastingSummary] = useState<ForecastingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [wdSummary, meSummary, wdByMat, meByMat, wdRecords, forecastData] = await Promise.all([
          apiFetch<WeightDriftSummary>('/v1/dataproducts/weight-drift/summary'),
          apiFetch<MarginErosionSummary>('/v1/dataproducts/margin-erosion/summary'),
          apiFetch<MaterialMetric[]>('/v1/dataproducts/weight-drift/by-material'),
          apiFetch<MaterialMetric[]>('/v1/dataproducts/margin-erosion/by-material'),
          apiFetch<WeightDriftRecord[]>('/v1/dataproducts/weight-drift'),
          apiFetch<ForecastingSummary>('/v1/forecasting/summary'),
        ]);

        setWeightDriftSummary(wdSummary);
        setMarginErosionSummary(meSummary);
        setWeightDriftByMaterial(wdByMat);
        setMarginErosionByMaterial(meByMat);
        setWeightDriftRecords(wdRecords);
        setForecastingSummary(forecastData);
      } catch (error) {
        console.error('Error fetching data products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading Analytics Dashboard...</div>
        </div>
      </div>
    );
  }

  const chartTrendData = Array.isArray(weightDriftRecords)
    ? weightDriftRecords.reverse().map(r => ({
        date: r.posting_date,
        drift: Math.abs(r.drift_pct),
        exposure: r.financial_exposure_usd,
        material: r.material_id
      }))
    : [];

  const topMaterialsChart = Array.isArray(weightDriftByMaterial)
    ? weightDriftByMaterial.slice(0, 6).map(m => ({
        name: m.material_id,
        exposure: Math.abs(m.total_exposure || 0),
        drift: Math.abs(m.avg_drift_pct || 0)
      }))
    : [];

  const marginDistribution = Array.isArray(marginErosionByMaterial)
    ? marginErosionByMaterial.slice(0, 5).map(m => ({
        name: m.material_id,
        value: Math.abs(m.total_erosion || 0)
      }))
    : [];

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 shadow-lg backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">📊</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Catch Weight Analytics
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">SAP S/4HANA Data Products · Real-time Insights</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              >
                📄 Export
              </button>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Transactions"
            value={(weightDriftSummary?.total_transactions || 0) + (marginErosionSummary?.total_transactions || 0)}
            subtitle="Combined volume"
            trend="neutral"
            icon="📈"
            gradient="from-blue-500 to-blue-600"
          />
          <MetricCard
            title="Weight Drift Impact"
            value={`$${Math.abs(weightDriftSummary?.total_financial_exposure || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle="Financial exposure"
            trend="warning"
            icon="⚖️"
            gradient="from-amber-500 to-orange-600"
          />
          <MetricCard
            title="Margin Erosion"
            value={`$${Math.abs(marginErosionSummary?.total_margin_erosion || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle="Total loss"
            trend="critical"
            icon="📉"
            gradient="from-red-500 to-red-600"
          />
          <MetricCard
            title="Avg Drift"
            value={`${Math.abs(weightDriftSummary?.avg_drift_pct || 0).toFixed(2)}%`}
            subtitle="Weight variance"
            trend={Math.abs(weightDriftSummary?.avg_drift_pct || 0) > 5 ? 'warning' : 'good'}
            icon="🎯"
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Data Product 1: Weight Drift Analysis */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <span className="text-white text-lg font-bold">DP1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Weight Drift Trend Analysis</h2>
            <span className="px-4 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 rounded-full border-2 border-blue-200">
              DATA PRODUCT 1
            </span>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drift Trend Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Weight Drift Over Time</h3>
                <p className="text-sm text-gray-500">Tracking variance trends across recent transactions</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartTrendData}>
                  <defs>
                    <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070F3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0070F3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number | undefined) => value ? [`${value.toFixed(2)}%`, 'Drift'] : ['0.00%', 'Drift']}
                  />
                  <Area
                    type="monotone"
                    dataKey="drift"
                    stroke="#0070F3"
                    strokeWidth={3}
                    fill="url(#driftGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Materials Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Top Materials by Exposure</h3>
                <p className="text-sm text-gray-500">Materials with highest financial impact</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topMaterialsChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number | undefined) => value ? [`$${value.toLocaleString()}`, 'Exposure'] : ['$0', 'Exposure']}
                  />
                  <Bar dataKey="exposure" radius={[0, 8, 8, 0]}>
                    {topMaterialsChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatCard
              label="Max Drift Recorded"
              value={`${Math.abs(weightDriftSummary?.max_drift_pct || 0).toFixed(2)}%`}
              subtext="Highest variance observed"
              color="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
            <StatCard
              label="Min Drift Recorded"
              value={`${Math.abs(weightDriftSummary?.min_drift_pct || 0).toFixed(2)}%`}
              subtext="Lowest variance observed"
              color="text-green-600"
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
            <StatCard
              label="Total Weight Variance"
              value={`${Math.abs(weightDriftSummary?.total_drift_lb || 0).toFixed(0)} lb`}
              subtext="Cumulative drift"
              color="text-blue-600"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
          </div>
        </div>

        {/* Data Product 2: Margin Erosion */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <span className="text-white text-lg font-bold">DP2</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Margin Erosion Analysis</h2>
            <span className="px-4 py-1.5 text-xs font-bold text-red-700 bg-red-100 rounded-full border-2 border-red-200">
              DATA PRODUCT 2
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Margin Distribution Pie Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Erosion Distribution</h3>
                <p className="text-sm text-gray-500">Top materials contributing to margin loss</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marginDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${(entry.value/1000).toFixed(0)}k`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marginDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number | undefined) => value ? [`$${value.toLocaleString()}`, 'Erosion'] : ['$0', 'Erosion']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Materials List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Top Margin Erosion</h3>
                <p className="text-sm text-gray-500">Materials ranked by financial impact</p>
              </div>
              <div className="space-y-3">
                {marginErosionByMaterial.slice(0, 8).map((material, idx) => (
                  <div key={idx} className="group hover:bg-gray-50 p-3 rounded-xl transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-lg shadow-md ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{material.material_id}</div>
                          <div className="text-xs text-gray-500">{material.transaction_count} txns</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">
                          -${Math.abs(material.total_erosion || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {material.avg_erosion_pct?.toFixed(2)}% avg
                        </div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((material.total_erosion || 0) / (marginErosionByMaterial[0]?.total_erosion || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Expected Margin"
              value={`$${Math.abs(marginErosionSummary?.total_expected_margin || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtext="Planned revenue"
              color="text-blue-600"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
            <StatCard
              label="Actual Margin"
              value={`$${Math.abs(marginErosionSummary?.total_actual_margin || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              subtext="Realized revenue"
              color="text-green-600"
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
            <StatCard
              label="Margin Gap"
              value={`${Math.abs(marginErosionSummary?.avg_erosion_pct || 0).toFixed(2)}%`}
              subtext="Average erosion rate"
              color="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-2">About These Data Products</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm leading-relaxed opacity-95">
                <div>
                  <strong className="block mb-1">Weight Drift Trend (DP1):</strong>
                  Monitors variance between expected and actual weights in catch-weight materials during goods receipt operations (Movement Type 101). Identifies systematic over/under-weight patterns that impact inventory accuracy and financial planning.
                </div>
                <div>
                  <strong className="block mb-1">Margin Erosion Analysis (DP2):</strong>
                  Quantifies margin loss from catch-weight variance during sales and production activities (Movement Types 601, 261). Critical for pricing strategy and revenue protection in weight-based business models.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Premium Metric Card
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  gradient
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'good' | 'warning' | 'critical' | 'neutral';
  icon: string;
  gradient: string;
}) {
  const trendColors = {
    good: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
    neutral: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}"></div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{value}</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-medium">{subtitle}</div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${trendColors[trend]}`}>
              {trend === 'good' && '✓'}
              {trend === 'warning' && '⚠'}
              {trend === 'critical' && '!'}
              {trend === 'neutral' && '→'}
            </span>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights Section */}
      <div className="mt-12 pt-12 border-t-4 border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              🤖 AI-Powered Insights
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-normal">
                Business AI
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">Predictive analytics powered by SAP Business Data Cloud + AI</p>
          </div>
          <Link
            href="/forecasting"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View Full AI Dashboard →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Supplier Risk */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border border-red-200">
            <div className="text-sm text-red-700 font-semibold mb-2">⚠️ Supplier Risk Analysis</div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {forecastingSummary?.worst_reliability_score?.toFixed(1) || '—'}%
            </div>
            <div className="text-xs text-red-600">Lowest reliability score detected</div>
            <div className="text-xs text-gray-600 mt-3">
              AI analyzes historical weight variance patterns to identify high-risk suppliers
            </div>
          </div>

          {/* Card 2: Inventory Alerts */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg p-6 border border-yellow-200">
            <div className="text-sm text-yellow-700 font-semibold mb-2">🔔 Smart Reorder Alerts</div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {forecastingSummary?.critical_alerts || 0} critical
            </div>
            <div className="text-xs text-yellow-600">
              Next reorder: {forecastingSummary?.next_reorder_in_days?.toFixed(0) || '?'} days
            </div>
            <div className="text-xs text-gray-600 mt-3">
              Predictive alerts based on consumption patterns and stock levels
            </div>
          </div>

          {/* Card 3: Margin Forecast */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
            <div className="text-sm text-purple-700 font-semibold mb-2">📈 30-Day Margin Forecast</div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${forecastingSummary?.total_erosion_90days?.toFixed(0) || '—'}
            </div>
            <div className="text-xs text-purple-600">Predicted 90-day exposure</div>
            <div className="text-xs text-gray-600 mt-3">
              Time-series forecasting with confidence intervals using ML algorithms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  color,
  bgColor,
  borderColor
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-xl p-5 hover:shadow-lg transition-all duration-200`}>
      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
      <div className="text-xs text-gray-600 font-medium">{subtext}</div>
    </div>
  );
}
