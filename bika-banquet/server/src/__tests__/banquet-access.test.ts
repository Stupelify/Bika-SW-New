import {
  banquetIdInFilter,
  canAccessBanquet,
  getVenueScope,
  VenueScope,
  withBookingBanquetScope,
} from '../utils/banquetAccess';

const allVenues: VenueScope = { allVenues: true, banquetIds: [] };
const restricted: VenueScope = { allVenues: false, banquetIds: ['b1', 'b2'] };
const noVenues: VenueScope = { allVenues: false, banquetIds: [] };

describe('getVenueScope', () => {
  it('returns unrestricted scope only when the user explicitly has all venue access', () => {
    expect(
      getVenueScope({
        user: {
          userId: 'user-1',
          email: 'u@example.com',
          roles: [],
          permissions: [],
          deniedPermissions: [],
          isActive: true,
          hasAllVenueAccess: true,
          banquetIds: ['b1'],
        },
      })
    ).toEqual({ allVenues: true, banquetIds: ['b1'] });
  });

  it('fails closed when banquet ids are missing or malformed', () => {
    expect(getVenueScope({ user: undefined })).toEqual({
      allVenues: false,
      banquetIds: [],
    });
    expect(
      getVenueScope({
        user: {
          userId: 'user-1',
          email: 'u@example.com',
          roles: [],
          permissions: [],
          deniedPermissions: [],
          isActive: true,
          hasAllVenueAccess: false,
          banquetIds: undefined,
        } as any,
      })
    ).toEqual({ allVenues: false, banquetIds: [] });
  });
});

describe('canAccessBanquet', () => {
  it('allows every banquet for all-venues users', () => {
    expect(canAccessBanquet(allVenues, undefined)).toBe(true);
    expect(canAccessBanquet(allVenues, 'any-banquet')).toBe(true);
  });

  it('allows restricted users only when the banquet is explicitly listed', () => {
    expect(canAccessBanquet(restricted, 'b2')).toBe(true);
    expect(canAccessBanquet(restricted, 'b3')).toBe(false);
    expect(canAccessBanquet(restricted, null)).toBe(false);
  });
});

describe('banquetIdInFilter', () => {
  it('returns undefined for all-venues users', () => {
    expect(banquetIdInFilter(allVenues)).toBeUndefined();
  });

  it('uses an empty in-list to fail closed for users with no venue grants', () => {
    expect(banquetIdInFilter(noVenues)).toEqual({ in: [] });
  });
});

describe('withBookingBanquetScope', () => {
  it('leaves booking queries unrestricted for all-venues users', () => {
    const where = { status: 'CONFIRMED' };

    expect(withBookingBanquetScope(where, allVenues)).toBe(where);
  });

  it('restricts booking queries to halls in allowed banquets', () => {
    expect(withBookingBanquetScope({ status: 'CONFIRMED' }, restricted)).toEqual({
      status: 'CONFIRMED',
      halls: {
        some: {
          hall: {
            banquetId: { in: ['b1', 'b2'] },
          },
        },
      },
    });
  });

  it('fails closed for booking queries when restricted users have no venue grants', () => {
    expect(withBookingBanquetScope({ id: 'booking-1' }, noVenues)).toEqual({
      id: 'booking-1',
      halls: {
        some: {
          hall: {
            banquetId: { in: [] },
          },
        },
      },
    });
  });
});
