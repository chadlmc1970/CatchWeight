"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

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

  if (error) return <p className="text-red-600">Error: {error}</p>;

  const totalBase = stock.reduce((sum, s) => sum + s.stock_base_uom, 0);
  const totalParallel = stock.reduce((sum, s) => sum + s.stock_parallel_uom, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Stock (Cases)</p>
          <p className="text-2xl font-bold">{totalBase.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Stock (Pounds)</p>
          <p className="text-2xl font-bold">{totalParallel.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Positions</p>
          <p className="text-2xl font-bold">{stock.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={() => setShowBatches(false)} className={`px-4 py-1.5 rounded text-sm font-medium ${!showBatches ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
          By Storage Location
        </button>
        <button onClick={() => setShowBatches(true)} className={`px-4 py-1.5 rounded text-sm font-medium ${showBatches ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
          By Batch
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {!showBatches ? (
          <DataTable
            columns={[
              { key: "material_id", header: "Material" },
              { key: "plant_id", header: "Plant" },
              { key: "storage_location", header: "SLoc" },
              { key: "stock_base_uom", header: "Cases", render: (r: StockPosition) => r.stock_base_uom.toLocaleString() },
              { key: "stock_parallel_uom", header: "Pounds", render: (r: StockPosition) => r.stock_parallel_uom.toLocaleString("en-US", { minimumFractionDigits: 2 }) },
              { key: "last_updated", header: "Last Updated", render: (r: StockPosition) => r.last_updated?.slice(0, 19) },
            ]}
            data={stock}
          />
        ) : (
          <DataTable
            columns={[
              { key: "material_id", header: "Material" },
              { key: "plant_id", header: "Plant" },
              { key: "storage_location", header: "SLoc" },
              { key: "batch_id", header: "Batch" },
              { key: "stock_base_uom", header: "Cases", render: (r: BatchStock) => r.stock_base_uom.toLocaleString() },
              { key: "stock_parallel_uom", header: "Pounds", render: (r: BatchStock) => r.stock_parallel_uom.toLocaleString("en-US", { minimumFractionDigits: 2 }) },
            ]}
            data={batches}
          />
        )}
      </div>
    </div>
  );
}
