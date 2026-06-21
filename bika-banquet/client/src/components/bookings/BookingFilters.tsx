'use client';

import {
  ChoiceFilter,
  DateRangeFilter,
  MultiSelectFilter,
  NumberRangeFilter,
  type FilterOption,
} from '@/components/data-table/filter-controls';
import type { BookingFilters } from '@/lib/booking-list/booking-filters';

/** Statuses the server can filter reliably (real DB status column values). */
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pencil', label: 'Pencil' },
  { value: 'enquiry', label: 'Enquiry' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const DUE_FILTER_OPTIONS: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'paid', label: 'Paid' },
];

export type BookingFilterPatch = Partial<BookingFilters>;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-4)]">
        {label}
      </div>
      {children}
    </div>
  );
}

/**
 * Inline (non-popover) rendering of every booking filter — used in the slide-out
 * Filters panel and on mobile. Shares the exact same control bodies as the
 * column-header popovers so the two surfaces never drift.
 */
export function BookingFilterPanelBody({
  filters,
  onChange,
  venueOptions,
  hallOptions,
}: {
  filters: BookingFilters;
  onChange: (patch: BookingFilterPatch) => void;
  venueOptions: FilterOption[];
  hallOptions: FilterOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section label="Status">
        <MultiSelectFilter
          options={STATUS_FILTER_OPTIONS}
          selected={filters.status}
          onChange={(status) => onChange({ status })}
        />
      </Section>
      <Section label="Date range">
        <DateRangeFilter
          from={filters.dateFrom}
          to={filters.dateTo}
          onChange={({ from, to }) => onChange({ dateFrom: from, dateTo: to })}
        />
      </Section>
      <Section label="Venue">
        <MultiSelectFilter
          options={venueOptions}
          selected={filters.banquetIds}
          onChange={(banquetIds) => onChange({ banquetIds })}
          searchable
          emptyLabel="No venues"
        />
      </Section>
      <Section label="Hall">
        <MultiSelectFilter
          options={hallOptions}
          selected={filters.hallIds}
          onChange={(hallIds) => onChange({ hallIds })}
          searchable
          emptyLabel="No halls"
        />
      </Section>
      <Section label="Guests">
        <NumberRangeFilter
          min={filters.guestsMin}
          max={filters.guestsMax}
          onChange={({ min, max }) => onChange({ guestsMin: min, guestsMax: max })}
        />
      </Section>
      <Section label="Amount (₹)">
        <NumberRangeFilter
          min={filters.amountMin}
          max={filters.amountMax}
          onChange={({ min, max }) => onChange({ amountMin: min, amountMax: max })}
        />
      </Section>
      <Section label="Balance">
        <ChoiceFilter
          name="due"
          value={filters.due}
          options={DUE_FILTER_OPTIONS}
          onChange={(due) => onChange({ due: due as BookingFilters['due'] })}
        />
      </Section>
    </div>
  );
}
