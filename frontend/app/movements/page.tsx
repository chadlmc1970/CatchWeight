"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface Material {
  material_id: string;
}

interface Movement {
  document_number: string;
  document_year: string;
  posting_date: string;
  entry_timestamp: string;
  user_id: string;
}

const MOVEMENT_TYPES = [
  { value: "101", label: "101 — Goods Receipt" },
  { value: "102", label: "102 — GR Reversal" },
  { value: "201", label: "201 — GI to Cost Center" },
  { value: "261", label: "261 — GI to Production" },
  { value: "601", label: "601 — GI for Delivery" },
];

export default function MovementsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    material_id: "",
    plant_id: "P100",
    storage_location: "S001",
    movement_type: "101",
    quantity_base_uom: "",
    quantity_parallel_uom: "",
    batch_id: "",
    posting_date: new Date().toISOString().slice(0, 10),
    user_id: "WEBUSER",
  });

  const loadMovements = () => {
    apiFetch<Movement[]>("/v1/movements?limit=20").then(setMovements).catch(() => {});
  };

  useEffect(() => {
    apiFetch<Material[]>("/v1/materials").then(setMaterials).catch(() => {});
    loadMovements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const result = await apiFetch<{ document_number: string }>("/v1/movements", {
        method: "POST",
        body: JSON.stringify({
          posting_date: form.posting_date,
          user_id: form.user_id,
          lines: [
            {
              material_id: form.material_id,
              plant_id: form.plant_id,
              storage_location: form.storage_location,
              movement_type: form.movement_type,
              quantity_base_uom: parseFloat(form.quantity_base_uom),
              quantity_parallel_uom: parseFloat(form.quantity_parallel_uom),
              batch_id: form.batch_id || undefined,
              uom_base: "CS",
              uom_parallel: "LB",
            },
          ],
        }),
      });
      setSuccess(`Document ${result.document_number} posted successfully`);
      loadMovements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Posting failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Goods Movement</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Field label="Material">
            <select value={form.material_id} onChange={(e) => setForm({ ...form, material_id: e.target.value })} required className="input">
              <option value="">Select...</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>{m.material_id}</option>
              ))}
            </select>
          </Field>
          <Field label="Plant">
            <select value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })} className="input">
              <option value="P100">P100 — Springdale AR</option>
              <option value="P200">P200 — Amarillo TX</option>
            </select>
          </Field>
          <Field label="Storage Location">
            <select value={form.storage_location} onChange={(e) => setForm({ ...form, storage_location: e.target.value })} className="input">
              <option value="S001">S001 — Cold Storage</option>
              <option value="S002">S002 — Staging</option>
            </select>
          </Field>
          <Field label="Movement Type">
            <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })} className="input">
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Cases (Base UoM)">
            <input type="number" step="1" min="1" value={form.quantity_base_uom} onChange={(e) => setForm({ ...form, quantity_base_uom: e.target.value })} required className="input" placeholder="e.g. 50" />
          </Field>
          <Field label="Actual Pounds (Parallel UoM)">
            <input type="number" step="0.01" min="0.01" value={form.quantity_parallel_uom} onChange={(e) => setForm({ ...form, quantity_parallel_uom: e.target.value })} required className="input" placeholder="e.g. 1250.75" />
          </Field>
          <Field label="Batch ID">
            <input type="text" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="input" placeholder="e.g. B20260303" />
          </Field>
          <Field label="Posting Date">
            <input type="date" value={form.posting_date} onChange={(e) => setForm({ ...form, posting_date: e.target.value })} required className="input" />
          </Field>
          <Field label="User ID">
            <input type="text" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="input" />
          </Field>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        <button type="submit" disabled={submitting} className="bg-slate-900 text-white px-6 py-2 rounded font-medium hover:bg-slate-800 disabled:opacity-50">
          {submitting ? "Posting..." : "Post Goods Movement"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Movement History</h2>
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
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
