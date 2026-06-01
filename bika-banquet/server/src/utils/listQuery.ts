/**
 * listQuery.ts
 * Pure helpers for translating client list query params (sort/order) into a
 * stable Prisma `orderBy`. Every sort always appends a deterministic `id`
 * tie-breaker so paginated rows never shuffle across page boundaries.
 *
 * These helpers are additive and backward-compatible: when no `sort` param is
 * provided, the caller falls back to its existing default order (with the
 * tie-breaker appended).
 */

export type SortOrder = 'asc' | 'desc';

export type PrismaOrderBy = Record<string, unknown>;

/**
 * A whitelist maps a client-facing sort key to a function producing the Prisma
 * orderBy fragment (WITHOUT the id tie-breaker — that is appended centrally).
 * Composite UI columns map to their best single/secondary DB column(s).
 */
export type SortWhitelist = Record<string, (order: SortOrder) => PrismaOrderBy[]>;

export function parseOrder(raw: unknown, fallback: SortOrder = 'asc'): SortOrder {
  if (raw === 'asc' || raw === 'desc') return raw;
  if (typeof raw === 'string') {
    const lowered = raw.toLowerCase();
    if (lowered === 'asc' || lowered === 'desc') return lowered;
  }
  return fallback;
}

/**
 * Build a stable Prisma orderBy array from client sort params.
 *
 * @param sortRaw      the requested sort key (client column key)
 * @param orderRaw     'asc' | 'desc'
 * @param whitelist    allowed sort keys → orderBy fragment builder
 * @param defaultOrderBy  the fragment(s) to use when sort is missing/invalid
 *                        (preserves each list's current default sort)
 * @param tieBreaker   the field appended last for determinism (default 'id')
 */
export function buildOrderBy(
  sortRaw: unknown,
  orderRaw: unknown,
  whitelist: SortWhitelist,
  defaultOrderBy: PrismaOrderBy[],
  tieBreaker: string = 'id'
): PrismaOrderBy[] {
  const order = parseOrder(orderRaw, 'asc');
  const key = typeof sortRaw === 'string' ? sortRaw : '';
  const builder = key && Object.prototype.hasOwnProperty.call(whitelist, key)
    ? whitelist[key]
    : null;

  const base = builder ? builder(order) : defaultOrderBy;

  // Append the tie-breaker unless an earlier fragment already orders by it.
  const alreadyHasTie = base.some((fragment) =>
    Object.prototype.hasOwnProperty.call(fragment, tieBreaker)
  );
  if (alreadyHasTie) {
    return [...base];
  }
  return [...base, { [tieBreaker]: 'asc' }];
}
