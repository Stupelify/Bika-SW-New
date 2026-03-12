'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CalendarDays, Edit, Plus, Save, Search, Trash2, Users } from 'lucide-react';
import FloatingActionButton from '@/components/FloatingActionButton';
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
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<SortState>({
    key: 'functionName',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<EnquiryFormData>(initialFormData);

  const tableColumns = useMemo<TableColumnConfig<Enquiry>[]>(
    () => [
      {
        key: 'functionName',
        accessor: (enquiry) => `${enquiry.functionName} ${enquiry.functionType}`,
      },
      {
        key: 'customer',
        accessor: (enquiry) =>
          `${enquiry.customer?.name ?? ''} ${enquiry.customer?.phone ?? ''}`,
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

  const filteredEnquiries = useMemo(
    () => filterAndSortRows(enquiries, tableColumns, globalSearch, columnSearch, sort),
    [enquiries, tableColumns, globalSearch, columnSearch, sort]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEnquiries.length / ENQUIRIES_PAGE_SIZE)),
    [filteredEnquiries.length]
  );

  const paginatedEnquiries = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * ENQUIRIES_PAGE_SIZE;
    return filteredEnquiries.slice(startIndex, startIndex + ENQUIRIES_PAGE_SIZE);
  }, [currentPage, filteredEnquiries, totalPages]);

  useEffect(() => {
    void loadLookups();
  }, [canAddEnquiry, canEditEnquiry]);

  useEffect(() => {
    void loadEnquiries();
  }, [status, canViewEnquiry]);

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnSearch, sort, status]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const loadLookups = async () => {
    try {
      if (!canAddEnquiry && !canEditEnquiry) {
        setCustomers([]);
        setHalls([]);
        setTemplateMenus([]);
        return;
      }
      const [customerRes, hallRes, templateRes] = await Promise.all([
        api.getCustomers({ page: 1, limit: 5000 }),
        api.getHalls({ page: 1, limit: 5000 }),
        api.getTemplateMenus({ page: 1, limit: 5000 }),
      ]);
      const customerRows = customerRes.data?.data?.customers || [];
      const hallRows = hallRes.data?.data?.halls || [];
      const templateRows = templateRes.data?.data?.templateMenus || [];
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

  const loadEnquiries = async () => {
    try {
      if (!canViewEnquiry) {
        setEnquiries([]);
        return;
      }
      setLoading(true);
      const response = await api.getEnquiries({
        page: 1,
        limit: 5000,
        status: status || undefined,
      });
      setEnquiries(response.data?.data?.enquiries || []);
    } catch (error) {
      toast.error('Failed to load enquiries');
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

  const openCreatePrompt = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-600 mt-1">
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
        <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
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
              <select
                className="input"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerId: e.target.value }))
                }
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
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
            <p className="text-sm font-semibold text-gray-800 mb-2">Quotation Required?</p>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
            <h3 className="text-lg font-semibold text-gray-900">Name of Pack</h3>
            {(Object.keys(PACK_LABELS) as PackKey[]).map((packKey) => (
              <div
                key={packKey}
                className="grid grid-cols-1 md:grid-cols-[220px,1fr,1fr] gap-3 rounded-xl border border-gray-200 p-3"
              >
                <label className="inline-flex items-center gap-2 text-sm text-gray-800">
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
            <p className="text-sm font-semibold text-gray-800 mb-2">Pencil Booking</p>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="converted">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        {!canViewEnquiry ? (
          <div className="text-sm text-gray-500">No data available.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-12">
            {(globalSearch || Object.values(columnSearch).some(Boolean)) ? (
              <>
                <p className="text-gray-500 mb-1">No enquiries match your search</p>
                <p className="text-gray-400 text-sm mb-4">
                  &ldquo;{globalSearch || Object.values(columnSearch).find(Boolean)}&rdquo;
                </p>
                <button type="button" onClick={clearSearch} className="btn btn-secondary">
                  Clear search
                </button>
              </>
            ) : (
              <p className="text-gray-500">No enquiries found.</p>
            )}
          </div>
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
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {enquiry.status}
                        </span>
                        {enquiry.quotationSent && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Quotation</span>
                        )}
                        {enquiry.isPencilBooked && (
                          <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Pencil</span>
                        )}
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
                totalItems={filteredEnquiries.length}
                pageSize={ENQUIRIES_PAGE_SIZE}
                itemLabel="enquiries"
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
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
                    <th className="py-2 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{enquiry.functionName}</p>
                        <p className="text-xs text-gray-500 mt-1">{enquiry.functionType}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">{enquiry.customer?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{enquiry.customer?.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          {formatDateDDMMYYYY(enquiry.functionDate)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {enquiry.expectedGuests}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            {enquiry.status}
                          </span>
                          {enquiry.quotationSent && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              Quotation
                            </span>
                          )}
                          {enquiry.isPencilBooked && (
                            <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                              Pencil
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditEnquiry && (
                            <button
                              onClick={() => openEditPrompt(enquiry)}
                              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="Edit enquiry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteEnquiry && (
                            <button
                              onClick={() => handleDelete(enquiry.id)}
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
                totalItems={filteredEnquiries.length}
                pageSize={ENQUIRIES_PAGE_SIZE}
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
    </div>
  );
}
