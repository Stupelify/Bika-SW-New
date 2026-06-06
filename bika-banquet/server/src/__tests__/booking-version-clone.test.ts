import { cloneBookingVersion } from '../controllers/booking.shared';

describe('cloneBookingVersion', () => {
  it('carries payment summary forward when creating a new version', async () => {
    const sourceBooking = {
      id: 'booking-v1',
      customerId: 'customer-1',
      secondCustomerId: null,
      referredById: null,
      rating: null,
      secondRating: null,
      priority: null,
      secondPriority: null,
      functionName: 'Wedding',
      functionType: 'Reception',
      functionDate: new Date('2026-06-06T00:00:00.000Z'),
      functionTime: 'Dinner',
      startTime: null,
      endTime: null,
      startDateTime: null,
      endDateTime: null,
      expectedGuests: 100,
      confirmedGuests: 100,
      totalAmount: '100000',
      totalBillAmount: '100000',
      totalBillAmountValue: 100000,
      finalAmount: '85000',
      finalAmountValue: 85000,
      discountAmount: '15000',
      discountPercentage: 15,
      discountAmount2nd: null,
      discountAmount2ndValue: null,
      discountPercentage2nd: null,
      discountPercentage2ndValue: null,
      taxAmount: null,
      grandTotal: '85000',
      advanceRequired: null,
      advanceRequiredValue: null,
      paymentReceivedAmount: '35000',
      paymentReceivedAmountValue: 35000,
      dueAmount: '50000',
      dueAmountValue: 50000,
      status: 'confirmed',
      quotation: null,
      isQuotation: false,
      isLatest: false,
      previousBookingId: null,
      versionNumber: 1,
      notes: null,
      internalNotes: null,
      halls: [],
      packs: [],
      additionalItems: [],
    };

    let createData: Record<string, unknown> | undefined;
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(sourceBooking),
        create: jest.fn().mockImplementation(async ({ data }) => {
          createData = data;
          return { ...sourceBooking, ...data, id: 'booking-v2' };
        }),
      },
    } as any;

    await cloneBookingVersion(tx, sourceBooking.id);

    expect(createData).toMatchObject({
      paymentReceivedAmount: '35000',
      paymentReceivedAmountValue: 35000,
      dueAmount: '50000',
      dueAmountValue: 50000,
    });
  });
});
