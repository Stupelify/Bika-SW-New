import 'express-async-errors';
import express, { Application, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import os from 'os';
import { connectDatabase, disconnectDatabase, pingDatabase } from './config/database';
import prisma from './config/database';
import { initSseSubscriber } from './sse';
import { releasePencilBookings } from './controllers/booking.controller';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { getRedisClient } from './config/redis';
import logger from './utils/logger';
import { syncPermissions } from './utils/syncPermissions';

// Load local dev overrides first, then fall back to the tracked .env file.
dotenv.config({ path: '.env.local' });
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust nginx reverse proxy so req.ip resolves to the real client IP.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOriginSet = new Set(allowedOrigins);

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return true;
  }
  if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    const second = Number(parts[1] || 0);
    return second >= 16 && second <= 31;
  }
  return false;
}

function isAllowedOrigin(origin: string | undefined | null): boolean {
  if (!origin) {
    return true;
  }
  if (allowedOriginSet.has(origin)) {
    return true;
  }
  try {
    const parsed = new URL(origin);
    const protocol = parsed.protocol;
    const hostname = parsed.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    if (hostname.endsWith('.bikafood.com')) {
      return true;
    }
    if (protocol === 'capacitor:' || protocol === 'ionic:') {
      return true;
    }
    if (protocol === 'exp:' && isPrivateHost(hostname)) {
      return true;
    }
  } catch (error) {
    // ignore parsing failures, fall through to deny
  }
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parse request body before auth rate-limiting so limiter can key by login email.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiWindowMinutes = Number.parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10);
const authWindowMinutes = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW || String(apiWindowMinutes || 15),
  10
);
const trustedRateLimitIps = new Set(
  (process.env.RATE_LIMIT_TRUSTED_IPS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

function extractIp(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return ip.replace(/^::ffff:/, '');
}

function isTrustedIp(req: Request): boolean {
  if (trustedRateLimitIps.size === 0) {
    return false;
  }
  const ip = extractIp(req);
  return trustedRateLimitIps.has(ip);
}

function getRateLimitKey(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as
          | { id?: string; userId?: string; sub?: string; email?: string }
          | undefined;
        const userId =
          decoded?.id || decoded?.userId || decoded?.sub || decoded?.email;
        if (userId) {
          return `user:${userId}`;
        }
      } catch {
        // Fall back to IP-based limiting when token is invalid.
      }
    }
  }

  return `ip:${extractIp(req)}`;
}

function getAuthRateLimitKey(req: Request): string {
  const rawEmail = req.body?.email;
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  if (email) {
    return `login:${email}`;
  }
  return `login-ip:${extractIp(req)}`;
}

export function getPerWorkerMax(configuredMax: number, hasRedisStore: boolean): number {
  if (hasRedisStore) return configuredMax;
  const cpus = os.cpus().length;
  return Math.max(1, Math.floor(configuredMax / cpus));
}

function createRateLimitStore(prefix: string): { store: InstanceType<typeof RedisStore> | undefined; hasRedis: boolean } {
  try {
    const redisClient = getRedisClient();
    if (!redisClient) {
      return { store: undefined, hasRedis: false };
    }

    return {
      store: new RedisStore({
        prefix,
        sendCommand: (...args: string[]) =>
          redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
      }),
      hasRedis: true,
    };
  } catch (error) {
    logger.error('Falling back to in-memory rate limiting', { error, prefix });
    return { store: undefined, hasRedis: false };
  }
}

const apiConfiguredMax = Number.parseInt(process.env.RATE_LIMIT_MAX || '2000', 10);
const { store: apiStore, hasRedis: apiHasRedis } = createRateLimitStore('rl:api:');

const apiLimiter = rateLimit({
  windowMs: (Number.isFinite(apiWindowMinutes) ? apiWindowMinutes : 15) * 60 * 1000,
  max: getPerWorkerMax(apiConfiguredMax, apiHasRedis),
  store: apiStore,
  keyGenerator: getRateLimitKey,
  skip: (req) =>
    isTrustedIp(req) ||
    req.path === '/auth/login' ||
    req.path === '/auth/register' ||
    req.path === '/auth/forgot-password' ||
    req.path === '/auth/reset-password',
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: 'Too many requests from this IP, please try again later.',
});

const authConfiguredMax = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000', 10);
const { store: authStore, hasRedis: authHasRedis } = createRateLimitStore('rl:auth:');

const authLimiter = rateLimit({
  windowMs: (Number.isFinite(authWindowMinutes) ? authWindowMinutes : 15) * 60 * 1000,
  max: getPerWorkerMax(authConfiguredMax, authHasRedis),
  store: authStore,
  keyGenerator: getAuthRateLimitKey,
  skip: (req) => isTrustedIp(req),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: 'Too many login attempts. Please try again shortly.',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/', apiLimiter);

// Compression
app.use(compression());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

app.get('/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Bika Banquet API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

async function verifyDbConstraints(): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint WHERE conname = 'booking_halls_hall_time_range_excl'
    `;
    if (rows.length === 0) {
      logger.warn(
        '⚠️  DB constraint booking_halls_hall_time_range_excl is missing. ' +
        'Run: npm run db:apply-raw to apply raw SQL migrations.',
      );
    }
  } catch (err) {
    logger.warn('Could not verify DB constraints:', err);
  }
}

async function runWithDistributedLock(
  lockKey: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    await fn();
    return;
  }
  const acquired = await redis.set(lockKey, '1', 'PX', ttlMs, 'NX');
  if (!acquired) return;
  try {
    await fn();
  } finally {
    await redis.del(lockKey);
  }
}

let httpServer: ReturnType<typeof app.listen> | null = null;

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    await verifyDbConstraints();

    // Reconcile permissions/roles registry with the DB. Non-blocking and
    // crash-safe: a failure is logged but must not prevent the server starting.
    syncPermissions().catch((e) => logger.error('Permission sync failed', e));

    // Start SSE Redis subscriber (fan-out across PM2 workers).
    // Safe no-op when Redis is not configured.
    initSseSubscriber();

    // Release expired pencil bookings every hour.
    // Distributed lock ensures only one PM2 worker runs this per cycle.
    const runPencilRelease = () => runWithDistributedLock(
      'pencil-release-lock',
      55 * 60 * 1000,
      releasePencilBookings,
    );
    runPencilRelease();
    setInterval(runPencilRelease, 60 * 60 * 1000);

    // Start listening
    httpServer = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — draining connections`);
  await new Promise<void>((resolve) => {
    if (!httpServer) { resolve(); return; }
    const timeout = setTimeout(() => {
      logger.warn('Shutdown timeout — forcing exit');
      resolve();
    }, 30_000);
    httpServer.close(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
  await disconnectDatabase();
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception — shutting down', { error: error.message, stack: error.stack });
  shutdown('uncaughtException').catch(() => process.exit(1));
});

// Start the server
startServer();

export default app;
