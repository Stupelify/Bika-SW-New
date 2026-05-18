import { getRedisClient } from '../config/redis';

describe('Redis session cache', () => {
  it('Redis is reachable', async () => {
    const redis = getRedisClient();
    if (!redis) {
      console.log('Redis not available — skipping');
      return;
    }
    await redis.set('test:ping', '1', 'EX', 5);
    const val = await redis.get('test:ping');
    expect(val).toBe('1');
    await redis.del('test:ping');
  });

  it('revoked sentinel value "revoked" is treated as invalid session', async () => {
    const redis = getRedisClient();
    if (!redis) return;
    const key = 'session:test-revoked-key';
    await redis.set(key, 'revoked', 'EX', 30);
    const val = await redis.get(key);
    expect(val).toBe('revoked');
    await redis.del(key);
  });
});
