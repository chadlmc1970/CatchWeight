"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "🏠 Overview" },
  { href: "/analytics", label: "📊 Analytics" },
  { href: "/forecasting", label: "✨ AI Insights" },
  { href: "/materials", label: "Materials" },
  { href: "/movements", label: "Goods Movement" },
  { href: "/inventory", label: "Inventory" },
  { href: "/valuation", label: "Valuation" },
  { href: "/reconciliation", label: "Reconciliation" },
  { href: "/back-postings", label: "Back-Postings" },
  { href: "/admin", label: "⚙️ Admin" },
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
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-lg tracking-tight mr-4">CatchWeight POC</span>
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
      <div className="ml-auto flex items-center gap-3">
        {message && (
          <span className="text-xs bg-slate-800 px-3 py-1 rounded">
            {message}
          </span>
        )}
        <button
          onClick={handleReloadData}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-3 py-1.5 rounded font-medium transition-colors"
        >
          {loading ? "⏳ Loading..." : "🔄 Reload Data"}
        </button>
      </div>
    </nav>
  );
}
