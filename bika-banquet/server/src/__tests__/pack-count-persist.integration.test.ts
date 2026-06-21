import prisma from '../config/database';
import { normalizePackCountForPersist } from '../controllers/booking.pack-catering';
import { probeIntegrationDatabase } from './helpers/integrationDb';

/**
 * Verifies hall-only pack pax=0 persists through Prisma (same values booking.write stores).
 */
describe('hall-only packCount persistence (integration)', () => {
  const createdBookingIds: string[] = [];
  const createdMenuIds: string[] = [];
  const createdMealSlotIds: string[] = [];

  beforeAll(async () => {
    const probe = await probeIntegrationDatabase();
    if (!probe.available) {
      throw new Error(
        `Integration suite requires Postgres. ${probe.reason ?? ''}`.trim()
      );
    }
  });

  afterAll(async () => {
    for (const id of createdBookingIds) {
      await prisma.bookingPack.deleteMany({ where: { bookingId: id } }).catch(() => {});
      await prisma.booking.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdMenuIds) {
      await prisma.bookingMenu.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdMealSlotIds) {
      await prisma.mealSlot.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('stores packCount and noOfPack as 0 when ratePerPlate is 0', async () => {
    const customer = await prisma.customer.findFirst({ select: { id: true } });
    expect(customer).toBeTruthy();
    if (!customer) return;

    const mealSlot = await prisma.mealSlot.create({
      data: { name: `test-lunch-${Date.now()}`, order: 99 },
    });
    createdMealSlotIds.push(mealSlot.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        functionName: 'Hall-only Pax Test',
        functionType: 'Wedding',
        functionDate: new Date('2026-09-01'),
        functionTime: '12:00',
        expectedGuests: 50,
      },
    });
    createdBookingIds.push(booking.id);

    const menu = await prisma.bookingMenu.create({
      data: {
        name: 'Hall-only Menu',
        ratePerPlate: 0,
        setupCost: 0,
        mealSlotId: mealSlot.id,
      },
    });
    createdMenuIds.push(menu.id);

    const normalizedPackCount = normalizePackCountForPersist(0, 0, 0);
    expect(normalizedPackCount).toBe(0);

    await prisma.bookingPack.create({
      data: {
        bookingId: booking.id,
        mealSlotId: mealSlot.id,
        bookingMenuId: menu.id,
        packName: 'Lunch',
        packCount: normalizedPackCount,
        noOfPack: normalizedPackCount,
        ratePerPlate: 0,
        setupCost: 0,
      },
    });

    const stored = await prisma.bookingPack.findFirst({
      where: { bookingId: booking.id },
      select: { packCount: true, noOfPack: true, ratePerPlate: true },
    });

    expect(stored?.packCount).toBe(0);
    expect(stored?.noOfPack).toBe(0);
    expect(stored?.ratePerPlate).toBe(0);
  });

  it('floors catering-on packs to at least 1 when client sends 0 pax', async () => {
    expect(normalizePackCountForPersist(500, 0, 0)).toBe(1);
  });
});
