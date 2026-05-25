'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { buildSseEventStreamUrl } from '@/lib/dashboardNavigation';

export function useSSE(
  eventPrefixes: string[],
  onEvent: () => void,
  enabled: boolean
): void {
  const prefixesRef = useRef(eventPrefixes);
  prefixesRef.current = eventPrefixes;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const openSseConnection = async () => {
      try {
        const res = await api.getSseToken();
        if (cancelled) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        eventSource = new EventSource(buildSseEventStreamUrl(baseUrl, res.data.token));

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string };
            if (prefixesRef.current.some((prefix) => payload.type?.startsWith(prefix))) {
              onEvent();
            }
          } catch {
            // Ignore malformed SSE payloads.
          }
        };
      } catch {
        // SSE token fetch failed — real-time updates unavailable, page still works.
      }
    };

    void openSseConnection();

    return () => {
      cancelled = true;
      eventSource?.close();
    };
  }, [enabled, onEvent]);
}
