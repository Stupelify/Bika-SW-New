import { getPdfAsset } from '../controllers/booking.helpers';

describe('getPdfAsset — Promise cache', () => {
  it('calls loader only once for concurrent requests', async () => {
    let callCount = 0;
    const slowLoader = async (): Promise<Buffer | null> => {
      callCount++;
      await new Promise((r) => setTimeout(r, 30));
      return Buffer.from('img-data');
    };

    const [r1, r2, r3] = await Promise.all([
      getPdfAsset('test-bg.png', slowLoader),
      getPdfAsset('test-bg.png', slowLoader),
      getPdfAsset('test-bg.png', slowLoader),
    ]);

    expect(callCount).toBe(1);
    expect(r1?.toString()).toBe('img-data');
    expect(r2?.toString()).toBe('img-data');
    expect(r3?.toString()).toBe('img-data');
  });

  it('reloads after TTL expires', async () => {
    let callCount = 0;
    const loader = async (): Promise<Buffer | null> => {
      callCount++;
      return Buffer.from(`call-${callCount}`);
    };

    await getPdfAsset('ttl-test.png', loader, { ttlMs: 10 });
    await new Promise((r) => setTimeout(r, 25));
    await getPdfAsset('ttl-test.png', loader, { ttlMs: 10 });

    expect(callCount).toBe(2);
  });
});
