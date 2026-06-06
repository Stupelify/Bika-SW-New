import { enquiryScopeFilter, enquiryInScope } from '../utils/enquiryScope';
import { VenueScope } from '../utils/banquetAccess';

const allVenues: VenueScope = { allVenues: true, banquetIds: [] };
const restricted: VenueScope = { allVenues: false, banquetIds: ['b1', 'b2'] };

describe('enquiryScopeFilter', () => {
  it('returns undefined for all-venues users (no filtering)', () => {
    expect(enquiryScopeFilter(allVenues)).toBeUndefined();
  });

  it('restricts to allowed banquets OR hall-less enquiries', () => {
    const filter = enquiryScopeFilter(restricted);
    expect(filter).toEqual({
      OR: [
        { halls: { some: { hall: { banquetId: { in: ['b1', 'b2'] } } } } },
        { halls: { none: {} } },
      ],
    });
  });
});

describe('enquiryInScope', () => {
  it('allows everything for all-venues users', () => {
    expect(enquiryInScope(allVenues, ['bX'])).toBe(true);
  });

  it('allows hall-less enquiries for restricted users', () => {
    expect(enquiryInScope(restricted, [])).toBe(true);
  });

  it('allows when an enquiry hall is in an allowed banquet', () => {
    expect(enquiryInScope(restricted, ['bX', 'b2'])).toBe(true);
  });

  it('blocks when no enquiry hall is in an allowed banquet', () => {
    expect(enquiryInScope(restricted, ['bX', 'bY'])).toBe(false);
  });
});
