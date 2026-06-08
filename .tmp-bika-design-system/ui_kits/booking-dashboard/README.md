# Booking Dashboard UI Kit

High-fidelity click-through prototype of the Bika Banquet management dashboard.

## What's included

| File | Description |
|---|---|
| `index.html` | Full interactive prototype (login → dashboard → bookings) |
| `Sidebar.jsx` | Collapsible sidebar nav — primary + secondary groups, active states, badges |
| `StatusBadge.jsx` | Status pill — confirmed / pending / pencil / cancelled / quotation / enquiry |
| `KpiCard.jsx` | KPI metric card with delta badge and SVG sparkline |
| `BookingsTable.jsx` | Full bookings table — tab filter, search, pagination |
| `BookingForm.jsx` | Multi-step new booking modal (3 steps: customer → event → payment) |

## Prototype flow

1. **Login** — hero card + sign-in form. Any credentials will work in demo mode.
2. **Dashboard** — KPI cards, monthly revenue bar chart, top halls, business insights, recent bookings.
3. **Bookings** — Full table with status filter tabs, search, pagination, and "Add Booking" form modal.
4. **Other sections** — Navigate via sidebar; placeholder screens appear for un-built sections.

## Design tokens used

- Colors from `colors_and_type.css` — all CSS vars (`--teal-*`, `--surface-*`, `--text-*`, etc.)
- Fonts: Inter (body), Georgia/serif (display headings on login)
- Icons: Inline SVG (Lucide-style, stroke-width 1.75)
- Border radius: 18px cards, 12px buttons/inputs, 10px nav items, 9999px pills

## Usage in new designs

```html
<!-- Load in your HTML file: -->
<script src="Sidebar.jsx" type="text/babel"></script>
<script src="StatusBadge.jsx" type="text/babel"></script>
<script src="KpiCard.jsx" type="text/babel"></script>
<script src="BookingsTable.jsx" type="text/babel"></script>
<script src="BookingForm.jsx" type="text/babel"></script>

<!-- Then use: -->
<Sidebar active="bookings" onNavigate={fn} collapsed={false} />
<StatusBadge status="confirmed" size="sm" />
<KpiCard label="Revenue" value={1250000} format="currency" delta={12} sparkline={[...]} />
<BookingsTable onView={fn} />
<BookingForm onClose={fn} onSave={fn} />
```
