"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { CompactKPICard, ChartCard } from "@/components/dashboard";

interface Material {
  material_id: string;
  material_type: string;
  base_uom: string;
  catch_weight_flag: boolean;
}

interface MaterialDetail extends Material {
  conversions: { alt_uom: string; numerator: number; denominator: number }[];
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selected, setSelected] = useState<MaterialDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Material[]>("/v1/materials")
      .then(setMaterials)
      .catch((e) => setError(e.message));
  }, []);

  const selectMaterial = (id: string) => {
    apiFetch<MaterialDetail>(`/v1/materials/${id}`)
      .then(setSelected)
      .catch((e) => setError(e.message));
  };

  const catchWeightMaterials = materials.filter(m => m.catch_weight_flag).length;
  const standardMaterials = materials.length - catchWeightMaterials;

  if (error) return <p className="text-red-600 p-6">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-900">📦 Materials Master</h1>
      </div>

      {/* Compact KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CompactKPICard
          icon="📦"
          value={materials.length}
          label="Total Materials"
          status="neutral"
        />
        <CompactKPICard
          icon="⚖️"
          value={catchWeightMaterials}
          label="Catch Weight Materials"
          status="success"
        />
        <CompactKPICard
          icon="📏"
          value={standardMaterials}
          label="Standard Materials"
          status="neutral"
        />
      </div>

      {/* Materials Table */}
      <ChartCard
        title="Material Master Data"
        infoText="Master data for all materials including catch-weight items. Click a material ID to view UoM conversion definitions."
      >
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              {
                key: "material_id",
                header: "Material ID",
                render: (r: Material) => (
                  <button onClick={() => selectMaterial(r.material_id)} className="text-blue-600 hover:underline font-medium">
                    {r.material_id}
                  </button>
                ),
              },
              { key: "material_type", header: "Type" },
              { key: "base_uom", header: "Base UoM" },
              {
                key: "catch_weight_flag",
                header: "Catch Weight",
                render: (r: Material) => (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.catch_weight_flag ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.catch_weight_flag ? "CW" : "Std"}
                  </span>
                ),
              },
            ]}
            data={materials}
          />
        </div>
      </ChartCard>

      {/* UoM Conversions */}
      {selected && (
        <ChartCard
          title={`${selected.material_id} — UoM Conversions`}
          infoText="Unit of Measure conversion factors for dual-UoM tracking. Shows how base UoM converts to alternative units."
        >
          {selected.conversions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No conversions defined for this material</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Alt UoM</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Numerator</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Denominator</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.conversions.map((c) => (
                    <tr key={c.alt_uom} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">{c.alt_uom}</td>
                      <td className="px-4 py-3">{c.numerator}</td>
                      <td className="px-4 py-3">{c.denominator}</td>
                      <td className="px-4 py-3 font-medium">1 {selected.base_uom} = {c.numerator / c.denominator} {c.alt_uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      )}
    </div>
  );
}
