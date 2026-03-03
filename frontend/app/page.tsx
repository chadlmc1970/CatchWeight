'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Enhanced with AI Focus */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="relative px-8 py-16 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20 flex-shrink-0">
                <span className="text-4xl">⚖️</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-white">
                    Catch Weight Intelligence
                  </h1>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                    AI-Powered
                  </span>
                </div>
                <p className="text-xl text-blue-100 font-medium max-w-3xl">
                  Real-time weight variance tracking meets predictive analytics for SAP S/4HANA
                </p>
              </div>
            </div>
            <Link
              href="/forecasting"
              className="px-6 py-3 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2 whitespace-nowrap"
            >
              <span>✨</span> View AI Insights
            </Link>
          </div>

          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <StatBox
              icon="🤖"
              label="AI Forecasting"
              value="Active"
              description="Predictive analytics enabled"
            />
            <StatBox
              icon="📊"
              label="Data Products"
              value="5"
              description="Real-time analytical views"
            />
            <StatBox
              icon="📦"
              label="Material Types"
              value="13"
              description="Catch-weight items"
            />
            <StatBox
              icon="⚡"
              label="Real-Time"
              value="Live"
              description="Instant reconciliation"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-12 max-w-7xl mx-auto space-y-12">
        {/* AI & Intelligence Section - NEW! */}
        <section>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              <span>🚀</span> Latest Enhancements
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">AI-Powered Intelligence Layer</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced predictive analytics and forecasting capabilities built on real-time catch-weight data
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <AIFeatureCard
              icon="🤖"
              title="Supplier Performance AI"
              description="Machine learning-based reliability scoring with predicted variance ranges"
              badge="ML"
            />
            <AIFeatureCard
              icon="📊"
              title="Margin Forecasting"
              description="30-day erosion predictions using 7-day moving average with confidence bands"
              badge="Predictive"
            />
            <AIFeatureCard
              icon="⚠️"
              title="Smart Reorder Alerts"
              description="Consumption-based inventory alerts to prevent stockouts"
              badge="Real-time"
            />
          </div>
        </section>

        {/* POC Overview */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Enterprise Catch-Weight Solution</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              End-to-end SAP S/4HANA catch-weight material management with real-time inventory tracking,
              valuation, reconciliation, and AI-driven insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <FeatureCard
              icon="🎯"
              title="Business Challenge"
              description="Managing weight-based materials (meat, produce, commodities) where actual weight varies:"
              items={[
                "Inventory valuation discrepancies",
                "Margin erosion from weight variance",
                "Complex reconciliation processes",
                "Limited forecasting visibility"
              ]}
              gradient="from-red-500 to-red-600"
            />
            <FeatureCard
              icon="✨"
              title="Complete Solution"
              description="Intelligent catch-weight lifecycle management:"
              items={[
                "AI supplier performance tracking",
                "Predictive margin erosion analysis",
                "Real-time inventory reconstruction",
                "Automated reconciliation & alerts"
              ]}
              gradient="from-green-500 to-green-600"
            />
          </div>
        </section>

        {/* Navigation Guide */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explore the Application</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NavCard
              href="/forecasting"
              icon="✨"
              title="AI Insights"
              description="Predictive analytics, supplier scoring, and smart reorder alerts"
              badge="NEW"
              color="purple"
              onHover={() => setHoveredCard('forecasting')}
              isHovered={hoveredCard === 'forecasting'}
            />

            <NavCard
              href="/dashboard"
              icon="📊"
              title="Executive Dashboard"
              description="Single-viewport KPI overview with key metrics"
              color="blue"
              onHover={() => setHoveredCard('dashboard')}
              isHovered={hoveredCard === 'dashboard'}
            />

            <NavCard
              href="/analytics"
              icon="📈"
              title="Analytics Deep Dive"
              description="Weight drift trends and margin erosion analysis"
              color="indigo"
              onHover={() => setHoveredCard('analytics')}
              isHovered={hoveredCard === 'analytics'}
            />

            <NavCard
              href="/materials"
              icon="📦"
              title="Materials Master"
              description="Catch-weight material definitions with UoM"
              color="green"
              onHover={() => setHoveredCard('materials')}
              isHovered={hoveredCard === 'materials'}
            />

            <NavCard
              href="/movements"
              icon="🔄"
              title="Goods Movements"
              description="Transaction history with dual-UoM tracking"
              color="cyan"
              onHover={() => setHoveredCard('movements')}
              isHovered={hoveredCard === 'movements'}
            />

            <NavCard
              href="/inventory"
              icon="📋"
              title="Inventory Positions"
              description="Stock levels by material, plant, and location"
              color="teal"
              onHover={() => setHoveredCard('inventory')}
              isHovered={hoveredCard === 'inventory'}
            />

            <NavCard
              href="/valuation"
              icon="💰"
              title="Inventory Valuation"
              description="Financial value with standard/moving average"
              color="amber"
              onHover={() => setHoveredCard('valuation')}
              isHovered={hoveredCard === 'valuation'}
            />

            <NavCard
              href="/reconciliation"
              icon="🔍"
              title="Reconciliation"
              description="Balance table vs document comparison"
              color="red"
              onHover={() => setHoveredCard('reconciliation')}
              isHovered={hoveredCard === 'reconciliation'}
            />
          </div>
        </section>

        {/* BDC Implementation Section */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-10 text-white shadow-2xl">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">🚀</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">Implementation in SAP Business Data Cloud (BDC)</h2>
              <p className="text-slate-300 text-lg">
                This POC architecture translates directly to BDC for enterprise-scale deployment
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BDCStep
              step="1"
              title="Data Integration"
              items={[
                "Connect to S/4HANA via standard CDS views",
                "Extract MARA, MSEG, MKPF, MBEW, MARM tables",
                "Real-time or scheduled replication",
                "Delta sync for performance"
              ]}
            />

            <BDCStep
              step="2"
              title="Data Modeling"
              items={[
                "Create BDC views matching POC structure",
                "Implement v_weight_drift_trend logic",
                "Implement v_margin_erosion logic",
                "Apply business rules and transformations"
              ]}
            />

            <BDCStep
              step="3"
              title="Data Products"
              items={[
                "Expose views as BDC Data Products",
                "Define refresh schedules and triggers",
                "Set up data quality monitoring",
                "Configure access policies"
              ]}
            />

            <BDCStep
              step="4"
              title="Consumption"
              items={[
                "SAC dashboards (like this POC UI)",
                "Direct SQL access for data scientists",
                "API endpoints for custom applications",
                "Snowflake/Databricks integration"
              ]}
            />
          </div>

          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-bold text-lg mb-2">Key BDC Advantages</h3>
                <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> No impact on S/4HANA performance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Scalable to millions of transactions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Multi-system data harmonization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Built-in data governance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Self-service analytics ready
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Cloud-native architecture
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                <span>✨</span> AI-Powered Analytics
              </div>
              <h2 className="text-4xl font-bold mb-4">Ready to See the Intelligence in Action?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Experience AI-driven supplier performance analysis, predictive margin forecasting, and intelligent reorder recommendations
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/forecasting"
                  className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  ✨ View AI Insights →
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  📊 Executive Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Component: Stat Box
function StatBox({ icon, label, value, description }: { icon: string; label: string; value: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-sm text-blue-200 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-4xl font-black text-white mb-1">{value}</div>
      <div className="text-sm text-blue-100">{description}</div>
    </div>
  );
}

// Component: Feature Card
function FeatureCard({ icon, title, description, items, gradient }: {
  icon: string;
  title: string;
  description: string;
  items: string[];
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-blue-600 mt-0.5">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: AI Feature Card - NEW!
function AIFeatureCard({ icon, title, description, badge }: {
  icon: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
        {badge}
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Component: Navigation Card
function NavCard({ href, icon, title, description, badge, color, onHover, isHovered }: {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  color: string;
  onHover: () => void;
  isHovered: boolean;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
    teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
    amber: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  }[color];

  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      onMouseLeave={() => onHover()}
      className={`relative group block bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:shadow-2xl transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}
    >
      {badge && (
        <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full shadow-lg">
          {badge}
        </div>
      )}
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-md`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

// Component: BDC Step
function BDCStep({ step, title, items }: { step: string; title: string; items: string[] }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {step}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-blue-400 mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
