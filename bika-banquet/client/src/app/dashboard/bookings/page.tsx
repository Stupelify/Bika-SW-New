'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
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
  PencilLine,
  Plus,
  Printer,
  Save,
  Search,
  Star,
  Trash2,
  Users,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, fetchAllCustomers } from '@/lib/api';
import Combobox from '@/components/Combobox';
import FormPromptModal from '@/components/FormPromptModal';
import FilterPanel from '@/components/FilterPanel';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
import { TableSkeleton } from '@/components/Skeletons';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useDebounce } from '@/lib/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import { buildSseEventStreamUrl } from '@/lib/dashboardNavigation';
import { customerSearchText, matchesCustomerSearch } from '@/lib/customerSearch';
import { lookupIndianPincode } from '@/lib/pincodeLookup';
import { INDIA_STATES } from '@/lib/indiaData';
import {
  mapBookingPaymentsFromApi,
  partitionPaymentsForSave,
} from '@/lib/booking-form/payments';
import { validateBillingCeiling } from '@/lib/booking-form/financials';
import {
  buildItemByIdMap,
  calculateMenuPointsFromMap,
  extractTemplateItemIds,
  getItemPoints,
  templateItemsToMenuItemLikes,
} from '@/lib/booking-form/menu-template';
import {
  buildBookingHallRows,
  computePackRowAmount,
  computePackRowAmountFromApiPack,
  computeExtrasSubtotal,
  computePreDiscountTotal,
  sumPackHallRates,
} from '@/lib/booking-form/billing-lines';
import type { MenuItemLike } from '@/lib/booking-form/types';
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
import BookingCard from '@/components/BookingCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import StatusBadge from '@/components/StatusBadge';
import BookingPaymentsLedger from '@/components/BookingPaymentsLedger';
import BookingFinancialSummary from '@/components/BookingFinancialSummary';
import BookingPartyOverForm from '@/components/BookingPartyOverForm';

interface Booking {
  id: string;
  customerId?: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  expectedGuests: number;
  status: string;
  isQuotation: boolean;
  isPencilBooking?: boolean;
  pencilExpiresAt?: string | null;
  grandTotal: number;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
  };
  _count?: {
    payments: number;
    packs: number;
  };
  halls?: Array<{
    hall?: { id: string; name: string; banquet?: { id: string; name: string } | null } | null;
  }>;
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
  phoneCountryCode?: string | null;
  alterPhone?: string | null;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  whatsapp?: string | null;
  email?: string | null;
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
    order?: number | null;
    displayOrder?: number | null;
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
        order?: number | null;
        displayOrder?: number | null;
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
  id?: string;      // present for payments already persisted in the DB
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
  reference: string;
  clearingDate: string;
  // Snapshot of the values as they existed on last load — used to detect which
  // existing payments were actually changed so we only PATCH those.
  _original?: {
    mode: string;
    narration: string;
    date: string;
    receivedBy: string;
    amount: string;
    reference: string;
    clearingDate: string;
  };
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
  isPencilBooking: boolean;
  pencilDays: string;
  pencilExpiresAt: string;
  advanceRequired: string;
  paymentReceivedPercent: string;
  dueAmount: string;
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
  isPencilBooking: false,
  pencilDays: '3',
  pencilExpiresAt: '',
  advanceRequired: '0',
  paymentReceivedPercent: '0',
  dueAmount: '0',
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
  breakfast: 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 border-l-[3px] border-l-orange-500',
  lunch: 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 border-l-[3px] border-l-green-500',
  hiTea: 'border-[var(--border)] dark:border-slate-700/50 bg-[var(--surface-2)] dark:bg-slate-800/30 border-l-[3px] border-l-slate-500',
  dinner: 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500',
};

const FUNCTION_TYPE_OPTIONS = [
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

const LONGEST_FUNCTION_TYPE_OPTION = FUNCTION_TYPE_OPTIONS.reduce(
  (longest, option) => (option.length > longest.length ? option : longest),
  FUNCTION_TYPE_OPTIONS[0]
);

/** Typical primary display: name (~20) + phone (~12) + " ()" */
const PRIMARY_CUSTOMER_FIELD_CH = 20 + 12 + 4;

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

function computePencilExpiry(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, days));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const searchParams = useSearchParams();
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
  const [itemTypes, setItemTypes] = useState<{ id: string; name: string }[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [quickItemForm, setQuickItemForm] = useState({ name: '', itemTypeId: '', points: '' });
  const [savingQuickItem, setSavingQuickItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [expandedHistoryVersions, setExpandedHistoryVersions] = useState<Record<string, boolean>>(
    {}
  );
  const [activeBookingTab, setActiveBookingTab] = useState<'details' | 'payments'>('details');
  const [activeBookingObj, setActiveBookingObj] = useState<any>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingBookingStatus, setEditingBookingStatus] = useState<string | null>(null);
  const [menuEditorPack, setMenuEditorPack] = useState<PackKey | null>(null);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [bookingPdfLoading, setBookingPdfLoading] = useState<string | null>(null); // stores bookingId while loading
  const [menuPdfBookingId, setMenuPdfBookingId] = useState<string | null>(null);
  const [menuPdfBookingName, setMenuPdfBookingName] = useState('');
  const [menuPdfPackOptions, setMenuPdfPackOptions] = useState<BookingMenuPackOption[]>([]);
  const [menuPdfPackId, setMenuPdfPackId] = useState('');
  const [menuPdfLoading, setMenuPdfLoading] = useState(false);
  const [menuPdfSetupLoading, setMenuPdfSetupLoading] = useState(false);
  const [menuPdfPreviewUrl, setMenuPdfPreviewUrl] = useState<string | null>(null);
  const [openHallPickerPack, setOpenHallPickerPack] = useState<PackKey | null>(null);
  const [hallPickerAnchorRect, setHallPickerAnchorRect] = useState<DOMRect | null>(null);
  const [focusedPackAmount, setFocusedPackAmount] = useState<{ key: PackKey; value: string } | null>(null);
  const [netAmountDraft, setNetAmountDraft] = useState<string | null>(null);
  const [customerSearchInputs, setCustomerSearchInputs] =
    useState<CustomerSearchInputState>({
      primary: '',
      second: '',
      referred: '',
    });
  const [activeCustomerSearchField, setActiveCustomerSearchField] =
    useState<CustomerSearchField | null>(null);
  const hallPickerContainerRef = useRef<HTMLDivElement | null>(null);
  const hallPickerPortalRef = useRef<HTMLDivElement | null>(null);
  const actionSentinelRef = useRef<HTMLDivElement | null>(null);
  // Snapshot of formData as last loaded from the server. Reset to this on server rejection.
  const savedFormDataRef = useRef<BookingFormData | null>(null);
  const savingInFlightRef = useRef(false);
  const [importedTemplateExtras, setImportedTemplateExtras] = useState<MenuItemLike[]>([]);
  const [showStickyActions, setShowStickyActions] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedGlobalSearch = useDebounce(globalSearch, 150);
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortState>({
    key: 'functionDate',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  // view mode: 'table' (default on desktop) or 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [inlineCustomerFormData, setInlineCustomerFormData] = useState<InlineCustomerFormData>(
    initialInlineCustomerFormData
  );
  const [inlineCustomerSaving, setInlineCustomerSaving] = useState(false);
  const [isInlineWhatsappDifferent, setIsInlineWhatsappDifferent] = useState(false);
  const [inlineCustomerEmailError, setInlineCustomerEmailError] = useState('');
  const [inlineCustomerPincodeLookupLoading, setInlineCustomerPincodeLookupLoading] =
    useState(false);
  const [inlineCustomerPincodeLookupError, setInlineCustomerPincodeLookupError] = useState('');
  const [inlineCustomerPhoneErrors, setInlineCustomerPhoneErrors] = useState<{
    phone?: string;
    alterPhone?: string;
    whatsappNumber?: string;
  }>({});
  const [amountSyncMode, setAmountSyncMode] = useState<AmountSyncMode>('discountPercent');
  // When true the user has explicitly typed a discount/final-amount value.
  // The auto-recalc effect will NOT overwrite it when pack rates change.
  const [discountManuallySet, setDiscountManuallySet] = useState(false);
  const prevTotalPackAmountRef = useRef<number | null>(null);

  // Payment modal state
  const [paymentDraft, setPaymentDraft] = useState<PaymentRow>({
    amount: '',
    mode: 'Cash',
    date: new Date().toISOString().split('T')[0],
    receivedBy: '',
    narration: '',
    reference: '',
    clearingDate: '',
  });

  const todayStr = () => new Date().toISOString().split('T')[0];

  const debouncedInlineCustomerPincode = useDebounce(inlineCustomerFormData.pincode, 350);

  // ── Hall clash detection ──────────────────────────────────────────────────
  const [hallClashWarnings, setHallClashWarnings] = useState<Array<{
    bookingId: string;
    functionName: string;
    functionType: string;
    startTime: string | null;
    endTime: string | null;
    functionTime: string | null;
    clashingHalls: Array<{ id: string; name: string }>;
  }>>([]);

  // Collect all selected hallIds across all enabled packs
  const selectedHallIds = useMemo(() => {
    const ids = new Set<string>();
    (Object.keys(formData.packs) as PackKey[]).forEach((k) => {
      const row = formData.packs[k];
      if (row.enabled) row.hallIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [formData.packs]);

  // Debounced availability check — fires when date or halls change
  const availabilityCheckKey = `${formData.functionDate}|${selectedHallIds.sort().join(',')}`;
  const availabilityCheckKeyRef = useRef(availabilityCheckKey);
  availabilityCheckKeyRef.current = availabilityCheckKey;

  useEffect(() => {
    if (!formData.functionDate || selectedHallIds.length === 0) {
      setHallClashWarnings([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (availabilityCheckKeyRef.current !== availabilityCheckKey) return;
      try {
        const params = {
          hallIds: selectedHallIds.join(','),
          date: formData.functionDate,
          ...(editingBookingId ? { excludeBookingId: editingBookingId } : {}),
        };
        const res = await api.checkBookingAvailability(params);
        const data = res.data?.data;
        if (data && !data.available) {
          setHallClashWarnings(data.clashes || []);
        } else {
          setHallClashWarnings([]);
        }
      } catch {
        setHallClashWarnings([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityCheckKey, editingBookingId]);
  // ── End hall clash detection ──────────────────────────────────────────────

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
          customerSearchText({
            name: booking.customer?.name,
            phone: booking.customer?.phone,
            email: booking.customer?.email,
          }),
      },
      {
        key: 'functionDate',
        accessor: (booking) => booking.functionDate,
      },
      {
        key: 'expectedGuests',
        accessor: (booking) => booking.expectedGuests,
        searchable: false,
      },
      {
        key: 'status',
        accessor: (booking) =>
          booking.isQuotation ? 'Quotation' : booking.status,
      },
      {
        key: 'grandTotal',
        accessor: (booking) => booking.grandTotal ?? 0,
        searchable: false,
      },
    ],
    []
  );

  const filteredBookings = useMemo(
    () => filterAndSortRows(bookings, tableColumns, debouncedGlobalSearch, columnSearch, sort),
    [bookings, tableColumns, debouncedGlobalSearch, columnSearch, sort]
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

  const formatComputedAmount = useCallback((amount: number): string => {
    if (!Number.isFinite(amount)) return '0';
    const rounded = Number(amount.toFixed(2));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }, []);

  const packRowAmount = useCallback(
    (row: BookingPackRow) => computePackRowAmount(row),
    []
  );

  const billingTotals = useMemo(() => {
    const preDiscountTotal = computePreDiscountTotal(
      formData.packs,
      formData.additionalRequirements
    );
    const enabledRows = (Object.keys(formData.packs) as PackKey[])
      .filter((key) => formData.packs[key].enabled)
      .map((key) => formData.packs[key]);
    return {
      preDiscountTotal,
      packHallSubtotal: sumPackHallRates(enabledRows),
      extrasSubtotal: computeExtrasSubtotal(formData.additionalRequirements),
    };
  }, [formData.packs, formData.additionalRequirements]);

  const totalBillBase = billingTotals.preDiscountTotal;
  const totalHallAmount = billingTotals.packHallSubtotal;

  // Keep for backward-compat references (same value as totalBillBase)
  const totalBillAmount = totalBillBase;

  // Keep dueAmount in sync: always = grandTotal (finalAmount + extras) minus what's been paid.
  // When there are no payments, due = full amount automatically.
  useEffect(() => {
    void loadLookups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAddBooking, canEditBooking]);

  useEffect(() => {
    if (!showCreateForm) return;
    // Model A: finalAmount = full grand total after discount (halls + packs + extras − discount).
    // No need to add extras again — they are already inside finalAmount / totalBillBase.
    const grandTotal = parseFloat(formData.finalAmount || '0') || totalBillBase;
    const due = Math.max(0, grandTotal - totalPayments);
    setFormData((prev) => ({ ...prev, dueAmount: due.toFixed(2) }));
  }, [formData.finalAmount, totalPayments, totalBillBase, showCreateForm]);

  const enabledPackAmountRows = useMemo(
    () =>
      (Object.keys(formData.packs) as PackKey[])
        .map((packKey) => {
          const row = formData.packs[packKey];
          return {
            key: packKey,
            label: PACK_LABELS[packKey],
            enabled: row.enabled,
            amount: packRowAmount(row),
          };
        })
        .filter((entry) => entry.enabled),
    [packRowAmount, formData.packs]
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

  const menuItemById = useMemo(() => {
    const fromTemplates = templateMenus.flatMap((menu) =>
      templateItemsToMenuItemLikes(menu.items as Parameters<typeof templateItemsToMenuItemLikes>[0])
    );
    return buildItemByIdMap(items as MenuItemLike[], [
      ...fromTemplates,
      ...importedTemplateExtras,
    ]);
  }, [items, templateMenus, importedTemplateExtras]);

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
      setIsFormDirty(true);
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
      let filtered = [...customers];

      if (query) {
        // Only match on name and phone — email/alt-phone matches are confusing
        // in a dropdown that only displays name and phone.
        filtered = filtered.filter((customer) => {
          const name = (customer.name || '').toLowerCase();
          const phone = (customer.phone || '').toLowerCase();
          const queryDigits = query.replace(/\D/g, '');
          if (name.includes(query)) return true;
          if (phone.includes(query)) return true;
          if (queryDigits.length >= 2) {
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.includes(queryDigits)) return true;
          }
          return false;
        });

        const score = (c: CustomerOption): number => {
          const name = (c.name || '').toLowerCase();
          const phone = (c.phone || '').toLowerCase();
          if (name.startsWith(query)) return 0;
          if (name.includes(query)) return 1;
          if (phone.startsWith(query)) return 2;
          if (phone.includes(query)) return 3;
          return 4;
        };

        filtered.sort((a, b) => {
          const diff = score(a) - score(b);
          return diff !== 0 ? diff : compareCustomersByName(a, b);
        });
      } else {
        filtered.sort(compareCustomersByName);
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

      const trimmedValue = rawValue.trim();
      const exactMatch = customers.find((customer) => {
        const name = (customer.name || '').trim().toLowerCase();
        const phone = (customer.phone || '').trim();
        const label = formatCustomerLabel(customer).toLowerCase();
        const queryDigits = trimmedValue.replace(/\D/g, '');
        const phoneDigits = phone.replace(/\D/g, '');
        return (
          name === query ||
          phone === trimmedValue ||
          label === query ||
          (queryDigits.length >= 2 && phoneDigits === queryDigits)
        );
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
      const insideButton = hallPickerContainerRef.current?.contains(target);
      const insidePortal = hallPickerPortalRef.current?.contains(target);
      if (!insideButton && !insidePortal) {
        setOpenHallPickerPack(null);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
    };
  }, [openHallPickerPack]);

  const groupedMenuItems = useMemo(() => {
    // Items arrive pre-sorted by itemType.displayOrder/order from the server.
    // Inserting into a Map preserves that insertion order for groups.
    const map = new Map<string, ItemOption[]>();
    filteredMenuItems.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const existing = map.get(group) || [];
      existing.push(item);
      map.set(group, existing);
    });
    // Sort items within each group alphabetically
    map.forEach((grouped, groupName) => {
      map.set(groupName, [...grouped].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })));
    });
    return Array.from(map.entries());
  }, [filteredMenuItems]);

  const selectedMenuItemsByGroup = useMemo(() => {
    if (!activeMenuPackRow) return [] as Array<[string, ItemOption[]]>;
    const selectedIds = new Set(activeMenuPackRow.menuItemIds);
    const selected = activeMenuPackRow.menuItemIds
      .map((id) => menuItemById.get(id))
      .filter((item): item is MenuItemLike => Boolean(item)) as ItemOption[];
    const map = new Map<string, ItemOption[]>();
    selected.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const bucket = map.get(group) || [];
      bucket.push(item);
      map.set(group, bucket);
    });
    map.forEach((grouped, groupName) => {
      map.set(groupName, [...grouped].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })));
    });
    return Array.from(map.entries());
  }, [activeMenuPackRow, menuItemById]);

  const calculateMenuPoints = useCallback(
    (menuItemIds: string[]): string => {
      return calculateMenuPointsFromMap(menuItemIds, menuItemById);
    },
    [menuItemById]
  );

  const updatePackRow = (packKey: PackKey, patch: Partial<BookingPackRow>) => {
    setIsFormDirty(true);
    setFormData((prev) => ({
      ...prev,
      packs: {
        ...prev.packs,
        [packKey]: { ...prev.packs[packKey], ...patch },
      },
    }));
  };

  const togglePackMenuItem = (packKey: PackKey, itemId: string) => {
    setIsFormDirty(true);
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

  const submitQuickAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemForm.itemTypeId || !quickItemForm.name.trim() || !quickItemForm.points) {
      toast.error('Name, type and points are required');
      return;
    }
    try {
      setSavingQuickItem(true);
      const response = await api.createItem({
        itemTypeId: quickItemForm.itemTypeId,
        name: quickItemForm.name.trim(),
        point: Number(quickItemForm.points),
        points: Number(quickItemForm.points),
        isVeg: true,
      });
      const newItemId = response.data?.data?.item?.id;
      const refreshed = await api.getItems({ page: 1, limit: 5000 });
      const refreshedItems = refreshed.data?.data?.items || [];
      setItems(refreshedItems);
      if (newItemId && menuEditorPack) {
        togglePackMenuItem(menuEditorPack, newItemId);
      }
      setShowQuickAddItem(false);
      setQuickItemForm({ name: '', itemTypeId: itemTypes[0]?.id || '', points: '' });
      toast.success('Item created and selected');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create item');
    } finally {
      setSavingQuickItem(false);
    }
  };

  const importTemplateToPack = async (packKey: PackKey, templateMenuId: string) => {
    if (!templateMenuId) {
      updatePackRow(packKey, { templateMenuId: '' });
      return;
    }

    const row = formData.packs[packKey];
    const templateName =
      templateMenus.find((entry) => entry.id === templateMenuId)?.name || 'this template';

    if (row.menuItemIds.length > 0) {
      const confirmed = window.confirm(
        `Replace all ${row.menuItemIds.length} selected item(s) with "${templateName}"?\n\nCurrent custom selections will be removed.`
      );
      if (!confirmed) return;
    }

    try {
      const response = await api.getTemplateMenu(templateMenuId);
      const fullTemplate = response.data?.data?.templateMenu;
      if (!fullTemplate) {
        toast.error('Template details not found');
        return;
      }

      const templateItemLikes = templateItemsToMenuItemLikes(fullTemplate.items);
      const templateIds = extractTemplateItemIds(fullTemplate.items);

      setImportedTemplateExtras((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        for (const item of templateItemLikes) map.set(item.id, item);
        return Array.from(map.values());
      });

      updatePackRow(packKey, {
        templateMenuId,
        menuItemIds: templateIds,
        menuPoints: calculateMenuPoints(templateIds),
      });

      toast.success(
        `Imported ${templateIds.length} item${templateIds.length === 1 ? '' : 's'} from ${templateName}`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to import template menu');
    }
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
    // Skip auto-recalc entirely if the user has manually set a discount/final
    // amount. This prevents pack rate changes from silently overwriting what
    // the user typed.
    if (!showCreateForm || discountManuallySet) return;
    setFormData((prev) => {
      const sourceValue =
        amountSyncMode === 'discountPercent'
          ? prev.finalDiscountPercent
          : amountSyncMode === 'discountAmount'
            ? prev.finalDiscountAmount
            : prev.finalAmount;
      // Discount is applied to pack amounts only (not extras)
      const nextValues = normalizeAmountSnapshot(amountSyncMode, sourceValue, totalBillBase);
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
  }, [amountSyncMode, discountManuallySet, normalizeAmountSnapshot, showCreateForm, totalBillBase]);

  useEffect(() => {
    if (!showCreateForm) return;
    if (prevTotalPackAmountRef.current === null) {
      prevTotalPackAmountRef.current = totalBillBase;
      return;
    }
    if (prevTotalPackAmountRef.current === totalBillBase) return;
    prevTotalPackAmountRef.current = totalBillBase;
    if (!discountManuallySet) return;
    // Billing base changed while discount was manually set — reset discount, net = new base
    setFormData((prev) => ({
      ...prev,
      finalDiscountPercent: '',
      finalDiscountAmount: '',
      finalAmount: formatComputedAmount(totalBillBase),
    }));
  }, [totalBillBase, discountManuallySet, showCreateForm, formatComputedAmount]);

  const addPaymentRow = () => {
    setFormData((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          mode: 'Cash',
          narration: '',
          date: todayStr(),
          receivedBy: '',
          amount: '',
          reference: '',
          clearingDate: '',
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

  const loadBookings = useCallback(async () => {
    try {
      if (!hasAnyPermission(permissionSet, ['view_booking', 'add_booking', 'edit_booking', 'manage_bookings'])) {
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
  }, [canViewBooking]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const section = searchParams.get('section');
    const id = searchParams.get('id');
    if (section === 'edit' && id) {
      void openEditBooking(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canViewBooking || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const openSseConnection = async () => {
      try {
        const res = await api.getSseToken();
        if (cancelled) return;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        eventSource = new EventSource(buildSseEventStreamUrl(baseUrl, res.data.token));

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string };
            if (payload.type?.startsWith('booking:')) {
              void loadBookings();
            }
          } catch {
            // Ignore malformed SSE payloads and keep the stream alive.
          }
        };
      } catch {
        // SSE token fetch failed — real-time updates unavailable, page still works.
      }
    };

    void openSseConnection();

    return () => {
      cancelled = true;
      eventSource?.close();
    };
  }, [canViewBooking, loadBookings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = bookings.slice(0, 20).map((booking) => ({
      id: booking.id,
      name: booking.functionName || 'Booking',
      subtitle: formatCustomerLabel(booking.customer),
      href: `/dashboard/bookings?section=edit&id=${booking.id}`,
    }));
    window.localStorage.setItem('bika_palette_bookings', JSON.stringify(payload));
  }, [bookings]);

  useEffect(() => {
    if (!actionSentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyActions(!entry.isIntersecting);
      },
      { root: null, rootMargin: '-200px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(actionSentinelRef.current);
    return () => observer.disconnect();
  }, [actionSentinelRef]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalSearch, columnSearch, sort]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!showAddCustomerForm) return;

    const country = inlineCustomerFormData.country.trim().toLowerCase();
    const pincode = digitsOnly(debouncedInlineCustomerPincode);

    if (country !== 'india') {
      setInlineCustomerPincodeLookupLoading(false);
      setInlineCustomerPincodeLookupError('');
      return;
    }

    if (!pincode) {
      setInlineCustomerPincodeLookupLoading(false);
      setInlineCustomerPincodeLookupError('');
      return;
    }

    if (pincode.length !== 6) {
      setInlineCustomerPincodeLookupLoading(false);
      setInlineCustomerPincodeLookupError('');
      return;
    }

    const controller = new AbortController();

    const lookupPincode = async () => {
      try {
        setInlineCustomerPincodeLookupLoading(true);
        setInlineCustomerPincodeLookupError('');

        const result = await lookupIndianPincode(pincode, controller.signal);

        if (!result) {
          setInlineCustomerPincodeLookupError('Could not find city/state for this PIN code.');
          return;
        }

        setInlineCustomerFormData((prev) =>
          digitsOnly(prev.pincode) === pincode
            ? {
                ...prev,
                city: result.city || prev.city,
                state: result.state || prev.state,
              }
            : prev
        );
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setInlineCustomerPincodeLookupError('PIN lookup failed. Enter city/state manually.');
      } finally {
        if (!controller.signal.aborted) {
          setInlineCustomerPincodeLookupLoading(false);
        }
      }
    };

    void lookupPincode();

    return () => controller.abort();
  }, [
    debouncedInlineCustomerPincode,
    inlineCustomerFormData.country,
    showAddCustomerForm,
  ]);

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
    setInlineCustomerPincodeLookupLoading(false);
    setInlineCustomerPincodeLookupError('');
    setInlineCustomerPhoneErrors({});
  };

  const loadCustomerOptions = async (): Promise<CustomerOption[]> => {
    const customerRows = (await fetchAllCustomers()) as unknown as CustomerOption[];
    const seen = new Set<string>();
    const unique = customerRows.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    const sortedCustomers = unique.sort(compareCustomersByName);
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
      const [customerRows, banquetRes, hallRes, itemRes, templateRes, itemTypeRes] = await Promise.all([
        loadCustomerOptions(),
        api.getBanquets({ page: 1, limit: 200 }),
        api.getHalls({ page: 1, limit: 200 }),
        api.getItems({ page: 1, limit: 5000 }),
        api.getTemplateMenus({ page: 1, limit: 200, includeItems: true }),
        api.getItemTypes({ page: 1, limit: 500 }),
      ]);
      const banquetRows = banquetRes.data?.data?.banquets || [];
      const hallRows = hallRes.data?.data?.halls || [];
      const itemRows = itemRes.data?.data?.items || [];
      const templateRows = templateRes.data?.data?.templateMenus || [];
      const itemTypeRows = itemTypeRes.data?.data?.itemTypes || [];
      setCustomers(customerRows);
      setBanquets(banquetRows);
      setHalls(hallRows);
      setItems(itemRows);
      setItemTypes(itemTypeRows);
      setTemplateMenus(templateRows);
    } catch (error) {
      toast.error('Failed to load booking form options');
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
    setDiscountManuallySet(false);
    setFormData(initialFormData);
    setIsFormDirty(false);
    setActiveBookingTab('details');
    setActiveBookingObj(null);
    setImportedTemplateExtras([]);
    // Clear any active search so the freshly-saved booking is always visible
    // in the list (Bug: booking appeared to vanish because search was still active)
    clearSearch();
  };

  const openCreateBooking = () => {
    void loadLookups();
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
    setDiscountManuallySet(false);
    setFormData(initialFormData);
    setIsFormDirty(false);
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
      if (halls.length === 0 || templateMenus.length === 0 || customers.length === 0) {
        await loadLookups();
      }
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
      const expanded: Record<string, boolean> = {};
      historyRows.forEach((row: { id?: string }) => {
        if (row?.id && row.id !== bookingId) {
          expanded[row.id] = true;
        }
      });
      setExpandedHistoryVersions(expanded);

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
      const loadedFormData: BookingFormData = {
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
        isPencilBooking: booking.isPencilBooking || false,
        pencilDays: (() => {
          if (!booking.pencilExpiresAt) return '3';
          const diffMs = new Date(booking.pencilExpiresAt).getTime() - Date.now();
          return String(Math.max(1, Math.ceil(diffMs / 86400000)));
        })(),
        pencilExpiresAt: booking.pencilExpiresAt ? booking.pencilExpiresAt.slice(0, 10) : '',
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
          // Model A: finalAmount = full grand total (halls+packs+extras−discount). Load directly.
          booking.finalAmountValue !== undefined && booking.finalAmountValue !== null
            ? String(booking.finalAmountValue)
            : booking.finalAmount ||
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
        payments: mapBookingPaymentsFromApi(booking.payments || []),
        packs: nextPacks,
      };
      setFormData(loadedFormData);
      setIsFormDirty(false);
      setActiveBookingObj(booking);
      // Snapshot of server state — used to reset on submission failure.
      savedFormDataRef.current = loadedFormData;
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
      setDiscountManuallySet(true); // existing booking already has deliberate amounts
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

  const handleDownloadBookingPdf = useCallback(async (booking: Booking) => {
    if (bookingPdfLoading) return;
    try {
      setBookingPdfLoading(booking.id);
      const response = await api.getBookingPdf(booking.id);
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (booking.functionName || booking.functionType || booking.customer?.name || 'booking')
        .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'booking';
      link.href = url;
      link.download = `${safeName}-booking-details.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to generate booking PDF');
    } finally {
      setBookingPdfLoading(null);
    }
  }, [bookingPdfLoading]);

  const applyBookingToForm = useCallback((booking: any) => {
    const loadedPayments = mapBookingPaymentsFromApi(booking.payments || []);
    setFormData((prev) => {
      const next = { ...prev, payments: loadedPayments };
      savedFormDataRef.current = next;
      return next;
    });
    setActiveBookingObj(booking);
  }, []);

  const doSaveBooking = async (opts?: { keepOpen?: boolean }): Promise<string | null> => {
    if (savingInFlightRef.current) return null;
    if (!formData.customerId || !formData.functionType.trim() || !formData.functionDate) {
      toast.error('Primary customer, function type and date are required');
      return null;
    }
    if (formData.isPencilBooking && !formData.pencilExpiresAt) {
      toast.error('Set an expiry date for the pencil booking');
      return null;
    }
    if (!editingBookingId && formData.functionDate < todayIsoDate) {
      toast.error(
        `Function date cannot be before ${formatDateDDMMYYYY(todayIsoDate)} for new bookings`
      );
      return null;
    }

    const finalAmountForCheck =
      netAmountDraft !== null
        ? normalizeAmountSnapshot('finalAmount', netAmountDraft, totalBillBase)
            .finalAmount
        : formData.finalAmount;
    const billingCheck = validateBillingCeiling({
      totalBillBase,
      discountAmount: formData.finalDiscountAmount,
      discountPercent: formData.finalDiscountPercent,
      finalAmount: finalAmountForCheck,
    });
    if (!billingCheck.ok) {
      toast.error(
        billingCheck.message ||
          'Net amount cannot exceed the bill total. Adjust discount or line items and try again.'
      );
      return null;
    }
    if (netAmountDraft !== null) {
      setNetAmountDraft(null);
      setFormData((prev) => ({
        ...prev,
        ...normalizeAmountSnapshot('finalAmount', netAmountDraft, totalBillBase),
      }));
    }

    try {
      savingInFlightRef.current = true;
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
        return null;
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
        return null;
      }

      const expectedGuests = Math.max(
        1,
        ...enabledPackEntries
          .map((entry) => Number(entry.row.pax || 0))
          .filter((value) => value > 0)
      );
      const normalizedDiscountAmount = Math.min(
        totalBillBase,
        Math.max(0, toNumber(formData.finalDiscountAmount || '0'))
      );
      const normalizedDiscountPercent = Math.min(
        100,
        Math.max(0, toNumber(formData.finalDiscountPercent || '0'))
      );
      const normalizedFinalAmount = Math.min(
        totalBillBase,
        Math.max(0, toNumber(formData.finalAmount || '0'))
      );
      const functionTime = enabledPackEntries[0]?.row.startTime || '12:00';
      const functionName = formData.functionType.trim();

      const hallsPayload = buildBookingHallRows(
        enabledPackEntries
          .filter((entry) => entry.row.withHall)
          .map((entry) => ({ validHallIds: getValidHallIdsForPack(entry.row) }))
      );

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
          extraPlate: row.extraPlate ?? undefined,
          extraAmount: row.extraAmount ?? undefined,
          extraAmountValue: row.extraAmountValue ?? undefined,
          extraRate: row.extraRate ?? undefined,
          extraRateValue: row.extraRateValue ?? undefined,
          startTime: row.startTime || undefined,
          endTime: row.endTime || undefined,
          hallIds: validHallIds,
          hallRate: row.withHall ? (row.hallRate ?? undefined) || undefined : undefined,
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

      // Keep notes to just the user-entered text — pack summaries were bloating
      // this past the server's 2000-char limit on complex bookings.
      const notes = formData.notes.trim() || undefined;

      // Payment entries are now persisted via the /payments endpoint, so we
      // don't need to duplicate them in internalNotes. Just store the financial
      // snapshot which is compact and always useful for debugging.
      const internalNotesParts = [
        `Final Calc: discountAmt=${normalizedDiscountAmount}, discountPct=${normalizedDiscountPercent}, finalAmt=${normalizedFinalAmount}, totalBill=${totalBillAmount.toFixed(2)}, totalPaid=${totalPayments.toFixed(2)}`,
      ].filter(Boolean);
      const internalNotes = internalNotesParts.join('\n').slice(0, 1990) || undefined;

      const payload = {
        customerId: formData.customerId,
        secondCustomerId: formData.secondCustomerId || undefined,
        referredById: formData.referredById || undefined,
        priority: formData.priority ? Number(formData.priority) : undefined,
        functionName,
        functionType: formData.functionType.trim(),
        functionDate: formData.functionDate,
        functionTime,
        isPencilBooking: formData.isPencilBooking,
        pencilExpiresAt: formData.isPencilBooking && formData.pencilExpiresAt
          ? new Date(formData.pencilExpiresAt + 'T23:59:00').toISOString()
          : null,
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
        // paymentReceivedAmount is derived server-side from actual payment records.
        dueAmount: formData.dueAmount || undefined,
        notes: notes ? notes.slice(0, 1990) : undefined,
        internalNotes,
      };

      let savedBookingId: string;
      if (editingBookingId) {
        await api.updateBooking(editingBookingId, payload);
        savedBookingId = editingBookingId;
      } else {
        const created = await api.createBooking(payload);
        // Server: { success, data: { booking: { id, ... } } } → axios wraps in .data
        savedBookingId = created?.data?.data?.booking?.id || created?.data?.booking?.id || '';
        // Transition the open form to edit mode so a second submit updates rather than creates.
        if (savedBookingId) setEditingBookingId(savedBookingId);
      }

      if (savedBookingId) {
        const { changedPayments, newPayments } = partitionPaymentsForSave(formData.payments);

        await Promise.all([
          ...changedPayments.map((p) =>
            api.updatePayment(savedBookingId, p.id!, {
              amount: parseFloat(p.amount),
              method: p.mode,
              narration: p.narration || undefined,
              paymentDate: p.date,
              reference: p.reference || undefined,
              clearingDate: p.clearingDate || undefined,
            })
          ),
          ...newPayments.map((p) =>
            api.addPayment(savedBookingId, {
              amount: parseFloat(p.amount),
              method: p.mode,
              narration: p.narration || undefined,
              paymentDate: p.date,
              reference: p.reference || undefined,
              clearingDate: p.clearingDate || undefined,
            })
          ),
        ]);

        const refreshResponse = await api.getBooking(savedBookingId);
        const refreshedBooking = refreshResponse.data?.data?.booking;
        if (refreshedBooking) {
          applyBookingToForm(refreshedBooking);
        }
      }

      toast.success(editingBookingId ? 'Booking updated successfully' : 'Booking created successfully');
      if (!opts?.keepOpen) {
        closeBookingForm();
        await loadBookings();
      } else {
        setIsFormDirty(false);
        await loadBookings();
      }
      return savedBookingId;
    } catch (error: any) {
      console.error('[BookingSubmit] error:', error?.response?.data ?? error);
      const validationErrors: Array<{ field: string; message: string }> =
        error?.response?.data?.errors || [];
      const detail = validationErrors.length
        ? validationErrors.map((e) => `${e.field}: ${e.message}`).join('; ')
        : error?.response?.data?.error ||
          (editingBookingId ? 'Failed to update booking' : 'Failed to create booking');
      toast.error(detail);
      // Reset form to the last known server state so partial mutations don't
      // leave the user looking at corrupted local state.
      if (savedFormDataRef.current) {
        setFormData(savedFormDataRef.current);
      }
      return null;
    } finally {
      savingInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await doSaveBooking({ keepOpen: true });
  };

  const handleFinalizeBooking = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Finalize this booking? It will become read-only and a new editable replica will be generated.')) return;

    const bookingId = await doSaveBooking({ keepOpen: true });
    if (!bookingId) return;

    try {
      setSaving(true);
      const res = await api.finalizeBooking(bookingId);
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

  const renderCustomerTypeahead = ({
    field,
    label,
    required = false,
    placeholder,
    wrapperClassName,
    inputClassName,
  }: {
    field: CustomerSearchField;
    label?: string;
    required?: boolean;
    placeholder: string;
    wrapperClassName?: string;
    inputClassName?: string;
  }) => {
    const suggestions = getCustomerSuggestions(field);
    const isActive = activeCustomerSearchField === field;

    return (
      <div className={['relative', wrapperClassName].filter(Boolean).join(' ')}>
        {label ? (
          <label className="label">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        ) : null}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
          <input
            className={['input pl-10', inputClassName].filter(Boolean).join(' ')}
            placeholder={placeholder}
            value={customerSearchInputs[field]}
            required={required}
            autoComplete="off"
            title={customerSearchInputs[field] || undefined}
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
          <div className="absolute z-40 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            {suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--text-4)]">
                No customer found for this search.
              </p>
            ) : (
              suggestions.map((customer) => (
                <button
                  key={`${field}-${customer.id}`}
                  type="button"
                  className="w-full border-b border-[var(--border)] px-3 py-2 text-left hover:bg-[var(--surface-2)] last:border-b-0"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCustomerSuggestion(field, customer)}
                >
                  <p className="text-sm font-medium text-[var(--text-1)]">{customer.name}</p>
                  <p className="text-xs text-[var(--text-2)]">{customer.phone}</p>
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
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Bookings</h1>
          <p className="text-[var(--text-2)] mt-1">
            View booking records and quotation statuses.
          </p>
        </div>
        {canAddBooking && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        )}
      </div>

      {!canViewBooking && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view bookings.
        </div>
      )}

      {canAddBooking && customers.length === 0 && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
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
        isDirty={isFormDirty}
      >
        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)] -mt-2 mb-4">
          <button
            type="button"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeBookingTab === 'details'
                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
            onClick={() => setActiveBookingTab('details')}
          >
            Booking Details
          </button>
          <button
            type="button"
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeBookingTab === 'payments'
                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
            }`}
            onClick={() => setActiveBookingTab('payments')}
          >
            Payments &amp; Party Over
            {formData.payments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-100 dark:bg-primary-900/40 text-[10px] font-bold text-primary-700 dark:text-primary-300">
                {formData.payments.length}
              </span>
            )}
          </button>
        </div>

        <fieldset disabled={isReadOnlyBooking}>
        <form onSubmit={(e) => { e.preventDefault(); if (!isReadOnlyBooking) handleSubmitBooking(e); }} onChange={() => setIsFormDirty(true)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-5">
          <div ref={actionSentinelRef} />
            <div className="flex items-center gap-3 flex-wrap">
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
              {editingBookingId && canExportMenuPdf && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const b = bookings.find((bk) => bk.id === editingBookingId);
                    if (b) openMenuPdfModal(b);
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Menu PDF
                  </span>
                </button>
              )}
            </div>

            {isReadOnlyBooking && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                This booking is completed (party over) and is now read-only.
              </div>
            )}

            {activeBookingTab === 'details' && (<>
            <section className="rounded-2xl border border-[var(--border-2)] p-4">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-[var(--text-1)]">Booking Details</h3>
                {/* Row 1 mobile */}
                <div className="space-y-3 md:hidden">
                  {canAddCustomer && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary text-xs px-2.5 py-1.5"
                        onClick={openQuickCustomerForm}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Customer
                      </button>
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <span className="label block">
                      Primary Customer <span className="text-red-500">*</span>
                    </span>
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
                      className="input bg-[var(--surface-2)] dark:bg-slate-800/30 cursor-not-allowed"
                      type="number"
                      readOnly
                      value={formData.priority}
                      title="Priority is set from the selected customer's profile"
                    />
                    <p className="mt-1 text-xs text-[var(--text-4)]">
                      Auto-set from customer profile
                    </p>
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

                {/* Row 1 desktop: primary | add customer | priority | date */}
                <div className="hidden md:flex md:flex-wrap md:items-end md:gap-3">
                  <div
                    className="min-w-0 shrink-0 space-y-1.5"
                    style={{ width: `calc(${PRIMARY_CUSTOMER_FIELD_CH}ch + 2.5rem)` }}
                  >
                    <span className="label block">
                      Primary Customer <span className="text-red-500">*</span>
                    </span>
                    {renderCustomerTypeahead({
                      field: 'primary',
                      label: '',
                      required: true,
                      placeholder: 'Type customer name or number',
                      inputClassName: 'truncate',
                    })}
                  </div>
                  {canAddCustomer && (
                    <button
                      type="button"
                      className="btn btn-secondary shrink-0 text-xs px-2.5 py-1.5"
                      onClick={openQuickCustomerForm}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Customer
                    </button>
                  )}
                  <div className="w-[4.5rem] shrink-0 space-y-1.5">
                    <label className="label block">Priority</label>
                    <input
                      className="input bg-[var(--surface-2)] dark:bg-slate-800/30 cursor-not-allowed"
                      type="number"
                      readOnly
                      value={formData.priority}
                      title="Priority is set from the selected customer's profile"
                    />
                  </div>
                  <div className="w-[11.5rem] shrink-0 space-y-1.5">
                    <label className="label block">
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

                {/* Row 2 mobile */}
                <div className="space-y-3 md:hidden">
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
                  {renderCustomerTypeahead({
                    field: 'referred',
                    label: 'Referred By',
                    placeholder: 'Type customer name or number',
                  })}
                  {renderCustomerTypeahead({
                    field: 'second',
                    label: 'Second Customer',
                    placeholder: 'Type customer name or number',
                  })}
                </div>

                {/* Row 2 desktop: function type (fit longest option) | referred | second */}
                <div className="hidden md:flex md:items-end md:gap-3">
                  <div
                    className="shrink-0 space-y-1.5"
                    style={{ width: `${LONGEST_FUNCTION_TYPE_OPTION.length + 3}ch` }}
                  >
                    <label className="label block">
                      Function Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input w-full max-w-full"
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
                  <div className="min-w-0 flex-1">
                    {renderCustomerTypeahead({
                      field: 'referred',
                      label: 'Referred By',
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    {renderCustomerTypeahead({
                      field: 'second',
                      label: 'Second Customer',
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                </div>

                {/* Pencil booking toggle */}
                {!isReadOnlyBooking && (
                  <div className="rounded-xl border border-[var(--border-2)] bg-[var(--surface-2)] dark:bg-slate-800/30 p-3 space-y-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-[var(--brand)]"
                        checked={formData.isPencilBooking}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            isPencilBooking: checked,
                            pencilDays: checked ? prev.pencilDays || '3' : '3',
                            pencilExpiresAt: checked
                              ? computePencilExpiry(Number(prev.pencilDays || '3'))
                              : '',
                          }));
                        }}
                      />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                        <PencilLine className="w-4 h-4 text-[var(--text-3)]" />
                        Pencil Booking
                      </span>
                      <span className="text-xs text-[var(--text-4)]">— temporary hall hold</span>
                    </label>
                    {formData.isPencilBooking && (
                      <div className="space-y-2 pl-6">
                        <div className="flex items-end gap-3">
                          <div className="space-y-1">
                            <label className="label text-xs">Hold duration (days) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              className="input w-24"
                              min="1"
                              max="365"
                              value={formData.pencilDays}
                              onChange={(e) => {
                                const days = Math.max(1, Number(e.target.value) || 1);
                                setFormData((prev) => ({
                                  ...prev,
                                  pencilDays: String(days),
                                  pencilExpiresAt: computePencilExpiry(days),
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <label className="label text-xs">Or pick date directly</label>
                            <input
                              type="date"
                              className="input"
                              value={formData.pencilExpiresAt}
                              min={todayIsoDate}
                              onChange={(e) => {
                                const dateVal = e.target.value;
                                const diffMs = new Date(dateVal).getTime() - new Date(todayIsoDate).getTime();
                                const diffDays = Math.max(1, Math.round(diffMs / 86400000));
                                setFormData((prev) => ({
                                  ...prev,
                                  pencilExpiresAt: dateVal,
                                  pencilDays: String(diffDays),
                                }));
                              }}
                              required={formData.isPencilBooking}
                            />
                          </div>
                        </div>
                        {formData.pencilExpiresAt && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <PencilLine className="w-3 h-3" />
                            Hall auto-releases at 11:59 PM on {new Date(formData.pencilExpiresAt + 'T23:59:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {formData.isPencilBooking && isReadOnlyBooking && formData.pencilExpiresAt && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <PencilLine className="w-4 h-4 shrink-0" />
                    Pencil hold — auto-releases on {new Date(formData.pencilExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}

                {/* Hall clash warning banner */}
                {hallClashWarnings.length > 0 && (
                  <div className="col-span-full mt-1 rounded-lg border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-600 shrink-0" aria-hidden>⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          Hall timing clash detected on this date
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-amber-700 dark:text-amber-200">
                          {hallClashWarnings.map((clash) => (
                            <li key={clash.bookingId}>
                              <span className="font-medium">{clash.functionName}</span>
                              {clash.functionType ? ` (${clash.functionType})` : ''}
                              {(clash.startTime && clash.endTime)
                                ? ` · ${clash.startTime}–${clash.endTime}`
                                : clash.functionTime ? ` · ${clash.functionTime}` : ''}
                              {' — '}
                              {clash.clashingHalls.map((h) => h.name).join(', ')}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs text-amber-600">
                          Saving will be blocked if the halls and times overlap.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Pack & Summary Table (desktop) ── */}
            <section className="space-y-3">
              {/* ── Desktop table ── */}
              <div className="hidden xl:block rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Meal</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Banquet</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Hall</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap min-w-[200px]">Time</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Menu</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap min-w-[60px]">PAX</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap min-w-[70px]">Rate/Plate</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap min-w-[70px]">Hall Rate</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(PACK_LABELS) as PackKey[]).map((packKey) => {
                        const row = formData.packs[packKey];
                        const packDiffKey = PACK_LABELS[packKey].toLowerCase();
                        const packDiff = formDiff?.packs[packDiffKey];
                        const menuAdded = packDiff?.addedItemIds.length ?? 0;
                        const menuRemoved = packDiff?.removedItemIds.length ?? 0;
                        const hasMenuDiff = menuAdded > 0 || menuRemoved > 0;
                        const filteredHalls = halls.filter(
                          (hall) => !row.banquetId || hall.banquet?.id === row.banquetId
                        );
                        const validSelectedHallIds = row.hallIds.filter((hallId) =>
                          filteredHalls.some((hall) => hall.id === hallId)
                        );
                        const selectedHallNames = filteredHalls
                          .filter((hall) => validSelectedHallIds.includes(hall.id))
                          .map((hall) => hall.name);
                        const packColorMap: Record<PackKey, string> = {
                          breakfast: '#f97316',
                          lunch: '#22c55e',
                          hiTea: '#64748b',
                          dinner: '#6366f1',
                        };
                        const packBgMap: Record<PackKey, string> = {
                          breakfast: 'bg-orange-50 dark:bg-orange-900/20',
                          lunch: 'bg-green-50 dark:bg-green-900/20',
                          hiTea: 'bg-[var(--surface-2)] dark:bg-slate-800/20',
                          dinner: 'bg-indigo-50 dark:bg-indigo-900/20',
                        };
                        return (
                          <tr
                            key={packKey}
                            className={`border-b border-[var(--border)] ${!row.enabled ? 'opacity-50' : ''} ${packBgMap[packKey]}`}
                            style={{ borderLeft: `3px solid ${packColorMap[packKey]}` }}
                          >
                            {/* Col 1: Meal toggle + Hall/Cat checkboxes */}
                            <td className="px-2 py-2 align-top min-w-[140px]">
                              <div className="flex flex-col gap-1">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <span className="relative inline-flex items-center">
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
                                    <span className="h-5 w-9 rounded-full bg-[var(--surface-3)] transition-colors peer-checked:bg-primary-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-4" />
                                  </span>
                                  <span className="text-xs font-semibold text-[var(--text-1)]">{PACK_LABELS[packKey]}</span>
                                </label>
                                <div className="flex gap-2 pl-0.5">
                                  <label className="inline-flex items-center gap-1 text-xs text-[var(--text-2)] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="h-3 w-3 rounded dark:bg-slate-700 dark:border-slate-600"
                                      checked={row.withHall}
                                      disabled={!row.enabled}
                                      onChange={(e) => {
                                        const withHall = e.target.checked;
                                        if (!withHall && openHallPickerPack === packKey) setOpenHallPickerPack(null);
                                        updatePackRow(packKey, { withHall });
                                      }}
                                    />
                                    Hall
                                  </label>
                                  <label className="inline-flex items-center gap-1 text-xs text-[var(--text-2)] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="h-3 w-3 rounded dark:bg-slate-700 dark:border-slate-600"
                                      checked={row.withCatering}
                                      disabled={!row.enabled}
                                      onChange={(e) => updatePackRow(packKey, { withCatering: e.target.checked })}
                                    />
                                    Cat
                                  </label>
                                </div>
                              </div>
                            </td>
                            {/* Col 2: Banquet */}
                            <td className="px-2 py-2 align-top min-w-[130px]">
                              <select
                                className="input py-1 text-xs w-full"
                                value={row.banquetId}
                                disabled={!row.enabled}
                                onChange={(e) => {
                                  setOpenHallPickerPack((cur) => cur === packKey ? null : cur);
                                  updatePackRow(packKey, { banquetId: e.target.value, hallIds: [] });
                                }}
                              >
                                <option value="">Select…</option>
                                {banquets.map((b) => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                            </td>
                            {/* Col 3: Hall picker */}
                            <td className="px-2 py-2 align-top min-w-[130px]">
                              <div
                                className="relative"
                                ref={openHallPickerPack === packKey ? hallPickerContainerRef : undefined}
                              >
                              <button
                                type="button"
                                className="input py-1 text-xs w-full flex items-center justify-between text-left truncate"
                                disabled={!row.enabled || !row.withHall || !row.banquetId}
                                onClick={(e) => {
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  setHallPickerAnchorRect(rect);
                                  setOpenHallPickerPack((cur) => cur === packKey ? null : packKey);
                                }}
                              >
                                <span className="truncate">
                                  {!row.enabled || !row.withHall
                                    ? '—'
                                    : !row.banquetId
                                      ? 'Pick banquet'
                                      : selectedHallNames.length > 0
                                        ? selectedHallNames.join(', ')
                                        : 'Select halls'}
                                </span>
                              </button>
                              {openHallPickerPack === packKey && hallPickerAnchorRect && typeof document !== 'undefined' && createPortal(
                                <div
                                  ref={hallPickerPortalRef}
                                  style={{
                                    position: 'fixed',
                                    top: hallPickerAnchorRect.bottom + 4,
                                    left: hallPickerAnchorRect.left,
                                    width: Math.max(hallPickerAnchorRect.width, 208),
                                    zIndex: 9999,
                                  }}
                                  className="max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
                                >
                                  {filteredHalls.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-[var(--text-4)]">No halls for this banquet.</p>
                                  ) : (
                                    filteredHalls.map((hall) => {
                                      const checked = row.hallIds.includes(hall.id);
                                      return (
                                        <label key={hall.id} className="flex cursor-pointer items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm text-[var(--text-1)] last:border-b-0 hover:bg-[var(--surface-2)]">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                              const next = checked
                                                ? row.hallIds.filter((id) => id !== hall.id)
                                                : [...row.hallIds, hall.id];
                                              updatePackRow(packKey, { hallIds: next });
                                            }}
                                          />
                                          <span>{hall.name}</span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>,
                                document.body
                              )}
                              </div>
                            </td>
                            {/* Col 4: Time */}
                            <td className="px-2 py-2 align-top min-w-[200px]">
                              <div className="flex gap-0.5 items-center">
                                <input
                                  className="input py-1 text-xs w-[90px]"
                                  type="time"
                                  step="900"
                                  value={row.startTime}
                                  disabled={!row.enabled}
                                  onChange={(e) => updatePackRow(packKey, { startTime: e.target.value })}
                                />
                                <span className="text-xs text-[var(--text-4)]">–</span>
                                <input
                                  className="input py-1 text-xs w-[90px]"
                                  type="time"
                                  step="900"
                                  value={row.endTime}
                                  disabled={!row.enabled}
                                  onChange={(e) => updatePackRow(packKey, { endTime: e.target.value })}
                                />
                              </div>
                            </td>
                            {/* Col 5: Menu */}
                            <td className="px-2 py-2 align-top min-w-[100px]">
                              <button
                                type="button"
                                className={`btn py-1 text-xs w-full ${hasMenuDiff ? 'btn-warning' : 'btn-secondary'}`}
                                onClick={() => { setMenuEditorPack(packKey); setMenuItemSearch(''); }}
                              >
                                {row.menuItemIds.length > 0
                                  ? `${row.menuPoints} pts`
                                  : 'Set menu…'}
                                {hasMenuDiff && (
                                  <span className="ml-1">
                                    {menuAdded > 0 && <span className="text-green-700 dark:text-green-200">+{menuAdded}</span>}
                                    {menuAdded > 0 && menuRemoved > 0 && <span>/</span>}
                                    {menuRemoved > 0 && <span className="text-red-700 dark:text-red-200">−{menuRemoved}</span>}
                                  </span>
                                )}
                              </button>
                            </td>
                            {/* Col 6: PAX */}
                            <td className="px-2 py-2 align-top min-w-[60px]">
                              <input
                                className={`input py-1 text-xs w-full${packDiff?.paxChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.pax}
                                disabled={!row.enabled || !row.withCatering}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updatePackRow(packKey, { pax: e.target.value })}
                              />
                              {packDiff?.paxChange && (
                                <p className="mt-0.5 text-xs text-amber-600">was {packDiff.paxChange.from}</p>
                              )}
                            </td>
                            {/* Col 7: Rate/Plate */}
                            <td className="px-2 py-2 align-top min-w-[70px]">
                              <input
                                className={`input py-1 text-xs w-full${packDiff?.ratePerPlateChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.ratePerPlate}
                                disabled={!row.enabled || !row.withCatering}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updatePackRow(packKey, { ratePerPlate: e.target.value })}
                              />
                              {packDiff?.ratePerPlateChange && (
                                <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.ratePerPlateChange.from.toLocaleString('en-IN')}</p>
                              )}
                            </td>
                            {/* Col 8: Hall Rate */}
                            <td className="px-2 py-2 align-top min-w-[70px]">
                              <input
                                className={`input py-1 text-xs w-full${packDiff?.hallRateChange ? ' ring-2 ring-amber-300' : ''}`}
                                type="number"
                                min={0}
                                value={row.hallRate}
                                disabled={!row.enabled || !row.withHall}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updatePackRow(packKey, { hallRate: e.target.value })}
                              />
                              {packDiff?.hallRateChange && (
                                <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.hallRateChange.from.toLocaleString('en-IN')}</p>
                              )}
                            </td>
                            {/* Col 9: Amount (editable — back-calculates ratePerPlate on blur) */}
                            <td className="px-2 py-2 align-top min-w-[100px]">
                              <input
                                className="input py-1 text-xs w-full text-right"
                                type="number"
                                min={0}
                                value={
                                  focusedPackAmount?.key === packKey
                                    ? focusedPackAmount.value
                                    : formatComputedAmount(packRowAmount(row))
                                }
                                disabled={!row.enabled}
                                onFocus={(e) => { e.target.select(); setFocusedPackAmount({ key: packKey, value: e.target.value }); }}
                                onChange={(e) => setFocusedPackAmount({ key: packKey, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setFocusedPackAmount(null);
                                    const enteredAmount = parseFloat((e.target as HTMLInputElement).value) || 0;
                                    const hr = row.withHall ? toNonNegativeNumber(row.hallRate) : 0;
                                    const pax = row.withCatering ? toNonNegativeNumber(row.pax) : 0;
                                    if (pax > 0) {
                                      const newRate = Math.round(((enteredAmount - hr) / pax) * 100) / 100;
                                      updatePackRow(packKey, { ratePerPlate: String(Math.max(0, newRate)) });
                                    }
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                onBlur={(e) => {
                                  setFocusedPackAmount(null);
                                  const enteredAmount = parseFloat(e.target.value) || 0;
                                  const hallRate = row.withHall ? toNonNegativeNumber(row.hallRate) : 0;
                                  const pax = row.withCatering ? toNonNegativeNumber(row.pax) : 0;
                                  if (pax > 0) {
                                    const newRate = Math.round(((enteredAmount - hallRate) / pax) * 100) / 100;
                                    updatePackRow(packKey, { ratePerPlate: String(Math.max(0, newRate)) });
                                  }
                                }}
                                title="Edit to override total; Rate/Plate is back-calculated"
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {/* ── Summary rows ── */}
                      <tr>
                        <td colSpan={9} className="border-t-2 border-[var(--border)] p-0" />
                      </tr>

                      {/* Total row */}
                      <tr className="bg-[var(--surface)]">
                        <td colSpan={7} />
                        <td className="px-2 py-2 text-right text-xs font-bold text-[var(--text-1)] whitespace-nowrap">Total</td>
                        <td className="px-2 py-2 text-right text-sm font-bold text-[var(--text-1)]">
                          ₹{billingTotals.preDiscountTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* Discount row */}
                      <tr className="bg-red-50 dark:bg-red-900/20">
                        <td colSpan={5} />
                        <td className="px-2 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-[var(--text-3)] whitespace-nowrap">Disc %</span>
                            <input
                              className="input py-1 text-xs w-16 text-right dark:bg-slate-800/40"
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={formData.finalDiscountPercent}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                setAmountSyncMode('discountPercent');
                                setDiscountManuallySet(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  ...normalizeAmountSnapshot('discountPercent', e.target.value, totalBillBase),
                                }));
                              }}
                            />
                          </div>
                        </td>
                        <td colSpan={1} />
                        <td className="px-2 py-1.5 text-right text-xs font-semibold text-red-700 dark:text-red-200 whitespace-nowrap">Discount</td>
                        <td className="px-2 py-1.5">
                          <input
                            className="input py-1 text-xs w-full text-right dark:bg-slate-800/40"
                            type="number"
                            min={0}
                            step="0.01"
                            value={formData.finalDiscountAmount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              setAmountSyncMode('discountAmount');
                              setDiscountManuallySet(true);
                              setFormData((prev) => ({
                                ...prev,
                                ...normalizeAmountSnapshot('discountAmount', e.target.value, totalBillBase),
                              }));
                            }}
                          />
                        </td>
                      </tr>

                      {/* Net Amount row */}
                      <tr className="bg-teal-50 dark:bg-teal-900/20">
                        <td colSpan={7} />
                        <td className="px-2 py-1.5 text-right text-xs font-bold text-teal-700 dark:text-teal-200 whitespace-nowrap">Net Amount</td>
                        <td className="px-2 py-1.5">
                          <input
                            className="input py-1 text-xs w-full text-right font-semibold text-teal-700 dark:text-teal-200 dark:bg-slate-800/40"
                            type="number"
                            min={0}
                            value={netAmountDraft !== null ? netAmountDraft : formData.finalAmount}
                            onFocus={(e) => { e.target.select(); setNetAmountDraft(e.target.value); }}
                            onChange={(e) => setNetAmountDraft(e.target.value)}
                            onBlur={(e) => {
                              setNetAmountDraft(null);
                              setAmountSyncMode('finalAmount');
                              setDiscountManuallySet(true);
                              setFormData((prev) => ({
                                ...prev,
                                ...normalizeAmountSnapshot('finalAmount', e.target.value, totalBillBase),
                              }));
                            }}
                            aria-label="Net Amount"
                            title="Net Amount (after discount)"
                          />
                        </td>
                      </tr>

                      {/* Extra Items header row */}
                      <tr className="bg-[var(--surface-2)] border-t border-[var(--border)]">
                        <td colSpan={8} className="px-3 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--text-2)]">Extra Items</span>
                            <button
                              type="button"
                              className="inline-flex h-6 items-center gap-1 rounded-full border border-primary-600 px-2 text-xs font-medium text-primary-700 hover:bg-primary-50"
                              onClick={() => {
                                setIsFormDirty(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  additionalRequirements: [
                                    ...prev.additionalRequirements,
                                    { description: '', amount: '' },
                                  ],
                                }));
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </button>
                          </div>
                        </td>
                        <td />
                      </tr>

                      {/* Extra item rows — description + amount on the left, no individual amount in right col */}
                      {formData.additionalRequirements.map((item, index) => (
                        <tr key={`req-${index}`} className="bg-[var(--surface)] border-t border-[var(--border)]">
                          <td colSpan={4} />
                          <td colSpan={4} className="px-2 py-1.5">
                            <div className="flex gap-2 items-center">
                              <input
                                className="input py-1 text-xs flex-1"
                                value={item.description}
                                placeholder="Description"
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
                              />
                              <input
                                className="input py-1 text-xs w-24 text-right"
                                type="number"
                                min={0}
                                value={item.amount}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
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
                              />
                              <button
                                type="button"
                                className="text-xs text-red-500 hover:text-red-700 dark:text-red-200 whitespace-nowrap"
                                onClick={() => {
                                  setIsFormDirty(true);
                                  setFormData((prev) => ({
                                    ...prev,
                                    additionalRequirements: prev.additionalRequirements.filter(
                                      (_, entryIndex) => entryIndex !== index
                                    ),
                                  }));
                                }}
                              >✕</button>
                            </div>
                          </td>
                          <td />
                        </tr>
                      ))}
                      {/* Extras total row — label on left, total in amount column */}
                      {formData.additionalRequirements.length > 0 && (
                        <tr className="bg-[var(--surface)] border-t border-[var(--border)]">
                          <td colSpan={4} />
                          <td colSpan={4} className="px-2 py-1.5 text-right text-xs font-semibold text-[var(--text-2)]">
                            Extras Total
                          </td>
                          <td className="px-2 py-1.5 text-right text-xs font-bold text-[var(--text-1)]">
                            ₹{billingTotals.extrasSubtotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* Grand Total row */}
                      {(() => {
                        // Model A: finalAmount already includes everything (halls+packs+extras−discount).
                        const grandTotal = parseFloat(formData.finalAmount || '0') || totalBillBase;
                        return (
                          <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)]">
                            <td colSpan={7} />
                            <td className="px-2 py-2 text-right text-xs font-extrabold text-[var(--text-1)] whitespace-nowrap">Grand Total</td>
                            <td className="px-2 py-2 text-right text-base font-extrabold text-[var(--text-1)]">
                              ₹{grandTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* Actions row */}
                      <tr className="border-t border-[var(--border)] bg-[var(--surface)]">
                        <td colSpan={6} className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
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
                          </div>
                        </td>
                        <td colSpan={2} />
                        <td className="px-3 py-2 text-right">
                          {!isReadOnlyBooking && (
                            <button
                              type="button"
                              className="btn bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap"
                              onClick={handleFinalizeBooking}
                              disabled={saving}
                            >
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Finalize Version
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
              </div>

              {/* ── Mobile cards (xl:hidden) ── */}
              <div className="xl:hidden space-y-3">
                {(Object.keys(PACK_LABELS) as PackKey[]).map((packKey) => {
                  const row = formData.packs[packKey];
                  const packDiffKey = PACK_LABELS[packKey].toLowerCase();
                  const packDiff = formDiff?.packs[packDiffKey];
                  const menuAdded = packDiff?.addedItemIds.length ?? 0;
                  const menuRemoved = packDiff?.removedItemIds.length ?? 0;
                  const hasMenuDiff = menuAdded > 0 || menuRemoved > 0;
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
                    <div key={packKey} className={`rounded-2xl border p-3 space-y-3 ${PACK_ROW_STYLES[packKey]}`}>
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <span className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={row.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                if (!enabled && openHallPickerPack === packKey) setOpenHallPickerPack(null);
                                updatePackRow(packKey, { enabled });
                              }}
                            />
                            <span className="h-6 w-11 rounded-full bg-[var(--surface-3)] transition-colors peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-200 peer-focus:ring-offset-1 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
                          </span>
                          <span className="text-base font-semibold text-[var(--text-1)]">{PACK_LABELS[packKey]}</span>
                        </label>
                        <div className="flex gap-3">
                          <label className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                            <input type="checkbox" className="h-4 w-4 rounded" checked={row.withHall} disabled={!row.enabled}
                              onChange={(e) => { const withHall = e.target.checked; if (!withHall && openHallPickerPack === packKey) setOpenHallPickerPack(null); updatePackRow(packKey, { withHall }); }} />
                            Hall
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                            <input type="checkbox" className="h-4 w-4 rounded" checked={row.withCatering} disabled={!row.enabled}
                              onChange={(e) => updatePackRow(packKey, { withCatering: e.target.checked })} />
                            Catering
                          </label>
                        </div>
                      </div>

                      {row.enabled && (
                        <div className="grid grid-cols-2 gap-3">
                          {row.withHall && (
                            <div>
                              <label className="label text-xs">Banquet</label>
                              <select className="input" value={row.banquetId}
                                onChange={(e) => { setOpenHallPickerPack((cur) => cur === packKey ? null : cur); updatePackRow(packKey, { banquetId: e.target.value, hallIds: [] }); }}>
                                <option value="">Select Banquet</option>
                                {banquets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                            </div>
                          )}
                          {row.withHall && (
                            <div className="relative" ref={openHallPickerPack === packKey ? hallPickerContainerRef : undefined}>
                              <label className="label text-xs">Hall</label>
                              <button type="button" className="input flex w-full items-center justify-between text-left" disabled={!row.banquetId}
                                onClick={() => setOpenHallPickerPack((cur) => cur === packKey ? null : packKey)}>
                                <span className="truncate">{!row.banquetId ? 'Select Banquet First' : selectedHallNames.length > 0 ? selectedHallNames.join(', ') : 'Select Halls *'}</span>
                              </button>
                              {openHallPickerPack === packKey && (
                                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                                  {filteredHalls.length === 0 ? <p className="px-3 py-2 text-xs text-[var(--text-4)]">No halls for this banquet.</p> : filteredHalls.map((hall) => {
                                    const checked = row.hallIds.includes(hall.id);
                                    return (
                                      <label key={hall.id} className="flex cursor-pointer items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm text-[var(--text-1)] last:border-b-0 hover:bg-[var(--surface-2)]">
                                        <input type="checkbox" checked={checked} onChange={() => { const next = checked ? row.hallIds.filter((id) => id !== hall.id) : [...row.hallIds, hall.id]; updatePackRow(packKey, { hallIds: next }); }} />
                                        <span>{hall.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <label className="label text-xs">Start Time</label>
                            <input className="input" type="time" step="900" value={row.startTime} onChange={(e) => updatePackRow(packKey, { startTime: e.target.value })} />
                          </div>
                          <div>
                            <label className="label text-xs">End Time</label>
                            <input className="input" type="time" step="900" value={row.endTime} onChange={(e) => updatePackRow(packKey, { endTime: e.target.value })} />
                          </div>
                          <div>
                            <label className="label text-xs">Menu</label>
                            <button type="button" className={`btn w-full ${hasMenuDiff ? 'btn-warning' : 'btn-secondary'}`}
                              onClick={() => { setMenuEditorPack(packKey); setMenuItemSearch(''); }}>
                              {Number(row.menuPoints) > 0 ? `${row.menuPoints} pts` : 'Set menu…'}
                              {hasMenuDiff && <span className="ml-1 text-xs">{menuAdded > 0 && <span className="text-green-700 dark:text-green-200">+{menuAdded}</span>}{menuAdded > 0 && menuRemoved > 0 && '/'}{menuRemoved > 0 && <span className="text-red-700 dark:text-red-200">−{menuRemoved}</span>}</span>}
                            </button>
                          </div>
                          <div>
                            <label className="label text-xs">PAX</label>
                            <input className={`input${packDiff?.paxChange ? ' ring-2 ring-amber-300' : ''}`} type="number" min={0} value={row.pax}
                              disabled={!row.withCatering} onChange={(e) => updatePackRow(packKey, { pax: e.target.value })} />
                            {packDiff?.paxChange && <p className="mt-0.5 text-xs text-amber-600">was {packDiff.paxChange.from}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">Rate/Plate</label>
                            <input className={`input${packDiff?.ratePerPlateChange ? ' ring-2 ring-amber-300' : ''}`} type="number" min={0} value={row.ratePerPlate}
                              disabled={!row.withCatering} onChange={(e) => updatePackRow(packKey, { ratePerPlate: e.target.value })} />
                            {packDiff?.ratePerPlateChange && <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.ratePerPlateChange.from.toLocaleString('en-IN')}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">Hall Rate</label>
                            <input className={`input${packDiff?.hallRateChange ? ' ring-2 ring-amber-300' : ''}`} type="number" min={0} value={row.hallRate}
                              disabled={!row.withHall} onChange={(e) => updatePackRow(packKey, { hallRate: e.target.value })} />
                            {packDiff?.hallRateChange && <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.hallRateChange.from.toLocaleString('en-IN')}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">Amount</label>
                            <input className="input bg-[var(--surface-2)] text-right" type="number" min={0}
                              value={formatComputedAmount(packRowAmount(row))} readOnly title="Catering + hall rate (once per meal)" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[var(--text-1)]">Amount Summary</h3>
                    <button type="button"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary-600 px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                      onClick={() => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: [...prev.additionalRequirements, { description: '', amount: '' }] })); }}>
                      <Plus className="h-3.5 w-3.5" /> Add Extra
                    </button>
                  </div>
                  <div className="space-y-2">
                    {enabledPackAmountRows.map((entry) => (
                      <div key={entry.key} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-2)]">{entry.label}</span>
                        <span className="text-sm font-medium text-[var(--text-1)]">₹{formatComputedAmount(entry.amount)}</span>
                      </div>
                    ))}
                    {formData.additionalRequirements.map((item, index) => (
                      <div key={`mob-req-${index}`} className="grid grid-cols-[1fr,120px,auto] gap-2 items-center">
                        <input className="input" value={item.description} placeholder="Extra item" onChange={(e) => setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.map((r, i) => i === index ? { ...r, description: e.target.value } : r) }))} />
                        <input className="input text-right" type="number" min={0} value={item.amount} placeholder="0" onChange={(e) => setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.map((r, i) => i === index ? { ...r, amount: e.target.value } : r) }))} />
                        <button type="button" className="text-red-500 text-xs" onClick={() => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.filter((_, i) => i !== index) })); }}>✕</button>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text-1)]">Total</span>
                        <span className="text-sm font-semibold text-[var(--text-1)]">₹{billingTotals.preDiscountTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="label text-xs">Discount %</label>
                          <input className="input text-right" type="number" min={0} max={100} step="0.01" value={formData.finalDiscountPercent}
                            onChange={(e) => { setAmountSyncMode('discountPercent'); setDiscountManuallySet(true); setFormData((prev) => ({ ...prev, ...normalizeAmountSnapshot('discountPercent', e.target.value, totalBillBase) })); }} />
                        </div>
                        <div>
                          <label className="label text-xs">Discount ₹</label>
                          <input className="input text-right" type="number" min={0} step="0.01" value={formData.finalDiscountAmount}
                            onChange={(e) => { setAmountSyncMode('discountAmount'); setDiscountManuallySet(true); setFormData((prev) => ({ ...prev, ...normalizeAmountSnapshot('discountAmount', e.target.value, totalBillBase) })); }} />
                        </div>
                        <div>
                          <label className="label text-xs">Net Amount</label>
                          <input className="input text-right font-semibold text-teal-700 dark:text-teal-200" type="number" min={0} value={formData.finalAmount}
                            onChange={(e) => { setAmountSyncMode('finalAmount'); setDiscountManuallySet(true); setFormData((prev) => ({ ...prev, ...normalizeAmountSnapshot('finalAmount', e.target.value, totalBillBase) })); }}
                            aria-label="Net Amount" />
                        </div>
                      </div>
                      {(() => {
                        // Model A: finalAmount already includes everything (halls+packs+extras−discount).
                        const grandTotal = parseFloat(formData.finalAmount || '0') || totalBillBase;
                        return (
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                            <span className="text-base font-extrabold text-[var(--text-1)]">Grand Total</span>
                            <span className="text-base font-extrabold text-[var(--text-1)]">₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })()}
                    </div>
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

            <section className="rounded-2xl border border-[var(--border-2)] bg-[var(--surface-2)] p-4">
              <h3 className="text-lg font-semibold text-[var(--text-1)] mb-2">Terms & Conditions</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-2)]">
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
            </>)}

            {activeBookingTab === 'payments' && (
              <div className="space-y-6">
                <BookingPaymentsLedger
                  payments={formData.payments}
                  isReadOnly={isReadOnlyBooking}
                  advanceReceived={activeBookingObj?.advanceReceived ?? undefined}
                  onAdd={(payment) =>
                    setFormData((prev) => ({ ...prev, payments: [...prev.payments, payment] }))
                  }
                  onUpdate={(index, patch) =>
                    setFormData((prev) => ({
                      ...prev,
                      payments: prev.payments.map((p, i) => (i === index ? { ...p, ...patch } : p)),
                    }))
                  }
                  onRemove={(index) =>
                    setFormData((prev) => ({
                      ...prev,
                      payments: prev.payments.filter((_, i) => i !== index),
                    }))
                  }
                />

                <BookingFinancialSummary
                  extraBaseAmount={totalHallAmount}
                  packs={
                    (Object.entries(formData.packs) as Array<[string, typeof formData.packs[keyof typeof formData.packs]]>)
                      .filter(([, p]) => p.enabled)
                      .map(([, p]) => ({
                        ratePerPlate: parseFloat(p.ratePerPlate || '0') || 0,
                        packCount: parseInt(p.pax || '0') || 0,
                      }))
                  }
                  payments={formData.payments}
                  functionDate={formData.functionDate}
                  discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
                  isPartyOver={activeBookingObj?.status === 'completed'}
                  advanceReceived={activeBookingObj?.advanceReceived ?? undefined}
                  totalBilledAmount={
                    activeBookingObj?.status === 'completed' && activeBookingObj?.packs?.length > 0
                      ? activeBookingObj.packs.reduce((sum: number, pack: any) => {
                          const discPct = activeBookingObj.discountPercentageValue ?? activeBookingObj.discountPercentage ?? 0;
                          const dr = (pack.ratePerPlate ?? 0) * (1 - discPct / 100);
                          const billedP = Math.max(pack.packCount ?? 0, (pack.packCount ?? 0) + (pack.extraPlate ?? 0));
                          return sum + dr * billedP;
                        }, 0)
                      : undefined
                  }
                  settlementTotalAmount={activeBookingObj?.settlementTotalAmount ?? undefined}
                  settlementDiscountAmount={activeBookingObj?.settlementDiscountAmount ?? undefined}
                />

                <BookingPartyOverForm
                  booking={activeBookingObj}
                  functionDate={formData.functionDate}
                  discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
                  isPartyOverSubmitted={activeBookingObj?.status === 'completed'}
                  saving={saving}
                  onSubmit={async (payload) => {
                    if (!editingBookingId) return;
                    try {
                      setSaving(true);
                      const response = await api.partyOverBooking(editingBookingId, payload);
                      toast.success('Party finalized permanently!');
                      await loadBookings();
                      if (response.data?.data?.newBookingId) {
                        await openEditBooking(response.data.data.newBookingId);
                      } else {
                        closeBookingForm();
                      }
                    } catch (error: any) {
                      toast.error(error?.response?.data?.error || 'Failed to submit party over');
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>
            )}

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
            </div>

            {!isReadOnlyBooking && (
              <div
                className="form-actions"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  background: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                  padding: '12px 16px',
                  marginTop: 12,
                  zIndex: 20,
                  display: showStickyActions ? 'flex' : 'none',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBookingForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <span className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Submit'}
                  </span>
                </button>
              </div>
            )}
          </form>

          {historicalVersions.length > 0 && (
            <div className="mt-8 space-y-6 border-t border-[var(--border)] pt-8">
              <h2 className="text-xl font-bold text-[var(--text-1)]">Finalized Version History</h2>
              <p className="text-sm text-[var(--text-4)] -mt-3">
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
                const histTotalPackAmount = historyPacks.reduce(
                  (sum: number, pack: any) => sum + computePackRowAmountFromApiPack(pack),
                  0
                );
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
                  <div key={hist.id} className="rounded-xl border-2 border-[var(--border-2)] bg-[var(--surface)] shadow-sm overflow-hidden">
                    {/* ── Version header ── */}
                    <div className="flex items-center justify-between gap-3 bg-[var(--surface-2)] px-5 py-3 border-b border-[var(--border)]">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-1)]">
                          Version {hist.versionNumber}
                          <span className="ml-2 inline-flex items-center rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]">
                            {hist.status}
                          </span>
                        </p>
                        <p className="text-xs text-[var(--text-4)] mt-0.5">
                          Finalized by <strong>{finalizedBy}</strong> on {formatDateTimeLabel(finalizedAt)}
                        </p>
                      </div>
                      <Lock className="w-4 h-4 text-[var(--text-4)] flex-shrink-0" />
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
                        const baseStyle = isNum
                          ? {
                              background: '#2d1a00',
                              color: '#fcd34d',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                            }
                          : {
                              background: 'var(--surface)',
                              color: 'var(--text-2)',
                              border: '1px solid var(--border)',
                            };
                        return (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                            style={baseStyle}
                          >
                            <span style={{ fontWeight: 600, opacity: 0.8 }}>{label}:</span>
                            <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                              {prefix}
                              {typeof from === 'number' ? from.toLocaleString('en-IN') : from}
                            </span>
                            <span style={{ opacity: 0.7 }}>→</span>
                            <span className={`font-semibold ${up ? 'text-green-200' : down ? 'text-red-200' : ''}`}>
                              {prefix}{typeof to === 'number' ? to.toLocaleString('en-IN') : to}
                            </span>
                            {isNum && numDelta !== 0 && (
                              <span className={`font-bold ${up ? 'text-green-200' : 'text-red-200'}`}>
                                {up ? '▲' : '▼'}
                                {Math.abs(numDelta).toLocaleString('en-IN')}
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
                          <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-500/10 p-3 space-y-2">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-200 uppercase tracking-wide">
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
                                <DiffPill label="Net Amount" prefix="₹" from={thisDiff.finalAmountChange.from} to={thisDiff.finalAmountChange.to} isNum />
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
                                    <span
                                      key={`add-${id}`}
                                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                      style={{
                                        background: '#052e16',
                                        color: '#86efac',
                                        border: '1px solid rgba(34, 197, 94, 0.4)',
                                      }}
                                    >
                                      + {allMenuItemsForDiff.get(id) || id}
                                    </span>
                                  ))}
                                  {pd.removedItemIds.map((id) => (
                                    <span
                                      key={`rem-${id}`}
                                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                      style={{
                                        background: '#2d0a0a',
                                        color: '#fca5a5',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                      }}
                                    >
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
                        <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Packs</h4>
                        {historyPacks.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <FileText size={20} />
                            </div>
                            <p className="empty-state-title">No packs recorded</p>
                            <p className="empty-state-desc">No menu packs were saved in this version.</p>
                          </div>
                        ) : (
                          historyPacks.map((pack: any) => {
                            const hallRate = Number(pack?.hallRateValue ?? pack?.hallRate ?? 0);
                            const ratePerPlate = Number(pack?.ratePerPlate || 0);
                            const pax = Number(pack?.packCount ?? pack?.noOfPack ?? 0);
                            const extraPlate = Number(pack?.extraPlate || 0);
                            const computedAmount = computePackRowAmountFromApiPack(pack);
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
                                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3"
                              >
                                {/* Pack header row */}
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-sm font-bold text-[var(--text-1)]">
                                    {pack.packName}
                                    {pack.timeSlot ? ` (${pack.timeSlot})` : ''}
                                  </span>
                                  {pack.withHall !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withHall ? 'bg-blue-100 text-blue-700 dark:text-blue-200' : 'bg-[var(--surface-3)] text-[var(--text-4)]'}`}>
                                      Hall {pack.withHall ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {pack.withCatering !== undefined && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pack.withCatering ? 'bg-green-100 text-green-700 dark:text-green-200' : 'bg-[var(--surface-3)] text-[var(--text-4)]'}`}>
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
                                      className="input font-semibold text-blue-700 dark:text-blue-200"
                                      value={`₹${computedAmount.toLocaleString('en-IN')}`}
                                      readOnly
                                    />
                                  </div>
                                </div>

                                {/* Hall names */}
                                {hallNames.length > 0 && (
                                  <p className="text-xs text-[var(--text-2)]">
                                    <span className="font-medium">Halls: </span>
                                    {hallNames.join(', ')}
                                  </p>
                                )}

                                {/* Menu items */}
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-2)] mb-1">Menu Items</p>
                                  {menuItems.length === 0 ? (
                                    <span className="text-xs text-[var(--text-4)]">No menu items saved.</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {menuItems.map((entry: any) => (
                                        <span
                                          key={`${pack.id}-${entry.itemId || entry.item?.id}`}
                                          className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-2)]"
                                        >
                                          {entry?.item?.itemType?.name
                                            ? <><span className="text-[var(--text-4)] mr-1">{entry.item.itemType.name}:</span></>
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
                          <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Additional Requirements</h4>
                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <div className="grid grid-cols-[1fr,auto] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                              <div>Description</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histAdditional.map((item: any, idx: number) => (
                              <div key={`hist-add-${hist.id}-${idx}`} className="grid grid-cols-[1fr,auto] px-3 py-2 text-sm border-t border-[var(--border)] bg-[var(--surface)]">
                                <span className="text-[var(--text-1)]">{item?.description || '-'}</span>
                                <span className="text-right font-medium text-[var(--text-1)]">
                                  ₹{Number(item?.charges ?? item?.amount ?? 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                            <div className="grid grid-cols-[1fr,auto] px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">
                              <span>Additional Total</span>
                              <span className="text-right">₹{histTotalAdditional.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Payments ── */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1">Payments</h4>
                        {histPayments.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px 12px' }}>
                            <div className="empty-state-icon">
                              <FileText size={20} />
                            </div>
                            <p className="empty-state-title">No payments recorded</p>
                            <p className="empty-state-desc">Payments will appear here once logged.</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <div className="hidden md:grid md:grid-cols-5 bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-2)]">
                              <div>Mode</div>
                              <div>Narration</div>
                              <div>Date</div>
                              <div>Received By</div>
                              <div className="text-right">Amount</div>
                            </div>
                            {histPayments.map((payment: any, idx: number) => (
                              <div key={`hist-pay-${hist.id}-${idx}`} className="grid grid-cols-2 md:grid-cols-5 gap-1 px-3 py-2 text-sm border-t border-[var(--border)] bg-[var(--surface)]">
                                <span className="text-[var(--text-1)] font-medium">{payment?.method || payment?.paymentMethod || payment?.mode || '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.narration || '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.paymentDate ? formatDateDDMMYYYY(payment.paymentDate.slice(0, 10)) : payment?.date ? formatDateDDMMYYYY(payment.date) : '-'}</span>
                                <span className="text-[var(--text-2)]">{payment?.receiver?.name || payment?.receivedBy || '-'}</span>
                                <span className="text-right font-semibold text-[var(--text-1)]">₹{Number(payment?.amount ?? payment?.amountValue ?? 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">
                              <span>Total Payments</span>
                              <span>₹{histTotalPayments.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Amount Summary ── */}
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-[var(--text-1)] mb-3">Amount Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Total Bill</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histTotalBill.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Discount ({histDiscountPercent.toFixed(2)}%)</span>
                            <span className="font-semibold text-red-700 dark:text-red-200">−₹{histDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Net Amount</span>
                            <span className="font-bold text-green-800 dark:text-green-200 text-base">₹{histFinalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Advance Required</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histAdvanceRequired.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Due Amount</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histDueAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-4)] block">Payments Received</span>
                            <span className="font-semibold text-[var(--text-1)]">₹{histTotalPayments.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Notes ── */}
                      {histNotes && (
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--text-1)] border-b border-[var(--border)] pb-1 mb-2">Notes</h4>
                          <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 p-3">{histNotes}</p>
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
            <h3 className="text-lg font-semibold text-[var(--text-1)]">Personal Details</h3>
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
                <p className="mt-1 text-xs text-[var(--text-4)]">
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
                <p className="mt-1 text-xs text-[var(--text-4)]">
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
                <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)] pb-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border-2)] text-primary-600 focus:ring-primary-500"
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
                  <p className="mt-1 text-xs text-[var(--text-4)]">
                    Must be exactly {inlineWhatsappPhoneDigits} digits.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-1)]">Address</h3>
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
                {inlineCustomerFormData.country.trim().toLowerCase() === 'india' && (
                  <p className="mt-1 text-xs text-[var(--text-4)]">
                    {inlineCustomerPincodeLookupLoading
                      ? 'Looking up city and state...'
                      : 'Enter a 6-digit Indian PIN code to auto-fill city and state.'}
                  </p>
                )}
                {inlineCustomerPincodeLookupError && (
                  <p className="mt-1 text-xs text-red-600">{inlineCustomerPincodeLookupError}</p>
                )}
              </div>
              <div className="md:col-span-4">
                <label className="label">State</label>
                {inlineCustomerFormData.country.trim().toLowerCase() === 'india' ? (
                  <select
                    value={inlineCustomerFormData.state}
                    onChange={(e) =>
                      setInlineCustomerFormData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="input"
                  >
                    <option value="">Select state</option>
                    {INDIA_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={inlineCustomerFormData.state}
                    onChange={(e) =>
                      setInlineCustomerFormData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="input"
                    placeholder="State"
                  />
                )}
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
            <h3 className="text-lg font-semibold text-[var(--text-1)]">Social Links</h3>
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
            <h3 className="text-lg font-semibold text-[var(--text-1)]">Other Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">Referred By</label>
                <Combobox
                  value={inlineCustomerFormData.referredById}
                  onChange={(val) =>
                    setInlineCustomerFormData((prev) => ({
                      ...prev,
                      referredById: val,
                    }))
                  }
                  options={customerReferrerOptions.map((customer) => ({
                    value: customer.id,
                    label: formatCustomerLabel(customer),
                    secondary: customer.phone,
                    searchText: customerSearchText(customer),
                  }))}
                  placeholder="Search name or phone"
                  searchPlaceholder="Name or phone number"
                />
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
                <div className="h-11 flex items-center gap-1 rounded-xl border border-[var(--border)] px-3">
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
                          className={`w-5 h-5 ${active ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-4)]'
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
                    className="ml-2 text-xs font-medium text-[var(--text-4)] hover:text-[var(--text-2)]"
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
                onChange={(e) => {
                  void importTemplateToPack(menuEditorPack, e.target.value);
                }}
              >
                <option value="">Custom (no template)</option>
                {templateMenus.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--text-4)]">
                Selecting a template replaces the current menu with all template items. You will be
                asked to confirm if items are already selected.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex gap-2 mb-3">
                  <input
                    className="input flex-1"
                    placeholder="Search items..."
                    value={menuItemSearch}
                    onChange={(e) => setMenuItemSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex items-center gap-1 shrink-0"
                    onClick={() => {
                      setQuickItemForm({ name: '', itemTypeId: itemTypes[0]?.id || '', points: '' });
                      setShowQuickAddItem(true);
                    }}
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>
                <div
                  className="max-h-[360px] overflow-y-auto rounded-lg border border-[var(--border)]"
                  style={{ contain: 'content', overscrollBehavior: 'contain' }}
                >
                  {groupedMenuItems.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px 12px' }}>
                      <div className="empty-state-icon">
                        <Search size={20} />
                      </div>
                      <p className="empty-state-title">No matching items</p>
                      <p className="empty-state-desc">Try another keyword.</p>
                    </div>
                  ) : (
                    groupedMenuItems.map(([group, grouped]) => (
                      <div key={group}>
                        <div className="px-3 py-2 text-sm font-semibold text-[var(--text-1)] bg-primary-50 dark:bg-primary-900/40 border-b border-[var(--border)]">
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
                                className={`cv-auto flex items-center gap-2 px-3 py-2 text-sm border-b border-[var(--border)] last:border-b-0 ${
                                  _isAdded ? 'bg-green-50 dark:bg-green-500/10 text-green-900 dark:text-green-200' : _isRemoved ? 'bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-200' : 'text-[var(--text-2)]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={activeMenuPackRow.menuItemIds.includes(item.id)}
                                  onChange={() => togglePackMenuItem(menuEditorPack, item.id)}
                                />
                                <span>{item.name}</span>
                                {_isAdded && <span className="ml-auto text-xs font-semibold text-green-700 dark:text-green-200">+ added</span>}
                                {_isRemoved && <span className="ml-auto text-xs font-semibold text-red-700 dark:text-red-200">− removed</span>}
                              </label>
                            );
                          })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[var(--text-1)]">Selected Items</p>
                  {activeMenuPackRow.menuItemIds.length > 0 && (
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-200 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-full">
                      {activeMenuPackRow.menuItemIds.length} items · {activeMenuPackRow.menuPoints || '0'} pts
                    </span>
                  )}
                </div>
                {activeMenuPackRow.menuItemIds.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 12px' }}>
                    <div className="empty-state-icon">
                      <FileText size={20} />
                    </div>
                    <p className="empty-state-title">No items selected</p>
                    <p className="empty-state-desc">Choose items from the list to build this pack.</p>
                  </div>
                ) : (
                  <div
                    className="max-h-[360px] overflow-y-auto space-y-3"
                    style={{ contain: 'content', overscrollBehavior: 'contain' }}
                  >
                    {selectedMenuItemsByGroup.map(([group, grouped]) => (
                      <div key={`selected-group-${group}`} className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--text-1)]">{group}</p>
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
                                    _sAdded ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-900 dark:text-green-200' : _sRemoved ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-200' : 'border-[var(--border-2)] bg-[var(--surface)]'
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

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden min-h-[500px]">
            {menuPdfSetupLoading ? (
              <div className="h-[500px] grid place-items-center text-sm text-[var(--text-2)]">
                Loading menu options...
              </div>
            ) : menuPdfLoading ? (
              <div className="h-[500px] grid place-items-center">
                <div className="skeleton" style={{ width: 120, height: 120, borderRadius: 16 }} />
              </div>
            ) : menuPdfPreviewUrl ? (
              <iframe
                title="Booking menu PDF preview"
                src={menuPdfPreviewUrl}
                className="w-full h-[70vh]"
              />
            ) : (
              <div className="h-[500px] grid place-items-center text-sm text-[var(--text-4)]">
                Select a menu pack to generate preview.
              </div>
            )}
          </div>
        </div>
      </FormPromptModal>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="relative" style={{ flex: 1 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-4)]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search bookings…"
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
          <button type="button" className="btn btn-secondary flex items-center justify-center h-[42px] px-3 md:px-4" onClick={() => setShowFilters(true)}>
            <Filter className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Filters</span>
            {Object.values(columnSearch).filter(Boolean).length > 0 && (
               <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                 {Object.values(columnSearch).filter(Boolean).length}
               </span>
            )}
          </button>
          {/* View toggle — hidden on mobile where we always use cards */}
          <div
            aria-label="Toggle view"
            role="group"
            className="hidden md:flex"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {(['cards', 'table'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                title={mode === 'cards' ? 'Card view' : 'Table view'}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: viewMode === mode ? 'var(--teal-600)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text-3)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'cards' ? '⊞ Cards' : '≡ Table'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 md:hidden">
          <label className="label">Search by date</label>
          <input
            type="date"
            className="input"
            value={columnSearch.functionDate}
            onChange={(e) => handleColumnSearch('functionDate', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {!canViewBooking ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <CalendarCheck size={22} />
            </div>
            <p className="empty-state-title">No data available</p>
            <p className="empty-state-desc">You do not have access to view bookings.</p>
          </div>
        ) : loading ? (
          <div className="py-6">
            <TableSkeleton rows={8} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={globalSearch ? Search : CalendarCheck}
            variant={
              globalSearch
                ? 'search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'filter'
                  : 'page'
            }
            title={
              globalSearch
                ? 'No bookings match your search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'No matches'
                  : 'No bookings found'
            }
            description={
              globalSearch || Object.values(columnSearch).some(Boolean)
                ? `"${globalSearch || Object.values(columnSearch).find(Boolean)}" returned no results.`
                : 'Create a booking to start tracking events.'
            }
            action={
              globalSearch
                ? { label: 'Clear search', onClick: () => setGlobalSearch('') }
                : Object.values(columnSearch).some(Boolean)
                  ? { label: 'Clear filters', onClick: () => setColumnSearch(initialColumnSearch) }
                  : canAddBooking
                    ? { label: 'New Booking', onClick: () => setShowCreateForm(true) }
                    : undefined
            }
          />
        ) : (
          <>
            {/* Mobile card view — always shown on small screens */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                    {paginatedBookings.map((booking) => (
                      <MobileBookingCard
                        key={booking.id}
                        booking={booking}
                        canExportMenuPdf={canExportMenuPdf && (booking._count?.packs ?? 1) > 0}
                        canEditBooking={canEditBooking}
                        canDeleteBooking={canDeleteBooking}
                        onExportPdf={(b) => openMenuPdfModal(b)}
                        onExportBookingPdf={(b) => handleDownloadBookingPdf(b)}
                        bookingPdfLoading={bookingPdfLoading}
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

            {/* Desktop card grid view */}
            {viewMode === 'cards' && (
              <div className="hidden md:block">
                <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                        padding: '4px 0',
                      }}
                    >
                      {paginatedBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          canExportMenuPdf={canExportMenuPdf && (booking._count?.packs ?? 1) > 0}
                          canEditBooking={canEditBooking}
                          canDeleteBooking={canDeleteBooking}
                          onExportPdf={(b) => openMenuPdfModal(b)}
                          onExportBookingPdf={(b) => handleDownloadBookingPdf(b)}
                          bookingPdfLoading={bookingPdfLoading}
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
            )}

            {/* Desktop table view */}
            <div className={viewMode === 'table' ? 'hidden md:block table-shell' : 'hidden'}>
              <table className="data-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
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
                    <th className="py-3 px-4 text-sm font-semibold text-[var(--text-2)]">Hall / Venue</th>
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
                      className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]"
                    />
                    {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="cv-auto-row border-b border-[var(--border)] hover:bg-[var(--surface-2)]"
                      >
                      <td className="py-4 px-4">
                        <p className="font-medium text-[var(--text-1)]">{booking.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{booking.functionType}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[var(--text-1)]">{booking.customer?.name}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{booking.customer?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        {formatDateDDMMYYYY(booking.functionDate)}
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 text-[var(--text-4)]" />
                          {booking.expectedGuests}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        {(booking.halls || []).length > 0
                          ? (booking.halls || []).map((h) => h.hall ? [h.hall.banquet?.name, h.hall.name].filter(Boolean).join(' / ') : null).filter(Boolean).join(', ')
                          : <span className="text-[var(--text-4)]">—</span>}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={booking.isQuotation ? 'quotation' : booking.status} />
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-[var(--text-1)]">
                        ₹{(booking.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      {(canExportMenuPdf || canEditBooking || canDeleteBooking) && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canExportMenuPdf && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:bg-teal-500/10 rounded-lg disabled:opacity-50"
                                onClick={() => handleDownloadBookingPdf(booking)}
                                title="Download booking details PDF"
                                disabled={bookingPdfLoading === booking.id}
                              >
                                {bookingPdfLoading === booking.id
                                  ? <span className="w-4 h-4 block border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                  : <Download className="w-4 h-4" />}
                              </button>
                            )}
                            {canExportMenuPdf && (booking._count?.packs ?? 1) > 0 && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                onClick={() => openMenuPdfModal(booking)}
                                title="Preview menu PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {canEditBooking && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg"
                                onClick={() => openEditBooking(booking.id)}
                                title="Edit booking"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteBooking && (
                              <button
                                type="button"
                                className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
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
                    ))
                  }
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
      {/* Quick Add Item Modal */}
      <FormPromptModal
        open={showQuickAddItem}
        onClose={() => setShowQuickAddItem(false)}
        title="Create New Item"
      >
        <form onSubmit={submitQuickAddItem} className="space-y-4">
          <div>
            <label className="label">Item Type <span className="text-red-500">*</span></label>
            <select
              className="input"
              value={quickItemForm.itemTypeId}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, itemTypeId: e.target.value }))}
              required
            >
              <option value="">Select type...</option>
              {itemTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Item Name <span className="text-red-500">*</span></label>
            <input
              className="input"
              placeholder="e.g. Paneer Butter Masala"
              value={quickItemForm.name}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Points <span className="text-red-500">*</span></label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1.5"
              value={quickItemForm.points}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, points: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddItem(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingQuickItem}>
              {savingQuickItem ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeCount={Object.values(columnSearch).filter(Boolean).length}
        onClearAll={() => setColumnSearch(initialColumnSearch)}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Function</label>
            <input className="input" placeholder="Search function" value={columnSearch.functionName} onChange={(e) => handleColumnSearch('functionName', e.target.value)} />
          </div>
          <div>
            <label className="label">Customer</label>
            <input className="input" placeholder="Search name or phone" value={columnSearch.customer} onChange={(e) => handleColumnSearch('customer', e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={columnSearch.functionDate} onChange={(e) => handleColumnSearch('functionDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Guests</label>
            <input className="input" placeholder="Search guests" value={columnSearch.expectedGuests} onChange={(e) => handleColumnSearch('expectedGuests', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <input className="input" placeholder="Search status" value={columnSearch.status} onChange={(e) => handleColumnSearch('status', e.target.value)} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input className="input" placeholder="Search amount" value={columnSearch.grandTotal} onChange={(e) => handleColumnSearch('grandTotal', e.target.value)} />
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
