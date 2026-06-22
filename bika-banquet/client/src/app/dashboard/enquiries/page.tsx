'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, fetchAllCustomers } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import {
  customerSearchText,
  formatCustomerOptionLabel,
} from '@/lib/customerSearch';
import { toast } from 'sonner';
import { CalendarDays, Edit, PhoneCall, Plus, Save, Search, Trash2, Users, Filter, Download } from 'lucide-react';
import Combobox from '@/components/Combobox';
import Toolbar from '@/components/Toolbar';
import FloatingActionButton from '@/components/FloatingActionButton';
import FormPromptModal from '@/components/FormPromptModal';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { ColumnFilter, DateRangeFilter } from '@/components/data-table/filter-controls';
import { buildListUrl } from '@/lib/urlListState';
import { downloadBlob } from '@/lib/download';
import { Button } from '@/components/shadcn/button';
import TablePagination from '@/components/TablePagination';
import { TableSkeleton } from '@/components/Skeletons';
import {
  useEnquiriesListQuery,
  useEnquiriesServerListQuery,
  useUpdateEnquiryMutation,
} from '@/lib/query/hooks';
import { usesServerPagination } from '@/lib/featureFlags';
import { normalizeSearchForServer, selectListData } from '@/lib/listQuery';
import FilterPanel from '@/components/FilterPanel';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY, formatDateCompact } from '@/lib/date';
import { useDebounce } from '@/lib/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import StatusBadge, { getRowStatusClass } from '@/components/StatusBadge';

interface Enquiry {
  id: string;
  customerId: string;
  functionName: string;
  functionType: string;
  functionDate: string;
  functionTime?: string;
  startTime?: string;
  endTime?: string;
  expectedGuests: number;
  status: string;
  note?: string;
  notes?: string;
  quotation?: boolean;
  quotationSent?: boolean;
  pencilBooking?: boolean;
  isPencilBooked?: boolean;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  halls?: Array<{
    id: string;
    hall?: {
      id: string;
      name: string;
    };
  }>;
  packs?: Array<{
    id: string;
    packCount?: number;
    noOfPack?: number;
    mealSlot?: {
      name: string;
    };
    templateMenu?: {
      id: string;
      name: string;
    };
  }>;
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
}

interface HallOption {
  id: string;
  name: string;
}

interface TemplateMenuOption {
  id: string;
  name: string;
}

type PackKey = 'breakfast' | 'lunch' | 'hiTea' | 'dinner';

interface PackRowFormData {
  enabled: boolean;
  people: string;
  templateMenuId: string;
}

interface EnquiryFormData {
  customerId: string;
  functionType: string;
  functionDate: string;
  hallId: string;
  startTime: string;
  endTime: string;
  quotationRequired: 'yes' | 'no';
  pencilBooking: 'yes' | 'no';
  note: string;
  packs: Record<PackKey, PackRowFormData>;
}

const initialFormData: EnquiryFormData = {
  customerId: '',
  functionType: '',
  functionDate: '',
  hallId: '',
  startTime: '08:00',
  endTime: '15:00',
  quotationRequired: 'no',
  pencilBooking: 'no',
  note: '',
  packs: {
    breakfast: { enabled: false, people: '', templateMenuId: '' },
    lunch: { enabled: false, people: '', templateMenuId: '' },
    hiTea: { enabled: false, people: '', templateMenuId: '' },
    dinner: { enabled: false, people: '', templateMenuId: '' },
  },
};

const PACK_LABELS: Record<PackKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  hiTea: 'Hi-Tea',
  dinner: 'Dinner',
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
};

const ENQUIRIES_PAGE_SIZE = 75;

export default function EnquiriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewEnquiry = hasAnyPermission(permissionSet, ['view_enquiry', 'manage_enquiries']);
  const canAddEnquiry = hasAnyPermission(permissionSet, ['add_enquiry', 'manage_enquiries']);
  const canEditEnquiry = hasAnyPermission(permissionSet, ['edit_enquiry', 'manage_enquiries']);
  const canDeleteEnquiry = hasAnyPermission(permissionSet, ['delete_enquiry', 'manage_enquiries']);
  // Filter/search/sort state is hydrated from the URL on mount and synced back
  // by the effect below, so reloads restore the view and links are shareable.
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '');

  const [useServer] = useState(() => usesServerPagination('enquiries'));
  const {
    data: legacyEnquiries = [],
    isLoading: legacyLoading,
    refetch: refetchLegacyEnquiries,
    isError: legacyLoadError,
  } = useEnquiriesListQuery<Enquiry[]>(canViewEnquiry && !useServer, status);
  const updateEnquiryMutation = useUpdateEnquiryMutation(status);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState(() => searchParams.get('q') ?? '');
  const debouncedGlobalSearch = useDebounce(globalSearch, useServer ? 300 : 150);
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortState>(() => {
    const key = searchParams.get('sort');
    return key
      ? { key, direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc' }
      : { key: 'functionName', direction: 'asc' };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(ENQUIRIES_PAGE_SIZE);
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem('bika_enquiries_page_size'));
      if (Number.isInteger(saved) && saved > 0) setPageSize(saved);
    } catch {
      // ignore storage access errors
    }
  }, []);
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    try {
      window.localStorage.setItem('bika_enquiries_page_size', String(size));
    } catch {
      // ignore storage access errors
    }
  }, []);
  const [formData, setFormData] = useState<EnquiryFormData>(initialFormData);

  const serverSearch = useMemo(() => {
    const parts = [debouncedGlobalSearch, ...Object.values(columnSearch)]
      .map((v) => (v ?? '').trim())
      .filter(Boolean);
    return normalizeSearchForServer(parts.join(' '));
  }, [debouncedGlobalSearch, columnSearch]);

  // Export the current filtered view to CSV (full set, server-side).
  const [exporting, setExporting] = useState(false);
  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);
      const res = await api.exportEnquiriesCsv({
        search: serverSearch,
        status: status || undefined,
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
        sort: sort.key,
        order: sort.direction,
      });
      downloadBlob(res.data as Blob, `enquiries-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [serverSearch, status, dateFrom, dateTo, sort.key, sort.direction]);

  const {
    data: serverData,
    isLoading: serverLoading,
    isError: serverLoadError,
    refetch: refetchServerEnquiries,
  } = useEnquiriesServerListQuery<Enquiry>(canViewEnquiry && useServer, {
    page: currentPage,
    limit: pageSize,
    search: serverSearch,
    sort: sort.key,
    order: sort.direction,
    status: status || undefined,
    fromDate: dateFrom || undefined,
    toDate: dateTo || undefined,
  });

  const serverPrevRef = useRef<Enquiry[] | undefined>(undefined);
  if (serverData?.rows) serverPrevRef.current = serverData.rows;
  const serverSelected = selectListData<Enquiry>(
    serverData?.rows,
    serverPrevRef.current,
    serverLoadError
  );

  const enquiries: Enquiry[] = useServer ? serverSelected.rows : legacyEnquiries;
  const loading = useServer ? serverLoading : legacyLoading;
  const enquiriesLoadError = useServer ? false : legacyLoadError;
  const refetchEnquiries = useServer ? refetchServerEnquiries : refetchLegacyEnquiries;

  useEffect(() => {
    if (useServer && serverLoadError) {
      toast.error('Failed to load enquiries. Showing last results.', {
        action: { label: 'Retry', onClick: () => void refetchServerEnquiries() },
      });
    }
  }, [useServer, serverLoadError, refetchServerEnquiries]);

  const tableColumns = useMemo<TableColumnConfig<Enquiry>[]>(
    () => [
      {
        key: 'functionName',
        accessor: (enquiry) => `${enquiry.functionName} ${enquiry.functionType}`,
      },
      {
        key: 'customer',
        accessor: (enquiry) =>
          customerSearchText({
            name: enquiry.customer?.name,
            phone: enquiry.customer?.phone,
          }),
      },
      {
        key: 'functionDate',
        accessor: (enquiry) => enquiry.functionDate,
      },
      {
        key: 'expectedGuests',
        accessor: (enquiry) => enquiry.expectedGuests,
      },
      {
        key: 'status',
        accessor: (enquiry) =>
          `${enquiry.status} ${enquiry.quotationSent ? 'Quotation' : ''} ${enquiry.isPencilBooked ? 'Pencil' : ''
          }`,
      },
    ],
    []
  );

  const clientFiltered = useMemo(() => {
    const rows = filterAndSortRows(enquiries, tableColumns, debouncedGlobalSearch, columnSearch, sort);
    if (!dateFrom && !dateTo) return rows;
    return rows.filter((e) => {
      const day = (e.functionDate || '').slice(0, 10);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    });
  }, [enquiries, tableColumns, debouncedGlobalSearch, columnSearch, sort, dateFrom, dateTo]);

  const serverTotal = serverData?.pagination?.total ?? 0;
  const totalCount = useServer ? serverTotal : clientFiltered.length;

  const totalPages = useMemo(
    () =>
      useServer
        ? Math.max(1, serverData?.pagination?.totalPages ?? 1)
        : Math.max(1, Math.ceil(clientFiltered.length / pageSize)),
    [useServer, serverData?.pagination?.totalPages, clientFiltered.length, pageSize]
  );

  const filteredEnquiries = useServer ? enquiries : clientFiltered;

  const paginatedEnquiries = useMemo(() => {
    if (useServer) return enquiries; // already the current page
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return clientFiltered.slice(startIndex, startIndex + pageSize);
  }, [useServer, enquiries, currentPage, clientFiltered, totalPages, pageSize]);

  useEffect(() => {
    void loadLookups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAddEnquiry, canEditEnquiry]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGlobalSearch, columnSearch, sort, status, dateFrom, dateTo]);

  // Sync filter/search/sort state -> URL (preserves foreign params like ?new=1).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDefaultSort = sort.key === 'functionName' && sort.direction === 'asc';
    router.replace(
      buildListUrl(pathname, window.location.search, ['q', 'status', 'from', 'to', 'sort', 'dir'], {
        q: debouncedGlobalSearch,
        status,
        from: dateFrom,
        to: dateTo,
        sort: isDefaultSort ? undefined : sort.key,
        dir: isDefaultSort ? undefined : sort.direction,
      }),
      { scroll: false }
    );
  }, [debouncedGlobalSearch, status, dateFrom, dateTo, sort, pathname, router]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    const section = searchParams.get('section');
    const id = searchParams.get('id');
    if (section !== 'edit' || !id) return;
    const enquiry = enquiries.find((entry) => entry.id === id);
    if (enquiry) {
      openEditPrompt(enquiry);
      deepLinkHandledRef.current = true;
      return;
    }
    // Under server pagination the enquiry may not be on the current page —
    // fetch it by id once so the deep-link edit still opens.
    if (deepLinkHandledRef.current) return;
    deepLinkHandledRef.current = true;
    void api
      .getEnquiry(id)
      .then((res) => {
        const e = res?.data?.data?.enquiry;
        if (e) openEditPrompt(e as Enquiry);
      })
      .catch(() => {
        deepLinkHandledRef.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiries]);

  const loadLookups = async () => {
    try {
      if (!canAddEnquiry && !canEditEnquiry) {
        setCustomers([]);
        setHalls([]);
        setTemplateMenus([]);
        return;
      }
      const [rawCustomerRows, hallRes, templateRes] = await Promise.all([
        fetchAllCustomers(),
        api.getHalls({ page: 1, limit: 200 }),
        api.getTemplateMenus({ page: 1, limit: 200 }),
      ]);
      const hallRows = hallRes.data?.data?.halls || [];
      const templateRows = templateRes.data?.data?.templateMenus || [];
      const customerRows = rawCustomerRows as unknown as CustomerOption[];
      setCustomers(customerRows);
      setHalls(hallRows);
      setTemplateMenus(templateRows);
      setFormData((prev) => ({
        ...prev,
        customerId: prev.customerId || customerRows[0]?.id || '',
        hallId: prev.hallId || hallRows[0]?.id || '',
      }));
    } catch (error) {
      toast.error('Failed to load enquiry form options');
    }
  };

  useEffect(() => {
    if (enquiriesLoadError) {
      toast.error('Failed to load enquiries');
    }
  }, [enquiriesLoadError]);

  const loadEnquiries = useCallback(async () => {
    await refetchEnquiries();
  }, [refetchEnquiries]);

  const enquiriesDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoadEnquiries = useCallback(() => {
    if (enquiriesDebounceTimerRef.current) clearTimeout(enquiriesDebounceTimerRef.current);
    enquiriesDebounceTimerRef.current = setTimeout(() => {
      void loadEnquiries();
    }, 300);
  }, [loadEnquiries]);
  useEffect(() => {
    return () => {
      if (enquiriesDebounceTimerRef.current) clearTimeout(enquiriesDebounceTimerRef.current);
    };
  }, []);
  useSSE(['enquiry:'], debouncedLoadEnquiries, canViewEnquiry);


  const handleColumnSearch = (key: keyof typeof initialColumnSearch, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = () => {
    setGlobalSearch('');
    setColumnSearch(initialColumnSearch);
    setCurrentPage(1);
  };

  const openCreatePrompt = () => {
    void loadLookups();
    setEditingEnquiryId(null);
    setFormData({
      ...initialFormData,
      customerId: '',
      hallId: '',
    });
    setShowCreatePrompt(true);
  };

  const normalizePackKey = (name: string): PackKey | null => {
    const normalized = name.trim().toLowerCase();
    if (normalized === 'breakfast') return 'breakfast';
    if (normalized === 'lunch') return 'lunch';
    if (normalized === 'hi-tea' || normalized === 'hitea' || normalized === 'hi tea') {
      return 'hiTea';
    }
    if (normalized === 'dinner') return 'dinner';
    return null;
  };

  const openEditPrompt = (enquiry: Enquiry) => {
    void loadLookups();
    const nextPacks = { ...initialFormData.packs };
    (enquiry.packs || []).forEach((pack) => {
      const key = pack.mealSlot?.name ? normalizePackKey(pack.mealSlot.name) : null;
      if (!key) return;
      nextPacks[key] = {
        enabled: true,
        people: String(pack.packCount ?? pack.noOfPack ?? ''),
        templateMenuId: pack.templateMenu?.id || '',
      };
    });

    setEditingEnquiryId(enquiry.id);
    setFormData({
      customerId: enquiry.customerId || enquiry.customer?.id || '',
      functionType: enquiry.functionType || '',
      functionDate: enquiry.functionDate ? enquiry.functionDate.slice(0, 10) : '',
      hallId: enquiry.halls?.[0]?.hall?.id || '',
      startTime: enquiry.startTime || enquiry.functionTime || '08:00',
      endTime: enquiry.endTime || '15:00',
      quotationRequired:
        enquiry.quotationSent || enquiry.quotation ? 'yes' : 'no',
      pencilBooking:
        enquiry.isPencilBooked || enquiry.pencilBooking ? 'yes' : 'no',
      note: enquiry.note || enquiry.notes || '',
      packs: nextPacks,
    });
    setShowCreatePrompt(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.customerId || !formData.functionType || !formData.functionDate) {
      toast.error('Customer, function type and date are required');
      return;
    }

    try {
      setSaving(true);
      const enabledPackGuestCounts = Object.values(formData.packs)
        .filter((pack) => pack.enabled)
        .map((pack) => Number(pack.people || 0))
        .filter((count) => count > 0);
      const expectedGuests = enabledPackGuestCounts.length
        ? Math.max(...enabledPackGuestCounts)
        : 1;

      const selectedPackSummary = Object.entries(formData.packs)
        .filter(([, value]) => value.enabled)
        .map(([slot, value]) => {
          const key = slot as PackKey;
          const templateName =
            templateMenus.find((template) => template.id === value.templateMenuId)?.name ||
            'No template';
          const peopleCount = value.people || '0';
          return `${PACK_LABELS[key]}: ${peopleCount} pax (${templateName})`;
        });

      const hallIds = formData.hallId ? [formData.hallId] : [];
      const notes = [
        formData.note.trim(),
        selectedPackSummary.length > 0
          ? `Pack Summary - ${selectedPackSummary.join(' | ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const payload = {
        customerId: formData.customerId,
        functionName: formData.functionType.trim(),
        functionType: formData.functionType.trim(),
        functionDate: formData.functionDate,
        functionTime: formData.startTime || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        expectedGuests,
        hallIds: hallIds.length > 0 ? hallIds : undefined,
        quotation: formData.quotationRequired === 'yes',
        quotationSent: formData.quotationRequired === 'yes',
        pencilBooking: formData.pencilBooking === 'yes',
        isPencilBooked: formData.pencilBooking === 'yes',
        note: notes || undefined,
        notes: notes || undefined,
      };
      if (editingEnquiryId) {
        await updateEnquiryMutation.mutateAsync({ id: editingEnquiryId, payload });
        toast.success('Enquiry updated');
      } else {
        await api.createEnquiry(payload);
        toast.success('Enquiry created');
        await refetchEnquiries();
      }
      setShowCreatePrompt(false);
      setFormData((prev) => ({
        ...initialFormData,
        customerId: prev.customerId || '',
        hallId: prev.hallId || '',
      }));
      setEditingEnquiryId(null);
    } catch (error: any) {
      if (!editingEnquiryId) {
        toast.error(error?.response?.data?.error || 'Failed to create enquiry');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this enquiry?')) return;
    try {
      await api.deleteEnquiry(id);
      toast.success('Enquiry deleted');
      await loadEnquiries();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete enquiry');
    }
  };

  return (
    <div className="ops-route ops-list-route">
      <Toolbar
        title="Enquiries"
        stats={[
          { label: 'In view', value: totalCount },
          { label: 'Active filters', value: Object.values(columnSearch).filter(Boolean).length },
        ]}
        actions={
          canAddEnquiry ? (
            <Button
              type="button"
              className="h-[42px] w-full sm:w-auto"
              onClick={openCreatePrompt}
              disabled={customers.length === 0}
            >
              <Plus />
              Add Enquiry
            </Button>
          ) : null
        }
      />

      {!canViewEnquiry && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view enquiries.
        </div>
      )}

      <FormPromptModal
        open={showCreatePrompt}
        title={editingEnquiryId ? 'Edit Enquiry' : 'Enquiry Form'}
        onClose={() => {
          setShowCreatePrompt(false);
          setEditingEnquiryId(null);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="label">
                Customer <span className="text-red-500">*</span>
              </label>
              <Combobox
                value={formData.customerId}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, customerId: val }))
                }
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: formatCustomerOptionLabel(customer),
                  secondary: customer.phone,
                  searchText: customerSearchText(customer),
                }))}
                placeholder="Search name or phone"
                searchPlaceholder="Name or phone number"
              />
            </div>
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
                type="date"
                className="input"
                value={formData.functionDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, functionDate: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">
                Hall <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={formData.hallId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hallId: e.target.value }))
                }
                required
              >
                <option value="">Select hall</option>
                {halls.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-1)] mb-2">Quotation Required?</p>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="radio"
                  name="quotationRequired"
                  checked={formData.quotationRequired === 'yes'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, quotationRequired: 'yes' }))
                  }
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="radio"
                  name="quotationRequired"
                  checked={formData.quotationRequired === 'no'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, quotationRequired: 'no' }))
                  }
                />
                No
              </label>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--text-1)]">Name of Pack</h3>
            {(Object.keys(PACK_LABELS) as PackKey[]).map((packKey) => (
              <div
                key={packKey}
                className="grid grid-cols-1 md:grid-cols-[220px,1fr,1fr] gap-3 rounded-xl border border-[var(--border)] p-3"
              >
                <label className="inline-flex items-center gap-2 text-sm text-[var(--text-1)]">
                  <input
                    type="checkbox"
                    checked={formData.packs[packKey].enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        packs: {
                          ...prev.packs,
                          [packKey]: {
                            ...prev.packs[packKey],
                            enabled: e.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  {PACK_LABELS[packKey]}
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="No. of People"
                  value={formData.packs[packKey].people}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      packs: {
                        ...prev.packs,
                        [packKey]: {
                          ...prev.packs[packKey],
                          people: e.target.value,
                        },
                      },
                    }))
                  }
                  disabled={!formData.packs[packKey].enabled}
                />
                <select
                  className="input"
                  value={formData.packs[packKey].templateMenuId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      packs: {
                        ...prev.packs,
                        [packKey]: {
                          ...prev.packs[packKey],
                          templateMenuId: e.target.value,
                        },
                      },
                    }))
                  }
                  disabled={!formData.packs[packKey].enabled}
                >
                  <option value="">Menu Template</option>
                  {templateMenus.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                className="input"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                className="input"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-1)] mb-2">Pencil Booking</p>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="radio"
                  name="pencilBooking"
                  checked={formData.pencilBooking === 'yes'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, pencilBooking: 'yes' }))
                  }
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="radio"
                  name="pencilBooking"
                  checked={formData.pencilBooking === 'no'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, pencilBooking: 'no' }))
                  }
                />
                No
              </label>
            </div>
          </div>

          <div>
            <label className="label">Note</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Note"
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowCreatePrompt(false);
                setEditingEnquiryId(null);
              }}
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
        </form>
      </FormPromptModal>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-4)]" />
            <input
              className="input pl-10 pr-10"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Overall search across all enquiry columns..."
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
          <select
            className="input md:w-64"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="converted">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button type="button" variant="outline" className="h-[42px] px-3 md:px-4" onClick={() => setShowFilters(true)}>
            <Filter className="md:mr-2" />
            <span className="hidden md:inline">Filters</span>
            {Object.values(columnSearch).filter(Boolean).length > 0 && (
               <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                 {Object.values(columnSearch).filter(Boolean).length}
               </span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[42px] px-3 md:px-4"
            onClick={handleExportCsv}
            disabled={exporting}
            title="Export the current filtered view to CSV"
          >
            <Download className="md:mr-2" />
            <span className="hidden md:inline">{exporting ? 'Exporting…' : 'Export'}</span>
          </Button>
        </div>
      </div>

      <div className="card">
        {!canViewEnquiry ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <PhoneCall size={22} />
            </div>
            <p className="empty-state-title">No data available</p>
            <p className="empty-state-desc">You do not have access to view enquiries.</p>
          </div>
        ) : loading ? (
          <div className="py-6">
            <TableSkeleton rows={8} />
          </div>
        ) : totalCount === 0 ? (
          <EmptyState
            icon={globalSearch ? Search : PhoneCall}
            variant={
              globalSearch
                ? 'search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'filter'
                  : 'page'
            }
            title={
              globalSearch
                ? 'No enquiries match your search'
                : Object.values(columnSearch).some(Boolean)
                  ? 'No matches'
                  : 'No enquiries found'
            }
            description={
              globalSearch || Object.values(columnSearch).some(Boolean)
                ? `"${globalSearch || Object.values(columnSearch).find(Boolean)}" returned no results.`
                : 'New enquiries will appear here.'
            }
            action={
              globalSearch
                ? { label: 'Clear search', onClick: () => setGlobalSearch('') }
                : Object.values(columnSearch).some(Boolean)
                  ? { label: 'Clear filters', onClick: () => setColumnSearch(initialColumnSearch) }
                  : canAddEnquiry
                    ? { label: 'New Enquiry', onClick: openCreatePrompt }
                    : undefined
            }
          />
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden">
              <div className="mobile-card-list">
                {paginatedEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-card-title">{enquiry.functionName}</div>
                        <div className="mobile-card-subtitle">{enquiry.functionType}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={enquiry.status} />
                        {enquiry.quotationSent && <StatusBadge status="quotation" />}
                        {enquiry.isPencilBooked && <StatusBadge status="pencil" />}
                      </div>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Customer</span>
                      <span className="mobile-card-value">{enquiry.customer?.name || '—'}</span>
                    </div>
                    {enquiry.customer?.phone && (
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Phone</span>
                        <span className="mobile-card-value">{enquiry.customer.phone}</span>
                      </div>
                    )}
                    <div className="mobile-card-meta" style={{ marginTop: 8 }}>
                      <span className="mobile-card-meta-item">
                        <CalendarDays style={{ width: 14, height: 14 }} aria-hidden="true" />
                        {formatDateDDMMYYYY(enquiry.functionDate)}
                      </span>
                      <span className="mobile-card-meta-item">
                        <Users style={{ width: 14, height: 14 }} aria-hidden="true" />
                        {enquiry.expectedGuests} guests
                      </span>
                    </div>
                    {(canEditEnquiry || canDeleteEnquiry) && (
                      <div className="mobile-card-actions">
                        {canEditEnquiry && (
                          <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => openEditPrompt(enquiry)}
                          >
                            <Edit style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Edit
                          </button>
                        )}
                        {canDeleteEnquiry && (
                          <button
                            type="button"
                            className="mobile-card-action-btn"
                            onClick={() => handleDelete(enquiry.id)}
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                itemLabel="enquiries"
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
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
                      filter={
                        <ColumnFilter active={Boolean(dateFrom || dateTo)} title="Date">
                          <DateRangeFilter
                            from={dateFrom}
                            to={dateTo}
                            onChange={({ from, to }) => {
                              setDateFrom(from);
                              setDateTo(to);
                            }}
                          />
                        </ColumnFilter>
                      }
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className={`ops-click-row border-b border-[var(--border)] hover:bg-[var(--surface-2)] ${getRowStatusClass(
                        enquiry.isPencilBooked ? 'pencil' : enquiry.quotationSent ? 'quotation' : enquiry.status
                      )}`}
                      onClick={() => canEditEnquiry && openEditPrompt(enquiry)}
                    >
                      <td className="py-4 px-4 main">
                        <p className="font-medium text-[var(--text-1)]">{enquiry.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{enquiry.functionType}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[var(--text-1)]">{enquiry.customer?.name}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{enquiry.customer?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-4 h-4 text-[var(--text-4)]" />
                          {formatDateCompact(enquiry.functionDate)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 text-[var(--text-4)]" />
                          {enquiry.expectedGuests}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={enquiry.status} />
                          {enquiry.quotationSent && <StatusBadge status="quotation" />}
                          {enquiry.isPencilBooked && <StatusBadge status="pencil" />}
                        </div>
                      </td>
                      <td className="ops-secondary-actions py-4 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {canEditEnquiry && (
                            <button
                              onClick={() => openEditPrompt(enquiry)}
                              className="p-2 text-[var(--text-4)] hover:text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg"
                              title="Edit enquiry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteEnquiry && (
                            <button
                              onClick={() => handleDelete(enquiry.id)}
                              className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
                              title="Delete enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                itemLabel="enquiries"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {canAddEnquiry && (
        <FloatingActionButton
          onClick={openCreatePrompt}
          label="New Enquiry"
        />
      )}

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        activeCount={Object.values(columnSearch).filter(Boolean).length}
        onClearAll={() => setColumnSearch({ functionName: '', customer: '', functionDate: '', expectedGuests: '', status: '' })}
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
            <label className="label">Function Date</label>
            <input type="date" className="input" value={columnSearch.functionDate} onChange={(e) => handleColumnSearch('functionDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Guests</label>
            <input className="input" placeholder="Search guests" value={columnSearch.expectedGuests} onChange={(e) => handleColumnSearch('expectedGuests', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <input className="input" placeholder="Search status" value={columnSearch.status} onChange={(e) => handleColumnSearch('status', e.target.value)} />
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
