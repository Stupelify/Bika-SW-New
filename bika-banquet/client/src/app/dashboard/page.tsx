'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSSE } from '@/hooks/useSSE';
import { formatDateDDMMYYYY } from '@/lib/date';
import { KpiCardSkeleton } from '@/components/Skeletons';
import KpiCard from '@/components/KpiCard';
import EmptyState from '@/components/EmptyState';
import Combobox from '@/components/Combobox';
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
import { AdaptiveCard } from '@/components/adaptive/AdaptiveCard';
import { AdaptiveButton } from '@/components/adaptive/AdaptiveButton';

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
    hallPerformance?: Array<{
      hallId: string;
      hallName: string;
      bookings: number;
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


function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBookingSubtitle(booking: BookingRow): string | undefined {
  const name = booking.customer?.name || '';
  const phone = booking.customer?.phone || '';
  if (name && phone) return `${name} • ${phone}`;
  if (name) return name;
  if (phone) return phone;
  return booking.functionType || undefined;
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


function getDeltaPercent(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatMonthShort(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildContinuousMonthlyTrend(
  monthlyRows: Array<{ month: string; bookings: number; revenue: number }>,
  startDate: string,
  endDate: string,
  maxMonths: number = 8
) {
  const map = new Map(
    monthlyRows.map((row) => [
      row.month,
      { month: row.month, bookings: toSafeNumber(row.bookings), revenue: toSafeNumber(row.revenue) },
    ])
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return monthlyRows.slice(-maxMonths);
  }

  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const rows: Array<{ month: string; bookings: number; revenue: number }> = [];

  while (cursor <= endMonth) {
    const key = toMonthKey(cursor);
    rows.push(map.get(key) || { month: key, bookings: 0, revenue: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return rows.slice(-maxMonths);
}

function formatYAxisValue(value: number): string {
  if (value > 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${Math.round(value / 1000)}K`;
  }
  return `₹${Math.round(value)}`;
}

function BarChart({
  data,
  height = 200,
  color = 'var(--teal-500)',
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}) {
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 28, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const gap = 4;
  const barWidth = data.length
    ? (innerWidth - gap * (data.length - 1)) / data.length
    : innerWidth;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal-400, #2dd4bf)" />
          <stop offset="100%" stopColor="var(--teal-600)" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + innerHeight - innerHeight * ratio;
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
              {formatYAxisValue(maxValue * ratio)}
            </text>
          </g>
        );
      })}
      {data.map((item, index) => {
        const x = padding.left + index * (barWidth + gap);
        const barHeight = (item.value / maxValue) * innerHeight;
        const y = padding.top + innerHeight - barHeight;
        return (
          <g key={item.label} className="bar-grow">
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill="url(#barGradient)"
              style={{ transformOrigin: 'center bottom', transformBox: 'fill-box' }}
            >
              <title>
                {item.label}: {formatCurrency(item.value)}
              </title>
            </rect>
          </g>
        );
      })}
      {data.map((item, index) => {
        const x = padding.left + index * (barWidth + gap) + barWidth / 2;
        return (
          <text
            key={`${item.label}-label`}
            x={x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-4)"
          >
            {item.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const canViewDashboard = user?.permissions?.includes('view_dashboard');
  const [range, setRange] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!data?.recentBookings) return;
    const payload = data.recentBookings.slice(0, 20).map((booking) => ({
      id: booking.id,
      name: booking.functionName || 'Booking',
      subtitle: formatBookingSubtitle(booking),
      href: `/dashboard/bookings/${booking.id}`,
    }));
    window.localStorage.setItem('bika_palette_bookings', JSON.stringify(payload));
  }, [data?.recentBookings]);

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

      const normalizedStart = toDateOnly(analytics.range.startDate);
      const normalizedEnd = toDateOnly(analytics.range.endDate);

      const [
        enquiriesRes,
        recentBookingsRes,
        itemTypesRes,
        itemsRes,
        templateMenusRes,
        hallsRes,
        banquetsRes,
        usersRes,
        rolesRes,
      ] = await Promise.all([
        api.getEnquiries({ page: 1, limit: 1, isPencilBooked: 'true' }),
        api.getBookings({
          page: 1,
          limit: 6,
          fromDate: normalizedStart || undefined,
          toDate: normalizedEnd || undefined,
        }),
        api.getItemTypes({ page: 1, limit: 1 }),
        api.getItems({ page: 1, limit: 1 }),
        api.getTemplateMenus({ page: 1, limit: 1 }),
        api.getHalls({ page: 1, limit: 1 }),
        api.getBanquets({ page: 1, limit: 1 }),
        api.getUsers({ page: 1, limit: 1 }),
        api.getRoles(),
      ]);

      const pencilBookings = (enquiriesRes.data?.data?.pagination?.total ?? 0) as number;

      // Build hall list from analytics breakdown (by booking count, no revenue available from this endpoint)
      const hallsByRevenue: HallRevenue[] = (analytics.breakdown.hallPerformance ?? []).map((h) => ({
        hallId: h.hallId,
        hallName: h.hallName,
        bookings: h.bookings ?? 0,
        share:
          (analytics.summary.bookingsInRange ?? 0) > 0
            ? ((h.bookings ?? 0) / analytics.summary.bookingsInRange) * 100
            : 0,
      }));

      const topFunctions = (analytics.breakdown?.functionTypes ?? [])
        .slice(0, 6)
        .map((entry) => ({
          ...entry,
          share:
            analytics.summary.bookingsInRange > 0
              ? (entry.count / analytics.summary.bookingsInRange) * 100
              : 0,
        }));

      const cancellationRate =
        analytics.summary.bookingsInRange > 0
          ? (analytics.summary.cancelledBookings / analytics.summary.bookingsInRange) *
          100
          : 0;

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
          title: 'Pencil bookings',
          value: `${pencilBookings}`,
          detail:
            pencilBookings > 0
              ? 'Tentative enquiries awaiting confirmation.'
              : 'No pending pencil bookings.',
          tone: pencilBookings > 5 ? 'warn' : 'good',
        },
        {
          title: 'Avg. booking value',
          value: formatCurrency(
            analytics.summary.bookingsInRange > 0
              ? analytics.summary.totalRevenue / analytics.summary.bookingsInRange
              : 0
          ),
          detail: 'Mean revenue per confirmed booking in selected period.',
          tone: 'neutral',
        },
        {
          title: 'Total revenue',
          value: formatCurrency(analytics.summary.totalRevenue),
          detail: 'Gross revenue from all bookings in the selected date range.',
          tone: 'neutral',
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

      const recentBookings = (recentBookingsRes.data?.data?.bookings ?? []) as BookingRow[];

      setData({
        analytics,
        recentBookings,
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

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoad = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void loadDashboardData();
    }, 500);
  }, [loadDashboardData]);

  const isAuthenticated = Boolean(user);
  useSSE(['booking:', 'customer:', 'enquiry:'], debouncedLoad, isAuthenticated);

  const hallSections = useMemo(() => {
    const allHalls = data?.hallsByRevenue || [];
    return {
      top: allHalls.slice(0, 5),
      low: [...allHalls].sort((a, b) => a.bookings - b.bookings).slice(0, 5),
    };
  }, [data?.hallsByRevenue]);

  if (loading) {
    return (
      <div className="space-y-6">
        <KpiCardSkeleton />
        <AdaptiveCard>
          <div className="skeleton" style={{ height: 16, width: 160, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 180, width: '100%' }} />
        </AdaptiveCard>
      </div>
    );
  }

  if (user && !canViewDashboard) {
    return (
      <AdaptiveCard className="py-16 text-center">
        <p className="text-[var(--text-2)]">You do not have access to view the dashboard.</p>
      </AdaptiveCard>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={BarChart3}
        variant="page"
        title="No data available"
        description="Try changing the date range."
      />
    );
  }

  const { analytics, resourceCounts } = data;
  const monthlyTrend = buildContinuousMonthlyTrend(
    analytics.trends.monthly,
    analytics.range.startDate,
    analytics.range.endDate,
    8
  );
  const monthlyRevenueSeries = monthlyTrend.map((row) => toSafeNumber(row.revenue));
  const monthlyBookingSeries = monthlyTrend.map((row) => toSafeNumber(row.bookings));
  const monthlyAverageSeries = monthlyTrend.map((row) => {
    const bookingCount = toSafeNumber(row.bookings);
    const revenueValue = toSafeNumber(row.revenue);
    return bookingCount > 0 ? revenueValue / bookingCount : 0;
  });

  const latestRevenue = monthlyRevenueSeries.at(-1) || 0;
  const previousRevenue = monthlyRevenueSeries.at(-2) || latestRevenue;
  const latestBookings = monthlyBookingSeries.at(-1) || 0;
  const previousBookings = monthlyBookingSeries.at(-2) || latestBookings;
  const latestAverage = monthlyAverageSeries.at(-1) || 0;
  const previousAverage = monthlyAverageSeries.at(-2) || latestAverage;

  const revenueDelta = getDeltaPercent(latestRevenue, previousRevenue);
  const bookingsDelta = getDeltaPercent(latestBookings, previousBookings);
  const averageDelta = getDeltaPercent(latestAverage, previousAverage);
  const pencilDelta =
    data.pencilBookings > 0
      ? -Math.min(
        99,
        (data.pencilBookings / Math.max(1, analytics.summary.bookingsInRange)) * 100
      )
      : 0;

  const maxHallBookings = Math.max(1, ...hallSections.top.map((row) => row.bookings));
  const monthlyRevenueData = monthlyTrend.map((entry) => ({
    label: formatMonthShort(entry.month),
    value: toSafeNumber(entry.revenue),
  }));

  return (
    <div className="space-y-5">
      <AdaptiveCard>
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <h1 className="page-title">
              Key Metrics & Performance
            </h1>
            <p className="page-subtitle">
              Revenue view from{' '}
              {formatDateDDMMYYYY(analytics.range.startDate)} to{' '}
              {formatDateDDMMYYYY(analytics.range.endDate)}
            </p>
          </div>
          <div className="filter-bar xl:justify-end">
            <Combobox
              className="sm:w-[138px]"
              value={range}
              onChange={setRange}
              options={[
                { value: '1m', label: 'Last 1 month' },
                { value: '3m', label: 'Last 3 months' },
                { value: '6m', label: 'Last 6 months' },
                { value: '1y', label: 'Last 1 year' },
                { value: 'all', label: 'All time' },
              ]}
            />
            <input
              type="date"
              className="input sm:w-[150px] num"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="input sm:w-[150px] num"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <AdaptiveButton
              type="button"
              onClick={() => void loadDashboardData()}
              className="justify-center sm:min-w-[112px]"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </AdaptiveButton>
          </div>
        </div>
      </AdaptiveCard>

      <div className="kpi-grid">
        <KpiCard
          label="Total Revenue"
          icon={IndianRupee}
          value={analytics.summary.totalRevenue}
          format="currency"
          delta={{ value: revenueDelta, label: 'Trend' }}
          sparkline={monthlyRevenueSeries}
        />
        <KpiCard
          label="Total Bookings"
          icon={CalendarCheck}
          value={analytics.summary.bookingsInRange}
          format="number"
          delta={{ value: bookingsDelta, label: 'Trend' }}
          sparkline={monthlyBookingSeries}
        />
        <KpiCard
          label="Pencil Bookings"
          icon={AlertTriangle}
          value={data.pencilBookings}
          format="number"
          delta={{ value: pencilDelta, label: 'Trend' }}
          sparkline={[...monthlyBookingSeries.slice(-6), Math.max(1, data.pencilBookings)]}
        />
        <KpiCard
          label="Avg. Booking Value"
          icon={DollarSign}
          value={data.averageBookingValue}
          format="currency"
          delta={{ value: averageDelta, label: 'Trend' }}
          sparkline={monthlyAverageSeries}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AdaptiveCard noPadding>
          <div className="panel-header">
            <div>
              <p className="panel-title">Top Performing Halls</p>
              <p className="panel-subtitle">By booking count in selected period</p>
            </div>
            <Link href="/dashboard/reports" className="view-all">
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="panel-body space-y-0">
            {hallSections.top.length === 0 ? (
              <EmptyState
                icon={Building2}
                variant="page"
                title="No data available"
                description="Try changing the date range."
              />
            ) : (
              hallSections.top.map((hall, index) => (
                <div
                  key={hall.hallId}
                  className="grid grid-cols-[24px_minmax(0,1fr)_minmax(120px,160px)_auto] items-center gap-3 border-b border-[var(--border)] py-3 last:border-0"
                >
                  <p className="text-[13px] font-semibold text-[var(--text-4)] num">{index + 1}</p>
                  <p className="text-[15px] font-semibold text-[var(--text-1)] truncate">
                    {hall.hallName}
                  </p>
                  <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500"
                      style={{ width: `${Math.max((hall.bookings / maxHallBookings) * 100, 12)}%` }}
                    />
                  </div>
                  <p className="text-[15px] font-semibold text-[var(--text-1)] num">
                    {hall.bookings} {hall.bookings === 1 ? 'booking' : 'bookings'}
                  </p>
                </div>
              ))
            )}
          </div>
        </AdaptiveCard>

        <AdaptiveCard noPadding>
          <div className="panel-header">
            <div>
              <p className="panel-title">Monthly Revenue</p>
              <p className="panel-subtitle">Last 8 months trend</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal-200 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 text-[12px] font-semibold text-teal-700 dark:text-teal-200">
              ₹ In Lakhs
            </span>
          </div>
          <div className="panel-body">
            {monthlyTrend.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                variant="page"
                title="No data available"
                description="Try changing the date range."
              />
            ) : (
              <BarChart data={monthlyRevenueData} height={200} />
            )}
          </div>
        </AdaptiveCard>

        <AdaptiveCard noPadding>
          <div className="panel-header">
            <div>
              <p className="panel-title">Function Type Mix</p>
              <p className="panel-subtitle">Share of bookings</p>
            </div>
          </div>
          <div className="panel-body">
            {data.topFunctions.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                variant="page"
                title="No data available"
                description="Try changing the date range."
              />
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
                  {data.topFunctions.map((entry) => {
                    const colorMap: Record<string, string> = {
                      Wedding: '#14b8a6',
                      Reception: '#0d9488',
                      Birthday: '#f59e0b',
                      Corporate: '#6366f1',
                      Other: '#94a3b8',
                    };
                    return (
                      <div
                        key={entry.name}
                        style={{
                          width: `${entry.share}%`,
                          background: colorMap[entry.name] || '#94a3b8',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  {data.topFunctions.map((entry) => (
                    <div
                      key={`${entry.name}-list`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: 'var(--text-2)' }}>{entry.name}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </AdaptiveCard>
      </div>

      <AdaptiveCard noPadding>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Business Insights</h2>
            <p className="panel-subtitle">Actionable metrics for the selected period</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-[12px] font-semibold text-amber-700 dark:text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Actionable
          </span>
        </div>
        <div className="panel-body grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {data.insights.map((insight) => (
            <div
              key={insight.title}
              className={`insight-card ${insight.tone === 'good'
                  ? 'good'
                  : insight.tone === 'warn'
                    ? 'warn'
                    : 'neutral'
                }`}
            >
              <p className="insight-label">{insight.title}</p>
              <p className="insight-value num">{insight.value}</p>
              <p className="insight-detail">{insight.detail}</p>
            </div>
          ))}
        </div>
      </AdaptiveCard>

      <AdaptiveCard noPadding>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Resource Counts</h2>
          </div>
        </div>
        <div className="panel-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Link href="/dashboard/menu" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Item Types</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.itemTypes.toLocaleString('en-IN')}
            </p>
            <Layers className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Items</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.items.toLocaleString('en-IN')}
            </p>
            <UtensilsCrossed className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Template Menu</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.templateMenus.toLocaleString('en-IN')}
            </p>
            <ListChecks className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/enquiries" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Enquiry</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.enquiries.toLocaleString('en-IN')}
            </p>
            <PhoneCall className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Hall</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.halls.toLocaleString('en-IN')}
            </p>
            <Building2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/customers" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Manage Customers</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.customers.toLocaleString('en-IN')}
            </p>
            <Users className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Banquet</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.banquets.toLocaleString('en-IN')}
            </p>
            <Landmark className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Manage Users</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.users.toLocaleString('en-IN')}
            </p>
            <UserCircle2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/bookings" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Booking</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.bookings.toLocaleString('en-IN')}
            </p>
            <CalendarCheck className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="resource-tile">
            <p className="text-xs text-[var(--text-4)]">Manage Roles</p>
            <p className="text-xl font-semibold text-[var(--text-1)] mt-1 num">
              {resourceCounts.roles.toLocaleString('en-IN')}
            </p>
            <BarChart3 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
        </div>
      </AdaptiveCard>

      <AdaptiveCard noPadding>
        <div className="panel-header">
          <h2 className="panel-title">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="view-all"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="panel-body space-y-3">
          {data.recentBookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              variant="page"
              title="No recent bookings"
              description="Bookings created recently will appear here."
            />
          ) : (
            data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-1)] break-words">
                    {booking.functionName}
                  </p>
                  <p className="text-xs text-[var(--text-4)] mt-1 break-words">
                    {booking.customer?.name || 'Unknown customer'} •{' '}
                    {booking.customer?.phone || 'N/A'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-[var(--text-1)]">
                    {formatDateDDMMYYYY(booking.functionDate)}
                  </p>
                  <p className="text-xs text-[var(--text-2)] mt-1">
                    {formatCurrency(toSafeNumber(booking.grandTotal))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </AdaptiveCard>
    </div>
  );
}
