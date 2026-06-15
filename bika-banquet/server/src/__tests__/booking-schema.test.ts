import { createBookingSchema, updateBookingSchema } from '../controllers/booking.write';

// A hall-only pack: catering disabled => client sends packCount/noOfPack = 0.
const hallOnlyPack = {
  packName: 'Lunch',
  packCount: 0,
  noOfPack: 0,
  ratePerPlate: 0,
  hallRate: '32500',
  menu: { name: 'Lunch Menu', items: [] },
};

const createBody = {
  customerId: 'cust1',
  functionName: 'Wedding',
  functionType: 'Reception',
  functionDate: '2026-07-01',
  functionTime: '12:00',
  expectedGuests: 100,
  packs: [hallOnlyPack],
};

describe('booking schemas — hall-only packs (catering disabled)', () => {
  it('createBookingSchema accepts packCount/noOfPack = 0', () => {
    expect(() => createBookingSchema.parse({ body: createBody })).not.toThrow();
  });

  it('updateBookingSchema accepts packCount/noOfPack = 0', () => {
    expect(() => updateBookingSchema.parse({ body: { packs: [hallOnlyPack] } })).not.toThrow();
  });

  it('still rejects negative pack counts', () => {
    const badPack = { ...hallOnlyPack, packCount: -1 };
    expect(() => createBookingSchema.parse({ body: { ...createBody, packs: [badPack] } })).toThrow();
  });
});
