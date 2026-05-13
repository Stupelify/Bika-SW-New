'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe2,
  IndianRupee,
  PhoneCall,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/date';
import { CalendarSkeleton } from '@/components/Skeletons';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';

interface BookingCalendarRow {
  id: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  functionTime: string;
  startTime?: string | null;
  endTime?: string | null;
  expectedGuests: number;
  grandTotal: number;
  paymentReceived?: number | string | null;
  balanceAmount?: number | string | null;
  dueAmount?: number | string | null;
  versionNumber?: number | null;
  status: string;
  isQuotation: boolean;
  isPencilBooking?: boolean;
  pencilExpiresAt?: string | null;
  halls?: Array<{
    hallId?: string;
    hall?: {
      id: string;
      name: string;
    } | null;
  }>;
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
  kind: 'booking' | 'enquiry' | 'google';
  date: string;
  title: string;
  subtitle: string;
  status: string;
  amount?: number;
  source: 'software' | 'google';
}

type CalendarViewMode = 'month' | 'week' | 'day';
type CalendarDisplayMode = 'calendar' | 'hallBoard';

interface HallCalendarOption {
  id: string;
  name: string;
  banquetName?: string;
}

interface HallScheduleParty {
  id: string;
  title: string;
  date: string;
  timeLabel: string;
  status: string;
  customerName: string;
  customerPhone: string;
  guests: number;
  sortMinutes: number;
  startMinutes: number;
  endMinutes: number;
}

interface HallScheduleGroup {
  hallName: string;
  parties: HallScheduleParty[];
}

interface BookingDetail {
  id: string;
  functionName: string;
  functionType?: string | null;
  functionDate: string;
  functionTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedGuests?: number | null;
  grandTotal?: number | null;
  status?: string | null;
  isQuotation?: boolean;
  isPencilBooking?: boolean;
  pencilExpiresAt?: string | null;
  notes?: string | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  halls?: Array<{
    hall?: {
      id?: string | null;
      name?: string | null;
    } | null;
  }>;
  packs?: Array<{
    id: string;
    packName?: string | null;
    mealSlot?: {
      name?: string | null;
    } | null;
    startTime?: string | null;
    endTime?: string | null;
    packCount?: number | null;
    noOfPack?: number | null;
  }>;
  additionalItems?: Array<{
    description?: string | null;
  }>;
  payments?: Array<{
    id: string;
    amount?: number | null;
    paymentDate?: string | null;
    method?: string | null;
    narration?: string | null;
    receiver?: {
      name?: string | null;
    } | null;
  }>;
}

interface DayEvent {
  id: string;
  kind: 'booking' | 'enquiry' | 'google';
  title: string;
  time: string;
  subtitle: string;
  status: string;
  amount?: number;
  sortMinutes: number;
  bookingId?: string;
  source: 'software' | 'google';
}

interface GoogleCalendarEventRow {
  id: string;
  googleEventId: string;
  calendarId: string;
  venueName: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  start: string;
  end: string;
  isAllDay: boolean;
  htmlLink?: string;
  origin: 'software' | 'google';
}

interface GoogleCalendarFetchResult {
  enabled: boolean;
  configured: boolean;
  sourceCount: number;
  events: GoogleCalendarEventRow[];
}

type EventSourceFilter = 'all' | 'software' | 'google';

interface HallBoardSlot {
  bookingId?: string;
  date: string;
  timeLabel: string;
  functionName: string;
  customerName?: string;
  guests?: number;
  location?: string;
  status: string;
  sortKey: number;
  startMinutes: number;
  endMinutes: number;
  source: 'software' | 'google';
  htmlLink?: string;
}

interface HallBoardRow {
  hallId?: string;
  hallName: string;
  banquetName?: string;
  rowType?: 'hall' | 'googleVenue';
  slots: HallBoardSlot[];
}

interface MobileTimelineEntry {
  id: string;
  kind: 'booking' | 'enquiry' | 'google';
  title: string;
  subtitle: string;
  timeLabel: string;
  top: number;
  height: number;
  borderColor: string;
  background: string;
  textColor: string;
  source: 'software' | 'google';
  bookingId?: string;
  enquiryId?: string;
}

type ServiceSlot = 'breakfast' | 'lunch' | 'hiTea' | 'dinner';

const SERVICE_SLOT_LABELS: Record<ServiceSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  hiTea: 'Hi-Tea',
  dinner: 'Dinner',
};

const LOCATION_PALETTE = [
  {
    solid: '#0d9488',
    soft: 'rgba(13, 148, 136, 0.1)',
    text: '#115e59',
    border: '#14b8a6',
  },
  {
    solid: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.1)',
    text: '#3730a3',
    border: '#6366f1',
  },
  {
    solid: '#d97706',
    soft: 'rgba(217, 119, 6, 0.12)',
    text: '#92400e',
    border: '#f59e0b',
  },
  {
    solid: '#e11d48',
    soft: 'rgba(225, 29, 72, 0.1)',
    text: '#9f1239',
    border: '#fb7185',
  },
];

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getLocationPalette(seed: string) {
  const normalized = seed.trim().toLowerCase();
  if (!normalized) return LOCATION_PALETTE[0];
  return LOCATION_PALETTE[stableHash(normalized) % LOCATION_PALETTE.length];
}

function resolveServiceSlot(minutes: number): ServiceSlot {
  if (!Number.isFinite(minutes)) return 'lunch';
  if (minutes < 660) return 'breakfast';
  if (minutes < 900) return 'lunch';
  if (minutes < 1080) return 'hiTea';
  return 'dinner';
}

function compactLocationLabel(value: string): string {
  const clean = value.trim();
  if (!clean) return '';
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 13)}...`;
}

function compactFunctionLabel(value: string, max = 18): string {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(6, max - 3))}...`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toSafeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveBookingStatus(entry: { isQuotation?: boolean; status?: string | null; isPencilBooking?: boolean }): string {
  if (entry.isPencilBooking) return 'pencil';
  return entry.isQuotation ? 'quotation' : (entry.status || 'pending').toLowerCase();
}

function resolveEnquiryStatus(entry: Pick<EnquiryCalendarRow, 'isPencilBooked' | 'status'>): string {
  return entry.isPencilBooked ? 'pencil' : (entry.status || 'enquiry').toLowerCase();
}

function getPaymentSnapshot(entry: BookingCalendarRow): {
  total: number;
  paid: number;
  balance: number;
  percent: number;
  label: string;
  tone: 'paid' | 'partial' | 'outstanding';
} {
  const total = toSafeNumber(entry.grandTotal);
  const explicitPaid = toSafeNumber(entry.paymentReceived);
  const explicitBalance = toSafeNumber(entry.balanceAmount ?? entry.dueAmount);
  const paid = explicitPaid > 0 ? explicitPaid : Math.max(0, total - explicitBalance);
  const balance = explicitBalance > 0 ? explicitBalance : Math.max(0, total - paid);
  const percent = total > 0 ? clamp(Math.round((paid / total) * 100), 0, 100) : 0;
  const tone = total > 0 && balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'outstanding';
  const label = tone === 'paid' ? 'Paid' : tone === 'partial' ? 'Partial' : 'Outstanding';
  return { total, paid, balance, percent, label, tone };
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseClockToMinutes(value: string): number {
  const raw = value.trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return hour * 60 + minute;
    }
  }

  const normalized = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  const meridianMatch = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!meridianMatch) return Number.POSITIVE_INFINITY;

  const hourPart = Number(meridianMatch[1]);
  const minutePart = Number(meridianMatch[2]);
  if (hourPart < 1 || hourPart > 12 || minutePart < 0 || minutePart > 59) {
    return Number.POSITIVE_INFINITY;
  }

  let hour = hourPart % 12;
  if (meridianMatch[3] === 'PM') hour += 12;
  return hour * 60 + minutePart;
}

function formatClockDisplay(value?: string | null): string {
  if (!value) return '';
  const raw = value.trim();
  if (!raw) return '';

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return raw;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return raw;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function bookingTimeLabel(entry: {
  startTime?: string | null;
  endTime?: string | null;
  functionTime?: string | null;
}): string {
  const start = formatClockDisplay(entry.startTime);
  const end = formatClockDisplay(entry.endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  const fallback = formatClockDisplay(entry.functionTime);
  return fallback || '--:--';
}

function bookingSortMinutes(entry: BookingCalendarRow): number {
  if (entry.startTime) {
    const start = parseClockToMinutes(entry.startTime);
    if (Number.isFinite(start)) return start;
  }
  if (entry.functionTime) {
    const fnTime = parseClockToMinutes(entry.functionTime);
    if (Number.isFinite(fnTime)) return fnTime;
  }
  if (entry.endTime) {
    const end = parseClockToMinutes(entry.endTime);
    if (Number.isFinite(end)) return end;
  }
  return Number.POSITIVE_INFINITY;
}

function resolveBookingTimeRange(entry: {
  startTime?: string | null;
  endTime?: string | null;
  functionTime?: string | null;
}): { startMinutes: number; endMinutes: number } {
  const startCandidate = entry.startTime || entry.functionTime || entry.endTime || '';
  let start = parseClockToMinutes(startCandidate);
  if (!Number.isFinite(start)) {
    return { startMinutes: 0, endMinutes: 1440 };
  }

  let end = parseClockToMinutes(entry.endTime || '');
  if (!Number.isFinite(end)) {
    end = Math.min(start + 120, 1440);
  }
  if (end <= start) {
    end = Math.min(start + 60, 1440);
  }
  return { startMinutes: start, endMinutes: end };
}

function getBookingHallNames(entry: BookingCalendarRow): string[] {
  const names = (entry.halls || [])
    .map((hallRow) => hallRow.hall?.name?.trim() || '')
    .filter(Boolean);
  return Array.from(new Set(names));
}

function getPrimaryHallName(entry: BookingCalendarRow): string {
  const hallNames = getBookingHallNames(entry);
  return hallNames[0] || 'Unassigned Hall';
}

function eventDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDateKey(date);
}

function formatEventClock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function googleEventTimeLabel(entry: GoogleCalendarEventRow): string {
  if (entry.isAllDay) return 'All Day';
  if (!entry.start) return '--:--';

  const startLabel = formatEventClock(entry.start);
  if (!entry.end || entry.end === entry.start) return startLabel;

  const endLabel = formatEventClock(entry.end);
  return `${startLabel} - ${endLabel}`;
}

function googleEventSortMinutes(entry: GoogleCalendarEventRow): number {
  if (entry.isAllDay) return 0;
  const date = new Date(entry.start);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return date.getHours() * 60 + date.getMinutes();
}

function googleEventRangeMinutes(entry: GoogleCalendarEventRow): { startMinutes: number; endMinutes: number } {
  if (entry.isAllDay) return { startMinutes: 0, endMinutes: 1440 };
  const start = googleEventSortMinutes(entry);
  if (!Number.isFinite(start)) return { startMinutes: 0, endMinutes: 1440 };
  if (!entry.end) return { startMinutes: start, endMinutes: Math.min(start + 60, 1440) };
  const endDate = new Date(entry.end);
  if (Number.isNaN(endDate.getTime())) {
    return { startMinutes: start, endMinutes: Math.min(start + 60, 1440) };
  }
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  return {
    startMinutes: start,
    endMinutes: endMinutes > start ? endMinutes : Math.min(start + 60, 1440),
  };
}

function findOverlaps(parties: HallScheduleParty[]) {
  const sorted = [...parties].sort((a, b) => a.startMinutes - b.startMinutes);
  const overlaps: Array<{ first: HallScheduleParty; second: HallScheduleParty }> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (sorted[j].startMinutes >= sorted[i].endMinutes) break;
      overlaps.push({ first: sorted[i], second: sorted[j] });
    }
  }
  return overlaps;
}

function findDayHallConflicts(bookingsForDay: BookingCalendarRow[]) {
  const byHall = new Map<string, HallScheduleParty[]>();

  bookingsForDay
    .filter((booking) => resolveBookingStatus(booking) !== 'cancelled')
    .forEach((booking) => {
      const hallNames = getBookingHallNames(booking);
      const effectiveHallNames = hallNames.length > 0 ? hallNames : ['Unassigned Hall'];
      const { startMinutes, endMinutes } = resolveBookingTimeRange(booking);

      effectiveHallNames.forEach((hallName) => {
        const bucket = byHall.get(hallName) || [];
        bucket.push({
          id: booking.id,
          title: booking.functionName,
          date: booking.functionDate,
          timeLabel: bookingTimeLabel(booking),
          status: resolveBookingStatus(booking),
          customerName: booking.customer?.name || 'Customer',
          customerPhone: booking.customer?.phone || '--',
          guests: toSafeNumber(booking.expectedGuests),
          sortMinutes: bookingSortMinutes(booking),
          startMinutes,
          endMinutes,
        });
        byHall.set(hallName, bucket);
      });
    });

  return Array.from(byHall.entries()).flatMap(([hallName, parties]) =>
    findOverlaps(parties).map((overlap) => ({ hallName, ...overlap }))
  );
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

async function fetchHalls(): Promise<HallCalendarOption[]> {
  const response = await api.getHalls({ page: 1, limit: 5000 });
  const rows = response.data?.data?.halls || [];
  return (
    rows as Array<{
      id: string;
      name: string;
      banquet?: {
        name?: string;
      } | null;
    }>
  )
    .map((entry) => ({
      id: entry.id,
      name: (entry.name || '').trim(),
      banquetName: (entry.banquet?.name || '').trim(),
    }))
    .filter((entry) => entry.name.length > 0);
}

async function fetchGoogleCalendarEvents(
  start: Date,
  end: Date
): Promise<GoogleCalendarFetchResult> {
  try {
    const response = await api.getGoogleCalendarEvents({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    const payload = response.data?.data as
      | {
        enabled?: boolean;
        configured?: boolean;
        sourceCount?: number;
        events?: GoogleCalendarEventRow[];
      }
      | undefined;

    return {
      enabled: Boolean(payload?.enabled),
      configured: Boolean(payload?.configured),
      sourceCount: Number(payload?.sourceCount || 0),
      events: Array.isArray(payload?.events) ? payload!.events : [],
    };
  } catch (error) {
    return {
      enabled: false,
      configured: false,
      sourceCount: 0,
      events: [],
    };
  }
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('calendar');
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<EventSourceFilter>('all');
  const [bookings, setBookings] = useState<BookingCalendarRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryCalendarRow[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventRow[]>([]);
  const [googleImportEnabled, setGoogleImportEnabled] = useState(false);
  const [googleImportConfigured, setGoogleImportConfigured] = useState(false);
  const [googleSourceCount, setGoogleSourceCount] = useState(0);
  const [halls, setHalls] = useState<HallCalendarOption[]>([]);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [bookingDetailsLoading, setBookingDetailsLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetail | null>(null);
  const [printingDay, setPrintingDay] = useState(false);
  const [printBookings, setPrintBookings] = useState<BookingDetail[]>([]);
  const dayPanelRef = useRef<HTMLDivElement | null>(null);

  // ── Sidebar filter state ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cal_sidebar_open') !== 'false';
  });
  // null = all halls visible (default until halls load)
  const [selectedHallIds, setSelectedHallIds] = useState<Set<string> | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    () => new Set(['confirmed', 'enquiry', 'pencil', 'quotation', 'pending'])
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem('cal_sidebar_open', String(next)); } catch { }
      return next;
    });
  }, []);

  // Initialise selectedHallIds once halls load (select all by default)
  useEffect(() => {
    if (halls.length > 0 && selectedHallIds === null) {
      setSelectedHallIds(new Set(halls.map((h) => h.id)));
    }
  }, [halls, selectedHallIds]);

  const toggleHall = useCallback((hallId: string) => {
    setSelectedHallIds((prev) => {
      const base = prev ?? new Set(halls.map((h) => h.id));
      const next = new Set(base);
      if (next.has(hallId)) next.delete(hallId); else next.add(hallId);
      return next;
    });
  }, [halls]);

  const toggleStatus = useCallback((status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }, []);
  // ── End sidebar filter state ──────────────────────────────────────────────

  const closeBookingDetails = useCallback(() => {
    setIsBookingDetailsOpen(false);
  }, []);

  useEffect(() => {
    const now = new Date();
    setViewDate(startOfDay(now));
    setSelectedDate(formatDateKey(now));
  }, []);

  const openBookingDetails = useCallback(async (bookingId: string) => {
    try {
      setIsBookingDetailsOpen(true);
      setBookingDetailsLoading(true);
      setBookingDetails(null);
      const response = await api.getBooking(bookingId);
      const booking = response.data?.data?.booking as BookingDetail | undefined;
      if (!booking) {
        toast.error('Booking not found');
        setIsBookingDetailsOpen(false);
        return;
      }
      setBookingDetails(booking);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load booking details');
      setIsBookingDetailsOpen(false);
    } finally {
      setBookingDetailsLoading(false);
    }
  }, []);

  const openEnquiryDetails = useCallback((enquiryId: string) => {
    if (!enquiryId) return;
    window.location.href = `/dashboard/enquiries?section=edit&id=${enquiryId}`;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setPrintBookings([]);
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

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

      const [bookingRows, enquiryRows, googleRows] = await Promise.all([
        fetchBookings(start, end),
        fetchEnquiries(start, end),
        fetchGoogleCalendarEvents(start, end),
      ]);
      setBookings(bookingRows);
      setEnquiries(enquiryRows);
      setGoogleEvents(googleRows.events);
      setGoogleImportEnabled(googleRows.enabled);
      setGoogleImportConfigured(googleRows.configured);
      setGoogleSourceCount(googleRows.sourceCount);

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

  const handleJumpToDate = useCallback((dateKey: string) => {
    if (!dateKey) return;
    const parsedDate = parseDateKey(dateKey);
    if (Number.isNaN(parsedDate.getTime())) return;
    setSelectedDate(dateKey);
    setViewDate(startOfDay(parsedDate));
  }, []);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    const loadHalls = async () => {
      try {
        const rows = await fetchHalls();
        setHalls(rows);
      } catch (error) {
        setHalls([]);
      }
    };

    void loadHalls();
  }, []);

  const searchQuery = search.trim().toLowerCase();

  const filteredBookings = useMemo(() => {
    if (sourceFilter === 'google') return [];
    return bookings.filter((entry) => {
      // Search filter
      if (searchQuery) {
        const haystack = [
          entry.functionName,
          entry.functionType,
          entry.status,
          entry.customer?.name || '',
          entry.customer?.phone || '',
          getBookingHallNames(entry).join(' '),
        ].join(' ').toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
      // Hall filter
      if (selectedHallIds !== null) {
        const hallNames = getBookingHallNames(entry);
        const bookingHallIds = (entry.halls || [])
          .map((h) => h.hall?.id || h.hallId || '')
          .filter(Boolean);
        const hasSelectedHall =
          bookingHallIds.some((id) => selectedHallIds.has(id)) ||
          (bookingHallIds.length === 0 && selectedHallIds.size > 0); // unassigned always shows
        if (!hasSelectedHall && hallNames.length > 0) return false;
      }
      // Status filter
      const effectiveStatus = resolveBookingStatus(entry);
      if (!selectedStatuses.has(effectiveStatus)) return false;
      return true;
    });
  }, [bookings, searchQuery, sourceFilter, selectedHallIds, selectedStatuses]);

  const filteredEnquiries = useMemo(() => {
    if (sourceFilter === 'google') return [];
    return enquiries.filter((entry) => {
      if (searchQuery) {
        const haystack = [
          entry.functionName,
          entry.functionType,
          entry.status,
          entry.customer?.name || '',
          entry.customer?.phone || '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
      // Status filter — map enquiry statuses
      const effectiveStatus = resolveEnquiryStatus(entry);
      if (!selectedStatuses.has(effectiveStatus)) return false;
      return true;
    });
  }, [enquiries, searchQuery, sourceFilter, selectedStatuses]);

  const filteredGoogleEvents = useMemo(() => {
    if (sourceFilter === 'software') return [];
    if (!searchQuery) return googleEvents;
    return googleEvents.filter((entry) =>
      [
        entry.title,
        entry.venueName,
        entry.status,
        entry.location || '',
        entry.description || '',
        entry.origin,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [googleEvents, searchQuery, sourceFilter]);

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
      rows.sort((a, b) => {
        const dateDiff = new Date(a.functionDate).getTime() - new Date(b.functionDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = bookingSortMinutes(a) - bookingSortMinutes(b);
        if (timeDiff !== 0) return timeDiff;
        return a.functionName.localeCompare(b.functionName);
      })
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

  const googleEventsByDate = useMemo(() => {
    const map = new Map<string, GoogleCalendarEventRow[]>();
    filteredGoogleEvents.forEach((entry) => {
      const key = eventDateKey(entry.start);
      if (!key) return;
      const bucket = map.get(key) || [];
      bucket.push(entry);
      map.set(key, bucket);
    });

    map.forEach((rows) =>
      rows.sort((a, b) => {
        const dateDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = googleEventSortMinutes(a) - googleEventSortMinutes(b);
        if (timeDiff !== 0) return timeDiff;
        return a.title.localeCompare(b.title);
      })
    );

    return map;
  }, [filteredGoogleEvents]);

  const selectedBookings = bookingsByDate.get(selectedDate) || [];
  const selectedEnquiries = enquiriesByDate.get(selectedDate) || [];
  const selectedGoogleEvents = googleEventsByDate.get(selectedDate) || [];
  const selectedDayConflicts = useMemo(
    () => findDayHallConflicts(selectedBookings),
    [selectedBookings]
  );
  const selectedDayRevenue = selectedBookings.reduce(
    (sum, booking) => sum + toSafeNumber(booking.grandTotal),
    0
  );
  const selectedDayGuests = selectedBookings.reduce(
    (sum, booking) => sum + toSafeNumber(booking.expectedGuests),
    0
  );
  const noSelectedEvents =
    selectedBookings.length === 0 &&
    selectedEnquiries.length === 0 &&
    selectedGoogleEvents.length === 0;
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
  const hallBoardRangeLabel = viewMode === 'day' ? selectedDateLabel : viewLabel;
  const hallBoardDateKey = selectedDate;
  const hallBoardSegments = [
    { key: 'morning', label: 'Morning', range: '6am–12pm', start: 360, end: 720 },
    { key: 'afternoon', label: 'Afternoon', range: '12pm–4pm', start: 720, end: 960 },
    { key: 'evening', label: 'Evening', range: '4pm–12am', start: 960, end: 1440 },
  ] as const;
  const todayKey = formatDateKey(new Date());
  const calendarDays = useMemo(
    () => buildCalendarDays(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)),
    [viewDate]
  );
  const mobileWeekDays = useMemo(
    () => buildWeekDays(parseDateKey(selectedDate)),
    [selectedDate]
  );
  const mobileTimelineEntries = useMemo<MobileTimelineEntry[]>(() => {
    const timelineStart = 8 * 60;
    const timelineEnd = 20 * 60;
    const timelineSpan = timelineEnd - timelineStart;
    const timelineHeight = 560;

    const bookingsTimeline = selectedBookings
      .filter((booking) => resolveBookingStatus(booking) !== 'cancelled')
      .map((booking) => {
        const { startMinutes, endMinutes } = resolveBookingTimeRange(booking);
        const palette = getLocationPalette(getPrimaryHallName(booking));
        const clampedStart = clamp(startMinutes, timelineStart, timelineEnd - 30);
        const clampedEnd = clamp(endMinutes, clampedStart + 30, timelineEnd);
        return {
          id: `booking-${booking.id}`,
          kind: 'booking' as const,
          title: booking.functionName,
          subtitle: `${getPrimaryHallName(booking)} • ${toSafeNumber(booking.expectedGuests)} guests`,
          timeLabel: bookingTimeLabel(booking),
          top: ((clampedStart - timelineStart) / timelineSpan) * timelineHeight,
          height: Math.max(((clampedEnd - clampedStart) / timelineSpan) * timelineHeight, 72),
          borderColor: palette.border,
          background: palette.soft,
          textColor: palette.text,
          source: 'software' as const,
          bookingId: booking.id,
        };
      });

    const enquiriesTimeline = selectedEnquiries.map((enquiry) => {
      const start = parseClockToMinutes(enquiry.functionTime || '');
      const clampedStart = clamp(Number.isFinite(start) ? start : 12 * 60, timelineStart, timelineEnd - 30);
      const end = clamp(clampedStart + 60, clampedStart + 30, timelineEnd);
      return {
        id: `enquiry-${enquiry.id}`,
        kind: 'enquiry' as const,
        title: enquiry.functionName,
        subtitle: `${enquiry.customer?.name || 'Lead'} • ${toSafeNumber(enquiry.expectedGuests)} guests`,
        timeLabel: enquiry.functionTime || '--:--',
        top: ((clampedStart - timelineStart) / timelineSpan) * timelineHeight,
        height: Math.max(((end - clampedStart) / timelineSpan) * timelineHeight, 64),
        borderColor: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.12)',
        textColor: '#92400e',
        source: 'software' as const,
        enquiryId: enquiry.id,
      };
    });

    const googleTimeline = selectedGoogleEvents.map((event) => {
      const { startMinutes, endMinutes } = googleEventRangeMinutes(event);
      const clampedStart = clamp(startMinutes, timelineStart, timelineEnd - 30);
      const clampedEnd = clamp(endMinutes, clampedStart + 30, timelineEnd);
      return {
        id: `google-${event.id}`,
        kind: 'google' as const,
        title: event.title,
        subtitle: event.venueName,
        timeLabel: googleEventTimeLabel(event),
        top: ((clampedStart - timelineStart) / timelineSpan) * timelineHeight,
        height: Math.max(((clampedEnd - clampedStart) / timelineSpan) * timelineHeight, 64),
        borderColor: '#38bdf8',
        background: 'rgba(56, 189, 248, 0.12)',
        textColor: '#075985',
        source: (event.origin === 'software' ? 'software' : 'google') as 'software' | 'google',
      };
    });

    return [...bookingsTimeline, ...enquiriesTimeline, ...googleTimeline].sort((a, b) => a.top - b.top);
  }, [selectedBookings, selectedEnquiries, selectedGoogleEvents]);
  const mobileTimelineSlots = [
    { label: '08 AM', minutes: 8 * 60 },
    { label: '10 AM', minutes: 10 * 60 },
    { label: '12 PM', minutes: 12 * 60 },
    { label: '02 PM', minutes: 14 * 60 },
    { label: '04 PM', minutes: 16 * 60 },
    { label: '06 PM', minutes: 18 * 60 },
    { label: '08 PM', minutes: 20 * 60 },
  ];
  const mobileCurrentTimeTop = useMemo(() => {
    if (selectedDate !== todayKey) return null;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < 8 * 60 || minutes > 20 * 60) return null;
    return ((minutes - 8 * 60) / (12 * 60)) * 560;
  }, [selectedDate, todayKey]);
  const weekSlotMatrix = useMemo(() => {
    const base = weekDays.map((day) => {
      const dayKey = formatDateKey(day);
      const buckets: Record<
        ServiceSlot,
        Array<
          | { type: 'booking'; row: BookingCalendarRow }
          | { type: 'enquiry'; row: EnquiryCalendarRow }
          | { type: 'google'; row: GoogleCalendarEventRow }
        >
      > = {
        breakfast: [],
        lunch: [],
        hiTea: [],
        dinner: [],
      };

      (bookingsByDate.get(dayKey) || []).forEach((row) => {
        buckets[resolveServiceSlot(bookingSortMinutes(row))].push({ type: 'booking', row });
      });
      (enquiriesByDate.get(dayKey) || []).forEach((row) => {
        buckets[resolveServiceSlot(parseClockToMinutes(row.functionTime || ''))].push({
          type: 'enquiry',
          row,
        });
      });
      (googleEventsByDate.get(dayKey) || []).forEach((row) => {
        buckets[resolveServiceSlot(googleEventSortMinutes(row))].push({ type: 'google', row });
      });

      return { day, dayKey, buckets };
    });

    return base;
  }, [weekDays, bookingsByDate, enquiriesByDate, googleEventsByDate]);

  const weekHallGroups = useMemo(() => {
    const visibleHallIds = selectedHallIds ?? new Set(halls.map((hall) => hall.id));
    const hallRows = halls
      .filter((hall) => visibleHallIds.has(hall.id))
      .map((hall) => ({
        hallId: hall.id,
        hallName: hall.name,
        banquetName: hall.banquetName?.trim() || 'Unassigned',
        days: weekDays.map((day) => ({
          dayKey: formatDateKey(day),
          entries: [] as BookingCalendarRow[],
          conflicts: 0,
        })),
      }));

    const rowMap = new Map(hallRows.map((row) => [row.hallId, row]));

    filteredBookings
      .filter((booking) => resolveBookingStatus(booking) !== 'cancelled')
      .forEach((booking) => {
        const dayKey = dateToKey(booking.functionDate);
        if (!dayKey) return;

        const hallIds = (booking.halls || [])
          .map((hallRow) => hallRow.hall?.id || hallRow.hallId || '')
          .filter(Boolean);

        hallIds.forEach((hallId) => {
          const row = rowMap.get(hallId);
          if (!row) return;
          const cell = row.days.find((day) => day.dayKey === dayKey);
          if (!cell) return;
          cell.entries.push(booking);
        });
      });

    hallRows.forEach((row) => {
      row.days.forEach((day) => {
        day.entries.sort((a, b) => bookingSortMinutes(a) - bookingSortMinutes(b));
        day.conflicts = findDayHallConflicts(day.entries).filter(
          (conflict) => conflict.hallName === row.hallName
        ).length;
      });
    });

    const grouped = new Map<string, typeof hallRows>();
    hallRows.forEach((row) => {
      const bucket = grouped.get(row.banquetName) || [];
      bucket.push(row);
      grouped.set(row.banquetName, bucket);
    });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => {
        if (left === 'Unassigned') return 1;
        if (right === 'Unassigned') return -1;
        return left.localeCompare(right);
      })
      .map(([banquetName, rows]) => ({
        banquetName,
        rows: rows.sort((a, b) => a.hallName.localeCompare(b.hallName)),
      }));
  }, [filteredBookings, halls, selectedHallIds, weekDays]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;
    if (viewMode === 'month' && displayMode !== 'calendar') return;
    dayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedDate, viewMode, displayMode]);

  // ── Per-hall stats for sidebar ───────────────────────────────────────────
  const hallStats = useMemo(() => {
    const activeBookings = bookings.filter((b) => resolveBookingStatus(b) !== 'cancelled');
    const maxBookings = halls.reduce((max, hall) => {
      const count = activeBookings.filter((b) =>
        (b.halls || []).some((h) => h.hall?.id === hall.id)
      ).length;
      return Math.max(max, count);
    }, 1);
    return halls.map((hall) => {
      const count = activeBookings.filter((b) =>
        (b.halls || []).some((h) => h.hall?.id === hall.id)
      ).length;
      const palette = getLocationPalette(hall.name);
      return { ...hall, count, palette, pct: Math.round((count / maxBookings) * 100) };
    });
  }, [halls, bookings]);

  // Group hall stats by banquet/location
  const hallStatsByLocation = useMemo(() => {
    const groups = new Map<string, typeof hallStats>();
    hallStats.forEach((hall) => {
      const location = hall.banquetName?.trim() || 'Unassigned';
      const bucket = groups.get(location) || [];
      bucket.push(hall);
      groups.set(location, bucket);
    });
    // Sort: named locations first, Unassigned last
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
  }, [hallStats]);
  // ── End per-hall stats ────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const activeBookings = filteredBookings.filter((entry) => resolveBookingStatus(entry) !== 'cancelled');
    const cancelledBookings = filteredBookings.filter((entry) => resolveBookingStatus(entry) === 'cancelled')
      .length;
    const confirmedBookings = activeBookings.filter((entry) => !entry.isQuotation).length;
    const monthlyRevenue = activeBookings.reduce(
      (sum, entry) => sum + toSafeNumber(entry.grandTotal),
      0
    );
    const guestVolume = activeBookings.reduce(
      (sum, entry) => sum + toSafeNumber(entry.expectedGuests),
      0
    );

    // Hall utilization: unique booked hall-days / total hall-days available this month
    const totalHalls = halls.length || 1;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const totalHallDays = totalHalls * daysInMonth;
    const bookedHallDays = new Set(
      activeBookings.flatMap((entry) =>
        getBookingHallNames(entry).map((h) => `${dateToKey(entry.functionDate)}::${h}`)
      )
    ).size;
    const hallUtilization = totalHallDays > 0
      ? Math.min(100, Math.round((bookedHallDays / totalHallDays) * 100))
      : 0;

    // Peak day: the date with the most active bookings
    const countByDay = new Map<string, number>();
    activeBookings.forEach((entry) => {
      const key = dateToKey(entry.functionDate);
      countByDay.set(key, (countByDay.get(key) || 0) + 1);
    });
    let peakDayKey = '';
    let peakDayCount = 0;
    countByDay.forEach((count, key) => {
      if (count > peakDayCount) { peakDayCount = count; peakDayKey = key; }
    });
    const peakDayLabel = peakDayKey
      ? parseDateKey(peakDayKey).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '--';

    return {
      bookings: activeBookings.length,
      cancelledBookings,
      enquiries: filteredEnquiries.length,
      googleEvents: filteredGoogleEvents.length,
      confirmedBookings,
      monthlyRevenue,
      guestVolume,
      hallUtilization,
      peakDayLabel,
      peakDayCount,
    };
  }, [filteredBookings, filteredEnquiries, filteredGoogleEvents, halls, viewDate]);

  const agenda = useMemo<AgendaEntry[]>(() => {
    const bookingItems: AgendaEntry[] = filteredBookings.map((entry) => ({
      id: `booking-${entry.id}`,
      kind: 'booking',
      date: entry.functionDate,
      title: entry.functionName,
      subtitle: `${entry.customer?.name || 'Customer'} • ${entry.expectedGuests} guests`,
      status: entry.isPencilBooking ? 'pencil' : entry.isQuotation ? 'quotation' : entry.status,
      amount: toSafeNumber(entry.grandTotal),
      source: 'software',
    }));

    const enquiryItems: AgendaEntry[] = filteredEnquiries.map((entry) => ({
      id: `enquiry-${entry.id}`,
      kind: 'enquiry',
      date: entry.functionDate,
      title: entry.functionName,
      subtitle: `${entry.customer?.name || 'Lead'} • ${entry.expectedGuests} guests`,
      status: entry.isPencilBooked ? 'pencil' : entry.status,
      source: 'software',
    }));

    const googleItems: AgendaEntry[] = filteredGoogleEvents.map((entry) => ({
      id: `google-${entry.id}`,
      kind: 'google',
      date: entry.start,
      title: entry.title,
      subtitle: `${entry.venueName}${entry.location ? ` • ${entry.location}` : ''}`,
      status: entry.status,
      source: entry.origin === 'software' ? 'software' : 'google',
    }));

    return [...bookingItems, ...enquiryItems, ...googleItems]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 12);
  }, [filteredBookings, filteredEnquiries, filteredGoogleEvents]);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayEvents = useMemo<DayEvent[]>(() => {
    const bookingItems: DayEvent[] = selectedBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      kind: 'booking' as const,
      title: booking.functionName,
      time: bookingTimeLabel(booking),
      subtitle: `${booking.customer?.name || 'Customer'} • ${booking.expectedGuests} guests • ${getBookingHallNames(booking).join(', ') || 'Unassigned Hall'}`,
      status: booking.isPencilBooking ? 'pencil' : booking.isQuotation ? 'quotation' : booking.status,
      amount: toSafeNumber(booking.grandTotal),
      sortMinutes: bookingSortMinutes(booking),
      bookingId: booking.id,
      source: 'software',
    }));

    const enquiryItems: DayEvent[] = selectedEnquiries.map((enquiry) => ({
      id: `enquiry-${enquiry.id}`,
      kind: 'enquiry' as const,
      title: enquiry.functionName,
      time: enquiry.functionTime || '--:--',
      subtitle: `${enquiry.customer?.name || 'Lead'} • ${enquiry.expectedGuests} guests`,
      status: enquiry.isPencilBooked ? 'pencil' : enquiry.status,
      amount: undefined,
      sortMinutes: parseClockToMinutes(enquiry.functionTime || ''),
      source: 'software',
    }));

    const googleItems: DayEvent[] = selectedGoogleEvents.map((event) => ({
      id: `google-${event.id}`,
      kind: 'google' as const,
      title: event.title,
      time: googleEventTimeLabel(event),
      subtitle: `${event.venueName}${event.location ? ` • ${event.location}` : ''}`,
      status: event.status,
      amount: undefined,
      sortMinutes: googleEventSortMinutes(event),
      source: event.origin === 'software' ? 'software' : 'google',
    }));

    return [...bookingItems, ...enquiryItems, ...googleItems].sort((a, b) => {
      if (a.sortMinutes !== b.sortMinutes) return a.sortMinutes - b.sortMinutes;
      return a.title.localeCompare(b.title);
    });
  }, [selectedBookings, selectedEnquiries, selectedGoogleEvents]);

  const hallWiseSchedule = useMemo<HallScheduleGroup[]>(() => {
    const grouped = new Map<string, HallScheduleParty[]>();

    selectedBookings.forEach((booking) => {
      const hallNames = getBookingHallNames(booking);
      const effectiveHallNames = hallNames.length > 0 ? hallNames : ['Unassigned Hall'];

      effectiveHallNames.forEach((hallName) => {
        const bucket = grouped.get(hallName) || [];
        const { startMinutes, endMinutes } = resolveBookingTimeRange(booking);
        bucket.push({
          id: booking.id,
          title: booking.functionName,
          date: booking.functionDate,
          timeLabel: bookingTimeLabel(booking),
          status: resolveBookingStatus(booking),
          customerName: booking.customer?.name || 'Customer',
          customerPhone: booking.customer?.phone || '--',
          guests: toSafeNumber(booking.expectedGuests),
          sortMinutes: bookingSortMinutes(booking),
          startMinutes,
          endMinutes,
        });
        grouped.set(hallName, bucket);
      });
    });

    return Array.from(grouped.entries())
      .map(([hallName, parties]) => ({
        hallName,
        parties: [...parties].sort((a, b) => {
          if (a.sortMinutes !== b.sortMinutes) return a.sortMinutes - b.sortMinutes;
          return a.title.localeCompare(b.title);
        }),
      }))
      .sort((a, b) => a.hallName.localeCompare(b.hallName));
  }, [selectedBookings]);

  const handlePrintDay = useCallback(async () => {
    if (selectedBookings.length === 0) {
      toast.error('No bookings available for this day.');
      return;
    }
    try {
      setPrintingDay(true);
      const detailRows = await Promise.all(
        selectedBookings.map((booking) =>
          api.getBooking(booking.id).then((res) => res.data?.data?.booking as BookingDetail)
        )
      );
      setPrintBookings(detailRows.filter(Boolean));
      setTimeout(() => window.print(), 250);
    } catch (error) {
      toast.error('Failed to prepare print view.');
    } finally {
      setPrintingDay(false);
    }
  }, [selectedBookings]);

  const hallMetaById = useMemo(() => {
    const map = new Map<string, HallCalendarOption>();
    halls.forEach((hall) => map.set(hall.id, hall));
    return map;
  }, [halls]);

  const hallMetaByName = useMemo(() => {
    const map = new Map<string, HallCalendarOption>();
    halls.forEach((hall) => map.set(hall.name.toLowerCase(), hall));
    return map;
  }, [halls]);

  const hallBoardRows = useMemo<HallBoardRow[]>(() => {
    const blockedBookings = filteredBookings.filter((entry) => resolveBookingStatus(entry) !== 'cancelled');
    const map = new Map<string, HallBoardRow>();

    halls.forEach((hall) => {
      map.set(`hall:${hall.id}`, {
        hallId: hall.id,
        hallName: hall.name,
        banquetName: hall.banquetName || '',
        slots: [],
      });
    });

    blockedBookings.forEach((entry) => {
      const bookingDate = new Date(entry.functionDate).getTime();
      const bookingMinutes = bookingSortMinutes(entry);
      const timeLabel = bookingTimeLabel(entry);
      const { startMinutes, endMinutes } = resolveBookingTimeRange(entry);
      const hallRows = entry.halls || [];
      const effectiveHallRows =
        hallRows.length > 0
          ? hallRows
          : [
            {
              hallId: '',
              hall: {
                id: '',
                name: 'Unassigned Hall',
              },
            },
          ];

      effectiveHallRows.forEach((hallRow) => {
        const hallId = hallRow.hall?.id || hallRow.hallId || '';
        const hallName = (hallRow.hall?.name || 'Unassigned Hall').trim() || 'Unassigned Hall';
        const fromId = hallId ? hallMetaById.get(hallId) : undefined;
        const fromName = hallMetaByName.get(hallName.toLowerCase());
        const meta = fromId || fromName;
        const resolvedHallId = meta?.id || hallId || '';
        const key = resolvedHallId ? `hall:${resolvedHallId}` : `other:${hallName.toLowerCase()}`;
        const row = map.get(key) || {
          hallId: resolvedHallId || undefined,
          hallName: meta?.name || hallName,
          banquetName: meta?.banquetName || '',
          slots: [],
        };

        row.slots.push({
          bookingId: entry.id,
          date: entry.functionDate,
          timeLabel,
          functionName: entry.functionName,
          customerName: entry.customer?.name || 'Customer',
          status: resolveBookingStatus(entry),
          sortKey:
            bookingDate + (Number.isFinite(bookingMinutes) ? bookingMinutes * 60 * 1000 : 0),
          startMinutes,
          endMinutes,
          guests: toSafeNumber(entry.expectedGuests),
          source: 'software',
        });

        map.set(key, row);
      });
    });

    filteredGoogleEvents.forEach((entry) => {
      if ((entry.status || '').toLowerCase() === 'cancelled') {
        return;
      }

      const rowKey = `venue:${entry.venueName.toLowerCase()}`;
      const row = map.get(rowKey) || {
        hallName: entry.venueName,
        banquetName: 'Google Calendar Venue',
        rowType: 'googleVenue' as const,
        slots: [],
      };

      const startMs = new Date(entry.start).getTime();
      const sortMinutes = googleEventSortMinutes(entry);
      const { startMinutes, endMinutes } = googleEventRangeMinutes(entry);

      row.slots.push({
        date: eventDateKey(entry.start),
        timeLabel: googleEventTimeLabel(entry),
        functionName: entry.title,
        location: entry.location,
        status: entry.status,
        sortKey: startMs + (Number.isFinite(sortMinutes) ? sortMinutes * 60 * 1000 : 0),
        startMinutes,
        endMinutes,
        source: 'google',
        htmlLink: entry.htmlLink,
      });

      map.set(rowKey, row);
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        slots: [...row.slots].sort((a, b) => a.sortKey - b.sortKey),
      }))
      .sort((a, b) => a.hallName.localeCompare(b.hallName));
  }, [filteredBookings, filteredGoogleEvents, hallMetaById, hallMetaByName, halls]);

  const bookingDetailsHallBanquetLines = useMemo(() => {
    const hallRows = bookingDetails?.halls || [];
    const lines = hallRows
      .map((row) => {
        const hallId = row.hall?.id || '';
        const hallName = row.hall?.name?.trim() || '';
        if (!hallName) return '';
        const hallMeta = hallId ? hallMetaById.get(hallId) : hallMetaByName.get(hallName.toLowerCase());
        const banquetName = hallMeta?.banquetName?.trim() || '';
        return banquetName ? `${hallName} (${banquetName})` : hallName;
      })
      .filter(Boolean);

    if (lines.length === 0) return ['Unassigned Hall'];
    return Array.from(new Set(lines));
  }, [bookingDetails, hallMetaById, hallMetaByName]);

  const bookingDetailsPacks = useMemo(() => bookingDetails?.packs || [], [bookingDetails]);
  const bookingDetailsPayments = useMemo(
    () => bookingDetails?.payments || [],
    [bookingDetails]
  );
  const bookingDetailsAdditionalItems = useMemo(
    () =>
      (bookingDetails?.additionalItems || [])
        .map((row) => row.description?.trim() || '')
        .filter(Boolean),
    [bookingDetails]
  );

  const STATUS_FILTERS = [
    { key: 'confirmed', label: 'Confirmed', color: '#10b981', icon: '✓' },
    { key: 'pending', label: 'Pending', color: '#f59e0b', icon: '•' },
    { key: 'quotation', label: 'Quotation', color: '#6366f1', icon: '◎' },
    { key: 'enquiry', label: 'Enquiry', color: '#f59e0b', icon: '?' },
    { key: 'pencil', label: 'Pencil', color: '#6b7280', icon: '✏' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444', icon: '×' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Calendar</h1>
        <p className="text-[var(--text-2)] mt-1">
          Track bookings, enquiries, hall occupancy, conflicts, and venue events in one operations view.
        </p>
      </div>

      {/* ── Sidebar + Main layout ── */}
      <div className="flex gap-0 items-start">

        {/* ── Collapsible Sidebar ── */}
        <aside
          className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-64' : 'w-12'
            }`}
        >
          <div
            className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col h-full ${sidebarOpen ? 'p-4' : 'p-2'
              }`}
          >
            {/* Toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="mb-3 flex items-center justify-center w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)] text-[var(--text-4)] hover:text-[var(--text-1)] transition self-end shrink-0"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>

            {sidebarOpen ? (
              <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar flex-1">

                {/* Halls section — grouped by location */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Halls</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedHallIds(new Set(halls.map((h) => h.id)))}
                        className="text-[9px] font-semibold text-indigo-600 hover:underline"
                      >All</button>
                      <span className="text-gray-300 text-[9px]">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedHallIds(new Set())}
                        className="text-[9px] font-semibold text-[var(--text-4)] hover:underline"
                      >None</button>
                    </div>
                  </div>

                  {hallStatsByLocation.length === 0 && (
                    <p className="text-[11px] text-[var(--text-4)] italic">No halls configured</p>
                  )}

                  <div className="space-y-4">
                    {hallStatsByLocation.map(([locationName, locationHalls]) => {
                      const locationHallIds = locationHalls.map((h) => h.id);
                      const allChecked = locationHallIds.every(
                        (id) => selectedHallIds === null || selectedHallIds.has(id)
                      );
                      const someChecked = locationHallIds.some(
                        (id) => selectedHallIds === null || selectedHallIds.has(id)
                      );
                      const toggleLocation = () => {
                        setSelectedHallIds((prev) => {
                          const base = prev ?? new Set(halls.map((h) => h.id));
                          const next = new Set(base);
                          if (allChecked) {
                            locationHallIds.forEach((id) => next.delete(id));
                          } else {
                            locationHallIds.forEach((id) => next.add(id));
                          }
                          return next;
                        });
                      };

                      return (
                        <div key={locationName}>
                          {/* Location group header */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <button
                              type="button"
                              onClick={toggleLocation}
                              title={allChecked ? `Deselect all halls in ${locationName}` : `Select all halls in ${locationName}`}
                              className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${allChecked
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : someChecked
                                    ? 'bg-indigo-200 border-indigo-400'
                                    : 'bg-[var(--surface)] border-[var(--border-2)]'
                                }`}
                              style={{ fontSize: 8 }}
                            >
                              {(allChecked || someChecked) && (
                                <span style={{ lineHeight: 1 }}>{allChecked ? '✓' : '−'}</span>
                              )}
                            </button>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] truncate flex-1">
                              {locationName}
                            </span>
                            <span className="text-[9px] text-[var(--text-4)] tabular-nums shrink-0">
                              {locationHalls.reduce((s, h) => s + h.count, 0)}
                            </span>
                          </div>

                          {/* Halls in this location */}
                          <div className="space-y-2.5 pl-1">
                            {locationHalls.map((hall) => {
                              const checked = selectedHallIds === null || selectedHallIds.has(hall.id);
                              return (
                                <label key={hall.id} className="flex flex-col gap-1 cursor-pointer group">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleHall(hall.id)}
                                      className="h-3.5 w-3.5 rounded border-[var(--border-2)] shrink-0"
                                      style={{ accentColor: hall.palette.solid }}
                                    />
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ background: hall.palette.solid }}
                                    />
                                    <span className={`text-xs font-medium truncate flex-1 transition-colors ${checked ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'
                                      }`}>
                                      {hall.name}
                                    </span>
                                    <span
                                      className="text-[10px] font-bold tabular-nums shrink-0"
                                      style={{ color: hall.count > 0 ? hall.palette.text : '#9ca3af' }}
                                    >
                                      {hall.count}
                                    </span>
                                  </div>
                                  {/* Mini utilization bar */}
                                  <div className="ml-[22px] h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${hall.pct}%`,
                                        background: hall.palette.solid,
                                        opacity: checked ? 1 : 0.3,
                                      }}
                                    />
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]" />

                {/* Status section */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] mb-3">Status</p>
                  <div className="space-y-2.5">
                    {STATUS_FILTERS.map(({ key, label, color, icon }) => {
                      const checked = selectedStatuses.has(key);
                      return (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStatus(key)}
                            className="h-3.5 w-3.5 rounded border-[var(--border-2)] shrink-0"
                            style={{ accentColor: color }}
                          />
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold shrink-0"
                            style={{
                              background: checked ? `${color}18` : '#f3f4f6',
                              color: checked ? color : '#9ca3af',
                            }}
                          >
                            {icon}
                          </span>
                          <span className={`text-xs font-medium transition-colors ${checked ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'
                            }`}>
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]" />

                {/* Active filters summary */}
                {selectedHallIds !== null && selectedHallIds.size < halls.length && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Filtered</p>
                    <p className="text-[11px] text-amber-800">
                      {selectedHallIds.size} of {halls.length} halls visible
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedHallIds(new Set(halls.map((h) => h.id)))}
                      className="mt-1.5 text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline"
                    >
                      Show all halls
                    </button>
                  </div>
                )}

              </div>
            ) : (
              /* Collapsed state — colored dots only */
              <div className="flex flex-col items-center gap-2 mt-1">
                {hallStats.map((hall) => {
                  const checked = selectedHallIds === null || selectedHallIds.has(hall.id);
                  return (
                    <button
                      key={hall.id}
                      type="button"
                      title={`${hall.name} (${hall.count})`}
                      onClick={() => toggleHall(hall.id)}
                      className="w-5 h-5 rounded-full border-2 transition-all"
                      style={{
                        background: checked ? hall.palette.solid : 'transparent',
                        borderColor: hall.palette.solid,
                        opacity: checked ? 1 : 0.45,
                      }}
                    />
                  );
                })}
                <div className="my-1 w-4 border-t border-[var(--border)]" />
                {STATUS_FILTERS.map(({ key, color, icon }) => {
                  const checked = selectedStatuses.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() => toggleStatus(key)}
                      className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-all"
                      style={{
                        background: checked ? `${color}20` : '#f3f4f6',
                        color: checked ? color : '#d1d5db',
                      }}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main calendar area ── */}
        <div className="flex-1 min-w-0 space-y-4 pl-0 lg:pl-4">

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
                  <p className="text-lg font-semibold text-[var(--text-1)]">{viewLabel}</p>
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
                  style={{ position: 'relative' }}
                >
                  <span>Today</span>
                  {selectedDate === todayKey && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: 'var(--teal-500)',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                </button>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span className="text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Go to</span>
                  <input
                    type="date"
                    className="input h-8 min-h-0 border-0 p-0 text-sm shadow-none focus:shadow-none"
                    value={selectedDate}
                    onChange={(event) => handleJumpToDate(event.target.value)}
                    aria-label="Jump to date"
                  />
                </div>
                <div className="inline-flex rounded-xl border border-[var(--border)] overflow-hidden">
                  {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setViewMode(mode);
                        setViewDate(startOfDay(parseDateKey(selectedDate)));
                      }}
                      className={`px-3 py-2 text-sm font-semibold capitalize transition ${viewMode === mode
                        ? 'bg-primary-600 text-white'
                        : 'bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-xl border border-[var(--border)] overflow-hidden">
                  {(
                    [
                      ['calendar', 'Calendar'],
                      ['hallBoard', 'Hall Timeline'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDisplayMode(mode)}
                      className={`px-3 py-2 text-sm font-semibold transition ${displayMode === mode
                        ? 'bg-slate-800 text-white'
                        : 'bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-xl border border-[var(--border)] overflow-hidden">
                  {(
                    [
                      ['all', 'All'],
                      ['software', 'Software'],
                      ['google', 'Google'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSourceFilter(mode)}
                      className={`px-3 py-2 text-sm font-semibold transition ${sourceFilter === mode
                        ? 'bg-primary-600 text-white'
                        : 'bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-4)]" />
                  <input
                    className="input pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search function, hall, customer, status..."
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
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                Software
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 px-2 py-0.5">
                Google
              </span>
              <span className="text-[var(--text-2)]">
                {googleImportEnabled
                  ? googleImportConfigured
                    ? `Google import active for ${googleSourceCount} venue calendars (read-only).`
                    : 'Google import enabled, but configuration is incomplete.'
                  : 'Google import is currently disabled.'}
              </span>
            </div>
          </div>

          {/* ── KPI Strip ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Bookings */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Bookings</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--text-1)]">{summary.bookings.toLocaleString('en-IN')}</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <CalendarCheck className="w-5 h-5 text-emerald-700" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${summary.bookings > 0 ? Math.min(100, (summary.confirmedBookings / summary.bookings) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                  {summary.confirmedBookings} confirmed
                </span>
              </div>
              {summary.cancelledBookings > 0 && (
                <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  {summary.cancelledBookings} cancelled
                </span>
              )}
            </div>

            {/* Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Revenue</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--text-1)]">
                    ₹{summary.monthlyRevenue >= 100000
                      ? `${(summary.monthlyRevenue / 100000).toFixed(1)}L`
                      : summary.monthlyRevenue.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <IndianRupee className="w-5 h-5 text-violet-700" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-violet-400" />
                <span className="text-[11px] text-[var(--text-4)]">
                  {summary.guestVolume.toLocaleString('en-IN')} total guests
                </span>
              </div>
            </div>

            {/* Hall Utilization */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Hall Utilization</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--text-1)]">{summary.hallUtilization}%</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Building2 className="w-5 h-5 text-amber-700" />
                </span>
              </div>
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-amber-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${summary.hallUtilization >= 80 ? 'bg-red-500'
                        : summary.hallUtilization >= 50 ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    style={{ width: `${summary.hallUtilization}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--text-4)]">
                  Peak: <span className="font-semibold text-[var(--text-2)]">{summary.peakDayLabel}</span>
                  {summary.peakDayCount > 0 && ` (${summary.peakDayCount} bookings)`}
                </p>
              </div>
            </div>

            {/* Enquiries */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Enquiries</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--text-1)]">{summary.enquiries.toLocaleString('en-IN')}</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                  <PhoneCall className="w-5 h-5 text-sky-700" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {googleImportEnabled && (
                  <>
                    <Globe2 className="w-3 h-3 text-sky-400" />
                    <span className="text-[11px] text-[var(--text-4)]">
                      {summary.googleEvents} Google events
                    </span>
                  </>
                )}
                {!googleImportEnabled && (
                  <span className="text-[11px] text-[var(--text-4)]">Google import off</span>
                )}
              </div>
            </div>
          </div>

          {displayMode === 'calendar' && (
            <>
              <div className="space-y-6">
                <div className="card">
                  {loading ? (
                    <div className="py-8">
                      <CalendarSkeleton />
                    </div>
                  ) : (
                    <>
                      {viewMode === 'month' && (
                        <>
                          <div className="hidden md:block overflow-x-auto">
                            <div className="min-w-[760px] space-y-3">
                              <div className="grid grid-cols-7 gap-2">
                                {weekdayLabels.map((label) => (
                                  <div
                                    key={label}
                                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-4)]"
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
                                  const dayGoogleEvents = googleEventsByDate.get(dayKey) || [];
                                  const activeDayBookings = dayBookings.filter(
                                    (booking) => resolveBookingStatus(booking) !== 'cancelled'
                                  );
                                  const confirmedCount = activeDayBookings.filter(
                                    (booking) => resolveBookingStatus(booking) === 'confirmed'
                                  ).length;
                                  const pendingCount = activeDayBookings.filter(
                                    (booking) => resolveBookingStatus(booking) === 'pending'
                                  ).length;
                                  const quotationCount = activeDayBookings.filter(
                                    (booking) => resolveBookingStatus(booking) === 'quotation'
                                  ).length;
                                  const conflictCount = findDayHallConflicts(dayBookings).length;
                                  const dayGuestCount = activeDayBookings.reduce(
                                    (sum, booking) => sum + toSafeNumber(booking.expectedGuests),
                                    0
                                  );
                                  const dayHallCount = new Set(
                                    activeDayBookings.flatMap((booking) => getBookingHallNames(booking))
                                  ).size;
                                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                                  const isToday = dayKey === todayKey;
                                  const isSelected = dayKey === selectedDate;
                                  const eventBars = [
                                    ...dayBookings.map((booking) => ({
                                      id: booking.id,
                                      label: booking.functionName,
                                      kind: 'booking' as const,
                                      status: resolveBookingStatus(booking),
                                      hall: getPrimaryHallName(booking),
                                      minutes: bookingSortMinutes(booking),
                                    })),
                                    ...dayEnquiries.map((enquiry) => ({
                                      id: enquiry.id,
                                      label: enquiry.functionName,
                                      kind: 'enquiry' as const,
                                      status: enquiry.status,
                                      hall: enquiry.customer?.name || 'Enquiry',
                                      minutes: parseClockToMinutes(enquiry.functionTime || ''),
                                    })),
                                    ...dayGoogleEvents.map((event) => ({
                                      id: event.id,
                                      label: event.title,
                                      kind: 'google' as const,
                                      status: event.status,
                                      hall: event.venueName,
                                      minutes: googleEventSortMinutes(event),
                                    })),
                                  ];
                                  const sortedEvents = [...eventBars].sort((a, b) => a.minutes - b.minutes);
                                  const visibleEvents = sortedEvents.slice(0, 3);
                                  const overflowCount = Math.max(eventBars.length - visibleEvents.length, 0);

                                  // Heatmap: tint cell based on active booking count
                                  const heatTint = isCurrentMonth && !isSelected
                                    ? activeDayBookings.length >= 4
                                      ? 'rgba(239,68,68,0.07)'   // red-ish: very busy
                                      : activeDayBookings.length === 3
                                        ? 'rgba(245,158,11,0.09)' // amber: busy
                                        : activeDayBookings.length === 2
                                          ? 'rgba(234,179,8,0.07)'  // yellow: moderate
                                          : activeDayBookings.length === 1
                                            ? 'rgba(16,185,129,0.07)' // green: light
                                            : undefined
                                    : undefined;

                                  return (
                                    <button
                                      key={dayKey}
                                      type="button"
                                      onClick={() => setSelectedDate(dayKey)}
                                      className={`rounded-[20px] border p-3 text-left min-h-[156px] transition relative overflow-hidden ${isSelected
                                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                                        : 'border-[var(--border)] hover:border-primary-200 hover:bg-primary-50'
                                        } ${isCurrentMonth ? '' : 'opacity-65'}`}
                                      style={{
                                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                                        backgroundColor: isSelected ? undefined : (heatTint ?? 'var(--surface)'),
                                      }}
                                    >
                                      <div className="flex items-start justify-between relative z-10">
                                        <span className={`text-sm font-bold ${isCurrentMonth ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'}`}>
                                          {day.getDate()}
                                        </span>
                                        {isToday && (
                                          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                                            Today
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-3 space-y-2 relative z-10">
                                        {visibleEvents.map((event) => {
                                          const isCancelled = event.kind === 'booking' && event.status === 'cancelled';
                                          const palette = getLocationPalette(event.hall);
                                          const bandStyle =
                                            event.kind === 'booking'
                                              ? {
                                                background: palette.soft,
                                                borderLeft: `4px solid ${palette.border}`,
                                                color: palette.text,
                                              }
                                              : event.kind === 'enquiry'
                                                ? {
                                                  background: 'rgba(245, 158, 11, 0.12)',
                                                  borderLeft: '4px solid #f59e0b',
                                                  color: '#92400e',
                                                }
                                                : {
                                                  background: 'rgba(56, 189, 248, 0.12)',
                                                  borderLeft: '4px solid #38bdf8',
                                                  color: '#0f172a',
                                                };
                                          return (
                                            <div
                                              key={`${event.kind}-${event.id}`}
                                              title={event.label}
                                              style={{
                                                padding: '6px 8px',
                                                borderRadius: 10,
                                                fontSize: 10,
                                                lineHeight: '13px',
                                                whiteSpace: 'normal',
                                                overflow: 'hidden',
                                                opacity: isCancelled ? 0.5 : 1,
                                                textDecoration: isCancelled ? 'line-through' : 'none',
                                                ...bandStyle,
                                              }}
                                            >
                                              <span style={{ display: 'block', fontSize: 9, opacity: 0.72, marginBottom: 2 }}>
                                                {compactLocationLabel(event.hall)}
                                              </span>
                                              <span style={{ display: 'block', fontWeight: 700 }}>
                                                {compactFunctionLabel(event.label, 20)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                        {overflowCount > 0 && (
                                          <span className="text-[10px] font-semibold text-[var(--text-4)]">
                                            +{overflowCount} more
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-[var(--text-4)] relative z-10">
                                        {dayGuestCount > 0 ? (
                                          <span>
                                            {dayGuestCount.toLocaleString('en-IN')} guests
                                            {dayHallCount > 0 ? ` • ${dayHallCount} halls` : ''}
                                          </span>
                                        ) : (
                                          <span>No bookings</span>
                                        )}
                                        {activeDayBookings.length > 0 && (
                                          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-semibold text-[var(--text-3)]">
                                            {activeDayBookings.length} booked
                                          </span>
                                        )}
                                      </div>
                                      {(confirmedCount > 0 || pendingCount > 0 || quotationCount > 0 || dayEnquiries.length > 0 || conflictCount > 0) && (
                                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold relative z-10">
                                          {confirmedCount > 0 && (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                              {confirmedCount} confirmed
                                            </span>
                                          )}
                                          {pendingCount > 0 && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                                              {pendingCount} pending
                                            </span>
                                          )}
                                          {quotationCount > 0 && (
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
                                              {quotationCount} quote
                                            </span>
                                          )}
                                          {dayEnquiries.length > 0 && (
                                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">
                                              {dayEnquiries.length} enquiry
                                            </span>
                                          )}
                                          {conflictCount > 0 && (
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                                              {conflictCount} conflict
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Heatmap legend */}
                          <div className="hidden md:flex items-center gap-3 mt-2 px-1">
                            <span className="text-[10px] font-semibold text-[var(--text-4)] uppercase tracking-wide">Density</span>
                            {[
                              { color: 'rgba(16,185,129,0.18)', label: '1 booking' },
                              { color: 'rgba(234,179,8,0.22)', label: '2 bookings' },
                              { color: 'rgba(245,158,11,0.28)', label: '3 bookings' },
                              { color: 'rgba(239,68,68,0.22)', label: '4+' },
                            ].map(({ color, label }) => (
                              <span key={label} className="flex items-center gap-1.5">
                                <span className="inline-block h-3 w-5 rounded" style={{ background: color, border: '1px solid rgba(0,0,0,0.07)' }} />
                                <span className="text-[10px] text-[var(--text-4)]">{label}</span>
                              </span>
                            ))}
                          </div>

                          <div className="md:hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-xs)]">
                            <div className="mb-3 grid grid-cols-7 text-center">
                              {weekdayLabels.map((label) => (
                                <div
                                  key={`mobile-${label}`}
                                  className="py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-4)]"
                                >
                                  {label}
                                </div>
                              ))}
                              {calendarDays.map((day) => {
                                const dayKey = formatDateKey(day);
                                const dayBookings = bookingsByDate.get(dayKey) || [];
                                const dayEnquiries = enquiriesByDate.get(dayKey) || [];
                                const dayGoogle = googleEventsByDate.get(dayKey) || [];
                                const isToday = dayKey === todayKey;
                                const isSelected = dayKey === selectedDate;
                                const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                                const dots = [
                                  dayBookings.length > 0 ? 'bg-[var(--teal-500)]' : '',
                                  dayEnquiries.length > 0 ? 'bg-amber-500' : '',
                                  dayGoogle.length > 0 ? 'bg-sky-500' : '',
                                ].filter(Boolean);

                                return (
                                  <button
                                    key={`mobile-grid-${dayKey}`}
                                    type="button"
                                    onClick={() => setSelectedDate(dayKey)}
                                    className="relative flex h-14 flex-col items-center justify-start pt-2"
                                  >
                                    {isSelected && !isToday && (
                                      <span className="absolute inset-0 m-1 rounded-lg bg-primary-50 ring-1 ring-primary-200" />
                                    )}
                                    {isToday ? (
                                      <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[var(--teal-500)] text-sm font-bold text-white">
                                        {day.getDate()}
                                      </span>
                                    ) : (
                                      <span
                                        className={`relative z-10 text-sm ${isSelected ? 'font-bold text-[var(--teal-700)]' : 'font-medium'} ${isCurrentMonth ? 'text-[var(--text-1)]' : 'text-[var(--text-4)]'}`}
                                      >
                                        {day.getDate()}
                                      </span>
                                    )}
                                    <div className="relative z-10 mt-1 flex gap-0.5">
                                      {dots.slice(0, 3).map((dotClass, index) => (
                                        <div key={`${dayKey}-dot-${index}`} className={`size-1 rounded-full ${dotClass}`} />
                                      ))}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
                              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                                <h2 className="font-bold text-[var(--teal-700)]">{selectedDateLabel}</h2>
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-4)]">
                                  {selectedBookings.length + selectedEnquiries.length + selectedGoogleEvents.length} events
                                </span>
                              </div>
                              <div className="space-y-px pb-1">
                                {dayEvents.length === 0 ? (
                                  <div className="px-4 py-6 text-sm text-[var(--text-4)]">No events scheduled.</div>
                                ) : (
                                  dayEvents.slice(0, 4).map((entry) => (
                                    <button
                                      key={`month-mobile-${entry.id}`}
                                      type="button"
                                      onClick={() => {
                                        if (entry.kind === 'booking' && entry.bookingId) {
                                          void openBookingDetails(entry.bookingId);
                                          return;
                                        }
                                        if (entry.kind === 'enquiry') {
                                          const enquiryId = entry.id.replace('enquiry-', '');
                                          openEnquiryDetails(enquiryId);
                                        }
                                      }}
                                      className="group flex w-full gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left last:border-b-0"
                                    >
                                      <div
                                        className={`w-1.5 self-stretch rounded-full ${entry.kind === 'booking'
                                          ? 'bg-[var(--teal-500)]'
                                          : entry.kind === 'enquiry'
                                            ? 'bg-amber-500'
                                            : 'bg-sky-500'
                                          }`}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                          <h3 className="text-base font-semibold text-[var(--text-1)]">{entry.title}</h3>
                                          <ChevronRight className="h-4 w-4 text-[var(--text-4)]" />
                                        </div>
                                        <div className="mt-1 flex flex-col gap-1 text-sm text-[var(--text-3)]">
                                          <span>{entry.time}</span>
                                          <span>{entry.subtitle}</span>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {viewMode === 'week' && (
                        <>
                          <div className="md:hidden space-y-4">
                            <div className="overflow-x-auto pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                              <div className="flex min-w-max border-b border-[var(--border)]">
                                {weekSlotMatrix.map(({ day, dayKey }) => {
                                  const isSelected = dayKey === selectedDate;
                                  return (
                                    <button
                                      key={`mobile-week-${dayKey}`}
                                      type="button"
                                      onClick={() => setSelectedDate(dayKey)}
                                      className={`flex min-w-[72px] flex-col items-center border-b-2 px-4 py-3 ${isSelected ? 'border-[var(--teal-500)] bg-[var(--teal-50)] text-[var(--teal-700)]' : 'border-transparent text-[var(--text-4)]'}`}
                                    >
                                      <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                                        {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                                      </span>
                                      <span className="text-lg font-bold">{day.getDate()}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                              <div className="flex px-4 py-4 gap-3 overflow-x-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                <div className="flex min-w-[120px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Bookings</p>
                                  <p className="text-2xl font-bold text-[var(--text-1)]">{selectedBookings.length}</p>
                                </div>
                                <div className="flex min-w-[120px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Revenue</p>
                                  <p className="text-2xl font-bold text-[var(--text-1)]">₹{selectedBookings.reduce((sum, booking) => sum + toSafeNumber(booking.grandTotal), 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="flex min-w-[120px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Utilization</p>
                                  <p className="text-2xl font-bold text-[var(--text-1)]">{hallWiseSchedule.length}</p>
                                </div>
                              </div>

                              <div className="flex">
                                <div className="w-16 flex-shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] py-2 text-[10px] font-bold uppercase text-[var(--text-4)]">
                                  {mobileTimelineSlots.map((slot, index) => (
                                    <div key={`mobile-week-slot-${slot.label}`} className={`h-20 flex items-start justify-center pt-1 ${index === 2 ? 'text-[var(--teal-700)]' : ''}`}>
                                      {slot.label}
                                    </div>
                                  ))}
                                </div>
                                <div className="relative h-[560px] flex-1 border-l border-[var(--border)] bg-[var(--surface)]">
                                  <div className="absolute inset-0">
                                    {mobileTimelineSlots.map((slot, index) => (
                                      <div
                                        key={`mobile-week-grid-${slot.label}`}
                                        className={`h-20 border-b border-[var(--border)] ${index === mobileTimelineSlots.length - 1 ? 'border-b-0' : ''}`}
                                      />
                                    ))}
                                  </div>
                                  {mobileCurrentTimeTop !== null && (
                                    <div
                                      className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                                      style={{ top: mobileCurrentTimeTop }}
                                    >
                                      <div className="ml-[-4px] size-2 rounded-full bg-red-500" />
                                      <div className="h-px flex-1 bg-red-500/50" />
                                    </div>
                                  )}
                                  <div className="relative h-full p-2">
                                    {mobileTimelineEntries.map((entry) => (
                                      <button
                                        key={`mobile-week-entry-${entry.id}`}
                                        type="button"
                                        onClick={() => {
                                          if (entry.bookingId) {
                                            void openBookingDetails(entry.bookingId);
                                            return;
                                          }
                                          if (entry.enquiryId) {
                                            openEnquiryDetails(entry.enquiryId);
                                          }
                                        }}
                                        className="absolute left-2 right-2 rounded-r-lg border-l-4 px-3 py-2 text-left shadow-sm"
                                        style={{
                                          top: entry.top,
                                          height: entry.height,
                                          borderLeftColor: entry.borderColor,
                                          background: entry.background,
                                        }}
                                      >
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: entry.textColor }}>
                                          {entry.timeLabel}
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-[var(--text-1)]">{entry.title}</div>
                                        <div className="mt-1 text-[10px] text-[var(--text-3)]">{entry.subtitle}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:block overflow-x-auto">
                            <div className="min-w-[1180px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                              <div className="grid grid-cols-[220px_repeat(7,minmax(0,1fr))] border-b border-[var(--border)] bg-[var(--surface-2)]">
                                <div className="flex items-center border-r border-[var(--border)] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-4)]">
                                  Banquet / Hall
                                </div>
                                {weekDays.map((day) => {
                                  const dayKey = formatDateKey(day);
                                  const isSelected = dayKey === selectedDate;
                                  const isToday = dayKey === todayKey;
                                  return (
                                    <button
                                      key={dayKey}
                                      type="button"
                                      onClick={() => setSelectedDate(dayKey)}
                                      className={`border-r border-[var(--border)] px-3 py-3 text-center last:border-r-0 ${isSelected ? 'bg-primary-50' : ''}`}
                                    >
                                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-4)]">
                                        {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                                      </div>
                                      <div className="mt-1 text-lg font-bold text-[var(--text-1)]">
                                        {day.toLocaleDateString('en-IN', { day: '2-digit' })}
                                      </div>
                                      <div className="text-[11px] text-[var(--text-4)]">
                                        {day.toLocaleDateString('en-IN', { month: 'short' })}
                                      </div>
                                      {isToday && (
                                        <span className="mt-2 inline-flex rounded-full bg-primary-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                                          Today
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {weekHallGroups.length === 0 ? (
                                <div className="p-6">
                                  <EmptyState
                                    icon={Building2}
                                    title="No halls available"
                                    description="No visible halls match the current filters for this week."
                                    variant="page"
                                  />
                                </div>
                              ) : (
                                weekHallGroups.map((group) => (
                                  <div key={group.banquetName} className="border-b border-[var(--border)] last:border-b-0">
                                    <div className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-4)]">
                                        {group.banquetName}
                                      </p>
                                    </div>

                                    {group.rows.map((row, rowIndex) => (
                                      <div
                                        key={row.hallId}
                                        className={`grid grid-cols-[220px_repeat(7,minmax(0,1fr))] ${rowIndex < group.rows.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                                      >
                                        <div className="border-r border-[var(--border)] px-4 py-4 bg-[var(--surface)]">
                                          <p className="text-sm font-semibold text-[var(--text-1)]">{row.hallName}</p>
                                          <p className="mt-1 text-[11px] text-[var(--text-4)]">
                                            {group.banquetName}
                                          </p>
                                        </div>

                                        {row.days.map((day) => {
                                          const isSelected = day.dayKey === selectedDate;
                                          return (
                                            <button
                                              key={`${row.hallId}-${day.dayKey}`}
                                              type="button"
                                              onClick={() => setSelectedDate(day.dayKey)}
                                              className={`min-h-[148px] border-r border-[var(--border)] px-2 py-2 text-left align-top last:border-r-0 ${isSelected ? 'bg-primary-50/70' : 'bg-[var(--surface)]'}`}
                                            >
                                              {day.entries.length === 0 ? (
                                                <div className="flex h-full min-h-[126px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[11px] font-medium text-[var(--text-4)]">
                                                  Available
                                                </div>
                                              ) : (
                                                <div className="space-y-2">
                                                  {day.conflicts > 0 && (
                                                    <div className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                      {day.conflicts} conflict{day.conflicts === 1 ? '' : 's'}
                                                    </div>
                                                  )}
                                                  {day.entries.slice(0, 2).map((booking) => {
                                                    const payment = getPaymentSnapshot(booking);
                                                    return (
                                                      <button
                                                        key={booking.id}
                                                        type="button"
                                                        onClick={(event) => {
                                                          event.stopPropagation();
                                                          void openBookingDetails(booking.id);
                                                        }}
                                                        className="w-full rounded-xl px-2.5 py-2 text-left"
                                                        style={{
                                                          background: getLocationPalette(row.hallName).soft,
                                                          borderLeft: `4px solid ${getLocationPalette(row.hallName).border}`,
                                                        }}
                                                      >
                                                        <div className="flex items-start justify-between gap-2">
                                                          <div className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: getLocationPalette(row.hallName).text }}>
                                                            {bookingTimeLabel(booking)}
                                                          </div>
                                                          <StatusBadge status={resolveBookingStatus(booking)} size="sm" />
                                                        </div>
                                                        <div className="mt-1 text-xs font-bold text-[var(--text-1)]">
                                                          {compactFunctionLabel(booking.functionName, 20)}
                                                        </div>
                                                        <div className="mt-1 text-[11px] text-[var(--text-3)]">
                                                          {booking.customer?.name || 'Customer'} • {toSafeNumber(booking.expectedGuests)} guests
                                                        </div>
                                                        {payment.total > 0 && (
                                                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]/70">
                                                            <div
                                                              className={`h-full rounded-full ${payment.tone === 'paid'
                                                                  ? 'bg-emerald-500'
                                                                  : payment.tone === 'partial'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-red-500'
                                                                }`}
                                                              style={{ width: `${payment.percent}%` }}
                                                            />
                                                          </div>
                                                        )}
                                                      </button>
                                                    );
                                                  })}
                                                  {day.entries.length > 2 && (
                                                    <div className="px-1 text-[10px] font-semibold text-[var(--text-4)]">
                                                      +{day.entries.length - 2} more
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {viewMode === 'day' && (
                        <div className="space-y-3">
                          <div className="md:hidden space-y-4">
                            <div className="flex gap-4 overflow-x-auto pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                              <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Bookings</p>
                                <p className="text-2xl font-bold text-[var(--text-1)]">{selectedBookings.length}</p>
                              </div>
                              <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Revenue</p>
                                <p className="text-2xl font-bold text-[var(--text-1)]">₹{selectedBookings.reduce((sum, booking) => sum + toSafeNumber(booking.grandTotal), 0).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">Events</p>
                                <p className="text-2xl font-bold text-[var(--text-1)]">{dayEvents.length}</p>
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
                              <div className="flex">
                                <div className="w-16 flex-shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] py-2 text-[10px] font-bold uppercase text-[var(--text-4)]">
                                  {mobileTimelineSlots.map((slot, index) => (
                                    <div key={`mobile-day-slot-${slot.label}`} className={`h-20 flex items-start justify-center pt-1 ${index === 2 ? 'text-[var(--teal-700)]' : ''}`}>
                                      {slot.label}
                                    </div>
                                  ))}
                                </div>
                                <div className="relative h-[560px] flex-1 border-l border-[var(--border)] bg-[var(--surface)]">
                                  <div className="absolute inset-0">
                                    {mobileTimelineSlots.map((slot, index) => (
                                      <div
                                        key={`mobile-day-grid-${slot.label}`}
                                        className={`h-20 border-b border-[var(--border)] ${index === mobileTimelineSlots.length - 1 ? 'border-b-0' : ''}`}
                                      />
                                    ))}
                                  </div>
                                  {mobileCurrentTimeTop !== null && (
                                    <div
                                      className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                                      style={{ top: mobileCurrentTimeTop }}
                                    >
                                      <div className="ml-[-4px] size-2 rounded-full bg-red-500" />
                                      <div className="h-px flex-1 bg-red-500/50" />
                                    </div>
                                  )}
                                  <div className="relative h-full p-2">
                                    {mobileTimelineEntries.length === 0 ? (
                                      <div className="flex h-full items-center justify-center text-sm text-[var(--text-4)]">
                                        No events scheduled.
                                      </div>
                                    ) : (
                                      mobileTimelineEntries.map((entry) => (
                                        <button
                                          key={`mobile-day-entry-${entry.id}`}
                                          type="button"
                                          onClick={() => {
                                            if (entry.bookingId) {
                                              void openBookingDetails(entry.bookingId);
                                              return;
                                            }
                                            if (entry.enquiryId) {
                                              openEnquiryDetails(entry.enquiryId);
                                            }
                                          }}
                                          className="absolute left-2 right-2 rounded-r-lg border-l-4 px-3 py-2 text-left shadow-sm"
                                          style={{
                                            top: entry.top,
                                            height: entry.height,
                                            borderLeftColor: entry.borderColor,
                                            background: entry.background,
                                          }}
                                        >
                                          <div className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: entry.textColor }}>
                                            {entry.timeLabel}
                                          </div>
                                          <div className="mt-1 text-xs font-bold text-[var(--text-1)]">{entry.title}</div>
                                          <div className="mt-1 text-[10px] text-[var(--text-3)]">{entry.subtitle}</div>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:block">
                            <p className="text-sm font-semibold text-[var(--text-1)]">{selectedDateLabel}</p>
                            {dayEvents.length === 0 ? (
                              <div className="empty-state" style={{ padding: '20px 12px' }}>
                                <div className="empty-state-icon">
                                  <CalendarDays size={20} />
                                </div>
                                <p className="empty-state-title">No events</p>
                                <p className="empty-state-desc">Nothing scheduled for this date.</p>
                              </div>
                            ) : (
                              dayEvents.map((entry) => (
                                <button
                                  key={entry.id}
                                  type="button"
                                  onClick={() => {
                                    if (entry.kind === 'booking' && entry.bookingId) {
                                      void openBookingDetails(entry.bookingId);
                                      return;
                                    }
                                    if (entry.kind === 'enquiry') {
                                      const enquiryId = entry.id.replace('enquiry-', '');
                                      openEnquiryDetails(enquiryId);
                                    }
                                  }}
                                  className={`rounded-xl border px-3 py-2 ${entry.kind === 'booking'
                                    ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                    : entry.kind === 'enquiry'
                                      ? 'border-amber-200 bg-amber-50'
                                      : 'border-sky-200 bg-sky-50'
                                    } ${entry.kind === 'booking' ? 'cursor-pointer transition text-left' : 'text-left'}`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[var(--text-1)]">{entry.title}</p>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${entry.source === 'google'
                                          ? 'bg-sky-100 text-sky-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                      >
                                        {entry.source === 'google' ? 'Google' : 'Software'}
                                      </span>
                                      <span className="text-xs text-[var(--text-2)]">{entry.time}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-[var(--text-2)] mt-1">{entry.subtitle}</p>
                                  <p className="text-xs text-[var(--text-2)] mt-1">
                                    <StatusBadge status={entry.status} size="sm" />
                                    {entry.kind === 'booking' && typeof entry.amount === 'number' && (
                                      <span> • ₹{entry.amount.toLocaleString('en-IN')}</span>
                                    )}
                                  </p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div
                  key={selectedDate}
                  ref={dayPanelRef}
                  className="card day-panel-enter"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Selected Day</p>
                      <h2 className="text-lg font-semibold text-[var(--text-1)] mt-1">{selectedDateLabel}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-semibold text-[var(--text-2)]">
                          {selectedBookings.length} bookings
                        </span>
                        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-semibold text-[var(--text-2)]">
                          {selectedDayGuests.toLocaleString('en-IN')} guests
                        </span>
                        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-semibold text-[var(--text-2)]">
                          ₹{selectedDayRevenue.toLocaleString('en-IN')}
                        </span>
                        {selectedDayConflicts.length > 0 && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">
                            {selectedDayConflicts.length} hall conflict{selectedDayConflicts.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintDay}
                      className="btn btn-secondary no-print"
                      disabled={printingDay || selectedBookings.length === 0}
                    >
                      {printingDay ? 'Preparing…' : 'Print / Export Day'}
                    </button>
                  </div>

                  {noSelectedEvents ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="No events scheduled"
                      description="This day is open across bookings, enquiries, and synced venue calendars."
                      variant="page"
                    />
                  ) : (
                    <div className="space-y-4">
                      {selectedDayConflicts.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                          <p className="font-semibold">Hall time conflicts need review</p>
                          <div className="mt-1 space-y-1 text-xs">
                            {selectedDayConflicts.slice(0, 3).map((conflict) => (
                              <p key={`${conflict.hallName}-${conflict.first.id}-${conflict.second.id}`}>
                                {conflict.hallName}: {conflict.first.timeLabel} {conflict.first.title} overlaps {conflict.second.timeLabel} {conflict.second.title}
                              </p>
                            ))}
                            {selectedDayConflicts.length > 3 && (
                              <p>+{selectedDayConflicts.length - 3} more conflicts</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-[var(--text-1)]">Bookings</p>
                          <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                            {selectedBookings.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedBookings.length === 0 ? (
                            <div className="empty-state" style={{ padding: '16px 12px' }}>
                              <div className="empty-state-icon">
                                <CalendarCheck size={18} />
                              </div>
                              <p className="empty-state-title">No bookings</p>
                              <p className="empty-state-desc">Nothing booked for this date.</p>
                            </div>
                          ) : (
                            selectedBookings.map((booking) => {
                              const payment = getPaymentSnapshot(booking);
                              return (
                                <button
                                  key={booking.id}
                                  type="button"
                                  onClick={() => void openBookingDetails(booking.id)}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:border-primary-300 hover:bg-primary-50 transition"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-[var(--text-1)] truncate">{booking.functionName}</p>
                                      {toSafeNumber(booking.versionNumber) > 1 && (
                                        <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                          v{booking.versionNumber}
                                        </span>
                                      )}
                                    </div>
                                    <StatusBadge status={resolveBookingStatus(booking)} size="sm" />
                                  </div>
                                  <p className="text-xs text-[var(--text-2)] mt-2">
                                    {booking.customer?.name || 'Customer'} • {booking.expectedGuests} guests •{' '}
                                    {getBookingHallNames(booking).join(', ') || 'Unassigned Hall'}
                                  </p>
                                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                                    {bookingTimeLabel(booking)} • ₹
                                    {toSafeNumber(booking.grandTotal).toLocaleString('en-IN')}
                                  </p>
                                  {payment.total > 0 && (
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-3)]">
                                        <span>{payment.label}</span>
                                        <span>₹{payment.paid.toLocaleString('en-IN')} of ₹{payment.total.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                                        <div
                                          className={`h-full rounded-full ${payment.tone === 'paid'
                                              ? 'bg-emerald-500'
                                              : payment.tone === 'partial'
                                                ? 'bg-amber-500'
                                                : 'bg-red-500'
                                            }`}
                                          style={{ width: `${payment.percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-[var(--text-1)]">Hall-wise Party Schedule</p>
                          <span className="text-xs rounded-full bg-sky-100 text-sky-800 px-2 py-0.5">
                            {hallWiseSchedule.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {hallWiseSchedule.length === 0 ? (
                            <div className="empty-state" style={{ padding: '16px 12px' }}>
                              <div className="empty-state-icon">
                                <Building2 size={18} />
                              </div>
                              <p className="empty-state-title">No hall bookings</p>
                              <p className="empty-state-desc">No halls are reserved for this date.</p>
                            </div>
                          ) : (
                            hallWiseSchedule.map((group) => {
                              const overlaps = findOverlaps(group.parties);
                              return (
                                <div
                                  key={group.hallName}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-[var(--text-1)] inline-flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5 text-sky-700" />
                                      {group.hallName}
                                    </p>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                      {group.parties.length} part
                                      {group.parties.length > 1 ? 'ies' : 'y'}
                                    </span>
                                  </div>
                                  {overlaps.length > 0 && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                                      <div className="font-semibold">Possible time overlap</div>
                                      {overlaps.slice(0, 2).map((pair) => (
                                        <div key={`${pair.first.id}-${pair.second.id}`}>
                                          {pair.first.timeLabel} {pair.first.title} vs {pair.second.timeLabel}{' '}
                                          {pair.second.title}
                                        </div>
                                      ))}
                                      {overlaps.length > 2 && (
                                        <div>+{overlaps.length - 2} more overlaps</div>
                                      )}
                                    </div>
                                  )}
                                  <div className="space-y-1.5">
                                    {group.parties.map((party) => (
                                      <button
                                        key={`${group.hallName}-${party.id}`}
                                        type="button"
                                        onClick={() => void openBookingDetails(party.id)}
                                        className="w-full rounded-md bg-[var(--surface-2)] px-2 py-1.5 text-left hover:bg-sky-50 transition"
                                      >
                                        <p className="text-xs font-semibold text-[var(--text-1)]">{party.title}</p>
                                        <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                                          {formatDateDDMMYYYY(party.date)} • {party.timeLabel}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                                          {party.customerName} • {party.customerPhone} • {party.guests} guests
                                        </p>
                                        <div className="mt-1">
                                          <StatusBadge status={party.status} size="sm" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-[var(--text-1)]">Enquiries</p>
                          <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                            {selectedEnquiries.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedEnquiries.length === 0 ? (
                            <div className="empty-state" style={{ padding: '16px 12px' }}>
                              <div className="empty-state-icon">
                                <PhoneCall size={18} />
                              </div>
                              <p className="empty-state-title">No enquiries</p>
                              <p className="empty-state-desc">No enquiries scheduled for this date.</p>
                            </div>
                          ) : (
                            selectedEnquiries.map((enquiry) => {
                              const phone = enquiry.customer?.phone?.trim() || '';
                              return (
                                <div key={enquiry.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEnquiryDetails(enquiry.id)}
                                      className="text-sm font-medium text-[var(--text-1)] truncate text-left hover:text-primary-700"
                                    >
                                      {enquiry.functionName}
                                    </button>
                                    <StatusBadge status={resolveEnquiryStatus(enquiry)} size="sm" />
                                  </div>
                                  <p className="text-xs text-[var(--text-2)] mt-1">
                                    {enquiry.customer?.name || 'Lead'} • {enquiry.expectedGuests} guests
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    {phone ? (
                                      <a
                                        href={`tel:${phone}`}
                                        className="btn btn-secondary px-2 py-1 text-xs"
                                      >
                                        <PhoneCall className="w-3 h-3" />
                                        Call
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-[var(--text-4)]">No phone on record</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => openEnquiryDetails(enquiry.id)}
                                      className="text-xs text-primary-700 hover:text-primary-800"
                                    >
                                      Open enquiry →
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-[var(--text-1)]">Google Venue Events</p>
                          <span className="text-xs rounded-full bg-sky-100 text-sky-800 px-2 py-0.5">
                            {selectedGoogleEvents.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedGoogleEvents.length === 0 ? (
                            <div className="empty-state" style={{ padding: '16px 12px' }}>
                              <div className="empty-state-icon">
                                <Globe2 size={18} />
                              </div>
                              <p className="empty-state-title">No Google events</p>
                              <p className="empty-state-desc">Nothing synced for this date.</p>
                            </div>
                          ) : (
                            selectedGoogleEvents.map((event) => (
                              <div key={event.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{event.title}</p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                    {event.origin === 'software' ? 'software mirror' : 'google'}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--text-2)] mt-1">
                                  {event.venueName}
                                  {event.location ? ` • ${event.location}` : ''}
                                </p>
                                <p className="text-xs text-[var(--text-2)] mt-0.5">
                                  {googleEventTimeLabel(event)} •{' '}
                                  <span className="capitalize">{event.status}</span>
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border)] flex gap-2">
                        <Link href="/dashboard/bookings" className="btn btn-secondary flex-1 justify-center">
                          Bookings
                        </Link>
                        <Link href="/dashboard/enquiries" className="btn btn-secondary flex-1 justify-center">
                          Enquiries
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="panel-header">
                  <h2 className="text-lg font-semibold text-[var(--text-1)]">Upcoming This Month</h2>
                </div>
                <div className="space-y-2">
                  {agenda.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <div className="empty-state-icon">
                        <CalendarDays size={22} />
                      </div>
                      <p className="empty-state-title">No events</p>
                      <p className="empty-state-desc">Nothing scheduled for this date.</p>
                    </div>
                  ) : (
                    agenda.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          if (entry.kind === 'booking') {
                            const bookingId = entry.id.replace('booking-', '');
                            if (bookingId) {
                              void openBookingDetails(bookingId);
                            }
                          }
                        }}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left ${entry.kind === 'booking'
                          ? 'hover:border-primary-300 hover:bg-primary-50 transition'
                          : 'cursor-default'
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[var(--text-1)]">{entry.title}</p>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${entry.source === 'google'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                                }`}
                            >
                              {entry.source === 'google' ? 'Google' : 'Software'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-2)] mt-1">{entry.subtitle}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-[var(--text-2)]">
                            {formatDateDDMMYYYY(entry.date)} •{' '}
                            <span className="capitalize">
                              {entry.kind === 'google' ? 'venue' : entry.kind}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-2)] mt-1">
                            <StatusBadge status={entry.status} size="sm" />
                            {entry.kind === 'booking' && typeof entry.amount === 'number' && (
                              <span> • ₹{entry.amount.toLocaleString('en-IN')}</span>
                            )}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {displayMode === 'hallBoard' && (
            <div className="card">
              <div className="panel-header">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-1)]">Hall Timeline</h2>
                  <p className="text-sm text-[var(--text-2)] mt-1">
                    Hall-first availability and conflict view for <span className="font-medium">{selectedDateLabel}</span>.{' '}
                    <span className="text-xs text-[var(--text-4)]">(Range: {hallBoardRangeLabel})</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[980px] rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="grid grid-cols-[220px_repeat(3,1fr)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--text-2)] font-semibold">
                    <div className="px-4 py-3 border-r border-[var(--border)]">Hall / Banquet</div>
                    {hallBoardSegments.map((segment) => (
                      <div key={segment.key} className="px-4 py-3 border-r border-[var(--border)] last:border-r-0">
                        {segment.label}
                        <span className="block text-[10px] text-[var(--text-4)] normal-case font-medium">
                          {segment.range}
                        </span>
                      </div>
                    ))}
                  </div>

                  {hallBoardRows.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px 16px' }}>
                      <div className="empty-state-icon">
                        <Building2 size={22} />
                      </div>
                      <p className="empty-state-title">No halls or bookings found</p>
                      <p className="empty-state-desc">Try adjusting the date range or filters.</p>
                    </div>
                  ) : (
                    hallBoardRows.map((row, index) => {
                      const daySlots = row.slots.filter((slot) => slot.date === hallBoardDateKey);
                      return (
                        <div
                          key={row.hallName}
                          className={`grid grid-cols-[220px_repeat(3,1fr)] border-t border-[var(--border)] ${index % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'
                            }`}
                        >
                          <div className="px-4 py-4 border-r border-[var(--border)] text-sm font-semibold text-[var(--text-1)]">
                            {row.hallName}
                            <p className="text-xs font-normal text-[var(--text-4)] mt-1">
                              {row.banquetName ? `Banquet: ${row.banquetName}` : 'Banquet: Unassigned'}
                            </p>
                          </div>
                          {hallBoardSegments.map((segment) => {
                            const segmentSlots = daySlots.filter(
                              (slot) => slot.startMinutes < segment.end && slot.endMinutes > segment.start
                            );
                            const isDouble = segmentSlots.length > 1;
                            return (
                              <div
                                key={`${row.hallName}-${segment.key}`}
                                className="px-3 py-3 border-r border-[var(--border)] last:border-r-0"
                              >
                                {segmentSlots.length === 0 ? (
                                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                                    Available
                                  </span>
                                ) : (
                                  <div className="space-y-2">
                                    {isDouble && (
                                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 inline-flex w-fit">
                                        Double booked
                                      </div>
                                    )}
                                    {segmentSlots.map((slot) => (
                                      <button
                                        key={`${row.hallName}-${segment.key}-${slot.source}-${slot.bookingId || slot.functionName}-${slot.sortKey}`}
                                        type="button"
                                        onClick={() => {
                                          if (slot.source === 'software' && slot.bookingId) {
                                            void openBookingDetails(slot.bookingId);
                                            return;
                                          }
                                          if (slot.htmlLink) {
                                            window.open(slot.htmlLink, '_blank', 'noopener,noreferrer');
                                          }
                                        }}
                                        className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition ${slot.source === 'google'
                                          ? 'border-sky-200 bg-sky-50 hover:border-sky-300 hover:bg-sky-100'
                                          : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100'
                                          }`}
                                      >
                                        <p
                                          className={`text-xs font-semibold ${slot.source === 'google' ? 'text-sky-900' : 'text-emerald-900'
                                            }`}
                                        >
                                          {slot.timeLabel}
                                        </p>
                                        <p
                                          className={`text-xs mt-0.5 ${slot.source === 'google' ? 'text-sky-800' : 'text-emerald-800'
                                            }`}
                                        >
                                          {slot.functionName}
                                          {slot.source === 'software' && slot.customerName
                                            ? ` • ${slot.customerName}`
                                            : ''}
                                        </p>
                                        <p
                                          className={`text-[11px] mt-0.5 ${slot.source === 'google' ? 'text-sky-700' : 'text-emerald-700'
                                            }`}
                                        >
                                          {slot.guests ? `${slot.guests} guests • ` : ''}
                                          {slot.source === 'google' ? 'Google' : 'Software'}
                                        </p>
                                        <div className="mt-1.5">
                                          <StatusBadge status={slot.status} size="sm" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {isBookingDetailsOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/45 p-4 sm:p-6"
              onClick={closeBookingDetails}
            >
              <div
                className="mx-auto h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Booking Details</p>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--text-1)]">
                      {bookingDetails?.functionName || 'Loading...'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeBookingDetails}
                    className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-[calc(100%-69px)] overflow-y-auto px-4 py-4 sm:px-5">
                  {bookingDetailsLoading ? (
                    <div className="py-8">
                      <CalendarSkeleton />
                    </div>
                  ) : !bookingDetails ? (
                    <p className="text-sm text-[var(--text-4)]">Unable to load booking details.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Function</p>
                          <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                            {bookingDetails.functionType || '-'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Date</p>
                          <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                            {formatDateDDMMYYYY(bookingDetails.functionDate)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Time</p>
                          <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                            {bookingTimeLabel(bookingDetails)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Status</p>
                          <div className="mt-1">
                            <StatusBadge
                              status={resolveBookingStatus(bookingDetails)}
                              size="sm"
                            />
                          </div>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Customer</p>
                          <p className="text-sm font-semibold text-[var(--text-1)] mt-1">
                            {bookingDetails.customer?.name || '-'}
                          </p>
                          <p className="text-xs text-[var(--text-2)] mt-0.5">
                            {bookingDetails.customer?.phone || '-'}
                          </p>
                          {bookingDetails.customer?.email && (
                            <p className="text-xs text-[var(--text-2)] mt-0.5">
                              {bookingDetails.customer.email}
                            </p>
                          )}
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--text-4)]">Halls</p>
                          <div className="mt-1 space-y-1">
                            {bookingDetailsHallBanquetLines.map((line) => (
                              <p key={line} className="text-sm font-semibold text-[var(--text-1)]">
                                {line}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-[var(--text-2)] mt-0.5">
                            {toSafeNumber(bookingDetails.expectedGuests)} guests • ₹
                            {toSafeNumber(bookingDetails.grandTotal).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-sm font-semibold text-[var(--text-1)]">Menu/Pack Details</p>
                        {bookingDetailsPacks.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <CalendarCheck size={18} />
                            </div>
                            <p className="empty-state-title">No packs added</p>
                            <p className="empty-state-desc">Pack details will appear here.</p>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {bookingDetailsPacks.map((pack) => (
                              <div key={pack.id} className="rounded-lg bg-[var(--surface-2)] px-2.5 py-2">
                                <p className="text-xs font-semibold text-[var(--text-1)]">
                                  {pack.mealSlot?.name || pack.packName || 'Pack'}
                                </p>
                                <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                                  {bookingTimeLabel(pack)} •{' '}
                                  {toSafeNumber(pack.packCount ?? pack.noOfPack)} pax
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-sm font-semibold text-[var(--text-1)]">Payments</p>
                        {bookingDetailsPayments.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <IndianRupee size={18} />
                            </div>
                            <p className="empty-state-title">No payments recorded</p>
                            <p className="empty-state-desc">Payments will appear here once logged.</p>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {bookingDetailsPayments.map((payment) => (
                              <div key={payment.id} className="rounded-lg bg-[var(--surface-2)] px-2.5 py-2">
                                <p className="text-xs font-semibold text-[var(--text-1)]">
                                  {payment.method || 'Payment'} • ₹
                                  {toSafeNumber(payment.amount).toLocaleString('en-IN')}
                                </p>
                                <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                                  {payment.paymentDate
                                    ? formatDateDDMMYYYY(payment.paymentDate)
                                    : 'No date'}{' '}
                                  • {payment.receiver?.name || 'Receiver not set'}
                                </p>
                                {payment.narration && (
                                  <p className="text-[11px] text-[var(--text-2)] mt-0.5">
                                    {payment.narration}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {(bookingDetailsAdditionalItems.length > 0 || bookingDetails.notes) && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                          {bookingDetailsAdditionalItems.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-1)]">
                                Additional Requirements
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {bookingDetailsAdditionalItems.map((item, index) => (
                                  <span
                                    key={`${item}-${index}`}
                                    className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-800"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {bookingDetails.notes && (
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-1)]">Notes</p>
                              <p className="text-xs text-[var(--text-2)] mt-1">{bookingDetails.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Link
                          href={
                            bookingDetails?.id
                              ? `/dashboard/bookings?section=edit&id=${bookingDetails.id}`
                              : '/dashboard/bookings'
                          }
                          className="btn btn-secondary"
                        >
                          Open Booking Module
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="print-only">
            <div style={{ padding: '24px' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Day Schedule — {selectedDateLabel}
              </h1>
              {printBookings.length === 0 ? (
                <p style={{ fontSize: 12 }}>No bookings available for this date.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {printBookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{booking.functionName}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {booking.functionType || '-'} • {formatDateDDMMYYYY(booking.functionDate)} •{' '}
                        {bookingTimeLabel(booking)}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        Halls: {getBookingHallNames(booking as BookingCalendarRow).join(', ') || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        Guests: {toSafeNumber(booking.expectedGuests).toLocaleString('en-IN')} • Phone:{' '}
                        {booking.customer?.phone || '-'}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>
                        Menu Slots:{' '}
                        {booking.packs && booking.packs.length > 0
                          ? booking.packs
                            .map((pack) => {
                              const label = pack.packName || pack.mealSlot?.name || 'Meal';
                              const count = pack.packCount ?? pack.noOfPack ?? '';
                              return `${label}${count ? ` (${count})` : ''}`;
                            })
                            .join(', ')
                          : 'Not specified'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>{/* end main calendar area */}
      </div>{/* end sidebar + main flex row */}
    </div>
  );
}
