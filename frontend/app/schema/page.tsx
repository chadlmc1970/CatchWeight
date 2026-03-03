'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import TableCard from '@/components/TableCard';
import RelationshipSidebar from '@/components/RelationshipSidebar';

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

export default function SchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Fetch tables list on mount
  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      try {
        const response = await apiFetch<TablesResponse>('/v1/schema/tables');
        setTables(response.tables);

        // Auto-select first table if available
        if (response.tables.length > 0) {
          setSelectedTableName(response.tables[0].table_name);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading Schema...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗄️ Database Schema Viewer</h1>
          <p className="text-gray-600">
            Explore database tables, columns, and relationships in the SAP POC schema
          </p>
        </div>

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

        {/* Main Layout: Table Details + Sidebar */}
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
    </div>
  );
}
