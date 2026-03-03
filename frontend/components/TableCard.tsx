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
  referenced_by: any[];
  indexes: IndexInfo[];
}

interface TableCardProps {
  table: TableDetail;
}

export default function TableCard({ table }: TableCardProps) {
  // Map FK columns to referenced tables
  const fkColumnMap = new Map(
    table.foreign_keys.map(fk => [fk.column_name, fk.referenced_table])
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">{table.table_name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {table.columns.length} column{table.columns.length !== 1 ? 's' : ''} • {table.foreign_keys.length} foreign key{table.foreign_keys.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Columns Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Column Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nullable</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Keys</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col) => (
              <tr
                key={col.column_name}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
              >
                <td className="py-3 px-4 font-mono text-sm text-gray-800">{col.column_name}</td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {col.data_type}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {col.is_nullable === 'YES' ? (
                    <span className="text-gray-400">Yes</span>
                  ) : (
                    <span className="text-gray-700 font-medium">No</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {col.is_primary_key && (
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        PK
                      </span>
                    )}
                    {fkColumnMap.has(col.column_name) && (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        FK
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Foreign Keys Section */}
      {table.foreign_keys.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-purple-600 text-lg">→</span>
            <span>Foreign Key Relationships</span>
          </h4>
          <div className="space-y-2">
            {table.foreign_keys.map((fk) => (
              <div
                key={fk.constraint_name}
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors duration-150"
              >
                <code className="text-sm font-mono text-purple-900">{fk.column_name}</code>
                <span className="text-purple-600 font-bold">→</span>
                <code className="text-sm font-mono font-semibold text-purple-700">
                  {fk.referenced_table}.{fk.referenced_column}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indexes Section */}
      {table.indexes.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Indexes</h4>
          <div className="space-y-2">
            {table.indexes.map((idx) => (
              <div key={idx.index_name} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-gray-800">{idx.index_name}</span>
                  {idx.is_unique && (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      UNIQUE
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 ml-1">
                  Columns: {idx.columns.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
