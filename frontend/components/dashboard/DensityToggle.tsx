"use client";

import React from "react";

interface DensityToggleProps {
  value: "compact" | "comfortable";
  onChange: (value: "compact" | "comfortable") => void;
  className?: string;
}

/**
 * DensityToggle - Toggle between compact and comfortable chart heights
 *
 * Compact: 200px charts, 80px KPIs (SAC power-user style)
 * Comfortable: 300px charts, 120px KPIs (standard view)
 *
 * Example:
 * <DensityToggle
 *   value={density}
 *   onChange={setDensity}
 * />
 */
export default function DensityToggle({
  value,
  onChange,
  className = "",
}: DensityToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-slate-600 font-medium">Density:</span>
      <div className="flex bg-slate-200 rounded-lg p-1">
        <button
          onClick={() => onChange("compact")}
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            value === "compact"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Compact
        </button>
        <button
          onClick={() => onChange("comfortable")}
          className={`px-3 py-1 text-xs font-medium rounded transition-all ${
            value === "comfortable"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Comfortable
        </button>
      </div>
    </div>
  );
}
