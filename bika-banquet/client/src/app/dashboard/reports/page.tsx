'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { PageSkeleton } from '@/components/Skeletons';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  IndianRupee,
  Search,
  Users,
} from 'lucide-react';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useDebounce } from '@/lib/useDebounce';

interface ReportResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCustomers: number;
    totalBookings: number;
    bookingsInRange: number;
    totalRevenue: number;
    cancelledBookings: number;
  };
  trends: {
    monthly: Array<{
      month: string;
      bookings: number;
      revenue: number;
    }>;
  };
  breakdown: {
    functionTypes: Array<{
      name: string;
      count: number;
    }>;
    hallPerformance: Array<{
      hallId: string;
      hallName: string;
      bookings: number;
    }>;
  };
}

function formatAxisValue(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function formatMonthShort(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(',');
  const body = rows.map((row) => Object.values(row).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function LineChart({
  data,
  height = 220,
}: {
  data: Array<{ month: string; bookings: number; revenue: number }>;
  height?: number;
}) {
  const width = 640;
  const padding = { top: 16, right: 24, bottom: 32, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.map((row) => Math.max(row.bookings, row.revenue))
  );

  const pointFor = (value: number, index: number) => {
    const x =
      padding.left +
      (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1));
    const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
    return { x, y };
  };

  const bookingsPoints = data
    .map((row, index) => {
      const point = pointFor(row.bookings, index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const revenuePoints = data
    .map((row, index) => {
      const point = pointFor(row.revenue, index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + innerHeight - innerHeight * ratio;
        const value = maxValue * ratio;
        return (
          <g key={`grid-${ratio}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeDasharray="4 6"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-4)"
            >
              {formatAxisValue(value)}
            </text>
          </g>
        );
      })}

      <polyline
        points={bookingsPoints}
        fill="none"
        stroke="var(--teal-500)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <polyline
        points={revenuePoints}
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {data.map((row, index) => {
        const point = pointFor(Math.max(row.bookings, row.revenue), index);
        return (
          <text
            key={`label-${row.month}`}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-4)"
          >
            {formatMonthShort(row.month)}
          </text>
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const canViewReports = user?.permissions?.includes('view_reports');
  const [range, setRange] = useState('1m');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [monthlyGlobalSearch, setMonthlyGlobalSearch] = useState('');
  const debouncedMonthlySearch = useDebounce(monthlyGlobalSearch, 150);
  const [monthlyColumnSearch, setMonthlyColumnSearch] = useState({
    month: '',
    bookings: '',
    revenue: '',
  });
  const [monthlySort, setMonthlySort] = useState<SortState>({
    key: 'month',
    direction: 'asc',
  });
  const [hallGlobalSearch, setHallGlobalSearch] = useState('');
  const debouncedHallSearch = useDebounce(hallGlobalSearch, 150);
  const [hallColumnSearch, setHallColumnSearch] = useState({
    hallName: '',
    bookings: '',
  });
  const [hallSort, setHallSort] = useState<SortState>({
    key: 'hallName',
    direction: 'asc',
  });

  const monthlyColumns = useMemo<
    TableColumnConfig<ReportResponse['trends']['monthly'][number]>[]
  >(
    () => [
      { key: 'month', accessor: (row) => row.month },
      { key: 'bookings', accessor: (row) => row.bookings },
      { key: 'revenue', accessor: (row) => row.revenue },
    ],
    []
  );

  const hallColumns = useMemo<
    TableColumnConfig<ReportResponse['breakdown']['hallPerformance'][number]>[]
  >(
    () => [
      { key: 'hallName', accessor: (row) => row.hallName },
      { key: 'bookings', accessor: (row) => row.bookings },
    ],
    []
  );

  const filteredMonthly = useMemo(
    () =>
      filterAndSortRows(
        report?.trends.monthly || [],
        monthlyColumns,
        debouncedMonthlySearch,
        monthlyColumnSearch,
        monthlySort
      ),
    [report, monthlyColumns, debouncedMonthlySearch, monthlyColumnSearch, monthlySort]
  );

  const filteredHallPerformance = useMemo(
    () =>
      filterAndSortRows(
        report?.breakdown.hallPerformance || [],
        hallColumns,
        debouncedHallSearch,
        hallColumnSearch,
        hallSort
      ),
    [report, hallColumns, debouncedHallSearch, hallColumnSearch, hallSort]
  );

  useEffect(() => {
    void loadReport();
  }, [range, canViewReports]);

  const loadReport = async () => {
    if (!canViewReports) {
      setLoading(false);
      setReport(null);
      return;
    }
    try {
      setLoading(true);
      const response = await api.getDashboardSummary({ range });
      setReport(response.data?.data || null);
    } catch (error) {
      toast.error('Failed to load analytics report');
    } finally {
      setLoading(false);
    }
  };

  if (!loading && user && !canViewReports) {
    return (
      <div className="card py-16 text-center">
        <p style={{ color: 'var(--text-3)' }}>You do not have access to view reports.</p>
      </div>
    );
  }

  const functionMixTotal = report?.breakdown.functionTypes.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const maxHallBookings = Math.max(
    1,
    ...filteredHallPerformance.map((row) => row.bookings)
  );

  return (
    <div className="space-y-6">
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Revenue, booking and venue performance insights.</p>
        </div>
        <select
          className="input w-full sm:w-auto sm:max-w-[180px]"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="1m">Last 1 month</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="1y">Last 1 year</option>
          <option value="all">All time</option>
        </select>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : !report ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={22} />
          </div>
          <p className="empty-state-title">No data available</p>
          <p className="empty-state-desc">Try changing the date range.</p>
        </div>
      ) : (
        <>
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text-3)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CalendarRange className="w-4 h-4" />
              Report range
            </span>
            <span>
              {formatDateDDMMYYYY(report.range.startDate)} to{' '}
              {formatDateDDMMYYYY(report.range.endDate)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="card">
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Total customers</p>
              <p className="kpi-value">{report.summary.totalCustomers.toLocaleString()}</p>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="card">
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Total bookings</p>
              <p className="kpi-value">{report.summary.totalBookings.toLocaleString()}</p>
              <CalendarDays className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="card">
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Bookings in range</p>
              <p className="kpi-value">{report.summary.bookingsInRange.toLocaleString()}</p>
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div className="card">
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Revenue in range</p>
              <p className="kpi-value">₹{report.summary.totalRevenue.toLocaleString()}</p>
              <IndianRupee className="w-5 h-5 text-violet-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <div className="panel-header">
                <div>
                  <p className="panel-title">Monthly trend</p>
                  <p className="panel-subtitle">Bookings vs revenue</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    downloadCSV(
                      (report.trends.monthly || []).map((row) => ({
                        month: row.month,
                        bookings: row.bookings,
                        revenue: row.revenue,
                      })),
                      'monthly-trend.csv'
                    )
                  }
                >
                  Export CSV
                </button>
              </div>
              <div className="panel-body space-y-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-4)' }}
                  />
                  <input
                    className="input pl-9"
                    value={monthlyGlobalSearch}
                    onChange={(e) => setMonthlyGlobalSearch(e.target.value)}
                    placeholder="Search month..."
                  />
                </div>
                {filteredMonthly.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div className="empty-state-icon">
                      <BarChart3 size={22} />
                    </div>
                    <p className="empty-state-title">No data available</p>
                    <p className="empty-state-desc">Try changing the date range.</p>
                  </div>
                ) : (
                  <>
                    <LineChart data={filteredMonthly} />
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: 'var(--teal-500)',
                            display: 'inline-block',
                          }}
                        />
                        Bookings
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: '#6366f1',
                            display: 'inline-block',
                          }}
                        />
                        Revenue
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="panel-header">
                <p className="panel-title">Function type mix</p>
              </div>
              <div className="panel-body space-y-4">
                {report.breakdown.functionTypes.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div className="empty-state-icon">
                      <BarChart3 size={22} />
                    </div>
                    <p className="empty-state-title">No data available</p>
                    <p className="empty-state-desc">Try changing the date range.</p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        height: 8,
                        borderRadius: 999,
                        overflow: 'hidden',
                        background: 'var(--surface-2)',
                      }}
                    >
                      {report.breakdown.functionTypes.map((type) => {
                        const share = functionMixTotal ? (type.count / functionMixTotal) * 100 : 0;
                        const colorMap: Record<string, string> = {
                          Wedding: '#14b8a6',
                          Reception: '#0d9488',
                          Birthday: '#f59e0b',
                          Corporate: '#6366f1',
                          Other: '#94a3b8',
                        };
                        return (
                          <div
                            key={type.name}
                            style={{
                              width: `${share}%`,
                              background: colorMap[type.name] || '#94a3b8',
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      {report.breakdown.functionTypes.map((type) => (
                        <div key={type.name} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-2)' }}>{type.name}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                            {type.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-header">
              <p className="panel-title">Hall performance</p>
            </div>
            <div className="panel-body space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-4)' }}
                />
                <input
                  className="input pl-9"
                  value={hallGlobalSearch}
                  onChange={(e) => setHallGlobalSearch(e.target.value)}
                  placeholder="Search hall..."
                />
              </div>
              {filteredHallPerformance.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon">
                    <BarChart3 size={22} />
                  </div>
                  <p className="empty-state-title">No data available</p>
                  <p className="empty-state-desc">Try changing the date range.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHallPerformance.map((row) => {
                    const width = maxHallBookings
                      ? Math.round((row.bookings / maxHallBookings) * 100)
                      : 0;
                    return (
                      <div key={row.hallId} style={{ display: 'grid', gap: 6 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            color: 'var(--text-2)',
                          }}
                        >
                          <span>{row.hallName}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                            {row.bookings.toLocaleString()}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: 'var(--surface-2)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${width}%`,
                              height: '100%',
                              background: 'var(--teal-500)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
