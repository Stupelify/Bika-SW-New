'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Activity, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';
import SortableHeader from '@/components/SortableHeader';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import TablePagination from '@/components/TablePagination';
import EmptyState from '@/components/EmptyState';
import { TableSkeleton } from '@/components/Skeletons';

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: unknown;
  ipAddress?: string;
  createdAt: string;
}

const PAGE_SIZE = 50;

function actionBadgeClass(action: string): string {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-700 dark:text-green-200';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-700 dark:text-blue-200';
    case 'DELETE':
      return 'bg-red-100 text-red-700 dark:text-red-200';
    case 'CANCEL':
      return 'bg-orange-100 text-orange-700 dark:text-orange-200';
    case 'FINALIZE':
      return 'bg-purple-100 text-purple-700';
    case 'PARTY_OVER':
      return 'bg-indigo-100 text-indigo-700 dark:text-indigo-200';
    default:
      return 'bg-[var(--bg-3)] text-[var(--text-2)]';
  }
}

export default function ActivityLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedSearch = useDebounce(globalSearch, 500);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchLogs = async (page: number, search: string, manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const params: { page: number; limit: number; search?: string } = {
        page,
        limit: PAGE_SIZE,
      };
      if (search) params.search = search;
      const res = await api.getAuditLogs(params);
      setLogs(res.data.data.logs || []);
      setTotal(res.data.data.pagination.total || 0);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const tableColumns = useMemo<TableColumnConfig<AuditLog>[]>(
    () => [
      { key: 'createdAt', accessor: (log) => log.createdAt },
      { key: 'user', accessor: (log) => log.userName || 'System' },
      { key: 'action', accessor: (log) => log.action },
      { key: 'resource', accessor: (log) => log.resource },
      {
        key: 'details',
        accessor: (log) => log.resourceLabel || log.resourceId || '',
      },
    ],
    []
  );

  const sortedLogs = useMemo(
    () => filterAndSortRows(logs, tableColumns, '', {}, sort),
    [logs, tableColumns, sort]
  );

  const handleSort = (key: string) => {
    setSort(getNextSort(sort, key));
  };

  return (
    <>
      <div className="page-head mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">Activity Logs</h2>
        <button
          type="button"
          onClick={() => void fetchLogs(currentPage, debouncedSearch, true)}
          className="btn btn-secondary flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
        <input
          type="text"
          placeholder="Search logs by user, resource label, or ID..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {loading && logs.length === 0 ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          <div className="md:hidden">
            {sortedLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No logs found"
                description="No activity logs match your search criteria."
              />
            ) : (
              <div className="mobile-card-list">
                {sortedLogs.map((log) => (
                  <div key={log.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-card-title">
                          {log.userName || (
                            <span className="text-[var(--text-3)] italic">System</span>
                          )}
                        </div>
                        <div className="mobile-card-subtitle">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${actionBadgeClass(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Resource</span>
                      <span className="mobile-card-value uppercase">{log.resource}</span>
                    </div>
                    {(log.resourceLabel || log.resourceId) && (
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Identifier</span>
                        <span className="mobile-card-value">
                          {log.resourceLabel || (
                            <span className="font-mono text-xs">{log.resourceId}</span>
                          )}
                        </span>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div className="mobile-card-meta" style={{ marginTop: 6 }}>
                        <span className="mobile-card-meta-item font-mono">{log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block table-shell">
            <table className="data-table">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <SortableHeader
                    label="Date & Time"
                    sortKey="createdAt"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableHeader label="User" sortKey="user" sort={sort} onSort={handleSort} />
                  <SortableHeader
                    label="Action"
                    sortKey="action"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Resource"
                    sortKey="resource"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Identifier / Label"
                    sortKey="details"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <th className="py-3 px-4 text-right text-sm font-semibold text-[var(--text-2)]">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.length === 0 ? (
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
                  sortedLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-4 px-4 whitespace-nowrap text-sm text-[var(--text-2)]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 font-medium text-sm text-[var(--text-1)]">
                        {log.userName || (
                          <span className="text-[var(--text-3)] italic">System</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${actionBadgeClass(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 uppercase text-xs font-medium tracking-wider text-[var(--text-2)]">
                        {log.resource}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {log.resourceLabel ? (
                          <div>
                            <span className="font-medium text-[var(--text-1)]">
                              {log.resourceLabel}
                            </span>
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

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              itemLabel="logs"
            />
          )}
        </>
      )}
    </>
  );
}
