"use client";

import React from "react";

export type KPITrend = "up" | "down" | "neutral";
export type KPIStatus = "success" | "warning" | "danger" | "neutral";

interface CompactKPICardProps {
  icon?: string;
  value: string | number;
  label: string;
  trend?: {
    direction: KPITrend;
    value?: string;
  };
  status?: KPIStatus;
  className?: string;
}

/**
 * CompactKPICard - Space-efficient KPI display for dashboards
 *
 * Features:
 * - Horizontal layout (80px height)
 * - Icon | Value | Label | Trend
 * - Color-coded borders (green/yellow/red/neutral)
 *
 * Example:
 * <CompactKPICard
 *   icon="📈"
 *   value="42.5%"
 *   label="Drift Rate"
 *   trend={{direction: "up", value: "+2.3%"}}
 *   status="warning"
 * />
 */
export default function CompactKPICard({
  icon,
  value,
  label,
  trend,
  status = "neutral",
  className = "",
}: CompactKPICardProps) {
  // Border color based on status
  const borderColor = {
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    danger: "border-l-red-500",
    neutral: "border-l-slate-300",
  }[status];

  // Text color for value based on status
  const valueColor = {
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    neutral: "text-slate-900",
  }[status];

  // Trend indicator
  const trendIcon = trend
    ? trend.direction === "up"
      ? "↗"
      : trend.direction === "down"
      ? "↘"
      : "→"
    : null;

  const trendColor =
    trend?.direction === "up"
      ? "text-green-600"
      : trend?.direction === "down"
      ? "text-red-600"
      : "text-slate-500";

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-l-4 ${borderColor} h-20 flex items-center px-4 gap-4 ${className}`}
    >
      {/* Icon */}
      {icon && <div className="text-3xl">{icon}</div>}

      {/* Value */}
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>

      {/* Label */}
      <div className="flex-1 text-sm text-slate-600 font-medium">{label}</div>

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <span className="text-lg">{trendIcon}</span>
          {trend.value && <span>{trend.value}</span>}
        </div>
      )}
    </div>
  );
}
