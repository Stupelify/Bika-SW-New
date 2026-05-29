'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, fetchAllCustomers } from '@/lib/api';
import { useSSE } from '@/hooks/useSSE';
import {
  customerSearchText,
  formatCustomerOptionLabel,
} from '@/lib/customerSearch';
import { toast } from 'sonner';
import { CalendarDays, Edit, PhoneCall, Plus, Save, Search, Trash2, Users } from 'lucide-react';
import Combobox from '@/components/Combobox';
import FloatingActionButton from '@/components/FloatingActionButton';
import FormPromptModal from '@/components/FormPromptModal';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { TableSkeleton } from '@/components/Skeletons';
import { TableColumnConfig } from '@/lib/tableUtils';
import DataTableToolbar, { DataTableFooter } from '@/components/data-table/DataTableToolbar';
import { useTableState } from '@/hooks/useTableState';
import { applyTableState, paginateRows } from '@/lib/data-table/apply';
import type { FilterSchema } from '@/lib/data-table/types';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';
import StatusBadge from '@/components/StatusBadge';

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

export default function EnquiriesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewEnquiry = hasAnyPermission(permissionSet, ['view_enquiry', 'manage_enquiries']);
  const canAddEnquiry = hasAnyPermission(permissionSet, ['add_enquiry', 'manage_enquiries']);
  const canEditEnquiry = hasAnyPermission(permissionSet, ['edit_enquiry', 'manage_enquiries']);
  const canDeleteEnquiry = hasAnyPermission(permissionSet, ['delete_enquiry', 'manage_enquiries']);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnquiryFormData>(initialFormData);

  const tableColumns = useMemo<TableColumnConfig<Enquiry>[]>(
    () => [
      {
        key: 'functionName',
        accessor: (enquiry) =>
          [enquiry.functionName, enquiry.functionType, enquiry.notes ?? '']
            .filter(Boolean)
            .join(' '),
        sortable: true,
        searchable: true,
      },
      {
        key: 'customer',
        accessor: (enquiry) =>
          customerSearchText({
            name: enquiry.customer?.name,
            phone: enquiry.customer?.phone,
          }),
        sortable: true,
        searchable: true,
      },
      {
        key: 'functionDate',
        accessor: (enquiry) => enquiry.functionDate,
        sortable: true,
        searchable: false,
      },
      {
        key: 'expectedGuests',
        accessor: (enquiry) => enquiry.expectedGuests,
        sortable: true,
        searchable: false,
      },
      {
        key: 'status',
        accessor: (enquiry) => enquiry.status,
        sortable: true,
        searchable: false,
      },
    ],
    []
  );

  const filterSchemas = useMemo<FilterSchema[]>(
    () => [
      {
        id: 'status',
        type: 'multiSelect',
        label: 'Status',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'quoted', label: 'Quoted' },
          { value: 'converted', label: 'Converted' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
      { id: 'functionDate', type: 'dateRange', label: 'Function date' },
      { id: 'expectedGuests', type: 'numberRange', label: 'Guests' },
      {
        id: 'flags',
        type: 'multiSelect',
        label: 'Flags',
        options: [
          { value: 'quotation', label: 'Quotation sent' },
          { value: 'pencil', label: 'Pencil booked' },
        ],
      },
    ],
    []
  );

  const filterDefs = useMemo(
    () => [
      { id: 'status', accessor: (e: Enquiry) => e.status },
      { id: 'functionDate', accessor: (e: Enquiry) => e.functionDate },
      { id: 'expectedGuests', accessor: (e: Enquiry) => e.expectedGuests },
      {
        id: 'flags',
        accessor: (e: Enquiry) => {
          const flags: string[] = [];
          if (e.quotationSent) flags.push('quotation');
          if (e.isPencilBooked) flags.push('pencil');
          return flags;
        },
      },
    ],
    []
  );

  const tableState = useTableState({
    prefix: 'enquiries',
    filters: filterSchemas,
    defaultSort: { key: 'functionName', direction: 'asc' },
  });

  const filteredEnquiries = useMemo(
    () => applyTableState(enquiries, tableColumns, filterDefs, tableState),
    [enquiries, tableColumns, filterDefs, tableState]
  );

  const paginatedEnquiries = useMemo(
    () => paginateRows(filteredEnquiries, tableState.page, tableState.pageSize),
    [filteredEnquiries, tableState.page, tableState.pageSize]
  );

  useEffect(() => {
    void loadLookups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAddEnquiry, canEditEnquiry]);

  useEffect(() => {
    const section = searchParams.get('section');
    const id = searchParams.get('id');
    if (section !== 'edit' || !id || enquiries.length === 0) {
      return;
    }
    const enquiry = enquiries.find((entry) => entry.id === id);
    if (enquiry) {
      openEditPrompt(enquiry);
    }
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

  const loadEnquiries = useCallback(async () => {
    try {
      if (!hasAnyPermission(permissionSet, ['view_enquiry', 'add_enquiry', 'edit_enquiry', 'manage_enquiries'])) {
        setEnquiries([]);
        return;
      }
      setLoading(true);
      const response = await api.getEnquiries({
        page: 1,
        limit: 5000,
      });
      setEnquiries(response.data?.data?.enquiries || []);
    } catch (error) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  }, [permissionSet]);

  useEffect(() => {
    void loadEnquiries();
  }, [canViewEnquiry, loadEnquiries]);

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
        await api.updateEnquiry(editingEnquiryId, payload);
      } else {
        await api.createEnquiry(payload);
      }
      toast.success(editingEnquiryId ? 'Enquiry updated' : 'Enquiry created');
      setShowCreatePrompt(false);
      setFormData((prev) => ({
        ...initialFormData,
        customerId: prev.customerId || '',
        hallId: prev.hallId || '',
      }));
      setEditingEnquiryId(null);
      await loadEnquiries();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        (editingEnquiryId ? 'Failed to update enquiry' : 'Failed to create enquiry')
      );
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
    <div className="space-y-6">
      <div className="page-head gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Enquiries</h1>
          <p className="text-[var(--text-2)] mt-1">
            Capture leads, track conversion and monitor pending follow-ups.
          </p>
        </div>
        {canAddEnquiry && (
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            onClick={openCreatePrompt}
            disabled={customers.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Enquiry
          </button>
        )}
      </div>

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
        <DataTableToolbar
          state={tableState}
          searchPlaceholder="Search by function, customer, phone, or notes…"
        />
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
        ) : filteredEnquiries.length === 0 ? (
          <EmptyState
            icon={tableState.search ? Search : PhoneCall}
            variant={
              tableState.search ? 'search' : tableState.activeFilterCount > 0 ? 'filter' : 'page'
            }
            title={
              tableState.search
                ? 'No enquiries match your search'
                : tableState.activeFilterCount > 0
                  ? 'No matches'
                  : 'No enquiries found'
            }
            description={
              tableState.search || tableState.activeFilterCount > 0
                ? 'Try adjusting the search or active filters.'
                : 'New enquiries will appear here.'
            }
            action={
              tableState.search || tableState.activeFilterCount > 0
                ? { label: 'Clear all', onClick: tableState.clearAll }
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
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <SortableHeader label="Function" sortKey="functionName" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Customer" sortKey="customer" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Date" sortKey="functionDate" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Guests" sortKey="expectedGuests" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Status" sortKey="status" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
                      <td className="py-4 px-4">
                        <p className="font-medium text-[var(--text-1)]">{enquiry.functionName}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{enquiry.functionType}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-[var(--text-1)]">{enquiry.customer?.name}</p>
                        <p className="text-xs text-[var(--text-4)] mt-1">{enquiry.customer?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-4 h-4 text-[var(--text-4)]" />
                          {formatDateDDMMYYYY(enquiry.functionDate)}
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
                      <td className="py-4 px-4 text-right">
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
            </div>
            <DataTableFooter
              state={tableState}
              totalItems={enquiries.length}
              filteredCount={filteredEnquiries.length}
              itemLabel="enquiries"
            />
          </>
        )}
      </div>

      {canAddEnquiry && (
        <FloatingActionButton
          onClick={openCreatePrompt}
          label="New Enquiry"
        />
      )}
    </div>
  );
}
