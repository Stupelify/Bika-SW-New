'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ArrowLeft, Edit, Mail, MapPin, Phone } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  enquiries?: Array<{ id: string; functionName: string; status: string }>;
  bookings?: Array<{ id: string; functionName: string; status: string }>;
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadCustomer();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomer(params.id);
      setCustomer(response.data.data.customer);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to load customer';
      toast.error(message);
      router.push('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="page-head">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/customers" className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-1">Customer details and history</p>
          </div>
        </div>
        <Link
          href={`/dashboard/customers/${customer.id}/edit`}
          className="btn btn-primary w-full sm:w-auto justify-center"
        >
          <span className="inline-flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </span>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2 text-gray-700">
            <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
            <span>{customer.email || '-'}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
            <span>
              {customer.address || '-'}
              {customer.city || customer.state
                ? ` (${[customer.city, customer.state].filter(Boolean).join(', ')})`
                : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Enquiries
          </h2>
          {customer.enquiries && customer.enquiries.length > 0 ? (
            <div className="space-y-2">
              {customer.enquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-800">{enquiry.functionName}</span>
                  <span className="text-xs text-gray-500">{enquiry.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No enquiries found</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Bookings
          </h2>
          {customer.bookings && customer.bookings.length > 0 ? (
            <div className="space-y-2">
              {customer.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-800">{booking.functionName}</span>
                  <span className="text-xs text-gray-500">{booking.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No bookings found</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {customer.notes || 'No notes added.'}
        </p>
      </div>
    </div>
  );
}
