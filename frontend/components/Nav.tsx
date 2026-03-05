"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "🏠 Overview" },
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/forecasting", label: "✨ AI Insights" },
  { href: "/materials", label: "Materials" },
  { href: "/movements", label: "Goods Movement" },
  { href: "/inventory", label: "Inventory" },
  { href: "/valuation", label: "Valuation" },
  { href: "/reconciliation", label: "Reconciliation" },
  { href: "/back-postings", label: "Back-Postings" },
];

export default function Nav() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReloadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/v1/seed`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage("✅ Realistic data loaded!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.detail || "Failed to load data"}`);
      }
    } catch (error) {
      setMessage(`❌ Connection error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-3 flex items-center gap-6 shadow-lg border-b border-slate-700">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 mr-4 group">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-105 transition-transform">
          ⚖️
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight leading-none">Catch Weight</span>
          <span className="text-[10px] text-blue-400 font-semibold tracking-wide">INTELLIGENCE</span>
        </div>
      </Link>

      {/* Navigation Links */}
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm hover:text-blue-300 transition-colors ${
            pathname === l.href ? "text-blue-400 font-semibold" : "text-slate-300"
          }`}
        >
          {l.label}
        </Link>
      ))}

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/admin"
          className={`text-sm hover:text-blue-300 transition-colors ${
            pathname === "/admin" ? "text-blue-400 font-semibold" : "text-slate-300"
          }`}
        >
          ⚙️ Admin
        </Link>
        {message && (
          <span className="text-xs bg-slate-800 px-3 py-1 rounded">
            {message}
          </span>
        )}
        <button
          onClick={handleReloadData}
          disabled={loading}
          className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 px-3 py-1.5 rounded font-medium transition-all shadow-md"
        >
          {loading ? "⏳ Loading..." : "🔄 Reload Data"}
        </button>
      </div>
    </nav>
  );
}
