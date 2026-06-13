/**
 * DB-only global setup. Runs before webServer starts — seeds test DB only.
 * Browser login happens in auth.setup.ts after servers are up.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SEED_PATH = path.join(__dirname, '..', '.auth', 'seed.json');

export default async function globalSetup(): Promise<void> {
  const cliPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'server',
    'tests',
    'qa-forms',
    '_resetAndSeed.ts'
  );

  if (!fs.existsSync(cliPath)) {
    console.warn('[booking-form] Seed CLI missing — tests may skip.');
    return;
  }

  const stdout = execFileSync('npx', ['tsx', cliPath], {
    cwd: path.join(__dirname, '..', '..', '..', 'server'),
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ||
        process.env.DATABASE_URL ||
        'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet_test?schema=public',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 10 * 1024 * 1024,
  })
    .toString('utf8')
    .trim();

  let seed: Record<string, string> | null = null;
  for (const line of stdout.split(/\r?\n/).reverse()) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.email && parsed?.password) {
        seed = parsed;
        break;
      }
    } catch {
      /* scan */
    }
  }

  if (!seed) {
    console.warn('[booking-form] Could not parse seed credentials.');
    return;
  }

  fs.mkdirSync(path.dirname(SEED_PATH), { recursive: true });
  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));
}
