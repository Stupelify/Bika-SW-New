'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Edit, Landmark, Save, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import { TableSkeleton } from '@/components/Skeletons';
import HallCard from '@/components/HallCard';
import DataTableToolbar, { DataTableFooter } from '@/components/data-table/DataTableToolbar';
import { useTableState } from '@/hooks/useTableState';
import { applyTableState, paginateRows } from '@/lib/data-table/apply';
import { TableColumnConfig } from '@/lib/tableUtils';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';

interface Banquet {
  id: string;
  name: string;
  location: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  halls?: Array<{ id: string }>;
}

interface Hall {
  id: string;
  name: string;
  capacity: number;
  floatingCapacity?: number | null;
  basePrice?: number | null;
  area?: number | null;
  order?: number | null;
  photo?: string | null;
  location?: string | null;
  rate?: string | null;
  banquet?: {
    id: string;
    name: string;
  } | null;
}

const initialBanquetForm = {
  name: '',
  location: '',
};

const initialHallForm = {
  name: '',
  location: '',
  rate: '',
  area: '',
  capacity: '',
  order: '',
  photo: '',
  photoFileName: '',
  banquetId: '',
};

type VenueSection = 'banquet' | 'hall';

function isVenueSection(value: string | null): value is VenueSection {
  return value === 'banquet' || value === 'hall';
}

function HallsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewBanquet = hasAnyPermission(permissionSet, ['view_banquet', 'manage_halls']);
  const canAddBanquet = hasAnyPermission(permissionSet, ['add_banquet', 'manage_halls']);
  const canEditBanquet = hasAnyPermission(permissionSet, ['edit_banquet', 'manage_halls']);
  const canDeleteBanquet = hasAnyPermission(permissionSet, ['delete_banquet', 'manage_halls']);
  const canViewHall = hasAnyPermission(permissionSet, ['view_hall', 'manage_halls']);
  const canAddHall = hasAnyPermission(permissionSet, ['add_hall', 'manage_halls']);
  const canEditHall = hasAnyPermission(permissionSet, ['edit_hall', 'manage_halls']);
  const canDeleteHall = hasAnyPermission(permissionSet, ['delete_hall', 'manage_halls']);

  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [weeklyBookings, setWeeklyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBanquet, setSavingBanquet] = useState(false);
  const [savingHall, setSavingHall] = useState(false);
  const [showBanquetPrompt, setShowBanquetPrompt] = useState(false);
  const [showHallPrompt, setShowHallPrompt] = useState(false);
  const [editingBanquetId, setEditingBanquetId] = useState<string | null>(null);
  const [editingHallId, setEditingHallId] = useState<string | null>(null);
  const [banquetForm, setBanquetForm] = useState(initialBanquetForm);
  const [hallForm, setHallForm] = useState(initialHallForm);
  const [activeVenueSection, setActiveVenueSection] = useState<VenueSection>('banquet');
  const sectionParam = searchParams.get('section');

  const banquetColumns = useMemo<TableColumnConfig<Banquet>[]>(
    () => [
      { key: 'name', accessor: (banquet) => banquet.name, sortable: true, searchable: true },
      {
        key: 'location',
        accessor: (banquet) =>
          [banquet.location, banquet.city, banquet.state].filter(Boolean).join(', '),
        sortable: true,
        searchable: true,
      },
      { key: 'halls', accessor: (banquet) => banquet.halls?.length || 0, sortable: true, searchable: false },
    ],
    []
  );

  const hallColumns = useMemo<TableColumnConfig<Hall>[]>(
    () => [
      {
        key: 'name',
        accessor: (hall) => `${hall.name} ${hall.banquet?.name || 'No banquet'}`,
        sortable: true,
        searchable: true,
      },
      {
        key: 'capacity',
        accessor: (hall) => hall.capacity ?? 0,
        sortable: true,
        searchable: false,
      },
      {
        key: 'pricing',
        accessor: (hall) => hall.basePrice ?? hall.rate ?? 0,
        sortable: true,
        searchable: false,
      },
    ],
    []
  );

  const hallFilterDefs = useMemo(
    () => [
      { id: 'capacity', accessor: (h: Hall) => h.capacity ?? 0 },
      { id: 'pricing', accessor: (h: Hall) => h.basePrice ?? h.rate ?? 0 },
    ],
    []
  );

  const banquetState = useTableState({
    prefix: 'banquet',
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const hallState = useTableState({
    prefix: 'hall',
    filters: [
      { id: 'capacity', type: 'numberRange', label: 'Capacity' },
      { id: 'pricing', type: 'numberRange', label: 'Pricing', format: 'currency' },
    ],
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const filteredBanquets = useMemo(
    () => applyTableState(banquets, banquetColumns, [], banquetState),
    [banquets, banquetColumns, banquetState]
  );
  const filteredHalls = useMemo(
    () => applyTableState(halls, hallColumns, hallFilterDefs, hallState),
    [halls, hallColumns, hallFilterDefs, hallState]
  );

  const paginatedBanquets = useMemo(
    () => paginateRows(filteredBanquets, banquetState.page, banquetState.pageSize),
    [filteredBanquets, banquetState.page, banquetState.pageSize]
  );
  const paginatedHalls = useMemo(
    () => paginateRows(filteredHalls, hallState.page, hallState.pageSize),
    [filteredHalls, hallState.page, hallState.pageSize]
  );

  useEffect(() => {
    void loadData();
  }, [canViewBanquet, canViewHall]);

  const firstAllowedVenueSection = useMemo<VenueSection | null>(() => {
    if (canViewBanquet) return 'banquet';
    if (canViewHall) return 'hall';
    return null;
  }, [canViewBanquet, canViewHall]);

  useEffect(() => {
    if (!firstAllowedVenueSection) return;

    const requestedSection = isVenueSection(sectionParam) ? sectionParam : null;
    const requestedSectionAllowed =
      requestedSection === 'banquet'
        ? canViewBanquet
        : requestedSection === 'hall'
          ? canViewHall
          : false;

    const nextSection =
      requestedSection && requestedSectionAllowed
        ? requestedSection
        : firstAllowedVenueSection;

    if (activeVenueSection !== nextSection) {
      setActiveVenueSection(nextSection);
    }

    if (sectionParam !== nextSection) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', nextSection);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    activeVenueSection,
    canViewBanquet,
    canViewHall,
    firstAllowedVenueSection,
    pathname,
    router,
    searchParams,
    sectionParam,
  ]);

  const navigateToVenueSection = (section: VenueSection) => {
    const allowed = section === 'banquet' ? canViewBanquet : canViewHall;
    if (!allowed) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };


  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const toDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const canFetchBanquet = hasAnyPermission(permissionSet, ['view_banquet', 'add_banquet', 'edit_banquet', 'add_hall', 'manage_halls']);
      const canFetchHall = hasAnyPermission(permissionSet, ['view_hall', 'add_hall', 'edit_hall', 'manage_halls']);
      const [banquetsRes, hallsRes, bookingsRes] = await Promise.all([
        canFetchBanquet ? api.getBanquets({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canFetchHall ? api.getHalls({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canFetchHall ? api.getBookings({ fromDate, toDate, limit: 1000 }) : Promise.resolve(null),
      ]);
      const banquetRows = banquetsRes?.data?.data?.banquets || [];
      setBanquets(banquetRows);
      setHalls(hallsRes?.data?.data?.halls || []);
      setWeeklyBookings(bookingsRes?.data?.data?.bookings || []);
      if (banquetRows.length > 0) {
        setHallForm((prev) => ({ ...prev, banquetId: prev.banquetId || banquetRows[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load venue data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateBanquet = () => {
    setEditingBanquetId(null);
    setBanquetForm(initialBanquetForm);
    setShowBanquetPrompt(true);
  };

  const openEditBanquet = (banquet: Banquet) => {
    setEditingBanquetId(banquet.id);
    setBanquetForm({
      name: banquet.name || '',
      location: banquet.location || '',
    });
    setShowBanquetPrompt(true);
  };

  const submitBanquet = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!banquetForm.name.trim() || !banquetForm.location.trim()) {
      toast.error('Banquet name and location are required');
      return;
    }
    try {
      setSavingBanquet(true);
      const payload = {
        name: banquetForm.name.trim(),
        location: banquetForm.location.trim(),
      };
      if (editingBanquetId) {
        await api.updateBanquet(editingBanquetId, payload);
      } else {
        await api.createBanquet(payload);
      }
      toast.success(editingBanquetId ? 'Banquet updated' : 'Banquet created');
      setShowBanquetPrompt(false);
      setEditingBanquetId(null);
      setBanquetForm(initialBanquetForm);
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingBanquetId ? 'Failed to update banquet' : 'Failed to create banquet')
      );
    } finally {
      setSavingBanquet(false);
    }
  };

  const openCreateHall = () => {
    setEditingHallId(null);
    setHallForm((prev) => ({
      ...initialHallForm,
      banquetId: prev.banquetId || banquets[0]?.id || '',
    }));
    setShowHallPrompt(true);
  };

  const openEditHall = (hall: Hall) => {
    setEditingHallId(hall.id);
    setHallForm({
      name: hall.name || '',
      location: hall.location || '',
      rate:
        hall.rate ||
        (typeof hall.basePrice === 'number' ? String(hall.basePrice) : ''),
      area: hall.area !== null && hall.area !== undefined ? String(hall.area) : '',
      capacity: hall.capacity !== null && hall.capacity !== undefined ? String(hall.capacity) : '',
      order: hall.order !== null && hall.order !== undefined ? String(hall.order) : '',
      photo: hall.photo || '',
      photoFileName: hall.photo ? 'Existing image' : '',
      banquetId: hall.banquet?.id || '',
    });
    setShowHallPrompt(true);
  };

  const submitHall = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hallForm.name.trim() || !hallForm.banquetId) {
      toast.error('Hall name and banquet are required');
      return;
    }
    try {
      setSavingHall(true);
      const payload = {
        name: hallForm.name.trim(),
        capacity: hallForm.capacity ? Number(hallForm.capacity) : 1,
        area: hallForm.area ? Number(hallForm.area) : undefined,
        order: hallForm.order ? Number(hallForm.order) : undefined,
        photo: hallForm.photo || undefined,
        images: hallForm.photo ? [hallForm.photo] : undefined,
        location: hallForm.location.trim() || undefined,
        rate: hallForm.rate.trim() || undefined,
        banquetId: hallForm.banquetId,
      };
      if (editingHallId) {
        await api.updateHall(editingHallId, payload);
      } else {
        await api.createHall(payload);
      }
      toast.success(editingHallId ? 'Hall updated' : 'Hall created');
      setShowHallPrompt(false);
      setEditingHallId(null);
      setHallForm((prev) => ({
        ...initialHallForm,
        banquetId: prev.banquetId,
      }));
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingHallId ? 'Failed to update hall' : 'Failed to create hall')
      );
    } finally {
      setSavingHall(false);
    }
  };

  const handleHallImageUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHallForm((prev) => ({
        ...prev,
        photo: typeof reader.result === 'string' ? reader.result : '',
        photoFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const deleteBanquet = async (id: string) => {
    if (!confirm('Delete this banquet?')) return;
    try {
      await api.deleteBanquet(id);
      toast.success('Banquet deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete banquet');
    }
  };

  const deleteHall = async (id: string) => {
    if (!confirm('Delete this hall?')) return;
    try {
      await api.deleteHall(id);
      toast.success('Hall deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete hall');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Venues</h1>
        <p className="text-[var(--text-2)] mt-1">
          Maintain banquet properties and hall inventory in separate tables.
        </p>
      </div>

      {!canViewBanquet && !canViewHall && (
        <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm">
          You do not have permission to view venue tables.
        </div>
      )}

      <FormPromptModal
        open={showBanquetPrompt}
        title={editingBanquetId ? 'Edit Banquet' : 'Create Banquet'}
        onClose={() => {
          setShowBanquetPrompt(false);
          setEditingBanquetId(null);
          setBanquetForm(initialBanquetForm);
        }}
        widthClass="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={submitBanquet}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">
                Banquet Name <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Banquet name"
                className="input"
                value={banquetForm.name}
                onChange={(e) =>
                  setBanquetForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Location"
                className="input"
                value={banquetForm.location}
                onChange={(e) =>
                  setBanquetForm((prev) => ({ ...prev, location: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowBanquetPrompt(false);
                setEditingBanquetId(null);
                setBanquetForm(initialBanquetForm);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingBanquet}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingBanquet ? 'Saving...' : 'Submit'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showHallPrompt}
        title={editingHallId ? 'Edit Hall' : 'Create Hall'}
        onClose={() => {
          setShowHallPrompt(false);
          setEditingHallId(null);
          setHallForm((prev) => ({
            ...initialHallForm,
            banquetId: prev.banquetId,
          }));
        }}
        widthClass="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={submitHall}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Hall Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="Hall name"
                value={hallForm.name}
                onChange={(e) => setHallForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">
                Select Banquet <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={hallForm.banquetId}
                onChange={(e) => setHallForm((prev) => ({ ...prev, banquetId: e.target.value }))}
                required
              >
                <option value="">Select banquet</option>
                {banquets.map((banquet) => (
                  <option key={banquet.id} value={banquet.id}>
                    {banquet.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rate</label>
              <input
                className="input"
                placeholder="Rate"
                value={hallForm.rate}
                onChange={(e) => setHallForm((prev) => ({ ...prev, rate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Area</label>
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                placeholder="Area"
                value={hallForm.area}
                onChange={(e) =>
                  setHallForm((prev) => ({ ...prev, area: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                className="input"
                type="number"
                min={1}
                placeholder="Max guests"
                value={hallForm.capacity}
                onChange={(e) =>
                  setHallForm((prev) => ({ ...prev, capacity: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Hall Location</label>
              <input
                className="input"
                placeholder="Hall location"
                value={hallForm.location}
                onChange={(e) => setHallForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Order</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Order"
                value={hallForm.order}
                onChange={(e) => setHallForm((prev) => ({ ...prev, order: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Hall Image</label>
              <label className="block rounded-2xl border-2 border-dashed border-[var(--border-2)] bg-[var(--surface-2)] p-4 hover:border-primary-300 transition cursor-pointer">
                <div className="text-sm text-[var(--text-2)]">
                  {hallForm.photoFileName
                    ? `Selected: ${hallForm.photoFileName}`
                    : 'Drag and drop or select image file'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleHallImageUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowHallPrompt(false);
                setEditingHallId(null);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingHall}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingHall ? 'Saving...' : 'Submit'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      {(canViewBanquet || canViewHall) && (
        <div className="card p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigateToVenueSection('banquet')}
              disabled={!canViewBanquet}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeVenueSection === 'banquet' && canViewBanquet
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Banquet
            </button>
            <button
              type="button"
              onClick={() => navigateToVenueSection('hall')}
              disabled={!canViewHall}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeVenueSection === 'hall' && canViewHall
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Hall
            </button>
          </div>
        </div>
      )}

      {(canViewBanquet || canViewHall) && (
        <div className="card">
        {activeVenueSection === 'banquet' ? (
          <>
            <div className="page-head mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-1)]">Banquet table</h2>
              {canAddBanquet && (
                <button
                  type="button"
                  className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                  onClick={openCreateBanquet}
                >
                  <Landmark className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            <div className="mb-4">
              <DataTableToolbar
                state={banquetState}
                searchPlaceholder="Search banquets by name or location…"
              />
            </div>

            {!canViewBanquet ? (
              <p className="text-sm text-amber-700 dark:text-amber-200">No permission to view banquet table.</p>
            ) : loading ? (
              <TableSkeleton rows={5} />
            ) : filteredBanquets.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <div className="empty-state-icon">
                  <Building2 size={22} />
                </div>
                <p className="empty-state-title">No banquets found</p>
                <p className="empty-state-desc">Create a banquet to start adding halls.</p>
              </div>
            ) : (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <SortableHeader label="Name" sortKey="name" sort={banquetState.sort} onSort={banquetState.toggleSort} className="text-left py-3 px-2 text-sm font-semibold text-[var(--text-2)]" />
                      <SortableHeader label="Location" sortKey="location" sort={banquetState.sort} onSort={banquetState.toggleSort} className="text-left py-3 px-2 text-sm font-semibold text-[var(--text-2)]" />
                      <SortableHeader label="Halls" sortKey="halls" sort={banquetState.sort} onSort={banquetState.toggleSort} className="text-left py-3 px-2 text-sm font-semibold text-[var(--text-2)]" />
                      <th className="text-right py-3 px-2 text-sm font-semibold text-[var(--text-2)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBanquets.map((banquet) => (
                      <tr key={banquet.id} className="border-b border-[var(--border)]">
                        <td className="py-3 px-2 text-sm text-[var(--text-1)]">{banquet.name}</td>
                        <td className="py-3 px-2 text-sm text-[var(--text-2)]">
                          {[banquet.location, banquet.city, banquet.state]
                            .filter(Boolean)
                            .join(', ')}
                        </td>
                        <td className="py-3 px-2 text-sm text-[var(--text-2)]">
                          {banquet.halls?.length || 0}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEditBanquet && (
                              <button
                                className="p-2 text-[var(--text-4)] hover:text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg"
                                onClick={() => openEditBanquet(banquet)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteBanquet && (
                              <button
                                className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
                                onClick={() => deleteBanquet(banquet.id)}
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
            )}
            {!loading && filteredBanquets.length > 0 && (
              <DataTableFooter
                state={banquetState}
                totalItems={banquets.length}
                filteredCount={filteredBanquets.length}
                itemLabel="banquets"
              />
            )}
          </>
        ) : (
          <>
            <div className="page-head mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-1)]">Hall table</h2>
              {canAddHall && (
                <button
                  type="button"
                  className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                  onClick={openCreateHall}
                >
                  <Building2 className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            <div className="mb-4">
              <DataTableToolbar
                state={hallState}
                searchPlaceholder="Search halls by name or banquet…"
                rightSlot={
                  <select
                    aria-label="Sort halls"
                    className="input min-h-9 py-1 pr-7 max-w-[12rem]"
                    value={`${hallState.sort.key}:${hallState.sort.direction}`}
                    onChange={(e) => {
                      const [key, direction] = e.target.value.split(':');
                      if (direction === 'asc' || direction === 'desc') {
                        hallState.setSort({ key, direction });
                      }
                    }}
                  >
                    <option value="name:asc">Name (A–Z)</option>
                    <option value="name:desc">Name (Z–A)</option>
                    <option value="capacity:asc">Capacity (low → high)</option>
                    <option value="capacity:desc">Capacity (high → low)</option>
                    <option value="pricing:asc">Pricing (low → high)</option>
                    <option value="pricing:desc">Pricing (high → low)</option>
                  </select>
                }
              />
            </div>

            {!canViewHall ? (
              <p className="text-sm text-amber-700 dark:text-amber-200">No permission to view hall table.</p>
            ) : loading ? (
              <TableSkeleton rows={5} />
            ) : filteredHalls.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <div className="empty-state-icon">
                  <Building2 size={22} />
                </div>
                <p className="empty-state-title">No halls found</p>
                <p className="empty-state-desc">Add a hall to make it available for bookings.</p>
              </div>
            ) : (
              <div className="table-shell" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', paddingBottom: '16px' }}>
                  {paginatedHalls.map((hall) => (
                    <HallCard
                      key={hall.id}
                      hall={hall as any}
                      startDate={new Date()}
                      bookings={weeklyBookings}
                      canEdit={canEditHall}
                      canDelete={canDeleteHall}
                      onEdit={() => openEditHall(hall)}
                      onDelete={() => deleteHall(hall.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {!loading && filteredHalls.length > 0 && (
              <DataTableFooter
                state={hallState}
                totalItems={halls.length}
                filteredCount={filteredHalls.length}
                itemLabel="halls"
              />
            )}
          </>
        )}
        </div>
      )}
    </div>
  );
}

function HallsPageFallback() {
  return (
    <div className="card py-12 text-center">
      <p className="text-sm text-[var(--text-2)]">Loading venue workspace...</p>
    </div>
  );
}

export default function HallsPage() {
  return (
    <Suspense fallback={<HallsPageFallback />}>
      <HallsPageContent />
    </Suspense>
  );
}
