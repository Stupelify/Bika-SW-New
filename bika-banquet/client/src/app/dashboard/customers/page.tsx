'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Save,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  Star,
} from 'lucide-react';
import Link from 'next/link';
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
  priority: '',
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
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [isWhatsappDifferent, setIsWhatsappDifferent] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState(initialColumnSearch);
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [emailFieldError, setEmailFieldError] = useState('');
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<{
    phone?: string;
    alterPhone?: string;
    whatsappNumber?: string;
  }>({});

  const tableColumns = useMemo<TableColumnConfig<CustomerRow>[]>(
    () => [
      {
        key: 'name',
        accessor: (customer) => customer.name,
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

  const filteredCustomers = useMemo(
    () => filterAndSortRows(customers, tableColumns, globalSearch, columnSearch, sort),
    [customers, tableColumns, globalSearch, columnSearch, sort]
  );

  const referrerOptions = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers]
  );
  const primaryPhoneDigits = getExpectedPhoneDigits(formData.phoneCountryIso);
  const secondaryPhoneDigits = getExpectedPhoneDigits(formData.alterPhoneCountryIso);
  const whatsappPhoneDigits = getExpectedPhoneDigits(formData.whatsappCountryIso);

  useEffect(() => {
    void loadCustomers();
  }, [canViewCustomer]);

  const resetCreateForm = () => {
    setFormData(initialFormData);
    setIsWhatsappDifferent(false);
    setEmailFieldError('');
    setPhoneFieldErrors({});
  };

  const closeCreatePrompt = () => {
    if (saving) {
      return;
    }
    setShowCreatePrompt(false);
    resetCreateForm();
  };

  const loadCustomers = async () => {
    try {
      if (!canViewCustomer) {
        setCustomers([]);
        return;
      }
      setLoading(true);
      const response = await api.getCustomers({
        page: 1,
        limit: 5000,
      });
      setCustomers(response.data.data.customers || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnSearch = (key: keyof typeof initialColumnSearch, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: value }));
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
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

      await api.createCustomer({
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
      });
      toast.success('Customer created successfully');
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
      const message = getErrorMessage(error, 'Failed to create customer');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-head">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        {canAddCustomer && (
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setShowCreatePrompt(true);
            }}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      {!canViewCustomer && (
        <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
          You do not have permission to view customers.
        </div>
      )}

      <FormPromptModal
        open={showCreatePrompt}
        title="Add Customer"
        onClose={closeCreatePrompt}
        widthClass="max-w-6xl"
      >
        <form onSubmit={handleCreate} className="space-y-7" noValidate>
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
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
                  <select
                    value={formData.phoneCountryIso}
                    onChange={(e) => {
                      const nextIso = e.target.value;
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
                    className="input"
                  >
                    {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                      <option key={option.iso2} value={option.iso2}>
                        {option.flag} {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
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
                <p className="mt-1 text-xs text-gray-500">
                  {getDialCodeOption(formData.phoneCountryIso).country} numbers must be{' '}
                  {primaryPhoneDigits} digits.
                </p>
              </div>
              <div className="md:col-span-4">
                <label className="label">2nd Phone No.</label>
                <div className="grid grid-cols-[180px,1fr] gap-2">
                  <select
                    value={formData.alterPhoneCountryIso}
                    onChange={(e) => {
                      const nextIso = e.target.value;
                      const digits = getExpectedPhoneDigits(nextIso);
                      setPhoneFieldErrors((prev) => ({ ...prev, alterPhone: undefined }));
                      setFormData((prev) => ({
                        ...prev,
                        alterPhoneCountryIso: nextIso,
                        alterPhone: prev.alterPhone.slice(0, digits),
                      }));
                    }}
                    className="input"
                  >
                    {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                      <option
                        key={`alt-${option.iso2}`}
                        value={option.iso2}
                      >
                        {option.flag} {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
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
                <p className="mt-1 text-xs text-gray-500">
                  Optional. If entered, it must be exactly {secondaryPhoneDigits} digits.
                </p>
              </div>
              <div className="md:col-span-4">
                <label className="label">Caste</label>
                <select
                  value={formData.caste}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, caste: e.target.value }))
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
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                  <select
                    value={formData.whatsappCountryIso}
                    onChange={(e) => {
                      const nextIso = e.target.value;
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
                    className="input"
                  >
                    {COUNTRY_DIAL_CODE_OPTIONS.map((option) => (
                      <option
                        key={`wa-${option.iso2}`}
                        value={option.iso2}
                      >
                        {option.flag} {option.country} ({option.code})
                      </option>
                    ))}
                  </select>
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
                  <p className="mt-1 text-xs text-gray-500">
                    Must be exactly {whatsappPhoneDigits} digits.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country: e.target.value }))
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
              </div>
              <div className="md:col-span-4">
                <label className="label">State</label>
                <input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className="input"
                  placeholder="State"
                />
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
            <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
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
            <h3 className="text-lg font-semibold text-gray-900">Other Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="label">Referred By</label>
                <select
                  value={formData.referredById}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      referredById: e.target.value,
                    }))
                  }
                  className="input"
                >
                  <option value="">Select customer</option>
                  {referrerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phoneCountryCode || '+91'} {customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, priority: e.target.value }))
                  }
                  className="input"
                >
                  <option value="">Select priority</option>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="label">Rating</label>
                <div className="h-11 flex items-center gap-1 rounded-xl border border-gray-200 px-3">
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
                          className={`w-5 h-5 ${
                            active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rating: '0' }))}
                    className="ml-2 text-xs font-medium text-gray-500 hover:text-gray-700"
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
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Create Customer'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Overall search across all customer columns..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card">
        {!canViewCustomer ? (
          <div className="text-sm text-gray-500">No data available.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    sort={sort}
                    onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                  />
                  <SortableHeader
                    label="Contact"
                    sortKey="contact"
                    sort={sort}
                    onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                  />
                  <SortableHeader
                    label="Location"
                    sortKey="location"
                    sort={sort}
                    onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                  />
                  <SortableHeader
                    label="Stats"
                    sortKey="stats"
                    sort={sort}
                    onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                  />
                  <SortableHeader
                    label="Created"
                    sortKey="createdAt"
                    sort={sort}
                    onSort={(key) => setSort((prev) => getNextSort(prev, key))}
                  />
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
                <tr className="table-search-row border-b border-gray-100 bg-gray-50/70">
                  <th className="py-2 px-4">
                    <input
                      className="input h-9"
                      placeholder="Search name"
                      value={columnSearch.name}
                      onChange={(e) => handleColumnSearch('name', e.target.value)}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      className="input h-9"
                      placeholder="Search contact"
                      value={columnSearch.contact}
                      onChange={(e) => handleColumnSearch('contact', e.target.value)}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      className="input h-9"
                      placeholder="Search location"
                      value={columnSearch.location}
                      onChange={(e) => handleColumnSearch('location', e.target.value)}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      className="input h-9"
                      placeholder="Search stats"
                      value={columnSearch.stats}
                      onChange={(e) => handleColumnSearch('stats', e.target.value)}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      className="input h-9"
                      placeholder="Search date"
                      value={columnSearch.createdAt}
                      onChange={(e) => handleColumnSearch('createdAt', e.target.value)}
                    />
                  </th>
                  <th className="py-2 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{customer.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {(customer.phoneCountryCode || '+91') + ' ' + customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-3 text-sm">
                        <span className="text-gray-600">
                          {customer._count?.enquiries ?? 0} enquiries
                        </span>
                        <span className="text-gray-600">
                          {customer._count?.bookings ?? 0} bookings
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDateDDMMYYYY(customer.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {canViewCustomer && (
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {canEditCustomer && (
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {canDeleteCustomer && (
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
        )}
      </div>
    </div>
  );
}
