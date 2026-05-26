'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSSE } from '@/hooks/useSSE';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { customerSearchText, textMatchesSearch } from '@/lib/customerSearch';
import { CalendarSkeleton } from '@/components/Skeletons';
import dynamic from 'next/dynamic';
import type { TimelineHallRow } from '@/components/VenueTimelineBoard';
import CalendarToolbar from './_components/CalendarToolbar';
import HallLegend, { type HallStat } from './_components/HallLegend';
import BookingDrawer from './_components/BookingDrawer';
import DayPrintView from './_components/DayPrintView';
import type {
  AgendaEntry,
  BookingCalendarRow,
  BookingDetail,
  CalendarViewMode,
  DayEvent,
  EnquiryCalendarRow,
  EventSourceFilter,
  GoogleCalendarEventRow,
  HallBoardRow,
  HallCalendarOption,
  HallScheduleGroup,
  HallScheduleParty,
  MobileTimelineEntry,
  ServiceSlot,
} from './_lib/types';
import {
  bookingSortMinutes,
  bookingTimeLabel,
  buildCalendarDays,
  buildWeekDays,
  clamp,
  dateToKey,
  endOfDay,
  endOfWeek,
  eventDateKey,
  fetchBookings,
  fetchEnquiries,
  fetchGoogleCalendarEvents,
  fetchHalls,
  findDayHallConflicts,
  formatDateKey,
  getBookingHallNames,
  getLocationPalette,
  getPrimaryHallName,
  googleEventRangeMinutes,
  googleEventSortMinutes,
  googleEventTimeLabel,
  monthBounds,
  parseClockToMinutes,
  parseDateKey,
  resolveBookingStatus,
  resolveBookingTimeRange,
  resolveEnquiryStatus,
  resolveServiceSlot,
  startOfDay,
  startOfWeek,
  toSafeNumber,
} from './_lib/calendar-helpers';

const VenueTimelineBoard = dynamic(
  () => import('@/components/VenueTimelineBoard').then((m) => m.VenueTimelineBoard),
  { loading: () => <CalendarSkeleton />, ssr: false },
);

export default function CalendarPage() {
  const { user } = useAuthStore();
  const isAuthenticated = Boolean(user);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
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

  const calendarDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoadCalendar = useCallback(() => {
    if (calendarDebounceTimerRef.current) clearTimeout(calendarDebounceTimerRef.current);
    calendarDebounceTimerRef.current = setTimeout(() => {
      void loadCalendarData();
    }, 300);
  }, [loadCalendarData]);
  useEffect(() => {
    return () => {
      if (calendarDebounceTimerRef.current) clearTimeout(calendarDebounceTimerRef.current);
    };
  }, []);
  useSSE(['booking:', 'enquiry:'], debouncedLoadCalendar, isAuthenticated);

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
          customerSearchText(entry.customer ?? {}),
          getBookingHallNames(entry).join(' '),
        ].join(' ');
        if (!textMatchesSearch(haystack, searchQuery)) return false;
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
          customerSearchText(entry.customer ?? {}),
        ].join(' ');
        if (!textMatchesSearch(haystack, searchQuery)) return false;
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
    dayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedDate, viewMode]);

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
          date: (() => { const d = new Date(entry.functionDate); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
          timeLabel,
          functionName: entry.functionName,
          functionType: entry.functionType,
          customerName: entry.customer?.name || 'Customer',
          status: resolveBookingStatus(entry),
          sortKey:
            bookingDate + (Number.isFinite(bookingMinutes) ? bookingMinutes * 60 * 1000 : 0),
          startMinutes,
          endMinutes,
          guests: toSafeNumber(entry.expectedGuests),
          isPencilBooking: entry.isPencilBooking,
          pencilExpiresAt: entry.pencilExpiresAt,
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
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Calendar</h1>
        <p className="text-[var(--text-2)] mt-1">
          Track bookings, enquiries, hall occupancy, conflicts, and venue events in one operations view.
        </p>
      </div>

      {/* ── Sidebar + Main layout ── */}
      <div className="flex gap-0 items-start">

        {/* ── Collapsible Sidebar ── */}
        <HallLegend
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          halls={halls}
          hallStats={hallStats}
          hallStatsByLocation={hallStatsByLocation}
          selectedHallIds={selectedHallIds}
          setSelectedHallIds={setSelectedHallIds}
          toggleHall={toggleHall}
          selectedStatuses={selectedStatuses}
          toggleStatus={toggleStatus}
        />

        {/* ── Main calendar area ── */}
        <div className="flex-1 min-w-0 space-y-4 pl-0 lg:pl-4">

          <CalendarToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            setViewDate={setViewDate}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            viewLabel={viewLabel}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            search={search}
            setSearch={setSearch}
            loading={loading}
            onJumpToDate={handleJumpToDate}
            onReload={() => void loadCalendarData()}
            googleImportEnabled={googleImportEnabled}
            googleImportConfigured={googleImportConfigured}
            googleSourceCount={googleSourceCount}
          />



          <VenueTimelineBoard
            rows={hallBoardRows as TimelineHallRow[]}
            viewMode={viewMode}
            viewDate={viewDate}
            weekDays={weekDays}
            selectedDate={hallBoardDateKey}
            onBookingClick={(id) => { void openBookingDetails(id); }}
            onCreateBooking={() => { window.location.href = '/dashboard/bookings'; }}
            onDateDrillDown={(date) => {
              setSelectedDate(date);
              setViewDate(new Date(`${date}T12:00:00`));
              setViewMode('day');
            }}
          />

          <BookingDrawer
            isOpen={isBookingDetailsOpen}
            onClose={closeBookingDetails}
            loading={bookingDetailsLoading}
            bookingDetails={bookingDetails}
            hallBanquetLines={bookingDetailsHallBanquetLines}
            packs={bookingDetailsPacks}
            payments={bookingDetailsPayments}
            additionalItems={bookingDetailsAdditionalItems}
          />

          <DayPrintView
            selectedDateLabel={selectedDateLabel}
            printBookings={printBookings}
          />

        </div>{/* end main calendar area */}
      </div>{/* end sidebar + main flex row */}
    </div>
  );
}
