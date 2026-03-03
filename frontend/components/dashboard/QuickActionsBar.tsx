"use client";

import React, { useState } from "react";

interface QuickActionsBarProps {
  onExport?: () => void;
  onRefresh?: () => void;
  onShare?: () => void;
  className?: string;
}

/**
 * QuickActionsBar - Action toolbar for dashboard operations
 *
 * Features:
 * - Export to PDF
 * - Refresh Data
 * - Share Dashboard (copy link)
 *
 * Example:
 * <QuickActionsBar
 *   onExport={handleExport}
 *   onRefresh={handleRefresh}
 *   onShare={handleShare}
 * />
 */
export default function QuickActionsBar({
  onExport,
  onRefresh,
  onShare,
  className = "",
}: QuickActionsBarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else {
      // Default: copy current URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div
      className={`bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-3 ${className}`}
    >
      <span className="text-sm text-slate-600 font-medium">Quick Actions:</span>

      {/* Export to PDF */}
      {onExport && (
        <button
          onClick={onExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>📄</span>
          Export PDF
        </button>
      )}

      {/* Refresh Data */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Refresh
        </button>
      )}

      {/* Share Dashboard */}
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span>{copied ? "✓" : "🔗"}</span>
        {copied ? "Link Copied!" : "Share"}
      </button>

      {/* Timestamp */}
      <div className="ml-auto text-xs text-slate-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
