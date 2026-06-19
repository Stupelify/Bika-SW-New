import { Prisma } from '@prisma/client';
import { resolvePaymentTotals } from '@bika/booking-core';
import prisma from '../config/database';
import { cloneBookingVersion } from '../controllers/booking.shared';

describe('resolvePaymentTotals (clone payment recompute)', () => {
  it('splits gross received vs credited due for future cheques', () => {
    const payable = 1_400_000;
    const futureClearing = new Date();
    futureClearing.setUTCDate(futureClearing.getUTCDate() + 30);

    const { grossReceived, credited, dueAmount } = resolvePaymentTotals(payable, [
      { method: 'cash', amount: 300_000, clearingDate: null },
      { method: 'cheque', amount: 200_000, clearingDate: futureClearing },
    ]);

    expect(grossReceived).toBe(500_000);
    expect(credited).toBe(300_000);
    expect(dueAmount).toBe(1_100_000);
  });

  it('sets due to zero when credited exceeds payable', () => {
    const { dueAmount } = resolvePaymentTotals(500_000, [
      { method: 'cash', amount: 600_000, clearingDate: null },
    ]);
    expect(dueAmount).toBe(0);
  });
});

describe('cloneBookingVersion moves payments', () => {
  const createdBookingIds: string[] = [];

  afterAll(async () => {
    for (const id of createdBookingIds) {
      await prisma.bookingPayments.deleteMany({ where: { bookingId: id } }).catch(() => {});
      await prisma.booking.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('moves payment rows to the clone and recomputes received/due', async () => {
    let customer: { id: string } | null;
    let receiver: { id: string } | null;
    try {
      customer = await prisma.customer.findFirst({ select: { id: true } });
      receiver = await prisma.user.findFirst({ select: { id: true } });
    } catch {
      console.log('Database unavailable — skipping clone payment integration test');
      return;
    }
    if (!customer || !receiver) {
      console.log('No customer/user in DB — skipping clone payment integration test');
      return;
    }

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
