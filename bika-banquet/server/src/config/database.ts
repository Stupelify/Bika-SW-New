import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle Prisma Client errors
prisma.$use(async (params, next) => {
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

// Test connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
