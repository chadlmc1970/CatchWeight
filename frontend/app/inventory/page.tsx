"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { CompactKPICard, ChartCard } from "@/components/dashboard";

interface StockPosition {
  material_id: string;
  plant_id: string;
  storage_location: string;
  stock_base_uom: number;
  stock_parallel_uom: number;
  last_updated: string;
}

interface BatchStock {
  material_id: string;
  plant_id: string;
  storage_location: string;
  batch_id: string;
  stock_base_uom: number;
  stock_parallel_uom: number;
  last_updated: string;
}

export default function InventoryPage() {
  const [stock, setStock] = useState<StockPosition[]>([]);
  const [batches, setBatches] = useState<BatchStock[]>([]);
  const [showBatches, setShowBatches] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<StockPosition[]>("/v1/stock"),
      apiFetch<BatchStock[]>("/v1/stock/batches"),
    ])
      .then(([s, b]) => {
        setStock(s);
        setBatches(b);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 p-6">Error: {error}</p>;

  const totalBase = stock.reduce((sum, s) => sum + s.stock_base_uom, 0);
  const totalParallel = stock.reduce((sum, s) => sum + s.stock_parallel_uom, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-900">📋 Inventory Positions</h1>
      </div>

      {/* Compact KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CompactKPICard
          icon="📦"
          value={totalBase.toLocaleString()}
          label="Total Stock (Cases)"
          status="neutral"
        />
        <CompactKPICard
          icon="⚖️"
          value={`${totalParallel.toLocaleString("en-US", { maximumFractionDigits: 0 })} lb`}
          label="Total Stock (Pounds)"
          status="neutral"
        />
        <CompactKPICard
          icon="📍"
          value={stock.length}
          label="Storage Positions"
          status="neutral"
        />
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowBatches(false)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showBatches
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          By Storage Location ({stock.length})
        </button>
        <button
          onClick={() => setShowBatches(true)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            showBatches
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          By Batch ({batches.length})
        </button>
      </div>

      {/* Inventory Table */}
      <ChartCard
        title={showBatches ? "Inventory by Batch" : "Inventory by Storage Location"}
        infoText={showBatches
          ? "Batch-level stock quantities showing detailed inventory tracking for catch-weight materials."
          : "Current stock positions aggregated by storage location. Shows dual-UoM quantities (cases and pounds)."
        }
      >
        <div className="overflow-x-auto">
          {!showBatches ? (
            <DataTable
              columns={[
                { key: "material_id", header: "Material", render: (r: StockPosition) => <span className="font-medium">{r.material_id}</span> },
                { key: "plant_id", header: "Plant" },
                { key: "storage_location", header: "Storage Location" },
                { key: "stock_base_uom", header: "Cases", render: (r: StockPosition) => <span className="font-mono">{r.stock_base_uom.toLocaleString()}</span> },
                { key: "stock_parallel_uom", header: "Pounds", render: (r: StockPosition) => <span className="font-mono">{r.stock_parallel_uom.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span> },
                { key: "last_updated", header: "Last Updated", render: (r: StockPosition) => <span className="text-sm text-slate-600">{r.last_updated?.slice(0, 19).replace('T', ' ')}</span> },
              ]}
              data={stock}
            />
          ) : (
            <DataTable
              columns={[
                { key: "material_id", header: "Material", render: (r: BatchStock) => <span className="font-medium">{r.material_id}</span> },
                { key: "plant_id", header: "Plant" },
                { key: "storage_location", header: "SLoc" },
                { key: "batch_id", header: "Batch", render: (r: BatchStock) => <span className="font-medium text-blue-600">{r.batch_id}</span> },
                { key: "stock_base_uom", header: "Cases", render: (r: BatchStock) => <span className="font-mono">{r.stock_base_uom.toLocaleString()}</span> },
                { key: "stock_parallel_uom", header: "Pounds", render: (r: BatchStock) => <span className="font-mono">{r.stock_parallel_uom.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span> },
              ]}
              data={batches}
            />
          )}
        </div>
      </ChartCard>
    </div>
  );
}
