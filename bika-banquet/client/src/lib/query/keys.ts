export const STALE_TIME_MS = 30_000;

export const queryKeys = {
  bookings: {
    all: ['bookings'] as const,
    list: (params: { page: number; limit: number } = { page: 1, limit: 5000 }) =>
      ['bookings', 'list', params] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: () => ['customers', 'list'] as const,
  },
  enquiries: {
    all: ['enquiries'] as const,
    list: (status: string) => ['enquiries', 'list', { status }] as const,
  },
} as const;
