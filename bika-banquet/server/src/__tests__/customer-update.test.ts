const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCreateAuditLog = jest.fn();
const mockBroadcastBookingEvent = jest.fn();

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    customer: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

jest.mock('../utils/auditLog', () => ({
  createAuditLog: mockCreateAuditLog,
}));

jest.mock('../sse', () => ({
  broadcastBookingEvent: mockBroadcastBookingEvent,
}));

import { updateCustomer } from '../controllers/customer.controller';

function responseMock() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as any;
}

describe('updateCustomer optional contact fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears derived E.164 search fields when optional phones are cleared', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'Existing Customer',
      phone: '9876543210',
      phoneCountryCode: '+91',
      phoneE164: '+919876543210',
      alterPhone: '9123456789',
      alterPhoneCountryCode: '+91',
      alternatePhoneE164: '+919123456789',
      whatsappNumber: '9988776655',
      whatsappCountryCode: '+91',
      whatsappE164: '+919988776655',
      isWhatsappSameAsPhone: false,
    });
    mockUpdate.mockResolvedValue({ id: 'cust-1', name: 'Existing Customer' });

    const req = {
      params: { id: 'cust-1' },
      body: {
        email: null,
        alterPhone: null,
        alterPhoneCountryCode: null,
        whatsappNumber: null,
        whatsappCountryCode: null,
      },
      headers: {},
      socket: {},
    } as any;
    const res = responseMock();

    await updateCustomer(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cust-1' },
        data: expect.objectContaining({
          email: null,
          alterPhone: null,
          alterPhoneCountryCode: null,
          whatsappNumber: null,
          whatsappCountryCode: null,
          alternatePhoneE164: null,
          whatsappE164: null,
          isWhatsappSameAsPhone: true,
        }),
      })
    );
  });
});
