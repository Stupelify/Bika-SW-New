'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateDDMMYYYY } from '@/lib/date';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  DollarSign,
  IndianRupee,
  Landmark,
  Layers,
  ListChecks,
  PhoneCall,
  RefreshCw,
  Sparkles,
  UserCircle2,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

interface DashboardAnalytics {
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
  };
}

interface BookingRow {
  id: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  createdAt: string;
  status: string;
  grandTotal: number;
  advanceReceived: number;
  balanceAmount: number;
  customer?: {
    name: string;
    phone: string;
  } | null;
  halls?: Array<{
    hall?: {
      id: string;
      name: string;
    } | null;
  }>;
}

interface EnquiryRow {
  id: string;
  functionDate: string;
  status: string;
  isPencilBooked?: boolean;
}

interface ResourceCounts {
  itemTypes: number;
  items: number;
  templateMenus: number;
  enquiries: number;
  halls: number;
  customers: number;
  banquets: number;
  users: number;
  roles: number;
  bookings: number;
}

interface HallRevenue {
  hallId: string;
  hallName: string;
  revenue: number;
  bookings: number;
  share: number;
}

interface Insight {
  title: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
}

interface DashboardState {
  analytics: DashboardAnalytics;
  recentBookings: BookingRow[];
  topFunctions: Array<{ name: string; count: number; share: number }>;
  hallsByRevenue: HallRevenue[];
  insights: Insight[];
  pencilBookings: number;
  averageBookingValue: number;
  resourceCounts: ResourceCounts;
}

function toSafeNumber(input: unknown): number {
  const value = typeof input === 'number' ? input : Number(input);
  return Number.isFinite(value) ? value : 0;
}

function toDateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function isBetweenDates(value: string, start: Date, end: Date): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMonthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(date);
  const [month, year] = formatted.split(' ');
  return `${month} '${year}`;
}

function buildHallRevenue(bookings: BookingRow[]): HallRevenue[] {
  const map = new Map<string, { hallName: string; revenue: number; bookings: number }>();
  let totalRevenue = 0;

  bookings.forEach((booking) => {
    if (booking.status === 'cancelled') return;
    const halls =
      booking.halls
        ?.map((entry) => entry.hall)
        .filter(
          (hall): hall is { id: string; name: string } =>
            Boolean(hall?.id && hall?.name)
        ) || [];

    const uniqueHalls = Array.from(
      new Map(halls.map((hall) => [hall.id, hall])).values()
    );

    if (uniqueHalls.length === 0) return;

    const bookingRevenue = toSafeNumber(booking.grandTotal);
    if (bookingRevenue <= 0) return;

    totalRevenue += bookingRevenue;
    const allocatedRevenue = bookingRevenue / uniqueHalls.length;

    uniqueHalls.forEach((hall) => {
      const current = map.get(hall.id) || {
        hallName: hall.name,
        revenue: 0,
        bookings: 0,
      };
      current.revenue += allocatedRevenue;
      current.bookings += 1;
      map.set(hall.id, current);
    });
  });

  return Array.from(map.entries())
    .map(([hallId, stat]) => ({
      hallId,
      hallName: stat.hallName,
      revenue: stat.revenue,
      bookings: stat.bookings,
      share: totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

async function fetchAllBookings(params: { fromDate?: string; toDate?: string }) {
  const rows: BookingRow[] = [];
  const limit = 500;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.getBookings({
      page,
      limit,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    const data = response.data?.data;
    const bookings = (data?.bookings || []) as BookingRow[];
    rows.push(...bookings);
    totalPages = Math.max(1, Number(data?.pagination?.totalPages || 1));
    page += 1;
    if (page > 100) break;
  }

  return rows;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const canViewDashboard = user?.permissions?.includes('view_dashboard');
  const [range, setRange] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardState | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!canViewDashboard) {
      setLoading(false);
      setData(null);
      return;
    }
    try {
      setLoading(true);

      const hasCustomRange = Boolean(fromDate && toDate);
      const analyticsParams = hasCustomRange
        ? {
            range: 'all',
            startDate: fromDate,
            endDate: toDate,
          }
        : { range };

      const analyticsRes = await api.getDashboardSummary(analyticsParams);
      const analytics = analyticsRes.data?.data as DashboardAnalytics | undefined;

      if (!analytics) {
        throw new Error('Analytics response missing');
      }

      const rangeStart = new Date(analytics.range.startDate);
      const rangeEnd = new Date(analytics.range.endDate);
      const normalizedStart = toDateOnly(analytics.range.startDate);
      const normalizedEnd = toDateOnly(analytics.range.endDate);

      const [
        bookings,
        enquiriesRes,
        itemTypesRes,
        itemsRes,
        templateMenusRes,
        hallsRes,
        banquetsRes,
        usersRes,
        rolesRes,
      ] = await Promise.all([
        fetchAllBookings({
          fromDate: normalizedStart || undefined,
          toDate: normalizedEnd || undefined,
        }),
        api.getEnquiries({ page: 1, limit: 5000 }),
        api.getItemTypes({ page: 1, limit: 1 }),
        api.getItems({ page: 1, limit: 1 }),
        api.getTemplateMenus({ page: 1, limit: 1 }),
        api.getHalls({ page: 1, limit: 1 }),
        api.getBanquets({ page: 1, limit: 1 }),
        api.getUsers({ page: 1, limit: 1 }),
        api.getRoles(),
      ]);

      const allEnquiries = (enquiriesRes.data?.data?.enquiries || []) as EnquiryRow[];
      const enquiriesInRange = allEnquiries.filter((entry) =>
        isBetweenDates(entry.functionDate, rangeStart, rangeEnd)
      );
      const pencilBookings = enquiriesInRange.filter(
        (entry) => entry.isPencilBooked
      ).length;

      const hallsByRevenue = buildHallRevenue(bookings);

      const topFunctions = analytics.breakdown.functionTypes
        .slice(0, 6)
        .map((entry) => ({
          ...entry,
          share:
            analytics.summary.bookingsInRange > 0
              ? (entry.count / analytics.summary.bookingsInRange) * 100
              : 0,
        }));

      const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
      const totalBookedValue = activeBookings.reduce(
        (sum, booking) => sum + toSafeNumber(booking.grandTotal),
        0
      );
      const totalCollected = activeBookings.reduce(
        (sum, booking) => sum + toSafeNumber(booking.advanceReceived),
        0
      );

      const now = new Date();
      const nextThirtyDays = new Date(now);
      nextThirtyDays.setDate(now.getDate() + 30);

      const upcomingThirtyDays = activeBookings.filter((booking) => {
        const date = new Date(booking.functionDate);
        return date >= now && date <= nextThirtyDays;
      }).length;

      const weekendEvents = activeBookings.filter((booking) => {
        const day = new Date(booking.functionDate).getDay();
        return day === 0 || day === 6;
      }).length;

      const cancellationRate =
        analytics.summary.bookingsInRange > 0
          ? (analytics.summary.cancelledBookings / analytics.summary.bookingsInRange) *
            100
          : 0;
      const collectionRate =
        totalBookedValue > 0 ? (totalCollected / totalBookedValue) * 100 : 0;
      const weekendShare =
        activeBookings.length > 0 ? (weekendEvents / activeBookings.length) * 100 : 0;

      const insights: Insight[] = [
        {
          title: 'Cancellation rate',
          value: `${cancellationRate.toFixed(1)}%`,
          detail:
            cancellationRate > 12
              ? 'Higher than expected. Review follow-up and payment checkpoints.'
              : 'Healthy cancellation trend for the selected period.',
          tone: cancellationRate > 12 ? 'warn' : 'good',
        },
        {
          title: 'Collection efficiency',
          value: `${collectionRate.toFixed(1)}%`,
          detail:
            collectionRate < 60
              ? 'Collections are lagging. Prioritize follow-up on high-value balances.'
              : 'Advance collections are tracking well.',
          tone: collectionRate < 60 ? 'warn' : 'good',
        },
        {
          title: 'Next 30-day load',
          value: `${upcomingThirtyDays} events`,
          detail: 'Use this to plan staffing, inventory, and kitchen prep windows.',
          tone: 'neutral',
        },
        {
          title: 'Weekend concentration',
          value: `${weekendShare.toFixed(1)}%`,
          detail: 'Share of events falling on weekends in the selected window.',
          tone: weekendShare > 60 ? 'warn' : 'neutral',
        },
      ];

      const resourceCounts: ResourceCounts = {
        itemTypes: Number(itemTypesRes.data?.data?.pagination?.total || 0),
        items: Number(itemsRes.data?.data?.pagination?.total || 0),
        templateMenus: Number(templateMenusRes.data?.data?.pagination?.total || 0),
        enquiries: Number(enquiriesRes.data?.data?.pagination?.total || 0),
        halls: Number(hallsRes.data?.data?.pagination?.total || 0),
        customers: Number(analytics.summary.totalCustomers || 0),
        banquets: Number(banquetsRes.data?.data?.pagination?.total || 0),
        users: Number(usersRes.data?.data?.pagination?.total || 0),
        roles: Array.isArray(rolesRes.data?.data?.roles)
          ? rolesRes.data.data.roles.length
          : 0,
        bookings: Number(analytics.summary.totalBookings || 0),
      };

      setData({
        analytics,
        recentBookings: [...bookings]
          .sort(
            (a, b) =>
              new Date(b.functionDate).getTime() - new Date(a.functionDate).getTime()
          )
          .slice(0, 6),
        topFunctions,
        hallsByRevenue,
        insights,
        pencilBookings,
        averageBookingValue:
          analytics.summary.bookingsInRange > 0
            ? analytics.summary.totalRevenue / analytics.summary.bookingsInRange
            : 0,
        resourceCounts,
      });
    } catch (error) {
      toast.error('Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  }, [range, fromDate, toDate, canViewDashboard]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const hallSections = useMemo(() => {
    const allHalls = data?.hallsByRevenue || [];
    return {
      top: allHalls.slice(0, 5),
      low: [...allHalls].sort((a, b) => a.revenue - b.revenue).slice(0, 5),
    };
  }, [data?.hallsByRevenue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user && !canViewDashboard) {
    return (
      <div className="card py-16 text-center">
        <p className="text-gray-600">You do not have access to view the dashboard.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card py-16 text-center">
        <p className="text-gray-600">No dashboard data available.</p>
      </div>
    );
  }

  const { analytics, resourceCounts } = data;
  const maxMonthlyRevenue = Math.max(
    1,
    ...analytics.trends.monthly.map((row) => toSafeNumber(row.revenue))
  );
  const maxFunctionCount = Math.max(1, ...data.topFunctions.map((row) => row.count));

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold">
              Key Metrics & Hall Performance
            </h1>
            <p className="text-primary-100 mt-1">
              Revenue view from{' '}
              {formatDateDDMMYYYY(analytics.range.startDate)} to{' '}
              {formatDateDDMMYYYY(analytics.range.endDate)}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <select
              className="input bg-white/95 text-gray-800"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="1m">Last 1 month</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last 1 year</option>
              <option value="all">All time</option>
            </select>
            <input
              type="date"
              className="input bg-white/95 text-gray-800"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="input bg-white/95 text-gray-800"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="btn bg-white text-primary-700 hover:bg-primary-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(analytics.summary.totalRevenue)}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary-700 bg-primary-50 rounded-full px-2.5 py-1">
            <IndianRupee className="w-3.5 h-3.5" />
            Selected period
          </div>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.summary.bookingsInRange.toLocaleString()}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
            <CalendarCheck className="w-3.5 h-3.5" />
            In selected period
          </div>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Pencil Booking</p>
          <p className="text-2xl font-bold text-gray-900">{data.pencilBookings}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs follow-up
          </div>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Average Booking Value
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.averageBookingValue)}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-sky-700 bg-sky-50 rounded-full px-2.5 py-1">
            <DollarSign className="w-3.5 h-3.5" />
            Avg. in selected period
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Halls</h2>
          <div className="space-y-3">
            {hallSections.top.length === 0 ? (
              <p className="text-sm text-gray-500">No hall performance data available.</p>
            ) : (
              hallSections.top.map((hall) => (
                <div
                  key={hall.hallId}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{hall.hallName}</p>
                    <p className="text-sm font-semibold text-emerald-800">
                      {formatCurrency(hall.revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    {hall.bookings} bookings • {hall.share.toFixed(1)}% revenue share
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lowest Performing Halls
          </h2>
          <div className="space-y-3">
            {hallSections.low.length === 0 ? (
              <p className="text-sm text-gray-500">No hall performance data available.</p>
            ) : (
              hallSections.low.map((hall) => (
                <div
                  key={hall.hallId}
                  className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{hall.hallName}</p>
                    <p className="text-sm font-semibold text-rose-700">
                      {formatCurrency(hall.revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    {hall.bookings} bookings • {hall.share.toFixed(1)}% revenue share
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Frequent Functions</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.topFunctions.map((entry) => (
              <span
                key={entry.name}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 text-primary-800 px-3 py-1 text-xs font-medium"
              >
                {entry.name}
                <span className="rounded-full bg-white px-2 py-0.5">{entry.count}</span>
              </span>
            ))}
          </div>
          <div className="space-y-3">
            {data.topFunctions.map((entry) => (
              <div key={`${entry.name}-bar`}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{entry.name}</span>
                  <span>{entry.count} bookings</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                    style={{ width: `${Math.max((entry.count / maxFunctionCount) * 100, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          {analytics.trends.monthly.length === 0 ? (
            <p className="text-sm text-gray-500">No monthly trend data for this range.</p>
          ) : (
            <div className="space-y-3">
              {analytics.trends.monthly.map((entry) => (
                <div key={entry.month}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{formatMonthLabel(entry.month)}</span>
                    <span>{formatCurrency(entry.revenue)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary-500"
                      style={{
                        width: `${Math.max(
                          (toSafeNumber(entry.revenue) / maxMonthlyRevenue) * 100,
                          4
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="page-head mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Business Insights</h2>
          <span className="inline-flex items-center gap-2 text-xs rounded-full bg-primary-50 text-primary-700 px-3 py-1 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            Actionable
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map((insight) => (
            <div
              key={insight.title}
              className={`rounded-xl border px-4 py-3 ${
                insight.tone === 'good'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : insight.tone === 'warn'
                  ? 'border-amber-200 bg-amber-50/70'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">{insight.title}</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{insight.value}</p>
              <p className="text-sm text-gray-600 mt-1">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panel-header mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Resource Counts</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Link href="/dashboard/menu" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Item Types</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.itemTypes.toLocaleString()}
            </p>
            <Layers className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.items.toLocaleString()}
            </p>
            <UtensilsCrossed className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Template Menu</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.templateMenus.toLocaleString()}
            </p>
            <ListChecks className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/enquiries" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Enquiry</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.enquiries.toLocaleString()}
            </p>
            <PhoneCall className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Hall</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.halls.toLocaleString()}
            </p>
            <Building2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/customers" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Manage Customers</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.customers.toLocaleString()}
            </p>
            <Users className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Banquet</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.banquets.toLocaleString()}
            </p>
            <Landmark className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Manage Users</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.users.toLocaleString()}
            </p>
            <UserCircle2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/bookings" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Booking</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.bookings.toLocaleString()}
            </p>
            <CalendarCheck className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/50 transition">
            <p className="text-xs text-gray-500">Manage Roles</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {resourceCounts.roles.toLocaleString()}
            </p>
            <BarChart3 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="panel-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings in selected range.</p>
          ) : (
            data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{booking.functionName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {booking.customer?.name || 'Unknown customer'} •{' '}
                    {booking.customer?.phone || 'N/A'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-900">
                    {formatDateDDMMYYYY(booking.functionDate)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(toSafeNumber(booking.grandTotal))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
