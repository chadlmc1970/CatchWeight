"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DataTable from "@/components/DataTable";

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

  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Materials</h1>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
        <DataTable
          columns={[
            {
              key: "material_id",
              header: "Material ID",
              render: (r: Material) => (
                <button onClick={() => selectMaterial(r.material_id)} className="text-blue-600 hover:underline">
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

      {selected && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">{selected.material_id} — UoM Conversions</h2>
          {selected.conversions.length === 0 ? (
            <p className="text-slate-500">No conversions defined</p>
          ) : (
            <table className="text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2">Alt UoM</th>
                  <th className="text-left px-4 py-2">Numerator</th>
                  <th className="text-left px-4 py-2">Denominator</th>
                  <th className="text-left px-4 py-2">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {selected.conversions.map((c) => (
                  <tr key={c.alt_uom} className="border-b border-slate-100">
                    <td className="px-4 py-2">{c.alt_uom}</td>
                    <td className="px-4 py-2">{c.numerator}</td>
                    <td className="px-4 py-2">{c.denominator}</td>
                    <td className="px-4 py-2">1 {selected.base_uom} = {c.numerator / c.denominator} {c.alt_uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
