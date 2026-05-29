'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, fetchAllCustomers } from '@/lib/api';
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
} from 'lucide-react';
import Link from 'next/link';
import FormPromptModal from '@/components/FormPromptModal';
import FloatingActionButton from '@/components/FloatingActionButton';
import EmptyState from '@/components/EmptyState';
import SortableHeader from '@/components/SortableHeader';
import { TableSkeleton } from '@/components/Skeletons';
import Combobox from '@/components/Combobox';
import { TableColumnConfig } from '@/lib/tableUtils';
import DataTableToolbar, { DataTableFooter } from '@/components/data-table/DataTableToolbar';
import { useTableState } from '@/hooks/useTableState';
import { applyTableState, paginateRows } from '@/lib/data-table/apply';
import type { FilterSchema } from '@/lib/data-table/types';
import { formatDateDDMMYYYY } from '@/lib/date';
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

export default function CustomersPage() {
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewCustomer = hasAnyPermission(permissionSet, ['view_customer', 'manage_customers']);
  const canAddCustomer = hasAnyPermission(permissionSet, ['add_customer', 'manage_customers']);
  const canEditCustomer = hasAnyPermission(permissionSet, ['edit_customer', 'manage_customers']);
  const canDeleteCustomer = hasAnyPermission(permissionSet, ['delete_customer', 'manage_customers']);

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isWhatsappDifferent, setIsWhatsappDifferent] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [emailFieldError, setEmailFieldError] = useState('');
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState('');
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<{
    phone?: string;
    alterPhone?: string;
    whatsappNumber?: string;
  }>({});
  const debouncedPincode = useDebounce(formData.pincode, 350);

  const tableColumns = useMemo<TableColumnConfig<CustomerRow>[]>(
    () => [
      {
        key: 'name',
        accessor: (customer) =>
          [
            customer.name,
            customer.phoneCountryCode ?? '',
            customer.phone,
            customer.alterPhone ?? customer.alternatePhone ?? '',
            customer.whatsappNumber ?? customer.whatsapp ?? '',
          ]
            .filter(Boolean)
            .join(' '),
        sortable: true,
        searchable: true,
      },
      {
        key: 'contact',
        accessor: (customer) =>
          [customer.phoneCountryCode ?? '', customer.phone, customer.email ?? '']
            .filter(Boolean)
            .join(' '),
        sortable: true,
        searchable: true,
      },
      {
        key: 'location',
        accessor: (customer) => `${customer.city ?? ''} ${customer.state ?? ''}`.trim(),
        sortable: true,
        searchable: true,
      },
      {
        key: 'stats',
        accessor: (customer) =>
          (customer._count?.enquiries ?? 0) + (customer._count?.bookings ?? 0),
        sortable: true,
        searchable: false,
      },
      {
        key: 'createdAt',
        accessor: (customer) => customer.createdAt,
        sortable: true,
        searchable: false,
      },
    ],
    []
  );

  const filterSchemas = useMemo<FilterSchema[]>(
    () => [{ id: 'createdAt', type: 'dateRange', label: 'Created' }],
    []
  );

  const filterDefs = useMemo(
    () => [{ id: 'createdAt', accessor: (c: CustomerRow) => c.createdAt }],
    []
  );

  const tableState = useTableState({
    prefix: 'customers',
    filters: filterSchemas,
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const filteredCustomers = useMemo(
    () => applyTableState(customers, tableColumns, filterDefs, tableState),
    [customers, tableColumns, filterDefs, tableState]
  );

  const paginatedCustomers = useMemo(
    () => paginateRows(filteredCustomers, tableState.page, tableState.pageSize),
    [filteredCustomers, tableState.page, tableState.pageSize]
  );

  const referrerOptions = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers]
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

  const loadCustomers = useCallback(async () => {
    try {
      if (!hasAnyPermission(permissionSet, ['view_customer', 'add_customer', 'edit_customer', 'manage_customers'])) {
        setCustomers([]);
        return;
      }
      setLoading(true);
      const customerRows = (await fetchAllCustomers()) as unknown as CustomerRow[];
      setCustomers(customerRows);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [permissionSet]);

  useEffect(() => {
    void loadCustomers();
  }, [canViewCustomer, loadCustomers]);

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
    <div className="space-y-6">
      <div className="page-head">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Customers</h1>
          <p className="text-[var(--text-2)] mt-1">Manage your customer database</p>
        </div>
        {canAddCustomer && (
          <button
            type="button"
            onClick={openCreatePrompt}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

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
                    options={referrerOptions.map((customer) => ({
                      value: customer.id,
                      label: formatCustomerOptionLabel(customer),
                      secondary: customer.phone,
                      searchText: customerSearchText(customer),
                    }))}
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
        <DataTableToolbar
          state={tableState}
          searchPlaceholder="Search by name, phone, alt phone, WhatsApp, email, city, state…"
        />
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
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={tableState.search ? Search : Users}
            variant={
              tableState.search ? 'search' : tableState.activeFilterCount > 0 ? 'filter' : 'page'
            }
            title={
              tableState.search
                ? 'No customers match your search'
                : tableState.activeFilterCount > 0
                  ? 'No matches'
                  : 'No customers found'
            }
            description={
              tableState.search || tableState.activeFilterCount > 0
                ? 'Try adjusting the search or active filters.'
                : 'Add your first customer to get started.'
            }
            action={
              tableState.search || tableState.activeFilterCount > 0
                ? { label: 'Clear all', onClick: tableState.clearAll }
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
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <SortableHeader label="Name" sortKey="name" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Contact" sortKey="contact" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Location" sortKey="location" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Stats" sortKey="stats" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <SortableHeader label="Created" sortKey="createdAt" sort={tableState.sort} onSort={tableState.toggleSort} />
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-2)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]"
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-[var(--text-1)]">{customer.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                            <Phone className="w-4 h-4" />
                            {(customer.phoneCountryCode || '+91') + ' ' + customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                              <Mail className="w-4 h-4" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        {customer.city && customer.state
                          ? `${customer.city}, ${customer.state}`
                          : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-3 text-sm">
                          <span className="text-[var(--text-2)]">
                            {customer._count?.enquiries ?? 0} enquiries
                          </span>
                          <span className="text-[var(--text-2)]">
                            {customer._count?.bookings ?? 0} bookings
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--text-2)]">
                        {formatDateDDMMYYYY(customer.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {canViewCustomer && (
                            <Link
                              href={`/dashboard/customers/${customer.id}`}
                              className="p-2 text-[var(--text-2)] hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {canEditCustomer && (
                            <button
                              type="button"
                              onClick={() => void openEditPrompt(customer.id)}
                              className="p-2 text-[var(--text-2)] hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-500/10 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteCustomer && (
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="p-2 text-[var(--text-2)] hover:text-red-600 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
                              title="Delete"
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
              totalItems={customers.length}
              filteredCount={filteredCustomers.length}
              itemLabel="customers"
            />
          </>
        )}
      </div>

      {canAddCustomer && (
        <FloatingActionButton
          onClick={openCreatePrompt}
          label="New Customer"
        />
      )}
    </div>
  );
}
