# Bika Banquet Design System

> Design system for the **Bika Banquet Management System** — a full-stack banquet operations platform for managing events, customers, bookings, and payments deployed on VPS and used across a wide variety of devices.

---

## Sources

- **GitHub Repo**: [Stupelify/Bika-SW-New](https://github.com/Stupelify/Bika-SW-New) — Full-stack monorepo (Next.js 14 frontend + Node/Express backend)
  - Frontend globals: `bika-banquet/client/src/app/globals.css`
  - Tailwind config: `bika-banquet/client/tailwind.config.js`
  - Dashboard layout: `bika-banquet/client/src/app/dashboard/layout.tsx`
  - Dashboard page: `bika-banquet/client/src/app/dashboard/page.tsx`
  - Components: `bika-banquet/client/src/components/`

---

## Product Overview

**Bika Banquet** is a self-hosted operations dashboard for banquet hall management. It is built for **staff use only** (not customer-facing) and covers the entire booking lifecycle:

| Module | Description |
|---|---|
| Dashboard | Revenue KPIs, booking trends, hall performance, insights |
| Bookings | Full booking lifecycle — enquiry → pencil → quotation → confirmed |
| Calendar | Visual date-based view of bookings and enquiries |
| Customers | CRM with OTP verification, referral tracking |
| Enquiries | Lead tracking with pencil booking support |
| Payments | Multi-method payment tracking, installments, balances |
| Venues | Banquet and hall configuration with capacity |
| Menu & Items | Item types, items, template menus, ingredients, vendors |
| Reports | Revenue, hall utilization, function trends |
| Settings | RBAC — users, roles, permissions |

**Tech stack**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Lucide React icons + Recharts + Zustand + React Hook Form + Zod. Deployed via Docker + Nginx on VPS. Also has Capacitor wrapping for iOS/Android.

---

## CONTENT FUNDAMENTALS

### Tone & Voice
- **Functional, professional, never casual.** Copy is terse and task-oriented — labels like "Pencil Bookings", "Collection efficiency", "Outstanding balance".
- **No emoji in the UI.** The interface uses Lucide icons only.
- **Sentence case** throughout — "Quick search…", "Sign in", "View all", "Loading workspace…"
- **Abbreviated numbers** in metric-heavy contexts: `₹1.2L`, `₹45K` (Indian number system with Lakhs/Crores).
- **Indian locale**: currency in `₹ INR`, dates in `DD/MM/YYYY`, numbers in `en-IN` locale.
- **Active, direct labels**: "Sign In" not "Login", "Refresh" not "Reload data".
- **"You" perspective** in messages, but sparingly: "You do not have access to view the dashboard."
- **Error messages** are specific and actionable: "Too many login attempts. Please wait and try again."
- **Empty states** follow the pattern: short title + one-line description + optional CTA.
- **Insight copy** is advisory and measured: "Healthy cancellation trend for the selected period." / "Collections are lagging. Prioritize follow-up on high-value balances."

### Casing Rules
- Page titles: Title Case ("Key Metrics & Performance")
- Nav items: Title Case ("Menu & Items", "Activity Logs")
- Labels/subtitles: Sentence case ("By revenue in selected period")
- Table headers: UPPERCASE with letter-spacing ("FUNCTION DATE", "GRAND TOTAL")
- Status badges: Title Case ("Confirmed", "Pencil", "Quotation")
- Buttons: Title Case for primary actions ("Sign In", "Add Booking"); Sentence case for secondary ("View all", "Refresh")

### Terminology Glossary
- **Pencil booking** — a soft/tentative hold on a date, not yet confirmed
- **Quotation** — a booking that has a quote issued but is not yet confirmed
- **Enquiry** — a lead/inquiry before any booking is made
- **Pack** — a menu package associated with a booking
- **Hall** — individual venue space; contained within a **Banquet** (venue complex)
- **Grand total** — full booking value; **Advance received** — amount collected; **Balance** — outstanding

---

## VISUAL FOUNDATIONS

### Color System
Two light/dark adaptive palettes driven by CSS custom properties.

**Primary — Teal**  
Teal is the brand color. It drives interactive states, active navigation, CTAs, focus rings, sparklines, and progress fills. Teal-600 (`#0d9488`) is the primary action color.

**Accent — Orange**  
Used sparingly for secondary states (login page gradient, warning tones). Not used in primary navigation or CTAs.

**Neutrals — Slate**  
Surface stack from `--bg` (page background) → `--surface` (card) → `--surface-2` (table header, tab bar) → `--surface-3` (dividers).

**Status Colors** (semantic, not brand):
- Confirmed: Green (`#dcfce7` / `#15803d`)
- Pending / Pencil: Amber (`#fffbeb` / `#92400e`)
- Cancelled: Red (`#fef2f2` / `#991b1b`)
- Quotation: Blue (`#eff6ff` / `#1d4ed8`)
- Enquiry: Sky (`#f0f9ff` / `#0369a1`)

### Typography
- **Body font**: Inter (mapped from `--font-manrope` in production; Google Fonts substitute)
- **Display font**: Georgia serif (mapped from `--font-display`; used for hero headings on login)
- **Mono font**: SF Mono / Fira Code / Courier New (used for `<kbd>` badges, currency)
- **Base size**: 15px body, 1.5 line-height
- **Table headers**: 12px, 600 weight, UPPERCASE, 0.06em tracking
- **Table cells**: 13.5px
- **KPI values**: 24px, 700 weight, −0.03em tracking
- **Page titles**: 20px, 700 weight, −0.02em tracking
- **Panel titles**: 14px, 600 weight, −0.01em tracking
- **Labels**: 12.5px, 600 weight
- Numeric data uses `font-variant-numeric: tabular-nums`

### Spacing & Layout
- **Sidebar width**: 208px expanded, 64px collapsed (icon-only)
- **Header height**: 52px
- **Bottom nav height**: 60px (mobile)
- **Shell padding**: `clamp(12px, 1vw, 18px)` horizontal; `clamp(14px, 1.4vw, 22px)` vertical
- **Card padding**: 16px/20px (shrinks to 14px on mobile)
- **Max content width**: 1400px centered

### Border Radius System
- `6px` — small (sm)
- `8px` — default (inputs, row buttons)
- `10px` — medium (nav items, tabs)
- `12px` — inputs, buttons
- `14px` — mobile cards, insight cards
- `16px` — resource tiles
- `18px` — cards (`card`, `kpi-card`, `card-padded`)
- `22px` — 2xl
- `9999px` — status pills, badges (fully rounded)

### Shadow System
All shadows use `rgba(15, 23, 42, …)` (slate-900 base) at very low opacity:
- `xs`: `0 1px 2px rgba(15,23,42,0.04)` — default card shadow
- `sm`: `0 1px 3px + 0 1px 2px` — slightly elevated
- `md`: `0 4px 6px + 0 2px 4px` — modals, focused elements
- Dark mode: black-based shadows at 45–55% opacity

### Cards
- Border: `1px solid var(--border)` — `#e2e8f0` light / `#1f1f1f` dark
- Background: `var(--surface)` — white light / `#141516` dark
- Border-radius: **18px** on desktop, **14px** on mobile
- Shadow: `var(--shadow-xs)`
- No left-border accent. No gradient backgrounds on cards.
- Panel pattern: `panel-header` (flex, space-between, border-bottom) + `panel-body` (padded)

### Backgrounds
- Page background: `var(--bg)` — `#f8fafc` light / `#0f1011` dark (near-black)
- No background images, no textures, no full-bleed images
- Login page uses a **subtle gradient**: `from-primary-100/70 via-white to-accent-100/60`
- No other gradients except the FAB (`linear-gradient(135deg, teal-600, teal-500)`) and bar chart fill

### Interactive States
- **Hover on nav items**: background `var(--teal-50)`, color `var(--teal-700)`
- **Hover on table rows**: `var(--teal-50)` background
- **Hover on buttons**: Darken primary (teal-700), lift shadow slightly
- **Hover on resource tiles**: border teal, background teal-50, `translateY(-1px)`
- **Active/pressed**: `scale(0.99)` on mobile cards; `scale(0.96)` on FAB
- **Focus**: `2px solid var(--teal-500)`, `outline-offset: 2px`; focus ring: `0 0 0 3px var(--ring)` (rgba teal 18%)
- **Row actions**: hidden at `opacity: 0.35`, shown at `opacity: 1` on row hover (touch: always visible)
- **Disabled**: `opacity: 0.5`, `cursor: not-allowed`

### Animation
- **Page entrance**: `translateY(6px) → 0`, `opacity 0→1`, 180ms, cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Modal entrance**: `scale(0.97) translateY(10px) → normal`, 200ms, cubic-bezier(0.32, 0.72, 0, 1)
- **Sidebar**: `width` transition 200ms ease
- **Skeleton shimmer**: 90deg linear gradient sweep, 1.5s infinite
- **Bar chart**: `scaleY(0→1)` from bottom, 450ms ease (high-tier devices)
- **FAB entrance**: `scale(0.5) translateY(20px) → normal`, 300ms cubic-bezier(0.32, 0.72, 0)
- **Device-tier aware**: Low-tier devices skip animations entirely; mid-tier uses shorter durations
- **prefers-reduced-motion**: All animations disabled

### Iconography (see ICONOGRAPHY section below)

### Scrollbar
Custom thin scrollbar: 6px width/height, transparent track, `var(--surface-3)` thumb, rounded.

### Transparency & Blur
- Modals: `backdrop-filter` blur used on modal overlays — **disabled on low-tier devices** for perf
- No frosted-glass effects elsewhere

### Corner Radii Summary
Consistent scale from 6px (sm) to 18px (cards). Full-pill (9999px) reserved for status badges, nav badges, and tag-style pills.

---

## ICONOGRAPHY

**Icon library**: [Lucide React](https://lucide.dev) — thin-line, consistent stroke icons.
- **Stroke width**: `1.75` globally via `.lucide { stroke-width: 1.75; }`
- Lucide is loaded from npm (`lucide-react@0.408.0`), available on CDN for static HTML: `https://unpkg.com/lucide@latest/dist/umd/lucide.js`
- No custom SVG icons, no PNG icons, no icon fonts
- **No emoji** used anywhere in the interface

**Key icons in use:**
- `LayoutDashboard` — Dashboard
- `CalendarCheck` — Bookings
- `CalendarDays` — Calendar
- `Users` — Customers
- `PhoneCall` — Enquiries
- `DollarSign` / `IndianRupee` — Payments / revenue
- `Building2` — Venues/Halls
- `UtensilsCrossed` — Menu & Items
- `BarChart3` — Reports
- `Activity` — Activity Logs
- `Settings` — Settings
- `Search` — Search / Command Palette
- `Moon` / `Sun` — Theme toggle
- `Menu` / `X` — Sidebar toggle / close
- `ChevronDown` / `ChevronRight` — Nav expand / breadcrumb
- `LogOut` — Logout
- `TrendingUp` / `TrendingDown` — KPI deltas
- `CheckCircle2` / `Clock` / `XCircle` / `FileText` / `PenLine` / `MessageCircle` — Status badges
- `Sparkles` — Insights badge
- `AlertTriangle` — Pencil booking warning
- `RefreshCw` — Refresh action
- `ArrowRight` — View all links
- `Eye` / `EyeOff` — Password toggle

For design mockups, link Lucide from CDN:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```
Then use `<i data-lucide="calendar-check"></i>` and call `lucide.createIcons()`.

---

## File Index

```
/
├── README.md                    ← This file
├── SKILL.md                     ← Agent skill descriptor
├── colors_and_type.css          ← All CSS custom properties + base type styles
├── assets/
│   └── logo.png                 ← Bika Banquet logo (from CDN)
├── preview/
│   ├── colors-primary.html      ← Teal primary color scale
│   ├── colors-accent.html       ← Orange accent scale
│   ├── colors-neutral.html      ← Surface / neutral scale
│   ├── colors-semantic.html     ← Status/semantic colors
│   ├── colors-dark.html         ← Dark mode palette
│   ├── type-scale.html          ← Typography scale specimens
│   ├── type-display.html        ← Display vs body fonts
│   ├── spacing-radius.html      ← Border radius tokens
│   ├── spacing-shadows.html     ← Shadow elevation system
│   ├── spacing-tokens.html      ← Spacing / layout tokens
│   ├── components-buttons.html  ← Button variants
│   ├── components-inputs.html   ← Form inputs & labels
│   ├── components-cards.html    ← Card variants
│   ├── components-status.html   ← Status badges
│   ├── components-kpi.html      ← KPI cards
│   ├── components-table.html    ← Table & pagination
│   ├── components-nav.html      ← Sidebar navigation
│   └── components-tabs.html     ← Tab bar component
└── ui_kits/
    └── booking-dashboard/
        ├── README.md            ← Kit usage notes
        ├── index.html           ← Interactive dashboard prototype
        ├── Sidebar.jsx          ← Sidebar nav component
        ├── Header.jsx           ← Top header component
        ├── KpiCard.jsx          ← KPI metric card
        ├── StatusBadge.jsx      ← Status pill component
        ├── BookingsTable.jsx    ← Data table with pagination
        └── BookingForm.jsx      ← Booking creation form
```
