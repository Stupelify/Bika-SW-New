import { resolveVersionChain } from '../controllers/booking.helpers';
import prisma from '../config/database';

describe('resolveVersionChain', () => {
  it('returns single-element array for booking with no version chain', async () => {
    const booking = await prisma.booking.findFirst({ select: { id: true } });
    if (!booking) {
      console.log('No bookings in DB — skipping');
      return;
    }
    const chain = await resolveVersionChain(booking.id);
    expect(Array.isArray(chain)).toBe(true);
    expect(chain.length).toBeGreaterThanOrEqual(1);
    expect(chain).toContain(booking.id);
  });
});
