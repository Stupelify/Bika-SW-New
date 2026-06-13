/**
 * Resets the QA test database and seeds minimal data for Playwright E2E.
 * Prints a single JSON line (last stdout line) with credentials + fixture IDs.
 *
 * Safety: only runs against databases whose name contains `_test` unless
 * QA_FORCE_RESET=1 is set.
 */
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import prisma from '../../src/config/database';
import { hashPassword } from '../../src/utils/auth';
import { syncPermissions } from '../../src/utils/syncPermissions';

const serverRoot = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(serverRoot, '.env.local'), override: true });
dotenv.config({ path: path.join(serverRoot, '.env') });

function dbNameFromUrl(dbUrl: string): string {
  try {
    return new URL(dbUrl).pathname.replace(/^\//, '').split('?')[0];
  } catch {
    const match = dbUrl.match(/\/([^/?]+)(?:\?|$)/);
    return match?.[1] ?? '';
  }
}

function assertSafeTarget(dbUrl: string): void {
  const dbName = dbNameFromUrl(dbUrl);
  const isTestDb = dbName.includes('_test') || dbName.endsWith('_test');
  if (!isTestDb && process.env.QA_FORCE_RESET !== '1') {
    throw new Error(
      `Refusing to reset non-test database "${dbName}". ` +
        'Use a *_test database or set QA_FORCE_RESET=1.'
    );
  }
}

async function resetSchema(dbUrl: string): Promise<void> {
  const env = { ...process.env, DATABASE_URL: dbUrl };
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', {
    cwd: serverRoot,
    env,
    stdio: 'inherit',
  });
  execSync('npm run db:apply-raw', { cwd: serverRoot, env, stdio: 'inherit' });
}

async function seedFixtures(): Promise<{
  userId: string;
  email: string;
  password: string;
  banquetId: string;
  hallId: string;
  customerId: string;
}> {
  await syncPermissions();

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Admin' } });
  const password = 'TestPass!2026';
  const email = `admin+${Date.now()}@qa.test`;

  const adminUser = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name: 'QA Admin',
      isVerified: true,
      hasAllVenueAccess: true,
    },
  });

  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: adminRole.id },
  });

  for (const slot of [
    { name: 'Breakfast', startTime: '08:00', endTime: '11:00' },
    { name: 'Lunch', startTime: '12:00', endTime: '15:00' },
    { name: 'Hi-Tea', startTime: '16:00', endTime: '18:00' },
    { name: 'Dinner', startTime: '19:00', endTime: '23:00' },
  ]) {
    await prisma.mealSlot.upsert({ where: { name: slot.name }, update: {}, create: slot });
  }

  const banquet = await prisma.banquet.create({
    data: {
      name: `QA Banquet ${Date.now()}`,
      location: 'Test City',
      address: '1 QA Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+919999999999',
    },
  });

  const hall = await prisma.hall.create({
    data: {
      name: 'QA Grand Hall',
      banquetId: banquet.id,
      capacity: 500,
      floatingCapacity: 600,
      area: 5000,
      basePrice: 50000,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      name: 'Alpha QA Customer',
      phone: `9${String(Date.now()).slice(-9)}`,
      phoneE164: `+919${String(Date.now()).slice(-9)}`,
      email: `alpha-qa-${Date.now()}@test.local`,
    },
  });

  return {
    userId: adminUser.id,
    email,
    password,
    banquetId: banquet.id,
    hallId: hall.id,
    customerId: customer.id,
  };
}

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is required');

  assertSafeTarget(dbUrl);
  await resetSchema(dbUrl);
  await prisma.$connect();
  const seed = await seedFixtures();
  await prisma.$disconnect();

  // Playwright globalSetup parses the last JSON line from stdout.
  console.log(JSON.stringify(seed));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
