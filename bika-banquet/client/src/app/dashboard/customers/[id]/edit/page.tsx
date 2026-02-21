'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import {
  COUNTRY_DIAL_CODE_OPTIONS,
  DEFAULT_PHONE_COUNTRY_ISO,
  EMAIL_REGEX,
  NAME_REGEX,
  digitsOnly,
  getCountryIsoByCode,
  getDialCodeOption,
  getPhoneCodeByIso,
  getExpectedPhoneDigits,
  sanitizeNameInput,
  validatePhoneNumberForCountry,
} from '@/lib/customerFormOptions';

interface CustomerFormData {
  name: string;
  phoneCountryIso: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  notes: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  phoneCountryIso: DEFAULT_PHONE_COUNTRY_ISO,
  phone: '',
  email: '',
  city: '',
  state: '',
  address: '',
  notes: '',
};

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const phoneDigits = getExpectedPhoneDigits(formData.phoneCountryIso);

  useEffect(() => {
    void loadCustomer();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomer(params.id);
      const customer = response.data.data.customer;
      setFormData({
        name: customer.name || '',
        phoneCountryIso: getCountryIsoByCode(customer.phoneCountryCode),
        phone: customer.phone || '',
        email: customer.email || '',
        city: customer.city || '',
        state: customer.state || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load customer';
      toast.error(message);
      router.push('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhoneError('');
    setEmailError('');

    const name = formData.name.trim();
    const phone = digitsOnly(formData.phone);
    const email = formData.email.trim();

    if (!name || !phone) {
      toast.error('Name and phone are required');
      return;
    }
    if (!NAME_REGEX.test(name)) {
      toast.error('Name can contain only letters and spaces');
      return;
    }
    const phoneError = validatePhoneNumberForCountry(
      phone,
      formData.phoneCountryIso,
      'Phone number'
    );
    if (phoneError) {
      setPhoneError(phoneError);
      toast.error(phoneError);
      return;
    }
    if (email && !EMAIL_REGEX.test(email)) {
      const message = 'Email must contain @ and .';
      setEmailError(message);
      toast.error(message);
      return;
    }

    try {
      setSaving(true);
      await api.updateCustomer(params.id, {
        name,
        phone,
        phoneCountryCode: getPhoneCodeByIso(formData.phoneCountryIso),
        email: email || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success('Customer updated successfully');
      router.push(`/dashboard/customers/${params.id}`);
    } catch (error: any) {
      const serverPhoneError = error?.response?.data?.errors?.find((entry: any) =>
        String(entry?.field || '').endsWith('phone')
      )?.message;
      const serverEmailError = error?.response?.data?.errors?.find((entry: any) =>
        String(entry?.field || '').endsWith('email')
      )?.message;
      if (serverPhoneError) {
        setPhoneError(serverPhoneError);
      }
      if (serverEmailError) {
        setEmailError(serverEmailError);
      }
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        'Failed to update customer';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href={`/dashboard/customers/${params.id}`} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="text-gray-600 mt-1">
            Update contact details and notes.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input
              value={formData.name}
              onChange={(e) => setField('name', sanitizeNameInput(e.target.value))}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Phone *</label>
            <div className="grid grid-cols-[180px,1fr] gap-2">
              <select
                value={formData.phoneCountryIso}
                onChange={(e) => {
                  const nextIso = e.target.value;
                  const digits = getExpectedPhoneDigits(nextIso);
                  setPhoneError('');
                  setFormData((prev) => ({
                    ...prev,
                    phoneCountryIso: nextIso,
                    phone: prev.phone.slice(0, digits),
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
                  setPhoneError('');
                  setField('phone', digitsOnly(e.target.value).slice(0, phoneDigits));
                }}
                className="input"
                inputMode="numeric"
                minLength={phoneDigits}
                maxLength={phoneDigits}
                required
              />
            </div>
            {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {getDialCodeOption(formData.phoneCountryIso).country} numbers must be{' '}
              {phoneDigits} digits.
            </p>
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setEmailError('');
                setField('email', e.target.value);
              }}
              className="input"
            />
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </div>
          <div>
            <label className="label">City</label>
            <input
              value={formData.city}
              onChange={(e) => setField('city', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">State</label>
            <input
              value={formData.state}
              onChange={(e) => setField('state', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setField('address', e.target.value)}
            className="input min-h-[96px]"
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="input min-h-[96px]"
          />
        </div>

        <div className="form-actions pt-2">
          <Link href={`/dashboard/customers/${params.id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <span className="inline-flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Update Customer'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
