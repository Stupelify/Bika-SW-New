'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api, fetchAllCustomers } from '@/lib/api';
import { resolveDueAmount, resolvePaymentReceivedGross } from '@bika/booking-core';
import { toast } from 'sonner';
import { queryKeys } from './keys';
import { buildListParams, type ListParamsInput, type PaginationMeta } from '@/lib/listQuery';

const BOOKINGS_LIST_PARAMS = { page: 1, limit: 5000 } as const;

async function fetchBookingsList(): Promise<unknown[]> {
  const response = await api.getBookings(BOOKINGS_LIST_PARAMS);
  return response.data?.data?.bookings || [];
}

export function useBookingsListQuery<T = unknown[]>(enabled: boolean) {
  return useQuery<T>({
    queryKey: queryKeys.bookings.list(BOOKINGS_LIST_PARAMS),
    queryFn: async () => (await fetchBookingsList()) as T,
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useInvalidateBookingsList() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
}

export function useCustomersListQuery<T = Record<string, unknown>[]>(enabled: boolean) {
  return useQuery<T>({
    queryKey: queryKeys.customers.list(),
    queryFn: async () => (await fetchAllCustomers()) as T,
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useInvalidateCustomersList() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
}

export interface ServerListResult<T> {
  rows: T[];
  pagination: PaginationMeta;
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 1,
};

/**
 * Server-paginated customers list. Keyed on page/search/sort so each
 * page/query is cached independently; keepPreviousData avoids a blank table
 * while the next page/search loads. Customers allow a larger page limit.
 */
export function useCustomersServerListQuery<T = Record<string, unknown>>(
  enabled: boolean,
  input: ListParamsInput
) {
  const params = buildListParams(input, 5000);
  return useQuery<ServerListResult<T>>({
    queryKey: queryKeys.customers.serverList(
      params as unknown as Record<string, unknown>
    ),
    queryFn: async () => {
      const response = await api.getCustomers(params);
      const data = response.data?.data;
      return {
        rows: (data?.customers || []) as T[],
        pagination: (data?.pagination as PaginationMeta) || {
          ...EMPTY_PAGINATION,
          limit: params.limit,
        },
      };
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useEnquiriesListQuery<T = unknown[]>(enabled: boolean, statusFilter: string) {
  return useQuery<T>({
    queryKey: queryKeys.enquiries.list(statusFilter),
    queryFn: async () => {
      const response = await api.getEnquiries({
        page: 1,
        limit: 200,
        status: statusFilter || undefined,
      });
      return (response.data?.data?.enquiries || []) as T;
    },
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useInvalidateEnquiriesList() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
}

type PaymentBookingRow = {
  id: string;
  grandTotal?: number;
  paymentReceivedAmountValue?: number;
  paymentReceivedAmount?: string | number | null;
  dueAmountValue?: number;
  dueAmount?: string | number | null;
  _count?: { payments: number };
};

export type AddPaymentInput = {
  bookingId: string;
  amount: number;
  method: string;
  reference?: string;
  narration?: string;
  paymentDate?: string;
};

function applyOptimisticPayment(
  rows: PaymentBookingRow[],
  input: AddPaymentInput
): PaymentBookingRow[] {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return rows;

  return rows.map((row) => {
    if (row.id !== input.bookingId) return row;
    const received = resolvePaymentReceivedGross(row) + amount;
    const total = row.grandTotal ?? 0;
    const due = Math.max(0, total - received);
    return {
      ...row,
      paymentReceivedAmountValue: received,
      dueAmountValue: due,
      _count: { payments: (row._count?.payments ?? 0) + 1 },
    };
  });
}

export function useAddPaymentMutation() {
  const queryClient = useQueryClient();
  const listKey = queryKeys.bookings.list(BOOKINGS_LIST_PARAMS);

  return useMutation({
    mutationFn: async (input: AddPaymentInput) => {
      await api.addPayment(input.bookingId, {
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        narration: input.narration,
        paymentDate: input.paymentDate,
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.all });
      const previous = queryClient.getQueryData<PaymentBookingRow[]>(listKey);
      if (previous) {
        queryClient.setQueryData(listKey, applyOptimisticPayment(previous, input));
      }
      return { previous };
    },
    onError: (error: unknown, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to add payment';
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('Payment added');
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export type EnquiryUpdatePayload = Record<string, unknown>;

export function useUpdateEnquiryMutation(statusFilter: string) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.enquiries.list(statusFilter);

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: EnquiryUpdatePayload;
    }) => {
      await api.updateEnquiry(id, payload);
      return { id, payload };
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.enquiries.all });
      const previous = queryClient.getQueryData<Record<string, unknown>[]>(listKey);
      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.map((row) => (row.id === id ? { ...row, ...payload } : row))
        );
      }
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update enquiry';
      toast.error(message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });
}
