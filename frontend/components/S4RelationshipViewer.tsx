'use client';

import React from 'react';

interface TableNode {
  name: string;
  description: string;
  category: 'master' | 'document' | 'stock' | 'valuation' | 'change';
  color: string;
  fields: string[];
}

interface Relationship {
  from: string;
  to: string;
  label: string;
}

export default function S4RelationshipViewer() {
  const tables: TableNode[] = [
    {
      name: 'MARA',
      description: 'Material Master General Data',
      category: 'master',
      color: 'bg-purple-100 border-purple-500',
      fields: ['material_id (PK)', 'material_type', 'base_uom', 'catch_weight_flag']
    },
    {
      name: 'MARM',
      description: 'Unit of Measure Conversions',
      category: 'master',
      color: 'bg-purple-100 border-purple-500',
      fields: ['material_id (FK)', 'alt_uom', 'numerator', 'denominator']
    },
    {
      name: 'MKPF',
      description: 'Material Document Header',
      category: 'document',
      color: 'bg-green-100 border-green-500',
      fields: ['document_number (PK)', 'document_year (PK)', 'posting_date', 'user_id']
    },
    {
      name: 'MSEG',
      description: 'Material Document Item',
      category: 'document',
      color: 'bg-green-100 border-green-500',
      fields: ['document_number (FK)', 'line_item', 'material_id (FK)', 'quantity_base_uom']
    },
    {
      name: 'MARD',
      description: 'Storage Location Stock',
      category: 'stock',
      color: 'bg-blue-100 border-blue-500',
      fields: ['material_id', 'plant_id', 'storage_location', 'stock_base_uom']
    },
    {
      name: 'MCHB',
      description: 'Batch Stock',
      category: 'stock',
      color: 'bg-blue-100 border-blue-500',
      fields: ['material_id', 'plant_id', 'batch_id', 'stock_base_uom']
    },
    {
      name: 'MBEW',
      description: 'Material Valuation',
      category: 'valuation',
      color: 'bg-amber-100 border-amber-500',
      fields: ['material_id', 'plant_id', 'price_control', 'standard_price']
    },
    {
      name: 'CDHDR',
      description: 'Change Document Header',
      category: 'change',
      color: 'bg-slate-100 border-slate-500',
      fields: ['change_number (PK)', 'object_class', 'change_timestamp']
    },
    {
      name: 'CDPOS',
      description: 'Change Document Position',
      category: 'change',
      color: 'bg-slate-100 border-slate-500',
      fields: ['change_number (FK)', 'field_name', 'old_value', 'new_value']
    }
  ];

  const relationships: Relationship[] = [
    { from: 'MARM', to: 'MARA', label: 'material_id' },
    { from: 'MSEG', to: 'MKPF', label: 'document_number + year' },
    { from: 'MSEG', to: 'MARA', label: 'material_id' },
    { from: 'CDPOS', to: 'CDHDR', label: 'change_number' }
  ];

  const assumptions = [
    {
      title: 'Catch-Weight Flag',
      description: 'Added boolean flag to MARA to identify catch-weight materials. In S4, this is derived from material type and UoM configuration.'
    },
    {
      title: 'Composite Primary Keys',
      description: 'Replicated S4\'s composite keys (e.g., MKPF uses document_number + document_year). This matches S4\'s document numbering system.'
    },
    {
      title: 'Parallel UoM Storage',
      description: 'MSEG stores both base_uom and parallel_uom quantities to support catch-weight scenarios (e.g., pounds vs. cases).'
    },
    {
      title: 'Stock Balance Tables',
      description: 'MARD (location-level) and MCHB (batch-level) stock balances are updated via triggers, mirroring S4\'s real-time stock update mechanism.'
    },
    {
      title: 'Change Documents',
      description: 'CDHDR/CDPOS structure replicates S4\'s change document framework for audit trails and data lineage.'
    },
    {
      title: 'Numeric Precision',
      description: 'NUMERIC(18,6) matches S4\'s QUAN data type precision for quantity fields to handle fractional catch-weights.'
    }
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'master': return '📦 Master Data';
      case 'document': return '📝 Document Tables';
      case 'stock': return '📊 Stock Balance';
      case 'valuation': return '💰 Valuation';
      case 'change': return '📋 Change Documents';
      default: return category;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-2">S4 to PostgreSQL Mapping</h2>
        <p className="text-blue-100">SAP S/4HANA table structures replicated in PostgreSQL for Catch-Weight POC</p>
      </div>

      {/* Table Relationship Diagram */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Table Relationships</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Master Data Column */}
          <div>
            <div className="text-sm font-bold text-purple-700 mb-3 uppercase tracking-wide">
              {getCategoryLabel('master')}
            </div>
            {tables.filter(t => t.category === 'master').map(table => (
              <div key={table.name} className={`${table.color} border-2 rounded-lg p-4 mb-4 shadow-md`}>
                <div className="font-mono font-bold text-lg text-slate-900 mb-1">{table.name}</div>
                <div className="text-xs text-slate-600 mb-3">{table.description}</div>
                <div className="space-y-1">
                  {table.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-700 bg-white/50 px-2 py-1 rounded">
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Document & Stock Column */}
          <div>
            <div className="text-sm font-bold text-green-700 mb-3 uppercase tracking-wide">
              {getCategoryLabel('document')}
            </div>
            {tables.filter(t => t.category === 'document').map(table => (
              <div key={table.name} className={`${table.color} border-2 rounded-lg p-4 mb-4 shadow-md`}>
                <div className="font-mono font-bold text-lg text-slate-900 mb-1">{table.name}</div>
                <div className="text-xs text-slate-600 mb-3">{table.description}</div>
                <div className="space-y-1">
                  {table.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-700 bg-white/50 px-2 py-1 rounded">
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-sm font-bold text-blue-700 mb-3 mt-6 uppercase tracking-wide">
              {getCategoryLabel('stock')}
            </div>
            {tables.filter(t => t.category === 'stock').map(table => (
              <div key={table.name} className={`${table.color} border-2 rounded-lg p-4 mb-4 shadow-md`}>
                <div className="font-mono font-bold text-lg text-slate-900 mb-1">{table.name}</div>
                <div className="text-xs text-slate-600 mb-3">{table.description}</div>
                <div className="space-y-1">
                  {table.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-700 bg-white/50 px-2 py-1 rounded">
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Valuation & Change Column */}
          <div>
            <div className="text-sm font-bold text-amber-700 mb-3 uppercase tracking-wide">
              {getCategoryLabel('valuation')}
            </div>
            {tables.filter(t => t.category === 'valuation').map(table => (
              <div key={table.name} className={`${table.color} border-2 rounded-lg p-4 mb-4 shadow-md`}>
                <div className="font-mono font-bold text-lg text-slate-900 mb-1">{table.name}</div>
                <div className="text-xs text-slate-600 mb-3">{table.description}</div>
                <div className="space-y-1">
                  {table.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-700 bg-white/50 px-2 py-1 rounded">
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-sm font-bold text-slate-700 mb-3 mt-6 uppercase tracking-wide">
              {getCategoryLabel('change')}
            </div>
            {tables.filter(t => t.category === 'change').map(table => (
              <div key={table.name} className={`${table.color} border-2 rounded-lg p-4 mb-4 shadow-md`}>
                <div className="font-mono font-bold text-lg text-slate-900 mb-1">{table.name}</div>
                <div className="text-xs text-slate-600 mb-3">{table.description}</div>
                <div className="space-y-1">
                  {table.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-700 bg-white/50 px-2 py-1 rounded">
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationships Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-bold text-slate-900 mb-4">Foreign Key Relationships</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relationships.map((rel, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="font-mono font-bold text-sm text-slate-700">{rel.from}</span>
                <span className="text-blue-600">→</span>
                <span className="font-mono font-bold text-sm text-slate-700">{rel.to}</span>
                <span className="text-xs text-slate-500 ml-auto">via {rel.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Implementation Assumptions */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Implementation Assumptions & Mapping Notes</h3>
        <div className="space-y-4">
          {assumptions.map((assumption, idx) => (
            <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
              <div className="font-bold text-blue-900 mb-1">{assumption.title}</div>
              <div className="text-sm text-blue-800">{assumption.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Flow Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">S4 Data Flow Replication</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <span className="text-3xl">1️⃣</span>
            <div>
              <div className="font-bold text-slate-900">Material Setup</div>
              <div className="text-sm text-slate-700">MARA defines materials → MARM stores UoM conversions → MBEW holds valuation data</div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <span className="text-3xl">2️⃣</span>
            <div>
              <div className="font-bold text-slate-900">Goods Movement Posting</div>
              <div className="text-sm text-slate-700">MKPF creates document header → MSEG records line items with quantities → Triggers update MARD/MCHB stock balances</div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <span className="text-3xl">3️⃣</span>
            <div>
              <div className="font-bold text-slate-900">Stock Balance Updates</div>
              <div className="text-sm text-slate-700">MARD tracks storage location totals → MCHB tracks batch-level detail → Both maintain parallel UoM quantities</div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
            <span className="text-3xl">4️⃣</span>
            <div>
              <div className="font-bold text-slate-900">Change Documentation</div>
              <div className="text-sm text-slate-700">CDHDR logs change events → CDPOS captures field-level changes for audit compliance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
