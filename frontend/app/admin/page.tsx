'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

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

type ResetState = 'idle' | 'clearing' | 'backfilling' | 'seeding' | 'complete' | 'error';

export default function AdminPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">⚙️ Admin Controls</h1>
          <p className="text-slate-600">System Administration & Data Management</p>
        </div>

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
    </div>
  );
}
