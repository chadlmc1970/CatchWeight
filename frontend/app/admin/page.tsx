'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import TableCard from '@/components/TableCard';
import RelationshipSidebar from '@/components/RelationshipSidebar';
import S4RelationshipViewer from '@/components/S4RelationshipViewer';

interface SystemStatus {
  document_count: number;
  date_range: {
    min: string | null;
    max: string | null;
    days: number;
  };
  material_count: number;
  movement_count: number;
  timestamp: string;
}

interface AuditLogEntry {
  log_id: number;
  timestamp: string;
  user_id: string;
  action_type: string;
  status: string;
  details: any;
  duration_ms: number | null;
}

interface TableInfo {
  table_name: string;
  row_count: number;
  description: string | null;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
  is_primary_key: boolean;
}

interface ForeignKeyInfo {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  constraint_name: string;
}

interface ReferencedByInfo {
  table_name: string;
  column_name: string;
  constraint_name: string;
}

interface IndexInfo {
  index_name: string;
  columns: string[];
  is_unique: boolean;
}

interface TableDetail {
  table_name: string;
  columns: ColumnInfo[];
  primary_keys: string[];
  foreign_keys: ForeignKeyInfo[];
  referenced_by: ReferencedByInfo[];
  indexes: IndexInfo[];
}

interface TablesResponse {
  tables: TableInfo[];
}

type ResetState = 'idle' | 'clearing' | 'backfilling' | 'seeding' | 'complete' | 'error';
type AdminTab = 'controls' | 'schema' | 'layout' | 's4mapping';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('controls');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Schema viewer state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableDetail | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  useEffect(() => {
    fetchData();
    if (activeTab === 'schema' && tables.length === 0) {
      fetchSchema();
    }
  }, [activeTab]);

  // Fetch table details when selection changes
  useEffect(() => {
    async function fetchTableDetail() {
      if (!selectedTableName) return;

      setLoadingTable(true);
      try {
        const detail = await apiFetch<TableDetail>(`/v1/schema/tables/${selectedTableName}`);
        setSelectedTable(detail);
      } catch (error) {
        console.error('Error fetching table detail:', error);
      } finally {
        setLoadingTable(false);
      }
    }

    fetchTableDetail();
  }, [selectedTableName]);

  async function fetchData() {
    setLoading(true);
    try {
      const [status, log] = await Promise.all([
        apiFetch<SystemStatus>('/v1/admin/status'),
        apiFetch<AuditLogEntry[]>('/v1/admin/audit-log?limit=20'),
      ]);
      setSystemStatus(status);
      setAuditLog(log);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrorMessage('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchema() {
    setLoadingSchema(true);
    try {
      const response = await apiFetch<TablesResponse>('/v1/schema/tables');
      setTables(response.tables);

      // Auto-select first table if available
      if (response.tables.length > 0 && !selectedTableName) {
        setSelectedTableName(response.tables[0].table_name);
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
    } finally {
      setLoadingSchema(false);
    }
  }

  async function handleReset() {
    setErrorMessage('');
    setSuccessMessage('');
    setResetState('clearing');

    try {
      // Simulate progress steps
      setTimeout(() => setResetState('backfilling'), 1000);
      setTimeout(() => setResetState('seeding'), 3000);

      const response = await apiFetch<any>('/v1/admin/reset', {
        method: 'POST',
      });

      setResetState('complete');
      setSuccessMessage(
        `✓ Data reset successful! Duration: ${(response.duration_ms / 1000).toFixed(2)}s`
      );

      // Reset form
      setConfirmed(false);
      setConfirmText('');

      // Refresh data
      await fetchData();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setResetState('idle');
        setSuccessMessage('');
      }, 5000);
    } catch (error: any) {
      setResetState('error');
      setErrorMessage(error.message || 'Failed to reset data');
      setTimeout(() => setResetState('idle'), 3000);
    }
  }

  const canReset = confirmed && confirmText === 'RESET' && resetState === 'idle';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">⚙️ Admin Dashboard</h1>
          <p className="text-slate-600">System Administration, Data Management & Schema Viewer</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'controls'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🔄 Controls & Audit
          </button>
          <button
            onClick={() => setActiveTab('s4mapping')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 's4mapping'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🔗 S4 Mapping
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            🗄️ Schema Viewer
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'layout'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            📊 Table Layout
          </button>
        </div>

        {/* Controls & Audit Tab */}
        {activeTab === 'controls' && (
          <div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Total Documents</div>
            <div className="text-3xl font-bold text-blue-600">
              {systemStatus?.document_count || 0}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Date Range</div>
            <div className="text-2xl font-bold text-blue-600">
              {systemStatus?.date_range.days || 0} days
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Materials</div>
            <div className="text-3xl font-bold text-blue-600">
              {systemStatus?.material_count || 0}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Movements</div>
            <div className="text-3xl font-bold text-blue-600">
              {systemStatus?.movement_count || 0}
            </div>
          </div>
        </div>

        {/* Data Reset Controls */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">🔄 Data Reset Controls</h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Reset to 90-Day Baseline</h3>
                <p className="text-red-700 text-sm mb-3">This action will:</p>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  <li>Delete all existing data from all tables</li>
                  <li>Load 90-day historical backfill (Dec 3, 2025 - Feb 19, 2026)</li>
                  <li>Load current 3-week seed data (Feb 18 - Mar 7, 2026)</li>
                </ul>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={resetState !== 'idle'}
                className="w-4 h-4"
              />
              <span className="text-sm text-red-800 font-medium">
                I understand this action cannot be undone
              </span>
            </label>

            {/* Confirmation Text Input */}
            <div className="mb-4">
              <label className="block text-sm text-red-800 font-medium mb-2">
                Type <span className="font-mono bg-red-100 px-2 py-1 rounded">RESET</span> to
                confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={resetState !== 'idle'}
                className="w-full max-w-xs border-2 border-red-300 rounded px-3 py-2 focus:outline-none focus:border-red-500 disabled:bg-gray-100"
                placeholder="Type RESET"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={!canReset}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                canReset
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {resetState === 'idle' && 'Reset Data'}
              {resetState === 'clearing' && '⏳ Clearing data...'}
              {resetState === 'backfilling' && '⏳ Loading backfill...'}
              {resetState === 'seeding' && '⏳ Loading seed...'}
              {resetState === 'complete' && '✓ Complete!'}
              {resetState === 'error' && '✗ Failed'}
            </button>

            {/* Success Message */}
            {successMessage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">📋 Recent Admin Operations</h2>

          {auditLog.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No admin operations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.log_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 font-mono">
                        {entry.user_id}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 font-mono">
                        {entry.action_type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            entry.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : entry.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {entry.duration_ms ? `${(entry.duration_ms / 1000).toFixed(2)}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </div>
        )}

        {/* S4 Mapping Tab */}
        {activeTab === 's4mapping' && (
          <S4RelationshipViewer />
        )}

        {/* Schema Viewer Tab */}
        {activeTab === 'schema' && (
          <div>
            {/* Table Selector */}
            <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-md p-4">
              <label htmlFor="table-select" className="block text-sm font-semibold text-gray-700 mb-2">
                Select Table
              </label>
              <select
                id="table-select"
                value={selectedTableName}
                onChange={(e) => setSelectedTableName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                {tables.map((table) => (
                  <option key={table.table_name} value={table.table_name}>
                    {table.table_name} ({table.row_count} rows)
                  </option>
                ))}
              </select>
            </div>

            {loadingTable ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                  <div className="text-gray-600">Loading table details...</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {/* Main Content Area - 2/3 width */}
                <div className="col-span-2">
                  {selectedTable ? (
                    <TableCard table={selectedTable} />
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-12 text-center">
                      <p className="text-gray-500">Select a table to view details</p>
                    </div>
                  )}
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="col-span-1">
                  <RelationshipSidebar selectedTable={selectedTable} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table Layout Tab */}
        {activeTab === 'layout' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">📊 Database Table Layout</h2>

            {loadingSchema ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                  <div className="text-gray-600">Loading tables...</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.table_name}
                    onClick={() => {
                      setSelectedTableName(table.table_name);
                      setActiveTab('schema');
                    }}
                    className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-blue-200 p-5 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-mono font-bold text-lg text-blue-900">{table.table_name}</h3>
                      <span className="text-2xl">🗂️</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Row count:</span>
                      <span className="font-bold text-blue-700">{table.row_count}</span>
                    </div>
                    {table.description && (
                      <p className="text-xs text-slate-500 mt-2">{table.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Table Category Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Table Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700 font-semibold mb-1">Master Data</div>
                  <div className="text-xs text-purple-600">mara, marm, mbew</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700 font-semibold mb-1">Transactional</div>
                  <div className="text-xs text-green-600">mkpf, mseg, mard, mchb</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-semibold mb-1">AI & Audit</div>
                  <div className="text-xs text-blue-600">ai_analyses, users, roles, audit logs</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
