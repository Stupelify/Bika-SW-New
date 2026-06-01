/**
 * Pure-logic helpers for the calendar page's data-loading concurrency and the
 * multi-hall booking de-duplication. Extracted so they can be unit-tested in the
 * node vitest environment (no React / DOM required).
 *
 * Fixes the "bookings replicate when navigating day A -> B -> A" bug:
 *  - LatestWinsGuard: only the most recent in-flight load commits its result,
 *    so an out-of-order (older, wider-range) response can't overwrite the view.
 *  - dedupeSlotsByBookingId / buildVenueAggregateSlots: a multi-hall booking is
 *    rendered once in venue-aggregate views, and accidental double-appends
 *    (e.g. from a leaked SSE refetch) are absorbed.
 */

/** Monotonic "latest wins" guard for overlapping async loads. */
export class LatestWinsGuard {
  private current = 0;

  /** Start a new request; returns its token. Supersedes any prior request. */
  begin(): number {
    this.current += 1;
    return this.current;
  }

  /** True only if `token` is still the most recently started request. */
  isCurrent(token: number): boolean {
    return token === this.current;
  }
}

/** Keep the first occurrence of each truthy bookingId; slots without an id are
 * all preserved (e.g. google events keyed differently). */
export function dedupeSlotsByBookingId<T extends { bookingId?: string }>(slots: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const slot of slots) {
    const id = slot.bookingId;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(slot);
  }
  return out;
}

export interface AggregateSlotInput {
  bookingId: string;
  halls: string[];
  date: string;
}

/** Build the venue-aggregate slot list: exactly one slot per bookingId,
 * regardless of how many halls the booking spans. */
export function buildVenueAggregateSlots(
  bookings: AggregateSlotInput[],
): AggregateSlotInput[] {
  return dedupeSlotsByBookingId(bookings);
}
