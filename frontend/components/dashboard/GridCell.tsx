"use client";

import React from "react";

interface GridCellProps {
  span?: {
    col?: number; // Column span (1-4)
    row?: number; // Row span (1-4)
  };
  children: React.ReactNode;
  className?: string;
}

/**
 * GridCell - Wrapper for dashboard grid items with flexible span control
 *
 * Example:
 * <GridCell span={{col: 2, row: 1}}>
 *   <ChartCard>...</ChartCard>
 * </GridCell>
 */
export default function GridCell({
  span = { col: 1, row: 1 },
  children,
  className = "",
}: GridCellProps) {
  // Convert span to Tailwind classes
  const colSpanClass = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
  }[span.col || 1] || "lg:col-span-1";

  const rowSpanClass = {
    1: "lg:row-span-1",
    2: "lg:row-span-2",
    3: "lg:row-span-3",
    4: "lg:row-span-4",
  }[span.row || 1] || "lg:row-span-1";

  return (
    <div className={`${colSpanClass} ${rowSpanClass} ${className}`}>
      {children}
    </div>
  );
}
