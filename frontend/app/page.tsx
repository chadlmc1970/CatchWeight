'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="relative px-8 py-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20">
              <span className="text-4xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2">
                SAP S/4HANA Catch Weight POC
              </h1>
              <p className="text-xl text-blue-100 font-medium">
                Demonstrating End-to-End Inventory Management with Weight Variance Tracking
              </p>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <StatBox
              icon="📊"
              label="Data Products"
              value="2"
              description="Real-time analytics views"
            />
            <StatBox
              icon="📦"
              label="Material Types"
              value="13"
              description="Catch-weight items"
            />
            <StatBox
              icon="🎯"
              label="Movement Types"
              value="5+"
              description="Goods movements tracked"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-12 max-w-7xl mx-auto space-y-12">
        {/* POC Overview */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Proof of Concept Overview</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This POC demonstrates SAP S/4HANA catch-weight material management with full inventory tracking,
              valuation, and real-time analytics for weight variance and margin impact analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <FeatureCard
              icon="🎯"
              title="Business Challenge"
              description="Managing materials sold by weight (chicken, beef, produce) where actual weight varies from estimated weight, causing:"
              items={[
                "Inventory valuation discrepancies",
                "Margin erosion from weight variance",
                "Reconciliation complexity",
                "Financial reporting challenges"
              ]}
              gradient="from-red-500 to-red-600"
            />
            <FeatureCard
              icon="✨"
              title="Solution Demonstrated"
              description="Complete catch-weight material lifecycle with:"
              items={[
                "Dual-UoM tracking (cases + weight)",
                "Real-time inventory reconstruction",
                "Automated reconciliation",
                "Executive analytics dashboards"
              ]}
              gradient="from-green-500 to-green-600"
            />
          </div>
        </section>

        {/* Navigation Guide */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explore the Application</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NavCard
              href="/dashboard"
              icon="📊"
              title="Executive Dashboard"
              description="Single-viewport overview with KPIs and charts (no scrolling)"
              badge="START HERE"
              color="blue"
              onHover={() => setHoveredCard('dashboard')}
              isHovered={hoveredCard === 'dashboard'}
            />

            <NavCard
              href="/analytics"
              icon="📈"
              title="Analytics Deep Dive"
              description="Detailed weight drift trends and margin erosion analysis"
              color="indigo"
              onHover={() => setHoveredCard('analytics')}
              isHovered={hoveredCard === 'analytics'}
            />

            <NavCard
              href="/materials"
              icon="📦"
              title="Materials Master"
              description="Catch-weight material definitions with UoM conversions"
              color="purple"
              onHover={() => setHoveredCard('materials')}
              isHovered={hoveredCard === 'materials'}
            />

            <NavCard
              href="/movements"
              icon="🔄"
              title="Goods Movements"
              description="Transaction history with dual-UoM quantity tracking"
              color="indigo"
              onHover={() => setHoveredCard('movements')}
              isHovered={hoveredCard === 'movements'}
            />

            <NavCard
              href="/inventory"
              icon="📋"
              title="Inventory Positions"
              description="Current stock levels by material, plant, and storage location"
              color="green"
              onHover={() => setHoveredCard('inventory')}
              isHovered={hoveredCard === 'inventory'}
            />

            <NavCard
              href="/valuation"
              icon="💰"
              title="Inventory Valuation"
              description="Financial value calculation using standard/moving average price"
              color="amber"
              onHover={() => setHoveredCard('valuation')}
              isHovered={hoveredCard === 'valuation'}
            />

            <NavCard
              href="/reconciliation"
              icon="🔍"
              title="Reconciliation"
              description="Balance table vs document rebuild comparison"
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

        {/* Technical Architecture */}
        <section className="bg-white rounded-3xl p-10 shadow-xl border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Technical Architecture</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <TechStack
              layer="Data Layer"
              icon="🗄️"
              technologies={[
                "PostgreSQL (SAP HANA equivalent)",
                "5 Core SAP Tables",
                "3 Analytical Views",
                "Dual-UoM Support"
              ]}
            />

            <TechStack
              layer="API Layer"
              icon="⚡"
              technologies={[
                "FastAPI (Python)",
                "REST Endpoints",
                "Real-time Queries",
                "Auto-generated Docs"
              ]}
            />

            <TechStack
              layer="UI Layer"
              icon="🎨"
              technologies={[
                "Next.js + React",
                "Recharts Visualizations",
                "SAC-inspired Design",
                "Responsive Layout"
              ]}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start with the Analytics Dashboard to see the data products in action, then explore individual transactions and reconciliation flows.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              View Executive Dashboard →
            </Link>
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

// Component: Tech Stack
function TechStack({ layer, icon, technologies }: { layer: string; icon: string; technologies: string[] }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{layer}</h3>
      <ul className="space-y-2">
        {technologies.map((tech, idx) => (
          <li key={idx} className="text-sm text-gray-600 bg-gray-50 rounded-lg py-2 px-3">
            {tech}
          </li>
        ))}
      </ul>
    </div>
  );
}
