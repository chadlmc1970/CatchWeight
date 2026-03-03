"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Position {
  material_id: string;
  plant_id: string;
  storage_location: string;
  balance_table: { base: number; parallel: number };
  document_rebuild: { base: number; parallel: number };
  discrepancy: { base: number; parallel: number };
  reconciled: boolean;
}

interface ReconReport {
  all_reconciled: boolean;
  positions: Position[];
}

export default function ReconciliationPage() {
  const [report, setReport] = useState<ReconReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ReconReport>("/v1/reconciliation")
      .then(setReport)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!report) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reconciliation</h1>

      <div className={`rounded-lg p-4 mb-6 border ${report.all_reconciled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <p className={`text-lg font-semibold ${report.all_reconciled ? "text-green-700" : "text-red-700"}`}>
          {report.all_reconciled
            ? "All positions reconciled — document rebuild matches balance tables"
            : "Discrepancies detected — document rebuild does NOT match balance tables"}
        </p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2 font-semibold" rowSpan={2}>Material</th>
              <th className="text-left px-3 py-2 font-semibold" rowSpan={2}>Plant</th>
              <th className="text-left px-3 py-2 font-semibold" rowSpan={2}>SLoc</th>
              <th className="text-center px-3 py-2 font-semibold border-l border-slate-200" colSpan={2}>Balance Table</th>
              <th className="text-center px-3 py-2 font-semibold border-l border-slate-200" colSpan={2}>Document Rebuild</th>
              <th className="text-center px-3 py-2 font-semibold border-l border-slate-200" colSpan={2}>Discrepancy</th>
              <th className="text-center px-3 py-2 font-semibold border-l border-slate-200" rowSpan={2}>Status</th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-right px-3 py-1 text-xs font-medium border-l border-slate-200">Cases</th>
              <th className="text-right px-3 py-1 text-xs font-medium">Pounds</th>
              <th className="text-right px-3 py-1 text-xs font-medium border-l border-slate-200">Cases</th>
              <th className="text-right px-3 py-1 text-xs font-medium">Pounds</th>
              <th className="text-right px-3 py-1 text-xs font-medium border-l border-slate-200">Cases</th>
              <th className="text-right px-3 py-1 text-xs font-medium">Pounds</th>
            </tr>
          </thead>
          <tbody>
            {report.positions.map((p, i) => (
              <tr key={i} className={`border-b border-slate-100 ${!p.reconciled ? "bg-red-50" : "hover:bg-slate-50"}`}>
                <td className="px-3 py-2 font-medium">{p.material_id}</td>
                <td className="px-3 py-2">{p.plant_id}</td>
                <td className="px-3 py-2">{p.storage_location}</td>
                <td className="px-3 py-2 text-right border-l border-slate-100">{p.balance_table.base.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{p.balance_table.parallel.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right border-l border-slate-100">{p.document_rebuild.base.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{p.document_rebuild.parallel.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className={`px-3 py-2 text-right border-l border-slate-100 ${p.discrepancy.base !== 0 ? "text-red-600 font-semibold" : ""}`}>
                  {p.discrepancy.base}
                </td>
                <td className={`px-3 py-2 text-right ${p.discrepancy.parallel !== 0 ? "text-red-600 font-semibold" : ""}`}>
                  {p.discrepancy.parallel.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center border-l border-slate-100">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.reconciled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.reconciled ? "OK" : "DRIFT"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
