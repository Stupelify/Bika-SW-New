import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../../.env.local'), override: true });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MIGRATION_ROOT = path.join(__dirname, '../../prisma');
const prisma = new PrismaClient();

function parseDatabaseUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || '5432',
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, '').split('?')[0],
  };
}

function runSql(file: string, conn: ReturnType<typeof parseDatabaseUrl>): void {
  const env = {
    ...process.env,
    PGPASSWORD: conn.password,
  };
  execSync(
    `psql -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database} -f "${file}"`,
    { env, stdio: 'inherit' },
  );
}

async function ensureTrackingTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _raw_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getApplied(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM _raw_migrations
  `;
  return new Set(rows.map((r) => r.name));
}

async function run(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const conn = parseDatabaseUrl(dbUrl);

  await prisma.$connect();
  await ensureTrackingTable();
  const applied = await getApplied();

  const files = fs
    .readdirSync(MIGRATION_ROOT, { recursive: true })
    .filter((entry): entry is string => typeof entry === 'string')
    .filter((file) => file.endsWith('.sql'))
    .filter((file) => file !== 'legacy_schema.sql')
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }
    const filePath = path.join(MIGRATION_ROOT, file);
    console.log(`  apply ${file}`);
    runSql(filePath, conn);
    await prisma.$executeRaw`INSERT INTO _raw_migrations (name) VALUES (${file})`;
    ran++;
  }

  console.log(`\nDone. Applied ${ran} migration(s).`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
