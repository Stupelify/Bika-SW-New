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
import { formatDateDDMMYYYY, formatDateCompact } from '@/lib/date';
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
  resolveDueAmount,
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
import StatusBadge, { getRowStatusClass } from '@/components/StatusBadge';
import Toolbar from '@/components/Toolbar';
import BookingPaymentsLedger from '@/components/BookingPaymentsLedger';
import BookingFinancialSummary from '@/components/BookingFinancialSummary';
import FinalizedVersionHistory from '@/components/booking/FinalizedVersionHistory';
import BookingPartyOverForm from '@/components/BookingPartyOverForm';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import BookingTermsSection from '@/components/booking/BookingTermsSection';
import BookingMenuEditorModal from '@/components/booking/BookingMenuEditorModal';
import BookingPackTable from '@/components/booking/BookingPackTable';
import BookingPackMobileCards from '@/components/booking/BookingPackMobileCards';
import { IndianAmountInput } from '@/components/IndianAmountInput';

import {
  BOOKING_SAVED_VIEWS,
  BOOKINGS_PAGE_SIZE,
  FUNCTION_TYPE_OPTIONS,
  LONGEST_FUNCTION_TYPE_OPTION,
  PACK_LABELS,
  PRIMARY_CUSTOMER_FIELD_CH,
  compareCustomersByName,
  computePencilExpiry,
  formatCustomerLabel,
  formatInrCompact,
  initialColumnSearch,
  initialFormData,
  initialInlineCustomerFormData,
  pencilExpiryDays,
  type AmountSyncMode,
  type Booking,
  type BookingMenuPackOption,
  type CustomerOption,
  type CustomerSearchField,
  type CustomerSearchInputState,
  type InlineCustomerFormData,
  type ItemOption,
  type TemplateMenuOption,
} from './_lib/types';
import QuickCustomerModal from './_components/QuickCustomerModal';
import MenuPdfModal from './_components/MenuPdfModal';
import BookingsListSection from './_components/BookingsListSection';
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
  const [savedView, setSavedView] = useState<string>('all');
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
  const [menuPdfBooking, setMenuPdfBooking] = useState<Booking | null>(null);
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const isFormDirtyRef = useRef(false);
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

  const activeSavedView = useMemo(
    () => BOOKING_SAVED_VIEWS.find((v) => v.id === savedView) ?? BOOKING_SAVED_VIEWS[0],
    [savedView]
  );

  const viewBookings = useMemo(
    () => (activeSavedView.fn ? paginatedBookings.filter(activeSavedView.fn) : paginatedBookings),
    [paginatedBookings, activeSavedView]
  );

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
    setShowAddCustomerForm(true);
  };

  const handleQuickCustomerCreated = async (
    createdCustomerId: string | undefined,
    match: { name: string; phone: string }
  ) => {
    const updatedCustomers = await loadCustomerOptions();
    const createdCustomer = createdCustomerId
      ? updatedCustomers.find((customer) => customer.id === createdCustomerId)
      : updatedCustomers.find(
        (customer) =>
          customer.name === match.name &&
          (customer.phone || '') === match.phone
      );

    if (createdCustomer) {
      setCustomerIdForField('primary', createdCustomer.id);
      setCustomerSearchInputs((prev) => ({
        ...prev,
        primary: formatCustomerLabel(createdCustomer),
      }));
      setActiveCustomerSearchField(null);
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

  const bookingsValueInView = useMemo(
    () => viewBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
    [viewBookings]
  );

  const bookingsOutstandingInView = useMemo(
    () => viewBookings.reduce((sum, b) => sum + resolveDueAmount(b), 0),
    [viewBookings]
  );

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Bookings"
        stats={[
          { label: 'In view', value: viewBookings.length },
          { label: 'Value in view', value: formatInrCompact(bookingsValueInView) },
          {
            label: 'Outstanding',
            value: (
              <span
                className={
                  bookingsOutstandingInView > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }
              >
                {formatInrCompact(bookingsOutstandingInView)}
              </span>
            ),
          },
        ]}
        actions={
          <>
            <div className="ops-toolbar-search">
              <Search className="w-4 h-4" aria-hidden="true" />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Search..."
                aria-label="Search bookings"
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary ops-filter-button"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.values(columnSearch).filter(Boolean).length > 0 && (
                <span className="ops-filter-count">
                  {Object.values(columnSearch).filter(Boolean).length}
                </span>
              )}
            </button>
            {canAddBooking ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary inline-flex items-center gap-2 justify-center"
              >
                <Plus className="w-4 h-4" />
                New booking
              </button>
            ) : null}
          </>
        }
      />

      {!canViewBooking && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view bookings.
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
                    if (b) setMenuPdfBooking(b);
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
              <BookingPackMobileCards
                formData={formData}
                setFormData={setFormData}
                formDiff={formDiff}
                halls={halls}
                banquets={banquets}
                openHallPickerPack={openHallPickerPack}
                setOpenHallPickerPack={setOpenHallPickerPack}
                hallPickerContainerRef={hallPickerContainerRef}
                updatePackRow={updatePackRow}
                setMenuEditorPack={setMenuEditorPack}
                setMenuItemSearch={setMenuItemSearch}
                formatComputedAmount={formatComputedAmount}
                packRowAmount={packRowAmount}
                enabledPackAmountRows={enabledPackAmountRows}
                billingTotals={billingTotals}
                mealsBillBase={mealsBillBase}
                payableGrandTotal={payableGrandTotal}
                setAmountSyncMode={setAmountSyncMode}
                setDiscountManuallySet={setDiscountManuallySet}
                normalizeAmountSnapshot={normalizeAmountSnapshot}
                isReadOnlyBooking={isReadOnlyBooking}
                setIsFormDirty={setIsFormDirty}
              />
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

      <QuickCustomerModal
        open={showAddCustomerForm}
        onClose={() => setShowAddCustomerForm(false)}
        canAddCustomer={canAddCustomer}
        referrerOptions={customerReferrerOptions}
        onCreated={handleQuickCustomerCreated}
      />

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

      <MenuPdfModal
        booking={menuPdfBooking}
        onClose={() => setMenuPdfBooking(null)}
      />

      <BookingsListSection
        canViewBooking={canViewBooking}
        canAddBooking={canAddBooking}
        canEditBooking={canEditBooking}
        canDeleteBooking={canDeleteBooking}
        canExportMenuPdf={canExportMenuPdf}
        loading={loading}
        bookingPdfLoading={bookingPdfLoading}
        savedView={savedView}
        setSavedView={setSavedView}
        viewMode={viewMode}
        setViewMode={setViewMode}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        columnSearch={columnSearch}
        setColumnSearch={setColumnSearch}
        handleColumnSearch={handleColumnSearch}
        clearSearch={clearSearch}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalBookingsCount={totalBookingsCount}
        viewBookings={viewBookings}
        openEditBooking={(id) => void openEditBooking(id)}
        stableOnEdit={stableOnEdit}
        stableOnDelete={stableOnDelete}
        handleDeleteBooking={(id) => void handleDeleteBooking(id)}
        handleDownloadBookingPdf={(b) => void handleDownloadBookingPdf(b)}
        setMenuPdfBooking={setMenuPdfBooking}
        setShowCreateForm={setShowCreateForm}
        setShowFilters={setShowFilters}
      />

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
