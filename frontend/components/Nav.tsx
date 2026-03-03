"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "🏠 Overview" },
  { href: "/analytics", label: "📊 Analytics" },
  { href: "/materials", label: "Materials" },
  { href: "/movements", label: "Goods Movement" },
  { href: "/inventory", label: "Inventory" },
  { href: "/valuation", label: "Valuation" },
  { href: "/reconciliation", label: "Reconciliation" },
  { href: "/back-postings", label: "Back-Postings" },
];

export default function Nav() {
  const pathname = usePathname();

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
    </nav>
  );
}
