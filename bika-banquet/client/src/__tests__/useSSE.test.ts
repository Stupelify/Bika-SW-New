/**
 * Tests for useSSE hook bugs — plain Node.js logic tests (no React Testing Library).
 *
 * Run with: node --experimental-vm-modules client/src/__tests__/useSSE.test.ts
 * Or: npx ts-node client/src/__tests__/useSSE.test.ts
 *
 * These tests validate the logic extracted from useSSE.ts and related hooks.
 * They run without a browser or React environment.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  Promise.resolve().then(() => fn()).then(
    () => {
      console.log(`  PASS: ${name}`);
      passed++;
    },
    (err: unknown) => {
      console.error(`  FAIL: ${name}`);
      console.error(`        ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    },
  );
}

// ---------------------------------------------------------------------------
// BUG 1 — Double-fetch on page load
//
// Simulates the useSSE hook logic directly. The bug is that `eventSource.onopen`
// calls `onEvent()` unconditionally on every connection open, causing a
// double-fetch on page load (the page's own mount effect also calls onEvent).
//
// The CORRECT behaviour (after fix): onopen should NOT call onEvent().
// ---------------------------------------------------------------------------

async function simulateUseSSELogic(options: {
  callOnEventInOnopen: boolean; // true = buggy, false = fixed
}): Promise<{ onEventCallCount: number }> {
  let onEventCallCount = 0;
  const onEvent = () => { onEventCallCount++; };

  // Mock EventSource
  class MockEventSource {
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;

    constructor() {
      // Simulate connection opening after microtask
      Promise.resolve().then(() => {
        if (options.callOnEventInOnopen && this.onopen) {
          this.onopen();
        }
        // Also simulate a booking:created event arriving immediately
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify({ type: 'booking:created' }) });
        }
      });
    }

    close() {}
  }

  // Simulate getSseToken
  const getSseToken = async () => ({ data: { token: 'mock-token' } });

  // Simulate the hook logic (mirrors useSSE.ts)
  const eventPrefixes = ['booking:'];
  let eventSource: MockEventSource | null = null;
  let cancelled = false;

  const openSseConnection = async () => {
    try {
      const res = await getSseToken();
      if (cancelled) return;
      eventSource = new MockEventSource();

      if (options.callOnEventInOnopen) {
        // BUGGY: calls onEvent on connection open
        eventSource.onopen = () => {
          onEvent();
        };
      }
      // (fixed version: no onopen handler)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string };
          if (eventPrefixes.some((prefix) => payload.type?.startsWith(prefix))) {
            onEvent();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  };

  await openSseConnection();

  // Wait for the async mock event dispatches
  await new Promise((resolve) => setTimeout(resolve, 10));

  eventSource?.close();
  return { onEventCallCount };
}

test('Bug 1 BEFORE fix: onopen calls onEvent causing double-fetch (2 calls for 1 SSE message)', async () => {
  const { onEventCallCount } = await simulateUseSSELogic({ callOnEventInOnopen: true });
  // Buggy: onopen fires once (count=1) + onmessage fires once (count=2)
  // This test demonstrates the bug exists — count > 1
  assert.strictEqual(onEventCallCount, 2,
    `Expected 2 calls (demonstrating the double-fetch bug), got ${onEventCallCount}`);
});

test('Bug 1 AFTER fix: without onopen handler, onEvent called exactly once per SSE message', async () => {
  const { onEventCallCount } = await simulateUseSSELogic({ callOnEventInOnopen: false });
  // Fixed: only onmessage fires (count=1)
  assert.strictEqual(onEventCallCount, 1,
    `Expected exactly 1 call (no double-fetch), got ${onEventCallCount}`);
});

test('Bug 1 source check: useSSE.ts contains onopen handler (bug exists in source)', () => {
  const useSSEPath = path.resolve(process.cwd(), 'client/src/hooks/useSSE.ts');
  const source = fs.readFileSync(useSSEPath, 'utf-8');
  const hasOnopen = source.includes('eventSource.onopen');
  assert.strictEqual(hasOnopen, true,
    'Expected useSSE.ts to contain eventSource.onopen (bug exists) — but it was not found');
});

// ---------------------------------------------------------------------------
// BUG 3 — Calendar page uses enabled = true unconditionally
//
// Reads the calendar page source and asserts useSSE is called with literal `true`.
// After fix this test should fail (because `true` will be replaced with a variable).
// ---------------------------------------------------------------------------

test('Bug 3 source check: calendar/page.tsx calls useSSE with hardcoded true', () => {
  const calendarPath = path.resolve(process.cwd(), 'client/src/app/dashboard/calendar/page.tsx');
  const source = fs.readFileSync(calendarPath, 'utf-8');
  // The bug: useSSE called with literal `true` as third argument
  const hasHardcodedTrue = /useSSE\([^)]*,\s*true\s*\)/.test(source);
  assert.strictEqual(hasHardcodedTrue, true,
    'Expected calendar/page.tsx to call useSSE(..., true) [bug], but the pattern was not found');
});

// ---------------------------------------------------------------------------
// BUG 5 — Verify booking.write.ts emits broadcasts
//
// Reads booking.write.ts and asserts broadcastBookingEvent (or emitBookingBroadcast) is called.
// This test should PASS both before and after fixes (bug 5 is already implemented).
// ---------------------------------------------------------------------------

test('Bug 5 already fixed: booking.write.ts emits booking broadcasts', () => {
  const bookingWritePath = path.resolve(
    process.cwd(),
    'server/src/controllers/booking.write.ts'
  );
  const source = fs.readFileSync(bookingWritePath, 'utf-8');
  const hasBroadcast =
    source.includes('emitBookingBroadcast') || source.includes('broadcastBookingEvent');
  assert.strictEqual(hasBroadcast, true,
    'Expected booking.write.ts to call emitBookingBroadcast or broadcastBookingEvent, but none found');
});

// ---------------------------------------------------------------------------
// Report after all microtasks settle
// ---------------------------------------------------------------------------
setTimeout(() => {
  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}, 100);
