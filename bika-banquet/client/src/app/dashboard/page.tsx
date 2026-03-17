'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateDDMMYYYY } from '@/lib/date';
import { KpiCardSkeleton } from '@/components/Skeletons';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
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

function Sparkline({
  values,
  color = '#14b8a6',
}: {
  values: number[];
  color?: string;
}) {
  const width = 64;
  const height = 24;
  const safeValues = values.length >= 2 ? values : [0, ...(values.length ? values : [0])];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(max - min, 1);
  const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width;

  const points = safeValues
    .map((value, index) => {
      const x = Number((index * step).toFixed(2));
      const y = Number((height - ((value - min) / range) * height).toFixed(2));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="sparkline num" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
        <p className="text-gray-600">You do not have access to view the dashboard.</p>
      </AdaptiveCard>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <BarChart3 size={22} />
        </div>
        <p className="empty-state-title">No data available</p>
        <p className="empty-state-desc">Try changing the date range.</p>
      </div>
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

  const maxHallRevenue = Math.max(1, ...hallSections.top.map((row) => row.revenue));
  const monthlyRevenueData = monthlyTrend.map((entry) => ({
    label: formatMonthShort(entry.month),
    value: toSafeNumber(entry.revenue),
  }));

  const renderDelta = (value: number) => {
    const positive = value > 0;
    const negative = value < 0;
    const cls = positive ? 'delta-up' : negative ? 'delta-down' : 'delta-neutral';
    return (
      <span className={`kpi-delta num ${cls}`}>
        {positive ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : negative ? (
          <ArrowDownRight className="w-3 h-3" />
        ) : null}
        {`${Math.abs(value).toFixed(1)}%`}
      </span>
    );
  };

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
            <select
              className="input sm:w-[138px]"
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
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Revenue</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <p className="kpi-value num">
            {formatCurrency(analytics.summary.totalRevenue).replace('.00', '')}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            {renderDelta(revenueDelta)}
            <Sparkline values={monthlyRevenueSeries} color="#34d399" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Bookings</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="kpi-value num">{analytics.summary.bookingsInRange.toLocaleString()}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            {renderDelta(bookingsDelta)}
            <Sparkline values={monthlyBookingSeries} color="#86efac" />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Pencil Bookings</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="kpi-value num">{data.pencilBookings}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            {renderDelta(pencilDelta)}
            <Sparkline
              values={[...monthlyBookingSeries.slice(-6), Math.max(1, data.pencilBookings)]}
              color="#f59e0b"
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Avg. Booking Value</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="kpi-value num">
            {formatCurrency(data.averageBookingValue).replace('.00', '')}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            {renderDelta(averageDelta)}
            <Sparkline values={monthlyAverageSeries} color="#60a5fa" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AdaptiveCard noPadding>
          <div className="panel-header">
            <div>
              <p className="panel-title">Top Performing Halls</p>
              <p className="panel-subtitle">By revenue in selected period</p>
            </div>
            <Link href="/dashboard/reports" className="view-all">
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="panel-body space-y-0">
            {hallSections.top.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon">
                  <Building2 size={22} />
                </div>
                <p className="empty-state-title">No data available</p>
                <p className="empty-state-desc">Try changing the date range.</p>
              </div>
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
                      style={{ width: `${Math.max((hall.revenue / maxHallRevenue) * 100, 12)}%` }}
                    />
                  </div>
                  <p className="text-[15px] font-semibold text-[var(--text-1)] num">
                    {formatCurrency(hall.revenue).replace('.00', '')}
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
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal-700">
              ₹ In Lakhs
            </span>
          </div>
          <div className="panel-body">
            {monthlyTrend.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon">
                  <BarChart3 size={22} />
                </div>
                <p className="empty-state-title">No data available</p>
                <p className="empty-state-desc">Try changing the date range.</p>
              </div>
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700">
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
            <p className="text-xs text-gray-500">Item Types</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.itemTypes.toLocaleString()}
            </p>
            <Layers className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="resource-tile">
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.items.toLocaleString()}
            </p>
            <UtensilsCrossed className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/menu" className="resource-tile">
            <p className="text-xs text-gray-500">Template Menu</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.templateMenus.toLocaleString()}
            </p>
            <ListChecks className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/enquiries" className="resource-tile">
            <p className="text-xs text-gray-500">Enquiry</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.enquiries.toLocaleString()}
            </p>
            <PhoneCall className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="resource-tile">
            <p className="text-xs text-gray-500">Hall</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.halls.toLocaleString()}
            </p>
            <Building2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/customers" className="resource-tile">
            <p className="text-xs text-gray-500">Manage Customers</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.customers.toLocaleString()}
            </p>
            <Users className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/halls" className="resource-tile">
            <p className="text-xs text-gray-500">Banquet</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.banquets.toLocaleString()}
            </p>
            <Landmark className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="resource-tile">
            <p className="text-xs text-gray-500">Manage Users</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.users.toLocaleString()}
            </p>
            <UserCircle2 className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/bookings" className="resource-tile">
            <p className="text-xs text-gray-500">Booking</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.bookings.toLocaleString()}
            </p>
            <CalendarCheck className="w-4 h-4 text-primary-600 mt-2" />
          </Link>
          <Link href="/dashboard/settings" className="resource-tile">
            <p className="text-xs text-gray-500">Manage Roles</p>
            <p className="text-xl font-semibold text-gray-900 mt-1 num">
              {resourceCounts.roles.toLocaleString()}
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
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">
                <CalendarCheck size={22} />
              </div>
              <p className="empty-state-title">No data available</p>
              <p className="empty-state-desc">Try changing the date range.</p>
            </div>
          ) : (
            data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 break-words">
                    {booking.functionName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 break-words">
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
      </AdaptiveCard>
    </div>
  );
}
