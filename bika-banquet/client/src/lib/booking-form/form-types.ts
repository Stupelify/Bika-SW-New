import type { PaymentRow } from './types';
import type { PackKey } from './constants';

export interface BookingPackRow {
  bookingPackId?: string;
  enabled: boolean;
  withHall: boolean;
  withCatering: boolean;
  banquetId: string;
  hallIds: string[];
  templateMenuId: string;
  templateMenuName?: string;
  menuItemIds: string[];
  startTime: string;
  endTime: string;
  hallRate: string;
  menuPoints: string;
  ratePerPlate: string;
  pax: string;
  amount: string;
  extraPlate?: number;
  extraRateValue?: number;
  extraRate?: string;
  extraAmountValue?: number;
  extraAmount?: string;
  extraCharges?: number;
  setupCost?: string;
}

export interface AdditionalRequirementRow {
  description: string;
  amount: string;
}

export interface BookingFormReadOnlyData {
  primaryCustomerLabel: string;
  secondCustomerLabel: string;
  referredByLabel: string;
  priority: string;
  functionType: string;
  functionDate: string;
  isPencilBooking: boolean;
  pencilExpiresAt: string;
  finalDiscountAmount: string;
  finalDiscountPercent: string;
  finalAmount: string;
  notes: string;
  additionalRequirements: AdditionalRequirementRow[];
  packs: Record<PackKey, BookingPackRow>;
  payments: PaymentRow[];
}

export const EMPTY_PACK_ROW: BookingPackRow = {
  enabled: false,
  withHall: true,
  withCatering: true,
  banquetId: '',
  hallIds: [],
  templateMenuId: '',
  menuItemIds: [],
  startTime: '',
  endTime: '',
  hallRate: '',
  menuPoints: '',
  ratePerPlate: '',
  pax: '',
  amount: '0',
};

export function createEmptyPacks(): Record<PackKey, BookingPackRow> {
  return {
    breakfast: { ...EMPTY_PACK_ROW, startTime: '08:00', endTime: '10:00' },
    lunch: { ...EMPTY_PACK_ROW, startTime: '12:00', endTime: '15:00' },
    hiTea: { ...EMPTY_PACK_ROW, startTime: '16:00', endTime: '18:00' },
    dinner: { ...EMPTY_PACK_ROW, startTime: '19:00', endTime: '22:00' },
  };
}
