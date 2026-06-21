import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { cloneBookingVersion } from '../controllers/booking.shared';
import { probeIntegrationDatabase } from './helpers/integrationDb';

/**
 * Integration tests — only loaded when RUN_INTEGRATION_TESTS=1 (see jest.config.ts).
 * CI sets REQUIRE_INTEGRATION_DB=1 with a Postgres service so these must execute.
 */
describe('cloneBookingVersion moves payments (integration)', () => {
  const createdBookingIds: string[] = [];

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
      await prisma.bookingPayments.deleteMany({ where: { bookingId: id } }).catch(() => {});
      await prisma.booking.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('moves payment rows to the clone and recomputes received/due', async () => {
    const customer = await prisma.customer.findFirst({ select: { id: true } });
    const receiver = await prisma.user.findFirst({ select: { id: true } });
    expect(customer).toBeTruthy();
    expect(receiver).toBeTruthy();
    if (!customer || !receiver) return;

    const payable = 1_400_000;
    const source = await prisma.booking.create({
      data: {
        customerId: customer.id,
        functionName: 'Clone Payment Test',
        functionType: 'Wedding',
        functionDate: new Date('2026-08-01'),
        functionTime: '12:00',
        expectedGuests: 100,
        grandTotal: payable,
        finalAmountValue: payable,
        dueAmountValue: payable,
        paymentReceivedAmountValue: 0,
      },
    });
    createdBookingIds.push(source.id);

    const paymentA = await prisma.bookingPayments.create({
      data: {
        bookingId: source.id,
        receivedBy: receiver.id,
        amount: 300_000,
        method: 'cash',
      },
    });
    const paymentB = await prisma.bookingPayments.create({
      data: {
        bookingId: source.id,
        receivedBy: receiver.id,
        amount: 200_000,
        method: 'upi',
      },
    });

    await prisma.booking.update({
      where: { id: source.id },
      data: {
        paymentReceivedAmountValue: 500_000,
        dueAmountValue: 900_000,
      },
    });

    const clone = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.booking.update({
        where: { id: source.id },
        data: { isLatest: false },
      });
      return cloneBookingVersion(tx, source.id);
    });
    createdBookingIds.push(clone.id);

    const sourcePayments = await prisma.bookingPayments.count({
      where: { bookingId: source.id },
    });
    const clonePayments = await prisma.bookingPayments.findMany({
      where: { bookingId: clone.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(sourcePayments).toBe(0);
    expect(clonePayments).toHaveLength(2);
    expect(clonePayments.map((p) => p.id).sort()).toEqual(
      [paymentA.id, paymentB.id].sort()
    );
    expect(clone.paymentReceivedAmountValue).toBe(500_000);
    expect(clone.dueAmountValue).toBe(900_000);
    expect(clone.versionNumber).toBe(source.versionNumber + 1);
    expect(clone.payments).toHaveLength(2);
  });
});
