import os from 'os';

describe('getPerWorkerMax — cluster rate limit correction', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';

    jest.resetModules();

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
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('returns full max when Redis store is available', () => {
    const { getPerWorkerMax } = require('../server');
    expect(getPerWorkerMax(2000, true)).toBe(2000);
  });

  it('divides max by CPU count when no Redis store', () => {
    const { getPerWorkerMax } = require('../server');
    const cpus = os.cpus().length;
    expect(getPerWorkerMax(2000, false)).toBe(Math.max(1, Math.floor(2000 / cpus)));
  });

  it('never returns less than 1', () => {
    const { getPerWorkerMax } = require('../server');
    expect(getPerWorkerMax(1, false)).toBeGreaterThanOrEqual(1);
  });
});
