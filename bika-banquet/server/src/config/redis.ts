import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis | null = null;

export function resetRedisClient(): void {
  if (redisClient) {
    redisClient.disconnect();
  }
  redisClient = null;
}

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
  });

  client.on('error', (error) => {
    logger.error('Redis connection error — resetting client', { error });
    redisClient = null;
  });

  client.on('end', () => {
    logger.warn('Redis connection ended — resetting client');
    redisClient = null;
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient = client;
  return redisClient;
}
