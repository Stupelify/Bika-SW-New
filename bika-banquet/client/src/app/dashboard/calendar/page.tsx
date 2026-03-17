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
  status: string;
  isQuotation: boolean;
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
    if (!searchQuery) return bookings;
    return bookings.filter((entry) =>
      [
        entry.functionName,
        entry.functionType,
        entry.status,
        entry.customer?.name || '',
        entry.customer?.phone || '',
        getBookingHallNames(entry).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [bookings, searchQuery, sourceFilter]);

  const filteredEnquiries = useMemo(() => {
    if (sourceFilter === 'google') return [];
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
  }, [enquiries, searchQuery, sourceFilter]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;
    if (viewMode === 'month' && displayMode !== 'calendar') return;
    dayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedDate, viewMode, displayMode]);

  const summary = useMemo(() => {
    const activeBookings = filteredBookings.filter((entry) => entry.status !== 'cancelled');
    const cancelledBookings = filteredBookings.filter((entry) => entry.status === 'cancelled')
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

    return {
      bookings: activeBookings.length,
      cancelledBookings,
      enquiries: filteredEnquiries.length,
      googleEvents: filteredGoogleEvents.length,
      confirmedBookings,
      monthlyRevenue,
      guestVolume,
    };
  }, [filteredBookings, filteredEnquiries, filteredGoogleEvents]);

  const agenda = useMemo<AgendaEntry[]>(() => {
    const bookingItems: AgendaEntry[] = filteredBookings.map((entry) => ({
      id: `booking-${entry.id}`,
      kind: 'booking',
      date: entry.functionDate,
      title: entry.functionName,
      subtitle: `${entry.customer?.name || 'Customer'} • ${entry.expectedGuests} guests`,
      status: entry.isQuotation ? 'quotation' : entry.status,
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
      status: booking.isQuotation ? 'quotation' : booking.status,
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
          status: booking.isQuotation ? 'quotation' : booking.status,
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
    const blockedBookings = filteredBookings.filter((entry) => entry.status !== 'cancelled');
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
          status: entry.isQuotation ? 'quotation' : entry.status,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-1">
          Track software events and imported Google venue events with clear source tags.
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
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Go to</span>
              <input
                type="date"
                className="input h-8 min-h-0 border-0 p-0 text-sm shadow-none focus:shadow-none"
                value={selectedDate}
                onChange={(event) => handleJumpToDate(event.target.value)}
                aria-label="Jump to date"
              />
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
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
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
              {(
                [
                  ['calendar', 'Calendar'],
                  ['hallBoard', 'Hall Board'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDisplayMode(mode)}
                  className={`px-3 py-2 text-sm font-semibold transition ${displayMode === mode
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
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
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {label}
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
          <span className="text-gray-600">
            {googleImportEnabled
              ? googleImportConfigured
                ? `Google import active for ${googleSourceCount} venue calendars (read-only).`
                : 'Google import enabled, but configuration is incomplete.'
              : 'Google import is currently disabled.'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Bookings</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-2xl font-semibold text-gray-900">
              {summary.bookings.toLocaleString()}
            </p>
            {summary.cancelledBookings > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Cancelled {summary.cancelledBookings}
              </span>
            )}
          </div>
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
          <p className="text-xs uppercase tracking-wide text-gray-500">Google Events</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.googleEvents.toLocaleString()}
          </p>
          <Globe2 className="w-4 h-4 text-sky-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Guest Volume</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {summary.guestVolume.toLocaleString()}
          </p>
          <Users className="w-4 h-4 text-sky-700 mt-3" />
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-gray-500">Active Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            ₹{summary.monthlyRevenue.toLocaleString('en-IN')}
          </p>
          <IndianRupee className="w-4 h-4 text-violet-700 mt-3" />
        </div>
      </div>

      {displayMode === 'calendar' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              {loading ? (
                <div className="py-8">
                  <CalendarSkeleton />
                </div>
              ) : (
                <>
                  {viewMode === 'month' && (
                    <>
                      <div className="hidden md:block overflow-x-auto">
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
                              const dayGoogleEvents = googleEventsByDate.get(dayKey) || [];
                              const activeDayBookings = dayBookings.filter(
                                (booking) => booking.status !== 'cancelled'
                              );
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
                                  status: booking.status,
                                })),
                                ...dayEnquiries.map((enquiry) => ({
                                  id: enquiry.id,
                                  label: enquiry.functionName,
                                  kind: 'enquiry' as const,
                                  status: enquiry.status,
                                })),
                                ...dayGoogleEvents.map((event) => ({
                                  id: event.id,
                                  label: event.title,
                                  kind: 'google' as const,
                                  status: event.status,
                                })),
                              ];
                              const visibleEvents = eventBars.slice(0, 3);
                              const overflowCount = Math.max(eventBars.length - visibleEvents.length, 0);

                              return (
                                <button
                                  key={dayKey}
                                  type="button"
                                  onClick={() => setSelectedDate(dayKey)}
                                  className={`rounded-xl border p-2 text-left min-h-[96px] sm:min-h-[126px] transition relative overflow-hidden ${isSelected
                                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                                      : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50'
                                    } ${isCurrentMonth ? '' : 'bg-gray-50 opacity-75'}`}
                                >
                                  <div className="flex items-center justify-between relative z-10">
                                    <span
                                      className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-500'
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

                                  <div className="mt-2 space-y-1.5 relative z-10">
                                    {visibleEvents.map((event) => {
                                      const isCancelled = event.kind === 'booking' && event.status === 'cancelled';
                                      const colors: Record<string, { bg: string; text: string }> = {
                                        booking: { bg: 'var(--teal-500)', text: '#ffffff' },
                                        enquiry: { bg: '#f59e0b', text: '#1f2937' },
                                        google: { bg: '#38bdf8', text: '#0f172a' },
                                      };
                                      const color = colors[event.kind];
                                      return (
                                        <div
                                          key={`${event.kind}-${event.id}`}
                                          title={event.label}
                                          style={{
                                            padding: '2px 6px',
                                            borderRadius: 999,
                                            fontSize: 10,
                                            lineHeight: '12px',
                                            background: color.bg,
                                            color: color.text,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            opacity: isCancelled ? 0.5 : 1,
                                            textDecoration: isCancelled ? 'line-through' : 'none',
                                          }}
                                        >
                                          {event.label}
                                        </div>
                                      );
                                    })}
                                    {overflowCount > 0 && (
                                      <span className="text-[10px] text-[var(--text-4)]">
                                        +{overflowCount} more
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 text-[10px] text-[var(--text-4)] relative z-10">
                                    {dayGuestCount > 0 ? (
                                      <span>
                                        {dayGuestCount.toLocaleString()} guests
                                        {dayHallCount > 0 ? ` • ${dayHallCount} halls` : ''}
                                      </span>
                                    ) : (
                                      <span>No bookings</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Agenda Weekly Strip */}
                      <div className="md:hidden">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 px-1">Selected Week</p>
                        <div className="flex items-center gap-3 overflow-x-auto pb-4 snap-x snap-mandatory mx-[-16px] px-4" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                          {mobileWeekDays.map((day) => {
                            const dayKey = formatDateKey(day);
                            const isSelected = dayKey === selectedDate;
                            const isToday = dayKey === todayKey;
                            const hasBookings = (bookingsByDate.get(dayKey)?.length || 0) > 0;
                            const hasEnquiries = (enquiriesByDate.get(dayKey)?.length || 0) > 0;

                            return (
                              <button
                                key={dayKey}
                                type="button"
                                onClick={() => setSelectedDate(dayKey)}
                                className={`flex flex-col items-center justify-center min-w-[64px] h-[76px] rounded-2xl border transition-all snap-start ${isSelected
                                    ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                                    : isToday
                                      ? 'border-primary-200 bg-primary-50 text-gray-900'
                                      : 'border-gray-200 bg-white text-gray-600'
                                  }`}
                              >
                                <span className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-primary-100' : 'text-gray-500'}`}>
                                  {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                                </span>
                                <span className="text-lg font-bold">
                                  {day.getDate()}
                                </span>
                                <div className="flex gap-1 mt-1.5 h-1.5">
                                  {hasBookings && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                                  {hasEnquiries && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-between">
                          <p className="text-xs text-primary-800 font-medium">Viewing agenda for selected day below</p>
                          <svg className="w-5 h-5 text-primary-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === 'week' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-[920px] grid grid-cols-7 gap-3">
                        {weekDays.map((day) => {
                          const dayKey = formatDateKey(day);
                          const dayBookings = bookingsByDate.get(dayKey) || [];
                          const dayEnquiries = enquiriesByDate.get(dayKey) || [];
                          const dayGoogleEvents = googleEventsByDate.get(dayKey) || [];
                          const isSelected = dayKey === selectedDate;
                          const isToday = dayKey === todayKey;

                          return (
                            <button
                              key={dayKey}
                              type="button"
                              onClick={() => setSelectedDate(dayKey)}
                              className={`rounded-xl border p-3 text-left align-top min-h-[280px] ${isSelected
                                  ? 'border-primary-400 bg-primary-50'
                                  : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50'
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
                                  <button
                                    key={booking.id}
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void openBookingDetails(booking.id);
                                    }}
                                    className="rounded-md bg-emerald-100 text-emerald-900 px-2 py-1 text-xs truncate"
                                  >
                                    {bookingTimeLabel(booking)} {getPrimaryHallName(booking)} •{' '}
                                    {booking.functionName}
                                  </button>
                                ))}
                                {dayEnquiries.slice(0, 4).map((enquiry) => (
                                  <button
                                    key={enquiry.id}
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEnquiryDetails(enquiry.id);
                                    }}
                                    className="rounded-md bg-amber-100 text-amber-900 px-2 py-1 text-xs truncate text-left"
                                  >
                                    {enquiry.functionTime || '--:--'} {enquiry.functionName}
                                  </button>
                                ))}
                                {dayGoogleEvents.slice(0, 4).map((event) => (
                                  <div
                                    key={event.id}
                                    className="rounded-md bg-sky-100 text-sky-900 px-2 py-1 text-xs truncate"
                                  >
                                    {googleEventTimeLabel(event)} {event.venueName} • {event.title}
                                  </div>
                                ))}
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
                              <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${entry.source === 'google'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                >
                                  {entry.source === 'google' ? 'Google' : 'Software'}
                                </span>
                                <span className="text-xs text-gray-700">{entry.time}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{entry.subtitle}</p>
                            <p className="text-xs text-gray-600 mt-1 capitalize">
                              {entry.status}
                              {entry.kind === 'booking' && typeof entry.amount === 'number' && (
                                <span> • ₹{entry.amount.toLocaleString('en-IN')}</span>
                              )}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              key={selectedDate}
              ref={dayPanelRef}
              className="card xl:sticky xl:top-24 h-fit day-panel-enter"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Selected Day</p>
                  <h2 className="text-lg font-semibold text-gray-900 mt-1">{selectedDateLabel}</h2>
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
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon">
                    <CalendarDays size={22} />
                  </div>
                  <p className="empty-state-title">No events</p>
                  <p className="empty-state-desc">Nothing scheduled for this date.</p>
                </div>
              ) : (
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
                        <div className="empty-state" style={{ padding: '16px 12px' }}>
                          <div className="empty-state-icon">
                            <CalendarCheck size={18} />
                          </div>
                          <p className="empty-state-title">No bookings</p>
                          <p className="empty-state-desc">Nothing booked for this date.</p>
                        </div>
                      ) : (
                        selectedBookings.map((booking) => (
                          <button
                            key={booking.id}
                            type="button"
                            onClick={() => void openBookingDetails(booking.id)}
                            className="rounded-lg border border-gray-200 bg-white p-2.5 text-left hover:border-primary-300 hover:bg-primary-50 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{booking.functionName}</p>
                              <span
                                className={`status-pill ${booking.isQuotation
                                    ? 'status-quotation'
                                    : booking.status === 'confirmed'
                                      ? 'status-confirmed'
                                      : booking.status === 'cancelled'
                                        ? 'status-cancelled'
                                        : 'status-pending'
                                  }`}
                              >
                                {booking.isQuotation ? 'quotation' : booking.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {booking.customer?.name || 'Customer'} • {booking.expectedGuests} guests •{' '}
                              {getBookingHallNames(booking).join(', ') || 'Unassigned Hall'}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {bookingTimeLabel(booking)} • ₹
                              {toSafeNumber(booking.grandTotal).toLocaleString('en-IN')}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">Hall-wise Party Schedule</p>
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
                              className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-1.5">
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
                                    className="w-full rounded-md bg-gray-50 px-2 py-1.5 text-left hover:bg-sky-50 transition"
                                  >
                                    <p className="text-xs font-semibold text-gray-900">{party.title}</p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                      {formatDateDDMMYYYY(party.date)} • {party.timeLabel}
                                    </p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                      {party.customerName} • {party.customerPhone} • {party.guests} guests
                                    </p>
                                    <p className="text-[11px] text-gray-600 mt-0.5 capitalize">
                                      {party.status}
                                    </p>
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
                      <p className="text-sm font-semibold text-gray-900">Enquiries</p>
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
                            <div key={enquiry.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEnquiryDetails(enquiry.id)}
                                  className="text-sm font-medium text-gray-900 truncate text-left hover:text-primary-700"
                                >
                                  {enquiry.functionName}
                                </button>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {enquiry.isPencilBooked ? 'pencil' : enquiry.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
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
                                  <span className="text-[11px] text-gray-500">No phone on record</span>
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
                      <p className="text-sm font-semibold text-gray-900">Google Venue Events</p>
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
                          <div key={event.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                {event.origin === 'software' ? 'software mirror' : 'google'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {event.venueName}
                              {event.location ? ` • ${event.location}` : ''}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {googleEventTimeLabel(event)} •{' '}
                              <span className="capitalize">{event.status}</span>
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
              )}
            </div>
          </div>

          <div className="card">
            <div className="panel-header">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming This Month</h2>
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
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left ${entry.kind === 'booking'
                        ? 'hover:border-primary-300 hover:bg-primary-50 transition'
                        : 'cursor-default'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${entry.source === 'google'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {entry.source === 'google' ? 'Google' : 'Software'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{entry.subtitle}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-600">
                        {formatDateDDMMYYYY(entry.date)} •{' '}
                        <span className="capitalize">
                          {entry.kind === 'google' ? 'venue' : entry.kind}
                        </span>
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        <span className="capitalize">{entry.status}</span>
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
              <h2 className="text-lg font-semibold text-gray-900">Hall Booking Board</h2>
              <p className="text-sm text-gray-600 mt-1">
                Timeline view for <span className="font-medium">{selectedDateLabel}</span>.{' '}
                <span className="text-xs text-gray-500">(Range: {hallBoardRangeLabel})</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[980px] rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[220px_repeat(3,1fr)] bg-gray-100 text-xs uppercase tracking-wide text-gray-600 font-semibold">
                <div className="px-4 py-3 border-r border-gray-200">Hall / Banquet</div>
                {hallBoardSegments.map((segment) => (
                  <div key={segment.key} className="px-4 py-3 border-r border-gray-200 last:border-r-0">
                    {segment.label}
                    <span className="block text-[10px] text-gray-500 normal-case font-medium">
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
                      className={`grid grid-cols-[220px_repeat(3,1fr)] border-t border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                    >
                      <div className="px-4 py-4 border-r border-gray-100 text-sm font-semibold text-gray-900">
                        {row.hallName}
                        <p className="text-xs font-normal text-gray-500 mt-1">
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
                            className="px-3 py-3 border-r border-gray-100 last:border-r-0"
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
            className="mx-auto h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Booking Details</p>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {bookingDetails?.functionName || 'Loading...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeBookingDetails}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
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
                <p className="text-sm text-gray-500">Unable to load booking details.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Function</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {bookingDetails.functionType || '-'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {formatDateDDMMYYYY(bookingDetails.functionDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Time</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {bookingTimeLabel(bookingDetails)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                        {bookingDetails.isQuotation
                          ? 'Quotation'
                          : bookingDetails.status || 'Pending'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {bookingDetails.customer?.name || '-'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {bookingDetails.customer?.phone || '-'}
                      </p>
                      {bookingDetails.customer?.email && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {bookingDetails.customer.email}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Halls</p>
                      <div className="mt-1 space-y-1">
                        {bookingDetailsHallBanquetLines.map((line) => (
                          <p key={line} className="text-sm font-semibold text-gray-900">
                            {line}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {toSafeNumber(bookingDetails.expectedGuests)} guests • ₹
                        {toSafeNumber(bookingDetails.grandTotal).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">Menu/Pack Details</p>
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
                          <div key={pack.id} className="rounded-lg bg-gray-50 px-2.5 py-2">
                            <p className="text-xs font-semibold text-gray-900">
                              {pack.mealSlot?.name || pack.packName || 'Pack'}
                            </p>
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              {bookingTimeLabel(pack)} •{' '}
                              {toSafeNumber(pack.packCount ?? pack.noOfPack)} pax
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">Payments</p>
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
                          <div key={payment.id} className="rounded-lg bg-gray-50 px-2.5 py-2">
                            <p className="text-xs font-semibold text-gray-900">
                              {payment.method || 'Payment'} • ₹
                              {toSafeNumber(payment.amount).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              {payment.paymentDate
                                ? formatDateDDMMYYYY(payment.paymentDate)
                                : 'No date'}{' '}
                              • {payment.receiver?.name || 'Receiver not set'}
                            </p>
                            {payment.narration && (
                              <p className="text-[11px] text-gray-600 mt-0.5">
                                {payment.narration}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(bookingDetailsAdditionalItems.length > 0 || bookingDetails.notes) && (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                      {bookingDetailsAdditionalItems.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
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
                          <p className="text-sm font-semibold text-gray-900">Notes</p>
                          <p className="text-xs text-gray-600 mt-1">{bookingDetails.notes}</p>
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
                    Guests: {toSafeNumber(booking.expectedGuests).toLocaleString()} • Phone:{' '}
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
    </div>
  );
}
