/**
 * Tests for dashboard debounce bugs — plain Node.js logic tests.
 *
 * BUG 2: Dashboard debounce timer not cleaned up on unmount
 * BUG 4: Non-dashboard pages have no debounce on SSE callbacks
 *
 * Run with: npx ts-node client/src/__tests__/dashboardDebounce.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

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
// BUG 2 — Dashboard debounce timer not cleaned up on unmount
//
// Simulates the debounce pattern used in dashboard/page.tsx.
// Bug: there is no cleanup function that clears the debounce timer on unmount.
// After unmount, if a debounce timer fires it calls loadDashboardData() on an
// unmounted component (the loadFn still has a closure over stale state).
//
// Test: simulate unmount (cleanup) before debounce fires. With the bug,
// the callback IS called after cleanup. After fix, it should NOT be called.
// ---------------------------------------------------------------------------

function simulateDebounce(options: { cleanupOnUnmount: boolean }): Promise<number> {
  return new Promise((resolve) => {
    let callCount = 0;
    const loadDashboardData = () => { callCount++; };

    // Simulate debounceTimerRef
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadDashboardData();
      }, 50); // use 50ms for test speed
    };

    // Simulate cleanup function (what a useEffect cleanup would do)
    const cleanup = () => {
      if (options.cleanupOnUnmount && debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      // If NOT cleaning up (buggy), the timer keeps running
    };

    // Trigger SSE event (sets debounce timer)
    debouncedLoad();

    // Simulate unmount at 10ms (before the 50ms debounce fires)
    setTimeout(() => {
      cleanup();
    }, 10);

    // Check at 100ms (after debounce would have fired)
    setTimeout(() => {
      resolve(callCount);
    }, 100);
  });
}

test('Bug 2 BEFORE fix: debounce fires after unmount when no cleanup (callback called once)', async () => {
  const callCount = await simulateDebounce({ cleanupOnUnmount: false });
  // Without cleanup, the debounce timer fires even after unmount
  assert.strictEqual(callCount, 1,
    `Expected 1 call (demonstrating leak: debounce fired after unmount), got ${callCount}`);
});

test('Bug 2 AFTER fix: debounce is cancelled on unmount (callback not called)', async () => {
  const callCount = await simulateDebounce({ cleanupOnUnmount: true });
  // With cleanup, the debounce timer is cancelled before it fires
  assert.strictEqual(callCount, 0,
    `Expected 0 calls (debounce properly cancelled on unmount), got ${callCount}`);
});

test('Bug 2 source check: dashboard/page.tsx has no cleanup for debounceTimerRef', () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    'client/src/app/dashboard/page.tsx'
  );
  const source = fs.readFileSync(dashboardPath, 'utf-8');
  // The bug: debounceTimerRef is used but no cleanup effect clears it on unmount.
  // Look for a cleanup effect that references debounceTimerRef
  // A proper cleanup would look like: return () => { ... clearTimeout(debounceTimerRef.current) ... }
  // combined with an empty-dep useEffect
  const hasDebounceRef = source.includes('debounceTimerRef');
  assert.ok(hasDebounceRef, 'debounceTimerRef should exist in dashboard/page.tsx');

  // Check whether there's a cleanup that clears debounceTimerRef
  // The pattern would be something like: clearTimeout(debounceTimerRef.current)
  // inside a return () => { ... } inside a useEffect with [] deps
  const hasCleanup = /return\s*\(\s*\)\s*=>\s*\{[^}]*clearTimeout\s*\(\s*debounceTimerRef/.test(source);
  // This should be false (bug exists) — test asserts the bug is present
  assert.strictEqual(hasCleanup, false,
    'Expected NO cleanup for debounceTimerRef (bug exists), but a cleanup was found');
});

// ---------------------------------------------------------------------------
// BUG 4 — No debounce on SSE handler for non-dashboard pages
//
// Simulates rapid-fire SSE events hitting a non-debounced handler.
// With the bug: every event immediately calls the load function.
// After fix: rapid events are collapsed to one call via debounce.
// ---------------------------------------------------------------------------

function simulateRapidSSEEvents(options: { debounced: boolean }): Promise<number> {
  return new Promise((resolve) => {
    let callCount = 0;
    const loadData = () => { callCount++; };

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const onEvent = options.debounced
      ? () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => { loadData(); }, 50);
        }
      : () => { loadData(); }; // buggy: no debounce

    // Fire 5 rapid SSE events in quick succession (10ms apart)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => onEvent(), i * 10);
    }

    // Check at 200ms (after all events and any debounce would settle)
    setTimeout(() => {
      resolve(callCount);
    }, 200);
  });
}

test('Bug 4 BEFORE fix: rapid SSE events call loadData 5 times (no debounce)', async () => {
  const callCount = await simulateRapidSSEEvents({ debounced: false });
  assert.strictEqual(callCount, 5,
    `Expected 5 calls (demonstrating missing debounce bug), got ${callCount}`);
});

test('Bug 4 AFTER fix: rapid SSE events collapsed to 1 call via debounce', async () => {
  const callCount = await simulateRapidSSEEvents({ debounced: true });
  assert.strictEqual(callCount, 1,
    `Expected 1 call (debounce working correctly), got ${callCount}`);
});

test('Bug 4 source check: customers/page.tsx passes raw loadCustomers to useSSE (no debounce)', () => {
  const customersPath = path.resolve(
    process.cwd(),
    'client/src/app/dashboard/customers/page.tsx'
  );
  const source = fs.readFileSync(customersPath, 'utf-8');
  // Bug: the second argument to useSSE is the raw load function, not a debounced version
  // Look for useSSE(... loadCustomers ...) pattern
  const useSSELine = source.match(/useSSE\([^)]+\)/)?.[0] ?? '';
  const usesDebounce = useSSELine.includes('debounced') || useSSELine.includes('Debounced');
  assert.strictEqual(usesDebounce, false,
    'Expected customers/page.tsx to pass non-debounced callback to useSSE (bug exists)');
});

test('Bug 4 source check: enquiries/page.tsx passes raw loadEnquiries to useSSE (no debounce)', () => {
  const enquiriesPath = path.resolve(
    process.cwd(),
    'client/src/app/dashboard/enquiries/page.tsx'
  );
  const source = fs.readFileSync(enquiriesPath, 'utf-8');
  const useSSELine = source.match(/useSSE\([^)]+\)/)?.[0] ?? '';
  const usesDebounce = useSSELine.includes('debounced') || useSSELine.includes('Debounced');
  assert.strictEqual(usesDebounce, false,
    'Expected enquiries/page.tsx to pass non-debounced callback to useSSE (bug exists)');
});

test('Bug 4 source check: payments/page.tsx passes raw loadBookings to useSSE (no debounce)', () => {
  const paymentsPath = path.resolve(
    process.cwd(),
    'client/src/app/dashboard/payments/page.tsx'
  );
  const source = fs.readFileSync(paymentsPath, 'utf-8');
  const useSSELine = source.match(/useSSE\([^)]+\)/)?.[0] ?? '';
  const usesDebounce = useSSELine.includes('debounced') || useSSELine.includes('Debounced');
  assert.strictEqual(usesDebounce, false,
    'Expected payments/page.tsx to pass non-debounced callback to useSSE (bug exists)');
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
setTimeout(() => {
  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}, 300);
