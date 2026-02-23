import 'express-async-errors';
import express, { Application, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust nginx reverse proxy so req.ip resolves to the real client IP.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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

  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

function getAuthRateLimitKey(req: Request): string {
  const rawEmail = req.body?.email;
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  if (email) {
    return `login:${email}`;
  }
  return `login-ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

const apiLimiter = rateLimit({
  windowMs: (Number.isFinite(apiWindowMinutes) ? apiWindowMinutes : 15) * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX || '2000', 10),
  keyGenerator: getRateLimitKey,
  skip: (req) =>
    req.path === '/auth/login' ||
    req.path === '/auth/register' ||
    req.path === '/auth/forgot-password' ||
    req.path === '/auth/reset-password',
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: (Number.isFinite(authWindowMinutes) ? authWindowMinutes : 15) * 60 * 1000,
  max: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000', 10),
  keyGenerator: getAuthRateLimitKey,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
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

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;
