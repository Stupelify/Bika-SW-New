'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Edit, Landmark, Save, Search, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
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
  order: '',
  photo: '',
  photoFileName: '',
  banquetId: '',
};

const initialBanquetColumnSearch = {
  name: '',
  location: '',
  halls: '',
};

const initialHallColumnSearch = {
  name: '',
  capacity: '',
  pricing: '',
};

const BANQUETS_PAGE_SIZE = 75;
const HALLS_PAGE_SIZE = 75;
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
  const [loading, setLoading] = useState(true);
  const [savingBanquet, setSavingBanquet] = useState(false);
  const [savingHall, setSavingHall] = useState(false);
  const [showBanquetPrompt, setShowBanquetPrompt] = useState(false);
  const [showHallPrompt, setShowHallPrompt] = useState(false);
  const [editingBanquetId, setEditingBanquetId] = useState<string | null>(null);
  const [editingHallId, setEditingHallId] = useState<string | null>(null);
  const [banquetForm, setBanquetForm] = useState(initialBanquetForm);
  const [hallForm, setHallForm] = useState(initialHallForm);
  const [banquetGlobalSearch, setBanquetGlobalSearch] = useState('');
  const [banquetColumnSearch, setBanquetColumnSearch] = useState(
    initialBanquetColumnSearch
  );
  const [hallGlobalSearch, setHallGlobalSearch] = useState('');
  const [hallColumnSearch, setHallColumnSearch] = useState(initialHallColumnSearch);
  const [banquetSort, setBanquetSort] = useState<SortState>({
    key: 'name',
    direction: 'asc',
  });
  const [hallSort, setHallSort] = useState<SortState>({
    key: 'name',
    direction: 'asc',
  });
  const [banquetPage, setBanquetPage] = useState(1);
  const [hallPage, setHallPage] = useState(1);
  const [activeVenueSection, setActiveVenueSection] = useState<VenueSection>('banquet');
  const sectionParam = searchParams.get('section');

  const banquetColumns = useMemo<TableColumnConfig<Banquet>[]>(
    () => [
      { key: 'name', accessor: (banquet) => banquet.name },
      {
        key: 'location',
        accessor: (banquet) =>
          [banquet.location, banquet.city, banquet.state].filter(Boolean).join(', '),
      },
      { key: 'halls', accessor: (banquet) => banquet.halls?.length || 0 },
    ],
    []
  );

  const hallColumns = useMemo<TableColumnConfig<Hall>[]>(
    () => [
      {
        key: 'name',
        accessor: (hall) => `${hall.name} ${hall.banquet?.name || 'No banquet'}`,
      },
      {
        key: 'capacity',
        accessor: (hall) =>
          `${hall.capacity}${hall.floatingCapacity ? ` ${hall.floatingCapacity}` : ''}`,
      },
      {
        key: 'pricing',
        accessor: (hall) => hall.basePrice ?? hall.rate ?? 0,
      },
    ],
    []
  );

  const filteredBanquets = useMemo(
    () =>
      filterAndSortRows(
        banquets,
        banquetColumns,
        banquetGlobalSearch,
        banquetColumnSearch,
        banquetSort
      ),
    [
      banquets,
      banquetColumns,
      banquetGlobalSearch,
      banquetColumnSearch,
      banquetSort,
    ]
  );

  const filteredHalls = useMemo(
    () =>
      filterAndSortRows(halls, hallColumns, hallGlobalSearch, hallColumnSearch, hallSort),
    [halls, hallColumns, hallGlobalSearch, hallColumnSearch, hallSort]
  );

  const banquetTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBanquets.length / BANQUETS_PAGE_SIZE)),
    [filteredBanquets.length]
  );

  const hallTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredHalls.length / HALLS_PAGE_SIZE)),
    [filteredHalls.length]
  );

  const paginatedBanquets = useMemo(() => {
    const safePage = Math.min(Math.max(banquetPage, 1), banquetTotalPages);
    const startIndex = (safePage - 1) * BANQUETS_PAGE_SIZE;
    return filteredBanquets.slice(startIndex, startIndex + BANQUETS_PAGE_SIZE);
  }, [banquetPage, banquetTotalPages, filteredBanquets]);

  const paginatedHalls = useMemo(() => {
    const safePage = Math.min(Math.max(hallPage, 1), hallTotalPages);
    const startIndex = (safePage - 1) * HALLS_PAGE_SIZE;
    return filteredHalls.slice(startIndex, startIndex + HALLS_PAGE_SIZE);
  }, [hallPage, hallTotalPages, filteredHalls]);

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

  useEffect(() => {
    setBanquetPage(1);
  }, [banquetGlobalSearch, banquetColumnSearch, banquetSort]);

  useEffect(() => {
    setHallPage(1);
  }, [hallGlobalSearch, hallColumnSearch, hallSort]);

  useEffect(() => {
    if (banquetPage <= banquetTotalPages) return;
    setBanquetPage(banquetTotalPages);
  }, [banquetPage, banquetTotalPages]);

  useEffect(() => {
    if (hallPage <= hallTotalPages) return;
    setHallPage(hallTotalPages);
  }, [hallPage, hallTotalPages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [banquetsRes, hallsRes] = await Promise.all([
        canViewBanquet ? api.getBanquets({ page: 1, limit: 2000 }) : Promise.resolve(null),
        canViewHall ? api.getHalls({ page: 1, limit: 2000 }) : Promise.resolve(null),
      ]);
      const banquetRows = banquetsRes?.data?.data?.banquets || [];
      setBanquets(banquetRows);
      setHalls(hallsRes?.data?.data?.halls || []);
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
        capacity: 1,
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
        <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
        <p className="text-gray-600 mt-1">
          Maintain banquet properties and hall inventory in separate tables.
        </p>
      </div>

      {!canViewBanquet && !canViewHall && (
        <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
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
              <label className="block rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:border-primary-300 transition cursor-pointer">
                <div className="text-sm text-gray-600">
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
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
              <h2 className="text-lg font-semibold text-gray-900">Banquet table</h2>
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

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                value={banquetGlobalSearch}
                onChange={(e) => setBanquetGlobalSearch(e.target.value)}
                placeholder="Overall search in banquet table..."
              />
            </div>

            {!canViewBanquet ? (
              <p className="text-sm text-amber-700">No permission to view banquet table.</p>
            ) : loading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredBanquets.length === 0 ? (
              <p className="text-gray-500 text-sm">No banquets found.</p>
            ) : (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <SortableHeader
                        label="Name"
                        sortKey="name"
                        sort={banquetSort}
                        onSort={(key) => setBanquetSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <SortableHeader
                        label="Location"
                        sortKey="location"
                        sort={banquetSort}
                        onSort={(key) => setBanquetSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <SortableHeader
                        label="Halls"
                        sortKey="halls"
                        sort={banquetSort}
                        onSort={(key) => setBanquetSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                    <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search name"
                          value={banquetColumnSearch.name}
                          onChange={(e) =>
                            setBanquetColumnSearch((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search location"
                          value={banquetColumnSearch.location}
                          onChange={(e) =>
                            setBanquetColumnSearch((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search halls"
                          value={banquetColumnSearch.halls}
                          onChange={(e) =>
                            setBanquetColumnSearch((prev) => ({
                              ...prev,
                              halls: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBanquets.map((banquet) => (
                      <tr key={banquet.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 text-sm text-gray-900">{banquet.name}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {[banquet.location, banquet.city, banquet.state]
                            .filter(Boolean)
                            .join(', ')}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {banquet.halls?.length || 0}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEditBanquet && (
                              <button
                                className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                onClick={() => openEditBanquet(banquet)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteBanquet && (
                              <button
                                className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
                <TablePagination
                  currentPage={banquetPage}
                  totalPages={banquetTotalPages}
                  totalItems={filteredBanquets.length}
                  pageSize={BANQUETS_PAGE_SIZE}
                  itemLabel="banquets"
                  onPageChange={setBanquetPage}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="page-head mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Hall table</h2>
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

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                value={hallGlobalSearch}
                onChange={(e) => setHallGlobalSearch(e.target.value)}
                placeholder="Overall search in hall table..."
              />
            </div>

            {!canViewHall ? (
              <p className="text-sm text-amber-700">No permission to view hall table.</p>
            ) : loading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredHalls.length === 0 ? (
              <p className="text-gray-500 text-sm">No halls found.</p>
            ) : (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <SortableHeader
                        label="Hall"
                        sortKey="name"
                        sort={hallSort}
                        onSort={(key) => setHallSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <SortableHeader
                        label="Capacity"
                        sortKey="capacity"
                        sort={hallSort}
                        onSort={(key) => setHallSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <SortableHeader
                        label="Pricing"
                        sortKey="pricing"
                        sort={hallSort}
                        onSort={(key) => setHallSort((prev) => getNextSort(prev, key))}
                        className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                      />
                      <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                    <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search hall"
                          value={hallColumnSearch.name}
                          onChange={(e) =>
                            setHallColumnSearch((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search capacity"
                          value={hallColumnSearch.capacity}
                          onChange={(e) =>
                            setHallColumnSearch((prev) => ({
                              ...prev,
                              capacity: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2">
                        <input
                          className="input h-9"
                          placeholder="Search pricing"
                          value={hallColumnSearch.pricing}
                          onChange={(e) =>
                            setHallColumnSearch((prev) => ({
                              ...prev,
                              pricing: e.target.value,
                            }))
                          }
                        />
                      </th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHalls.map((hall) => (
                      <tr key={hall.id} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <p className="text-sm text-gray-900">{hall.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {hall.banquet?.name || 'No banquet'}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {hall.capacity}
                          {hall.floatingCapacity ? ` / ${hall.floatingCapacity}` : ''}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {hall.basePrice
                            ? `INR ${hall.basePrice.toLocaleString()}`
                            : hall.rate || '-'}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEditHall && (
                              <button
                                className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                onClick={() => openEditHall(hall)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteHall && (
                              <button
                                className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                onClick={() => deleteHall(hall.id)}
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
                  currentPage={hallPage}
                  totalPages={hallTotalPages}
                  totalItems={filteredHalls.length}
                  pageSize={HALLS_PAGE_SIZE}
                  itemLabel="halls"
                  onPageChange={setHallPage}
                />
              </div>
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
      <p className="text-sm text-gray-600">Loading venue workspace...</p>
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
