/**
 * AGENTS.md manual billing smoke — HTTP API against a running server.
 * Run: tsx tests/manual-smoke/billing-smoke.ts
 *
 * Requires: server on API_BASE, DATABASE_URL seeded (see _resetAndSeed.ts).
 */
import { sumBookingLines } from '@bika/booking-core';

const API_BASE = process.env.API_BASE || 'http://localhost:5050/api';
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet_test?schema=public';

type Json = Record<string, unknown>;

let passed = 0;
let failed = 0;

function ok(label: string, detail?: string) {
  passed++;
  console.log(`  ✔ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label: string, detail?: string): never {
  failed++;
  console.error(`  ✘ ${label}${detail ? ` — ${detail}` : ''}`);
  throw new Error(label);
}

function assertEq(label: string, actual: number, expected: number, tolerance = 1) {
  if (Math.abs(actual - expected) > tolerance) {
    fail(label, `expected ${expected}, got ${actual}`);
  }
  ok(label, `${actual}`);
}

async function api(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {}
): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, json };
}

async function main(): Promise<void> {
  console.log('\n▶ AGENTS.md billing manual smoke\n');

  // Seed fresh DB + fixtures
  process.env.DATABASE_URL = DB_URL;
  const { execFileSync } = await import('child_process');
  const seedOut = execFileSync('npx', ['tsx', 'tests/qa-forms/_resetAndSeed.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: DB_URL },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
    .toString('utf8')
    .trim();

  let seed: {
    email: string;
    password: string;
    customerId: string;
    hallId: string;
  } | null = null;
  for (const line of seedOut.split(/\r?\n/).reverse()) {
    if (!line.trim().startsWith('{')) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed?.email) {
        seed = parsed;
        break;
      }
    } catch {
      /* scan */
    }
  }
  if (!seed) fail('Seed fixtures', 'could not parse _resetAndSeed output');

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: seed.email, password: seed.password },
  });
  if (login.status !== 200) fail('Login', JSON.stringify(login.json));
  const token = (login.json.data as Json)?.token as string;
  if (!token) fail('Login token missing');

  // Meal slot IDs from seeded DB
  const prisma = (await import('../../src/config/database')).default;
  await prisma.$connect();
  const lunchSlot = await prisma.mealSlot.findUniqueOrThrow({ where: { name: 'Lunch' } });
  const dinnerSlot = await prisma.mealSlot.findUniqueOrThrow({ where: { name: 'Dinner' } });
  await prisma.$disconnect();

  const lunchPax = 400;
  const lunchRate = 2000;
  const lunchHall = 1_200_000;
  const dinnerPax = 100;
  const dinnerRate = 1200;
  const dinnerHall = 0;
  const discountPct = 10;

  const expectedMealsTotal = sumBookingLines({
    packs: [
      {
        ratePerPlate: lunchRate,
        packCount: lunchPax,
        hallRate: lunchHall,
        setupCost: 0,
        extraCharges: 0,
      },
      {
        ratePerPlate: dinnerRate,
        packCount: dinnerPax,
        hallRate: dinnerHall,
        setupCost: 0,
        extraCharges: 0,
      },
    ],
    halls: [{ charges: 0 }],
    additionalItems: [],
  });
  const expectedMealsNet = Math.round(expectedMealsTotal * (1 - discountPct / 100));

  ok(
    'Expected row total (lunch+dinner hallRate)',
    `meals=${expectedMealsTotal}, net@${discountPct}%=${expectedMealsNet}`
  );

  const createBody = {
    customerId: seed.customerId,
    functionName: 'Manual Smoke Wedding',
    functionType: 'Marriage',
    functionDate: '2030-08-20',
    functionTime: '12:00',
    expectedGuests: lunchPax + dinnerPax,
    halls: [{ hallId: seed.hallId, charges: 0 }],
    discountPercentage: discountPct,
    packs: [
      {
        mealSlotId: lunchSlot.id,
        packName: 'Lunch',
        packCount: lunchPax,
        ratePerPlate: lunchRate,
        hallRate: String(lunchHall),
        hallIds: [seed.hallId],
        menu: { name: 'Lunch Menu', items: [] },
      },
      {
        mealSlotId: dinnerSlot.id,
        packName: 'Dinner',
        packCount: dinnerPax,
        ratePerPlate: dinnerRate,
        hallRate: String(dinnerHall),
        hallIds: [seed.hallId],
        menu: { name: 'Dinner Menu', items: [] },
      },
    ],
  };

  const created = await api('/bookings', { method: 'POST', token, body: createBody });
  if (created.status !== 201) fail('Create booking', JSON.stringify(created.json));
  const booking = (created.json.data as Json)?.booking as Json;
  const bookingId = booking?.id as string;
  if (!bookingId) fail('Create booking id missing');

  const savedTotal =
    Number(booking.totalBillAmountValue ?? booking.totalAmount ?? 0) ||
    Number(booking.grandTotal ?? 0);
  assertEq('Submit: meals total matches row sum', savedTotal, expectedMealsTotal);

  const savedNet =
    Number(booking.finalAmountValue ?? booking.finalAmount ?? 0) ||
    Number(booking.grandTotal ?? 0);
  assertEq('Submit: net = total − discount', savedNet, expectedMealsNet);

  const pay1 = await api(`/bookings/${bookingId}/payments`, {
    method: 'POST',
    token,
    body: { amount: 500000, method: 'cash', paymentDate: '2030-08-01' },
  });
  if (pay1.status !== 201 && pay1.status !== 200) fail('Add payment 1', JSON.stringify(pay1.json));

  const pay2 = await api(`/bookings/${bookingId}/payments`, {
    method: 'POST',
    token,
    body: { amount: 250000, method: 'upi', paymentDate: '2030-08-05' },
  });
  if (pay2.status !== 201 && pay2.status !== 200) fail('Add payment 2', JSON.stringify(pay2.json));

  const afterPay1 = await api(`/bookings/${bookingId}`, { token });
  const payments1 = ((afterPay1.json.data as Json)?.booking as Json)?.payments as unknown[];
  if (!Array.isArray(payments1) || payments1.length !== 2) {
    fail('Payments after add', `expected 2 rows, got ${payments1?.length ?? 0}`);
  }
  ok('Payments after add', '2 rows');

  const update1 = await api(`/bookings/${bookingId}`, {
    method: 'PUT',
    token,
    body: { notes: 'smoke save 1' },
  });
  if (update1.status !== 200) fail('Update save 1', JSON.stringify(update1.json));

  const update2 = await api(`/bookings/${bookingId}`, {
    method: 'PUT',
    token,
    body: { notes: 'smoke save 2' },
  });
  if (update2.status !== 200) fail('Update save 2', JSON.stringify(update2.json));

  const afterDoubleSave = await api(`/bookings/${bookingId}`, { token });
  const paymentsAfter = ((afterDoubleSave.json.data as Json)?.booking as Json)?.payments as unknown[];
  if (!Array.isArray(paymentsAfter) || paymentsAfter.length !== 2) {
    fail('Double save payments', `expected 2 rows, got ${paymentsAfter?.length ?? 0}`);
  }
  ok('Double save: no duplicate payments', '2 rows');

  const finalized = await api(`/bookings/${bookingId}/finalize`, { method: 'POST', token });
  if (finalized.status !== 200 && finalized.status !== 201) {
    fail('Finalize', JSON.stringify(finalized.json));
  }

  const history = await api(`/bookings/${bookingId}/history`, { token });
  if (history.status !== 200) fail('History fetch', JSON.stringify(history.json));

  const versions = (history.json.data as Json)?.history as Json[] | undefined;
  const finalizedVersion = versions?.find((v) => v.finalizedMeta || v.snapshotData);
  if (!finalizedVersion) fail('Finalize history', 'no finalized version in history');

  const snapshot = finalizedVersion.snapshotData as Json | null;
  const snapGrand = Number(
    snapshot?.grandTotal ??
      snapshot?.finalAmountValue ??
      (snapshot?.booking as Json)?.grandTotal ??
      0
  );
  const liveGrand = Number(
    ((afterDoubleSave.json.data as Json)?.booking as Json)?.grandTotal ?? savedNet
  );
  assertEq('Finalize snapshot grand total matches live booking', snapGrand, liveGrand);

  ok('Finalize history', 'Amount summary present');

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
