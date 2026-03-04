'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { apiFetch } from '@/lib/api';
import * as Tabs from '@radix-ui/react-tabs';
import { DashboardGrid, GridCell, ChartCard, CompactKPICard } from '@/components/dashboard';

interface WeightDriftSummary {
  total_receipts: number;
  total_drift_kg: number;
  avg_drift_pct: number;
  total_cost_impact: number;
  max_drift_pct: number;
  min_drift_pct: number;
}

interface MarginErosionSummary {
  total_erosion: number;
  avg_erosion_pct: number;
  affected_materials: number;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function AnalyticsPage() {
  const [weightDriftSummary, setWeightDriftSummary] = useState<WeightDriftSummary | null>(null);
  const [marginErosionSummary, setMarginErosionSummary] = useState<MarginErosionSummary | null>(null);
  const [weightDriftByMaterial, setWeightDriftByMaterial] = useState<MaterialMetric[]>([]);
  const [marginErosionByMaterial, setMarginErosionByMaterial] = useState<MaterialMetric[]>([]);
  const [weightDriftRecords, setWeightDriftRecords] = useState<WeightDriftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [wdSummary, meSummary, wdByMat, meByMat, wdRecords] = await Promise.all([
          apiFetch<WeightDriftSummary>('/v1/dataproducts/weight-drift/summary'),
          apiFetch<MarginErosionSummary>('/v1/dataproducts/margin-erosion/summary'),
          apiFetch<MaterialMetric[]>('/v1/dataproducts/weight-drift/by-material'),
          apiFetch<MaterialMetric[]>('/v1/dataproducts/margin-erosion/by-material'),
          apiFetch<WeightDriftRecord[]>('/v1/dataproducts/weight-drift'),
        ]);

        setWeightDriftSummary(wdSummary);
        setMarginErosionSummary(meSummary);
        setWeightDriftByMaterial(wdByMat);
        setMarginErosionByMaterial(meByMat);
        setWeightDriftRecords(wdRecords);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
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
          <div className="text-lg font-medium text-gray-700">Loading Analytics...</div>
        </div>
      </div>
    );
  }

  const chartHeight = 'compact';

  // Prepare chart data
  const chartTrendData = weightDriftRecords.reverse().map(r => ({
    date: r.posting_date,
    drift: Math.abs(r.drift_pct),
    exposure: r.financial_exposure_usd,
    material: r.material_id
  }));

  const topMaterialsChart = weightDriftByMaterial.slice(0, 8).map(m => ({
    name: m.material_id,
    exposure: Math.abs(m.total_exposure || 0),
    drift: Math.abs(m.avg_drift_pct || 0)
  }));

  const driftByPlant = weightDriftRecords.reduce((acc, record) => {
    const existing = acc.find(item => item.plant === record.plant_id);
    if (existing) {
      existing.totalDrift += Math.abs(record.drift_pct);
      existing.count += 1;
    } else {
      acc.push({
        plant: record.plant_id,
        totalDrift: Math.abs(record.drift_pct),
        count: 1,
      });
    }
    return acc;
  }, [] as Array<{ plant: string; totalDrift: number; count: number }>)
  .map(item => ({
    plant: item.plant,
    avgDrift: item.totalDrift / item.count,
  }))
  .slice(0, 6);

  const driftDistribution = [
    { range: '0-2%', count: weightDriftRecords.filter(r => Math.abs(r.drift_pct) <= 2).length },
    { range: '2-5%', count: weightDriftRecords.filter(r => Math.abs(r.drift_pct) > 2 && Math.abs(r.drift_pct) <= 5).length },
    { range: '5-10%', count: weightDriftRecords.filter(r => Math.abs(r.drift_pct) > 5 && Math.abs(r.drift_pct) <= 10).length },
    { range: '>10%', count: weightDriftRecords.filter(r => Math.abs(r.drift_pct) > 10).length },
  ];

  const marginDistribution = marginErosionByMaterial.slice(0, 6).map(m => ({
    name: m.material_id,
    value: Math.abs(m.total_erosion || 0)
  }));

  const erosionTrend = chartTrendData.map(d => ({
    date: d.date,
    erosion: d.exposure,
  })).slice(-30);

  const materialPerformance = weightDriftByMaterial.map(wd => {
    const me = marginErosionByMaterial.find(m => m.material_id === wd.material_id);
    return {
      material_id: wd.material_id,
      transaction_count: wd.transaction_count,
      avg_drift_pct: wd.avg_drift_pct || 0,
      total_exposure: wd.total_exposure || 0,
      total_erosion: me?.total_erosion || 0,
      avg_erosion_pct: me?.avg_erosion_pct || 0,
    };
  }).sort((a, b) => Math.abs(b.total_exposure) - Math.abs(a.total_exposure));

  const selectedMaterialData = selectedMaterial
    ? weightDriftRecords.filter(r => r.material_id === selectedMaterial).slice(-20).map(r => ({
        date: r.posting_date,
        drift: Math.abs(r.drift_pct),
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with KPIs */}
      <div className="bg-white border-b border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Analytics Deep Dive</h1>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Compact KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CompactKPICard
            icon="📈"
            value={(weightDriftSummary?.total_receipts || 0).toLocaleString()}
            label="Total Transactions"
            status="neutral"
          />
          <CompactKPICard
            icon="⚖️"
            value={`$${Math.abs(weightDriftSummary?.total_cost_impact || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            label="Weight Drift Impact"
            status="warning"
          />
          <CompactKPICard
            icon="📉"
            value={`$${Math.abs(marginErosionSummary?.total_erosion || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            label="Margin Erosion"
            status="danger"
          />
          <CompactKPICard
            icon="🎯"
            value={`${Math.abs(weightDriftSummary?.avg_drift_pct || 0).toFixed(2)}%`}
            label="Avg Drift"
            status={Math.abs(weightDriftSummary?.avg_drift_pct || 0) > 5 ? 'warning' : 'success'}
          />
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="p-6">
        <Tabs.Root defaultValue="weight-drift" className="w-full">
          <Tabs.List className="flex gap-2 border-b border-slate-200 mb-6">
            <Tabs.Trigger
              value="weight-drift"
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              Weight Drift Analysis
            </Tabs.Trigger>
            <Tabs.Trigger
              value="margin"
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              Margin Erosion
            </Tabs.Trigger>
            <Tabs.Trigger
              value="materials"
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
            >
              Material Performance
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab 1: Weight Drift Analysis */}
          <Tabs.Content value="weight-drift">
            <DashboardGrid cols={2} rows={2} gap={4}>
              <GridCell>
                <ChartCard
                  title="Drift Over Time"
                  height={chartHeight}
                  infoText="Shows weight drift percentage trends over recent transactions. Helps identify systematic patterns and seasonal variations."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Drift']} />
                      <Area type="monotone" dataKey="drift" stroke="#0070F3" fill="#93c5fd" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </GridCell>

              <GridCell>
                <ChartCard
                  title="Top Materials by Exposure"
                  height={chartHeight}
                  infoText="Materials ranked by total financial exposure from weight variance. Focus remediation efforts on the top items."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMaterialsChart} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Exposure']} />
                      <Bar dataKey="exposure" radius={[0, 4, 4, 0]}>
                        {topMaterialsChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </GridCell>

              <GridCell>
                <ChartCard
                  title="Drift by Plant"
                  height={chartHeight}
                  infoText="Average drift percentage by plant location. Identifies facilities with recurring weight variance issues."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={driftByPlant} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plant" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Avg Drift']} />
                      <Bar dataKey="avgDrift" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </GridCell>

              <GridCell>
                <ChartCard
                  title="Drift Distribution"
                  height={chartHeight}
                  infoText="Histogram showing how transactions are distributed across drift ranges. Most should be in the 0-2% range."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={driftDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value} transactions`, 'Count']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </GridCell>
            </DashboardGrid>
          </Tabs.Content>

          {/* Tab 2: Margin Erosion */}
          <Tabs.Content value="margin">
            <div className="space-y-4">
              {/* Top Row: 3 charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ChartCard
                  title="Erosion Trend"
                  height={chartHeight}
                  infoText="30-day trend of margin erosion showing financial impact over time. Helps forecast future losses."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={erosionTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`$${value.toFixed(0)}`, 'Erosion']} />
                      <Area type="monotone" dataKey="erosion" stroke="#ef4444" fill="#fca5a5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Top Erosion Materials"
                  height={chartHeight}
                  infoText="Materials with highest margin loss from weight discrepancies. Prioritize these for supplier negotiations."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginErosionByMaterial.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="material_id" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(value: any) => [`$${Math.abs(Number(value)).toLocaleString()}`, 'Erosion']} />
                      <Bar dataKey="total_erosion" radius={[0, 4, 4, 0]} fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Erosion Distribution"
                  height={chartHeight}
                  infoText="Pie chart showing which materials contribute most to total margin loss. Top 6 materials displayed."
                >
                  <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marginDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {marginDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Erosion']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Color-coded legend */}
                    <div className="px-4 pb-2 grid grid-cols-2 gap-2 flex-shrink-0">
                      {marginDistribution.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {entry.name}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
                            ${Math.abs(entry.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>
              </div>

              {/* Bottom Row: Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CompactKPICard
                  icon="💰"
                  value={`$${Math.abs(marginErosionSummary?.total_erosion || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  label="Total Erosion"
                  status="danger"
                />
                <CompactKPICard
                  icon="📦"
                  value={marginErosionSummary?.affected_materials || 0}
                  label="Affected Materials"
                  status="warning"
                />
                <CompactKPICard
                  icon="📉"
                  value={`${(marginErosionSummary?.avg_erosion_pct || 0).toFixed(2)}%`}
                  label="Avg Erosion %"
                  status="warning"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Tab 3: Material Performance */}
          <Tabs.Content value="materials">
            <div className="space-y-4">
              {/* Material Trend Chart */}
              {selectedMaterial && (
                <ChartCard
                  title={`${selectedMaterial} - Drift Trend`}
                  height={chartHeight}
                  infoText="Historical drift pattern for the selected material. Click a row below to change material."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMaterialData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Drift']} />
                      <Line type="monotone" dataKey="drift" stroke="#0070F3" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Material Performance Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">Material Performance Table</h3>
                  <p className="text-sm text-slate-600">Click a row to view detailed trend. Sorted by financial exposure.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Transactions</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Avg Drift %</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Exposure</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Erosion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {materialPerformance.slice(0, 15).map((material) => (
                        <tr
                          key={material.material_id}
                          onClick={() => setSelectedMaterial(material.material_id)}
                          className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedMaterial === material.material_id ? 'bg-blue-100' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{material.material_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{material.transaction_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                            <span className={Math.abs(material.avg_drift_pct) > 5 ? 'text-red-600 font-semibold' : ''}>
                              {Math.abs(material.avg_drift_pct).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                            ${Math.abs(material.total_exposure).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                            ${Math.abs(material.total_erosion).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
