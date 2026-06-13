import { expect, test } from '@playwright/test';
import {
  filterCustomerSuggestions,
  matchesCustomerSearch,
  textMatchesSearch,
  uniqueCustomersById,
} from '../../src/lib/customerSearch';

const customerRows = [
  {
    id: 'email-only',
    name: 'Aarav Sharma',
    phone: '5550001',
    email: 'babu@example.com',
  },
  {
    id: 'name-contains',
    name: 'Aarav Babu',
    phone: '5550002',
  },
  {
    id: 'phone-starts',
    name: 'Meera Patel',
    phone: '9876500000',
  },
  {
    id: 'name-starts',
    name: 'Babu Kumar',
    phone: '5550003',
  },
  {
    id: 'phone-contains',
    name: 'Zoya Khan',
    phone: '0098765000',
  },
];

test.describe('customer search text matching', () => {
  test('does not concatenate digits from different fields for short numeric queries', () => {
    expect(textMatchesSearch('Kumar1 +91 23456', '12')).toBe(false);
    expect(textMatchesSearch('Kumar1 9123456', '12')).toBe(true);
  });

  test('still matches long E164-style searches across country code and phone tokens', () => {
    expect(textMatchesSearch('Babu +91 9876543210', '919876543210')).toBe(true);
  });

  test('global customer search includes alternate contact fields and email', () => {
    expect(
      matchesCustomerSearch(
        {
          name: 'Aarav Sharma',
          phone: '5550001',
          alternatePhone: '7000012345',
          email: 'babu@example.com',
        },
        'babu@example.com'
      )
    ).toBe(true);
  });
});

test.describe('booking customer typeahead suggestions', () => {
  test('orders visible name and phone matches by relevance and suppresses email-only matches', () => {
    const ids = filterCustomerSuggestions(customerRows, 'babu').map((customer) => customer.id);

    expect(ids).toEqual(['name-starts', 'name-contains']);
  });

  test('ranks phone prefix matches before phone substring matches', () => {
    const ids = filterCustomerSuggestions(customerRows, '98765').map((customer) => customer.id);

    expect(ids).toEqual(['phone-starts', 'phone-contains']);
  });

  test('keeps the selected customer visible when it does not match the active query', () => {
    const ids = filterCustomerSuggestions(customerRows, 'babu', 'phone-starts').map(
      (customer) => customer.id
    );

    expect(ids).toEqual(['phone-starts', 'name-starts', 'name-contains']);
  });

  test('deduplicates paginated customer rows by id before storing options', () => {
    const unique = uniqueCustomersById([
      { id: '1', name: 'First Version', phone: '111' },
      { id: '2', name: 'Second Customer', phone: '222' },
      { id: '1', name: 'Duplicate Version', phone: '999' },
    ]);

    expect(unique).toEqual([
      { id: '1', name: 'First Version', phone: '111' },
      { id: '2', name: 'Second Customer', phone: '222' },
    ]);
  });
});
