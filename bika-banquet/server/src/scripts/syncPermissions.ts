import dotenv from 'dotenv';
import prisma from '../config/database';
import logger from '../utils/logger';
import { syncPermissions } from '../utils/syncPermissions';

// Load local dev overrides first, then fall back to the tracked .env file.
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main(): Promise<void> {
  logger.info('🔐 Syncing permissions and default roles...');
  await syncPermissions();
  logger.info('✅ Permission sync finished.');
}

main()
  .catch((err) => {
    logger.error('❌ Permission sync failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
