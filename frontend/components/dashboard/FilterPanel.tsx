"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterPanelProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onApply?: () => void;
  onReset?: () => void;
}

/**
 * FilterPanel - Collapsible sidebar for dashboard filters
 *
 * Features:
 * - Collapsible (280px open, 48px collapsed)
 * - Smooth animations (framer-motion)
 * - Apply/Reset buttons
 * - Sticky positioning
 *
 * Example:
 * <FilterPanel onApply={handleApply} onReset={handleReset}>
 *   <DateRangePicker... />
 *   <MultiSelect options={materials}... />
 * </FilterPanel>
 */
export default function FilterPanel({
  children,
  defaultOpen = true,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      className="h-full bg-slate-50 border-r border-slate-200 flex flex-col"
      initial={false}
      animate={{
        width: isOpen ? 280 : 48,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {/* Toggle Button */}
      <div className="h-12 flex items-center justify-center border-b border-slate-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
          aria-label={isOpen ? "Collapse filters" : "Expand filters"}
        >
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* Filter Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Scrollable Filter Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  🔍 Filters
                </h3>
                {children}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-200 p-4 space-y-2">
              <button
                onClick={onApply}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={onReset}
                className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors text-sm"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
