"use client";

import React from "react";

interface DashboardGridProps {
  cols?: number; // Number of columns (default: 2)
  rows?: number; // Number of rows (default: auto)
  gap?: number; // Gap in Tailwind units (default: 4)
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardGrid - Responsive 12-column grid system for dashboard layouts
 *
 * Supports flexible column/row spans and responsive breakpoints:
 * - Desktop (lg): Uses specified cols
 * - Tablet (md): Falls back to 2 columns
 * - Mobile: Single column stack
 *
 * Example:
 * <DashboardGrid cols={2} rows={2} gap={4}>
 *   <GridCell span={{col: 1, row: 1}}>...</GridCell>
 * </DashboardGrid>
 */
export default function DashboardGrid({
  cols = 2,
  rows,
  gap = 4,
  children,
  className = "",
}: DashboardGridProps) {
  // Convert cols to Tailwind grid-cols classes
  const colsClass = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }[cols] || "lg:grid-cols-2";

  // Convert gap to Tailwind gap classes
  const gapClass = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  }[gap] || "gap-4";

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${colsClass} ${gapClass} ${className}`}
      style={{
        gridAutoRows: "auto", // Always use auto height to prevent stretching
      }}
    >
      {children}
    </div>
  );
}
