'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSSE } from '@/hooks/useSSE';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { customerSearchText, textMatchesSearch } from '@/lib/customerSearch';
import { CalendarPageSkeleton, CalendarSkeleton } from '@/components/Skeletons';
import Toolbar from '@/components/Toolbar';
import { LatestWinsGuard, dedupeSlotsByBookingId } from '@/lib/calendarConcurrency';
import dynamic from 'next/dynamic';
import type { TimelineHallRow } from '@/components/VenueTimelineBoard';
import CalendarToolbar from './_components/CalendarToolbar';
import type { HallStat } from './_components/HallLegend';
import CalendarLegend from './_components/CalendarLegend';
import DayPrintView from './_components/DayPrintView';
import type {
  BookingCalendarRow,
  BookingDetail,
  CalendarViewMode,
  EnquiryCalendarRow,
  EventSourceFilter,
  GoogleCalendarEventRow,
  HallBoardRow,
  HallCalendarOption,
} from './_lib/types';
import {
  bookingSortMinutes,
  bookingTimeLabel,
  buildWeekDays,
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
  googleEventRangeMinutes,
  googleEventSortMinutes,
  googleEventTimeLabel,
  monthBounds,
  parseDateKey,
  resolveBookingStatus,
  resolveBookingTimeRange,
  resolveEnquiryStatus,
  startOfDay,
  startOfWeek,
  toSafeNumber,
} from './_lib/calendar-helpers';

const VenueTimelineBoard = dynamic(
  () => import('@/components/VenueTimelineBoard').then((m) => m.VenueTimelineBoard),
  { loading: () => <CalendarSkeleton />, ssr: false },
);

export default function CalendarPage() {
  const router = useRouter();
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
  const [printingDay, setPrintingDay] = useState(false);
  const [printBookings, setPrintBookings] = useState<BookingDetail[]>([]);
  const dayPanelRef = useRef<HTMLDivElement | null>(null);

  // ── Filter state (now driven from the header) ─────────────────────────────
  // null = all halls visible (default until halls load)
  const [selectedHallIds, setSelectedHallIds] = useState<Set<string> | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    () => new Set(['confirmed', 'enquiry', 'pencil', 'quotation', 'pending'])
  );

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
  // ── End filter state ──────────────────────────────────────────────────────

  // Booking click → go straight to the edit form.
  const openBookingEdit = useCallback((bookingId: string) => {
    if (!bookingId) return;
    router.push(`/dashboard/bookings?section=edit&id=${bookingId}`);
  }, [router]);

  // Empty-space click → New Booking, prefilled with date (+ hall/slot when known).
  const openNewBooking = useCallback((args?: { date?: string; hallId?: string; slot?: string }) => {
    const params = new URLSearchParams({ section: 'new' });
    if (args?.date) params.set('date', args.date);
    if (args?.hallId) params.set('hall', args.hallId);
    if (args?.slot) params.set('slot', args.slot);
    router.push(`/dashboard/bookings?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    const now = new Date();
    setViewDate(startOfDay(now));
    setSelectedDate(formatDateKey(now));
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

  const loadGuardRef = useRef<LatestWinsGuard>(new LatestWinsGuard());

  const loadCalendarData = useCallback(async () => {
    // Latest-wins guard: navigating day A -> B -> A fires overlapping loads.
    // Only the most recently started load commits its result, so an earlier
    // (wider-range) response that resolves late can't overwrite the view and
    // duplicate bookings.
    const loadToken = loadGuardRef.current.begin();
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
      // Discard out-of-order / superseded responses.
      if (!loadGuardRef.current.isCurrent(loadToken)) return;
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
      if (loadGuardRef.current.isCurrent(loadToken)) {
        toast.error('Failed to load calendar data');
      }
    } finally {
      // Only the latest load controls the loading flag, so a late stale
      // response can't clear the spinner for an in-flight newer load.
      if (loadGuardRef.current.isCurrent(loadToken)) {
        setLoading(false);
      }
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
  const hallBoardDateKey = selectedDate;
  const todayKey = formatDateKey(new Date());
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

  // Subtitle for the VB-style header: booking count + hall count for the view.
  const viewSubtitle = useMemo(() => {
    const bookingCount = filteredBookings.length + filteredEnquiries.length;
    const hallCount = hallStatsByLocation.reduce((sum, [, hs]) => sum + hs.length, 0);
    const parts = [`${bookingCount} booking${bookingCount === 1 ? '' : 's'}`];
    if (hallCount > 0) parts.push(`${hallCount} hall${hallCount === 1 ? '' : 's'}`);
    if (selectedDayConflicts.length > 0) parts.push(`${selectedDayConflicts.length} conflict${selectedDayConflicts.length === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }, [filteredBookings.length, filteredEnquiries.length, hallStatsByLocation, selectedDayConflicts.length]);

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
      <Toolbar
        title="Calendar"
        stats={[
          { label: 'Bookings in view', value: filteredBookings.length + filteredEnquiries.length },
          {
            label: 'Conflicts',
            value: (
              <span
                className={
                  selectedDayConflicts.length > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }
              >
                {selectedDayConflicts.length}
              </span>
            ),
          },
        ]}
      />

      {/* ── Main calendar area (sidebar removed; filters live in header) ── */}
      <div className="min-w-0 space-y-4">

          <CalendarToolbar
            viewMode={viewMode}
            setViewMode={setViewMode}
            setViewDate={setViewDate}
            setSelectedDate={setSelectedDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            viewLabel={viewLabel}
            viewSubtitle={viewSubtitle}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            search={search}
            setSearch={setSearch}
            loading={loading}
            onJumpToDate={handleJumpToDate}
            onReload={() => void loadCalendarData()}
            onNewBooking={() => openNewBooking()}
            hallStatsByLocation={hallStatsByLocation}
            selectedHallIds={selectedHallIds}
            toggleHall={toggleHall}
            selectedStatuses={selectedStatuses}
            toggleStatus={toggleStatus}
          />

          {/* ── Hall + Status legend strip (desktop) ── */}
          <CalendarLegend rows={hallBoardRows as TimelineHallRow[]} />

          {/* ── Day-level conflict alert banner ── */}
          {(viewMode === 'day' || selectedDayConflicts.length > 0) &&
            selectedDayConflicts.length > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div className="space-y-0.5">
                  {Array.from(new Set(selectedDayConflicts.map((c) => c.hallName))).map(
                    (hallName) => (
                      <div key={hallName} style={{ fontWeight: 600 }}>
                        {hallName} has overlapping bookings on this date
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {loading ? (
            <CalendarPageSkeleton />
          ) : (
            <VenueTimelineBoard
              rows={hallBoardRows as TimelineHallRow[]}
              viewMode={viewMode}
              viewDate={viewDate}
              weekDays={weekDays}
              selectedDate={hallBoardDateKey}
              onBookingClick={openBookingEdit}
              onCreateBooking={(args) => openNewBooking(args)}
              onDateDrillDown={(date) => {
                setSelectedDate(date);
                setViewDate(new Date(`${date}T12:00:00`));
                setViewMode('day');
              }}
            />
          )}

          <DayPrintView
            selectedDateLabel={selectedDateLabel}
            printBookings={printBookings}
          />

      </div>{/* end main calendar area */}
    </div>
  );
}
