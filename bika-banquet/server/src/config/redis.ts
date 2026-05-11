import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    logger.error('Redis connection error', { error });
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected for rate limiting');
  });

  return redisClient;
}
