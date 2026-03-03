"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface ValuationReport {
  items: { material_id: string; plant_id: string; storage_location: string; total_base: number; total_parallel: number; inventory_value: number }[];
  total_inventory_value: number;
}

interface ReconciliationReport {
  all_reconciled: boolean;
  positions: { material_id: string; reconciled: boolean }[];
}

interface BackPosting {
  document_number: string;
  posting_date: string;
  entry_timestamp: string;
  delta_days: number;
}

interface Movement {
  document_number: string;
  document_year: string;
  posting_date: string;
  entry_timestamp: string;
  user_id: string;
}

export default function Dashboard() {
  const [valuation, setValuation] = useState<ValuationReport | null>(null);
  const [recon, setRecon] = useState<ReconciliationReport | null>(null);
  const [backPostings, setBackPostings] = useState<BackPosting[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<ValuationReport>("/v1/valuation/report"),
      apiFetch<ReconciliationReport>("/v1/reconciliation"),
      apiFetch<BackPosting[]>("/v1/back-postings"),
      apiFetch<Movement[]>("/v1/movements?limit=10"),
    ])
      .then(([v, r, b, m]) => {
        setValuation(v);
        setRecon(r);
        setBackPostings(b);
        setMovements(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!valuation) return <p className="text-slate-500">Loading...</p>;

  const materialCount = new Set(valuation.items.map((i) => i.material_id)).size;
  const reconStatus = recon?.all_reconciled;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card label="Materials" value={String(materialCount)} />
        <Card
          label="Total Inventory Value"
          value={`$${valuation.total_inventory_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        />
        <Card
          label="Reconciliation"
          value={reconStatus ? "PASS" : "FAIL"}
          color={reconStatus ? "text-green-600" : "text-red-600"}
        />
        <Card label="Back-Postings" value={String(backPostings.length)} color={backPostings.length > 0 ? "text-amber-600" : ""} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Movements</h2>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <DataTable
          columns={[
            { key: "document_number", header: "Doc #" },
            { key: "document_year", header: "Year" },
            { key: "posting_date", header: "Posting Date" },
            { key: "entry_timestamp", header: "Entry Time", render: (r: Movement) => r.entry_timestamp?.slice(0, 19) },
            { key: "user_id", header: "User" },
          ]}
          data={movements}
          emptyMessage="No movements yet"
        />
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-slate-900"}`}>{value}</p>
    </div>
  );
}
