import prisma from '../../config/database';

export interface IntegrationDbProbe {
  available: boolean;
  reason?: string;
}

let cachedProbe: IntegrationDbProbe | null = null;

/** Ping Postgres once per Jest worker. */
export async function probeIntegrationDatabase(): Promise<IntegrationDbProbe> {
  if (cachedProbe) return cachedProbe;
  try {
    await prisma.$queryRaw`SELECT 1`;
    cachedProbe = { available: true };
  } catch (error) {
    cachedProbe = {
      available: false,
      reason:
        error instanceof Error
          ? error.message
          : 'Database unavailable (check DATABASE_URL and Postgres)',
    };
  }
  return cachedProbe;
}
