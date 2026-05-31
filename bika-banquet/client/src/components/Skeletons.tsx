import React from 'react';

export function KpiCardSkeleton() {
  return (
    <div className="kpi-grid">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="kpi-card">
          <div className="skeleton" style={{ height: 10, width: 90, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 26, width: 140, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: 80 }} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="py-3 px-4">
                  <div
                    className="skeleton"
                    style={{ height: 12, width: `${60 + ((colIdx + rowIdx) % 4) * 10}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matches bookings desktop table: function, customer, date, guests, hall, status, amount (+ optional actions). */
export function BookingsTableSkeleton({
  rows = 8,
  showActions = false,
}: {
  rows?: number;
  showActions?: boolean;
}) {
  return <TableSkeleton rows={rows} columns={showActions ? 8 : 7} />;
}

/** Matches payments desktop table column count. */
export function PaymentsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return <TableSkeleton rows={rows} columns={6} />;
}

/** Toolbar + month grid placeholder for calendar initial load. */
export function CalendarPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="skeleton" style={{ height: 36, width: idx === 0 ? 120 : 88, borderRadius: 10 }} />
        ))}
      </div>
      <CalendarSkeleton />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: 8,
      }}
    >
      {Array.from({ length: 35 }).map((_, idx) => (
        <div key={idx} className="card" style={{ padding: 12, minHeight: 72 }}>
          <div className="skeleton" style={{ height: 10, width: 36, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 8, width: '80%' }} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="card" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 14, width: 160, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 10, width: '80%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '65%' }} />
        </div>
      ))}
    </div>
  );
}
