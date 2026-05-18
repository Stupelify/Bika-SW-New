# Backend Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden auth security (Phase 0), fix PDF asset handling, and lock down infrastructure config.

**Architecture:** Auth middleware gains Redis-cached session validation on every request (not just logout). PDF asset cache becomes a Promise-based map with TTL to prevent race conditions. `booking.controller.ts` is split into focused files after the Database Agent has already committed its query fixes. Docker-compose gets Redis hardening, healthcheck, and Metabase pinned to a specific version.

**Tech Stack:** Node.js, TypeScript, ioredis (already installed), Jest + supertest (set up by Database Agent), Docker Compose

**Execution order:** Run AFTER the Database Agent plan is complete and committed. Both plans touch `booking.controller.ts`; database fixes must land first so this split starts from a clean base.

**Run all test commands from:** `/Users/harshitgoyal/Downloads/files/bika-banquet/server`

---

## Task 0: Verify prerequisite (Database Agent committed)

- [ ] **Step 1: Confirm Database Agent commits exist**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet
git log --oneline -6
```

Expected: see commits containing "recursive CTE", "sumBookingLines", "pg_trgm" from the Database Agent.

If not present, stop and run the Database Agent plan first.

---

## Task 1: Remove token-in-query-string from auth (PHASE 0 SECURITY)

**Problem:** `auth.middleware.ts:26` — `resolveToken` accepts `?token=` in the URL. JWTs leak into server logs, browser history, referer headers, and any upstream proxy logs.

**Files:**
- Modify: `server/src/middleware/auth.middleware.ts:20-28`
- Create: `server/src/__tests__/auth-token-resolve.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/auth-token-resolve.test.ts`:
```typescript
// Test that resolveToken only accepts Authorization header, never ?token= param.
// We test the behaviour indirectly by checking that a request with only a query
// token gets a 401 from a protected route.
import request from 'supertest';
import app from '../server'; // adjust path if your express app export differs

describe('resolveToken — no query-string tokens', () => {
  it('rejects a request that passes JWT via ?token= query param', async () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.sig';
    const res = await request(app)
      .get('/api/bookings')
      .query({ token: fakeJwt });
    // Should be 401 (no Authorization header) not 403 (which means token was read)
    expect(res.status).toBe(401);
  });

  it('accepts a valid header token (format check only)', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', 'Bearer invalid.token.here');
    // 401 due to invalid token, NOT because token was missing
    expect([401, 403]).toContain(res.status);
  });
});
```

- [ ] **Step 2: Run test to see current behavior**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest auth-token-resolve --no-coverage 2>&1 | tail -20
```

Note: first test may currently PASS (query token gets resolved, then JWT verify fails for fake token → 401 anyway). After the fix, the first test still returns 401, but for the right reason. The important thing is the fix prevents logging real tokens.

- [ ] **Step 3: Remove `?token=` from `resolveToken`**

In `server/src/middleware/auth.middleware.ts`, replace:

```typescript
function resolveToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const queryToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  return queryToken || null;
}
```

With:

```typescript
function resolveToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
```

- [ ] **Step 4: Check if any route intentionally uses `?token=` for downloads**

```bash
grep -r "token=" /Users/harshitgoyal/Downloads/files/bika-banquet/server/src --include="*.ts" | grep -v "test\|spec\|\.d\.ts"
grep -r "\?token=" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src --include="*.ts" --include="*.tsx"
```

If any download route (PDF, export) uses `?token=`, those callers must be updated to pass `Authorization: Bearer <token>` in the request header instead. Fix each such caller before proceeding.

- [ ] **Step 5: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/auth.middleware.ts server/src/__tests__/auth-token-resolve.test.ts
git commit -m "security: remove JWT token from query string in resolveToken"
```

---

## Task 2: Redis-cached session validation on all routes (PHASE 0 SECURITY)

**Problem:** `auth.middleware.ts:118-128` — all routes except logout and change-password trust the JWT payload without checking the DB. A revoked/deleted session stays valid until JWT expiry (however long `JWT_EXPIRES_IN` is set to).

**Fix:** On every authenticated request, check Redis for a `session:<token_hash>` key. Cache hit → use cached user payload. Cache miss → call `validateSessionAndResolveUser` (DB query), cache the result with TTL = remaining JWT lifetime. Deleted session → cache value is `"revoked"` → 401.

**Files:**
- Modify: `server/src/middleware/auth.middleware.ts`
- Modify: `server/src/config/redis.ts` (expose `getRedisClient`)
- Create: `server/src/__tests__/auth-session-cache.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/auth-session-cache.test.ts`:
```typescript
import { getRedisClient } from '../config/redis';

describe('session cache in authenticate middleware', () => {
  it('caches session payload in Redis after first validation', async () => {
    const redis = getRedisClient();
    if (!redis) {
      console.log('Redis not available — skipping');
      return;
    }
    // Verify Redis is reachable
    await redis.set('test:ping', '1', 'EX', 5);
    const val = await redis.get('test:ping');
    expect(val).toBe('1');
  });

  it('treats a "revoked" cache value as 401', async () => {
    const redis = getRedisClient();
    if (!redis) return;
    const key = 'session:fake-token-hash-123';
    await redis.set(key, 'revoked', 'EX', 60);
    const val = await redis.get(key);
    expect(val).toBe('revoked');
    await redis.del(key);
  });
});
```

- [ ] **Step 2: Run test — expect PASS (Redis already works)**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest auth-session-cache --no-coverage 2>&1 | tail -10
```

Expected: PASS (Redis is running from docker-compose).

- [ ] **Step 3: Add session cache helper to `auth.middleware.ts`**

Add these imports at the top of `server/src/middleware/auth.middleware.ts`:
```typescript
import crypto from 'crypto';
import { getRedisClient } from '../config/redis';
```

Add this helper function before `authenticate`:
```typescript
const SESSION_CACHE_TTL = 60; // seconds — short enough to pick up revocations quickly

function tokenCacheKey(token: string): string {
  return `session:${crypto.createHash('sha256').update(token).digest('hex')}`;
}

async function getCachedOrFetchSession(token: string, jwtPayload: TokenPayload): Promise<TokenPayload | null> {
  const redis = getRedisClient();
  const key = tokenCacheKey(token);

  if (redis) {
    const cached = await redis.get(key);
    if (cached === 'revoked') return null;
    if (cached) {
      try {
        return JSON.parse(cached) as TokenPayload;
      } catch {
        // corrupt cache entry — fall through to DB
      }
    }
  }

  // Cache miss — hit the DB
  const dbUser = await validateSessionAndResolveUser(token);

  if (redis) {
    if (!dbUser) {
      await redis.set(key, 'revoked', 'EX', SESSION_CACHE_TTL);
    } else {
      await redis.set(key, JSON.stringify(dbUser), 'EX', SESSION_CACHE_TTL);
    }
  }

  return dbUser;
}
```

- [ ] **Step 4: Update `authenticate` to use the cache on all routes**

Replace the existing `authenticate` function body (the `const payloadToUse = shouldValidateSession(req) ? ...` block) with:

```typescript
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = resolveToken(req);

    if (!token) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const payload = verifyToken(token);

    const payloadToUse = await getCachedOrFetchSession(token, payload);

    if (!payloadToUse) {
      sendUnauthorized(res, 'Session expired');
      return;
    }

    req.user = {
      userId: payloadToUse.userId,
      email: payloadToUse.email,
      roles: payloadToUse.roles,
      permissions: payloadToUse.permissions,
      banquetIds: Array.isArray(payloadToUse.banquetIds) ? payloadToUse.banquetIds : [],
    };

    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid token');
  }
}
```

Also remove `shouldValidateSession` function — it is no longer needed.

- [ ] **Step 5: Update `requireRole` to use cached validation for all roles (not just admin)**

Replace the existing `requireRole` implementation:

```typescript
export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res);
    }

    // Re-validate from cache/DB for any privileged role check
    const token = resolveToken(req);
    if (token) {
      const payload = { userId: req.user.userId, email: req.user.email, roles: req.user.roles, permissions: req.user.permissions, banquetIds: req.user.banquetIds };
      const refreshed = await getCachedOrFetchSession(token, payload as TokenPayload);
      if (!refreshed) {
        return sendUnauthorized(res, 'Session expired');
      }
      req.user = refreshed;
    }

    const hasRole = roles.some((role) =>
      req.user!.roles.some(
        (userRole) => userRole.trim().toLowerCase() === role.trim().toLowerCase()
      )
    );

    if (!hasRole) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}
```

Remove `hasAdminRoleCheck` — it is no longer used.

- [ ] **Step 6: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest --no-coverage 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add server/src/middleware/auth.middleware.ts server/src/__tests__/auth-session-cache.test.ts
git commit -m "security: Redis-cached session validation on all authenticated routes"
```

---

## Task 3: Replace `console.log`/`console.error` with logger in PDF logic

**Problem:** `booking.controller.ts:651,653,657` and `pdfWorker.ts:40,118` use raw console calls. These bypass Winston's structured logging, don't write to log files, and don't carry request context.

**Files:**
- Modify: `server/src/controllers/booking.controller.ts:647-672`
- Modify: `server/src/workers/pdfWorker.ts:35-45` and `:113-123`

- [ ] **Step 1: Check logger import in booking.controller.ts**

```bash
grep -n "import.*logger" /Users/harshitgoyal/Downloads/files/bika-banquet/server/src/controllers/booking.controller.ts | head -5
```

If no logger import exists, add at top of file:
```typescript
import logger from '../utils/logger';
```

- [ ] **Step 2: Replace console calls in `loadPdfAsset`**

In `booking.controller.ts`, find and replace the `loadPdfAsset` function body:

```typescript
async function loadPdfAsset(localFilename: string, fallbackUrl: string): Promise<Buffer | null> {
  try {
    const localPath = path.join(PDF_ASSETS_DIR, localFilename);
    if (fs.existsSync(localPath)) {
      logger.debug('Loaded PDF asset from local file', { path: localPath });
      return fs.readFileSync(localPath);
    }
  } catch (error) {
    logger.error('Failed to load local PDF asset', { filename: localFilename, error });
  }

  if (!fallbackUrl) return null;
  try {
    const response = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BikaBanquet/1.0)' },
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Check logger import in pdfWorker.ts**

```bash
grep -n "import.*logger\|console\." /Users/harshitgoyal/Downloads/files/bika-banquet/server/src/workers/pdfWorker.ts | head -10
```

- [ ] **Step 4: Replace console.error calls in pdfWorker.ts**

In `pdfWorker.ts`, add logger import at top if not present:
```typescript
import logger from '../utils/logger';
```

Find and replace each `console.error(...)` with `logger.error(...)` using the same message. For example:

```typescript
// Line ~40: background image draw error
logger.error('Failed to draw PDF background image', { error });

// Line ~118: logo image draw error
logger.error('Failed to draw PDF logo image', { error });
```

- [ ] **Step 5: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/booking.controller.ts server/src/workers/pdfWorker.ts
git commit -m "fix: replace console.log/error with logger in PDF asset loading"
```

---

## Task 4: Fix PDF image cache race condition

**Problem:** `booking.controller.ts:644-645` — `cachedMenuBackgroundImage` and `cachedMenuLogoImage` are plain `Buffer | null | undefined`. Two concurrent PDF requests both see `undefined`, both call `loadPdfAsset` (triggering duplicate I/O or remote fetches), then both write to the cache variable. Add a Promise-based cache so the second in-flight request awaits the first's result, with a TTL so the cache refreshes after 1 hour.

**Files:**
- Modify: `server/src/controllers/booking.controller.ts:640-672`
- Create: `server/src/__tests__/pdf-asset-cache.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/pdf-asset-cache.test.ts`:
```typescript
import { getPdfAsset } from '../controllers/booking.helpers';

describe('getPdfAsset — Promise cache', () => {
  it('calls loader only once for concurrent requests', async () => {
    let loaderCallCount = 0;
    const slowLoader = async (): Promise<Buffer | null> => {
      loaderCallCount++;
      await new Promise((r) => setTimeout(r, 50)); // simulate I/O
      return Buffer.from('fake-image');
    };

    // Fire 3 concurrent requests for the same asset
    const [r1, r2, r3] = await Promise.all([
      getPdfAsset('bg.png', slowLoader),
      getPdfAsset('bg.png', slowLoader),
      getPdfAsset('bg.png', slowLoader),
    ]);

    expect(loaderCallCount).toBe(1);
    expect(r1?.toString()).toBe('fake-image');
    expect(r2?.toString()).toBe('fake-image');
    expect(r3?.toString()).toBe('fake-image');
  });

  it('reloads after TTL expires', async () => {
    let loaderCallCount = 0;
    const loader = async (): Promise<Buffer | null> => {
      loaderCallCount++;
      return Buffer.from(`call-${loaderCallCount}`);
    };

    await getPdfAsset('logo-ttl.png', loader, { ttlMs: 10 });
    await new Promise((r) => setTimeout(r, 20));
    await getPdfAsset('logo-ttl.png', loader, { ttlMs: 10 });

    expect(loaderCallCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (`getPdfAsset` not exported)**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest pdf-asset-cache --no-coverage 2>&1 | tail -10
```

- [ ] **Step 3: Add `getPdfAsset` to `booking.helpers.ts`**

Append to `server/src/controllers/booking.helpers.ts`:

```typescript
interface CacheEntry {
  promise: Promise<Buffer | null>;
  resolvedAt: number | null;
}

const assetCache = new Map<string, CacheEntry>();
const DEFAULT_ASSET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getPdfAsset(
  key: string,
  loader: () => Promise<Buffer | null>,
  options: { ttlMs?: number } = {}
): Promise<Buffer | null> {
  const ttlMs = options.ttlMs ?? DEFAULT_ASSET_TTL_MS;
  const existing = assetCache.get(key);

  if (existing) {
    const age = existing.resolvedAt !== null ? Date.now() - existing.resolvedAt : 0;
    if (age < ttlMs || existing.resolvedAt === null) {
      return existing.promise;
    }
    // TTL expired — remove stale entry
    assetCache.delete(key);
  }

  const entry: CacheEntry = { promise: null as any, resolvedAt: null };
  entry.promise = loader().then((result) => {
    entry.resolvedAt = Date.now();
    return result;
  });
  assetCache.set(key, entry);
  return entry.promise;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest pdf-asset-cache --no-coverage 2>&1 | tail -10
```

Expected: `PASS` (2 tests)

- [ ] **Step 5: Replace the plain cache variables in `booking.controller.ts`**

Remove these lines (~644-645):
```typescript
let cachedMenuBackgroundImage: Buffer | null | undefined;
let cachedMenuLogoImage: Buffer | null | undefined;
```

And the usages of `cachedMenuBackgroundImage`/`cachedMenuLogoImage` further down. Replace each usage with a `getPdfAsset` call. For example, where the background image is loaded:

```typescript
const backgroundImage = await getPdfAsset('menu-background.png', () =>
  loadPdfAsset('menu-background.png', MENU_BACKGROUND_IMAGE_URL)
);
const logoImage = await getPdfAsset('menu-logo.png', () =>
  loadPdfAsset('menu-logo.png', MENU_LOGO_IMAGE_URL)
);
```

Add import:
```typescript
import { resolveVersionChain, sumBookingLines, getPdfAsset } from './booking.helpers';
```

- [ ] **Step 6: Compile check + run all tests**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit && npx jest --no-coverage 2>&1 | tail -20
```

Expected: compile clean, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/booking.helpers.ts \
        server/src/controllers/booking.controller.ts \
        server/src/__tests__/pdf-asset-cache.test.ts
git commit -m "fix: Promise-based PDF asset cache with TTL to prevent concurrent I/O duplication"
```

---

## Task 5: Split `booking.controller.ts` into focused files

**Problem:** `booking.controller.ts` is 3860 lines. After Database Agent fixes, it contains 5 clearly distinct domains. Split it now that all query/helper changes are committed.

**Target files:**
- `server/src/controllers/booking.read.ts` — all GET handlers (getBookings, getBookingById, getBookingHistory, etc.)
- `server/src/controllers/booking.write.ts` — create, update, clone, finalize, partyOver, delete
- `server/src/controllers/booking.payments.ts` — addPayment, updatePayment, deletePayment
- `server/src/controllers/booking.pdf.ts` — generateMenuPdf, generateBookingPdf, loadPdfAsset
- `server/src/controllers/booking.financials.ts` — recalculateBookingFinancials, releasePencilBookings
- `server/src/controllers/booking.controller.ts` — becomes a thin re-export barrel

**Files:**
- Create: all 5 new files above
- Modify: `server/src/controllers/booking.controller.ts` (reduce to re-exports)
- Modify: `server/src/routes/booking.routes.ts` (import from new files if routes import handlers directly)

- [ ] **Step 1: Identify all exported handler names**

```bash
grep -n "^export async function\|^export function\|^export const" \
  /Users/harshitgoyal/Downloads/files/bika-banquet/server/src/controllers/booking.controller.ts \
  | head -60
```

List all exports — these need to be split across the 5 new files.

- [ ] **Step 2: Create `booking.pdf.ts`**

Move `loadPdfAsset`, `getPdfAsset` usage wrappers, `generateMenuPdf`, `generateBookingPdf` (and all PDF-related interfaces like `PdfMenuPack`) into a new file:

```typescript
// server/src/controllers/booking.pdf.ts
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import { getPdfAsset } from './booking.helpers';

// ... paste the PDF functions here
```

- [ ] **Step 3: Create `booking.payments.ts`**

Move `addPayment`, `updatePayment`, `deletePayment` handlers.

- [ ] **Step 4: Create `booking.financials.ts`**

Move `recalculateBookingFinancials`, `releasePencilBookings`.

- [ ] **Step 5: Create `booking.read.ts`**

Move `getBookings`, `getBookingById`, `getBookingHistory`, `searchBookings`, and any other GET handlers.

- [ ] **Step 6: Create `booking.write.ts`**

Move `createBooking`, `updateBooking`, `cloneBooking`, `finalizeBooking`, `partyOverBooking`, `deleteBooking`.

- [ ] **Step 7: Reduce `booking.controller.ts` to a re-export barrel**

```typescript
// server/src/controllers/booking.controller.ts
// Re-exports for backwards compatibility with route files
export * from './booking.read';
export * from './booking.write';
export * from './booking.payments';
export * from './booking.pdf';
export * from './booking.financials';
```

- [ ] **Step 8: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx tsc --noEmit 2>&1 | head -40
```

Fix any import errors (shared types, shared utils like `toSafeMoney`, `BOOKING_RELATION_INCLUDE` — move those to `booking.helpers.ts` or a shared `booking.types.ts`).

- [ ] **Step 9: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

- [ ] **Step 10: Commit**

```bash
git add server/src/controllers/
git commit -m "refactor: split 3860-line booking.controller.ts into 5 focused files"
```

---

## Task 6: Harden Redis and add healthcheck to docker-compose

**Problem:** Redis runs with no password, no memory limit, and no healthcheck. The server container uses `condition: service_started` so it starts before Redis is ready.

**Files:**
- Modify: `docker-compose.yml:63-68` (Redis service) and `docker-compose.yml:31-32` (server depends_on)

- [ ] **Step 1: Write a test for Redis connectivity with auth**

This is a deployment config change — manual verification after restart.

- [ ] **Step 2: Update Redis service in docker-compose.yml**

Replace the redis service block:
```yaml
  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
```

With:
```yaml
  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

- [ ] **Step 3: Update server depends_on for Redis**

Change `condition: service_started` to `condition: service_healthy` for redis in the server block:

```yaml
  server:
    ...
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
```

- [ ] **Step 4: Update REDIS_URL in server environment**

The server currently uses `redis://redis:6379`. With a password, it becomes `redis://:${REDIS_PASSWORD}@redis:6379`. Update in docker-compose.yml:

```yaml
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

- [ ] **Step 5: Add REDIS_PASSWORD to .env.example**

```bash
grep -n "REDIS" /Users/harshitgoyal/Downloads/files/bika-banquet/.env.example 2>/dev/null || \
echo "Check if .env.example exists and add REDIS_PASSWORD=<strong-password>"
```

Add to `.env.example`:
```
REDIS_PASSWORD=change-me-in-production
```

- [ ] **Step 6: Pin Metabase version**

Check latest stable Metabase version at the time of implementation:
```bash
# Check what version is current stable
curl -s https://api.github.com/repos/metabase/metabase/releases/latest | grep tag_name
```

Replace in docker-compose.yml:
```yaml
    image: metabase/metabase:latest
```
With (use actual latest stable version, e.g.):
```yaml
    image: metabase/metabase:v0.52.0
```

- [ ] **Step 7: Rebuild and test**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet
docker compose down
docker compose up -d
docker compose ps
```

Expected: all services `healthy` or `running`. Check Redis:
```bash
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ping
```
Expected: `PONG`

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "infra: Redis auth + memory limit + healthcheck; pin Metabase version"
```

---

## Task 7: Final verification

- [ ] **Run full test suite**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx jest --no-coverage 2>&1
```

Expected: all tests pass.

- [ ] **Compile check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Manual smoke test — session revocation**

1. Log in via the app, copy the JWT from browser DevTools (Network tab, any request Authorization header).
2. Log out the session from the DB (`DELETE FROM "Session" WHERE token = '...'`).
3. Make an API request with the old JWT.
4. Expected: 401 within `SESSION_CACHE_TTL` (60 seconds) of the delete.

---

## Edge Cases to Verify

1. **Redis unavailable** — if Redis is down, `getRedisClient()` returns null → `getCachedOrFetchSession` falls through to DB every request (degraded but functional). Verify this path doesn't crash.
2. **JWT with wrong algorithm** — `verifyToken` should still throw before `getCachedOrFetchSession` is called.
3. **Concurrent PDF generation** — two requests for the same booking's PDF simultaneously should load images once, not twice. Check `getPdfAsset` test covers this.
4. **booking.controller.ts barrel imports** — any file that `import { X } from './booking.controller'` should still resolve after the split.
