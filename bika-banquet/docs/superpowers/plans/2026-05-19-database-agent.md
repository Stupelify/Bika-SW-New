# Database Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix N+1 query loop in booking history, centralize duplicated financial calculation logic, and optimize phone number search from full-table scan to indexed lookup.

**Architecture:** All changes are confined to `server/src/controllers/booking.controller.ts`. The N+1 is replaced with a single recursive CTE via `prisma.$queryRaw`. Financial totals are extracted into a pure helper `sumBookingLines()` called from all three write paths. Phone search adds a `pg_trgm` GIN index via Prisma migration so the existing `contains` clauses hit an index instead of scanning.

**Tech Stack:** Node.js, TypeScript, Prisma ORM, PostgreSQL, Jest + supertest (added in Task 0)

**Execution order:** Run this plan BEFORE the Backend Agent plan. Both touch `booking.controller.ts`; database fixes go in first, then the backend agent splits the file.

**Run all test commands from:** `/Users/harshitgoyal/Downloads/files/bika-banquet/server`

---

## Task 0: Install and configure Jest + supertest

**Files:**
- Create: `server/jest.config.ts`
- Create: `server/src/__tests__/setup.ts`
- Modify: `server/package.json` (add scripts + devDependencies)
- Create: `server/tsconfig.test.json`

- [ ] **Step 1: Install test dependencies**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Create jest config**

Create `server/jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 15000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
```

- [ ] **Step 3: Create test setup file**

Create `server/src/__tests__/setup.ts`:
```typescript
import prisma from '../config/database';

afterAll(async () => {
  await prisma.$disconnect();
});
```

- [ ] **Step 4: Add test script to package.json**

In `server/package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Verify Jest runs**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest --listTests
```

Expected: no errors, empty list (no tests yet).

- [ ] **Step 6: Commit**

```bash
git add server/jest.config.ts server/src/__tests__/setup.ts server/package.json
git commit -m "chore: add Jest + supertest for server integration tests"
```

---

## Task 1: Fix N+1 query loop in `getBookingHistory`

**Problem:** `booking.controller.ts:2419` and `2435` each fire one DB query per version in two separate while loops to walk the version chain. A booking with 10 versions fires 20 queries. Replace with a single recursive CTE.

**Files:**
- Modify: `server/src/controllers/booking.controller.ts:2417-2447`
- Create: `server/src/__tests__/booking-history.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/booking-history.test.ts`:
```typescript
import prisma from '../config/database';

describe('getBookingHistory — version chain query count', () => {
  it('resolves a 3-version chain with exactly 1 DB query', async () => {
    const queryCounts: number[] = [];
    const origQueryRaw = prisma.$queryRaw.bind(prisma);
    (prisma as any).$queryRaw = (...args: any[]) => {
      queryCounts.push(1);
      return origQueryRaw(...args);
    };

    // Build a 3-node chain in the test DB:
    // root → v2 → v3 (previousBookingId links)
    const root = await prisma.booking.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!root) {
      console.log('No bookings in DB — skipping chain test');
      return;
    }

    // Re-run the helper directly (import it once it is extracted)
    const { resolveVersionChain } = await import('../controllers/booking.helpers');
    await resolveVersionChain(root.id);

    expect(queryCounts.length).toBe(1);
    (prisma as any).$queryRaw = origQueryRaw;
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (helper doesn't exist yet)**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest booking-history --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module '../controllers/booking.helpers'`

- [ ] **Step 3: Create `booking.helpers.ts` with `resolveVersionChain`**

Create `server/src/controllers/booking.helpers.ts`:
```typescript
import prisma from '../config/database';

interface VersionRow {
  id: string;
}

/**
 * Returns all booking IDs in the version chain containing `anchorId`,
 * ordered from root to latest — using a single recursive CTE query.
 */
export async function resolveVersionChain(anchorId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<VersionRow[]>`
    WITH RECURSIVE chain AS (
      -- Walk backward to find root
      SELECT b.id, b."previousBookingId"
      FROM "Booking" b
      WHERE b.id = ${anchorId}

      UNION ALL

      SELECT b.id, b."previousBookingId"
      FROM "Booking" b
      INNER JOIN chain c ON b.id = c."previousBookingId"
    ),
    root AS (
      SELECT id FROM chain WHERE "previousBookingId" IS NULL LIMIT 1
    ),
    forward AS (
      -- Walk forward from root
      SELECT b.id, b."previousBookingId"
      FROM "Booking" b
      INNER JOIN root r ON b.id = r.id

      UNION ALL

      SELECT b.id, b."previousBookingId"
      FROM "Booking" b
      INNER JOIN forward f ON b."previousBookingId" = f.id
    )
    SELECT id FROM forward
  `;

  return rows.map((r) => r.id);
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest booking-history --no-coverage 2>&1 | tail -10
```

Expected: `PASS src/__tests__/booking-history.test.ts`

- [ ] **Step 5: Replace the two while loops in `getBookingHistory`**

In `server/src/controllers/booking.controller.ts`, find the section starting at line ~2417 containing:

```typescript
    let rootId = anchor.id;
    let cursor = anchor;
    while (cursor.previousBookingId) {
      const previous = await prisma.booking.findUnique({
        where: { id: cursor.previousBookingId },
        select: {
          id: true,
          previousBookingId: true,
        },
      });
      if (!previous) break;
      rootId = previous.id;
      cursor = previous;
    }

    const lineageIds: string[] = [];
    let nextCursorId: string | null = rootId;
    let guard = 0;
    while (nextCursorId && guard < 200) {
      lineageIds.push(nextCursorId);
      const nextVersionRow: { id: string } | null = await prisma.booking.findFirst({
        where: {
          previousBookingId: nextCursorId,
        },
        select: {
          id: true,
        },
      });
      nextCursorId = nextVersionRow?.id || null;
      guard += 1;
    }
```

Replace with:
```typescript
    const { resolveVersionChain } = await import('./booking.helpers');
    const lineageIds = await resolveVersionChain(anchor.id);
```

Add the import at the top of `booking.controller.ts` (after existing imports):
```typescript
import { resolveVersionChain } from './booking.helpers';
```

(Use static import at top, remove the dynamic `await import` from above — dynamic import was a placeholder for the test step.)

Final replacement in controller:
```typescript
    const lineageIds = await resolveVersionChain(anchor.id);
```

- [ ] **Step 6: Verify server compiles**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/booking.helpers.ts \
        server/src/controllers/booking.controller.ts \
        server/src/__tests__/booking-history.test.ts
git commit -m "perf: replace N+1 version-chain loop with single recursive CTE"
```

---

## Task 2: Centralize booking financial calculations

**Problem:** Total amount calculation is copy-pasted at `booking.controller.ts:1472` (`recalculateBookingFinancials`), `:1735` (`createBooking`), and `:3363` (`updateBooking`). A bug fix must be applied in three places.

**Files:**
- Modify: `server/src/controllers/booking.helpers.ts` (add `sumBookingLines`)
- Modify: `server/src/controllers/booking.controller.ts:1735-1760` and `:3363-3390`
- Create: `server/src/__tests__/booking-financials.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/booking-financials.test.ts`:
```typescript
import { sumBookingLines } from '../controllers/booking.helpers';

describe('sumBookingLines', () => {
  it('sums hall, pack, and additional charges', () => {
    const result = sumBookingLines({
      halls: [{ charges: 5000 }, { charges: 3000 }],
      packs: [
        { ratePerPlate: 100, packCount: 50, noOfPack: null, setupCost: 500, extraCharges: 200 },
      ],
      additionalItems: [{ charges: 150, quantity: 4 }],
    });
    // halls: 8000, pack: 100*50+500+200=5700, additional: 150*4=600
    expect(result).toBe(14300);
  });

  it('defaults packCount to 1 when zero', () => {
    const result = sumBookingLines({
      halls: [],
      packs: [{ ratePerPlate: 200, packCount: 0, noOfPack: 0, setupCost: 0, extraCharges: 0 }],
      additionalItems: [],
    });
    // packCount=0 → Math.max(1,0)=1 → 200*1=200
    expect(result).toBe(200);
  });

  it('defaults quantity to 1 for additional items', () => {
    const result = sumBookingLines({
      halls: [],
      packs: [],
      additionalItems: [{ charges: 300, quantity: null }],
    });
    expect(result).toBe(300);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest booking-financials --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module` or `sumBookingLines is not a function`

- [ ] **Step 3: Add `sumBookingLines` to `booking.helpers.ts`**

Append to `server/src/controllers/booking.helpers.ts`:
```typescript
interface HallLine { charges: number | null | undefined }
interface PackLine {
  ratePerPlate: number | null | undefined;
  packCount: number | null | undefined;
  noOfPack: number | null | undefined;
  setupCost: number | null | undefined;
  extraCharges: number | null | undefined;
}
interface AdditionalLine { charges: number | null | undefined; quantity: number | null | undefined }

function safeMoney(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function safeNum(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function sumBookingLines(input: {
  halls: HallLine[];
  packs: PackLine[];
  additionalItems: AdditionalLine[];
}): number {
  const hallTotal = input.halls.reduce((s, h) => s + safeMoney(h.charges), 0);
  const packTotal = input.packs.reduce((s, p) => {
    const count = Math.max(1, safeNum(p.packCount ?? p.noOfPack ?? 1));
    return s + safeMoney(p.ratePerPlate) * count + safeMoney(p.setupCost) + safeMoney(p.extraCharges);
  }, 0);
  const additionalTotal = input.additionalItems.reduce(
    (s, a) => s + safeMoney(a.charges) * Math.max(1, safeNum(a.quantity ?? 1)),
    0
  );
  return safeMoney(hallTotal + packTotal + additionalTotal);
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest booking-financials --no-coverage 2>&1 | tail -10
```

Expected: `PASS src/__tests__/booking-financials.test.ts` (3 tests passing)

- [ ] **Step 5: Replace inline calc in `createBooking` (~line 1735)**

In `booking.controller.ts`, find the block starting with `// Calculate totals` around line 1735 inside `createBooking`. It looks like:

```typescript
      // Calculate totals
      let totalAmount = 0;

      // Add hall charges
      if (hallRowsInput.length > 0) {
        totalAmount += hallRowsInput.reduce((sum: number, h) => sum + toSafeMoney(h.charges), 0);
      }

      // Add pack charges
      if (data.packs) {
        for (const pack of data.packs) {
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );
          const packTotal =
            toSafeMoney(pack.ratePerPlate) * normalizedPackCount +
            toSafeMoney(pack.setupCost) +
            toSafeMoney(pack.extraCharges);
          totalAmount += packTotal;
        }
```

The full block continues with additionalItems. Replace it by reading the data already staged in the transaction, then calling `sumBookingLines`. Find the nearest point where `hallRowsInput`, `data.packs`, and `data.additionalItems` are available and replace the manual totalAmount accumulation:

```typescript
      const totalAmount = sumBookingLines({
        halls: hallRowsInput,
        packs: data.packs ?? [],
        additionalItems: data.additionalItems ?? [],
      });
```

Add import at top of `booking.controller.ts`:
```typescript
import { resolveVersionChain, sumBookingLines } from './booking.helpers';
```

- [ ] **Step 6: Replace inline calc in `recalculateBookingFinancials` (~line 1472)**

Find the block in `recalculateBookingFinancials` around line 1472:
```typescript
  const hallTotal = booking.halls.reduce(...)
  const packTotal = booking.packs.reduce(...)
  const additionalTotal = booking.additionalItems.reduce(...)
  const totalAmount = toSafeMoney(hallTotal + packTotal + additionalTotal);
```

Replace those four lines with:
```typescript
  const totalAmount = sumBookingLines({
    halls: booking.halls,
    packs: booking.packs,
    additionalItems: booking.additionalItems,
  });
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add server/src/controllers/booking.helpers.ts \
        server/src/controllers/booking.controller.ts \
        server/src/__tests__/booking-financials.test.ts
git commit -m "refactor: centralize booking financial calculation in sumBookingLines helper"
```

---

## Task 3: Optimize phone number search (add GIN index)

**Problem:** `booking.controller.ts:1965-1978` — search fans out across 8 phone fields with `contains` (case-insensitive `ILIKE '%term%'`), causing a full table scan on the `Customer` table every search keystroke.

**Fix:** Add a `pg_trgm` GIN index on the most-searched phone field (`phoneE164`) via Prisma migration. Keep the `contains` query clauses as-is (Postgres will use the index automatically for trigram matching when `pg_trgm` is enabled).

**Files:**
- Create: `server/prisma/migrations/20260519_add_phone_trgm_index/migration.sql`
- Modify: `server/prisma/schema.prisma` (add `@@index` directive)
- Create: `server/src/__tests__/phone-search.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/phone-search.test.ts`:
```typescript
import prisma from '../config/database';

describe('phone search uses pg_trgm index', () => {
  it('pg_trgm extension is enabled on the database', async () => {
    const result = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM pg_extension WHERE name = 'pg_trgm'
    `;
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('pg_trgm');
  });

  it('GIN index on phoneE164 exists', async () => {
    const result = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'Customer'
      AND indexdef LIKE '%gin%'
      AND indexdef LIKE '%phoneE164%'
    `;
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (extension and index not yet created)**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest phone-search --no-coverage 2>&1 | tail -15
```

Expected: both assertions fail.

- [ ] **Step 3: Create Prisma migration SQL**

Create `server/prisma/migrations/20260519000000_add_phone_trgm_index/migration.sql`:
```sql
-- Enable trigram extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fast LIKE/ILIKE on phoneE164
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_phoneE164_trgm_idx"
ON "Customer" USING gin ("phoneE164" gin_trgm_ops);

-- GIN index for phone (legacy field) 
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_phone_trgm_idx"
ON "Customer" USING gin ("phone" gin_trgm_ops);
```

- [ ] **Step 4: Apply migration**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx prisma migrate dev --name add_phone_trgm_index
```

Expected: migration applied, no errors. If `CREATE INDEX CONCURRENTLY` is not allowed inside a migration transaction, run the SQL manually:

```bash
npx prisma db execute --file prisma/migrations/20260519000000_add_phone_trgm_index/migration.sql
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest phone-search --no-coverage 2>&1 | tail -10
```

Expected: `PASS src/__tests__/phone-search.test.ts` (2 tests passing)

- [ ] **Step 6: Run full test suite**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest --no-coverage 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/prisma/migrations/20260519000000_add_phone_trgm_index/ \
        server/prisma/schema.prisma \
        server/src/__tests__/phone-search.test.ts
git commit -m "perf: add pg_trgm GIN index on Customer phone fields for search"
```

---

## Edge Cases to Verify Manually

After all tasks complete, verify these in the running dev server:

1. **History with 1 version** — booking with no `previousBookingId`. `resolveVersionChain` should return `[bookingId]`.
2. **History with circular reference** — should not infinite loop (CTE handles this by nature of set semantics).
3. **Financial calc with zero packs** — `sumBookingLines({ halls: [{charges: 1000}], packs: [], additionalItems: [] })` → `1000`.
4. **Phone search with partial number** — searching `9830` should return customers whose `phoneE164` contains `9830`, faster than before.
5. **TypeScript strict mode** — `npx tsc --noEmit --strict` should pass.
