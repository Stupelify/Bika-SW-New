import { buildOrderBy, parseOrder, SortWhitelist } from '../utils/listQuery';

describe('parseOrder', () => {
  it('accepts asc/desc', () => {
    expect(parseOrder('asc')).toBe('asc');
    expect(parseOrder('desc')).toBe('desc');
  });
  it('is case-insensitive', () => {
    expect(parseOrder('ASC')).toBe('asc');
    expect(parseOrder('DESC')).toBe('desc');
  });
  it('falls back for garbage / missing', () => {
    expect(parseOrder(undefined)).toBe('asc');
    expect(parseOrder('sideways')).toBe('asc');
    expect(parseOrder(123)).toBe('asc');
    expect(parseOrder(null, 'desc')).toBe('desc');
  });
});

describe('buildOrderBy', () => {
  const whitelist: SortWhitelist = {
    name: (order) => [{ name: order }],
    createdAt: (order) => [{ createdAt: order }],
    // composite UI column → secondary DB column
    contact: (order) => [{ phone: order }],
    // composite that already includes id should not double-append
    weird: (order) => [{ name: order }, { id: order }],
  };
  const fallback = [{ createdAt: 'desc' as const }];

  it('uses the default orderBy when sort is missing, plus id tiebreaker', () => {
    expect(buildOrderBy(undefined, undefined, whitelist, fallback)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('uses the default orderBy for an unknown sort key (no injection)', () => {
    expect(buildOrderBy('dropTable', 'asc', whitelist, fallback)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('maps a whitelisted key and direction with tiebreaker', () => {
    expect(buildOrderBy('name', 'asc', whitelist, fallback)).toEqual([
      { name: 'asc' },
      { id: 'asc' },
    ]);
    expect(buildOrderBy('name', 'desc', whitelist, fallback)).toEqual([
      { name: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('maps composite columns to their DB column', () => {
    expect(buildOrderBy('contact', 'desc', whitelist, fallback)).toEqual([
      { phone: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('never double-appends the tiebreaker', () => {
    expect(buildOrderBy('weird', 'asc', whitelist, fallback)).toEqual([
      { name: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('always appends a deterministic tiebreaker to the default too', () => {
    const result = buildOrderBy('', '', whitelist, fallback);
    expect(result[result.length - 1]).toEqual({ id: 'asc' });
  });
});
