'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  PhoneCall,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/date';

interface BookingCalendarRow {
  id: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  functionTime: string;
  expectedGuests: number;
  grandTotal: number;
  status: string;
  isQuotation: boolean;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

interface EnquiryCalendarRow {
  id: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  functionTime?: string | null;
  expectedGuests: number;
  status: string;
  quotationSent?: boolean;
  isPencilBooked?: boolean;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

interface AgendaEntry {
  id: string;
  kind: 'booking' | 'enquiry';
  date: string;
  title: string;
  subtitle: string;
  status: string;
  amount?: number;
}

type CalendarViewMode = 'month' | 'week' | 'day';

function toSafeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function dateToKey(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return formatDateKey(date);
}

function monthBounds(month: Date): { start: Date; end: Date } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}

function buildCalendarDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const days: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    days.push(date);
  }
  return days;
}

function buildWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function isDateInRange(value: string, start: Date, end: Date): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

async function fetchBookings(start: Date, end: Date): Promise<BookingCalendarRow[]> {
  const rows: BookingCalendarRow[] = [];
  const limit = 500;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.getBookings({
      page,
      limit,
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
    });
    const data = response.data?.data;
    rows.push(...((data?.bookings || []) as BookingCalendarRow[]));
    totalPages = Math.max(1, Number(data?.pagination?.totalPages || 1));
    page += 1;
    if (page > 100) break;
  }

  return rows;
}

async function fetchEnquiries(start: Date, end: Date): Promise<EnquiryCalendarRow[]> {
  const rows: EnquiryCalendarRow[] = [];
  const limit = 500;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.getEnquiries({ page, limit });
    const data = response.data?.data;
    const batch = ((data?.enquiries || []) as EnquiryCalendarRow[]).filter((entry) =>
      isDateInRange(entry.functionDate, start, end)
    );
    rows.push(...batch);
    totalPages = Math.max(1, Number(data?.pagination?.totalPages || 1));
    page += 1;
    if (page > 100) break;
  }

  return rows;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<BookingCalendarRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryCalendarRow[]>([]);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      let start: Date;
      let end: Date;
      if (viewMode === 'month') {
        const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const bounds = monthBounds(monthStart);
        start = bounds.start;
        end = bounds.end;
      } else if (viewMode === 'week') {
        start = startOfWeek(viewDate);
        end = endOfWeek(viewDate);
      } else {
        start = startOfDay(viewDate);
        end = endOfDay(viewDate);
      }

      const [bookingRows, enquiryRows] = await Promise.all([
        fetchBookings(start, end),
        fetchEnquiries(start, end),
      ]);
      setBookings(bookingRows);
      setEnquiries(enquiryRows);

      setSelectedDate((prev) => {
        if (viewMode === 'month') {
          const prevDate = parseDateKey(prev);
          if (
            prevDate.getMonth() === viewDate.getMonth() &&
            prevDate.getFullYear() === viewDate.getFullYear()
          ) {
            return prev;
          }
          const today = new Date();
          const inThisMonth =
            today.getMonth() === viewDate.getMonth() &&
            today.getFullYear() === viewDate.getFullYear();
          return inThisMonth ? formatDateKey(today) : formatDateKey(start);
        }
        return formatDateKey(viewDate);
      });
    } catch (error) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [viewDate, viewMode]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const searchQuery = search.trim().toLowerCase();

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    return bookings.filter((entry) =>
      [
        entry.functionName,
        entry.functionType,
        entry.status,
        entry.customer?.name || '',
        entry.customer?.phone || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [bookings, searchQuery]);

  const filteredEnquiries = useMemo(() => {
    if (!searchQuery) return enquiries;
    return enquiries.filter((entry) =>
      [
        entry.functionName,
        entry.functionType,
        entry.status,
        entry.customer?.name || '',
        entry.customer?.phone || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [enquiries, searchQuery]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingCalendarRow[]>();
    filteredBookings.forEach((entry) => {
      const key = dateToKey(entry.functionDate);
      if (!key) return;
      const bucket = map.get(key) || [];
      bucket.push(entry);
      map.set(key, bucket);
    });

    map.forEach((rows) =>
      rows.sort(
        (a, b) => new Date(a.functionDate).getTime() - new Date(b.functionDate).getTime()
      )
    );
    return map;
  }, [filteredBookings]);

  const enquiriesByDate = useMemo(() => {
    const map = new Map<string, EnquiryCalendarRow[]>();
    filteredEnquiries.forEach((entry) => {
      const key = dateToKey(entry.functionDate);
      if (!key) return;
      const bucket = map.get(key) || [];
      bucket.push(entry);
      map.set(key, bucket);
    });

    map.forEach((rows) =>
      rows.sort(
        (a, b) => new Date(a.functionDate).getTime() - new Date(b.functionDate).getTime()
      )
    );
    return map;
  }, [filteredEnquiries]);

  const selectedBookings = bookingsByDate.get(selectedDate) || [];
  const selectedEnquiries = enquiriesByDate.get(selectedDate) || [];
  const selectedDateLabel = parseDateKey(selectedDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const monthLabel = viewDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const weekDays = useMemo(() => buildWeekDays(viewDate), [viewDate]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })} - ${weekEnd.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  const viewLabel =
    viewMode === 'month'
      ? monthLabel
      : viewMode === 'week'
      ? weekLabel
      : viewDate.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
  const todayKey = formatDateKey(new Date());
  const calendarDays = useMemo(
    () => buildCalendarDays(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)),
    [viewDate]
  );

  const summary = useMemo(() => {
    const activeBookings = filteredBookings.filter((entry) => entry.status !== 'cancelled');
    const confirmedBookings = activeBookings.filter((entry) => !entry.isQuotation).length;
    const monthlyRevenue = activeBookings.reduce(
      (sum, entry) => sum + toSafeNumber(entry.grandTotal),
      0
    );
    const guestVolume = activeBookings.reduce(
      (sum, entry) => sum + toSafeNumber(entry.expectedGuests),
      0
    );

    return {
      bookings: filteredBookings.length,
      enquiries: filteredEnquiries.length,
      confirmedBookings,
      monthlyRevenue,
      guestVolume,
    };
  }, [filteredBookings, filteredEnquiries]);

  const agenda = useMemo<AgendaEntry[]>(() => {
    const bookingItems: AgendaEntry[] = filteredBookings.map((entry) => ({
      id: `booking-${entry.id}`,
      kind: 'booking',
      date: entry.functionDate,
      title: entry.functionName,
      subtitle: `${entry.customer?.name || 'Customer'} • ${entry.expectedGuests} guests`,
      status: entry.isQuotation ? 'quotation' : entry.status,
      amount: toSafeNumber(entry.grandTotal),
    }));

    const enquiryItems: AgendaEntry[] = filteredEnquiries.map((entry) => ({
      id: `enquiry-${entry.id}`,
      kind: 'enquiry',
      date: entry.functionDate,
      title: entry.functionName,
      subtitle: `${entry.customer?.name || 'Lead'} • ${entry.expectedGuests} guests`,
      status: entry.isPencilBooked ? 'pencil' : entry.status,
    }));

    return [...bookingItems, ...enquiryItems]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 12);
  }, [filteredBookings, filteredEnquiries]);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayEvents = useMemo(() => {
    const bookingItems = selectedBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      kind: 'booking' as const,
      title: booking.functionName,
      time: booking.functionTime || '--:--',
      subtitle: `${booking.customer?.name || 'Customer'} • ${booking.expectedGuests} guests`,
      status: booking.isQuotation ? 'quotation' : booking.status,
      amount: toSafeNumber(booking.grandTotal),
    }));

    const enquiryItems = selectedEnquiries.map((enquiry) => ({
      id: `enquiry-${enquiry.id}`,
      kind: 'enquiry' as const,
      title: enquiry.functionName,
      time: enquiry.functionTime || '--:--',
      subtitle: `${enquiry.customer?.name || 'Lead'} • ${enquiry.expectedGuests} guests`,
      status: enquiry.isPencilBooked ? 'pencil' : enquiry.status,
      amount: undefined,
    }));

    return [...bookingItems, ...enquiryItems].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  }, [selectedBookings, selectedEnquiries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-1">
          Track bookings and enquiries by date with month, week, and day views.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setViewDate((prev) => {
                  if (viewMode === 'month') {
                    return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                  }
                  if (viewMode === 'week') {
                    const next = new Date(prev);
                    next.setDate(next.getDate() - 7);
                    return next;
                  }
                  const next = new Date(prev);
                  next.setDate(next.getDate() - 1);
                  return next;
                })
              }
              className="btn btn-secondary px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-full sm:w-auto sm:min-w-[220px] text-center">
              <p className="text-lg font-semibold text-gray-900">{viewLabel}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setViewDate((prev) => {
                  if (viewMode === 'month') {
                    return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                  }
                  if (viewMode === 'week') {
                    const next = new Date(prev);
                    next.setDate(next.getDate() + 7);
                    return next;
                  }
                  const next = new Date(prev);
                  next.setDate(next.getDate() + 1);
                  return next;
                })
              }
              className="btn btn-secondary px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(startOfDay(now));
                setSelectedDate(formatDateKey(now));
              }}
              className="btn btn-secondary"
            >
              Today
            </button>
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
              {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm font-semibold capitalize transition ${
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search function, customer, status..."
              />
            </div>
            <button
              type="button"
              onClick={() => void loadCalendarData()}
              className="btn btn-primary w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Bookings</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.bookings.toLocaleString()}
          </p>
          <CalendarCheck className="w-4 h-4 text-primary-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Confirmed</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.confirmedBookings.toLocaleString()}
          </p>
          <CalendarDays className="w-4 h-4 text-emerald-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Enquiries</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.enquiries.toLocaleString()}
          </p>
          <PhoneCall className="w-4 h-4 text-amber-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Guest Volume</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.guestVolume.toLocaleString()}
          </p>
          <Users className="w-4 h-4 text-sky-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Projected Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            ₹{summary.monthlyRevenue.toLocaleString('en-IN')}
          </p>
          <IndianRupee className="w-4 h-4 text-violet-700 mt-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {viewMode === 'month' && (
                <div className="overflow-x-auto">
                  <div className="min-w-[680px] space-y-2">
                    <div className="grid grid-cols-7 gap-2">
                      {weekdayLabels.map((label) => (
                        <div
                          key={label}
                          className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500 py-2"
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day) => {
                        const dayKey = formatDateKey(day);
                        const dayBookings = bookingsByDate.get(dayKey) || [];
                        const dayEnquiries = enquiriesByDate.get(dayKey) || [];
                        const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                        const isToday = dayKey === todayKey;
                        const isSelected = dayKey === selectedDate;

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            onClick={() => setSelectedDate(dayKey)}
                            className={`rounded-xl border p-2 text-left min-h-[96px] sm:min-h-[126px] transition ${
                              isSelected
                                ? 'border-primary-400 bg-primary-50 shadow-sm'
                                : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/40'
                            } ${isCurrentMonth ? '' : 'bg-gray-50/70 opacity-75'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-semibold ${
                                  isCurrentMonth ? 'text-gray-900' : 'text-gray-500'
                                }`}
                              >
                                {day.getDate()}
                              </span>
                              {isToday && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                                  Today
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1.5">
                              {dayBookings.length > 0 && (
                                <p className="text-[11px] inline-flex rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                                  {dayBookings.length} booking
                                  {dayBookings.length > 1 ? 's' : ''}
                                </p>
                              )}
                              {dayEnquiries.length > 0 && (
                                <p className="text-[11px] inline-flex rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                                  {dayEnquiries.length} enquir
                                  {dayEnquiries.length > 1 ? 'ies' : 'y'}
                                </p>
                              )}
                              {dayBookings[0] && (
                                <p className="text-xs text-gray-700 truncate">
                                  {dayBookings[0].functionName}
                                </p>
                              )}
                              {!dayBookings[0] && dayEnquiries[0] && (
                                <p className="text-xs text-gray-700 truncate">
                                  {dayEnquiries[0].functionName}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'week' && (
                <div className="overflow-x-auto">
                  <div className="min-w-[920px] grid grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                      const dayKey = formatDateKey(day);
                      const dayBookings = bookingsByDate.get(dayKey) || [];
                      const dayEnquiries = enquiriesByDate.get(dayKey) || [];
                      const isSelected = dayKey === selectedDate;
                      const isToday = dayKey === todayKey;

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setSelectedDate(dayKey)}
                          className={`rounded-xl border p-3 text-left align-top min-h-[280px] ${
                            isSelected
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50/30'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-0.5">
                            {day.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {isToday && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                                Today
                              </span>
                            )}
                          </p>
                          <div className="mt-3 space-y-2">
                            {dayBookings.slice(0, 4).map((booking) => (
                              <div
                                key={booking.id}
                                className="rounded-md bg-emerald-100 text-emerald-900 px-2 py-1 text-xs truncate"
                              >
                                {booking.functionTime || '--:--'} {booking.functionName}
                              </div>
                            ))}
                            {dayEnquiries.slice(0, 4).map((enquiry) => (
                              <div
                                key={enquiry.id}
                                className="rounded-md bg-amber-100 text-amber-900 px-2 py-1 text-xs truncate"
                              >
                                {enquiry.functionTime || '--:--'} {enquiry.functionName}
                              </div>
                            ))}
                            {dayBookings.length + dayEnquiries.length === 0 && (
                              <p className="text-xs text-gray-400">No events</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'day' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">{selectedDateLabel}</p>
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No bookings or enquiries for this day.</p>
                  ) : (
                    dayEvents.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl border px-3 py-2 ${
                          entry.kind === 'booking'
                            ? 'border-emerald-200 bg-emerald-50/70'
                            : 'border-amber-200 bg-amber-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                          <span className="text-xs text-gray-700">{entry.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{entry.subtitle}</p>
                        <p className="text-xs text-gray-600 mt-1 capitalize">
                          {entry.status}
                          {entry.kind === 'booking' && typeof entry.amount === 'number' && (
                            <span> • ₹{entry.amount.toLocaleString('en-IN')}</span>
                          )}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="card xl:sticky xl:top-24 h-fit">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Selected Day</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">{selectedDateLabel}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">Bookings</p>
                <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                  {selectedBookings.length}
                </span>
              </div>
              <div className="space-y-2">
                {selectedBookings.length === 0 ? (
                  <p className="text-xs text-gray-500">No bookings for this day.</p>
                ) : (
                  selectedBookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{booking.functionName}</p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            booking.isQuotation
                              ? 'bg-amber-100 text-amber-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {booking.isQuotation ? 'quotation' : booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {booking.customer?.name || 'Customer'} • {booking.expectedGuests} guests
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {booking.functionTime || '--:--'} • ₹
                        {toSafeNumber(booking.grandTotal).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">Enquiries</p>
                <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                  {selectedEnquiries.length}
                </span>
              </div>
              <div className="space-y-2">
                {selectedEnquiries.length === 0 ? (
                  <p className="text-xs text-gray-500">No enquiries for this day.</p>
                ) : (
                  selectedEnquiries.map((enquiry) => (
                    <div key={enquiry.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{enquiry.functionName}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {enquiry.isPencilBooked ? 'pencil' : enquiry.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {enquiry.customer?.name || 'Lead'} • {enquiry.expectedGuests} guests
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <Link href="/dashboard/bookings" className="btn btn-secondary flex-1 justify-center">
                Bookings
              </Link>
              <Link href="/dashboard/enquiries" className="btn btn-secondary flex-1 justify-center">
                Enquiries
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="panel-header">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming This Month</h2>
        </div>
        <div className="space-y-2">
          {agenda.length === 0 ? (
            <p className="text-sm text-gray-500">No events found for the selected month.</p>
          ) : (
            agenda.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{entry.subtitle}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-600">
                    {formatDateDDMMYYYY(entry.date)} •{' '}
                    <span className="capitalize">{entry.kind}</span>
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="capitalize">{entry.status}</span>
                    {entry.kind === 'booking' && typeof entry.amount === 'number' && (
                      <span> • ₹{entry.amount.toLocaleString('en-IN')}</span>
                    )}
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
