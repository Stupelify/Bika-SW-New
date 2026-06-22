/**
 * booking-filters.ts
 *
 * Structured filter model for the bookings list. Replaces the old
 * "search split into six text boxes" approach. Kept free of React/DOM so the
 * mapping + client-side fallback filtering are unit-testable in the node env.
 *
 *  - BookingFilters: the single source of truth for the list's filter state.
 *  - toListParamsInput: maps the model → the structured server query params
 *    (the server already supports status/date-range; venue/hall/guests/amount
 *    were added in booking.read.ts).
 *  - countActiveFilters: badge count for the Filters affordance.
 *  - applyBookingFiltersClient: equivalent filtering for the legacy
 *    client-paginated path (feature flag off), so both paths behave the same.
 */
import { resolveDueAmount } from '@bika/booking-core';

export type DuePreset = '' | 'outstanding' | 'paid';

export interface BookingFilters {
  /** Global full-text search (function/customer/phone/status). */
  search: string;
  /** Selected statuses; empty = all. Values are raw booking statuses. */
  status: string[];
  /** Selected banquet (venue) ids; empty = all. */
  banquetIds: string[];
  /** Selected hall ids; empty = all. */
  hallIds: string[];
  /** Inclusive function-date range (yyyy-mm-dd); '' = unbounded. */
  dateFrom: string;
  dateTo: string;
  /** Guest-count bounds as raw input strings ('' = unbounded). */
  guestsMin: string;
  guestsMax: string;
  /** Grand-total bounds in rupees as raw input strings ('' = unbounded). */
  amountMin: string;
  amountMax: string;
  /** Balance-due preset. */
  due: DuePreset;
}

export const EMPTY_BOOKING_FILTERS: BookingFilters = {
  search: '',
  status: [],
  banquetIds: [],
  hallIds: [],
  dateFrom: '',
  dateTo: '',
  guestsMin: '',
  guestsMax: '',
  amountMin: '',
  amountMax: '',
  due: '',
};

function parseNum(value: string): number | undefined {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Count of *non-search* active filters — drives the badge next to "Filters".
 * Search is shown separately in the toolbar, so it is excluded here.
 */
export function countActiveFilters(f: BookingFilters): number {
  let n = 0;
  if (f.status.length) n += 1;
  if (f.banquetIds.length) n += 1;
  if (f.hallIds.length) n += 1;
  if (f.dateFrom || f.dateTo) n += 1;
  if (f.guestsMin || f.guestsMax) n += 1;
  if (f.amountMin || f.amountMax) n += 1;
  if (f.due) n += 1;
  return n;
}

export function hasAnyActiveFilter(f: BookingFilters): boolean {
  return Boolean(f.search) || countActiveFilters(f) > 0;
}

/**
 * Map the filter model to the structured server query params (the bits beyond
 * page/limit/sort). Empty selections are omitted so the server treats them as
 * "no filter" and the query cache key stays stable.
 */
export function toListParamsInput(f: BookingFilters): {
  search?: string;
  status?: string;
  banquetIds?: string;
  hallIds?: string;
  fromDate?: string;
  toDate?: string;
  guestsMin?: number;
  guestsMax?: number;
  amountMin?: number;
  amountMax?: number;
  due?: string;
} {
  return {
    search: f.search.trim() || undefined,
    status: f.status.length ? f.status.join(',') : undefined,
    banquetIds: f.banquetIds.length ? f.banquetIds.join(',') : undefined,
    hallIds: f.hallIds.length ? f.hallIds.join(',') : undefined,
    fromDate: f.dateFrom || undefined,
    toDate: f.dateTo || undefined,
    guestsMin: parseNum(f.guestsMin),
    guestsMax: parseNum(f.guestsMax),
    amountMin: parseNum(f.amountMin),
    amountMax: parseNum(f.amountMax),
    due: f.due || undefined,
  };
}

/**
 * Query-string keys this codec owns. The page deletes these before writing the
 * current state so it can preserve unrelated params (e.g. the `section`/`id`/
 * `date`/`hall`/`slot` deep-links). Note `venues`/`halls` are plural to avoid
 * colliding with the singular `hall` deep-link param.
 */
export const BOOKING_FILTER_URL_KEYS = [
  'status',
  'venues',
  'halls',
  'from',
  'to',
  'gmin',
  'gmax',
  'amin',
  'amax',
  'due',
] as const;

/** Filter model → query params. Only non-empty fields are emitted so the
 *  default view keeps a clean URL and shared links stay short. */
export function bookingFiltersToParams(f: BookingFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.status.length) p.status = f.status.join(',');
  if (f.banquetIds.length) p.venues = f.banquetIds.join(',');
  if (f.hallIds.length) p.halls = f.hallIds.join(',');
  if (f.dateFrom) p.from = f.dateFrom;
  if (f.dateTo) p.to = f.dateTo;
  if (f.guestsMin) p.gmin = f.guestsMin;
  if (f.guestsMax) p.gmax = f.guestsMax;
  if (f.amountMin) p.amin = f.amountMin;
  if (f.amountMax) p.amax = f.amountMax;
  if (f.due) p.due = f.due;
  return p;
}

/** Query params → filter model. `get` is `URLSearchParams.get`-shaped so this
 *  stays free of any framework type. `search` is owned separately by the page
 *  (`q`), so it is always returned empty here. */
export function bookingFiltersFromParams(get: (key: string) => string | null): BookingFilters {
  const csv = (key: string): string[] => {
    const raw = get(key);
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  };
  const str = (key: string): string => get(key) ?? '';
  const due = str('due');
  return {
    search: '',
    status: csv('status'),
    banquetIds: csv('venues'),
    hallIds: csv('halls'),
    dateFrom: str('from'),
    dateTo: str('to'),
    guestsMin: str('gmin'),
    guestsMax: str('gmax'),
    amountMin: str('amin'),
    amountMax: str('amax'),
    due: due === 'outstanding' || due === 'paid' ? due : '',
  };
}

/** Minimal row shape the client-side fallback filter needs. */
interface FilterableBooking {
  status: string;
  isQuotation?: boolean;
  functionDate: string;
  expectedGuests: number;
  grandTotal?: number | null;
  halls?: Array<{
    hall?: { id?: string; banquet?: { id?: string } | null } | null;
  }>;
  dueAmountValue?: number | null;
  dueAmount?: string | number | null;
}

/**
 * Client-side equivalent of the server filters, for the legacy (flag-off)
 * client-paginated path. Date comparison is done on the yyyy-mm-dd prefix so it
 * is timezone-stable and matches the date-input values.
 */
export function applyBookingFiltersClient<T extends FilterableBooking>(
  rows: T[],
  f: BookingFilters
): T[] {
  const gMin = parseNum(f.guestsMin);
  const gMax = parseNum(f.guestsMax);
  const aMin = parseNum(f.amountMin);
  const aMax = parseNum(f.amountMax);
  const statusSet = new Set(f.status);
  const banquetSet = new Set(f.banquetIds);
  const hallSet = new Set(f.hallIds);

  return rows.filter((row) => {
    if (statusSet.size && !statusSet.has(row.status)) return false;

    if (f.dateFrom || f.dateTo) {
      const day = (row.functionDate || '').slice(0, 10);
      if (f.dateFrom && day < f.dateFrom) return false;
      if (f.dateTo && day > f.dateTo) return false;
    }

    if (gMin != null && row.expectedGuests < gMin) return false;
    if (gMax != null && row.expectedGuests > gMax) return false;

    const total = row.grandTotal ?? 0;
    if (aMin != null && total < aMin) return false;
    if (aMax != null && total > aMax) return false;

    if (banquetSet.size || hallSet.size) {
      const halls = row.halls || [];
      const matches = halls.some((h) => {
        const hallId = h.hall?.id;
        const banquetId = h.hall?.banquet?.id;
        const banquetOk = !banquetSet.size || (banquetId != null && banquetSet.has(banquetId));
        const hallOk = !hallSet.size || (hallId != null && hallSet.has(hallId));
        return banquetOk && hallOk;
      });
      if (!matches) return false;
    }

    if (f.due) {
      const balance = resolveDueAmount(row);
      if (f.due === 'outstanding' && !(balance > 0)) return false;
      if (f.due === 'paid' && balance > 0) return false;
    }

    return true;
  });
}
