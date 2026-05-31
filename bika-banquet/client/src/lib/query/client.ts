'use client';

import { QueryClient } from '@tanstack/react-query';
import { STALE_TIME_MS } from './keys';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
