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

interface RelationshipSidebarProps {
  selectedTable: {
    table_name: string;
    foreign_keys: ForeignKeyInfo[];
    referenced_by: ReferencedByInfo[];
  } | null;
}

export default function RelationshipSidebar({ selectedTable }: RelationshipSidebarProps) {
  if (!selectedTable) {
    return (
      <div className="sticky top-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <p className="text-sm text-gray-500 text-center">Select a table to view relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 space-y-6">
      {/* Outgoing References (this table → other tables) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-purple-600 text-xl">→</span>
          <span className="text-gray-900">References To</span>
        </h3>
        {selectedTable.foreign_keys.length === 0 ? (
          <p className="text-sm text-gray-500">No outgoing references</p>
        ) : (
          <div className="space-y-3">
            {selectedTable.foreign_keys.map((fk) => (
              <div key={fk.constraint_name} className="group">
                <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition-all duration-200 border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <code className="text-sm font-mono font-semibold text-purple-700">
                      {fk.referenced_table}
                    </code>
                  </div>
                  <div className="text-xs text-gray-600 ml-4">
                    via {fk.column_name} → {fk.referenced_column}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incoming References (other tables → this table) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-green-600 text-xl">←</span>
          <span className="text-gray-900">Referenced By</span>
        </h3>
        {selectedTable.referenced_by.length === 0 ? (
          <p className="text-sm text-gray-500">No incoming references</p>
        ) : (
          <div className="space-y-3">
            {selectedTable.referenced_by.map((ref) => (
              <div key={ref.constraint_name} className="group">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-all duration-200 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <code className="text-sm font-mono font-semibold text-green-700">
                      {ref.table_name}
                    </code>
                  </div>
                  <div className="text-xs text-gray-600 ml-4">
                    via {ref.column_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Flow Summary */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
        <h4 className="font-bold mb-3 text-lg">Data Flow Summary</h4>
        <div className="text-sm space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-blue-500 border-opacity-30">
            <span>Upstream tables:</span>
            <span className="text-2xl font-bold">{selectedTable.foreign_keys.length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Downstream tables:</span>
            <span className="text-2xl font-bold">{selectedTable.referenced_by.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
