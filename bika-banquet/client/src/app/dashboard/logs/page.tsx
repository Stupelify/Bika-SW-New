'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Activity, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import SortableHeader from '@/components/SortableHeader';
import EmptyState from '@/components/EmptyState';
import DataTableToolbar, { DataTableFooter } from '@/components/data-table/DataTableToolbar';
import { useTableState } from '@/hooks/useTableState';
import { tableStateToServerParams } from '@/lib/data-table/apply';
import type { FilterSchema } from '@/lib/data-table/types';

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_OPTIONS = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'CANCEL', label: 'Cancel' },
  { value: 'FINALIZE', label: 'Finalize' },
  { value: 'PARTY_OVER', label: 'Party over' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
];

const RESOURCE_OPTIONS = [
  { value: 'booking', label: 'Booking' },
  { value: 'enquiry', label: 'Enquiry' },
  { value: 'customer', label: 'Customer' },
  { value: 'payment', label: 'Payment' },
  { value: 'hall', label: 'Hall' },
  { value: 'banquet', label: 'Banquet' },
  { value: 'item', label: 'Item' },
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
];

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewLogs = hasAnyPermission(permissionSet, ['view_dashboard', 'manage_users']);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const filterSchemas = useMemo<FilterSchema[]>(
    () => [
      { id: 'action', type: 'multiSelect', label: 'Action', options: ACTION_OPTIONS },
      { id: 'resource', type: 'multiSelect', label: 'Resource', options: RESOURCE_OPTIONS },
      { id: 'createdAt', type: 'dateRange', label: 'Date' },
    ],
    []
  );

  const tableState = useTableState({
    prefix: 'logs',
    filters: filterSchemas,
    defaultSort: { key: 'createdAt', direction: 'desc' },
  });

  // Stringify the server params so the effect doesn't refire on identity changes.
  const serverParamsKey = useMemo(
    () => JSON.stringify(tableStateToServerParams(tableState)),
    [tableState]
  );

  useEffect(() => {
    if (!canViewLogs) return;
    void fetchLogs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewLogs, serverParamsKey]);

  const fetchLogs = async (manual: boolean) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const res = await api.getAuditLogs(tableStateToServerParams(tableState));
      setLogs(res.data.data.logs || []);
      setTotal(res.data.data.pagination.total || 0);
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  if (!canViewLogs) {
    return (
      <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
        You do not have permission to view activity logs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-head">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Activity Logs</h1>
          <p className="text-[var(--text-2)] mt-1">
            System audit trail of all major actions
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchLogs(true)}
          className="btn btn-secondary flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="card space-y-4">
        <DataTableToolbar
          state={tableState}
          searchPlaceholder="Search logs by user, resource label, or ID…"
        />

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <SortableHeader label="Date & Time" sortKey="createdAt" sort={tableState.sort} onSort={tableState.toggleSort} />
                <SortableHeader label="User" sortKey="userName" sort={tableState.sort} onSort={tableState.toggleSort} />
                <SortableHeader label="Action" sortKey="action" sort={tableState.sort} onSort={tableState.toggleSort} />
                <SortableHeader label="Resource" sortKey="resource" sort={tableState.sort} onSort={tableState.toggleSort} />
                <th className="py-3 px-4 text-left text-sm font-semibold text-[var(--text-2)]">Identifier / Label</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-[var(--text-2)]">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-3)]">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={Activity}
                      title="No logs found"
                      description="No activity logs match your search criteria."
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-[var(--text-2)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-medium text-sm text-[var(--text-1)]">
                      {log.userName || <span className="text-[var(--text-3)] italic">System</span>}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                        ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:text-green-200' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:text-blue-200' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:text-red-200' :
                          log.action === 'CANCEL' ? 'bg-orange-100 text-orange-700 dark:text-orange-200' :
                          log.action === 'FINALIZE' ? 'bg-purple-100 text-purple-700' :
                          log.action === 'PARTY_OVER' ? 'bg-indigo-100 text-indigo-700 dark:text-indigo-200' :
                          'bg-[var(--bg-3)] text-[var(--text-2)]'
                        }
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 uppercase text-xs font-medium tracking-wider text-[var(--text-2)]">
                      {log.resource}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {log.resourceLabel ? (
                        <div>
                          <span className="font-medium text-[var(--text-1)]">{log.resourceLabel}</span>
                          <div className="text-xs text-[var(--text-3)] font-mono truncate max-w-[200px]">
                            {log.resourceId}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-[var(--text-2)]">
                          {log.resourceId || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-xs font-mono text-[var(--text-3)]">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTableFooter
          state={tableState}
          totalItems={total}
          filteredCount={total}
          itemLabel="logs"
        />
      </div>
    </div>
  );
}
