'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Activity, Search, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import { useDebounce } from '@/lib/useDebounce';
import { formatDateDDMMYYYY } from '@/lib/date';
import SortableHeader from '@/components/SortableHeader';
import {
  ColumnFilter,
  DateRangeFilter,
  MultiSelectFilter,
  type FilterOption,
} from '@/components/data-table/filter-controls';

const LOG_ACTION_OPTIONS: FilterOption[] = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'CANCEL', label: 'Cancel' },
  { value: 'FINALIZE', label: 'Finalize' },
  { value: 'PARTY_OVER', label: 'Party over' },
];
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import TablePagination from '@/components/TablePagination';
import EmptyState from '@/components/EmptyState';
import Toolbar from '@/components/Toolbar';

import type { AuditLog } from '@/types/api';

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewLogs = hasAnyPermission(permissionSet, ['view_audit_logs', 'manage_users']);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedSearch = useDebounce(globalSearch, 500);

  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' });
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (canViewLogs) {
      void fetchLogs(currentPage, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewLogs, currentPage, debouncedSearch, actionFilter, dateFrom, dateTo]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, dateFrom, dateTo]);

  const fetchLogs = async (page: number, search: string, manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (actionFilter.length) params.action = actionFilter.join(',');
      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;
      const res = await api.getAuditLogs(params);
      setLogs(res.data.data.logs || []);
      setTotal(res.data.data.pagination?.total || 0);
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  const tableColumns = useMemo<TableColumnConfig<AuditLog>[]>(
    () => [
      {
        key: 'createdAt',
        accessor: (log) => log.createdAt,
      },
      {
        key: 'user',
        accessor: (log) => log.userName || 'System',
      },
      {
        key: 'action',
        accessor: (log) => log.action,
      },
      {
        key: 'resource',
        accessor: (log) => log.resource,
      },
      {
        key: 'details',
        accessor: (log) => log.resourceLabel || log.resourceId || '',
      },
    ],
    []
  );

  const sortedLogs = useMemo(() => {
    return filterAndSortRows(logs, tableColumns, '', {}, sort);
  }, [logs, tableColumns, sort]);

  const handleSort = (key: string) => {
    setSort(getNextSort(sort, key));
  };

  if (!canViewLogs) {
    return (
      <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
        You do not have permission to view activity logs.
      </div>
    );
  }

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Activity Logs"
        stats={[
          { label: 'In view', value: total },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void fetchLogs(currentPage, debouncedSearch, true)}
            className="btn btn-secondary flex items-center gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
            <input
              type="text"
              placeholder="Search logs by user, resource label, or ID..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {loading && logs.length === 0 ? (
            <p className="text-center py-12 text-[var(--text-3)]">Loading logs...</p>
          ) : sortedLogs.length === 0 ? (
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

        {/* Desktop table view */}
        <div className="hidden md:block table-shell">
          <table className="data-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <SortableHeader
                  label="Date & Time"
                  sortKey="createdAt"
                  sort={sort}
                  onSort={handleSort}
                  filter={
                    <ColumnFilter active={Boolean(dateFrom || dateTo)} title="Date">
                      <DateRangeFilter
                        from={dateFrom}
                        to={dateTo}
                        onChange={({ from, to }) => {
                          setDateFrom(from);
                          setDateTo(to);
                        }}
                      />
                    </ColumnFilter>
                  }
                />
                <SortableHeader
                  label="User"
                  sortKey="user"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Action"
                  sortKey="action"
                  sort={sort}
                  onSort={handleSort}
                  filter={
                    <ColumnFilter active={actionFilter.length > 0} title="Action">
                      <MultiSelectFilter
                        options={LOG_ACTION_OPTIONS}
                        selected={actionFilter}
                        onChange={setActionFilter}
                      />
                    </ColumnFilter>
                  }
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
              ) : sortedLogs.length === 0 ? (
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
                    <td className="py-4 px-4 font-medium text-sm text-[var(--text-1)] main">
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
      </div>
    </div>
  );
}
