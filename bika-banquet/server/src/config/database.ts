import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle Prisma Client errors
prisma.$use(async (params: any, next: (p: any) => Promise<any>) => {
  const before = Date.now();
  try {
    const result = await next(params);
    const after = Date.now();
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
    return result;
  } catch (error) {
    logger.error('Prisma query error:', error);
    throw error;
  }
});

const DB_MAX_RETRIES = 8;
const DB_RETRY_DELAY_MS = 5000;

// Test connection with exponential backoff retry
export async function connectDatabase(options?: {
  maxRetries?: number;
  retryDelayMs?: number;
}): Promise<void> {
  const maxRetries = options?.maxRetries ?? DB_MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? DB_RETRY_DELAY_MS;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(1.5, attempt);
        logger.warn(
          `Database connection failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`,
          { error }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('❌ Database connection failed after all retries', { error: lastError });
  throw lastError;
}

export async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
