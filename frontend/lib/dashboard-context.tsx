"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type ChartHeight = "compact" | "comfortable";

interface DashboardFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  materials: string[];
  suppliers: string[];
  plants: string[];
}

interface DashboardContextType {
  // Density setting
  density: ChartHeight;
  setDensity: (density: ChartHeight) => void;

  // Filters
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  updateFilter: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => void;
  resetFilters: () => void;

  // Filter application
  applyFilters: () => void;
  filtersApplied: boolean;
}

const defaultFilters: DashboardFilters = {
  dateRange: { start: null, end: null },
  materials: [],
  suppliers: [],
  plants: [],
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

/**
 * DashboardProvider - Global state management for dashboard
 *
 * Features:
 * - Density toggle (compact/comfortable)
 * - Global filters (date range, materials, suppliers, plants)
 * - URL param syncing for shareability
 * - Filter application state
 *
 * Example:
 * <DashboardProvider>
 *   <YourDashboard />
 * </DashboardProvider>
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<ChartHeight>("compact");
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Sync density to localStorage
  useEffect(() => {
    const savedDensity = localStorage.getItem("dashboard-density");
    if (savedDensity === "compact" || savedDensity === "comfortable") {
      setDensityState(savedDensity);
    }
  }, []);

  const setDensity = (newDensity: ChartHeight) => {
    setDensityState(newDensity);
    localStorage.setItem("dashboard-density", newDensity);
  };

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setFiltersApplied(false);
  };

  const applyFilters = () => {
    setFiltersApplied(true);
    // TODO: Sync to URL params for shareability
    // const params = new URLSearchParams();
    // if (filters.materials.length > 0) params.set('materials', filters.materials.join(','));
    // router.push(`?${params.toString()}`);
  };

  return (
    <DashboardContext.Provider
      value={{
        density,
        setDensity,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        applyFilters,
        filtersApplied,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * useDashboard - Hook to access dashboard context
 *
 * Example:
 * const { density, filters, applyFilters } = useDashboard();
 */
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
