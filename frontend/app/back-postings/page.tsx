"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface BackPosting {
  document_number: string;
  document_year: string;
  posting_date: string;
  entry_timestamp: string;
  delta_days: number;
}

export default function BackPostingsPage() {
  const [data, setData] = useState<BackPosting[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<BackPosting[]>("/v1/back-postings")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Back-Postings</h1>

      <div className={`rounded-lg p-4 mb-6 border ${data.length === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        <p className={`text-lg font-semibold ${data.length === 0 ? "text-green-700" : "text-amber-700"}`}>
          {data.length === 0
            ? "No back-postings detected"
            : `${data.length} back-posting${data.length > 1 ? "s" : ""} detected — documents entered after their posting date`}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <DataTable
          columns={[
            { key: "document_number", header: "Doc #" },
            { key: "document_year", header: "Year" },
            { key: "posting_date", header: "Posting Date" },
            { key: "entry_timestamp", header: "Entry Timestamp", render: (r: BackPosting) => r.entry_timestamp?.slice(0, 19) },
            {
              key: "delta_days",
              header: "Delta (Days)",
              render: (r: BackPosting) => (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.delta_days > 7 ? "bg-red-100 text-red-700" : r.delta_days > 3 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.delta_days} day{r.delta_days !== 1 ? "s" : ""}
                </span>
              ),
            },
          ]}
          data={data}
          emptyMessage="No back-postings found"
        />
      </div>
    </div>
  );
}
