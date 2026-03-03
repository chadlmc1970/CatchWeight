'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { apiFetch } from '@/lib/api';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import GridCell from '@/components/dashboard/GridCell';
import ChartCard from '@/components/dashboard/ChartCard';
import CompactKPICard from '@/components/dashboard/CompactKPICard';
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';

interface WeightDriftSummary {
  total_receipts: number;
  avg_drift_pct: number;
  total_drift_kg: number;
  total_cost_impact: number;
}

interface MarginErosionSummary {
  total_erosion: number;
  avg_erosion_pct: number;
  affected_materials: number;
}

interface ForecastingSummary {
  high_risk_suppliers: number;
  total_exposure: number;
  avg_reliability: number;
}

interface SupplierPerformance {
  material_id: string;
  supplier_code: string;
  reliability_score: number;
  financial_exposure: number;
  avg_drift_pct: number;
}

interface WeightDriftRecord {
  date: string;
  drift_kg: number;
  drift_pct: number;
}

interface MarginRecord {
  date: string;
  erosion: number;
}

interface InventoryAlert {
  material_id: string;
  stock_qty: number;
  days_remaining: number;
  priority: 'critical' | 'warning';
}

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);

  // KPI Data
  const [weightDriftSummary, setWeightDriftSummary] = useState<WeightDriftSummary | null>(null);
  const [marginSummary, setMarginSummary] = useState<MarginErosionSummary | null>(null);
  const [forecastingSummary, setForecastingSummary] = useState<ForecastingSummary | null>(null);

  // Chart Data
  const [weightDriftData, setWeightDriftData] = useState<WeightDriftRecord[]>([]);
  const [marginData, setMarginData] = useState<MarginRecord[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierPerformance[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          weightDrift,
          margin,
          forecasting,
          driftRecords,
          suppliers,
        ] = await Promise.all([
          apiFetch<WeightDriftSummary>('/v1/dataproducts/weight-drift/summary'),
          apiFetch<MarginErosionSummary>('/v1/dataproducts/margin-erosion/summary'),
          apiFetch<ForecastingSummary>('/v1/forecasting/summary'),
          apiFetch<WeightDriftRecord[]>('/v1/dataproducts/weight-drift'),
          apiFetch<SupplierPerformance[]>('/v1/forecasting/supplier-performance'),
        ]);

        setWeightDriftSummary(weightDrift);
        setMarginSummary(margin);
        setForecastingSummary(forecasting);
        setWeightDriftData(driftRecords.slice(-30));
        setSupplierData(suppliers);

        // Mock inventory alerts (replace with actual API call when available)
        const mockAlerts: InventoryAlert[] = [
          { material_id: 'MAT001', stock_qty: 45, days_remaining: 3, priority: 'critical' },
          { material_id: 'MAT002', stock_qty: 120, days_remaining: 5, priority: 'critical' },
          { material_id: 'MAT003', stock_qty: 230, days_remaining: 9, priority: 'warning' },
          { material_id: 'MAT004', stock_qty: 180, days_remaining: 11, priority: 'warning' },
        ];
        setInventoryAlerts(mockAlerts);

        // Mock margin data
        const mockMarginData: MarginRecord[] = driftRecords.slice(-30).map(record => ({
          date: record.date,
          erosion: Math.abs(record.drift_kg * 5.2), // Mock conversion
        }));
        setMarginData(mockMarginData);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-2xl text-slate-600">Loading Executive Dashboard...</div>
      </div>
    );
  }

  const topRiskSuppliers = supplierData
    .sort((a, b) => a.reliability_score - b.reliability_score)
    .slice(0, 5);

  const alertCounts = {
    critical: inventoryAlerts.filter(a => a.priority === 'critical').length,
    warning: inventoryAlerts.filter(a => a.priority === 'warning').length,
    ok: 0,
  };

  const pieData = [
    { name: 'Critical', value: alertCounts.critical, color: '#ef4444' },
    { name: 'Warning', value: alertCounts.warning, color: '#eab308' },
    { name: 'OK', value: Math.max(0, 10 - alertCounts.critical - alertCounts.warning), color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* KPI Cards - 2 rows of 3 */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CompactKPICard
            icon="⚖️"
            value={`${(weightDriftSummary?.avg_drift_pct || 0).toFixed(2)}%`}
            label="Avg Weight Drift"
            trend={{
              direction: (weightDriftSummary?.avg_drift_pct || 0) > 0 ? 'up' : 'down',
              value: `${Math.abs(weightDriftSummary?.avg_drift_pct || 0).toFixed(2)}%`,
            }}
            status={
              Math.abs(weightDriftSummary?.avg_drift_pct || 0) > 5
                ? 'danger'
                : Math.abs(weightDriftSummary?.avg_drift_pct || 0) > 2
                ? 'warning'
                : 'success'
            }
          />
          <CompactKPICard
            icon="💰"
            value={`$${((weightDriftSummary?.total_cost_impact || 0) / 1000).toFixed(0)}k`}
            label="Cost Impact"
            status="warning"
          />
          <CompactKPICard
            icon="📉"
            value={`$${((marginSummary?.total_erosion || 0) / 1000).toFixed(0)}k`}
            label="Margin Erosion"
            status="danger"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CompactKPICard
            icon="🎯"
            value={`${(forecastingSummary?.avg_reliability || 0).toFixed(1)}%`}
            label="Avg Supplier Reliability"
            status={
              (forecastingSummary?.avg_reliability || 0) > 90
                ? 'success'
                : (forecastingSummary?.avg_reliability || 0) > 70
                ? 'warning'
                : 'danger'
            }
          />
          <CompactKPICard
            icon="⚠️"
            value={forecastingSummary?.high_risk_suppliers || 0}
            label="High-Risk Suppliers"
            status="warning"
          />
          <CompactKPICard
            icon="🔔"
            value={alertCounts.critical + alertCounts.warning}
            label="Inventory Alerts"
            status={alertCounts.critical > 0 ? 'danger' : 'warning'}
          />
        </div>
      </div>

      {/* 2x2 Chart Grid */}
      <div className="px-6 pb-6">
        <DashboardGrid cols={2} rows={2} gap={4}>
          {/* Weight Drift Trend */}
          <GridCell>
            <ChartCard
              title="Weight Drift Trend (30 days)"
              height="compact"
              infoText="Shows the 30-day trend of weight drift percentage. Positive values indicate received weight exceeds ordered weight, negative values indicate shortfall. This helps identify systematic patterns requiring supplier attention."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightDriftData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="drift_pct"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    name="Drift %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </GridCell>

          {/* Margin Erosion Trend */}
          <GridCell>
            <ChartCard
              title="Margin Erosion Trend (30 days)"
              height="compact"
              infoText="Tracks daily margin erosion caused by weight discrepancies. Higher values indicate larger financial impact from weight variance, helping prioritize remediation efforts."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marginData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="erosion"
                    stroke="#ef4444"
                    fill="#fca5a5"
                    name="Erosion $"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </GridCell>

          {/* Top Risk Suppliers */}
          <GridCell>
            <ChartCard
              title="Top 5 Risk Suppliers"
              height="compact"
              infoText="Displays the 5 suppliers with lowest reliability scores based on historical weight variance patterns. Red bars indicate high risk requiring immediate attention."
            >
              <div className="space-y-2 h-full overflow-y-auto">
                {topRiskSuppliers.map((supplier, idx) => (
                  <div key={`${supplier.material_id}-${supplier.supplier_code}`} className="flex items-center gap-2">
                    <div className="w-6 text-xs text-slate-500 font-mono">#{idx + 1}</div>
                    <div className="w-20 text-xs font-medium text-slate-900 truncate">
                      {supplier.supplier_code}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-end px-2 text-xs font-semibold ${
                            supplier.reliability_score > 90
                              ? 'bg-green-500 text-white'
                              : supplier.reliability_score > 70
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                          style={{ width: `${supplier.reliability_score}%` }}
                        >
                          {supplier.reliability_score.toFixed(0)}%
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

          {/* Inventory Alerts */}
          <GridCell>
            <ChartCard
              title="Inventory Alert Status"
              height="compact"
              infoText="Summary of current inventory reorder alerts by priority level. Critical alerts (<7 days) require immediate action to prevent stockouts."
            >
              <div className="flex items-center justify-center h-full">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-slate-700">Critical: {alertCounts.critical}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-slate-700">Warning: {alertCounts.warning}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-slate-700">OK: {pieData[2].value}</span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </GridCell>
        </DashboardGrid>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}
