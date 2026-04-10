// ─────────────────────────────────────────────────────────────────────────────
//  Shared types used by all BookingWizard steps
// ─────────────────────────────────────────────────────────────────────────────

export type PackKey = 'breakfast' | 'lunch' | 'hiTea' | 'dinner';

export const PACK_LABELS: Record<PackKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  hiTea: 'Hi-Tea',
  dinner: 'Dinner',
};

export const PACK_COLORS: Record<PackKey, { border: string; bg: string; accent: string }> = {
  breakfast: { border: '#fed7aa', bg: '#fff7ed', accent: '#f97316' },
  lunch:     { border: '#bbf7d0', bg: '#f0fdf4', accent: '#22c55e' },
  hiTea:     { border: '#e2e8f0', bg: '#f8fafc', accent: '#64748b' },
  dinner:    { border: '#c7d2fe', bg: '#eef2ff', accent: '#6366f1' },
};

export const FUNCTION_TYPE_OPTIONS = [
  'Marriage',
  'Tilak/Sangeet',
  'Reception',
  'Engagement/Ring Ceremony',
  'Roka',
  'Kirtan/Mangal Path',
  'Anniversary',
  'Birthday',
  'Mayra/Bhaat',
  'Jalwa Party',
  'Other',
] as const;

export interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  priority?: number | null;
}

export interface BanquetOption {
  id: string;
  name: string;
}

export interface HallOption {
  id: string;
  name: string;
  banquet?: { id: string; name: string } | null;
}

export interface ItemOption {
  id: string;
  name: string;
  point?: number | null;
  points?: number | null;
  itemType?: {
    id: string;
    name: string;
    order?: number | null;
    displayOrder?: number | null;
  };
}

export interface TemplateMenuOption {
  id: string;
  name: string;
  items: Array<{
    id: string;
    item: {
      id: string;
      name: string;
      itemType?: { id: string; name: string; order?: number | null; displayOrder?: number | null };
    };
  }>;
}

export interface PaymentRow {
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
}

export interface PackFormRow {
  bookingPackId?: string;
  enabled: boolean;
  withHall: boolean;
  withCatering: boolean;
  banquetId: string;
  hallIds: string[];
  templateMenuId: string;
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

export interface AdditionalItem {
  description: string;
  amount: string;
}

// ── Main wizard form state ────────────────────────────────────────────────────

export interface WizardFormData {
  // Step 1 — Event & Customer
  customerId: string;
  includeSecondCustomer: boolean;
  secondCustomerId: string;
  referredById: string;
  priority: string;
  functionType: string;
  functionDate: string;
  notes: string;

  // Step 2 — Halls & Timing
  packs: Record<PackKey, PackFormRow>;

  // Step 3 — Packs & Menu (menu items live inside packs)

  // Step 4 — Pricing & Payments
  advanceRequired: string;
  paymentReceivedPercent: string;
  dueAmount: string;
  finalDiscountAmount: string;
  finalDiscountPercent: string;
  finalAmount: string;
  settlementDiscountAmount: string;
  settlementAmount: string;
  additionalRequirements: AdditionalItem[];
  payments: PaymentRow[];
}

export const INITIAL_PACK: PackFormRow = {
  enabled: false,
  withHall: true,
  withCatering: true,
  banquetId: '',
  hallIds: [],
  templateMenuId: '',
  menuItemIds: [],
  startTime: '12:00',
  endTime: '15:00',
  hallRate: '',
  menuPoints: '',
  ratePerPlate: '',
  pax: '',
  amount: '0',
};

export const INITIAL_WIZARD_DATA: WizardFormData = {
  customerId: '',
  includeSecondCustomer: false,
  secondCustomerId: '',
  referredById: '',
  priority: '0',
  functionType: '',
  functionDate: '',
  notes: '',
  packs: {
    breakfast: { ...INITIAL_PACK, startTime: '08:00', endTime: '10:00' },
    lunch:     { ...INITIAL_PACK, startTime: '12:00', endTime: '15:00' },
    hiTea:     { ...INITIAL_PACK, startTime: '16:00', endTime: '18:00' },
    dinner:    { ...INITIAL_PACK, startTime: '19:00', endTime: '22:00' },
  },
  advanceRequired: '0',
  paymentReceivedPercent: '0',
  dueAmount: '0',
  finalDiscountAmount: '0',
  finalDiscountPercent: '0',
  finalAmount: '0',
  settlementDiscountAmount: '0',
  settlementAmount: '0',
  additionalRequirements: [],
  payments: [],
};

// Step configs to drive the progress bar
export const WIZARD_STEPS = [
  { id: 1, label: 'Event & Customer',   shortLabel: 'Event' },
  { id: 2, label: 'Venues & Timing',    shortLabel: 'Venues' },
  { id: 3, label: 'Menu & Packs',       shortLabel: 'Menu' },
  { id: 4, label: 'Pricing & Payments', shortLabel: 'Pricing' },
  { id: 5, label: 'Review & Submit',    shortLabel: 'Review' },
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number]['id'];
