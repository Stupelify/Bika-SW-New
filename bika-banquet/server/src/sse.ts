/**
 * SSE (Server-Sent Events) fan-out with Redis pub/sub.
 *
 * Why Redis pub/sub?
 * PM2 runs one Node.js process per CPU core. Each process has its own
 * in-memory sseClients Set. Without a shared message bus, a booking event
 * created in Worker 1 only reaches SSE clients connected to Worker 1 —
 * staff on other workers see nothing. Redis pub/sub bridges all workers:
 * every worker subscribes to the same channel, so a publish from any worker
 * fans out to every connected client across all processes.
 *
 * Graceful fallback: if Redis is not configured (REDIS_URL absent), the
 * module falls back to in-memory broadcast. This works correctly when
 * running with PM2 in single-instance mode (pm2 -i 1) or during local dev
 * without Docker.
 */

import { Response } from 'express';
import { getRedisClient } from './config/redis';
import logger from './utils/logger';

const SSE_CHANNEL = 'bika:booking-events';

// Local clients connected to THIS worker process.
const sseClients = new Set<Response>();

export function addSseClient(res: Response): void {
  sseClients.add(res);
}

export function removeSseClient(res: Response): void {
  sseClients.delete(res);
}

/** Write a raw SSE message string to all local clients. */
function broadcastLocal(message: string): void {
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      // Client already disconnected — remove it.
      sseClients.delete(client);
    }
  }
}

/**
 * Publish a booking event. If Redis is available the event is published to
 * the shared channel so all PM2 workers receive it. Otherwise it is
 * broadcast only to local clients (single-process / dev mode).
 */
export function broadcastBookingEvent(eventType: string, payload: unknown): void {
  const message = `data: ${JSON.stringify({ type: eventType, payload })}\n\n`;

  const redis = getRedisClient();
  if (redis) {
    redis.publish(SSE_CHANNEL, message).catch((err) => {
      logger.error('SSE Redis publish failed, falling back to local broadcast', { err });
      broadcastLocal(message);
    });
  } else {
    broadcastLocal(message);
  }
}

/**
 * Subscribe this worker to the Redis SSE channel so it can relay published
 * events to its locally-connected SSE clients.
 *
 * Call once at server startup. Safe to call when Redis is not configured
 * (returns immediately).
 */
export function initSseSubscriber(): void {
  const redis = getRedisClient();
  if (!redis) {
    logger.info('SSE: Redis not configured — running in single-process fan-out mode');
    return;
  }

  // A subscriber connection must be dedicated (it blocks the connection for
  // pub/sub mode only), so we create a duplicate client from the same URL.
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return;

  // Dynamic import so we don't add a module-level side effect.
  import('ioredis').then(({ default: Redis }) => {
    const subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // subscriber should reconnect indefinitely
      enableOfflineQueue: false,
      lazyConnect: false,
    });

    subscriber.on('error', (err) => {
      logger.error('SSE subscriber Redis error', { err });
    });

    subscriber.subscribe(SSE_CHANNEL, (err) => {
      if (err) {
        logger.error('SSE: Failed to subscribe to Redis channel', { err });
        return;
      }
      logger.info(`SSE: Subscribed to Redis channel "${SSE_CHANNEL}" (worker fan-out active)`);
    });

    subscriber.on('message', (_channel: string, message: string) => {
      broadcastLocal(message);
    });
  }).catch((err) => {
    logger.error('SSE: Failed to import ioredis for subscriber', { err });
  });
}
