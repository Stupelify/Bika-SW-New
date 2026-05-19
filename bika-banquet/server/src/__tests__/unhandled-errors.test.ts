describe('unhandled error handlers registered on module load', () => {
  beforeAll(() => {
    // Set required env vars before module evaluation
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';

    jest.resetModules();

    // Prevent startServer() from actually connecting to DB / listening
    jest.mock('../config/database', () => ({
      __esModule: true,
      default: { $queryRaw: jest.fn().mockResolvedValue([]) },
      connectDatabase: jest.fn().mockResolvedValue(undefined),
      disconnectDatabase: jest.fn().mockResolvedValue(undefined),
      pingDatabase: jest.fn().mockResolvedValue(undefined),
    }));
    jest.mock('../config/redis', () => ({
      getRedisClient: jest.fn().mockReturnValue(null),
    }));
    jest.mock('../sse', () => ({ initSseSubscriber: jest.fn() }));
    jest.mock('../controllers/booking.controller', () => ({
      releasePencilBookings: jest.fn().mockResolvedValue(undefined),
    }));
    jest.mock('../routes', () => {
      const express = jest.requireActual('express');
      return express.Router();
    });

    // Stub app.listen so the server never actually binds a port
    jest.mock('express', () => {
      const express = jest.requireActual('express');
      const originalExpress: any = (...args: any[]) => {
        const app = express(...args);
        app.listen = jest.fn((_port: unknown, cb?: () => void) => {
          if (typeof cb === 'function') cb();
          return { close: jest.fn((done?: () => void) => { if (done) done(); }) };
        });
        return app;
      };
      Object.assign(originalExpress, express);
      return originalExpress;
    });

    require('../server');
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('has unhandledRejection listener', () => {
    const count = process.listenerCount('unhandledRejection');
    expect(count).toBeGreaterThan(0);
  });

  it('has uncaughtException listener', () => {
    const count = process.listenerCount('uncaughtException');
    expect(count).toBeGreaterThan(0);
  });
});
