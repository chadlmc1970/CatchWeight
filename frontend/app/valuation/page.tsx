"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface ValuationItem {
  material_id: string;
  plant_id: string;
  storage_location: string;
  total_base: number;
  total_parallel: number;
  inventory_value: number;
}

interface ValuationReport {
  items: ValuationItem[];
  total_inventory_value: number;
}

interface MbewRow {
  material_id: string;
  plant_id: string;
  price_control: string;
  standard_price: number | null;
  moving_avg_price: number | null;
  valuation_class: string;
}

export default function ValuationPage() {
  const [report, setReport] = useState<ValuationReport | null>(null);
  const [mbew, setMbew] = useState<MbewRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<ValuationReport>("/v1/valuation/report"),
      apiFetch<MbewRow[]>("/v1/valuation"),
    ])
      .then(([r, m]) => {
        setReport(r);
        setMbew(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!report) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Valuation</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-6">
        <p className="text-sm text-slate-500 mb-1">Total Inventory Value</p>
        <p className="text-3xl font-bold">${report.total_inventory_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Price Control (MBEW)</h2>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
        <DataTable
          columns={[
            { key: "material_id", header: "Material" },
            { key: "plant_id", header: "Plant" },
            {
              key: "price_control",
              header: "Price Control",
              render: (r: MbewRow) => (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.price_control === "V" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.price_control === "V" ? "V — Moving Avg" : "S — Standard"}
                </span>
              ),
            },
            { key: "standard_price", header: "Std Price", render: (r: MbewRow) => r.standard_price != null ? `$${r.standard_price.toFixed(2)}` : "—" },
            { key: "moving_avg_price", header: "MAP", render: (r: MbewRow) => r.moving_avg_price != null ? `$${r.moving_avg_price.toFixed(2)}` : "—" },
            { key: "valuation_class", header: "Val. Class" },
          ]}
          data={mbew}
        />
      </div>

      <h2 className="text-lg font-semibold mb-3">Inventory Valuation (View)</h2>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <DataTable
          columns={[
            { key: "material_id", header: "Material" },
            { key: "plant_id", header: "Plant" },
            { key: "storage_location", header: "SLoc" },
            { key: "total_base", header: "Cases", render: (r: ValuationItem) => r.total_base.toLocaleString() },
            { key: "total_parallel", header: "Pounds", render: (r: ValuationItem) => r.total_parallel.toLocaleString("en-US", { minimumFractionDigits: 2 }) },
            { key: "inventory_value", header: "Value", render: (r: ValuationItem) => `$${r.inventory_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          ]}
          data={report.items}
        />
        <div className="border-t border-slate-200 px-4 py-3 text-right font-semibold text-sm">
          Total: ${report.total_inventory_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
