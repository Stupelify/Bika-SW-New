describe('getRedisClient — recovery on disconnect', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('exports resetRedisClient function', () => {
    const redis = require('../config/redis');
    expect(typeof redis.resetRedisClient).toBe('function');
  });

  it('returns different instances after reset', () => {
    process.env.REDIS_URL = 'redis://localhost:6399';
    const { resetRedisClient, getRedisClient } = require('../config/redis');
    const client1 = getRedisClient();
    resetRedisClient();
    const client2 = getRedisClient();
    expect(client1).not.toBe(client2);
    // Cleanup
    resetRedisClient();
    delete process.env.REDIS_URL;
  });
});
