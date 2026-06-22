import { describe, it, expect } from 'vitest';
import { buildListUrl } from '../urlListState';

const OWNED = ['q', 'status', 'from', 'to', 'sort', 'dir'];

describe('buildListUrl', () => {
  it('returns a bare path when there are no params', () => {
    expect(buildListUrl('/dashboard/enquiries', '', OWNED, {})).toBe('/dashboard/enquiries');
  });

  it('emits only non-empty owned entries', () => {
    const url = buildListUrl('/dashboard/enquiries', '', OWNED, {
      q: 'rahul',
      status: 'pending',
      from: '',
      to: '  ',
    });
    expect(url).toBe('/dashboard/enquiries?q=rahul&status=pending');
  });

  it('clears stale owned keys before re-applying current state', () => {
    const url = buildListUrl('/p', 'status=converted&q=old', OWNED, { status: 'pending' });
    expect(url).toBe('/p?status=pending');
  });

  it('preserves foreign params (e.g. a quick-create deep-link)', () => {
    const url = buildListUrl('/p', 'new=1', OWNED, { q: 'abc' });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('new')).toBe('1');
    expect(params.get('q')).toBe('abc');
  });
});
