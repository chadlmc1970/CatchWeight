"use client";

import React, { useState } from "react";

export type ChartHeight = "compact" | "comfortable" | "auto";

interface ChartCardProps {
  title: string;
  height?: ChartHeight;
  infoText?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * InfoIcon - Expandable information tooltip
 */
function InfoIcon({ explanation }: { explanation: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="inline-block relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-bold transition-colors cursor-pointer"
        aria-label="Information"
      >
        i
      </button>
      {isExpanded && (
        <div className="absolute z-10 mt-2 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 text-sm text-gray-700 leading-relaxed right-0">
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

/**
 * ChartCard - Standardized container for dashboard charts
 *
 * Supports two height modes:
 * - compact: 200px (for dense dashboard views)
 * - comfortable: 300px (for detailed analysis)
 *
 * Example:
 * <ChartCard title="Weight Drift" height="compact" infoText="...">
 *   <AreaChart... />
 * </ChartCard>
 */
export default function ChartCard({
  title,
  height = "comfortable",
  infoText,
  actions,
  children,
  className = "",
}: ChartCardProps) {
  const heightClass =
    height === "auto" ? "" :
    height === "compact" ? "h-[200px]" :
    "h-[300px]";

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          {title}
          {infoText && <InfoIcon explanation={infoText} />}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chart Content */}
      <div className={`px-6 pb-6 ${heightClass}`}>
        {children}
      </div>
    </div>
  );
}
