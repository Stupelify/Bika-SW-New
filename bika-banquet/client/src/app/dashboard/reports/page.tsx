'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  IndianRupee,
  Search,
  Users,
} from 'lucide-react';
import SortableHeader from '@/components/SortableHeader';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';

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

export default function ReportsPage() {
  const { user } = useAuthStore();
  const canViewReports = user?.permissions?.includes('view_reports');
  const [range, setRange] = useState('1m');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [monthlyGlobalSearch, setMonthlyGlobalSearch] = useState('');
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
        monthlyGlobalSearch,
        monthlyColumnSearch,
        monthlySort
      ),
    [report, monthlyColumns, monthlyGlobalSearch, monthlyColumnSearch, monthlySort]
  );

  const filteredHallPerformance = useMemo(
    () =>
      filterAndSortRows(
        report?.breakdown.hallPerformance || [],
        hallColumns,
        hallGlobalSearch,
        hallColumnSearch,
        hallSort
      ),
    [report, hallColumns, hallGlobalSearch, hallColumnSearch, hallSort]
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
        <p className="text-gray-600">You do not have access to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Revenue, booking and venue performance insights.
          </p>
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
        <div className="card py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : !report ? (
        <div className="card py-12 text-center text-gray-500">No analytics data available.</div>
      ) : (
        <>
          <div className="card flex items-center justify-between text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
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
              <p className="text-sm text-gray-600">Total customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {report.summary.totalCustomers.toLocaleString()}
              </p>
              <Users className="w-5 h-5 text-blue-500 mt-3" />
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {report.summary.totalBookings.toLocaleString()}
              </p>
              <CalendarDays className="w-5 h-5 text-emerald-500 mt-3" />
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Bookings in range</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {report.summary.bookingsInRange.toLocaleString()}
              </p>
              <BarChart3 className="w-5 h-5 text-amber-500 mt-3" />
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Revenue in range</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                INR {report.summary.totalRevenue.toLocaleString()}
              </p>
              <IndianRupee className="w-5 h-5 text-violet-500 mt-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly trend</h2>
              {report.trends.monthly.length === 0 ? (
                <p className="text-sm text-gray-500">No monthly data available.</p>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="input pl-9"
                      value={monthlyGlobalSearch}
                      onChange={(e) => setMonthlyGlobalSearch(e.target.value)}
                      placeholder="Overall search in monthly trend table..."
                    />
                  </div>
                  <div className="table-shell">
                    <table className="data-table">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <SortableHeader
                            label="Month"
                            sortKey="month"
                            sort={monthlySort}
                            onSort={(key) =>
                              setMonthlySort((prev) => getNextSort(prev, key))
                            }
                            className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                          />
                          <SortableHeader
                            label="Bookings"
                            sortKey="bookings"
                            sort={monthlySort}
                            onSort={(key) =>
                              setMonthlySort((prev) => getNextSort(prev, key))
                            }
                            className="text-right py-3 px-2 text-sm font-semibold text-gray-700"
                          />
                          <SortableHeader
                            label="Revenue"
                            sortKey="revenue"
                            sort={monthlySort}
                            onSort={(key) =>
                              setMonthlySort((prev) => getNextSort(prev, key))
                            }
                            className="text-right py-3 px-2 text-sm font-semibold text-gray-700"
                          />
                        </tr>
                        <tr className="table-search-row border-b border-gray-100 bg-gray-50/70">
                          <th className="py-2 px-2">
                            <input
                              className="input h-9"
                              placeholder="Search month"
                              value={monthlyColumnSearch.month}
                              onChange={(e) =>
                                setMonthlyColumnSearch((prev) => ({
                                  ...prev,
                                  month: e.target.value,
                                }))
                              }
                            />
                          </th>
                          <th className="py-2 px-2">
                            <input
                              className="input h-9 text-right"
                              placeholder="Search bookings"
                              value={monthlyColumnSearch.bookings}
                              onChange={(e) =>
                                setMonthlyColumnSearch((prev) => ({
                                  ...prev,
                                  bookings: e.target.value,
                                }))
                              }
                            />
                          </th>
                          <th className="py-2 px-2">
                            <input
                              className="input h-9 text-right"
                              placeholder="Search revenue"
                              value={monthlyColumnSearch.revenue}
                              onChange={(e) =>
                                setMonthlyColumnSearch((prev) => ({
                                  ...prev,
                                  revenue: e.target.value,
                                }))
                              }
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonthly.map((row) => (
                          <tr key={row.month} className="border-b border-gray-100">
                            <td className="py-3 px-2 text-sm text-gray-800">{row.month}</td>
                            <td className="py-3 px-2 text-sm text-gray-800 text-right">
                              {row.bookings.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-800 text-right">
                              INR {row.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Function type mix</h2>
              <div className="space-y-2">
                {report.breakdown.functionTypes.length === 0 ? (
                  <p className="text-sm text-gray-500">No function type data.</p>
                ) : (
                  report.breakdown.functionTypes.map((type) => (
                    <div key={type.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{type.name}</span>
                      <span className="font-medium text-gray-900">{type.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hall performance</h2>
            {report.breakdown.hallPerformance.length === 0 ? (
              <p className="text-sm text-gray-500">No hall performance data.</p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="input pl-9"
                    value={hallGlobalSearch}
                    onChange={(e) => setHallGlobalSearch(e.target.value)}
                    placeholder="Overall search in hall performance table..."
                  />
                </div>
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <SortableHeader
                          label="Hall"
                          sortKey="hallName"
                          sort={hallSort}
                          onSort={(key) => setHallSort((prev) => getNextSort(prev, key))}
                          className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                        />
                        <SortableHeader
                          label="Bookings"
                          sortKey="bookings"
                          sort={hallSort}
                          onSort={(key) => setHallSort((prev) => getNextSort(prev, key))}
                          className="text-right py-3 px-2 text-sm font-semibold text-gray-700"
                        />
                      </tr>
                      <tr className="table-search-row border-b border-gray-100 bg-gray-50/70">
                        <th className="py-2 px-2">
                          <input
                            className="input h-9"
                            placeholder="Search hall"
                            value={hallColumnSearch.hallName}
                            onChange={(e) =>
                              setHallColumnSearch((prev) => ({
                                ...prev,
                                hallName: e.target.value,
                              }))
                            }
                          />
                        </th>
                        <th className="py-2 px-2">
                          <input
                            className="input h-9 text-right"
                            placeholder="Search bookings"
                            value={hallColumnSearch.bookings}
                            onChange={(e) =>
                              setHallColumnSearch((prev) => ({
                                ...prev,
                                bookings: e.target.value,
                              }))
                            }
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHallPerformance.map((row) => (
                        <tr key={row.hallId} className="border-b border-gray-100">
                          <td className="py-3 px-2 text-sm text-gray-800">{row.hallName}</td>
                          <td className="py-3 px-2 text-sm text-gray-800 text-right">
                            {row.bookings.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
