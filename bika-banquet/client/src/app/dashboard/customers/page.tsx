'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useCustomersListQuery, useCustomersServerListQuery } from '@/lib/query/hooks';
import { usesServerPagination } from '@/lib/featureFlags';
import { normalizeSearchForServer, selectListData } from '@/lib/listQuery';
import { useSSE } from '@/hooks/useSSE';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Save,
  Phone,
  Mail,
  Users,
  Eye,
  Edit,
  Trash2,
  Star,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import FormPromptModal from '@/components/FormPromptModal';
import StatusBadge from '@/components/StatusBadge';
import Toolbar from '@/components/Toolbar';
import FloatingActionButton from '@/components/FloatingActionButton';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { TableSkeleton } from '@/components/Skeletons';
import FilterPanel from '@/components/FilterPanel';
import Combobox from '@/components/Combobox';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY, formatDateCompact } from '@/lib/date';
import { formatInrCompact } from '@/lib/indianAmountFormat';
import { useDebounce } from '@/lib/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import {
  customerSearchText,
  formatCustomerOptionLabel,
} from '@/lib/customerSearch';
import { lookupIndianPincode } from '@/lib/pincodeLookup';
import { INDIA_STATES } from '@/lib/indiaData';
import {
  CASTE_OPTIONS,
  COUNTRY_DIAL_CODE_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_PHONE_COUNTRY_ISO,
  EMAIL_REGEX,
  NAME_REGEX,
  PRIORITY_OPTIONS,
  digitsOnly,
  getCountryIsoByCode,
  getDialCodeOption,
  getExpectedPhoneDigits,
  getPhoneCodeByIso,
  sanitizeNameInput,
  validatePhoneNumberForCountry,
} from '@/lib/customerFormOptions';

interface CustomerFormData {
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

interface CustomerRow {
  id: string;
  name: string;
  phoneCountryCode?: string | null;
  phone: string;
  alterPhone?: string | null;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  _count?: {
    enquiries?: number;
    bookings?: number;
  };
}

interface CustomerDetailBooking {
  id: string;
  functionName: string;
  functionDate: string;
  status: string;
  grandTotal?: number | null;
}

interface CustomerDetailData {
  id: string;
  name: string;
  phone: string;
  phoneCountryCode?: string | null;
  alterPhone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  caste?: string | null;
  occupation?: string | null;
  companyName?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  dateOfBirth?: string | null;
  anniversary?: string | null;
  priority?: number | null;
  rating?: string | null;
  visitCount?: number | null;
  notes?: string | null;
  createdAt: string;
  referredBy?: { id: string; name: string } | null;
  referrals?: Array<{ id: string; name: string }>;
  bookings?: CustomerDetailBooking[];
}

function customerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function CustomerStars({ rating }: { rating?: string | null }) {
  const n = Number(rating || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  );
}

function CustomerDetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-4)]">{label}</p>
      <p className="text-sm text-[var(--text-1)] mt-0.5">{value || '—'}</p>
    </div>
  );
}

function CustomerDetailPanel({
  customer,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  customer: CustomerDetailData;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bookings = customer.bookings || [];
  const lifetimeValue = bookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const altPhone = customer.alterPhone || customer.alternatePhone;
  const location = [customer.city, customer.state].filter(Boolean).join(', ');

  return (
    <div>
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center text-base font-semibold text-white"
            style={{ width: 52, height: 52, background: 'var(--primary-600, #0d9488)' }}
          >
            {customerInitials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <CustomerStars rating={customer.rating} />
              <span className="text-xs text-[var(--text-3)]">
                {customer.visitCount ?? 0} visits
                {customer.occupation ? ` · ${customer.occupation}` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button type="button" className="btn btn-secondary text-xs px-2.5 py-1.5" onClick={onEdit}>
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn btn-secondary text-xs px-2.5 py-1.5"
                style={{ color: '#dc2626' }}
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            ['Lifetime value', formatInrCompact(lifetimeValue)],
            ['Bookings', String(bookings.length)],
            ['Priority', `${customer.priority ?? 3}/5`],
            ['Member since', formatDateDDMMYYYY(customer.createdAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-4)]">{k}</p>
              <p className="text-base font-semibold text-[var(--text-1)] mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 px-6 py-5">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Contact</h3>
          <div className="grid grid-cols-2 gap-3">
            <CustomerDetailField label="Phone" value={`${customer.phoneCountryCode || '+91'} ${customer.phone}`} />
            <CustomerDetailField label="Alt phone" value={altPhone} />
            <CustomerDetailField label="Email" value={customer.email} />
            <CustomerDetailField label="City" value={location || customer.city} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <CustomerDetailField label="Community" value={customer.caste} />
            <CustomerDetailField
              label="DOB"
              value={customer.dateOfBirth ? formatDateDDMMYYYY(customer.dateOfBirth) : null}
            />
            <CustomerDetailField
              label="Anniversary"
              value={customer.anniversary ? formatDateDDMMYYYY(customer.anniversary) : null}
            />
            <CustomerDetailField label="Company" value={customer.companyName} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Tax</h3>
          <div className="grid grid-cols-2 gap-3">
            <CustomerDetailField label="GST" value={customer.gstNumber} />
            <CustomerDetailField label="PAN" value={customer.panNumber} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Referrals</h3>
          <div className="grid grid-cols-2 gap-3">
            <CustomerDetailField label="Referred by" value={customer.referredBy?.name || 'Direct'} />
            <CustomerDetailField
              label="Referred"
              value={
                customer.referrals && customer.referrals.length
                  ? customer.referrals.map((r) => r.name).join(', ')
                  : 'None'
              }
            />
          </div>
        </section>
      </div>

      {customer.notes && (
        <div className="px-6 pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-2">Notes</h3>
          <p className="text-sm text-[var(--text-2)] leading-relaxed bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 whitespace-pre-wrap">
            {customer.notes}
          </p>
        </div>
      )}

      <div className="px-6 pb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-2">Booking history</h3>
        <div className="card overflow-hidden p-0">
          {bookings.length ? (
            <table className="data-table">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2.5 px-4 text-xs font-semibold text-[var(--text-3)]">Function</th>
                  <th className="py-2.5 px-4 text-xs font-semibold text-[var(--text-3)]">Date</th>
                  <th className="py-2.5 px-4 text-xs font-semibold text-[var(--text-3)] text-right">Total</th>
                  <th className="py-2.5 px-4 text-xs font-semibold text-[var(--text-3)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2.5 px-4 text-sm text-[var(--text-1)]">{b.functionName}</td>
                    <td className="py-2.5 px-4 text-sm text-[var(--text-2)] whitespace-nowrap">{formatDateCompact(b.functionDate)}</td>
                    <td className="py-2.5 px-4 text-sm text-right font-medium text-[var(--text-1)] num" title={`₹${(b.grandTotal || 0).toLocaleString('en-IN')}`}>
                      {formatInrCompact(b.grandTotal)}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--text-4)]">No bookings yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const initialFormData: CustomerFormData = {
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

const initialColumnSearch = {
  name: '',
  contact: '',
  location: '',
  stats: '',
  createdAt: '',
};

const CUSTOMERS_PAGE_SIZE = 100;

export default function CustomersPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewCustomer = hasAnyPermission(permissionSet, ['view_customer', 'manage_customers']);
  const canAddCustomer = hasAnyPermission(permissionSet, ['add_customer', 'manage_customers']);
  const canEditCustomer = hasAnyPermission(permissionSet, ['edit_customer', 'manage_customers']);
  const canDeleteCustomer = hasAnyPermission(permissionSet, ['delete_customer', 'manage_customers']);

  // Per-list runtime feature flag. When OFF, the legacy client-side path
  // (fetch-all + filterAndSortRows) runs verbatim. Resolved once on mount so
  // the two query hooks keep stable `enabled` values across renders.
  const [useServer] = useState(() => usesServerPagination('customers'));

  const {
    data: legacyCustomers = [],
    isLoading: legacyLoading,
    refetch: refetchLegacyCustomers,
    isError: legacyLoadError,
  } = useCustomersListQuery<CustomerRow[]>(canViewCustomer && !useServer);
  const [saving, setSaving] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isWhatsappDifferent, setIsWhatsappDifferent] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  // 300ms when server-paginating (fewer requests on slow phone networks);
  // 150ms preserved for the legacy in-memory path.
  const debouncedGlobalSearch = useDebounce(globalSearch, useServer ? 300 : 150);
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [emailFieldError, setEmailFieldError] = useState('');
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState('');
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<{
    phone?: string;
    alterPhone?: string;
    whatsappNumber?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailData | null>(null);
  const [selectedCustomerLoading, setSelectedCustomerLoading] = useState(false);
  const debouncedPincode = useDebounce(formData.pincode, 350);

  // Fold any active column search into the global server search so server
  // results stay a strict superset of today's client search.
  const serverSearch = useMemo(() => {
    const parts = [debouncedGlobalSearch, ...Object.values(columnSearch)]
      .map((v) => (v ?? '').trim())
      .filter(Boolean);
    return normalizeSearchForServer(parts.join(' '));
  }, [debouncedGlobalSearch, columnSearch]);

  const {
    data: serverData,
    isLoading: serverLoading,
    isError: serverLoadError,
    refetch: refetchServerCustomers,
  } = useCustomersServerListQuery<CustomerRow>(canViewCustomer && useServer, {
    page: currentPage,
    limit: CUSTOMERS_PAGE_SIZE,
    search: serverSearch,
    sort: sort.key,
    order: sort.direction,
  });

  const serverPrevRef = useRef<CustomerRow[] | undefined>(undefined);
  if (serverData?.rows) serverPrevRef.current = serverData.rows;
  const serverSelected = selectListData<CustomerRow>(
    serverData?.rows,
    serverPrevRef.current,
    serverLoadError
  );

  // Unified accessors so the rest of the component is path-agnostic.
  const customers: CustomerRow[] = useServer
    ? serverSelected.rows
    : legacyCustomers;
  const loading = useServer ? serverLoading : legacyLoading;
  const customersLoadError = useServer ? false : legacyLoadError;
  const refetchCustomers = useServer
    ? refetchServerCustomers
    : refetchLegacyCustomers;

  // Surface a retry toast (once) when a server fetch fails but we keep the
  // previous page on screen.
  useEffect(() => {
    if (useServer && serverLoadError) {
      toast.error('Failed to load customers. Showing last results.', {
        action: { label: 'Retry', onClick: () => void refetchServerCustomers() },
      });
    }
  }, [useServer, serverLoadError, refetchServerCustomers]);

  const tableColumns = useMemo<TableColumnConfig<CustomerRow>[]>(
    () => [
      {
        key: 'name',
        accessor: (customer) =>
          `${customer.name} ${customer.phoneCountryCode ?? ''} ${customer.phone}`,
      },
      {
        key: 'contact',
        accessor: (customer) =>
          `${customer.phoneCountryCode ?? ''} ${customer.phone} ${customer.email ?? ''}`,
      },
      {
        key: 'location',
        accessor: (customer) => `${customer.city ?? ''} ${customer.state ?? ''}`,
      },
      {
        key: 'stats',
        accessor: (customer) =>
          `${customer._count?.enquiries ?? 0} ${customer._count?.bookings ?? 0}`,
      },
      {
        key: 'createdAt',
        accessor: (customer) => customer.createdAt,
      },
    ],
    []
  );

  // Legacy (flag OFF) path: filter + sort + slice in memory.
  const clientFiltered = useMemo(
    () => filterAndSortRows(customers, tableColumns, debouncedGlobalSearch, columnSearch, sort),
    [customers, tableColumns, debouncedGlobalSearch, columnSearch, sort]
  );

  // Server path: `customers` is already the current page, server-filtered and
  // server-sorted. Totals come from the server pagination meta.
  const serverTotal = serverData?.pagination?.total ?? 0;
  const totalCount = useServer ? serverTotal : clientFiltered.length;

  const totalPages = useServer
    ? Math.max(1, serverData?.pagination?.totalPages ?? 1)
    : Math.max(1, Math.ceil(clientFiltered.length / CUSTOMERS_PAGE_SIZE));

  const filteredCustomers = useServer ? customers : clientFiltered;

  const paginatedCustomers = useMemo(() => {
    if (useServer) return customers; // already the current page
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * CUSTOMERS_PAGE_SIZE;
    return clientFiltered.slice(startIndex, startIndex + CUSTOMERS_PAGE_SIZE);
  }, [useServer, customers, currentPage, clientFiltered, totalPages]);

  const referrerOptions = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers]
  );

  // Hybrid referred-by picker. In server mode we query the server across ALL
  // customers (so anyone is findable) and pin the already-selected referrer so
  // the field is never blank when editing. In legacy mode the in-memory
  // referrerOptions are used (Combobox without onSearch).
  const [pinnedReferrer, setPinnedReferrer] = useState<CustomerRow | null>(null);

  useEffect(() => {
    if (!useServer) return;
    const id = formData.referredById;
    if (!id) {
      setPinnedReferrer(null);
      return;
    }
    if (pinnedReferrer?.id === id) return;
    let cancelled = false;
    void api
      .getCustomer(id)
      .then((res) => {
        const c = res?.data?.data?.customer;
        if (!cancelled && c) setPinnedReferrer(c as CustomerRow);
      })
      .catch(() => {
        /* leave unpinned on failure; field still works by id */
      });
    return () => {
      cancelled = true;
    };
  }, [useServer, formData.referredById, pinnedReferrer?.id]);

  const referrerToOption = useCallback(
    (customer: CustomerRow) => ({
      value: customer.id,
      label: formatCustomerOptionLabel(customer),
      secondary: customer.phone,
      searchText: customerSearchText(customer),
    }),
    []
  );

  const loadReferrersPage = useCallback(
    async (query: string, page: number) => {
      const trimmed = query.trim();
      // On open/empty: starter batch in default order. On typing (>=2 chars):
      // query the server across all customers. Either way the dropdown loads
      // the next page as the user scrolls (page 2, 3, …).
      const base =
        trimmed.length >= 2
          ? { search: normalizeSearchForServer(trimmed) }
          : { sort: 'name', order: 'asc' as const };
      const res = await api.getCustomers({ ...base, limit: 50, page });
      const rows = (res?.data?.data?.customers || []) as CustomerRow[];
      const totalPages = Math.max(1, res?.data?.data?.pagination?.totalPages ?? 1);
      // Pin the already-selected referrer only on the first page so the field
      // is never blank when editing; later pages append plain rows.
      const merged =
        page === 1 && pinnedReferrer
          ? [pinnedReferrer, ...rows.filter((r) => r.id !== pinnedReferrer.id)]
          : rows;
      return { options: merged.map(referrerToOption), hasMore: page < totalPages };
    },
    [pinnedReferrer, referrerToOption]
  );
  const primaryPhoneDigits = getExpectedPhoneDigits(formData.phoneCountryIso);
  const secondaryPhoneDigits = getExpectedPhoneDigits(formData.alterPhoneCountryIso);
  const whatsappPhoneDigits = getExpectedPhoneDigits(formData.whatsappCountryIso);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = customers.slice(0, 40).map((customer) => ({
      id: customer.id,
      name: customer.name || 'Customer',
      subtitle: customer.phone
        ? `${customer.phoneCountryCode || '+91'} ${customer.phone}`
        : undefined,
      href: `/dashboard/customers/${customer.id}`,
    }));
    window.localStorage.setItem('bika_palette_customers', JSON.stringify(payload));
  }, [customers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalSearch, columnSearch, sort]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!showCreatePrompt) return;

    const country = formData.country.trim().toLowerCase();
    const pincode = digitsOnly(debouncedPincode);

    if (country !== 'india' || !pincode || pincode.length !== 6) {
      setPincodeLookupLoading(false);
      setPincodeLookupError('');
      return;
    }

    const controller = new AbortController();

    const runLookup = async () => {
      try {
        setPincodeLookupLoading(true);
        setPincodeLookupError('');
        const result = await lookupIndianPincode(pincode, controller.signal);

        if (!result) {
          setPincodeLookupError('Could not find city/state for this PIN code.');
          return;
        }

        setFormData((prev) =>
          digitsOnly(prev.pincode) === pincode
            ? { ...prev, city: result.city, state: result.state }
            : prev
        );
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setPincodeLookupError('PIN lookup failed. Enter city/state manually.');
      } finally {
        if (!controller.signal.aborted) {
          setPincodeLookupLoading(false);
        }
      }
    };

    void runLookup();

    return () => controller.abort();
  }, [debouncedPincode, formData.country, showCreatePrompt]);

  const resetCreateForm = () => {
    setEditingCustomerId(null);
    setLoadingFormData(false);
    setFormData(initialFormData);
    setIsWhatsappDifferent(false);
    setEmailFieldError('');
    setPincodeLookupLoading(false);
    setPincodeLookupError('');
    setPhoneFieldErrors({});
  };

  const closeCreatePrompt = () => {
    if (saving || loadingFormData) {
      return;
    }
    setShowCreatePrompt(false);
    resetCreateForm();
  };

  const openCreatePrompt = () => {
    resetCreateForm();
    setShowCreatePrompt(true);
  };

  useEffect(() => {
    if (customersLoadError) {
      toast.error('Failed to load customers');
    }
  }, [customersLoadError]);

  const loadCustomers = useCallback(async () => {
    await refetchCustomers();
  }, [refetchCustomers]);

  const selectCustomer = useCallback(async (id: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerLoading(true);
    try {
      const response = await api.getCustomer(id);
      setSelectedCustomerDetail(response?.data?.data?.customer ?? null);
    } catch (error) {
      toast.error('Failed to load customer details');
      setSelectedCustomerDetail(null);
    } finally {
      setSelectedCustomerLoading(false);
    }
  }, []);

  // Auto-select the first row once results load, mirroring the design's
  // master-detail pattern (a customer is always shown on desktop).
  useEffect(() => {
    if (selectedCustomerId) return;
    const first = paginatedCustomers[0];
    if (first) void selectCustomer(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedCustomers]);

  const customersDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoadCustomers = useCallback(() => {
    if (customersDebounceTimerRef.current) clearTimeout(customersDebounceTimerRef.current);
    customersDebounceTimerRef.current = setTimeout(() => {
      void loadCustomers();
    }, 300);
  }, [loadCustomers]);
  useEffect(() => {
    return () => {
      if (customersDebounceTimerRef.current) clearTimeout(customersDebounceTimerRef.current);
    };
  }, []);
  useSSE(['customer:'], debouncedLoadCustomers, canViewCustomer);

  const handleColumnSearch = (key: keyof typeof initialColumnSearch, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = () => {
    setGlobalSearch('');
    setColumnSearch(initialColumnSearch);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await api.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      await loadCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const openEditPrompt = async (id: string) => {
    try {
      setLoadingFormData(true);
      setPhoneFieldErrors({});
      setEmailFieldError('');
      const response = await api.getCustomer(id);
      const customer = response?.data?.data?.customer;

      if (!customer) {
        toast.error('Customer not found');
        return;
      }

      const primaryCountryCode =
        customer.phoneCountryCode || getPhoneCodeByIso(DEFAULT_PHONE_COUNTRY_ISO);
      const alterPhone = customer.alterPhone || customer.alternatePhone || '';
      const whatsappNumber = customer.whatsappNumber || customer.whatsapp || '';
      const whatsappCountryCode =
        customer.whatsappCountryCode || primaryCountryCode;
      const isWhatsappDifferentFromPrimary = Boolean(whatsappNumber) &&
        (whatsappNumber !== (customer.phone || '') ||
          whatsappCountryCode !== primaryCountryCode);

      setEditingCustomerId(customer.id);
      setFormData({
        name: customer.name || '',
        phoneCountryIso: getCountryIsoByCode(primaryCountryCode),
        phone: customer.phone || '',
        alterPhoneCountryIso: getCountryIsoByCode(
          customer.alterPhoneCountryCode || primaryCountryCode
        ),
        alterPhone,
        whatsappCountryIso: getCountryIsoByCode(whatsappCountryCode),
        whatsappNumber: isWhatsappDifferentFromPrimary ? whatsappNumber : '',
        email: customer.email || '',
        caste: customer.caste || '',
        country: customer.country || 'India',
        pincode: customer.pincode || '',
        city: customer.city || '',
        state: customer.state || '',
        street1: customer.street1 || '',
        street2: customer.street2 || '',
        facebookProfile: customer.facebookProfile || '',
        instagramHandle: customer.instagramHandle || '',
        twitter: customer.twitter || '',
        linkedin: customer.linkedin || '',
        referredById: customer.referredById || '',
        priority:
          customer.priority !== null && customer.priority !== undefined
            ? String(customer.priority)
            : '3',
        rating: customer.rating || '0',
        notes: customer.notes || '',
      });
      setIsWhatsappDifferent(isWhatsappDifferentFromPrimary);
      setShowCreatePrompt(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to load customer details'
      );
    } finally {
      setLoadingFormData(false);
    }
  };

  const validateCreateForm = (): string | null => {
    const name = formData.name.trim();
    const phone = digitsOnly(formData.phone);
    const secondPhone = digitsOnly(formData.alterPhone);
    const whatsappNumber = digitsOnly(formData.whatsappNumber);
    const email = formData.email.trim();
    const pincode = digitsOnly(formData.pincode);

    if (!name) {
      return 'Full name is required';
    }
    if (!NAME_REGEX.test(name)) {
      return 'Name can contain only letters and spaces';
    }
    if (!phone) {
      setPhoneFieldErrors({ phone: 'Phone number is required' });
      return 'Phone number is required';
    }
    const primaryPhoneError = validatePhoneNumberForCountry(
      phone,
      formData.phoneCountryIso,
      'Phone number'
    );
    if (primaryPhoneError) {
      setPhoneFieldErrors({ phone: primaryPhoneError });
      return primaryPhoneError;
    }
    if (secondPhone) {
      const secondaryPhoneError = validatePhoneNumberForCountry(
        secondPhone,
        formData.alterPhoneCountryIso,
        '2nd phone number'
      );
      if (secondaryPhoneError) {
        setPhoneFieldErrors({ alterPhone: secondaryPhoneError });
        return secondaryPhoneError;
      }
    }
    if (email && !EMAIL_REGEX.test(email)) {
      setEmailFieldError('Email must contain @ and .');
      return 'Email must contain @ and .';
    }
    if (isWhatsappDifferent) {
      if (!whatsappNumber) {
        return 'WhatsApp number is required when different from phone';
      }
      const whatsappError = validatePhoneNumberForCountry(
        whatsappNumber,
        formData.whatsappCountryIso,
        'WhatsApp number'
      );
      if (whatsappError) {
        setPhoneFieldErrors({ whatsappNumber: whatsappError });
        return whatsappError;
      }
    }
    if (pincode && (pincode.length < 4 || pincode.length > 10)) {
      return 'PIN code must contain 4 to 10 digits';
    }

    setPhoneFieldErrors({});
    setEmailFieldError('');
    return null;
  };

  const getErrorMessage = (error: any, fallback: string) => {
    return (
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0]?.message ||
      fallback
    );
  };

  const buildCustomerPayload = () => {
    const name = formData.name.trim().replace(/\s+/g, ' ');
    const phone = digitsOnly(formData.phone);
    const alterPhone = digitsOnly(formData.alterPhone);
    const email = formData.email.trim();
    const whatsappNumber = isWhatsappDifferent
      ? digitsOnly(formData.whatsappNumber)
      : phone;
    const phoneCountryCode = getPhoneCodeByIso(formData.phoneCountryIso);
    const alterPhoneCountryCode = getPhoneCodeByIso(formData.alterPhoneCountryIso);
    const whatsappCountryCode = isWhatsappDifferent
      ? getPhoneCodeByIso(formData.whatsappCountryIso)
      : phoneCountryCode;
    const country = formData.country.trim();
    const city = formData.city.trim();
    const state = formData.state.trim();
    const pincode = digitsOnly(formData.pincode);
    const street1 = formData.street1.trim();
    const street2 = formData.street2.trim();
    const addressParts = [street1, street2, city, state, pincode, country].filter(
      Boolean
    );
    const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;

    return {
      name,
      phone,
      phoneCountryCode,
      email: email || undefined,
      alterPhone: alterPhone || undefined,
      alterPhoneCountryCode: alterPhone
        ? alterPhoneCountryCode
        : undefined,
      whatsappNumber: whatsappNumber || undefined,
      whatsappCountryCode: whatsappNumber ? whatsappCountryCode : undefined,
      caste: formData.caste || undefined,
      country: country || undefined,
      pincode: pincode || undefined,
      city: city || undefined,
      state: state || undefined,
      street1: street1 || undefined,
      street2: street2 || undefined,
      address,
      facebookProfile: formData.facebookProfile.trim() || undefined,
      instagramHandle: formData.instagramHandle.trim() || undefined,
      twitter: formData.twitter.trim() || undefined,
      linkedin: formData.linkedin.trim() || undefined,
      referredById: formData.referredById || undefined,
      priority: formData.priority ? Number(formData.priority) : undefined,
      rating: formData.rating || undefined,
      notes: formData.notes.trim() || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailFieldError('');
    setPhoneFieldErrors({});
    const validationError = validateCreateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = buildCustomerPayload();
      if (editingCustomerId) {
        await api.updateCustomer(editingCustomerId, payload);
      } else {
        await api.createCustomer(payload);
      }
      toast.success(
        editingCustomerId
          ? 'Customer updated successfully'
          : 'Customer created successfully'
      );
      setShowCreatePrompt(false);
      resetCreateForm();
      await loadCustomers();
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
        setPhoneFieldErrors(nextErrors);
        setEmailFieldError(nextEmailError);
      }
      const message = getErrorMessage(
        error,
        editingCustomerId ? 'Failed to update customer' : 'Failed to create customer'
      );
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Customers"
        stats={[
          { label: 'Total', value: totalCount },
          { label: 'Active filters', value: Object.values(columnSearch).filter(Boolean).length },
        ]}
        actions={
          canAddCustomer ? (
            <button
              type="button"
              onClick={openCreatePrompt}
              className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          ) : null
        }
      />

      {!canViewCustomer && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view customers.
        </div>
      )}

      <FormPromptModal
        open={showCreatePrompt}
        title={editingCustomerId ? 'Edit Customer' : 'Add Customer'}
        onClose={closeCreatePrompt}
        widthClass="max-w-6xl"
      >
        {loadingFormData ? (
          <div className="py-6">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7" noValidate>
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-1)]">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="label">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
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
                    <Combobox
                      value={formData.phoneCountryIso}
                      onChange={(nextIso) => {
                        const digits = getExpectedPhoneDigits(nextIso);
                        setPhoneFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        setFormData((prev) => ({
                          ...prev,
                          phoneCountryIso: nextIso,
                          phone: prev.phone.slice(0, digits),
                          whatsappCountryIso: isWhatsappDifferent
                            ? prev.whatsappCountryIso
                            : nextIso,
                        }));
                      }}
                      options={COUNTRY_DIAL_CODE_OPTIONS.map((option) => ({
                        value: option.iso2,
                        label: `${option.flag} ${option.country} (${option.code})`,
                      }))}
                    />
                    <input
                      value={formData.phone}
                      onChange={(e) => {
                        setPhoneFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        setFormData((prev) => ({
                          ...prev,
                          phone: digitsOnly(e.target.value).slice(0, primaryPhoneDigits),
                        }));
                      }}
                      className="input"
                      placeholder={`${primaryPhoneDigits}-digit number`}
                      inputMode="numeric"
                      minLength={primaryPhoneDigits}
                      maxLength={primaryPhoneDigits}
                      required
                    />
                  </div>
                  {phoneFieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{phoneFieldErrors.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-4)]">
                    {getDialCodeOption(formData.phoneCountryIso).country} numbers must be{' '}
                    {primaryPhoneDigits} digits.
                  </p>
                </div>
                <div className="md:col-span-4">
                  <label className="label">2nd Phone No.</label>
                  <div className="grid grid-cols-[180px,1fr] gap-2">
                    <Combobox
                      value={formData.alterPhoneCountryIso}
                      onChange={(nextIso) => {
                        const digits = getExpectedPhoneDigits(nextIso);
                        setPhoneFieldErrors((prev) => ({ ...prev, alterPhone: undefined }));
                        setFormData((prev) => ({
                          ...prev,
                          alterPhoneCountryIso: nextIso,
                          alterPhone: prev.alterPhone.slice(0, digits),
                        }));
                      }}
                      options={COUNTRY_DIAL_CODE_OPTIONS.map((option) => ({
                        value: option.iso2,
                        label: `${option.flag} ${option.country} (${option.code})`,
                      }))}
                    />
                    <input
                      value={formData.alterPhone}
                      onChange={(e) => {
                        setPhoneFieldErrors((prev) => ({ ...prev, alterPhone: undefined }));
                        setFormData((prev) => ({
                          ...prev,
                          alterPhone: digitsOnly(e.target.value).slice(0, secondaryPhoneDigits),
                        }));
                      }}
                      className="input"
                      placeholder={`${secondaryPhoneDigits}-digit number`}
                      inputMode="numeric"
                      maxLength={secondaryPhoneDigits}
                    />
                  </div>
                  {phoneFieldErrors.alterPhone && (
                    <p className="mt-1 text-xs text-red-600">{phoneFieldErrors.alterPhone}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-4)]">
                    Optional. If entered, it must be exactly {secondaryPhoneDigits} digits.
                  </p>
                </div>
                <div className="md:col-span-4">
                  <label className="label">Caste</label>
                  <Combobox
                    value={formData.caste}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, caste: val }))
                    }
                    options={CASTE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                    placeholder="None"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setEmailFieldError('');
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                    }}
                    className="input"
                    placeholder="name@example.com"
                  />
                  {emailFieldError && (
                    <p className="mt-1 text-xs text-red-600">{emailFieldError}</p>
                  )}
                </div>
                <div className="md:col-span-4 flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)] pb-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border-2)] text-primary-600 focus:ring-primary-500"
                      checked={isWhatsappDifferent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsWhatsappDifferent(checked);
                        if (!checked) {
                          setPhoneFieldErrors((prev) => ({
                            ...prev,
                            whatsappNumber: undefined,
                          }));
                          setFormData((prev) => ({
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
                {isWhatsappDifferent && (
                  <div className="md:col-span-4">
                    <label className="label">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-[180px,1fr] gap-2">
                      <Combobox
                        value={formData.whatsappCountryIso}
                        onChange={(nextIso) => {
                          const digits = getExpectedPhoneDigits(nextIso);
                          setPhoneFieldErrors((prev) => ({
                            ...prev,
                            whatsappNumber: undefined,
                          }));
                          setFormData((prev) => ({
                            ...prev,
                            whatsappCountryIso: nextIso,
                            whatsappNumber: prev.whatsappNumber.slice(0, digits),
                          }));
                        }}
                        options={COUNTRY_DIAL_CODE_OPTIONS.map((option) => ({
                          value: option.iso2,
                          label: `${option.flag} ${option.country} (${option.code})`,
                        }))}
                      />
                      <input
                        value={formData.whatsappNumber}
                        onChange={(e) => {
                          setPhoneFieldErrors((prev) => ({
                            ...prev,
                            whatsappNumber: undefined,
                          }));
                          setFormData((prev) => ({
                            ...prev,
                            whatsappNumber: digitsOnly(e.target.value).slice(
                              0,
                              whatsappPhoneDigits
                            ),
                          }));
                        }}
                        className="input"
                        placeholder={`${whatsappPhoneDigits}-digit number`}
                        inputMode="numeric"
                        minLength={whatsappPhoneDigits}
                        maxLength={whatsappPhoneDigits}
                        required
                      />
                    </div>
                    {phoneFieldErrors.whatsappNumber && (
                      <p className="mt-1 text-xs text-red-600">
                        {phoneFieldErrors.whatsappNumber}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-4)]">
                      Must be exactly {whatsappPhoneDigits} digits.
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
                  <Combobox
                    value={formData.country}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, country: val }))
                    }
                    options={COUNTRY_OPTIONS.map((country) => ({ value: country, label: country }))}
                    placeholder="Select country"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">PIN Code</label>
                  <input
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pincode: digitsOnly(e.target.value),
                      }))
                    }
                    className="input"
                    placeholder="PIN code"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {formData.country.trim().toLowerCase() === 'india' && (
                    <p className="mt-1 text-xs text-[var(--text-4)]">
                      {pincodeLookupLoading
                        ? 'Looking up city and state...'
                        : 'Enter a 6-digit Indian PIN code to auto-fill city and state.'}
                    </p>
                  )}
                  {pincodeLookupError && (
                    <p className="mt-1 text-xs text-red-600">{pincodeLookupError}</p>
                  )}
                </div>
                <div className="md:col-span-4">
                  <label className="label">State</label>
                  {formData.country.trim().toLowerCase() === 'india' ? (
                    <select
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
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
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="input"
                      placeholder="State"
                    />
                  )}
                </div>
                <div className="md:col-span-4">
                  <label className="label">City</label>
                  <input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="input"
                    placeholder="City"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">Street One</label>
                  <input
                    value={formData.street1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, street1: e.target.value }))
                    }
                    className="input"
                    placeholder="Street one"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">Street Two</label>
                  <input
                    value={formData.street2}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, street2: e.target.value }))
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
                    value={formData.facebookProfile}
                    onChange={(e) =>
                      setFormData((prev) => ({
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
                    value={formData.instagramHandle}
                    onChange={(e) =>
                      setFormData((prev) => ({
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
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, twitter: e.target.value }))
                    }
                    className="input"
                    placeholder="Twitter"
                  />
                </div>
                <div>
                  <label className="label">LinkedIn</label>
                  <input
                    value={formData.linkedin}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, linkedin: e.target.value }))
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
                    value={formData.referredById}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        referredById: val,
                      }))
                    }
                    options={(useServer
                      ? pinnedReferrer
                        ? [pinnedReferrer]
                        : []
                      : referrerOptions
                    ).map(referrerToOption)}
                    loadPage={useServer ? loadReferrersPage : undefined}
                    placeholder="Search name or phone"
                    searchPlaceholder="Name or phone number"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">Priority</label>
                  <Combobox
                    value={formData.priority}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, priority: val }))
                    }
                    options={PRIORITY_OPTIONS}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="label">Rating</label>
                  <div className="h-11 flex items-center gap-1 rounded-xl border border-[var(--border)] px-3">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const current = Number(formData.rating || '0');
                      const active = value <= current;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              rating: prev.rating === String(value) ? '0' : String(value),
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
                      onClick={() => setFormData((prev) => ({ ...prev, rating: '0' }))}
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
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
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
                onClick={closeCreatePrompt}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <span className="inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving
                    ? 'Saving...'
                    : editingCustomerId
                      ? 'Update Customer'
                      : 'Create Customer'}
                </span>
              </button>
            </div>
          </form>
        )}
      </FormPromptModal>

      <div className="card">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-4)]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Overall search across all customer columns..."
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
        </div>
      </div>

      <div className="card">
        {!canViewCustomer ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <Users size={22} />
            </div>
            <p className="empty-state-title">No data available</p>
            <p className="empty-state-desc">You do not have access to view customers.</p>
          </div>
        ) : loading ? (
          <div className="py-6">
            <TableSkeleton rows={8} />
          </div>
        ) : totalCount === 0 ? (
          <EmptyState
            icon={globalSearch ? Search : Users}
            variant={
              globalSearch
                ? 'search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'filter'
                  : 'page'
            }
            title={
              globalSearch
                ? 'No customers match your search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'No matches'
                  : 'No customers found'
            }
            description={
              globalSearch || Object.values(columnSearch).some(Boolean)
                ? `"${globalSearch || Object.values(columnSearch).find(Boolean)}" returned no results.`
                : 'Add your first customer to get started.'
            }
            action={
              globalSearch
                ? { label: 'Clear search', onClick: () => setGlobalSearch('') }
                : Object.values(columnSearch).some(Boolean)
                  ? { label: 'Clear filters', onClick: () => setColumnSearch(initialColumnSearch) }
                  : canAddCustomer
                    ? { label: 'New Customer', onClick: openCreatePrompt }
                    : undefined
            }
          />
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                {paginatedCustomers.map((customer) => (
                  <div key={customer.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-card-title">{customer.name}</div>
                      </div>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Phone</span>
                      <span className="mobile-card-value">
                        {(customer.phoneCountryCode || '+91') + ' ' + customer.phone}
                      </span>
                    </div>
                    {customer.email && (
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Email</span>
                        <span className="mobile-card-value">{customer.email}</span>
                      </div>
                    )}
                    {(customer.city || customer.state) && (
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Location</span>
                        <span className="mobile-card-value">
                          {customer.city && customer.state
                            ? `${customer.city}, ${customer.state}`
                            : customer.city || customer.state}
                        </span>
                      </div>
                    )}
                    <div className="mobile-card-meta" style={{ marginTop: 8 }}>
                      <span className="mobile-card-meta-item">
                        {customer._count?.enquiries ?? 0} enquiries
                      </span>
                      <span className="mobile-card-meta-item">
                        {customer._count?.bookings ?? 0} bookings
                      </span>
                    </div>
                    <div className="mobile-card-actions">
                      {canViewCustomer && (
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="mobile-card-action-btn"
                        >
                          <Eye style={{ width: 14, height: 14 }} aria-hidden="true" />
                          View
                        </Link>
                      )}
                      {canEditCustomer && (
                        <button
                          type="button"
                          className="mobile-card-action-btn"
                          onClick={() => void openEditPrompt(customer.id)}
                        >
                          <Edit style={{ width: 14, height: 14 }} aria-hidden="true" />
                          Edit
                        </button>
                      )}
                      {canDeleteCustomer && (
                        <button
                          type="button"
                          className="mobile-card-action-btn"
                          onClick={() => handleDelete(customer.id)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalCount > CUSTOMERS_PAGE_SIZE && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--text-2)]">
                    Showing {(currentPage - 1) * CUSTOMERS_PAGE_SIZE + 1}-
                    {Math.min(currentPage * CUSTOMERS_PAGE_SIZE, totalCount)} of{' '}
                    {totalCount} customers
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[var(--text-2)]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop master-detail split view */}
            <div className="hidden md:flex" style={{ height: 640, border: '1px solid var(--border)', borderRadius: 'var(--radius, 12px)', overflow: 'hidden' }}>
              <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {paginatedCustomers.map((customer) => {
                    const isSelected = selectedCustomerId === customer.id;
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => void selectCustomer(customer.id)}
                        className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 border-b border-[var(--border)] transition-colors ${
                          isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-[var(--surface-2)]'
                        }`}
                        style={{ borderLeft: `2px solid ${isSelected ? 'var(--primary-600, #0d9488)' : 'transparent'}` }}
                      >
                        <div
                          className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ width: 34, height: 34, background: 'var(--surface-3, var(--surface-2))', color: 'var(--text-2)' }}
                        >
                          {customerInitials(customer.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-1)] truncate">{customer.name}</p>
                          <p className="text-xs text-[var(--text-3)]">
                            {(customer.phoneCountryCode || '+91') + ' ' + customer.phone}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[11px] text-[var(--text-3)]">
                            {customer._count?.bookings ?? 0} bookings
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {totalCount > CUSTOMERS_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      className="btn btn-secondary text-xs px-2.5 py-1.5"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Prev
                    </button>
                    <span className="text-xs text-[var(--text-3)]">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary text-xs px-2.5 py-1.5"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-y-auto">
                {selectedCustomerLoading ? (
                  <div className="py-6 px-6">
                    <TableSkeleton rows={5} />
                  </div>
                ) : selectedCustomerDetail ? (
                  <CustomerDetailPanel
                    customer={selectedCustomerDetail}
                    canEdit={canEditCustomer}
                    canDelete={canDeleteCustomer}
                    onEdit={() => void openEditPrompt(selectedCustomerDetail.id)}
                    onDelete={() => handleDelete(selectedCustomerDetail.id)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-[var(--text-3)]">
                    Select a customer
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {canAddCustomer && (
        <FloatingActionButton
          onClick={openCreatePrompt}
          label="New Customer"
        />
      )}

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeCount={Object.values(columnSearch).filter(Boolean).length}
        onClearAll={() => setColumnSearch({ name: '', contact: '', location: '', stats: '', createdAt: '' })}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Search name or phone" value={columnSearch.name} onChange={(e) => handleColumnSearch('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Contact</label>
            <input className="input" placeholder="Search contact" value={columnSearch.contact} onChange={(e) => handleColumnSearch('contact', e.target.value)} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Search location" value={columnSearch.location} onChange={(e) => handleColumnSearch('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Stats</label>
            <input className="input" placeholder="Search stats" value={columnSearch.stats} onChange={(e) => handleColumnSearch('stats', e.target.value)} />
          </div>
          <div>
            <label className="label">Created Date</label>
            <input type="date" className="input" value={columnSearch.createdAt} onChange={(e) => handleColumnSearch('createdAt', e.target.value)} />
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
