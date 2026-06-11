'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  FileText,
  Flag,
  History,
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
import { BookingsTableSkeleton } from '@/components/Skeletons';
import { useBookingsListQuery, useBookingsServerListQuery } from '@/lib/query/hooks';
import { usesServerPagination } from '@/lib/featureFlags';
import { normalizeSearchForServer, selectListData } from '@/lib/listQuery';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useDebounce } from '@/lib/useDebounce';
import { handleEnterAsTabKeyDown } from '@/lib/focusNextField';
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
import { sumPaymentsTowardDue } from '@/lib/booking-form/payment-credit';
import { validatePackCateringForSave } from '@/lib/booking-form/pack-catering';
import {
  buildItemByIdMap,
  calculateMenuPointsFromMap,
  extractTemplateItemIds,
  getItemPoints,
  templateItemsToMenuItemLikes,
} from '@/lib/booking-form/menu-template';
import type { MenuItemLike, PaymentRow } from '@/lib/booking-form/types';
import type { PackKey } from '@/lib/booking-form/constants';
import type {
  AdditionalRequirementRow,
  BanquetOption,
  BookingFormData,
  BookingPackRow,
  HallOption,
} from '@/lib/booking-form/form-types';
import {
  computeVersionDiff,
  histToSnapshot,
  type DiffSnapshot,
} from '@/lib/booking-form/version-history';
import { recalcBillingWhenMealsSubtotalChanges } from '@/lib/booking-form/billing-recalc';
import { BOOKING_EXTERNAL_UPDATE_EVENT } from '@/lib/booking-form/booking-form-sync';
import {
  clearBookingDraft,
  pruneStaleBookingDrafts,
  readBookingDraft,
  saveBookingDraft,
} from '@/lib/booking-form/bookingDraft';
import { packHasHallCharge, readPackHallRate } from '@/lib/booking-form/map-api-pack';
import {
  buildBookingHallRows,
  computePackRowAmount,
  computePackRowAmountFromApiPack,
  computeExtrasSubtotal,
  computeMealsSubtotal,
  computePayableGrandTotal,
  formatDiscountPercentDisplay,
  formatPercentFieldOnBlur,
  formatRupeeAmount,
  roundRupee,
  syncBillingAmounts,
  validateBillingCeiling,
  type BillingAmountSyncMode,
} from '@bika/booking-core';
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
import FinalizedVersionHistory from '@/components/booking/FinalizedVersionHistory';
import BookingPartyOverForm from '@/components/BookingPartyOverForm';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import BookingTermsSection from '@/components/booking/BookingTermsSection';
import BookingMenuEditorModal from '@/components/booking/BookingMenuEditorModal';
import BookingPackTable from '@/components/booking/BookingPackTable';
import { IndianAmountInput } from '@/components/IndianAmountInput';

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

type AmountSyncMode = BillingAmountSyncMode;

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

  const [useServer] = useState(() => usesServerPagination('bookings'));
  const {
    data: legacyBookings = [],
    isLoading: legacyLoading,
    refetch: refetchLegacyBookings,
    isError: legacyBookingsLoadError,
  } = useBookingsListQuery<Booking[]>(canViewBooking && !useServer);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [banquets, setBanquets] = useState<BanquetOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [itemTypes, setItemTypes] = useState<{ id: string; name: string }[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [quickItemForm, setQuickItemForm] = useState({ name: '', itemTypeId: '', points: '' });
  const [savingQuickItem, setSavingQuickItem] = useState(false);
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
  const formRef = useRef<HTMLFormElement>(null);
  // Snapshot of formData as last loaded from the server. Reset to this on server rejection.
  const savedFormDataRef = useRef<BookingFormData | null>(null);
  const savingInFlightRef = useRef(false);
  const [importedTemplateExtras, setImportedTemplateExtras] = useState<MenuItemLike[]>([]);
  const [showStickyActions, setShowStickyActions] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedGlobalSearch = useDebounce(globalSearch, useServer ? 300 : 150);
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortState>({
    key: 'functionDate',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Server-pagination path (flag ON). Folds the text-searchable column filters
  // into the global server search so results stay a superset of the client
  // search; functionDate/number column filters narrow within that search term.
  const serverSearch = useMemo(() => {
    const parts = [
      debouncedGlobalSearch,
      columnSearch.functionName,
      columnSearch.customer,
      columnSearch.status,
      columnSearch.functionDate,
    ]
      .map((v) => (v ?? '').trim())
      .filter(Boolean);
    return normalizeSearchForServer(parts.join(' '));
  }, [debouncedGlobalSearch, columnSearch]);

  const {
    data: serverBookingsData,
    isLoading: serverBookingsLoading,
    isError: serverBookingsLoadError,
    refetch: refetchServerBookings,
  } = useBookingsServerListQuery<Booking>(canViewBooking && useServer, {
    page: currentPage,
    limit: BOOKINGS_PAGE_SIZE,
    search: serverSearch,
    sort: sort.key,
    order: sort.direction,
  });

  const serverBookingsPrevRef = useRef<Booking[] | undefined>(undefined);
  if (serverBookingsData?.rows) serverBookingsPrevRef.current = serverBookingsData.rows;
  const serverBookingsSelected = selectListData<Booking>(
    serverBookingsData?.rows,
    serverBookingsPrevRef.current,
    serverBookingsLoadError
  );

  const bookings: Booking[] = useServer ? serverBookingsSelected.rows : legacyBookings;
  const loading = useServer ? serverBookingsLoading : legacyLoading;
  const bookingsLoadError = useServer ? false : legacyBookingsLoadError;
  const refetchBookings = useServer ? refetchServerBookings : refetchLegacyBookings;

  useEffect(() => {
    if (useServer && serverBookingsLoadError) {
      toast.error('Failed to load bookings. Showing last results.', {
        action: { label: 'Retry', onClick: () => void refetchServerBookings() },
      });
    }
  }, [useServer, serverBookingsLoadError, refetchServerBookings]);
  // view mode: 'table' (default on desktop) or 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const isFormDirtyRef = useRef(false);
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
  const refreshOpenBookingFinancialsRef = useRef<(bookingId: string) => void>(() => {});

  useEffect(() => {
    isFormDirtyRef.current = isFormDirty;
  }, [isFormDirty]);

  const syncMealsSubtotalBaseline = useCallback((mealsSubtotal: number) => {
    prevTotalPackAmountRef.current = mealsSubtotal;
  }, []);

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

  // The check's own state must be visible: a failed check ('error') is
  // rendered distinctly so it can never look like "hall is free".
  const [availabilityCheck, setAvailabilityCheck] = useState<
    'idle' | 'checking' | 'clear' | 'clash' | 'error'
  >('idle');
  const [availabilityRecheckNonce, setAvailabilityRecheckNonce] = useState(0);

  // Debounced availability check — fires when date or halls change
  const availabilityCheckKey = `${formData.functionDate}|${selectedHallIds.sort().join(',')}`;
  const availabilityCheckKeyRef = useRef(availabilityCheckKey);
  availabilityCheckKeyRef.current = availabilityCheckKey;

  useEffect(() => {
    if (!formData.functionDate || selectedHallIds.length === 0) {
      setHallClashWarnings([]);
      setAvailabilityCheck('idle');
      return;
    }
    setAvailabilityCheck('checking');
    const timer = setTimeout(async () => {
      if (availabilityCheckKeyRef.current !== availabilityCheckKey) return;
      try {
        const params = {
          hallIds: selectedHallIds.join(','),
          date: formData.functionDate,
          ...(editingBookingId ? { excludeBookingId: editingBookingId } : {}),
        };
        const res = await api.checkBookingAvailability(params);
        // Stale-response guard: halls/date changed while the request was in flight.
        if (availabilityCheckKeyRef.current !== availabilityCheckKey) return;
        const data = res.data?.data;
        if (data && !data.available) {
          setHallClashWarnings(data.clashes || []);
          setAvailabilityCheck('clash');
        } else {
          setHallClashWarnings([]);
          setAvailabilityCheck('clear');
        }
      } catch {
        if (availabilityCheckKeyRef.current !== availabilityCheckKey) return;
        // Never render "no clashes" on failure — surface the failure instead.
        setHallClashWarnings([]);
        setAvailabilityCheck('error');
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityCheckKey, editingBookingId, availabilityRecheckNonce]);
  // ── End hall clash detection ──────────────────────────────────────────────

  const isReadOnlyBooking = useMemo(
    () => Boolean(editingBookingId && editingBookingStatus === 'completed'),
    [editingBookingId, editingBookingStatus]
  );

  // ── Data-safety state (concurrent edits, stale financials, drafts) ───────
  // Last server `updatedAt` seen for the open booking; compared before save so
  // two people editing the same booking can't silently overwrite each other.
  const bookingBaselineUpdatedAtRef = useRef<string | null>(null);
  const [saveConflict, setSaveConflict] = useState<{
    serverUpdatedAt: string | null;
    opts?: { keepOpen?: boolean };
  } | null>(null);
  // Set when the open booking changes on the server while the form has
  // unsaved edits — totals on screen may be stale.
  const [externalUpdateNotice, setExternalUpdateNotice] = useState<{
    at: string;
    confirmingReload: boolean;
  } | null>(null);
  // Offer to resume a locally retained draft after a crash/refresh.
  const [draftOffer, setDraftOffer] = useState<{
    bookingId: string | null;
    savedAt: string;
    stale: boolean;
    formData: BookingFormData;
  } | null>(null);
  // Finalizing is irreversible — show a review of what gets locked in,
  // not a bare browser confirm().
  const [showFinalizeReview, setShowFinalizeReview] = useState(false);

  const readDraftOfferFor = (
    bookingId: string | null,
    serverUpdatedAt: string | null
  ) => {
    const draft = readBookingDraft<BookingFormData>(bookingId);
    if (!draft) return null;
    return {
      bookingId,
      savedAt: draft.savedAt,
      stale: Boolean(
        serverUpdatedAt &&
          draft.baselineUpdatedAt &&
          new Date(serverUpdatedAt).getTime() >
            new Date(draft.baselineUpdatedAt).getTime()
      ),
      formData: draft.formData,
    };
  };

  const resumeDraft = () => {
    if (!draftOffer) return;
    setFormData(draftOffer.formData);
    syncMealsSubtotalBaseline(computeMealsSubtotal(draftOffer.formData.packs));
    setIsFormDirty(true);
    setDraftOffer(null);
  };

  const discardDraft = () => {
    if (!draftOffer) return;
    clearBookingDraft(draftOffer.bookingId);
    setDraftOffer(null);
  };

  useEffect(() => {
    pruneStaleBookingDrafts();
  }, []);

  // Retain unsaved form edits locally (debounced) so a crash/refresh can't
  // destroy work. Cleared on successful save and on explicit discard/close.
  useEffect(() => {
    if (!showCreateForm || !isFormDirty || isReadOnlyBooking) return;
    const timer = setTimeout(() => {
      saveBookingDraft(editingBookingId, {
        savedAt: new Date().toISOString(),
        baselineUpdatedAt: bookingBaselineUpdatedAtRef.current,
        formData,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [showCreateForm, isFormDirty, isReadOnlyBooking, editingBookingId, formData]);

  const availabilityChip = (() => {
    if (availabilityCheck === 'idle') return null;
    if (availabilityCheck === 'checking') {
      return (
        <span className="fade-in-soft inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-3)]">
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--text-4)] border-t-transparent"
            aria-hidden
          />
          Checking hall availability…
        </span>
      );
    }
    if (availabilityCheck === 'clear') {
      return (
        <span className="fade-in-soft inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-3 w-3 shrink-0" aria-hidden />
          No hall clashes for the selected date
        </span>
      );
    }
    if (availabilityCheck === 'clash') {
      return (
        <span className="fade-in-soft inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          {hallClashWarnings.length} booking{hallClashWarnings.length === 1 ? '' : 's'} clash with the selected halls
        </span>
      );
    }
    return (
      <span className="fade-in-soft inline-flex items-center gap-1.5 rounded-full border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-xs text-red-700 dark:text-red-300">
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
        Couldn’t verify hall availability
        <button
          type="button"
          className="font-semibold underline underline-offset-2"
          onClick={() => setAvailabilityRecheckNonce((n) => n + 1)}
        >
          Retry
        </button>
      </span>
    );
  })();
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

  const clientFilteredBookings = useMemo(
    () => filterAndSortRows(bookings, tableColumns, debouncedGlobalSearch, columnSearch, sort),
    [bookings, tableColumns, debouncedGlobalSearch, columnSearch, sort]
  );

  // Server path: `bookings` is already the current page (server-filtered and
  // server-sorted); totals come from the server pagination meta.
  const serverBookingsTotal = serverBookingsData?.pagination?.total ?? 0;
  const totalBookingsCount = useServer
    ? serverBookingsTotal
    : clientFilteredBookings.length;

  const totalPages = useMemo(
    () =>
      useServer
        ? Math.max(1, serverBookingsData?.pagination?.totalPages ?? 1)
        : Math.max(1, Math.ceil(clientFilteredBookings.length / BOOKINGS_PAGE_SIZE)),
    [useServer, serverBookingsData?.pagination?.totalPages, clientFilteredBookings.length]
  );

  const filteredBookings = useServer ? bookings : clientFilteredBookings;

  const paginatedBookings = useMemo(() => {
    if (useServer) return bookings; // already the current page
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * BOOKINGS_PAGE_SIZE;
    return clientFilteredBookings.slice(startIndex, startIndex + BOOKINGS_PAGE_SIZE);
  }, [useServer, bookings, currentPage, clientFilteredBookings, totalPages]);

  const historicalVersions = useMemo(
    () =>
      bookingHistory.filter(
        (entry: { id?: string | null }) => Boolean(entry?.id) && entry.id !== editingBookingId
      ),
    [bookingHistory, editingBookingId]
  );

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
    () => sumPaymentsTowardDue(formData.payments),
    [formData.payments]
  );


  const toNonNegativeNumber = useCallback((value: string): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  }, []);

  const formatComputedAmount = useCallback(
    (amount: number): string => formatRupeeAmount(amount),
    []
  );

  const packRowAmount = useCallback(
    (row: BookingPackRow) => computePackRowAmount(row),
    []
  );

  const billingTotals = useMemo(() => {
    const mealsSubtotal = computeMealsSubtotal(formData.packs);
    const extrasSubtotal = computeExtrasSubtotal(formData.additionalRequirements);
    const preDiscountTotal = roundRupee(mealsSubtotal + extrasSubtotal);
    return {
      mealsSubtotal,
      extrasSubtotal,
      preDiscountTotal,
    };
  }, [formData.packs, formData.additionalRequirements]);

  const mealsBillBase = billingTotals.mealsSubtotal;
  const totalBillBase = billingTotals.preDiscountTotal;
  const payableGrandTotal = useMemo(() => {
    const mealsNet = roundRupee(
      parseFloat(formData.finalAmount || '0') || mealsBillBase
    );
    return computePayableGrandTotal(mealsNet, billingTotals.extrasSubtotal);
  }, [formData.finalAmount, mealsBillBase, billingTotals.extrasSubtotal]);

  // Keep for backward-compat references (same value as totalBillBase)
  const totalBillAmount = totalBillBase;

  // Due = payable grand total (meals net + extras) − payments.
  useEffect(() => {
    void loadLookups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAddBooking, canEditBooking]);

  useEffect(() => {
    if (!showCreateForm) return;
    const due = roundRupee(Math.max(0, payableGrandTotal - totalPayments));
    setFormData((prev) => ({ ...prev, dueAmount: formatRupeeAmount(due) }));
  }, [payableGrandTotal, totalPayments, showCreateForm]);

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
    (mode: AmountSyncMode, sourceValue: string, totalAmount: number) =>
      syncBillingAmounts(mode, sourceValue, totalAmount),
    []
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
      const nextValues = normalizeAmountSnapshot(amountSyncMode, sourceValue, mealsBillBase);
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
  }, [amountSyncMode, discountManuallySet, mealsBillBase, normalizeAmountSnapshot, showCreateForm]);

  useEffect(() => {
    if (!showCreateForm) return;
    if (prevTotalPackAmountRef.current === null) {
      prevTotalPackAmountRef.current = mealsBillBase;
      return;
    }
    if (prevTotalPackAmountRef.current === mealsBillBase) return;
    prevTotalPackAmountRef.current = mealsBillBase;
    if (!discountManuallySet) return;
    setFormData((prev) => {
      const nextValues = recalcBillingWhenMealsSubtotalChanges(
        prev,
        mealsBillBase,
        amountSyncMode
      );
      if (
        prev.finalDiscountAmount === nextValues.finalDiscountAmount &&
        prev.finalDiscountPercent === nextValues.finalDiscountPercent &&
        prev.finalAmount === nextValues.finalAmount
      ) {
        return prev;
      }
      return { ...prev, ...nextValues };
    });
  }, [
    amountSyncMode,
    discountManuallySet,
    mealsBillBase,
    showCreateForm,
  ]);

  useEffect(() => {
    if (bookingsLoadError) {
      toast.error('Failed to load bookings');
    }
  }, [bookingsLoadError]);

  const loadBookings = useCallback(async () => {
    await refetchBookings();
  }, [refetchBookings]);

  useEffect(() => {
    const section = searchParams.get('section');
    const id = searchParams.get('id');
    if (section === 'edit' && id) {
      void openEditBooking(id);
    } else if (section === 'new') {
      void openCreateBooking({
        date: searchParams.get('date') || undefined,
        hallId: searchParams.get('hall') || undefined,
        slot: searchParams.get('slot') || undefined,
      });
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
            const payload = JSON.parse(event.data) as { type?: string; id?: string };
            if (payload.type?.startsWith('booking:')) {
              void loadBookings();
              if (payload.id) {
                refreshOpenBookingFinancialsRef.current(payload.id);
              }
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

  const loadLookups = async (): Promise<HallOption[]> => {
    try {
      if (!canAddBooking && !canEditBooking) {
        setCustomers([]);
        setBanquets([]);
        setHalls([]);
        setItems([]);
        setTemplateMenus([]);
        return [];
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
      return hallRows;
    } catch (error) {
      toast.error('Failed to load booking form options');
      return [];
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
    prevTotalPackAmountRef.current = null;
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
    setShowFinalizeReview(false);
    // Explicit close (incl. "Discard & Close") — the locally retained draft
    // for this form session is no longer wanted.
    clearBookingDraft(editingBookingId);
    bookingBaselineUpdatedAtRef.current = null;
    setExternalUpdateNotice(null);
    setSaveConflict(null);
    setDraftOffer(null);
    // Clear any active search so the freshly-saved booking is always visible
    // in the list (Bug: booking appeared to vanish because search was still active)
    clearSearch();
  };

  const SLOT_TO_PACK: Record<string, PackKey> = {
    morning: 'breakfast',
    lunch: 'lunch',
    evening: 'hiTea',
    dinner: 'dinner',
  };

  const openCreateBooking = async (prefill?: {
    date?: string;
    hallId?: string;
    slot?: string;
  }) => {
    const lookupsPromise = loadLookups();
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
    prevTotalPackAmountRef.current = null;

    let nextForm: BookingFormData = {
      ...initialFormData,
      packs: {
        breakfast: { ...initialFormData.packs.breakfast },
        lunch: { ...initialFormData.packs.lunch },
        hiTea: { ...initialFormData.packs.hiTea },
        dinner: { ...initialFormData.packs.dinner },
      },
    };
    if (prefill?.date) {
      nextForm.functionDate = prefill.date;
    }
    const packKey = prefill?.slot ? SLOT_TO_PACK[prefill.slot] : undefined;
    if (packKey) {
      nextForm.packs[packKey] = { ...nextForm.packs[packKey], enabled: true };
      if (prefill?.hallId) {
        const loadedHalls = await lookupsPromise;
        const hall = loadedHalls.find((h) => h.id === prefill.hallId);
        if (hall) {
          nextForm.packs[packKey] = {
            ...nextForm.packs[packKey],
            banquetId: hall.banquet?.id || '',
            hallIds: [hall.id],
          };
        }
      }
    }

    void lookupsPromise;
    setFormData(nextForm);
    setIsFormDirty(false);
    bookingBaselineUpdatedAtRef.current = null;
    setExternalUpdateNotice(null);
    setSaveConflict(null);
    setDraftOffer(readDraftOfferFor(null, null));
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
          withHall: resolvedPackHallIds.length > 0 || packHasHallCharge(pack),
          withCatering: true,
          banquetId: firstPackHall?.banquet?.id || primaryHall?.banquet?.id || '',
          hallIds: resolvedPackHallIds,
          templateMenuId: matchingTemplate?.id || '',
          menuItemIds: rowMenuItemIds,
          startTime: pack.startTime || nextPacks[packKey].startTime,
          endTime: pack.endTime || nextPacks[packKey].endTime,
          hallRate: readPackHallRate(pack),
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
        dueAmount: booking.dueAmount || '0',
        finalDiscountAmount:
          booking.discountAmount !== null && booking.discountAmount !== undefined
            ? String(booking.discountAmount)
            : '0',
        finalDiscountPercent:
          booking.discountPercentage !== null && booking.discountPercentage !== undefined
            ? String(booking.discountPercentage)
            : '0',
        finalAmount: (() => {
          const extras = (booking.additionalItems || []).reduce(
            (sum: number, entry: { charges?: number }) =>
              sum + Math.max(0, Number(entry?.charges ?? 0) || 0),
            0
          );
          const payable =
            booking.finalAmountValue !== undefined && booking.finalAmountValue !== null
              ? Number(booking.finalAmountValue)
              : Number(booking.finalAmount ?? booking.grandTotal ?? 0);
          const mealsNet = roundRupee(Math.max(0, payable - extras));
          return String(mealsNet);
        })(),
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
      syncMealsSubtotalBaseline(computeMealsSubtotal(loadedFormData.packs));
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
      const serverUpdatedAt = booking.updatedAt ? String(booking.updatedAt) : null;
      bookingBaselineUpdatedAtRef.current = serverUpdatedAt;
      setExternalUpdateNotice(null);
      setSaveConflict(null);
      setDraftOffer(readDraftOfferFor(bookingId, serverUpdatedAt));
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

  // Stable handler identities for the memoised booking cards. The underlying
  // functions close over lots of state and get a fresh identity each render;
  // routing through refs keeps the props passed to BookingCard/MobileBookingCard
  // stable so React.memo can skip re-rendering unchanged cards. Behaviour is
  // identical — the latest closure is always invoked.
  const openEditBookingRef = useRef(openEditBooking);
  openEditBookingRef.current = openEditBooking;
  const handleDeleteBookingRef = useRef(handleDeleteBooking);
  handleDeleteBookingRef.current = handleDeleteBooking;
  const stableOnEdit = useCallback((id: string) => {
    void openEditBookingRef.current(id);
  }, []);
  const stableOnDelete = useCallback((id: string) => {
    void handleDeleteBookingRef.current(id);
  }, []);

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
      const next = {
        ...prev,
        payments: loadedPayments,
        finalDiscountAmount:
          booking.discountAmount !== null && booking.discountAmount !== undefined
            ? String(booking.discountAmount)
            : prev.finalDiscountAmount,
        finalDiscountPercent:
          booking.discountPercentage !== null && booking.discountPercentage !== undefined
            ? String(booking.discountPercentage)
            : prev.finalDiscountPercent,
        finalAmount: (() => {
          const extras = (booking.additionalItems || []).reduce(
            (sum: number, entry: { charges?: number }) =>
              sum + Math.max(0, Number(entry?.charges ?? 0) || 0),
            0
          );
          const payable =
            booking.finalAmountValue !== undefined && booking.finalAmountValue !== null
              ? Number(booking.finalAmountValue)
              : Number(
                  booking.finalAmount ??
                    booking.grandTotal ??
                    prev.finalAmount ??
                    0
                );
          return String(roundRupee(Math.max(0, payable - extras)));
        })(),
        dueAmount:
          booking.dueAmountValue !== undefined && booking.dueAmountValue !== null
            ? String(booking.dueAmountValue)
            : booking.dueAmount !== null && booking.dueAmount !== undefined
              ? String(booking.dueAmount)
              : prev.dueAmount,
      };
      savedFormDataRef.current = next;
      syncMealsSubtotalBaseline(computeMealsSubtotal(next.packs));
      return next;
    });
    setActiveBookingObj(booking);
    // Form now reflects this server state — update the concurrency baseline
    // and clear any stale-data notice.
    if (booking.updatedAt) {
      bookingBaselineUpdatedAtRef.current = String(booking.updatedAt);
    }
    setExternalUpdateNotice(null);
  }, [syncMealsSubtotalBaseline]);

  const refreshOpenBookingFinancials = useCallback(
    async (bookingId: string) => {
      if (!showCreateForm || !editingBookingId || editingBookingId !== bookingId) return;
      // Our own save also emits this event — the post-save refetch already
      // refreshes the form and the baseline, so don't react mid-save.
      if (savingInFlightRef.current) return;
      if (isFormDirtyRef.current) {
        // Unsaved edits — never clobber them. Verify the change is genuinely
        // external (not an echo of our own last save), then surface a notice
        // so stale totals are visible rather than silent.
        try {
          const head = await api.getBooking(bookingId);
          const serverUpdatedAt = head.data?.data?.booking?.updatedAt
            ? String(head.data.data.booking.updatedAt)
            : null;
          if (
            serverUpdatedAt &&
            serverUpdatedAt !== bookingBaselineUpdatedAtRef.current
          ) {
            setExternalUpdateNotice((prev) => ({
              at: new Date().toISOString(),
              confirmingReload: prev?.confirmingReload ?? false,
            }));
          }
        } catch {
          // Can't verify — the pre-save conflict guard still protects the save.
        }
        return;
      }
      try {
        const response = await api.getBooking(bookingId);
        const booking = response.data?.data?.booking;
        if (!booking) return;
        applyBookingToForm(booking);
      } catch {
        // Non-blocking — list/SSE already refreshed; form stays on last known state.
      }
    },
    [applyBookingToForm, editingBookingId, showCreateForm]
  );
  refreshOpenBookingFinancialsRef.current = (bookingId) => {
    void refreshOpenBookingFinancials(bookingId);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onExternalUpdate = (event: Event) => {
      const bookingId = (event as CustomEvent<{ bookingId?: string }>).detail?.bookingId;
      if (!bookingId) return;
      void refreshOpenBookingFinancials(bookingId);
    };
    window.addEventListener(BOOKING_EXTERNAL_UPDATE_EVENT, onExternalUpdate);
    return () => window.removeEventListener(BOOKING_EXTERNAL_UPDATE_EVENT, onExternalUpdate);
  }, [refreshOpenBookingFinancials]);

  const doSaveBooking = async (
    opts?: { keepOpen?: boolean; skipConflictCheck?: boolean }
  ): Promise<string | null> => {
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

    const netDraftForSave = netAmountDraft;
    const flushedNetSnapshot =
      netDraftForSave !== null
        ? normalizeAmountSnapshot('finalAmount', netDraftForSave, mealsBillBase)
        : null;

    if (flushedNetSnapshot) {
      setNetAmountDraft(null);
      setAmountSyncMode('finalAmount');
      setFormData((prev) => ({ ...prev, ...flushedNetSnapshot }));
    }

    const mealsNetForCheck = flushedNetSnapshot?.finalAmount ?? formData.finalAmount;
    const billingCheck = validateBillingCeiling({
      mealsSubtotal: mealsBillBase,
      extrasSubtotal: billingTotals.extrasSubtotal,
      discountAmount: flushedNetSnapshot?.finalDiscountAmount ?? formData.finalDiscountAmount,
      discountPercent: flushedNetSnapshot?.finalDiscountPercent ?? formData.finalDiscountPercent,
      finalAmount: mealsNetForCheck,
    });
    if (!billingCheck.ok) {
      toast.error(
        billingCheck.message ||
          'Net amount cannot exceed the bill total. Adjust discount or line items and try again.'
      );
      return null;
    }

    try {
      savingInFlightRef.current = true;
      setSaving(true);

      // Concurrent-edit guard: refuse to silently overwrite changes someone
      // else saved since this form loaded the booking. On conflict the user
      // chooses explicitly (reload / overwrite / cancel) via the dialog.
      if (
        editingBookingId &&
        !opts?.skipConflictCheck &&
        bookingBaselineUpdatedAtRef.current
      ) {
        try {
          const head = await api.getBooking(editingBookingId);
          const serverUpdatedAt = head.data?.data?.booking?.updatedAt
            ? String(head.data.data.booking.updatedAt)
            : null;
          if (
            serverUpdatedAt &&
            serverUpdatedAt !== bookingBaselineUpdatedAtRef.current
          ) {
            setSaveConflict({ serverUpdatedAt, opts });
            return null;
          }
        } catch {
          // Head-check unavailable — proceed with the normal save; the server
          // remains the authority on what is valid.
        }
      }

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

      for (const { key, row } of enabledPackEntries) {
        const cateringError = validatePackCateringForSave({
          withCatering: row.withCatering,
          ratePerPlate: row.ratePerPlate,
          pax: row.pax,
          menuItemIds: row.menuItemIds,
        });
        if (cateringError) {
          toast.error(`${PACK_LABELS[key]}: ${cateringError}`);
          return null;
        }
      }

      const expectedGuests = Math.max(
        1,
        ...enabledPackEntries
          .map((entry) => Number(entry.row.pax || 0))
          .filter((value) => value > 0)
      );
      const saveSyncMode: AmountSyncMode =
        flushedNetSnapshot ? 'finalAmount' : amountSyncMode;
      const amountSourceValue =
        saveSyncMode === 'discountPercent'
          ? (flushedNetSnapshot?.finalDiscountPercent ?? formData.finalDiscountPercent)
          : saveSyncMode === 'discountAmount'
            ? (flushedNetSnapshot?.finalDiscountAmount ?? formData.finalDiscountAmount)
            : (flushedNetSnapshot?.finalAmount ?? formData.finalAmount);
      const syncedAmounts = syncBillingAmounts(
        saveSyncMode,
        amountSourceValue,
        mealsBillBase
      );
      const normalizedMealsNet = toNumber(syncedAmounts.finalAmount);
      const normalizedPayableGrandTotal = computePayableGrandTotal(
        normalizedMealsNet,
        billingTotals.extrasSubtotal
      );
      const normalizedDiscountAmount = roundRupee(
        totalBillBase - normalizedPayableGrandTotal
      );
      const normalizedDiscountPercent = toNumber(syncedAmounts.finalDiscountPercent);
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
          packCount: Math.max(0, toNumber(row.pax)),
          noOfPack: Math.max(0, toNumber(row.pax)),
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

      // Keep notes to just the user-entered text — pack summaries were bloating
      // this past the server's 2000-char limit on complex bookings.
      const notes = formData.notes.trim() || undefined;

      // Payment entries are now persisted via the /payments endpoint, so we
      // don't need to duplicate them in internalNotes. Just store the financial
      // snapshot which is compact and always useful for debugging.
      const internalNotesParts = [
        `Final Calc: discountAmt=${normalizedDiscountAmount}, discountPct=${normalizedDiscountPercent}, mealsNet=${normalizedMealsNet}, grandTotal=${normalizedPayableGrandTotal}, totalBill=${totalBillAmount.toFixed(2)}, totalPaid=${totalPayments.toFixed(2)}`,
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
        payableGrandTotal: normalizedPayableGrandTotal,
        advanceRequired: formData.advanceRequired || undefined,
        // paymentReceivedAmount is derived server-side from actual payment records.
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

      const failedPayments: Array<{ row: PaymentRow; kind: 'add' | 'update' }> = [];
      if (savedBookingId) {
        const { changedPayments, newPayments } = partitionPaymentsForSave(formData.payments);

        const paymentTasks: Array<{
          row: PaymentRow;
          kind: 'add' | 'update';
          run: () => Promise<unknown>;
        }> = [
          ...changedPayments.map((p) => ({
            row: p,
            kind: 'update' as const,
            run: () =>
              api.updatePayment(savedBookingId, p.id!, {
                amount: parseFloat(p.amount),
                method: p.mode,
                narration: p.narration || undefined,
                paymentDate: p.date,
                reference: p.reference || undefined,
                clearingDate: p.clearingDate || undefined,
              }),
          })),
          ...newPayments.map((p) => ({
            row: p,
            kind: 'add' as const,
            run: () =>
              api.addPayment(savedBookingId, {
                amount: parseFloat(p.amount),
                method: p.mode,
                narration: p.narration || undefined,
                paymentDate: p.date,
                reference: p.reference || undefined,
                clearingDate: p.clearingDate || undefined,
              }),
          })),
        ];

        // Settle every payment mutation so one failure can't mask the others —
        // the user is told exactly which entries did not record.
        const results = await Promise.allSettled(paymentTasks.map((task) => task.run()));
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            failedPayments.push({
              row: paymentTasks[index].row,
              kind: paymentTasks[index].kind,
            });
          }
        });

        const refreshResponse = await api.getBooking(savedBookingId);
        const refreshedBooking = refreshResponse.data?.data?.booking;
        if (refreshedBooking) {
          applyBookingToForm(refreshedBooking);
        }

        if (failedPayments.length > 0) {
          // The refetch reset the form to server state, which doesn't contain
          // the failed entries — re-attach them so nothing typed is lost and
          // submitting again retries exactly these entries.
          const failedNewRows = failedPayments
            .filter((f) => f.kind === 'add')
            .map((f) => f.row);
          const failedUpdates = failedPayments.filter(
            (f) => f.kind === 'update' && f.row.id
          );
          setFormData((prev) => ({
            ...prev,
            payments: [
              ...prev.payments.map((p) => {
                const failedEdit = failedUpdates.find((f) => f.row.id === p.id);
                return failedEdit ? { ...failedEdit.row } : p;
              }),
              ...failedNewRows,
            ],
          }));
        }
      }

      if (failedPayments.length === 0) {
        // Saved — the locally retained draft for this session is now obsolete.
        // (For creates, `editingBookingId` is still null here, clearing 'new'.)
        clearBookingDraft(editingBookingId);
        setDraftOffer(null);

        toast.success(editingBookingId ? 'Booking updated successfully' : 'Booking created successfully');
        if (!opts?.keepOpen) {
          closeBookingForm();
          await loadBookings();
        } else {
          setIsFormDirty(false);
          await loadBookings();
        }
      } else {
        // Partial success: the booking saved but some payment entries didn't.
        // Keep the form open and dirty (draft retention included) so the
        // entries can be retried; report precisely what didn't record.
        const labels = failedPayments
          .map((f) => `₹${Number(f.row.amount || 0).toLocaleString('en-IN')} ${f.row.mode}`)
          .join(', ');
        toast.error(
          `Booking ${editingBookingId ? 'updated' : 'created'}, but ${failedPayments.length} payment ${
            failedPayments.length === 1 ? 'entry' : 'entries'
          } did not record: ${labels}. The ${
            failedPayments.length === 1 ? 'entry is' : 'entries are'
          } still in the Payments tab — submit again to retry.`,
          { duration: 10000 }
        );
        setIsFormDirty(true);
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

  const handleFinalizeBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFinalizeReview(true);
  };

  const confirmFinalizeBooking = async () => {
    setShowFinalizeReview(false);
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
          <h1 className="page-title">Bookings</h1>
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

        {draftOffer && (
          <div className="fade-in-soft mb-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-500/10 px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm text-sky-900 dark:text-sky-200">
            <History className="w-4 h-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Unsaved draft from{' '}
              {new Date(draftOffer.savedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              found.
              {draftOffer.stale &&
                ' Note: this booking has changed on the server since the draft was made.'}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary text-xs px-2.5 py-1.5"
                onClick={resumeDraft}
              >
                Resume draft
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs px-2.5 py-1.5"
                onClick={discardDraft}
              >
                Discard
              </button>
            </span>
          </div>
        )}

        {externalUpdateNotice && editingBookingId && (
          <div
            role="status"
            className="fade-in-soft mb-4 rounded-xl border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200"
          >
            {!externalUpdateNotice.confirmingReload ? (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  This booking was updated outside this form at{' '}
                  {new Date(externalUpdateNotice.at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  . Totals and payments shown may be out of date.
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() =>
                      setExternalUpdateNotice({ ...externalUpdateNotice, confirmingReload: true })
                    }
                  >
                    Reload latest
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() => setExternalUpdateNotice(null)}
                  >
                    Keep editing
                  </button>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  Reloading replaces your unsaved edits with the latest saved version.
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-danger text-xs px-2.5 py-1.5"
                    onClick={() => {
                      setExternalUpdateNotice(null);
                      void openEditBooking(editingBookingId);
                    }}
                  >
                    Reload &amp; discard my edits
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() =>
                      setExternalUpdateNotice({ ...externalUpdateNotice, confirmingReload: false })
                    }
                  >
                    Back
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        <fieldset disabled={isReadOnlyBooking}>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isReadOnlyBooking) handleSubmitBooking(e);
          }}
          onChange={() => setIsFormDirty(true)}
          onKeyDown={(e) => {
            if (
              (e.target as HTMLElement).getAttribute('aria-expanded') === 'true'
            ) {
              return;
            }
            handleEnterAsTabKeyDown(e, formRef.current);
          }}
          className="space-y-5"
        >
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
                    // Prefer the row from the loaded list, but fall back to the
                    // fully-loaded active booking so this works under server
                    // pagination when the booking is not on the current page.
                    const b =
                      bookings.find((bk) => bk.id === editingBookingId) ||
                      (activeBookingObj as Booking | null);
                    if (b) openMenuPdfModal(b);
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Menu PDF
                  </span>
                </button>
              )}
              {!isReadOnlyBooking && availabilityChip && (
                <span className="ml-auto">{availabilityChip}</span>
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

                {/* Availability check status — visible for every state so a
                    failed check can never be mistaken for "hall is free" */}
                {availabilityChip && !isReadOnlyBooking && (
                  <div className="mt-1">{availabilityChip}</div>
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
              {/* ── Desktop/tablet table (lg+) — scrolls horizontally rather
                    than dropping columns on narrower screens ── */}
              <BookingPackTable
                formData={formData}
                setFormData={setFormData}
                formDiff={formDiff}
                halls={halls}
                banquets={banquets}
                openHallPickerPack={openHallPickerPack}
                setOpenHallPickerPack={setOpenHallPickerPack}
                hallPickerContainerRef={hallPickerContainerRef}
                hallPickerPortalRef={hallPickerPortalRef}
                hallPickerAnchorRect={hallPickerAnchorRect}
                setHallPickerAnchorRect={setHallPickerAnchorRect}
                updatePackRow={updatePackRow}
                setMenuEditorPack={setMenuEditorPack}
                setMenuItemSearch={setMenuItemSearch}
                formatComputedAmount={formatComputedAmount}
                packRowAmount={packRowAmount}
                billingTotals={billingTotals}
                mealsBillBase={mealsBillBase}
                payableGrandTotal={payableGrandTotal}
                setAmountSyncMode={setAmountSyncMode}
                setDiscountManuallySet={setDiscountManuallySet}
                normalizeAmountSnapshot={normalizeAmountSnapshot}
                netAmountDraft={netAmountDraft}
                setNetAmountDraft={setNetAmountDraft}
                isReadOnlyBooking={isReadOnlyBooking}
                setIsFormDirty={setIsFormDirty}
                closeBookingForm={closeBookingForm}
                saving={saving}
                handleFinalizeBooking={handleFinalizeBooking}
              />

              {/* ── Mobile cards (below lg) ── */}
              <div className="lg:hidden space-y-3">
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
                            <IndianAmountInput className={`input text-right${packDiff?.ratePerPlateChange ? ' ring-2 ring-amber-300' : ''}`} value={row.ratePerPlate}
                              disabled={!row.withCatering} onChange={(raw) => updatePackRow(packKey, { ratePerPlate: raw })} />
                            {packDiff?.ratePerPlateChange && <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.ratePerPlateChange.from.toLocaleString('en-IN')}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">Hall Rate</label>
                            <IndianAmountInput className={`input text-right${packDiff?.hallRateChange ? ' ring-2 ring-amber-300' : ''}`} value={row.hallRate}
                              disabled={!row.withHall} onChange={(raw) => updatePackRow(packKey, { hallRate: raw })} />
                            {packDiff?.hallRateChange && <p className="mt-0.5 text-xs text-amber-600">was ₹{packDiff.hallRateChange.from.toLocaleString('en-IN')}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">Amount</label>
                            <IndianAmountInput
                              className="input bg-[var(--surface-2)] text-right"
                              value={formatComputedAmount(packRowAmount(row))}
                              readOnly
                              title="Catering + hall rate (once per meal)"
                            />
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
                    {!isReadOnlyBooking && (
                    <button type="button"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary-600 px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                      onClick={() => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: [...prev.additionalRequirements, { description: '', amount: '' }] })); }}>
                      <Plus className="h-3.5 w-3.5" /> Add Extra
                    </button>
                    )}
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
                        <input className="input" value={item.description} placeholder="Item name" aria-label="Extra item name" disabled={isReadOnlyBooking} onChange={(e) => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.map((r, i) => i === index ? { ...r, description: e.target.value } : r) })); }} />
                        <IndianAmountInput className="input text-right" value={item.amount} placeholder="0" aria-label="Extra item amount" disabled={isReadOnlyBooking} onChange={(raw) => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.map((r, i) => i === index ? { ...r, amount: raw } : r) })); }} />
                        {!isReadOnlyBooking && (
                        <button type="button" className="text-red-500 text-xs" onClick={() => { setIsFormDirty(true); setFormData((prev) => ({ ...prev, additionalRequirements: prev.additionalRequirements.filter((_, i) => i !== index) })); }}>✕</button>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text-1)]">Total</span>
                        <span className="text-sm font-semibold text-[var(--text-1)]">₹{billingTotals.mealsSubtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="label text-xs">Discount %</label>
                          <input
                            className="input text-right"
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={formData.finalDiscountPercent}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setAmountSyncMode('discountPercent');
                              setDiscountManuallySet(true);
                              setFormData((prev) => {
                                const synced = normalizeAmountSnapshot('discountPercent', raw, mealsBillBase);
                                return {
                                  ...prev,
                                  finalDiscountAmount: synced.finalDiscountAmount,
                                  finalAmount: synced.finalAmount,
                                  finalDiscountPercent: raw,
                                };
                              });
                            }}
                            onBlur={(e) => {
                              const formatted = formatPercentFieldOnBlur(e.target.value);
                              setFormData((prev) => ({
                                ...prev,
                                ...normalizeAmountSnapshot(
                                  'discountPercent',
                                  formatted !== '' ? formatted : e.target.value,
                                  mealsBillBase
                                ),
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Discount ₹</label>
                          <IndianAmountInput className="input text-right" value={formData.finalDiscountAmount}
                            onChange={(raw) => { setAmountSyncMode('discountAmount'); setDiscountManuallySet(true); setFormData((prev) => ({ ...prev, ...normalizeAmountSnapshot('discountAmount', raw, mealsBillBase) })); }} />
                        </div>
                        <div>
                          <label className="label text-xs">Net Amount</label>
                          <IndianAmountInput className="input text-right font-semibold text-teal-700 dark:text-teal-200" value={formData.finalAmount}
                            onChange={(raw) => { setAmountSyncMode('finalAmount'); setDiscountManuallySet(true); setFormData((prev) => ({ ...prev, ...normalizeAmountSnapshot('finalAmount', raw, mealsBillBase) })); }}
                            aria-label="Net Amount" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-base font-extrabold text-[var(--text-1)]">Grand Total</span>
                        <span className="text-base font-extrabold text-[var(--text-1)]">₹{payableGrandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div>
              <label className="label">Notes</label>
              <AutoResizeTextarea
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <BookingTermsSection />
            </>)}

            {activeBookingTab === 'payments' && (
              <div className="space-y-6 max-w-full overflow-x-hidden">
                <BookingPaymentsLedger
                  payments={formData.payments}
                  isReadOnly={isReadOnlyBooking}
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
                  preDiscountTotal={totalBillBase}
                  extrasSubtotal={billingTotals.extrasSubtotal}
                  payableGrandTotal={payableGrandTotal}
                  payments={formData.payments}
                  functionDate={formData.functionDate}
                  discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
                  isPartyOver={activeBookingObj?.status === 'completed'}
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
        </fieldset>

        <FinalizedVersionHistory
          historicalVersions={historicalVersions}
          halls={halls}
          items={items as MenuItemLike[]}
          templateMenus={templateMenus}
        />
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

      <BookingMenuEditorModal
        packKey={menuEditorPack}
        packRow={activeMenuPackRow}
        templateMenus={templateMenus}
        menuItemSearch={menuItemSearch}
        onMenuItemSearchChange={setMenuItemSearch}
        groupedMenuItems={groupedMenuItems}
        selectedMenuItemsByGroup={selectedMenuItemsByGroup}
        formDiff={formDiff}
        onImportTemplate={importTemplateToPack}
        onToggleMenuItem={togglePackMenuItem}
        onQuickAddItem={() => {
          setQuickItemForm({ name: '', itemTypeId: itemTypes[0]?.id || '', points: '' });
          setShowQuickAddItem(true);
        }}
        onClose={() => {
          setMenuEditorPack(null);
          setMenuItemSearch('');
        }}
      />

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
            <BookingsTableSkeleton
              rows={8}
              showActions={canExportMenuPdf || canEditBooking || canDeleteBooking}
            />
          </div>
        ) : totalBookingsCount === 0 ? (
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
                        onExportPdf={openMenuPdfModal}
                        onExportBookingPdf={handleDownloadBookingPdf}
                        bookingPdfLoading={bookingPdfLoading}
                        onEdit={stableOnEdit}
                        onDelete={stableOnDelete}
                      />
                    ))}
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalBookingsCount}
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
                          onExportPdf={openMenuPdfModal}
                          onExportBookingPdf={handleDownloadBookingPdf}
                          bookingPdfLoading={bookingPdfLoading}
                          onEdit={stableOnEdit}
                          onDelete={stableOnDelete}
                        />
                      ))}
                    </div>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalBookingsCount}
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
                totalItems={totalBookingsCount}
                pageSize={BOOKINGS_PAGE_SIZE}
                itemLabel="bookings"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {showFinalizeReview &&
        (() => {
          const enabledPacks = (Object.keys(formData.packs) as PackKey[])
            .map((key) => ({ key, row: formData.packs[key] }))
            .filter((entry) => entry.row.enabled);
          const hallNamesFor = (hallIds: string[]) =>
            hallIds
              .map((id) => halls.find((hall) => hall.id === id)?.name)
              .filter(Boolean)
              .join(', ');
          const customerLabel =
            customerSearchInputs.primary ||
            formatCustomerLabel(
              customers.find((customer) => customer.id === formData.customerId)
            ) ||
            '—';
          const paymentsTotal = formData.payments.reduce(
            (sum, p) => sum + (Number(p.amount) || 0),
            0
          );
          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/45"
                onClick={() => setShowFinalizeReview(false)}
                aria-label="Cancel finalize"
              />
              <div className="modal-panel relative bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-1)] mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
                    Review before finalizing
                  </h3>
                  <p className="text-sm text-[var(--text-3)]">
                    Finalizing saves the booking, locks this version permanently as
                    read-only, and creates a new editable replica.
                  </p>
                </div>

                <dl className="text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Customer</dt>
                    <dd className="font-medium text-[var(--text-1)] text-right">{customerLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Function</dt>
                    <dd className="font-medium text-[var(--text-1)] text-right">
                      {formData.functionType || '—'}
                      {formData.functionDate
                        ? ` · ${formatDateDDMMYYYY(formData.functionDate)}`
                        : ''}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-xl border border-[var(--border-2)] divide-y divide-[var(--border)] text-sm">
                  {enabledPacks.length === 0 && (
                    <p className="px-3 py-2.5 text-[var(--text-4)]">No meal packs enabled.</p>
                  )}
                  {enabledPacks.map(({ key, row }) => (
                    <div key={key} className="px-3 py-2.5">
                      <p className="font-medium text-[var(--text-1)]">
                        {PACK_LABELS[key]}
                        {row.startTime && row.endTime ? (
                          <span className="ml-2 text-xs font-normal text-[var(--text-3)]">
                            {row.startTime}–{row.endTime}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">
                        {hallNamesFor(row.hallIds) || 'No hall'}
                        {row.pax ? ` · ${row.pax} PAX` : ''}
                        {row.ratePerPlate
                          ? ` · ₹${Number(row.ratePerPlate).toLocaleString('en-IN')}/plate`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="text-sm space-y-1.5 border-t border-[var(--border)] pt-3">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Grand total</dt>
                    <dd className="font-semibold text-[var(--text-1)]">
                      ₹{Number(payableGrandTotal || 0).toLocaleString('en-IN')}
                    </dd>
                  </div>
                  {Number(formData.finalDiscountAmount) > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-3)]">Discount</dt>
                      <dd className="text-[var(--text-1)]">
                        ₹{Number(formData.finalDiscountAmount).toLocaleString('en-IN')}
                        {Number(formData.finalDiscountPercent) > 0
                          ? ` (${formData.finalDiscountPercent}%)`
                          : ''}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">
                      Payments recorded (incl. pending cheques)
                    </dt>
                    <dd className="text-[var(--text-1)]">
                      {formData.payments.length} · ₹{paymentsTotal.toLocaleString('en-IN')}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3 justify-end pt-1">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowFinalizeReview(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void confirmFinalizeBooking()}
                  >
                    {saving ? 'Working…' : 'Save & Finalize'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {saveConflict && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setSaveConflict(null)}
            aria-label="Dismiss conflict dialog"
          />
          <div className="modal-panel relative bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-1)] mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
                Booking changed by someone else
              </h3>
              <p className="text-sm text-[var(--text-3)]">
                This booking was updated
                {saveConflict.serverUpdatedAt
                  ? ` at ${new Date(saveConflict.serverUpdatedAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}{' '}
                while you were editing. Saving now would overwrite those changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSaveConflict(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSaveConflict(null);
                  if (editingBookingId) void openEditBooking(editingBookingId);
                }}
              >
                Reload latest (discard my edits)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  const pendingOpts = saveConflict.opts;
                  setSaveConflict(null);
                  void doSaveBooking({ ...pendingOpts, skipConflictCheck: true });
                }}
              >
                Save anyway (overwrite)
              </button>
            </div>
          </div>
        </div>
      )}

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
