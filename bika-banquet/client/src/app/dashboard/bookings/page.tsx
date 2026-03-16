'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  FileText,
  Flag,
  Lock,
  Plus,
  Printer,
  Save,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import {
  CASTE_OPTIONS,
  COUNTRY_DIAL_CODE_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_PHONE_COUNTRY_ISO,
  EMAIL_REGEX,
  NAME_REGEX,
  PRIORITY_OPTIONS,
  digitsOnly,
  getDialCodeOption,
  getExpectedPhoneDigits,
  getPhoneCodeByIso,
  sanitizeNameInput,
  validatePhoneNumberForCountry,
} from '@/lib/customerFormOptions';
import MobileBookingCard from '@/components/MobileBookingCard';
import FloatingActionButton from '@/components/FloatingActionButton';

interface Booking {
  id: string;
  customerId?: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  expectedGuests: number;
  status: string;
  isQuotation: boolean;
  grandTotal: number;
  customer: {
    name: string;
    phone: string;
  };
}

interface BookingMenuPackOption {
  id: string;
  name: string;
  itemCount: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  priority?: number | null;
}

type CustomerSearchField = 'primary' | 'second' | 'referred';

interface CustomerSearchInputState {
  primary: string;
  second: string;
  referred: string;
}

interface BanquetOption {
  id: string;
  name: string;
}

interface HallOption {
  id: string;
  name: string;
  banquet?: {
    id: string;
    name: string;
  } | null;
}

interface ItemOption {
  id: string;
  name: string;
  point?: number | null;
  points?: number | null;
  itemType?: {
    id: string;
    name: string;
  };
}

interface TemplateMenuOption {
  id: string;
  name: string;
  items: Array<{
    id: string;
    item: {
      id: string;
      name: string;
      itemType?: {
        id: string;
        name: string;
      };
    };
  }>;
}

type PackKey = 'breakfast' | 'lunch' | 'hiTea' | 'dinner';
type AmountSyncMode = 'discountPercent' | 'discountAmount' | 'finalAmount';

interface BookingPackRow {
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

interface PaymentRow {
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
}

interface AdditionalRequirementRow {
  description: string;
  amount: string;
}

interface InlineCustomerFormData {
  name: string;
  phoneCountryIso: string;
  phone: string;
  alterPhoneCountryIso: string;
  alterPhone: string;
  whatsappCountryIso: string;
  whatsappNumber: string;
  email: string;
  caste: string;
  country: string;
  pincode: string;
  city: string;
  state: string;
  street1: string;
  street2: string;
  facebookProfile: string;
  instagramHandle: string;
  twitter: string;
  linkedin: string;
  referredById: string;
  priority: string;
  rating: string;
  notes: string;
}

interface BookingFormData {
  customerId: string;
  includeSecondCustomer: boolean;
  secondCustomerId: string;
  referredById: string;
  priority: string;
  functionType: string;
  functionDate: string;
  advanceRequired: string;
  paymentReceivedPercent: string;
  dueAmount: string;
  settlementDiscountAmount: string;
  settlementAmount: string;
  finalDiscountAmount: string;
  finalDiscountPercent: string;
  finalAmount: string;
  notes: string;
  additionalRequirements: AdditionalRequirementRow[];
  packs: Record<PackKey, BookingPackRow>;
  payments: PaymentRow[];
}

const initialFormData: BookingFormData = {
  customerId: '',
  includeSecondCustomer: false,
  secondCustomerId: '',
  referredById: '',
  priority: '0',
  functionType: '',
  functionDate: '',
  advanceRequired: '0',
  paymentReceivedPercent: '0',
  dueAmount: '0',
  settlementDiscountAmount: '0',
  settlementAmount: '0',
  finalDiscountAmount: '0',
  finalDiscountPercent: '0',
  finalAmount: '0',
  notes: '',
  additionalRequirements: [],
  packs: {
    breakfast: {
      enabled: false,
      withHall: true,
      withCatering: true,
      banquetId: '',
      hallIds: [],
      templateMenuId: '',
      menuItemIds: [],
      startTime: '08:00',
      endTime: '10:00',
      hallRate: '',
      menuPoints: '',
      ratePerPlate: '',
      pax: '',
      amount: '0',
    },
    lunch: {
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
    },
    hiTea: {
      enabled: false,
      withHall: true,
      withCatering: true,
      banquetId: '',
      hallIds: [],
      templateMenuId: '',
      menuItemIds: [],
      startTime: '16:00',
      endTime: '18:00',
      hallRate: '',
      menuPoints: '',
      ratePerPlate: '',
      pax: '',
      amount: '0',
    },
    dinner: {
      enabled: false,
      withHall: true,
      withCatering: true,
      banquetId: '',
      hallIds: [],
      templateMenuId: '',
      menuItemIds: [],
      startTime: '19:00',
      endTime: '22:00',
      hallRate: '',
      menuPoints: '',
      ratePerPlate: '',
      pax: '',
      amount: '0',
    },
  },
  payments: [],
};

const initialInlineCustomerFormData: InlineCustomerFormData = {
  name: '',
  phoneCountryIso: DEFAULT_PHONE_COUNTRY_ISO,
  phone: '',
  alterPhoneCountryIso: DEFAULT_PHONE_COUNTRY_ISO,
  alterPhone: '',
  whatsappCountryIso: DEFAULT_PHONE_COUNTRY_ISO,
  whatsappNumber: '',
  email: '',
  caste: '',
  country: 'India',
  pincode: '',
  city: '',
  state: '',
  street1: '',
  street2: '',
  facebookProfile: '',
  instagramHandle: '',
  twitter: '',
  linkedin: '',
  referredById: '',
  priority: '3',
  rating: '0',
  notes: '',
};

const PACK_LABELS: Record<PackKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  hiTea: 'Hi-Tea',
  dinner: 'Dinner',
};

const PACK_ROW_STYLES: Record<PackKey, string> = {
  breakfast: 'border-orange-200 bg-orange-50',
  lunch: 'border-green-200 bg-green-50',
  hiTea: 'border-slate-200 bg-slate-50',
  dinner: 'border-slate-300 bg-slate-100',
};

const FUNCTION_TYPE_OPTIONS = [
  'Wedding',
  'Reception',
  'Birthday Party',
  'Anniversary',
  'Corporate Event',
  'Other',
] as const;

const initialColumnSearch = {
  functionName: '',
  customer: '',
  functionDate: '',
  expectedGuests: '',
  status: '',
  grandTotal: '',
};

const BOOKINGS_PAGE_SIZE = 75;

function formatCustomerLabel(customer?: {
  name?: string | null;
  phone?: string | null;
} | null): string {
  if (!customer) return '';
  const name = (customer.name || '').trim();
  const phone = (customer.phone || '').trim();
  if (!name && !phone) return '';
  if (!phone) return name;
  if (!name) return phone;
  return `${name} (${phone})`;
}

function compareCustomersByName(a: CustomerOption, b: CustomerOption): number {
  const aName = (a.name || '').trim();
  const bName = (b.name || '').trim();
  const nameCompare = aName.localeCompare(bName, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (nameCompare !== 0) return nameCompare;

  const phoneCompare = (a.phone || '').localeCompare(b.phone || '', undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (phoneCompare !== 0) return phoneCompare;

  return a.id.localeCompare(b.id);
}

function formatDateTimeLabel(value?: string | Date | null): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return `${formatDateDDMMYYYY(parsed.toISOString())} ${parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function BookingsPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewBooking = hasAnyPermission(permissionSet, ['view_booking', 'manage_bookings']);
  const canAddBooking = hasAnyPermission(permissionSet, ['add_booking', 'manage_bookings']);
  const canEditBooking = hasAnyPermission(permissionSet, ['edit_booking', 'manage_bookings']);
  const canDeleteBooking = hasAnyPermission(permissionSet, ['delete_booking', 'manage_bookings']);
  const canAddCustomer = hasAnyPermission(permissionSet, ['add_customer', 'manage_customers']);
  const canExportMenuPdf = canViewBooking;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [banquets, setBanquets] = useState<BanquetOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [expandedHistoryVersions, setExpandedHistoryVersions] = useState<Record<string, boolean>>(
    {}
  );
  const [showPartyOverModal, setShowPartyOverModal] = useState(false);
  const [partyOverPlates, setPartyOverPlates] = useState<Record<string, number>>({});
  const [partyOverRates, setPartyOverRates] = useState<Record<string, number>>({});
  const [activePartyOverBooking, setActivePartyOverBooking] = useState<any>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingBookingStatus, setEditingBookingStatus] = useState<string | null>(null);
  const [menuEditorPack, setMenuEditorPack] = useState<PackKey | null>(null);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [menuPdfBookingId, setMenuPdfBookingId] = useState<string | null>(null);
  const [menuPdfBookingName, setMenuPdfBookingName] = useState('');
  const [menuPdfPackOptions, setMenuPdfPackOptions] = useState<BookingMenuPackOption[]>([]);
  const [menuPdfPackId, setMenuPdfPackId] = useState('');
  const [menuPdfLoading, setMenuPdfLoading] = useState(false);
  const [menuPdfSetupLoading, setMenuPdfSetupLoading] = useState(false);
  const [menuPdfPreviewUrl, setMenuPdfPreviewUrl] = useState<string | null>(null);
  const [openHallPickerPack, setOpenHallPickerPack] = useState<PackKey | null>(null);
  const [customerSearchInputs, setCustomerSearchInputs] =
    useState<CustomerSearchInputState>({
      primary: '',
      second: '',
      referred: '',
    });
  const [activeCustomerSearchField, setActiveCustomerSearchField] =
    useState<CustomerSearchField | null>(null);
  const hallPickerContainerRef = useRef<HTMLDivElement | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({
    key: 'functionDate',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [inlineCustomerFormData, setInlineCustomerFormData] = useState<InlineCustomerFormData>(
    initialInlineCustomerFormData
  );
  const [inlineCustomerSaving, setInlineCustomerSaving] = useState(false);
  const [isInlineWhatsappDifferent, setIsInlineWhatsappDifferent] = useState(false);
  const [inlineCustomerEmailError, setInlineCustomerEmailError] = useState('');
  const [inlineCustomerPhoneErrors, setInlineCustomerPhoneErrors] = useState<{
    phone?: string;
    alterPhone?: string;
    whatsappNumber?: string;
  }>({});
  const [amountSyncMode, setAmountSyncMode] = useState<AmountSyncMode>('discountPercent');
  const isReadOnlyBooking = useMemo(
    () => Boolean(editingBookingId && editingBookingStatus === 'completed'),
    [editingBookingId, editingBookingStatus]
  );
  const todayIsoDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const inlinePrimaryPhoneDigits = getExpectedPhoneDigits(
    inlineCustomerFormData.phoneCountryIso
  );
  const inlineSecondaryPhoneDigits = getExpectedPhoneDigits(
    inlineCustomerFormData.alterPhoneCountryIso
  );
  const inlineWhatsappPhoneDigits = getExpectedPhoneDigits(
    inlineCustomerFormData.whatsappCountryIso
  );

  const tableColumns = useMemo<TableColumnConfig<Booking>[]>(
    () => [
      {
        key: 'functionName',
        accessor: (booking) => `${booking.functionName} ${booking.functionType}`,
      },
      {
        key: 'customer',
        accessor: (booking) =>
          `${booking.customer?.name ?? ''} ${booking.customer?.phone ?? ''}`,
      },
      {
        key: 'functionDate',
        accessor: (booking) => booking.functionDate,
      },
      {
        key: 'expectedGuests',
        accessor: (booking) => booking.expectedGuests,
      },
      {
        key: 'status',
        accessor: (booking) =>
          booking.isQuotation ? 'Quotation' : booking.status,
      },
      {
        key: 'grandTotal',
        accessor: (booking) => booking.grandTotal ?? 0,
      },
    ],
    []
  );

  const filteredBookings = useMemo(
    () => filterAndSortRows(bookings, tableColumns, globalSearch, columnSearch, sort),
    [bookings, tableColumns, globalSearch, columnSearch, sort]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PAGE_SIZE)),
    [filteredBookings.length]
  );

  const paginatedBookings = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * BOOKINGS_PAGE_SIZE;
    return filteredBookings.slice(startIndex, startIndex + BOOKINGS_PAGE_SIZE);
  }, [currentPage, filteredBookings, totalPages]);

  const historicalVersions = useMemo(
    () =>
      bookingHistory.filter(
        (entry: { id?: string | null }) => Boolean(entry?.id) && entry.id !== editingBookingId
      ),
    [bookingHistory, editingBookingId]
  );

  // ── Diff helpers ─────────────────────────────────────────────────────────

  /** Shape we normalise both history entries and the live form into for diffing */
  type DiffPackSnapshot = {
    packName: string;
    pax: number;
    ratePerPlate: number;
    hallRate: number;
    menuItemIds: string[]; // raw item IDs
  };
  type DiffSnapshot = {
    functionDate: string;
    functionType: string;
    discountAmount: number;
    finalAmount: number;
    advanceRequired: number;
    dueAmount: number;
    packs: DiffPackSnapshot[];
  };

  /** Compute which fields differ between newer and older snapshots */
  function computeVersionDiff(
    newer: DiffSnapshot,
    older: DiffSnapshot
  ): {
    functionDate?: { from: string; to: string };
    functionType?: { from: string; to: string };
    discountAmountChange?: { from: number; to: number };
    finalAmountChange?: { from: number; to: number };
    advanceRequiredChange?: { from: number; to: number };
    dueAmountChange?: { from: number; to: number };
    packs: Record<string, {
      paxChange?: { from: number; to: number };
      ratePerPlateChange?: { from: number; to: number };
      hallRateChange?: { from: number; to: number };
      addedItemIds: string[];
      removedItemIds: string[];
    }>;
  } {
    const diff: ReturnType<typeof computeVersionDiff> = { packs: {} };
    if (newer.functionDate !== older.functionDate)
      diff.functionDate = { from: older.functionDate, to: newer.functionDate };
    if (newer.functionType !== older.functionType)
      diff.functionType = { from: older.functionType, to: newer.functionType };
    if (Math.abs(newer.discountAmount - older.discountAmount) > 0.001)
      diff.discountAmountChange = { from: older.discountAmount, to: newer.discountAmount };
    if (Math.abs(newer.finalAmount - older.finalAmount) > 0.001)
      diff.finalAmountChange = { from: older.finalAmount, to: newer.finalAmount };
    if (Math.abs(newer.advanceRequired - older.advanceRequired) > 0.001)
      diff.advanceRequiredChange = { from: older.advanceRequired, to: newer.advanceRequired };
    if (Math.abs(newer.dueAmount - older.dueAmount) > 0.001)
      diff.dueAmountChange = { from: older.dueAmount, to: newer.dueAmount };

    // Pack-level diffs — keyed by pack name (Breakfast, Lunch, etc.)
    const olderPackMap = new Map(older.packs.map((p) => [p.packName.toLowerCase(), p]));
    const newerPackMap = new Map(newer.packs.map((p) => [p.packName.toLowerCase(), p]));
    const allPackNames = new Set([...Array.from(olderPackMap.keys()), ...Array.from(newerPackMap.keys())]);
    allPackNames.forEach((key) => {
      const o = olderPackMap.get(key);
      const n = newerPackMap.get(key);
      const packDiff: (typeof diff.packs)[string] = {
        addedItemIds: [],
        removedItemIds: [],
      };
      if (o && n) {
        if (o.pax !== n.pax) packDiff.paxChange = { from: o.pax, to: n.pax };
        if (Math.abs(o.ratePerPlate - n.ratePerPlate) > 0.001)
          packDiff.ratePerPlateChange = { from: o.ratePerPlate, to: n.ratePerPlate };
        if (Math.abs(o.hallRate - n.hallRate) > 0.001)
          packDiff.hallRateChange = { from: o.hallRate, to: n.hallRate };
        const oldSet = new Set(o.menuItemIds);
        const newSet = new Set(n.menuItemIds);
        packDiff.addedItemIds = n.menuItemIds.filter((id) => !oldSet.has(id));
        packDiff.removedItemIds = o.menuItemIds.filter((id) => !newSet.has(id));
      } else if (!o && n) {
        // pack was added entirely
        packDiff.addedItemIds = [...n.menuItemIds];
      } else if (o && !n) {
        // pack was removed entirely
        packDiff.removedItemIds = [...o.menuItemIds];
      }
      const hasDiff =
        packDiff.paxChange ||
        packDiff.ratePerPlateChange ||
        packDiff.hallRateChange ||
        packDiff.addedItemIds.length > 0 ||
        packDiff.removedItemIds.length > 0;
      if (hasDiff) diff.packs[key] = packDiff;
    });
    return diff;
  }

  /** Converts a raw history entry to a normalised DiffSnapshot */
  function histToSnapshot(hist: any): DiffSnapshot {
    const resolved = hist?.snapshotData && typeof hist.snapshotData === 'object'
      ? hist.snapshotData
      : hist;
    const histPacks: any[] = Array.isArray(resolved?.packs) ? resolved.packs : [];
    return {
      functionDate: (resolved?.functionDate || hist?.functionDate || '').slice(0, 10),
      functionType: resolved?.functionType || hist?.functionType || '',
      discountAmount: Number(resolved?.discountAmountValue ?? resolved?.discountAmount ?? hist?.discountAmount ?? 0),
      finalAmount: Number(resolved?.finalAmountValue ?? resolved?.finalAmount ?? hist?.finalAmount ?? resolved?.grandTotal ?? hist?.grandTotal ?? 0),
      advanceRequired: Number(resolved?.advanceRequiredValue ?? resolved?.advanceRequired ?? hist?.advanceRequired ?? 0),
      dueAmount: Number(resolved?.dueAmountValue ?? resolved?.dueAmount ?? hist?.dueAmount ?? 0),
      packs: histPacks.map((pack: any) => {
        const packName = (pack?.packName || pack?.mealSlot?.name || '').trim();
        const menuItemIds: string[] = (pack?.bookingMenu?.items || [])
          .map((e: any) => e?.itemId || e?.item?.id || '')
          .filter(Boolean);
        return {
          packName,
          pax: Number(pack?.packCount ?? pack?.noOfPack ?? 0),
          ratePerPlate: Number(pack?.ratePerPlate ?? 0),
          hallRate: Number(pack?.hallRateValue ?? pack?.hallRate ?? 0),
          menuItemIds,
        };
      }),
    };
  }

  /** Most-recent finalized version (index 0 since list is newest-first) */
  const lastFinalizedVersion = useMemo(
    () => (historicalVersions.length > 0 ? historicalVersions[0] : null),
    [historicalVersions]
  );

  /** Live diff: current form state vs. the last finalized version */
  const formDiff = useMemo(() => {
    if (!editingBookingId || !lastFinalizedVersion) return null;
    const olderSnap = histToSnapshot(lastFinalizedVersion);
    const newerSnap: DiffSnapshot = {
      functionDate: formData.functionDate,
      functionType: formData.functionType,
      discountAmount: Number(formData.finalDiscountAmount || 0),
      finalAmount: Number(formData.finalAmount || 0),
      advanceRequired: Number(formData.advanceRequired || 0),
      dueAmount: Number(formData.dueAmount || 0),
      packs: (Object.keys(formData.packs) as PackKey[])
        .filter((k) => formData.packs[k].enabled)
        .map((k) => {
          const row = formData.packs[k];
          return {
            packName: PACK_LABELS[k],
            pax: Number(row.pax || 0),
            ratePerPlate: Number(row.ratePerPlate || 0),
            hallRate: Number(row.hallRate || 0),
            menuItemIds: [...row.menuItemIds],
          };
        }),
    };
    return computeVersionDiff(newerSnap, olderSnap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBookingId, lastFinalizedVersion, formData]);

  // ── End diff helpers ──────────────────────────────────────────────────────

  const customerReferrerOptions = useMemo(
    () => [...customers].sort(compareCustomersByName),
    [customers]
  );

  const totalPayments = useMemo(
    () =>
      formData.payments.reduce((sum, row) => {
        const amount = Number(row.amount || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [formData.payments]
  );

  const toNonNegativeNumber = useCallback((value: string): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  }, []);

  const calculatePackAmount = useCallback(
    (row: BookingPackRow): number => {
      const hallRate = row.withHall ? toNonNegativeNumber(row.hallRate) : 0;
      const ratePerPlate = row.withCatering ? toNonNegativeNumber(row.ratePerPlate) : 0;
      const pax = row.withCatering ? toNonNegativeNumber(row.pax) : 0;
      return hallRate + ratePerPlate * pax;
    },
    [toNonNegativeNumber]
  );

  const formatComputedAmount = useCallback((amount: number): string => {
    if (!Number.isFinite(amount)) return '0';
    const rounded = Number(amount.toFixed(2));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }, []);

  const totalPackAmount = useMemo(
    () =>
      (Object.keys(formData.packs) as PackKey[]).reduce((sum, key) => {
        const row = formData.packs[key];
        if (!row.enabled) return sum;
        return sum + calculatePackAmount(row);
      }, 0),
    [calculatePackAmount, formData.packs]
  );

  const totalAdditionalRequirementsAmount = useMemo(
    () =>
      formData.additionalRequirements.reduce((sum, requirement) => {
        const value = Number(requirement.amount || 0);
        if (!Number.isFinite(value)) return sum;
        return sum + Math.max(0, value);
      }, 0),
    [formData.additionalRequirements]
  );

  const totalBillAmount = useMemo(
    () => totalPackAmount + totalAdditionalRequirementsAmount,
    [totalAdditionalRequirementsAmount, totalPackAmount]
  );

  const enabledPackAmountRows = useMemo(
    () =>
      (Object.keys(formData.packs) as PackKey[])
        .map((packKey) => {
          const row = formData.packs[packKey];
          return {
            key: packKey,
            label: PACK_LABELS[packKey],
            enabled: row.enabled,
            amount: calculatePackAmount(row),
          };
        })
        .filter((entry) => entry.enabled),
    [calculatePackAmount, formData.packs]
  );

  const normalizeAmountSnapshot = useCallback(
    (
      mode: AmountSyncMode,
      sourceValue: string,
      totalAmount: number
    ): Pick<BookingFormData, 'finalDiscountAmount' | 'finalDiscountPercent' | 'finalAmount'> => {
      const total = Math.max(0, totalAmount);
      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      if (mode === 'discountPercent') {
        const discountPercent = clamp(toNonNegativeNumber(sourceValue), 0, 100);
        const discountAmount = (total * discountPercent) / 100;
        const finalAmount = Math.max(0, total - discountAmount);
        return {
          finalDiscountPercent: formatComputedAmount(discountPercent),
          finalDiscountAmount: formatComputedAmount(discountAmount),
          finalAmount: formatComputedAmount(finalAmount),
        };
      }

      if (mode === 'discountAmount') {
        const discountAmount = clamp(toNonNegativeNumber(sourceValue), 0, total);
        const discountPercent = total > 0 ? (discountAmount / total) * 100 : 0;
        const finalAmount = Math.max(0, total - discountAmount);
        return {
          finalDiscountPercent: formatComputedAmount(discountPercent),
          finalDiscountAmount: formatComputedAmount(discountAmount),
          finalAmount: formatComputedAmount(finalAmount),
        };
      }

      const finalAmount = clamp(toNonNegativeNumber(sourceValue), 0, total);
      const discountAmount = Math.max(0, total - finalAmount);
      const discountPercent = total > 0 ? (discountAmount / total) * 100 : 0;
      return {
        finalDiscountPercent: formatComputedAmount(discountPercent),
        finalDiscountAmount: formatComputedAmount(discountAmount),
        finalAmount: formatComputedAmount(finalAmount),
      };
    },
    [formatComputedAmount, toNonNegativeNumber]
  );

  const activeMenuPackRow = menuEditorPack ? formData.packs[menuEditorPack] : null;

  const filteredMenuItems = useMemo(() => {
    const query = menuItemSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const group = item.itemType?.name || '';
      return (
        item.name.toLowerCase().includes(query) || group.toLowerCase().includes(query)
      );
    });
  }, [items, menuItemSearch]);

  const setCustomerIdForField = useCallback(
    (field: CustomerSearchField, customerId: string) => {
      setFormData((prev) => {
        if (field === 'primary') {
          const selectedCustomer = customers.find((customer) => customer.id === customerId);
          const selectedPriority =
            selectedCustomer?.priority !== null && selectedCustomer?.priority !== undefined
              ? String(selectedCustomer.priority)
              : prev.priority || '3';
          return { ...prev, customerId, priority: selectedPriority };
        }
        if (field === 'second') {
          return { ...prev, secondCustomerId: customerId };
        }
        return { ...prev, referredById: customerId };
      });
    },
    [customers]
  );

  const getSelectedCustomerId = useCallback(
    (field: CustomerSearchField): string => {
      if (field === 'primary') return formData.customerId;
      if (field === 'second') return formData.secondCustomerId;
      return formData.referredById;
    },
    [formData.customerId, formData.secondCustomerId, formData.referredById]
  );

  const getCustomerSuggestions = useCallback(
    (field: CustomerSearchField): CustomerOption[] => {
      const query = (customerSearchInputs[field] || '').trim().toLowerCase();
      let filtered = [...customers].sort(compareCustomersByName);
      if (query) {
        filtered = filtered.filter((customer) => {
          const name = (customer.name || '').toLowerCase();
          const phone = (customer.phone || '').toLowerCase();
          const label = formatCustomerLabel(customer).toLowerCase();
          return (
            name.includes(query) ||
            phone.includes(query) ||
            label.includes(query)
          );
        });
      }

      const selectedCustomerId = getSelectedCustomerId(field);
      if (
        selectedCustomerId &&
        !filtered.some((customer) => customer.id === selectedCustomerId)
      ) {
        const selectedCustomer = customers.find(
          (customer) => customer.id === selectedCustomerId
        );
        if (selectedCustomer) {
          filtered = [selectedCustomer, ...filtered];
        }
      }

      return filtered.slice(0, 80);
    },
    [customerSearchInputs, customers, getSelectedCustomerId]
  );

  const handleCustomerInputChange = useCallback(
    (field: CustomerSearchField, rawValue: string) => {
      setCustomerSearchInputs((prev) => ({ ...prev, [field]: rawValue }));
      setActiveCustomerSearchField(field);

      const query = rawValue.trim().toLowerCase();
      if (!query) {
        setCustomerIdForField(field, '');
        return;
      }

      const exactMatch = customers.find((customer) => {
        const name = (customer.name || '').toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        const label = formatCustomerLabel(customer).toLowerCase();
        return name === query || phone === query || label === query;
      });

      setCustomerIdForField(field, exactMatch?.id || '');
    },
    [customers, setCustomerIdForField]
  );

  const selectCustomerSuggestion = useCallback(
    (field: CustomerSearchField, customer: CustomerOption) => {
      setCustomerIdForField(field, customer.id);
      setCustomerSearchInputs((prev) => ({
        ...prev,
        [field]: formatCustomerLabel(customer),
      }));
      setActiveCustomerSearchField(null);
    },
    [setCustomerIdForField]
  );

  useEffect(() => {
    if (!showCreateForm) return;
    if (activeCustomerSearchField) return;

    setCustomerSearchInputs((prev) => {
      const primaryCustomer = customers.find(
        (customer) => customer.id === formData.customerId
      );
      const secondCustomer = customers.find(
        (customer) => customer.id === formData.secondCustomerId
      );
      const referredCustomer = customers.find(
        (customer) => customer.id === formData.referredById
      );

      const nextPrimary = formData.customerId
        ? primaryCustomer
          ? formatCustomerLabel(primaryCustomer)
          : prev.primary
        : '';
      const nextSecond = formData.secondCustomerId
        ? secondCustomer
          ? formatCustomerLabel(secondCustomer)
          : prev.second
        : '';
      const nextReferred = formData.referredById
        ? referredCustomer
          ? formatCustomerLabel(referredCustomer)
          : prev.referred
        : '';

      if (
        nextPrimary === prev.primary &&
        nextSecond === prev.second &&
        nextReferred === prev.referred
      ) {
        return prev;
      }

      return {
        primary: nextPrimary,
        second: nextSecond,
        referred: nextReferred,
      };
    });
  }, [
    activeCustomerSearchField,
    customers,
    formData.customerId,
    formData.secondCustomerId,
    formData.referredById,
    showCreateForm,
  ]);

  useEffect(() => {
    if (!openHallPickerPack) {
      return;
    }

    const handleOutsidePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        hallPickerContainerRef.current &&
        !hallPickerContainerRef.current.contains(target)
      ) {
        setOpenHallPickerPack(null);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
    };
  }, [openHallPickerPack]);

  const groupedMenuItems = useMemo(() => {
    const map = new Map<string, ItemOption[]>();
    filteredMenuItems.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const existing = map.get(group) || [];
      existing.push(item);
      map.set(group, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredMenuItems]);

  const selectedMenuItemsByGroup = useMemo(() => {
    if (!activeMenuPackRow) return [] as Array<[string, ItemOption[]]>;
    const selected = activeMenuPackRow.menuItemIds
      .map((itemId) => items.find((entry) => entry.id === itemId))
      .filter(Boolean) as ItemOption[];
    const map = new Map<string, ItemOption[]>();
    selected.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const bucket = map.get(group) || [];
      bucket.push(item);
      map.set(group, bucket);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activeMenuPackRow, items]);

  const getItemPoints = useCallback((item?: ItemOption | null): number => {
    if (!item) return 0;
    const rawPoints = item.points ?? item.point ?? 0;
    const numericPoints = Number(rawPoints);
    if (!Number.isFinite(numericPoints)) return 0;
    return Math.max(0, numericPoints);
  }, []);

  const calculateMenuPoints = useCallback(
    (menuItemIds: string[]): string => {
      if (!menuItemIds.length) return '';
      const totalPoints = menuItemIds.reduce((sum, itemId) => {
        const item = items.find((entry) => entry.id === itemId);
        return sum + getItemPoints(item);
      }, 0);
      return String(totalPoints);
    },
    [getItemPoints, items]
  );

  const updatePackRow = (packKey: PackKey, patch: Partial<BookingPackRow>) => {
    setFormData((prev) => ({
      ...prev,
      packs: {
        ...prev.packs,
        [packKey]: { ...prev.packs[packKey], ...patch },
      },
    }));
  };

  const togglePackMenuItem = (packKey: PackKey, itemId: string) => {
    setFormData((prev) => {
      const row = prev.packs[packKey];
      const alreadySelected = row.menuItemIds.includes(itemId);
      const nextIds = alreadySelected
        ? row.menuItemIds.filter((id) => id !== itemId)
        : [...row.menuItemIds, itemId];
      const nextMenuPoints = calculateMenuPoints(nextIds);
      return {
        ...prev,
        packs: {
          ...prev.packs,
          [packKey]: {
            ...row,
            menuItemIds: nextIds,
            menuPoints: nextMenuPoints,
          },
        },
      };
    });
  };

  const importTemplateToPack = (packKey: PackKey, templateMenuId: string) => {
    const template = templateMenus.find((entry) => entry.id === templateMenuId);
    const importedItemIds = template?.items?.map((entry) => entry.item.id) || [];
    updatePackRow(packKey, {
      templateMenuId,
      menuItemIds: importedItemIds,
      menuPoints: calculateMenuPoints(importedItemIds),
    });
  };

  useEffect(() => {
    if (!showCreateForm || items.length === 0) return;

    setFormData((prev) => {
      let changed = false;
      const nextPacks = { ...prev.packs };
      (Object.keys(nextPacks) as PackKey[]).forEach((packKey) => {
        const row = nextPacks[packKey];
        const computedMenuPoints = calculateMenuPoints(row.menuItemIds);
        if (row.menuPoints !== computedMenuPoints) {
          changed = true;
          nextPacks[packKey] = {
            ...row,
            menuPoints: computedMenuPoints,
          };
        }
      });
      if (!changed) return prev;
      return {
        ...prev,
        packs: nextPacks,
      };
    });
  }, [calculateMenuPoints, items, showCreateForm]);

  useEffect(() => {
    if (!showCreateForm) return;
    setFormData((prev) => {
      const sourceValue =
        amountSyncMode === 'discountPercent'
          ? prev.finalDiscountPercent
          : amountSyncMode === 'discountAmount'
            ? prev.finalDiscountAmount
            : prev.finalAmount;
      const nextValues = normalizeAmountSnapshot(amountSyncMode, sourceValue, totalBillAmount);
      if (
        prev.finalDiscountAmount === nextValues.finalDiscountAmount &&
        prev.finalDiscountPercent === nextValues.finalDiscountPercent &&
        prev.finalAmount === nextValues.finalAmount
      ) {
        return prev;
      }
      return {
        ...prev,
        ...nextValues,
      };
    });
  }, [amountSyncMode, normalizeAmountSnapshot, showCreateForm, totalBillAmount]);

  const addPaymentRow = () => {
    setFormData((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          mode: '',
          narration: '',
          date: '',
          receivedBy: '',
          amount: '',
        },
      ],
    }));
  };

  const updatePaymentRow = (
    index: number,
    key: keyof PaymentRow,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      ),
    }));
  };

  useEffect(() => {
    void loadBookings();
  }, [canViewBooking]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnSearch, sort]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    void loadLookups();
  }, [canAddBooking, canEditBooking]);

  useEffect(() => {
    return () => {
      if (menuPdfPreviewUrl) {
        URL.revokeObjectURL(menuPdfPreviewUrl);
      }
    };
  }, [menuPdfPreviewUrl]);

  const resetInlineCustomerForm = () => {
    setInlineCustomerFormData(initialInlineCustomerFormData);
    setIsInlineWhatsappDifferent(false);
    setInlineCustomerEmailError('');
    setInlineCustomerPhoneErrors({});
  };

  const loadCustomerOptions = async (): Promise<CustomerOption[]> => {
    const customerRes = await api.getCustomers({ page: 1, limit: 5000 });
    const customerRows = customerRes.data?.data?.customers || [];
    const sortedCustomers = [...customerRows].sort(compareCustomersByName);
    setCustomers(sortedCustomers);
    return sortedCustomers;
  };

  const openQuickCustomerForm = () => {
    resetInlineCustomerForm();
    setShowAddCustomerForm(true);
  };

  const closeQuickCustomerForm = () => {
    if (inlineCustomerSaving) return;
    setShowAddCustomerForm(false);
    resetInlineCustomerForm();
  };

  const handleQuickCustomerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAddCustomer) {
      toast.error('You do not have permission to add customers.');
      return;
    }

    const name = inlineCustomerFormData.name.trim().replace(/\s+/g, ' ');
    const phone = digitsOnly(inlineCustomerFormData.phone);
    const secondPhone = digitsOnly(inlineCustomerFormData.alterPhone);
    const whatsappNumber = digitsOnly(inlineCustomerFormData.whatsappNumber);
    const email = inlineCustomerFormData.email.trim();
    const pincode = digitsOnly(inlineCustomerFormData.pincode);

    setInlineCustomerEmailError('');
    setInlineCustomerPhoneErrors({});

    if (!name) {
      toast.error('Full name is required');
      return;
    }
    if (!NAME_REGEX.test(name)) {
      toast.error('Name can contain only letters and spaces');
      return;
    }
    if (!phone) {
      const message = 'Phone number is required';
      setInlineCustomerPhoneErrors({ phone: message });
      toast.error(message);
      return;
    }

    const phoneValidationMessage = validatePhoneNumberForCountry(
      phone,
      inlineCustomerFormData.phoneCountryIso,
      'Phone number'
    );
    if (phoneValidationMessage) {
      setInlineCustomerPhoneErrors({ phone: phoneValidationMessage });
      toast.error(phoneValidationMessage);
      return;
    }

    if (secondPhone) {
      const secondPhoneMessage = validatePhoneNumberForCountry(
        secondPhone,
        inlineCustomerFormData.alterPhoneCountryIso,
        '2nd phone number'
      );
      if (secondPhoneMessage) {
        setInlineCustomerPhoneErrors({ alterPhone: secondPhoneMessage });
        toast.error(secondPhoneMessage);
        return;
      }
    }

    if (isInlineWhatsappDifferent) {
      if (!whatsappNumber) {
        toast.error('WhatsApp number is required when different from phone');
        return;
      }
      const whatsappMessage = validatePhoneNumberForCountry(
        whatsappNumber,
        inlineCustomerFormData.whatsappCountryIso,
        'WhatsApp number'
      );
      if (whatsappMessage) {
        setInlineCustomerPhoneErrors({ whatsappNumber: whatsappMessage });
        toast.error(whatsappMessage);
        return;
      }
    }

    if (email && !EMAIL_REGEX.test(email)) {
      const message = 'Email must contain @ and .';
      setInlineCustomerEmailError(message);
      toast.error(message);
      return;
    }

    if (pincode && (pincode.length < 4 || pincode.length > 10)) {
      toast.error('PIN code must contain 4 to 10 digits');
      return;
    }

    const phoneCountryCode = getPhoneCodeByIso(inlineCustomerFormData.phoneCountryIso);
    const alterPhoneCountryCode = getPhoneCodeByIso(inlineCustomerFormData.alterPhoneCountryIso);
    const effectiveWhatsappNumber = isInlineWhatsappDifferent ? whatsappNumber : phone;
    const whatsappCountryCode = isInlineWhatsappDifferent
      ? getPhoneCodeByIso(inlineCustomerFormData.whatsappCountryIso)
      : phoneCountryCode;
    const country = inlineCustomerFormData.country.trim();
    const city = inlineCustomerFormData.city.trim();
    const state = inlineCustomerFormData.state.trim();
    const street1 = inlineCustomerFormData.street1.trim();
    const street2 = inlineCustomerFormData.street2.trim();
    const addressParts = [street1, street2, city, state, pincode, country].filter(Boolean);

    try {
      setInlineCustomerSaving(true);
      const response = await api.createCustomer({
        name,
        phone,
        phoneCountryCode,
        email: email || undefined,
        alterPhone: secondPhone || undefined,
        alterPhoneCountryCode: secondPhone ? alterPhoneCountryCode : undefined,
        whatsappNumber: effectiveWhatsappNumber || undefined,
        whatsappCountryCode: effectiveWhatsappNumber ? whatsappCountryCode : undefined,
        caste: inlineCustomerFormData.caste || undefined,
        country: country || undefined,
        pincode: pincode || undefined,
        city: city || undefined,
        state: state || undefined,
        street1: street1 || undefined,
        street2: street2 || undefined,
        address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
        facebookProfile: inlineCustomerFormData.facebookProfile.trim() || undefined,
        instagramHandle: inlineCustomerFormData.instagramHandle.trim() || undefined,
        twitter: inlineCustomerFormData.twitter.trim() || undefined,
        linkedin: inlineCustomerFormData.linkedin.trim() || undefined,
        referredById: inlineCustomerFormData.referredById || undefined,
        priority: inlineCustomerFormData.priority
          ? Number(inlineCustomerFormData.priority)
          : undefined,
        rating: inlineCustomerFormData.rating || undefined,
        notes: inlineCustomerFormData.notes.trim() || undefined,
      });
      const createdCustomerId = response?.data?.data?.customer?.id as string | undefined;

      const updatedCustomers = await loadCustomerOptions();
      const createdCustomer = createdCustomerId
        ? updatedCustomers.find((customer) => customer.id === createdCustomerId)
        : updatedCustomers.find(
          (customer) =>
            customer.name === name &&
            (customer.phone || '') === phone
        );

      if (createdCustomer) {
        setCustomerIdForField('primary', createdCustomer.id);
        setCustomerSearchInputs((prev) => ({
          ...prev,
          primary: formatCustomerLabel(createdCustomer),
        }));
        setActiveCustomerSearchField(null);
      }

      toast.success('Customer added successfully');
      setShowAddCustomerForm(false);
      resetInlineCustomerForm();
    } catch (error: any) {
      const serverValidationErrors = error?.response?.data?.errors;
      if (Array.isArray(serverValidationErrors)) {
        const nextErrors: {
          phone?: string;
          alterPhone?: string;
          whatsappNumber?: string;
        } = {};
        let nextEmailError = '';
        serverValidationErrors.forEach((entry: any) => {
          const field = String(entry?.field || '');
          if (field.endsWith('phone') && !nextErrors.phone) {
            nextErrors.phone = entry?.message;
          }
          if (
            (field.endsWith('alterPhone') || field.endsWith('alternatePhone')) &&
            !nextErrors.alterPhone
          ) {
            nextErrors.alterPhone = entry?.message;
          }
          if (
            (field.endsWith('whatsappNumber') || field.endsWith('whatsapp')) &&
            !nextErrors.whatsappNumber
          ) {
            nextErrors.whatsappNumber = entry?.message;
          }
          if (field.endsWith('email') && !nextEmailError) {
            nextEmailError = entry?.message || '';
          }
        });
        setInlineCustomerPhoneErrors(nextErrors);
        setInlineCustomerEmailError(nextEmailError);
      }
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        'Failed to create customer';
      toast.error(message);
    } finally {
      setInlineCustomerSaving(false);
    }
  };

  const loadLookups = async () => {
    try {
      if (!canAddBooking && !canEditBooking) {
        setCustomers([]);
        setBanquets([]);
        setHalls([]);
        setItems([]);
        setTemplateMenus([]);
        return;
      }
      const [customerRows, banquetRes, hallRes, itemRes, templateRes] = await Promise.all([
        loadCustomerOptions(),
        api.getBanquets({ page: 1, limit: 5000 }),
        api.getHalls({ page: 1, limit: 5000 }),
        api.getItems({ page: 1, limit: 5000 }),
        api.getTemplateMenus({ page: 1, limit: 5000, includeItems: true }),
      ]);
      const banquetRows = banquetRes.data?.data?.banquets || [];
      const hallRows = hallRes.data?.data?.halls || [];
      const itemRows = itemRes.data?.data?.items || [];
      const templateRows = templateRes.data?.data?.templateMenus || [];
      setCustomers(customerRows);
      setBanquets(banquetRows);
      setHalls(hallRows);
      setItems(itemRows);
      setTemplateMenus(templateRows);
    } catch (error) {
      toast.error('Failed to load booking form options');
    }
  };

  const loadBookings = async () => {
    try {
      if (!canViewBooking) {
        setBookings([]);
        return;
      }
      setLoading(true);
      const response = await api.getBookings({
        page: 1,
        limit: 5000,
      });
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnSearch = (key: keyof typeof initialColumnSearch, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = () => {
    setGlobalSearch('');
    setColumnSearch(initialColumnSearch);
    setCurrentPage(1);
  };

  const closeBookingForm = () => {
    setShowCreateForm(false);
    setEditingBookingId(null);
    setEditingBookingStatus(null);
    setBookingHistory([]);
    setExpandedHistoryVersions({});
    setShowPartyOverModal(false);
    setPartyOverPlates({});
    setPartyOverRates({});
    setActivePartyOverBooking(null);
    setMenuEditorPack(null);
    setOpenHallPickerPack(null);
    setMenuItemSearch('');
    setCustomerSearchInputs({
      primary: '',
      second: '',
      referred: '',
    });
    setActiveCustomerSearchField(null);
    setAmountSyncMode('discountPercent');
    setFormData(initialFormData);
    // Clear any active search so the freshly-saved booking is always visible
    // in the list (Bug: booking appeared to vanish because search was still active)
    clearSearch();
  };

  const openCreateBooking = () => {
    setEditingBookingId(null);
    setEditingBookingStatus(null);
    setBookingHistory([]);
    setExpandedHistoryVersions({});
    setMenuEditorPack(null);
    setOpenHallPickerPack(null);
    setMenuItemSearch('');
    setCustomerSearchInputs({
      primary: '',
      second: '',
      referred: '',
    });
    setActiveCustomerSearchField(null);
    setAmountSyncMode('discountPercent');
    setFormData(initialFormData);
    setShowCreateForm(true);
  };

  const normalizePackKey = (value: string): PackKey | null => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'breakfast') return 'breakfast';
    if (normalized === 'lunch') return 'lunch';
    if (normalized === 'hi-tea' || normalized === 'hitea' || normalized === 'hi tea') {
      return 'hiTea';
    }
    if (normalized === 'dinner') return 'dinner';
    return null;
  };

  const openEditBooking = async (bookingId: string) => {
    try {
      setSaving(true);
      const [response, historyResponse] = await Promise.all([
        api.getBooking(bookingId),
        api.getBookingHistory(bookingId).catch(() => ({ data: { data: { history: [] } } }))
      ]);
      const booking = response.data?.data?.booking;
      if (!booking) {
        toast.error('Booking not found');
        return;
      }

      const historyRows = historyResponse.data?.data?.history || [];
      setBookingHistory(historyRows);
      const firstPreviousVersion = historyRows.find(
        (row: { id?: string }) => row?.id && row.id !== bookingId
      );
      setExpandedHistoryVersions(
        firstPreviousVersion?.id ? { [firstPreviousVersion.id]: true } : {}
      );

      const hallIdSet = new Set(halls.map((hall) => hall.id));
      const bookingHallIds = Array.from(
        new Set(
          (booking.halls || [])
            .map((row: any) => row?.hallId || row?.hall?.id || '')
            .filter((value: string) => value && hallIdSet.has(value))
        )
      );
      const primaryHallId = bookingHallIds[0] || '';
      const primaryHall = halls.find((hall) => hall.id === primaryHallId);
      const menuRows = booking.packs || [];
      const nextPacks = { ...initialFormData.packs };

      menuRows.forEach((pack: any) => {
        const packKey = normalizePackKey(pack?.mealSlot?.name || pack?.packName || '');
        if (!packKey) return;
        const rowMenuItemIds = (pack?.bookingMenu?.items || [])
          .map((entry: any) => entry.itemId || entry.item?.id)
          .filter(Boolean);
        const matchingTemplate = templateMenus.find((template) => {
          const templateIds = (template.items || []).map((entry) => entry.item.id);
          if (templateIds.length !== rowMenuItemIds.length) return false;
          const set = new Set(templateIds);
          return rowMenuItemIds.every((id: string) => set.has(id));
        });
        const packHallIds = Array.isArray(pack?.hallIds)
          ? pack.hallIds
            .map((value: unknown) => `${value ?? ''}`.trim())
            .filter((value: string) => value.length > 0 && hallIdSet.has(value))
          : [];
        const resolvedPackHallIds =
          packHallIds.length > 0 ? packHallIds : bookingHallIds;
        const firstPackHall = halls.find((hall) => hall.id === resolvedPackHallIds[0]);

        nextPacks[packKey] = {
          bookingPackId: pack.id,
          enabled: true,
          withHall: resolvedPackHallIds.length > 0 || Boolean(pack.hallRate),
          withCatering: true,
          banquetId: firstPackHall?.banquet?.id || primaryHall?.banquet?.id || '',
          hallIds: resolvedPackHallIds,
          templateMenuId: matchingTemplate?.id || '',
          menuItemIds: rowMenuItemIds,
          startTime: pack.startTime || nextPacks[packKey].startTime,
          endTime: pack.endTime || nextPacks[packKey].endTime,
          hallRate: pack.hallRate || '',
          menuPoints:
            pack.menuPoint !== null && pack.menuPoint !== undefined
              ? String(pack.menuPoint)
              : '',
          ratePerPlate:
            pack.ratePerPlate !== null && pack.ratePerPlate !== undefined
              ? String(pack.ratePerPlate)
              : '',
          pax:
            pack.packCount !== null && pack.packCount !== undefined
              ? String(pack.packCount)
              : '',
          amount: '',
          extraPlate: pack.extraPlate,
          extraRateValue: pack.extraRateValue,
          extraRate: pack.extraRate,
          extraAmountValue: pack.extraAmountValue,
          extraAmount: pack.extraAmount,
          extraCharges: pack.extraCharges,
          setupCost:
            pack.setupCost !== null && pack.setupCost !== undefined
              ? String(pack.setupCost)
              : undefined,
        };
      });

      setEditingBookingId(bookingId);
      setEditingBookingStatus(booking.status || null);
      setFormData({
        ...initialFormData,
        customerId: booking.customerId || booking.customer?.id || '',
        includeSecondCustomer: Boolean(booking.secondCustomerId),
        secondCustomerId: booking.secondCustomerId || '',
        referredById: booking.referredById || '',
        priority:
          booking.priority !== null && booking.priority !== undefined
            ? String(booking.priority)
            : '0',
        functionType: booking.functionType || '',
        functionDate: booking.functionDate ? booking.functionDate.slice(0, 10) : '',
        advanceRequired: booking.advanceRequired || '0',
        paymentReceivedPercent: booking.paymentReceivedPercent || '0',
        dueAmount: booking.dueAmount || '0',
        finalDiscountAmount:
          booking.discountAmount !== null && booking.discountAmount !== undefined
            ? String(booking.discountAmount)
            : '0',
        finalDiscountPercent:
          booking.discountPercentage !== null && booking.discountPercentage !== undefined
            ? String(booking.discountPercentage)
            : '0',
        finalAmount:
          booking.finalAmount ||
          (booking.grandTotal !== null && booking.grandTotal !== undefined
            ? String(booking.grandTotal)
            : '0'),
        notes: booking.notes || '',
        additionalRequirements: (booking.additionalItems || [])
          .map((entry: any) => ({
            description: entry.description || '',
            amount:
              entry.charges !== null && entry.charges !== undefined
                ? String(entry.charges)
                : '',
          }))
          .filter((entry: AdditionalRequirementRow) => entry.description || entry.amount),
        payments: (booking.payments || []).map((payment: any) => ({
          mode: payment.method || payment.paymentMethod || '',
          narration: payment.narration || '',
          date: payment.paymentDate ? payment.paymentDate.slice(0, 10) : '',
          receivedBy: payment.receiver?.name || '',
          amount:
            payment.amount !== null && payment.amount !== undefined
              ? String(payment.amount)
              : '',
        })),
        packs: nextPacks,
      });
      setCustomerSearchInputs({
        primary:
          formatCustomerLabel(
            customers.find(
              (customer) => customer.id === (booking.customerId || booking.customer?.id || '')
            )
          ) || formatCustomerLabel(booking.customer),
        second:
          formatCustomerLabel(
            customers.find((customer) => customer.id === (booking.secondCustomerId || ''))
          ) || formatCustomerLabel(booking.secondCustomer),
        referred:
          formatCustomerLabel(
            customers.find((customer) => customer.id === (booking.referredById || ''))
          ) || formatCustomerLabel(booking.referredBy),
      });
      setActiveCustomerSearchField(null);
      setOpenHallPickerPack(null);
      setAmountSyncMode('finalAmount');
      setShowCreateForm(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load booking');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await api.deleteBooking(bookingId);
      toast.success('Booking deleted successfully');
      await loadBookings();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete booking');
    }
  };

  const clearMenuPdfPreview = useCallback(() => {
    setMenuPdfPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
  }, []);

  const closeMenuPdfModal = useCallback(() => {
    setMenuPdfBookingId(null);
    setMenuPdfBookingName('');
    setMenuPdfPackOptions([]);
    setMenuPdfPackId('');
    setMenuPdfLoading(false);
    setMenuPdfSetupLoading(false);
    clearMenuPdfPreview();
  }, [clearMenuPdfPreview]);

  const loadMenuPdfPreview = useCallback(async (bookingId: string, packId: string) => {
    try {
      setMenuPdfLoading(true);
      const response = await api.getBookingMenuPdf(bookingId, packId);
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' });
      const previewUrl = URL.createObjectURL(blob);
      setMenuPdfPreviewUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return previewUrl;
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to generate menu PDF');
    } finally {
      setMenuPdfLoading(false);
    }
  }, []);

  const openMenuPdfModal = useCallback(async (booking: Booking) => {
    try {
      setMenuPdfBookingId(booking.id);
      setMenuPdfBookingName(
        booking.functionName || booking.functionType || booking.customer?.name || 'booking'
      );
      setMenuPdfPackOptions([]);
      setMenuPdfPackId('');
      clearMenuPdfPreview();
      setMenuPdfSetupLoading(true);

      const response = await api.getBooking(booking.id);
      const bookingDetails = response.data?.data?.booking;
      const packOptions: BookingMenuPackOption[] = (bookingDetails?.packs || [])
        .map((pack: any) => {
          const itemCount = (pack?.bookingMenu?.items || []).length;
          const packName =
            (pack?.packName || '').trim() ||
            (pack?.mealSlot?.name || '').trim() ||
            (pack?.bookingMenu?.name || '').trim() ||
            'Menu';
          return {
            id: pack.id,
            name: packName,
            itemCount,
          };
        })
        .filter((pack: BookingMenuPackOption) => pack.itemCount > 0);

      if (packOptions.length === 0) {
        toast.error('No menu items found for this booking');
        closeMenuPdfModal();
        return;
      }

      setMenuPdfPackOptions(packOptions);
      setMenuPdfPackId(packOptions[0].id);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load menu PDF options');
      closeMenuPdfModal();
    } finally {
      setMenuPdfSetupLoading(false);
    }
  }, [clearMenuPdfPreview, closeMenuPdfModal]);

  const handleDownloadMenuPdf = () => {
    if (!menuPdfPreviewUrl) return;
    const selectedPack = menuPdfPackOptions.find((pack) => pack.id === menuPdfPackId);
    const normalize = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'menu';
    const bookingToken = normalize(menuPdfBookingName || 'booking');
    const packToken = normalize(selectedPack?.name || 'menu');
    const link = document.createElement('a');
    link.href = menuPdfPreviewUrl;
    link.download = `${bookingToken}-${packToken}-menu.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!menuPdfBookingId || !menuPdfPackId) return;
    void loadMenuPdfPreview(menuPdfBookingId, menuPdfPackId);
  }, [loadMenuPdfPreview, menuPdfBookingId, menuPdfPackId]);

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.customerId || !formData.functionType.trim() || !formData.functionDate) {
      toast.error('Primary customer, function type and date are required');
      return;
    }
    if (!editingBookingId && formData.functionDate < todayIsoDate) {
      toast.error(
        `Function date cannot be before ${formatDateDDMMYYYY(todayIsoDate)} for new bookings`
      );
      return;
    }

    try {
      setSaving(true);
      const toNumber = (value: string) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const enabledPackEntries = (Object.keys(formData.packs) as PackKey[])
        .map((key) => ({ key, row: formData.packs[key] }))
        .filter((entry) => entry.row.enabled);
      const missingBanquetSelection = enabledPackEntries.find(
        (entry) => entry.row.withHall && !entry.row.banquetId
      );
      if (missingBanquetSelection) {
        toast.error(
          `Select banquet before halls for ${PACK_LABELS[missingBanquetSelection.key]}`
        );
        return;
      }
      const getValidHallIdsForPack = (row: BookingPackRow): string[] =>
        row.hallIds.filter((hallId) =>
          halls.some(
            (hall) =>
              hall.id === hallId &&
              (!row.banquetId || hall.banquet?.id === row.banquetId)
          )
        );
      const missingHallSelection = enabledPackEntries.find(
        (entry) => entry.row.withHall && getValidHallIdsForPack(entry.row).length === 0
      );
      if (missingHallSelection) {
        toast.error(
          `Select at least one hall for ${PACK_LABELS[missingHallSelection.key]}`
        );
        return;
      }
      const expectedGuests = Math.max(
        1,
        ...enabledPackEntries
          .map((entry) => Number(entry.row.pax || 0))
          .filter((value) => value > 0)
      );
      const normalizedDiscountAmount = Math.min(
        totalBillAmount,
        Math.max(0, toNumber(formData.finalDiscountAmount || '0'))
      );
      const normalizedDiscountPercent = Math.min(
        100,
        Math.max(0, toNumber(formData.finalDiscountPercent || '0'))
      );
      const normalizedFinalAmount = Math.min(
        totalBillAmount,
        Math.max(0, toNumber(formData.finalAmount || '0'))
      );
      const functionTime = enabledPackEntries[0]?.row.startTime || '12:00';
      const functionName = formData.functionType.trim();

      const hallChargeMap = new Map<string, number>();
      enabledPackEntries.forEach((entry) => {
        if (!entry.row.withHall) return;
        const validHallIds = getValidHallIdsForPack(entry.row);
        if (validHallIds.length === 0) return;
        const parsedCharge = Number(entry.row.hallRate || 0);
        const charge = Number.isFinite(parsedCharge) ? parsedCharge : 0;
        validHallIds.forEach((hallId) => {
          const current = hallChargeMap.get(hallId) || 0;
          hallChargeMap.set(hallId, Math.max(current, charge));
        });
      });
      const hallsPayload = Array.from(hallChargeMap.entries()).map(([hallId, charges]) => ({
        hallId,
        charges,
      }));

      const additionalItemsPayload = formData.additionalRequirements
        .map((entry) => ({
          description: entry.description.trim(),
          charges: Math.max(0, toNumber(entry.amount || '0')),
        }))
        .filter((entry) => entry.description || entry.charges > 0)
        .map((entry) => ({
          description: entry.description || 'Additional Requirement',
          charges: entry.charges,
          quantity: 1,
        }));

      const packsPayload = enabledPackEntries.map(({ key, row }) => {
        const matchingTemplate = templateMenus.find(
          (template) => template.id === row.templateMenuId
        );
        const validHallIds = row.withHall ? getValidHallIdsForPack(row) : [];
        const selectedHallNames = halls
          .filter((hall) => validHallIds.includes(hall.id))
          .map((hall) => hall.name);
        return {
          packName: PACK_LABELS[key],
          packCount: Math.max(1, toNumber(row.pax || '1')),
          noOfPack: Math.max(1, toNumber(row.pax || '1')),
          ratePerPlate: row.withCatering ? toNumber(row.ratePerPlate) : 0,
          setupCost: row.setupCost ? toNumber(row.setupCost) : 0,
          extraCharges: row.extraCharges || 0,
          extraPlate: row.extraPlate,
          extraAmount: row.extraAmount,
          extraAmountValue: row.extraAmountValue,
          extraRate: row.extraRate,
          extraRateValue: row.extraRateValue,
          startTime: row.startTime || undefined,
          endTime: row.endTime || undefined,
          hallRate: row.withHall ? row.hallRate || undefined : undefined,
          menuPoint: row.menuPoints ? toNumber(row.menuPoints) : undefined,
          hallName: row.withHall ? selectedHallNames.join(', ') || undefined : undefined,
          menu: {
            name: matchingTemplate?.name || `${PACK_LABELS[key]} Menu`,
            templateMenuId: row.templateMenuId || undefined,
            items: row.menuItemIds.map((itemId) => ({
              itemId,
              quantity: 1,
            })),
          },
        };
      });

      const paymentSummary = formData.payments
        .filter(
          (payment) =>
            payment.mode.trim() ||
            payment.narration.trim() ||
            payment.date.trim() ||
            payment.receivedBy.trim() ||
            payment.amount.trim()
        )
        .map((payment) =>
          [
            payment.mode || 'mode',
            payment.narration || 'narration',
            payment.date || 'date',
            payment.receivedBy || 'received by',
            payment.amount || 'amount',
          ].join(' | ')
        );

      const packSummary = enabledPackEntries.map(({ key, row }) => {
        const validHallIds = row.withHall ? getValidHallIdsForPack(row) : [];
        const hallName = row.withHall
          ? halls
            .filter((hall) => validHallIds.includes(hall.id))
            .map((hall) => hall.name)
            .join(', ') || 'No hall'
          : 'No hall';
        const templateName =
          templateMenus.find((template) => template.id === row.templateMenuId)?.name ||
          'Custom menu';
        return `${PACK_LABELS[key]}: ${row.pax || 0} pax, ${hallName}, hallRate=${row.hallRate || 0
          }, ratePerPlate=${row.ratePerPlate || 0}, menuTemplate=${templateName}, menuItems=${row.menuItemIds.length
          }, menuPoints=${row.menuPoints || 0}`;
      });

      const notes = [formData.notes.trim(), packSummary.length ? `Pack Summary - ${packSummary.join(' ; ')}` : '']
        .filter(Boolean)
        .join('\n');
      const internalNotesParts = [
        paymentSummary.length ? `Payment Entries - ${paymentSummary.join(' ; ')}` : '',
        `Settlement: discount=${formData.settlementDiscountAmount || 0}, amount=${formData.settlementAmount || 0
        }`,
        `Final Calc: discountAmount=${normalizedDiscountAmount}, discountPercent=${normalizedDiscountPercent
        }, finalAmount=${normalizedFinalAmount}, totalBill=${totalBillAmount.toFixed(
          2
        )}, totalPayments=${totalPayments.toFixed(2)}`,
      ].filter(Boolean);
      const internalNotes =
        internalNotesParts.length > 0 ? internalNotesParts.join('\n') : undefined;

      const payload = {
        customerId: formData.customerId,
        secondCustomerId:
          formData.includeSecondCustomer && formData.secondCustomerId
            ? formData.secondCustomerId
            : undefined,
        referredById: formData.referredById || undefined,
        priority: formData.priority ? Number(formData.priority) : undefined,
        functionName,
        functionType: formData.functionType.trim(),
        functionDate: formData.functionDate,
        functionTime,
        startTime: enabledPackEntries[0]?.row.startTime || undefined,
        endTime: enabledPackEntries[0]?.row.endTime || undefined,
        expectedGuests,
        isQuotation: false,
        halls: hallsPayload.length ? hallsPayload : undefined,
        packs: packsPayload.length ? packsPayload : undefined,
        additionalItems: additionalItemsPayload.length
          ? additionalItemsPayload
          : undefined,
        discountAmount: normalizedDiscountAmount,
        discountPercentage: normalizedDiscountPercent,
        advanceRequired: formData.advanceRequired || undefined,
        paymentReceivedPercent: formData.paymentReceivedPercent || undefined,
        paymentReceivedAmount:
          totalPayments > 0 ? totalPayments.toFixed(2) : undefined,
        dueAmount: formData.dueAmount || undefined,
        notes: notes || undefined,
        internalNotes,
      };

      if (editingBookingId) {
        await api.updateBooking(editingBookingId, payload);
      } else {
        await api.createBooking(payload);
      }
      toast.success(editingBookingId ? 'Booking updated successfully' : 'Booking created successfully');
      closeBookingForm();
      await loadBookings();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        (editingBookingId ? 'Failed to update booking' : 'Failed to create booking')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeBooking = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingBookingId) return;
    if (!confirm('Finalize this booking? It will become read-only and a new editable replica will be generated.')) return;

    try {
      setSaving(true);
      const res = await api.finalizeBooking(editingBookingId);
      toast.success('Booking finalized successfully.');
      await loadBookings();
      if (res.data?.data?.newBookingId) {
        await openEditBooking(res.data.data.newBookingId);
      } else {
        closeBookingForm();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to finalize booking');
    } finally {
      setSaving(false);
    }
  };

  const openPartyOver = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingBookingId) return;
    // Pre-validate: don't bother calling API if function date hasn't arrived
    const loadedDate = formData.functionDate;
    if (loadedDate) {
      const funcDay = new Date(loadedDate);
      funcDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (funcDay.getTime() > today.getTime()) {
        toast.error('Party Over is only available on or after the function date.');
        return;
      }
    }
    api.getBooking(editingBookingId).then((res) => {
      const activeInfo = res.data?.data?.booking;
      if (!activeInfo) return toast.error('Could not load current booking details');
      setActivePartyOverBooking(activeInfo);

      const initialPlates: Record<string, number> = {};
      (activeInfo.packs || []).forEach((p: any) => {
        initialPlates[p.id] = p.extraPlate || 0;
      });
      setPartyOverPlates(initialPlates);

      const initialRates: Record<string, number> = {};
      (activeInfo.packs || []).forEach((p: any) => {
        initialRates[p.id] =
          p.extraRateValue ??
          (p.extraRate !== null && p.extraRate !== undefined ? Number(p.extraRate) : null) ??
          p.ratePerPlate ??
          0;
      });
      setPartyOverRates(initialRates);
      setShowPartyOverModal(true);
    }).catch(err => {
      toast.error('Failed to load active booking packs');
    });
  };

  const handlePartyOverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartyOverBooking) return;

    if (!confirm('Are you sure you want to mark the party as over? This will calculate final plates and lock ALL versions permanently.')) return;

    try {
      setSaving(true);
      const payload = {
        packs: (activePartyOverBooking.packs || []).map((pack: any) => ({
          bookingPackId: pack.id,
          extraPlate: Math.max(0, Number(partyOverPlates[pack.id] || 0)),
          extraRate: partyOverRates[pack.id] ?? Number(pack.ratePerPlate ?? 0),
        })),
      };
      const response = await api.partyOverBooking(activePartyOverBooking.id, payload);
      toast.success('Party finalized permanently!');
      setShowPartyOverModal(false);
      setPartyOverPlates({});
      setPartyOverRates({});
      setActivePartyOverBooking(null);
      await loadBookings();
      if (response.data?.data?.newBookingId) {
        await openEditBooking(response.data.data.newBookingId);
      } else {
        closeBookingForm();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to submit party over finalization');
    } finally {
      setSaving(false);
    }
  };

  const renderCustomerTypeahead = ({
    field,
    label,
    required = false,
    placeholder,
  }: {
    field: CustomerSearchField;
    label?: string;
    required?: boolean;
    placeholder: string;
  }) => {
    const suggestions = getCustomerSuggestions(field);
    const isActive = activeCustomerSearchField === field;

    return (
      <div className="relative">
        {label ? (
          <label className="label">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        ) : null}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder={placeholder}
            value={customerSearchInputs[field]}
            required={required}
            autoComplete="off"
            onFocus={() => setActiveCustomerSearchField(field)}
            onBlur={() => {
              window.setTimeout(() => {
                setActiveCustomerSearchField((current) =>
                  current === field ? null : current
                );
              }, 120);
            }}
            onChange={(e) => handleCustomerInputChange(field, e.target.value)}
          />
        </div>

        {isActive && (
          <div className="absolute z-40 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                No customer found for this search.
              </p>
            ) : (
              suggestions.map((customer) => (
                <button
                  key={`${field}-${customer.id}`}
                  type="button"
                  className="w-full border-b border-gray-100 px-3 py-2 text-left hover:bg-primary-50 last:border-b-0"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCustomerSuggestion(field, customer)}
                >
                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-600">{customer.phone}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-head gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">
            View booking records and quotation statuses.
          </p>
        </div>
        {canAddBooking && (
          <button
            onClick={openCreateBooking}
            className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        )}
      </div>

      {!canViewBooking && (
        <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
          You do not have permission to view bookings.
        </div>
      )}

      {canAddBooking && customers.length === 0 && (
        <div className="card border-amber-200 bg-amber-50 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            No customers found. Add a customer first, then create booking.
          </p>
          {canAddCustomer && (
            <button type="button" className="btn btn-secondary" onClick={openQuickCustomerForm}>
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          )}
        </div>
      )}

      <FormPromptModal
        open={showCreateForm}
        title={editingBookingId ? 'Edit Booking' : 'Booking Form'}
        onClose={closeBookingForm}
        widthClass="max-w-[1400px]"
      >
        <fieldset disabled={isReadOnlyBooking}>
          <form onSubmit={(e) => { e.preventDefault(); if (!isReadOnlyBooking) handleSubmitBooking(e); }} className="space-y-5">
            <div className="flex items-center gap-3">
              {!isReadOnlyBooking && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <span className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Submit'}
                  </span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <span className="inline-flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print
                </span>
              </button>
            </div>

            {isReadOnlyBooking && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                This booking is completed (party over) and is now read-only.
              </div>
            )}

            <section className="rounded-2xl border border-gray-300 p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr,100px] gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="label m-0">Primary Customer <span className="text-red-500">*</span></span>
                      {canAddCustomer && (
                        <button
                          type="button"
                          className="btn btn-secondary text-xs px-2.5 py-1.5"
                          onClick={openQuickCustomerForm}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Customer
                        </button>
                      )}
                    </div>
                    {renderCustomerTypeahead({
                      field: 'primary',
                      label: '',
                      required: true,
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, priority: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-base text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.includeSecondCustomer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        includeSecondCustomer: checked,
                        secondCustomerId: checked ? prev.secondCustomerId : '',
                      }));
                      if (!checked) {
                        setCustomerSearchInputs((prev) => ({
                          ...prev,
                          second: '',
                        }));
                        setActiveCustomerSearchField((field) =>
                          field === 'second' ? null : field
                        );
                      }
                    }}
                  />
                  Add Second Customer
                </label>

                {formData.includeSecondCustomer && (
                  renderCustomerTypeahead({
                    field: 'second',
                    label: 'Second Customer',
                    placeholder: 'Type customer name or number',
                  })
                )}

                {renderCustomerTypeahead({
                  field: 'referred',
                  label: 'Referred By',
                  placeholder: 'Type customer name or number',
                })}

                <div>
                  <label className="label">
                    Function Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.functionType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, functionType: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select function type</option>
                    {FUNCTION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Function Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={formData.functionDate}
                    min={!editingBookingId ? todayIsoDate : undefined}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, functionDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900">Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Advance Required</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={formData.advanceRequired}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, advanceRequired: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">% Payment Received</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.paymentReceivedPercent}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentReceivedPercent: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Due Amount</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={formData.dueAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dueAmount: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-300 overflow-hidden">
                  <div className="grid grid-cols-6 bg-slate-200 text-xs font-semibold text-slate-700 px-3 py-2">
                    <div>Mode</div>
                    <div>Narration</div>
                    <div>Date</div>
                    <div>Received By</div>
                    <div>Amount</div>
                    <div className="text-right">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary-600 text-primary-700 hover:bg-primary-50"
                        onClick={addPaymentRow}
                        aria-label="Add payment row"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {formData.payments.length === 0 ? (
                    <div className="px-3 py-5 text-center text-sm text-gray-500">
                      No payments added. Click the + button to add payment entries.
                    </div>
                  ) : (
                    formData.payments.map((payment, index) => (
                      <div
                        key={`payment-${index}`}
                        className="grid grid-cols-1 md:grid-cols-6 gap-2 border-t border-gray-200 p-3"
                      >
                        <input
                          className="input h-10"
                          value={payment.mode}
                          onChange={(e) =>
                            updatePaymentRow(index, 'mode', e.target.value)
                          }
                        />
                        <input
                          className="input h-10"
                          value={payment.narration}
                          onChange={(e) =>
                            updatePaymentRow(index, 'narration', e.target.value)
                          }
                        />
                        <input
                          className="input h-10"
                          type="date"
                          value={payment.date}
                          onChange={(e) =>
                            updatePaymentRow(index, 'date', e.target.value)
                          }
                        />
                        <input
                          className="input h-10"
                          value={payment.receivedBy}
                          onChange={(e) =>
                            updatePaymentRow(index, 'receivedBy', e.target.value)
                          }
                        />
                        <input
                          className="input h-10"
                          type="number"
                          min={0}
                          value={payment.amount}
                          onChange={(e) =>
                            updatePaymentRow(index, 'amount', e.target.value)
                          }
                        />
                        <div className="flex md:justify-end">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                payments: prev.payments.filter(
                                  (_, rowIndex) => rowIndex !== index
                                ),
                              }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="space-y-1 border-t border-gray-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
                    <div className="flex items-center justify-between">
                      <span>Total Payments</span>
                      <span>₹{totalPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Bill Amount</span>
                      <span>₹{totalBillAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-300 p-3">
                  <p className="text-lg mb-2 font-semibold text-gray-900">Settlement Calculation</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Discount Amount</label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={formData.settlementDiscountAmount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            settlementDiscountAmount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Settlement Amount</label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={formData.settlementAmount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            settlementAmount: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {(Object.keys(PACK_LABELS) as PackKey[]).map((packKey) => {
                const row = formData.packs[packKey];
                const filteredHalls = halls.filter(
                  (hall) => !row.banquetId || hall.banquet?.id === row.banquetId
                );
                const validSelectedHallIds = row.hallIds.filter((hallId) =>
                  filteredHalls.some((hall) => hall.id === hallId)
                );
                const selectedHallNames = filteredHalls
                  .filter((hall) => validSelectedHallIds.includes(hall.id))
                  .map((hall) => hall.name);

                return (
                  <div
                    key={packKey}
                    className={`rounded-2xl border p-3 space-y-3 ${PACK_ROW_STYLES[packKey]}`}
                  >
                    <div
                      className={`grid gap-3 items-center ${row.enabled && row.withHall
                        ? 'grid-cols-1 xl:grid-cols-[220px,170px,170px,1fr,1fr]'
                        : row.enabled
                          ? 'grid-cols-1 sm:grid-cols-[220px,170px,170px]'
                          : 'grid-cols-1 sm:grid-cols-[220px,170px,170px]'
                        }`}
                    >
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
                        <div className="inline-flex items-center gap-2">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={row.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                if (!enabled && openHallPickerPack === packKey) {
                                  setOpenHallPickerPack(null);
                                }
                                updatePackRow(packKey, { enabled });
                              }}
                            />
                            <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-200 peer-focus:ring-offset-1 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                          </label>
                          <span className="text-base font-semibold text-gray-900">
                            {PACK_LABELS[packKey]}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${row.enabled
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-200 bg-white opacity-80'
                          }`}
                      >
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={row.withHall}
                            disabled={!row.enabled}
                            onChange={(e) => {
                              const withHall = e.target.checked;
                              if (!withHall && openHallPickerPack === packKey) {
                                setOpenHallPickerPack(null);
                              }
                              updatePackRow(packKey, { withHall });
                            }}
                          />
                          Hall
                        </label>
                      </div>

                      <div
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${row.enabled
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-200 bg-white opacity-80'
                          }`}
                      >
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={row.withCatering}
                            disabled={!row.enabled}
                            onChange={(e) =>
                              updatePackRow(packKey, { withCatering: e.target.checked })
                            }
                          />
                          Catering
                        </label>
                      </div>

                      {row.enabled && row.withHall && (
                        <div className="space-y-1">
                          <label className="label">Banquet</label>
                          <select
                            className="input"
                            value={row.banquetId}
                            onChange={(e) => {
                              setOpenHallPickerPack((current) =>
                                current === packKey ? null : current
                              );
                              updatePackRow(packKey, {
                                banquetId: e.target.value,
                                hallIds: [],
                              });
                            }}
                          >
                            <option value="">Select Banquet</option>
                            {banquets.map((banquet) => (
                              <option key={banquet.id} value={banquet.id}>
                                {banquet.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {row.enabled && row.withHall && (
                        <div
                          className="relative space-y-1"
                          ref={openHallPickerPack === packKey ? hallPickerContainerRef : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <label className="label">Hall</label>
                            <p className="text-xs text-gray-600">
                              {validSelectedHallIds.length} hall
                              {validSelectedHallIds.length === 1 ? '' : 's'} selected
                            </p>
                          </div>
                          <button
                            type="button"
                            className="input flex w-full items-center justify-between text-left"
                            disabled={!row.banquetId}
                            onClick={() =>
                              setOpenHallPickerPack((current) =>
                                current === packKey ? null : packKey
                              )
                            }
                          >
                            <span className="truncate">
                              {!row.banquetId
                                ? 'Select Banquet First'
                                : selectedHallNames.length > 0
                                  ? selectedHallNames.join(', ')
                                  : 'Select Halls *'}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {openHallPickerPack === packKey ? 'Close' : 'Select'}
                            </span>
                          </button>

                          {openHallPickerPack === packKey && (
                            <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                              {filteredHalls.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-500">
                                  No halls available for this banquet.
                                </p>
                              ) : (
                                filteredHalls.map((hall) => {
                                  const checked = row.hallIds.includes(hall.id);
                                  return (
                                    <label
                                      key={hall.id}
                                      className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm text-gray-800 last:border-b-0 hover:bg-gray-50"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const nextHallIds = checked
                                            ? row.hallIds.filter((id) => id !== hall.id)
                                            : [...row.hallIds, hall.id];
                                          updatePackRow(packKey, { hallIds: nextHallIds });
                                        }}
                                      />
                                      <span>{hall.name}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {row.enabled && (() => {
                        const packDiffKey = PACK_LABELS[packKey].toLowerCase();
                        const packDiff = formDiff?.packs[packDiffKey];
                        const menuAdded = packDiff?.addedItemIds.length ?? 0;
                        const menuRemoved = packDiff?.removedItemIds.length ?? 0;
                        const hasMenuDiff = menuAdded > 0 || menuRemoved > 0;
                        return (
                          <div className="grid grid-cols-1 xl:grid-cols-[120px,120px,1fr,130px,1fr,1fr,1fr,1fr] gap-3 items-end">
                            <div>
                              <label className="label mb-1 text-xs">Start Time</label>
                              <input
                                className="input"
                                type="time"
                                value={row.startTime}
                                onChange={(e) => updatePackRow(packKey, { startTime: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">End Time</label>
                              <input
                                className="input"
                                type="time"
                                value={row.endTime}
                                onChange={(e) => updatePackRow(packKey, { endTime: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">Hall Rate</label>
                              <input
                                className={`input${packDiff?.hallRateChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.hallRate}
                                disabled={!row.withHall}
                                onChange={(e) => updatePackRow(packKey, { hallRate: e.target.value })}
                              />
                              {packDiff?.hallRateChange && (
                                <p className="mt-0.5 text-xs text-amber-600">
                                  was ₹{packDiff.hallRateChange.from.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">Menu</label>
                              <button
                                type="button"
                                className={`btn w-full ${hasMenuDiff ? 'btn-warning' : 'btn-secondary'}`}
                                onClick={() => {
                                  setMenuEditorPack(packKey);
                                  setMenuItemSearch('');
                                }}
                              >
                                {row.menuItemIds.length} items
                                {hasMenuDiff && (
                                  <span className="ml-1 text-xs font-normal">
                                    {menuAdded > 0 && <span className="text-green-700">+{menuAdded}</span>}
                                    {menuAdded > 0 && menuRemoved > 0 && <span className="text-gray-500"> / </span>}
                                    {menuRemoved > 0 && <span className="text-red-700">−{menuRemoved}</span>}
                                  </span>
                                )}
                              </button>
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">Menu Points</label>
                              <input
                                className="input bg-gray-50"
                                type="number"
                                min={0}
                                value={row.menuPoints}
                                readOnly
                                title="Auto-calculated from selected menu items"
                              />
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">Rate Per Plate</label>
                              <input
                                className={`input${packDiff?.ratePerPlateChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.ratePerPlate}
                                onChange={(e) =>
                                  updatePackRow(packKey, { ratePerPlate: e.target.value })
                                }
                              />
                              {packDiff?.ratePerPlateChange && (
                                <p className="mt-0.5 text-xs text-amber-600">
                                  was ₹{packDiff.ratePerPlateChange.from.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">
                                PAX <span className="text-red-500">*</span>
                              </label>
                              <input
                                className={`input${packDiff?.paxChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.pax}
                                onChange={(e) => updatePackRow(packKey, { pax: e.target.value })}
                              />
                              {packDiff?.paxChange && (
                                <p className="mt-0.5 text-xs text-amber-600">
                                  was {packDiff.paxChange.from}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="label mb-1 text-xs">Amount</label>
                              <input
                                className="input bg-gray-50"
                                type="number"
                                min={0}
                                value={formatComputedAmount(calculatePackAmount(row))}
                                readOnly
                                title="Auto-calculated as Hall Rate + (Rate Per Plate × PAX)"
                              />
                            </div>
                          </div>
                        );
                      })()}

                  </div>
                );
              })}
            </section>

            <section className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900">Amount Summary</h3>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary-600 px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalRequirements: [
                        ...prev.additionalRequirements,
                        { description: '', amount: '' },
                      ],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Requirement
                </button>
              </div>

              {enabledPackAmountRows.length === 0 &&
                formData.additionalRequirements.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Enable a pack to view its amount rows.
                </p>
              ) : null}

              <div className="space-y-2">
                {enabledPackAmountRows.map((entry) => (
                  <div
                    key={entry.key}
                    className="grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr,190px]"
                  >
                    <label className="label">{entry.label} Amount</label>
                    <input
                      className="input bg-gray-50 text-right"
                      type="number"
                      min={0}
                      value={formatComputedAmount(entry.amount)}
                      readOnly
                    />
                  </div>
                ))}

                {formData.additionalRequirements.map((item, index) => (
                  <div
                    key={`req-${index}`}
                    className="grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr,190px,auto]"
                  >
                    <div>
                      <label className="label">Additional Requirement {index + 1}</label>
                      <input
                        className="input"
                        value={item.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            additionalRequirements: prev.additionalRequirements.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, description: e.target.value }
                                  : entry
                            ),
                          }))
                        }
                        placeholder="Requirement details"
                      />
                    </div>
                    <div>
                      <label className="label">Amount</label>
                      <input
                        className="input text-right"
                        type="number"
                        min={0}
                        value={item.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            additionalRequirements: prev.additionalRequirements.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, amount: e.target.value }
                                  : entry
                            ),
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary md:self-end"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          additionalRequirements: prev.additionalRequirements.filter(
                            (_, entryIndex) => entryIndex !== index
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="grid grid-cols-1 items-end gap-2 border-t border-gray-200 pt-2 md:grid-cols-3">
                  <div>
                    <label className="label">Discount %</label>
                    <input
                      className="input text-right"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formData.finalDiscountPercent}
                      onChange={(e) => {
                        setAmountSyncMode('discountPercent');
                        setFormData((prev) => ({
                          ...prev,
                          ...normalizeAmountSnapshot(
                            'discountPercent',
                            e.target.value,
                            totalBillAmount
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Discount Amount</label>
                    <input
                      className="input text-right"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.finalDiscountAmount}
                      onChange={(e) => {
                        setAmountSyncMode('discountAmount');
                        setFormData((prev) => ({
                          ...prev,
                          ...normalizeAmountSnapshot(
                            'discountAmount',
                            e.target.value,
                            totalBillAmount
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Final Amount</label>
                    <input
                      className="input text-right"
                      type="number"
                      min={0}
                      value={formData.finalAmount}
                      onChange={(e) => {
                        setAmountSyncMode('finalAmount');
                        setFormData((prev) => ({
                          ...prev,
                          ...normalizeAmountSnapshot('finalAmount', e.target.value, totalBillAmount),
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-3">
                  <div className="md:col-start-3">
                    <label className="label font-semibold text-gray-900">Total Amount</label>
                    <input
                      className="input bg-gray-50 text-right font-semibold text-primary-700"
                      type="number"
                      min={0}
                      value={formatComputedAmount(totalBillAmount)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[110px]"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <section className="rounded-2xl border border-gray-300 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>
                  30% advance at booking. Balance payment to be completed at least 4 days
                  before the event.
                </li>
                <li>Extra plates above expected guests are strictly chargeable.</li>
                <li>No menu modifications are entertained within 3 days of the event date.</li>
                <li>
                  Advance booking money may be forfeited on cancellation, subject to company
                  discretion.
                </li>
                <li>Sound or music after 10:15 PM is not permissible.</li>
              </ul>
            </section>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeBookingForm}
              >
                Cancel
              </button>
              {!isReadOnlyBooking && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <span className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Submit'}
                  </span>
                </button>
              )}
              {editingBookingId && !isReadOnlyBooking && (
                <>
                  <button
                    type="button"
                    className="btn bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    onClick={handleFinalizeBooking}
                    disabled={saving}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Finalize Version
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    onClick={openPartyOver}
                    disabled={saving}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Party Over
                    </span>
                  </button>
                </>
              )}
            </div>
          </form>

          {historicalVersions.length > 0 && (
            <div className="mt-8 space-y-6 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900">Finalized Version History</h2>
              <p className="text-sm text-gray-500 -mt-3">
                Previous immutable versions — always expanded so you can track every booking detail at each step.
              </p>
              {historicalVersions.map((hist: any, histIdx: number) => {
                const resolved = hist?.snapshotData && typeof hist.snapshotData === 'object'
                  ? hist.snapshotData
                  : hist;
                const historyPacks = Array.isArray(resolved?.packs) ? resolved.packs : [];
                const histPayments: any[] = Array.isArray(hist?.payments)
                  ? hist.payments
                  : Array.isArray(resolved?.payments)
                  ? resolved.payments
                  : [];
                const histAdditional: any[] = Array.isArray(hist?.additionalItems)
                  ? hist.additionalItems
                  : Array.isArray(resolved?.additionalItems)
                  ? resolved.additionalItems
                  : [];
                const finalizedBy =
                  hist?.finalizedMeta?.finalizedBy?.name ||
                  hist?.finalizedBooking?.finalizedByUser?.name ||
                  hist?.finalizedBooking?.user?.name ||
                  'System';
                const finalizedAt =
                  hist?.finalizedMeta?.finalizedAt ||
                  hist?.finalizedBooking?.finalizedAt ||
                  null;

                const histGrandTotal = Number(
                  resolved?.grandTotal ?? hist?.grandTotal ?? 0
                );
                const histFinalAmount = Number(
                  resolved?.finalAmountValue ?? resolved?.finalAmount ?? hist?.finalAmount ?? histGrandTotal
                );
                const histDiscountAmount = Number(
                  resolved?.discountAmountValue ?? resolved?.discountAmount ?? hist?.discountAmount ?? 0
                );
                const histDiscountPercent = Number(
                  resolved?.discountPercentageValue ?? resolved?.discountPercentage ?? hist?.discountPercentage ?? 0
                );
                const histAdvanceRequired = Number(
                  resolved?.advanceRequiredValue ?? resolved?.advanceRequired ?? hist?.advanceRequired ?? 0
                );
                const histDueAmount = Number(
                  resolved?.dueAmountValue ?? resolved?.dueAmount ?? hist?.dueAmount ?? 0
                );
                const histNotes: string = resolved?.notes || hist?.notes || '';
                const histTotalPayments = histPayments.reduce((sum: number, p: any) => {
                  const amt = Number(p?.amount ?? p?.amountValue ?? 0);
                  return sum + (Number.isFinite(amt) ? amt : 0);
                }, 0);
                const histTotalAdditional = histAdditional.reduce((sum: number, item: any) => {
                  const amt = Number(item?.charges ?? item?.amount ?? 0);
                  return sum + (Number.isFinite(amt) ? Math.max(0, amt) : 0);
                }, 0);
                const histTotalPackAmount = historyPacks.reduce((sum: number, pack: any) => {
                  const hallRate = Number(pack?.hallRateValue ?? pack?.hallRate ?? 0);
                  const ratePerPlate = Number(pack?.ratePerPlate || 0);
                  const pax = Number(pack?.packCount ?? pack?.noOfPack ?? 0);
                  const extraCharges = Number(pack?.extraCharges || 0);
                  return sum + hallRate + ratePerPlate * pax + extraCharges;
                }, 0);
                const histTotalBill = histTotalPackAmount + histTotalAdditional;
                const histCustomerName =
                  resolved?.customer?.name ||
                  resolved?.customerName ||
                  hist?.customer?.name ||
                  'Unknown';
                const histCustomerPhone =
                  resolved?.customer?.phone ||
                  resolved?.customerPhone ||
                  hist?.customer?.phone ||
                  '-';
                const histFunctionDate = resolved?.functionDate
                  ? formatDateDDMMYYYY(resolved.functionDate)
                  : '-';
                const histTimeRange = (() => {
                  const start = resolved?.startTime || resolved?.functionTime || '';
                  const end = resolved?.endTime || '';
                  if (start && end) return `${start} - ${end}`;
                  return start || end || '-';
                })();
                const hallNames = (Array.isArray(resolved?.halls) ? resolved.halls : [])
                  .map((entry: any) => entry?.hall?.name || entry?.hallName)
                  .filter(Boolean);
                const banquetNames = (Array.isArray(resolved?.halls) ? resolved.halls : [])
                  .map((entry: any) => entry?.hall?.banquet?.name)
                  .filter(Boolean);

                return (
                  <div key={hist.id} className="rounded-xl border-2 border-gray-300 bg-white shadow-sm overflow-hidden">
                    {/* ── Version header ── */}
                    <div className="flex items-center justify-between gap-3 bg-gray-100 px-5 py-3 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Version {hist.versionNumber}
                          <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {hist.status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Finalized by <strong>{finalizedBy}</strong> on {formatDateTimeLabel(finalizedAt)}
                        </p>
                      </div>
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* ── Inter-version diff summary ── */}
                    {(() => {
                      const prevHist = historicalVersions[histIdx + 1];
                      if (!prevHist) return null;
                      const thisDiff = computeVersionDiff(
                        histToSnapshot(hist),
                        histToSnapshot(prevHist)
                      );
                      const hasAnyDiff =
                        thisDiff.functionDate ||
                        thisDiff.functionType ||
                        thisDiff.discountAmountChange ||
                        thisDiff.finalAmountChange ||
                        thisDiff.advanceRequiredChange ||
                        thisDiff.dueAmountChange ||
                        Object.keys(thisDiff.packs).length > 0;
                      if (!hasAnyDiff) return null;

                      const DiffPill = ({
                        label,
                        from,
                        to,
                        prefix = '',
                        isNum = false,
                      }: {
                        label: string;
                        from: string | number;
                        to: string | number;
                        prefix?: string;
                        isNum?: boolean;
                      }) => {
                        const numDelta = isNum ? Number(to) - Number(from) : 0;
                        const up = isNum && numDelta > 0;
                        const down = isNum && numDelta < 0;
                        return (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700">
                            <span className="font-medium text-gray-500">{label}:</span>
                            <span className="line-through text-red-500">{prefix}{typeof from === 'number' ? from.toLocaleString('en-IN') : from}</span>
                            <span className="text-gray-400">→</span>
                            <span className={`font-semibold ${up ? 'text-green-700' : down ? 'text-red-700' : 'text-gray-800'}`}>
                              {prefix}{typeof to === 'number' ? to.toLocaleString('en-IN') : to}
                            </span>
                            {isNum && numDelta !== 0 && (
                              <span className={`font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
                                {up ? '▲' : '▼'}{Math.abs(numDelta).toLocaleString('en-IN')}
                              </span>
                            )}
                          </span>
                        );
                      };

                      // Collect all menu item names for this lookup
                      const allMenuItemsForDiff = new Map<string, string>();
                      historyPacks.forEach((pack: any) => {
                        (pack?.bookingMenu?.items || []).forEach((entry: any) => {
                          const id = entry?.itemId || entry?.item?.id;
                          const name = entry?.item?.name;
                          if (id && name) allMenuItemsForDiff.set(id, name);
                        });
                      });

                      return (
                        <div className="px-5 pt-3 pb-0">
                          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                              Changes from v{historicalVersions[histIdx + 1]?.versionNumber ?? '?'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {thisDiff.functionDate && (
                                <DiffPill label="Date" from={thisDiff.functionDate.from} to={thisDiff.functionDate.to} />
                              )}
                              {thisDiff.functionType && (
                                <DiffPill label="Function" from={thisDiff.functionType.from} to={thisDiff.functionType.to} />
                              )}
                              {thisDiff.finalAmountChange && (
                                <DiffPill label="Final Amount" prefix="₹" from={thisDiff.finalAmountChange.from} to={thisDiff.finalAmountChange.to} isNum />
                              )}
                              {thisDiff.discountAmountChange && (
                                <DiffPill label="Discount" prefix="₹" from={thisDiff.discountAmountChange.from} to={thisDiff.discountAmountChange.to} isNum />
                              )}
                              {thisDiff.advanceRequiredChange && (
                                <DiffPill label="Advance" prefix="₹" from={thisDiff.advanceRequiredChange.from} to={thisDiff.advanceRequiredChange.to} isNum />
                              )}
                              {thisDiff.dueAmountChange && (
                                <DiffPill label="Due" prefix="₹" from={thisDiff.dueAmountChange.from} to={thisDiff.dueAmountChange.to} isNum />
                              )}
                              {Object.entries(thisDiff.packs).map(([packKey, pd]) => (
                                <span key={`diff-pack-${packKey}`} className="inline-flex flex-wrap gap-1 contents">
                                  {pd.paxChange && (
                                    <DiffPill label={`${packKey} PAX`} from={pd.paxChange.from} to={pd.paxChange.to} isNum />
                                  )}
                                  {pd.ratePerPlateChange && (
                                    <DiffPill label={`${packKey} Rate`} prefix="₹" from={pd.ratePerPlateChange.from} to={pd.ratePerPlateChange.to} isNum />
                                  )}
                                  {pd.hallRateChange && (
                                    <DiffPill label={`${packKey} Hall`} prefix="₹" from={pd.hallRateChange.from} to={pd.hallRateChange.to} isNum />
                                  )}
                                  {pd.addedItemIds.map((id) => (
                                    <span key={`add-${id}`} className="inline-flex items-center rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                      + {allMenuItemsForDiff.get(id) || id}
                                    </span>
                                  ))}
                                  {pd.removedItemIds.map((id) => (
                                    <span key={`rem-${id}`} className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                      − {allMenuItemsForDiff.get(id) || id}
                                    </span>
                                  ))}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="px-5 py-4 space-y-6">
                      {/* ── Core info (form-style, read-only) ── */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label">Customer</label>
                          <input className="input" value={histCustomerName} readOnly />
                        </div>
                        <div>
                          <label className="label">Customer Phone</label>
                          <input className="input" value={histCustomerPhone} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Type</label>
                          <input className="input" value={resolved?.functionType || '-'} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Name</label>
                          <input className="input" value={resolved?.functionName || '-'} readOnly />
                        </div>
                        <div>
                          <label className="label">Function Date</label>
                          <input className="input" value={histFunctionDate} readOnly />
                        </div>
                        <div>
                          <label className="label">Time</label>
                          <input className="input" value={histTimeRange} readOnly />
                        </div>
                        <div>
                          <label className="label">Expected Guests</label>
                          <input
                            className="input"
                            value={resolved?.expectedGuests ?? hist?.expectedGuests ?? '-'}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="label">Confirmed Guests</label>
                          <input
                            className="input"
                            value={resolved?.confirmedGuests ?? hist?.confirmedGuests ?? 0}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="label">Banquet</label>
                          <input
                            className="input"
                            value={banquetNames.length > 0 ? banquetNames.join(', ') : '-'}
                            readOnly
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Halls</label>
                          <input
                            className="input"
                            value={hallNames.length > 0 ? hallNames.join(', ') : '-'}
                            readOnly
                          />
                        </div>
                      </div>

                      {/* ── Packs ── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">Packs</h4>
                        {historyPacks.length === 0 ? (
                          <p className="text-sm text-gray-500">No packs recorded.</p>
                        ) : (
                          historyPacks.map((pack: any) => {
                            const hallRate = Number(pack?.hallRateValue ?? pack?.hallRate ?? 0);
                            const ratePerPlate = Number(pack?.ratePerPlate || 0);
                            const pax = Number(pack?.packCount ?? pack?.noOfPack ?? 0);
                            const extraPlate = Number(pack?.extraPlate || 0);
                            const extraCharges = Number(pack?.extraCharges || 0);
                            const computedAmount = hallRate + ratePerPlate * pax + extraCharges;
                            const menuItems = Array.isArray(pack?.bookingMenu?.items)
                              ? pack.bookingMenu.items
                              : [];
                            const hallNames: string[] = Array.isArray(pack?.halls)
                              ? pack.halls.map((h: any) => h?.hall?.name || h?.name || '').filter(Boolean)
                              : pack?.hallName
                              ? [pack.hallName]
                              : [];

                            return (
                              <div
                                key={pack.id || `${hist.id}-${pack.packName}`}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                              >
                                {/* Pack header row */}
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-sm font-bold text-gray-900">
                                    {pack.packName}
                                    {pack.timeSlot ? ` (${pack.timeSlot})` : ''}
                                  </span>
                                  {pack.withHall !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withHall ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                      Hall {pack.withHall ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {pack.withCatering !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withCatering ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                      Catering {pack.withCatering ? '✓' : '✗'}
                                    </span>
                                  )}
                                </div>

                                {/* Pack numbers (form-style, read-only) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                  <div>
                                    <label className="label">PAX</label>
                                    <input className="input" value={pax} readOnly />
                                  </div>
                                  <div>
                                    <label className="label">Rate / Plate</label>
                                    <input
                                      className="input"
                                      value={`₹${ratePerPlate.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="label">Hall Rate</label>
                                    <input
                                      className="input"
                                      value={`₹${hallRate.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="label">Extra Plates</label>
                                    <input className="input" value={extraPlate} readOnly />
                                  </div>
                                  <div>
                                    <label className="label">Pack Amount</label>
                                    <input
                                      className="input font-semibold text-blue-700"
                                      value={`₹${computedAmount.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                </div>

                                {/* Hall names */}
                                {hallNames.length > 0 && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Halls: </span>
                                    {hallNames.join(', ')}
                                  </p>
                                )}

                                {/* Menu items */}
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Menu Items</p>
                                  {menuItems.length === 0 ? (
                                    <span className="text-xs text-gray-400">No menu items saved.</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {menuItems.map((entry: any) => (
                                        <span
                                          key={`${pack.id}-${entry.itemId || entry.item?.id}`}
                                          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700"
                                        >
                                          {entry?.item?.itemType?.name
                                            ? <><span className="text-gray-400 mr-1">{entry.item.itemType.name}:</span></>
                                            : null}
                                          {entry?.item?.name || 'Item'}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* ── Additional Requirements ── */}
                      {histAdditional.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">Additional Requirements</h4>
                          <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1fr,auto] bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                              <div>Description</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histAdditional.map((item: any, idx: number) => (
                              <div key={`hist-add-${hist.id}-${idx}`} className="grid grid-cols-[1fr,auto] px-3 py-2 text-sm border-t border-gray-100 bg-white">
                                <span className="text-gray-800">{item?.description || '-'}</span>
                                <span className="text-right font-medium text-gray-900">
                                  ₹{Number(item?.charges ?? item?.amount ?? 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                            <div className="grid grid-cols-[1fr,auto] px-3 py-2 bg-gray-50 border-t border-gray-200 text-sm font-semibold text-gray-700">
                              <span>Additional Total</span>
                              <span className="text-right">₹{histTotalAdditional.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Payments ── */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">Payments</h4>
                        {histPayments.length === 0 ? (
                          <p className="text-sm text-gray-500">No payments recorded.</p>
                        ) : (
                          <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <div className="hidden md:grid md:grid-cols-5 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                              <div>Mode</div>
                              <div>Narration</div>
                              <div>Date</div>
                              <div>Received By</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histPayments.map((payment: any, idx: number) => (
                              <div key={`hist-pay-${hist.id}-${idx}`} className="grid grid-cols-2 md:grid-cols-5 gap-1 px-3 py-2 text-sm border-t border-gray-100 bg-white">
                                <span className="text-gray-800 font-medium">{payment?.method || payment?.paymentMethod || payment?.mode || '-'}</span>
                                <span className="text-gray-600">{payment?.narration || '-'}</span>
                                <span className="text-gray-600">{payment?.paymentDate ? formatDateDDMMYYYY(payment.paymentDate.slice(0, 10)) : payment?.date ? formatDateDDMMYYYY(payment.date) : '-'}</span>
                                <span className="text-gray-600">{payment?.receiver?.name || payment?.receivedBy || '-'}</span>
                                <span className="text-right font-semibold text-gray-900">₹{Number(payment?.amount ?? payment?.amountValue ?? 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200 text-sm font-semibold text-gray-700">
                              <span>Total Payments</span>
                              <span>₹{histTotalPayments.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Amount Summary ── */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Amount Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-gray-500 block">Total Bill</span>
                            <span className="font-semibold text-gray-900">₹{histTotalBill.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Discount ({histDiscountPercent.toFixed(2)}%)</span>
                            <span className="font-semibold text-red-700">−₹{histDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Final Amount</span>
                            <span className="font-bold text-green-800 text-base">₹{histFinalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Advance Required</span>
                            <span className="font-semibold text-gray-900">₹{histAdvanceRequired.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Due Amount</span>
                            <span className="font-semibold text-gray-900">₹{histDueAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Payments Received</span>
                            <span className="font-semibold text-gray-900">₹{histTotalPayments.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Notes ── */}
                      {histNotes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1 mb-2">Notes</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-amber-50 border border-amber-100 p-3">{histNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>
      </FormPromptModal>

      <FormPromptModal
        open={showAddCustomerForm}
        title="Add Customer"
        onClose={closeQuickCustomerForm}
        widthClass="max-w-6xl"
      >
        <form onSubmit={handleQuickCustomerSubmit} className="space-y-7" noValidate>
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={inlineCustomerFormData.name}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      name: sanitizeNameInput(e.target.value),
                    }))
                  }
                  className="input"
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="md:col-span-4">
                <label className="label">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-[180px,1fr] gap-2">
                  <select
                    value={inlineCustomerFormData.phoneCountryIso}
                    onChange={(e) => {
                      const nextIso = e.target.value;
                      const digits = getExpectedPhoneDigits(nextIso);
                      setInlineCustomerPhoneErrors((prev) => ({ ...prev, phone: undefined }));
                      setInlineCustomerFormData((prev) => ({
                        ...prev,
                        phoneCountryIso: nextIso,
                        phone: prev.phone.slice(0, digits),
                        whatsappCountryIso: isInlineWhatsappDifferent
                          ? prev.whatsappCountryIso
                          : nextIso,
                      }));
                    }}
                    className="input"
                  >
                    {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                      <option key={option.iso2} value={option.iso2}>
                        {option.flag} {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
                  <input
                    value={inlineCustomerFormData.phone}
                    onChange={(e) => {
                      setInlineCustomerPhoneErrors((prev) => ({ ...prev, phone: undefined }));
                      setInlineCustomerFormData((prev) => ({
                        ...prev,
                        phone: digitsOnly(e.target.value).slice(0, inlinePrimaryPhoneDigits),
                      }));
                    }}
                    className="input"
                    placeholder={`${inlinePrimaryPhoneDigits}-digit number`}
                    inputMode="numeric"
                    minLength={inlinePrimaryPhoneDigits}
                    maxLength={inlinePrimaryPhoneDigits}
                    required
                  />
                </div>
                {inlineCustomerPhoneErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{inlineCustomerPhoneErrors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {getDialCodeOption(inlineCustomerFormData.phoneCountryIso).country} numbers must be{' '}
                  {inlinePrimaryPhoneDigits} digits.
                </p>
              </div>
              <div className="md:col-span-4">
                <label className="label">2nd Phone No.</label>
                <div className="grid grid-cols-[180px,1fr] gap-2">
                  <select
                    value={inlineCustomerFormData.alterPhoneCountryIso}
                    onChange={(e) => {
                      const nextIso = e.target.value;
                      const digits = getExpectedPhoneDigits(nextIso);
                      setInlineCustomerPhoneErrors((prev) => ({ ...prev, alterPhone: undefined }));
                      setInlineCustomerFormData((prev) => ({
                        ...prev,
                        alterPhoneCountryIso: nextIso,
                        alterPhone: prev.alterPhone.slice(0, digits),
                      }));
                    }}
                    className="input"
                  >
                    {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                      <option key={`inline-alt-${option.iso2}`} value={option.iso2}>
                        {option.flag} {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
                  <input
                    value={inlineCustomerFormData.alterPhone}
                    onChange={(e) => {
                      setInlineCustomerPhoneErrors((prev) => ({ ...prev, alterPhone: undefined }));
                      setInlineCustomerFormData((prev) => ({
                        ...prev,
                        alterPhone: digitsOnly(e.target.value).slice(0, inlineSecondaryPhoneDigits),
                      }));
                    }}
                    className="input"
                    placeholder={`${inlineSecondaryPhoneDigits}-digit number`}
                    inputMode="numeric"
                    maxLength={inlineSecondaryPhoneDigits}
                  />
                </div>
                {inlineCustomerPhoneErrors.alterPhone && (
                  <p className="mt-1 text-xs text-red-600">{inlineCustomerPhoneErrors.alterPhone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional. If entered, it must be exactly {inlineSecondaryPhoneDigits} digits.
                </p>
              </div>
              <div className="md:col-span-4">
                <label className="label">Caste</label>
                <select
                  value={inlineCustomerFormData.caste}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, caste: e.target.value }))
                  }
                  className="input"
                >
                  <option value="">Select caste</option>
                  {CASTE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={inlineCustomerFormData.email}
                  onChange={(e) => {
                    setInlineCustomerEmailError('');
                    setInlineCustomerFormData((prev) => ({ ...prev, email: e.target.value }));
                  }}
                  className="input"
                  placeholder="name@example.com"
                />
                {inlineCustomerEmailError && (
                  <p className="mt-1 text-xs text-red-600">{inlineCustomerEmailError}</p>
                )}
              </div>
              <div className="md:col-span-4 flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={isInlineWhatsappDifferent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsInlineWhatsappDifferent(checked);
                      if (!checked) {
                        setInlineCustomerPhoneErrors((prev) => ({
                          ...prev,
                          whatsappNumber: undefined,
                        }));
                        setInlineCustomerFormData((prev) => ({
                          ...prev,
                          whatsappNumber: '',
                          whatsappCountryIso: prev.phoneCountryIso,
                        }));
                      }
                    }}
                  />
                  Is WhatsApp different from phone?
                </label>
              </div>
              {isInlineWhatsappDifferent && (
                <div className="md:col-span-4">
                  <label className="label">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-[180px,1fr] gap-2">
                    <select
                      value={inlineCustomerFormData.whatsappCountryIso}
                      onChange={(e) => {
                        const nextIso = e.target.value;
                        const digits = getExpectedPhoneDigits(nextIso);
                        setInlineCustomerPhoneErrors((prev) => ({
                          ...prev,
                          whatsappNumber: undefined,
                        }));
                        setInlineCustomerFormData((prev) => ({
                          ...prev,
                          whatsappCountryIso: nextIso,
                          whatsappNumber: prev.whatsappNumber.slice(0, digits),
                        }));
                      }}
                      className="input"
                    >
                      {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                        <option key={`inline-wa-${option.iso2}`} value={option.iso2}>
                          {option.flag} {option.country} ({option.code})
                        </option>
                      ))}
                    </select>
                    <input
                      value={inlineCustomerFormData.whatsappNumber}
                      onChange={(e) => {
                        setInlineCustomerPhoneErrors((prev) => ({
                          ...prev,
                          whatsappNumber: undefined,
                        }));
                        setInlineCustomerFormData((prev) => ({
                          ...prev,
                          whatsappNumber: digitsOnly(e.target.value).slice(
                            0,
                            inlineWhatsappPhoneDigits
                          ),
                        }));
                      }}
                      className="input"
                      placeholder={`${inlineWhatsappPhoneDigits}-digit number`}
                      inputMode="numeric"
                      minLength={inlineWhatsappPhoneDigits}
                      maxLength={inlineWhatsappPhoneDigits}
                      required
                    />
                  </div>
                  {inlineCustomerPhoneErrors.whatsappNumber && (
                    <p className="mt-1 text-xs text-red-600">
                      {inlineCustomerPhoneErrors.whatsappNumber}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be exactly {inlineWhatsappPhoneDigits} digits.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">Country</label>
                <select
                  value={inlineCustomerFormData.country}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className="input"
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">PIN Code</label>
                <input
                  value={inlineCustomerFormData.pincode}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      pincode: digitsOnly(e.target.value),
                    }))
                  }
                  className="input"
                  placeholder="PIN code"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="md:col-span-4">
                <label className="label">State</label>
                <input
                  value={inlineCustomerFormData.state}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className="input"
                  placeholder="State"
                />
              </div>
              <div className="md:col-span-4">
                <label className="label">City</label>
                <input
                  value={inlineCustomerFormData.city}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="input"
                  placeholder="City"
                />
              </div>
              <div className="md:col-span-4">
                <label className="label">Street One</label>
                <input
                  value={inlineCustomerFormData.street1}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, street1: e.target.value }))
                  }
                  className="input"
                  placeholder="Street one"
                />
              </div>
              <div className="md:col-span-4">
                <label className="label">Street Two</label>
                <input
                  value={inlineCustomerFormData.street2}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, street2: e.target.value }))
                  }
                  className="input"
                  placeholder="Street two"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="label">Facebook</label>
                <input
                  value={inlineCustomerFormData.facebookProfile}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      facebookProfile: e.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Facebook profile"
                />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input
                  value={inlineCustomerFormData.instagramHandle}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      instagramHandle: e.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Instagram handle"
                />
              </div>
              <div>
                <label className="label">Twitter</label>
                <input
                  value={inlineCustomerFormData.twitter}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, twitter: e.target.value }))
                  }
                  className="input"
                  placeholder="Twitter"
                />
              </div>
              <div>
                <label className="label">LinkedIn</label>
                <input
                  value={inlineCustomerFormData.linkedin}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, linkedin: e.target.value }))
                  }
                  className="input"
                  placeholder="LinkedIn"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Other Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">Referred By</label>
                <select
                  value={inlineCustomerFormData.referredById}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      referredById: e.target.value,
                    }))
                  }
                  className="input"
                >
                  <option value="">Select customer</option>
                  {customerReferrerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">Priority</label>
                <select
                  value={inlineCustomerFormData.priority}
                  onChange={(e) =>
                    setInlineCustomerFormData((prev) => ({ ...prev, priority: e.target.value }))
                  }
                  className="input"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">Rating</label>
                <div className="h-11 flex items-center gap-1 rounded-xl border border-gray-200 px-3">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const current = Number(inlineCustomerFormData.rating || '0');
                    const active = value <= current;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setInlineCustomerFormData((prev) => ({
                            ...prev,
                            rating:
                              prev.rating === String(value) ? '0' : String(value),
                          }))
                        }
                        className="p-0.5"
                        aria-label={`Set rating ${value}`}
                      >
                        <Star
                          className={`w-5 h-5 ${active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                            }`}
                        />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setInlineCustomerFormData((prev) => ({ ...prev, rating: '0' }))
                    }
                    className="ml-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                value={inlineCustomerFormData.notes}
                onChange={(e) =>
                  setInlineCustomerFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="input min-h-[96px]"
                placeholder="Internal notes"
              />
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeQuickCustomerForm}
              disabled={inlineCustomerSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={inlineCustomerSaving}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {inlineCustomerSaving ? 'Saving...' : 'Create Customer'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={Boolean(menuEditorPack)}
        title={
          menuEditorPack
            ? `${PACK_LABELS[menuEditorPack]} Menu Selection`
            : 'Menu Selection'
        }
        onClose={() => {
          setMenuEditorPack(null);
          setMenuItemSearch('');
        }}
        widthClass="max-w-6xl"
      >
        {menuEditorPack && activeMenuPackRow ? (
          <div className="space-y-4">
            <div>
              <label className="label">Template Menu</label>
              <select
                className="input"
                value={activeMenuPackRow.templateMenuId}
                onChange={(e) => importTemplateToPack(menuEditorPack, e.target.value)}
              >
                <option value="">Custom (no template)</option>
                {templateMenus.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Selecting a template imports all template items; you can still add or remove items.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <input
                  className="input mb-3"
                  placeholder="Search items..."
                  value={menuItemSearch}
                  onChange={(e) => setMenuItemSearch(e.target.value)}
                />
                <div
                  className="max-h-[360px] overflow-y-auto rounded-lg border border-gray-200"
                  style={{ contain: 'content', overscrollBehavior: 'contain' }}
                >
                  {groupedMenuItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No matching items</div>
                  ) : (
                    groupedMenuItems.map(([group, grouped]) => (
                      <div key={group}>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-800 bg-primary-50 border-b border-gray-200">
                          {group}
                        </div>
                        {grouped.map((item) => {
                            const _edPDK = menuEditorPack ? PACK_LABELS[menuEditorPack].toLowerCase() : '';
                            const _edPD = formDiff?.packs[_edPDK];
                            const _isAdded = _edPD?.addedItemIds.includes(item.id);
                            const _isRemoved = _edPD?.removedItemIds.includes(item.id);
                            return (
                              <label
                                key={`${menuEditorPack}-${item.id}`}
                                className={`cv-auto flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                                  _isAdded ? 'bg-green-50 text-green-900' : _isRemoved ? 'bg-red-50 text-red-900' : 'text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={activeMenuPackRow.menuItemIds.includes(item.id)}
                                  onChange={() => togglePackMenuItem(menuEditorPack, item.id)}
                                />
                                <span>{item.name}</span>
                                {_isAdded && <span className="ml-auto text-xs font-semibold text-green-700">+ added</span>}
                                {_isRemoved && <span className="ml-auto text-xs font-semibold text-red-700">− removed</span>}
                              </label>
                            );
                          })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">Selected Items</p>
                {activeMenuPackRow.menuItemIds.length === 0 ? (
                  <p className="text-sm text-gray-500">No items selected.</p>
                ) : (
                  <div
                    className="max-h-[360px] overflow-y-auto space-y-3"
                    style={{ contain: 'content', overscrollBehavior: 'contain' }}
                  >
                    {selectedMenuItemsByGroup.map(([group, grouped]) => (
                      <div key={`selected-group-${group}`} className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {grouped.map((item) => {
                              const _sPDK = menuEditorPack ? PACK_LABELS[menuEditorPack].toLowerCase() : '';
                              const _sPD = formDiff?.packs[_sPDK];
                              const _sAdded = _sPD?.addedItemIds.includes(item.id);
                              const _sRemoved = _sPD?.removedItemIds.includes(item.id);
                              return (
                                <span
                                  key={`selected-${menuEditorPack}-${item.id}`}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                                    _sAdded ? 'border-green-400 bg-green-50 text-green-900' : _sRemoved ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {_sAdded && <span className="text-green-600 font-bold text-xs">+</span>}
                                  {_sRemoved && <span className="text-red-600 font-bold text-xs">−</span>}
                                  {item.name}
                                  <button
                                    type="button"
                                    className="text-red-600"
                                    onClick={() => togglePackMenuItem(menuEditorPack, item.id)}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setMenuEditorPack(null);
                  setMenuItemSearch('');
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </FormPromptModal>

      <FormPromptModal
        open={Boolean(menuPdfBookingId)}
        title="Booking Menu PDF"
        onClose={closeMenuPdfModal}
        widthClass="max-w-6xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),auto,auto] gap-3 items-end">
            <div>
              <label className="label">Menu Pack</label>
              <select
                className="input"
                value={menuPdfPackId}
                disabled={menuPdfSetupLoading || menuPdfPackOptions.length === 0}
                onChange={(e) => setMenuPdfPackId(e.target.value)}
              >
                {menuPdfPackOptions.length === 0 ? (
                  <option value="">No menu available</option>
                ) : (
                  menuPdfPackOptions.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name} ({pack.itemCount} items)
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={menuPdfSetupLoading || menuPdfLoading || !menuPdfBookingId || !menuPdfPackId}
              onClick={() => {
                if (!menuPdfBookingId || !menuPdfPackId) return;
                void loadMenuPdfPreview(menuPdfBookingId, menuPdfPackId);
              }}
            >
              Preview
            </button>
            <button
              type="button"
              className="btn btn-primary inline-flex items-center gap-2"
              disabled={!menuPdfPreviewUrl || menuPdfLoading}
              onClick={handleDownloadMenuPdf}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden min-h-[500px]">
            {menuPdfSetupLoading ? (
              <div className="h-[500px] grid place-items-center text-sm text-gray-600">
                Loading menu options...
              </div>
            ) : menuPdfLoading ? (
              <div className="h-[500px] grid place-items-center">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary-600"></div>
              </div>
            ) : menuPdfPreviewUrl ? (
              <iframe
                title="Booking menu PDF preview"
                src={menuPdfPreviewUrl}
                className="w-full h-[70vh]"
              />
            ) : (
              <div className="h-[500px] grid place-items-center text-sm text-gray-500">
                Select a menu pack to generate preview.
              </div>
            )}
          </div>
        </div>
      </FormPromptModal>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Overall search across all booking columns..."
            className="input pl-10 pr-10"
          />
          {globalSearch && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-4)',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {!canViewBooking ? (
          <div className="text-sm text-gray-500">No data available.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            {(globalSearch || Object.values(columnSearch).some(Boolean)) ? (
              <>
                <p className="text-gray-500 mb-1">No bookings match your search</p>
                <p className="text-gray-400 text-sm mb-4">
                  &ldquo;{globalSearch || Object.values(columnSearch).find(Boolean)}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-secondary"
                >
                  Clear search
                </button>
              </>
            ) : (
              <p className="text-gray-500">No bookings found</p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                {paginatedBookings.map((booking) => (
                  <MobileBookingCard
                    key={booking.id}
                    booking={booking}
                    canExportMenuPdf={canExportMenuPdf}
                    canEditBooking={canEditBooking}
                    canDeleteBooking={canDeleteBooking}
                    onExportPdf={(b) => openMenuPdfModal(b)}
                    onEdit={(id) => openEditBooking(id)}
                    onDelete={(id) => handleDeleteBooking(id)}
                  />
                ))}
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBookings.length}
                pageSize={BOOKINGS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      label="Function"
                      sortKey="functionName"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Customer"
                      sortKey="customer"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Date"
                      sortKey="functionDate"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Guests"
                      sortKey="expectedGuests"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                    />
                    <SortableHeader
                      label="Amount"
                      sortKey="grandTotal"
                      sort={sort}
                      onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                      className="text-right py-3 px-4 text-sm font-semibold text-gray-700"
                    />
                    {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    )}
                  </tr>
                  <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-4">
                      <input
                        className="input h-9"
                        placeholder="Search function"
                        value={columnSearch.functionName}
                        onChange={(e) => handleColumnSearch('functionName', e.target.value)}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <input
                        className="input h-9"
                        placeholder="Search customer"
                        value={columnSearch.customer}
                        onChange={(e) => handleColumnSearch('customer', e.target.value)}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <input
                        type="date"
                        className="input h-9"
                        placeholder="Search date"
                        value={columnSearch.functionDate}
                        onChange={(e) => handleColumnSearch('functionDate', e.target.value)}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <input
                        className="input h-9"
                        placeholder="Search guests"
                        value={columnSearch.expectedGuests}
                        onChange={(e) => handleColumnSearch('expectedGuests', e.target.value)}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <input
                        className="input h-9"
                        placeholder="Search status"
                        value={columnSearch.status}
                        onChange={(e) => handleColumnSearch('status', e.target.value)}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <input
                        className="input h-9 text-right"
                        placeholder="Search amount"
                        value={columnSearch.grandTotal}
                        onChange={(e) => handleColumnSearch('grandTotal', e.target.value)}
                      />
                    </th>
                    {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                      <th className="py-2 px-4" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="cv-auto-row border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{booking.functionName}</p>
                        <p className="text-xs text-gray-500 mt-1">{booking.functionType}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">{booking.customer?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{booking.customer?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {formatDateDDMMYYYY(booking.functionDate)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          {booking.expectedGuests}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${booking.isQuotation
                            ? 'bg-amber-100 text-amber-800'
                            : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                            }`}
                        >
                          {booking.isQuotation ? 'Quotation' : booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
                        ₹{(booking.grandTotal || 0).toLocaleString()}
                      </td>
                      {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canExportMenuPdf && (
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                onClick={() => openMenuPdfModal(booking)}
                                title="Preview menu PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {canEditBooking && (
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                onClick={() => openEditBooking(booking.id)}
                                title="Edit booking"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteBooking && (
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                onClick={() => handleDeleteBooking(booking.id)}
                                title="Delete booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBookings.length}
                pageSize={BOOKINGS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {canAddBooking && (
        <FloatingActionButton
          onClick={() => setShowCreateForm(true)}
          label="New Booking"
        />
      )}
      <FormPromptModal
        open={showPartyOverModal}
        title="Settle Party Remainder (Extra Plates)"
        onClose={() => {
          setShowPartyOverModal(false);
          setPartyOverPlates({});
          setPartyOverRates({});
          setActivePartyOverBooking(null);
        }}
        widthClass="max-w-xl"
      >
        <form onSubmit={handlePartyOverSubmit} className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
            <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-1"><Flag className="w-4 h-4" /> Permanent Finalization</h4>
            <p className="text-sm text-red-700">Marking a party as over will freeze ALL versions. This action cannot be reversed. Please input the extra plates strictly as used.</p>
          </div>

          <div className="space-y-4">
            {activePartyOverBooking?.packs?.map((pack: any) => (
              <div key={pack.id} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{pack.packName}</h5>
                    <p className="text-xs text-gray-500">
                      Confirmed Pax: {pack.packCount || pack.noOfPack} @ ₹{pack.ratePerPlate}/plate
                    </p>
                  </div>
                  {(() => {
                    const ep = partyOverPlates[pack.id] || 0;
                    const er = partyOverRates[pack.id] || 0;
                    if (ep > 0) {
                      return (
                        <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                          Extra: ₹{(ep * er).toLocaleString('en-IN')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Extra Plates Used</label>
                    <input
                      type="number"
                      min={0}
                      className="input w-full"
                      value={partyOverPlates[pack.id] || ''}
                      onChange={(e) =>
                        setPartyOverPlates((prev) => ({
                          ...prev,
                          [pack.id]: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Rate / Extra Plate (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="input w-full"
                      value={partyOverRates[pack.id] ?? ''}
                      onChange={(e) =>
                        setPartyOverRates((prev) => ({
                          ...prev,
                          [pack.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!activePartyOverBooking?.packs || activePartyOverBooking.packs.length === 0) && (
              <p className="text-sm text-gray-500">No packs to settle for this booking.</p>
            )}
          </div>

          {(() => {
            const extraTotal = (activePartyOverBooking?.packs || []).reduce((sum: number, pack: any) => {
              const ep = partyOverPlates[pack.id] || 0;
              const er = partyOverRates[pack.id] || 0;
              return sum + ep * er;
            }, 0);
            if (extraTotal <= 0) return null;
            return (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">Total Extra Charges</span>
                <span className="text-base font-bold text-orange-800">
                  ₹{extraTotal.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })()}

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowPartyOverModal(false);
                setPartyOverPlates({});
                setPartyOverRates({});
                setActivePartyOverBooking(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
              {saving ? 'Processing...' : 'Settle & Lock'}
            </button>
          </div>
        </form>
      </FormPromptModal>
    </div>
  );
}
