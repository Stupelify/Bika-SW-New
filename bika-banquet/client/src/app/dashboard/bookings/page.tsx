'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Edit, Plus, Printer, Save, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';

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

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
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

interface BookingPackRow {
  enabled: boolean;
  withHalls: boolean;
  withCatering: boolean;
  banquetId: string;
  hallId: string;
  templateMenuId: string;
  menuItemIds: string[];
  startTime: string;
  endTime: string;
  hallRate: string;
  menuPoints: string;
  ratePerPlate: string;
  pax: string;
  amount: string;
}

interface PaymentRow {
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
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
  additionalRequirements: string[];
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
      withHalls: true,
      withCatering: true,
      banquetId: '',
      hallId: '',
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
      withHalls: true,
      withCatering: true,
      banquetId: '',
      hallId: '',
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
      withHalls: false,
      withCatering: false,
      banquetId: '',
      hallId: '',
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
      withHalls: false,
      withCatering: false,
      banquetId: '',
      hallId: '',
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

const PACK_LABELS: Record<PackKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  hiTea: 'Hi-Tea',
  dinner: 'Dinner',
};

const PACK_ROW_STYLES: Record<PackKey, string> = {
  breakfast: 'border-orange-200 bg-orange-50/70',
  lunch: 'border-green-200 bg-green-50/70',
  hiTea: 'border-slate-200 bg-slate-50/80',
  dinner: 'border-slate-300 bg-slate-100/80',
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

export default function BookingsPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewBooking = hasAnyPermission(permissionSet, ['view_booking', 'manage_bookings']);
  const canAddBooking = hasAnyPermission(permissionSet, ['add_booking', 'manage_bookings']);
  const canEditBooking = hasAnyPermission(permissionSet, ['edit_booking', 'manage_bookings']);
  const canDeleteBooking = hasAnyPermission(permissionSet, ['delete_booking', 'manage_bookings']);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [banquets, setBanquets] = useState<BanquetOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [menuEditorPack, setMenuEditorPack] = useState<PackKey | null>(null);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({
    key: 'functionDate',
    direction: 'desc',
  });
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);

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

  const totalPayments = useMemo(
    () =>
      formData.payments.reduce((sum, row) => {
        const amount = Number(row.amount || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [formData.payments]
  );

  const totalBillAmount = useMemo(
    () =>
      (Object.keys(formData.packs) as PackKey[]).reduce((sum, key) => {
        const row = formData.packs[key];
        if (!row.enabled) return sum;
        const directAmount = Number(row.amount || 0);
        if (Number.isFinite(directAmount) && directAmount > 0) {
          return sum + directAmount;
        }
        const hallRate = Number(row.hallRate || 0);
        const ratePerPlate = Number(row.ratePerPlate || 0);
        const pax = Number(row.pax || 0);
        const fallback = Math.max(0, hallRate) + Math.max(0, ratePerPlate) * Math.max(0, pax);
        return sum + fallback;
      }, 0),
    [formData.packs]
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
      return {
        ...prev,
        packs: {
          ...prev.packs,
          [packKey]: {
            ...row,
            menuItemIds: nextIds,
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
    });
  };

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
    void loadLookups();
  }, [canAddBooking, canEditBooking]);

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
      const [customerRes, banquetRes, hallRes, itemRes, templateRes] = await Promise.all([
        api.getCustomers({ page: 1, limit: 5000 }),
        api.getBanquets({ page: 1, limit: 5000 }),
        api.getHalls({ page: 1, limit: 5000 }),
        api.getItems({ page: 1, limit: 5000 }),
        api.getTemplateMenus({ page: 1, limit: 5000 }),
      ]);
      const customerRows = customerRes.data?.data?.customers || [];
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

  const closeBookingForm = () => {
    setShowCreateForm(false);
    setEditingBookingId(null);
    setMenuEditorPack(null);
    setMenuItemSearch('');
    setFormData(initialFormData);
  };

  const openCreateBooking = () => {
    setEditingBookingId(null);
    setMenuEditorPack(null);
    setMenuItemSearch('');
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
      const response = await api.getBooking(bookingId);
      const booking = response.data?.data?.booking;
      if (!booking) {
        toast.error('Booking not found');
        return;
      }

      const primaryHallId =
        booking.halls?.[0]?.hallId || booking.halls?.[0]?.hall?.id || '';
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

        nextPacks[packKey] = {
          enabled: true,
          withHalls: Boolean(primaryHallId),
          withCatering: true,
          banquetId: primaryHall?.banquet?.id || '',
          hallId: primaryHallId,
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
        };
      });

      setEditingBookingId(bookingId);
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
          .map((entry: any) => entry.description)
          .filter(Boolean),
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

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.customerId || !formData.functionType.trim() || !formData.functionDate) {
      toast.error('Primary customer, function type and date are required');
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
      const expectedGuests = Math.max(
        1,
        ...enabledPackEntries
          .map((entry) => Number(entry.row.pax || 0))
          .filter((value) => value > 0)
      );
      const functionTime = enabledPackEntries[0]?.row.startTime || '12:00';
      const functionName = formData.functionType.trim();

      const hallChargeMap = new Map<string, number>();
      enabledPackEntries.forEach((entry) => {
        if (!entry.row.withHalls || !entry.row.hallId) return;
        const parsedCharge = Number(entry.row.hallRate || entry.row.amount || 0);
        const charge = Number.isFinite(parsedCharge) ? parsedCharge : 0;
        const current = hallChargeMap.get(entry.row.hallId) || 0;
        hallChargeMap.set(entry.row.hallId, Math.max(current, charge));
      });
      const hallsPayload = Array.from(hallChargeMap.entries()).map(([hallId, charges]) => ({
        hallId,
        charges,
      }));

      const additionalItemsPayload = formData.additionalRequirements
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({
          description: text,
          charges: 0,
          quantity: 1,
        }));

      const packsPayload = enabledPackEntries.map(({ key, row }) => {
        const matchingTemplate = templateMenus.find(
          (template) => template.id === row.templateMenuId
        );
        return {
          packName: PACK_LABELS[key],
          packCount: Math.max(1, toNumber(row.pax || '1')),
          noOfPack: Math.max(1, toNumber(row.pax || '1')),
          ratePerPlate: toNumber(row.ratePerPlate),
          setupCost: 0,
          extraCharges: 0,
          startTime: row.startTime || undefined,
          endTime: row.endTime || undefined,
          hallRate: row.hallRate || undefined,
          menuPoint: row.menuPoints ? toNumber(row.menuPoints) : undefined,
          hallName: halls.find((hall) => hall.id === row.hallId)?.name || undefined,
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
        const hallName = halls.find((hall) => hall.id === row.hallId)?.name || 'No hall';
        const templateName =
          templateMenus.find((template) => template.id === row.templateMenuId)?.name ||
          'Custom menu';
        return `${PACK_LABELS[key]}: ${row.pax || 0} pax, ${hallName}, hallRate=${
          row.hallRate || 0
        }, ratePerPlate=${row.ratePerPlate || 0}, menuTemplate=${templateName}, menuItems=${
          row.menuItemIds.length
        }, menuPoints=${row.menuPoints || 0}`;
      });

      const notes = [formData.notes.trim(), packSummary.length ? `Pack Summary - ${packSummary.join(' ; ')}` : '']
        .filter(Boolean)
        .join('\n');
      const internalNotesParts = [
        paymentSummary.length ? `Payment Entries - ${paymentSummary.join(' ; ')}` : '',
        `Settlement: discount=${formData.settlementDiscountAmount || 0}, amount=${
          formData.settlementAmount || 0
        }`,
        `Final Calc: discountAmount=${formData.finalDiscountAmount || 0}, discountPercent=${
          formData.finalDiscountPercent || 0
        }, finalAmount=${formData.finalAmount || 0}, totalBill=${totalBillAmount.toFixed(
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
        discountAmount: Number(formData.finalDiscountAmount || 0),
        discountPercentage: Number(formData.finalDiscountPercent || 0),
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
            disabled={customers.length === 0}
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
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Add at least one customer before creating bookings.
          </p>
        </div>
      )}

      <FormPromptModal
        open={showCreateForm}
        title={editingBookingId ? 'Edit Booking' : 'Booking Form'}
        onClose={closeBookingForm}
        widthClass="max-w-[1400px]"
      >
        <form onSubmit={handleSubmitBooking} className="space-y-5">
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Submit'}
              </span>
            </button>
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

          <section className="rounded-2xl border border-gray-300 p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-gray-900">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,100px] gap-3">
                <div>
                  <label className="label">
                    Primary Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select primary customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      includeSecondCustomer: e.target.checked,
                      secondCustomerId: e.target.checked ? prev.secondCustomerId : '',
                    }))
                  }
                />
                Add Second Customer
              </label>

              {formData.includeSecondCustomer && (
                <div>
                  <label className="label">Second Customer</label>
                  <select
                    className="input"
                    value={formData.secondCustomerId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, secondCustomerId: e.target.value }))
                    }
                  >
                    <option value="">Select second customer</option>
                    {customers.map((customer) => (
                      <option key={`second-${customer.id}`} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Referred By</label>
                <select
                  className="input"
                  value={formData.referredById}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, referredById: e.target.value }))
                  }
                >
                  <option value="">Select referrer</option>
                  {customers.map((customer) => (
                    <option key={`ref-${customer.id}`} value={customer.id}>
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
                  className="input"
                  type="date"
                  value={formData.functionDate}
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

              return (
                <div
                  key={packKey}
                  className={`rounded-2xl border p-3 space-y-3 ${PACK_ROW_STYLES[packKey]}`}
                >
                  <div className="grid grid-cols-1 xl:grid-cols-[120px,100px,120px,1fr,1fr] gap-3 items-center">
                    <label className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => updatePackRow(packKey, { enabled: e.target.checked })}
                      />
                      {PACK_LABELS[packKey]}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.withHalls}
                        onChange={(e) =>
                          updatePackRow(packKey, { withHalls: e.target.checked })
                        }
                      />
                      Halls
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.withCatering}
                        onChange={(e) =>
                          updatePackRow(packKey, { withCatering: e.target.checked })
                        }
                      />
                      Catering
                    </label>
                    <select
                      className="input"
                      value={row.banquetId}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        updatePackRow(packKey, {
                          banquetId: e.target.value,
                          hallId: '',
                        })
                      }
                    >
                      <option value="">Select Banquet</option>
                      {banquets.map((banquet) => (
                        <option key={banquet.id} value={banquet.id}>
                          {banquet.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={row.hallId}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { hallId: e.target.value })}
                    >
                      <option value="">Select Halls *</option>
                      {filteredHalls.map((hall) => (
                        <option key={hall.id} value={hall.id}>
                          {hall.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[120px,120px,1fr,110px,1fr,1fr,1fr,1fr] gap-3">
                    <input
                      className="input"
                      type="time"
                      value={row.startTime}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { startTime: e.target.value })}
                    />
                    <input
                      className="input"
                      type="time"
                      value={row.endTime}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { endTime: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Hall Rate"
                      value={row.hallRate}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { hallRate: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!row.enabled}
                      onClick={() => {
                        if (!row.enabled) return;
                        setMenuEditorPack(packKey);
                        setMenuItemSearch('');
                      }}
                    >
                      Menu ({row.menuItemIds.length})
                    </button>
                    <input
                      className="input"
                      placeholder="Menu p..."
                      value={row.menuPoints}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { menuPoints: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Rate per ..."
                      value={row.ratePerPlate}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        updatePackRow(packKey, { ratePerPlate: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      placeholder="PAX *"
                      value={row.pax}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { pax: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Amount"
                      value={row.amount}
                      disabled={!row.enabled}
                      onChange={(e) => updatePackRow(packKey, { amount: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-gray-300 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Additional Requirements</h3>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-600 text-primary-700 hover:bg-primary-50"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    additionalRequirements: [...prev.additionalRequirements, ''],
                  }))
                }
                aria-label="Add requirement"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {formData.additionalRequirements.length === 0 ? (
              <p className="text-sm text-gray-500">No additional requirements.</p>
            ) : (
              <div className="space-y-2">
                {formData.additionalRequirements.map((item, index) => (
                  <div key={`req-${index}`} className="flex gap-2">
                    <input
                      className="input"
                      value={item}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          additionalRequirements: prev.additionalRequirements.map(
                            (entry, entryIndex) =>
                              entryIndex === index ? e.target.value : entry
                          ),
                        }))
                      }
                      placeholder="Requirement details"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
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
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-300 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Final Calculation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Discount Amount</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={formData.finalDiscountAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, finalDiscountAmount: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Discount %</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.finalDiscountPercent}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, finalDiscountPercent: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Final Amount</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={formData.finalAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, finalAmount: e.target.value }))
                  }
                />
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
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Finalize'}
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
                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-gray-200">
                  {groupedMenuItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No matching items</div>
                  ) : (
                    groupedMenuItems.map(([group, grouped]) => (
                      <div key={group}>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-800 bg-primary-50 border-b border-gray-200">
                          {group}
                        </div>
                        {grouped.map((item) => (
                          <label
                            key={`${menuEditorPack}-${item.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={activeMenuPackRow.menuItemIds.includes(item.id)}
                              onChange={() => togglePackMenuItem(menuEditorPack, item.id)}
                            />
                            <span>{item.name}</span>
                          </label>
                        ))}
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
                  <div className="max-h-[360px] overflow-y-auto space-y-3">
                    {selectedMenuItemsByGroup.map(([group, grouped]) => (
                      <div key={`selected-group-${group}`} className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {grouped.map((item) => (
                            <span
                              key={`selected-${menuEditorPack}-${item.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm"
                            >
                              {item.name}
                              <button
                                type="button"
                                className="text-red-600"
                                onClick={() => togglePackMenuItem(menuEditorPack, item.id)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
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

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Overall search across all booking columns..."
            className="input pl-10"
          />
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
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="table-shell">
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
                  {(canEditBooking || canDeleteBooking) && (
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  )}
                </tr>
                <tr className="table-search-row border-b border-gray-100 bg-gray-50/70">
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
                  {(canEditBooking || canDeleteBooking) && <th className="py-2 px-4" />}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
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
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.isQuotation
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
                    {(canEditBooking || canDeleteBooking) && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
