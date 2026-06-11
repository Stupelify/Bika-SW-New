'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { buildSseEventStreamUrl } from '@/lib/dashboardNavigation';
import { matchesEventPrefix, nextBackoffDelay } from '@/lib/sseSubscription';
import { useSseStatusStore, type SseConnectionStatus } from '@/lib/sseStatusStore';

let sseInstanceCounter = 0;

export function useSSE(
  eventPrefixes: string[],
  onEvent: () => void,
  enabled: boolean
): void {
  const prefixesRef = useRef(eventPrefixes);
  prefixesRef.current = eventPrefixes;

  // Hold onEvent in a ref so the latest handler is used WITHOUT re-running the
  // subscription effect. Re-subscribing on every onEvent change (which changes
  // on each navigation) used to leak EventSource connections via the async
  // open / sync cleanup race -> duplicated refetches -> duplicated bookings.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    // Report connection state so the UI can show Live / Reconnecting / Offline
    // instead of silently serving stale data while disconnected.
    const instanceId = `sse-${(sseInstanceCounter += 1)}`;
    const reportStatus = (status: SseConnectionStatus) => {
      if (!cancelled) useSseStatusStore.getState().setStatus(instanceId, status);
    };
    reportStatus('connecting');

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) return;
      reportStatus(attempt >= 3 ? 'offline' : 'reconnecting');
      const delay = nextBackoffDelay(attempt);
      attempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void openSseConnection();
      }, delay);
    };

    const openSseConnection = async () => {
      if (cancelled) return;
      try {
        const res = await api.getSseToken();
        // Race guard: if cleanup ran while the token fetch was in flight, do not
        // open (and leak) a connection.
        if (cancelled) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const source = new EventSource(buildSseEventStreamUrl(baseUrl, res.data.token));
        if (cancelled) {
          source.close();
          return;
        }
        eventSource = source;

        source.onopen = () => {
          attempt = 0; // reset backoff once connected
          reportStatus('connected');
        };

        source.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string };
            if (matchesEventPrefix(payload.type, prefixesRef.current)) {
              onEventRef.current();
            }
          } catch {
            // Ignore malformed SSE payloads.
          }
        };

        source.onerror = () => {
          // Connection dropped — close and reconnect with capped backoff.
          source.close();
          if (eventSource === source) eventSource = null;
          scheduleReconnect();
        };
      } catch {
        // SSE token fetch failed — retry with backoff; page still works without realtime.
        scheduleReconnect();
      }
    };

    void openSseConnection();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
      useSseStatusStore.getState().removeStatus(instanceId);
    };
  }, [enabled]);
}
