# Design System Foundation (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the remaining *foundational* parts of the Bika Banquet Design System handoff — the full semantic token taxonomy, a fixed **compact** density, the filled status-badge-with-dot system, and money-tone color tokens — without touching booking billing logic or adding new runtime dependencies.

**Architecture:** All changes live in the client design layer: CSS custom properties in `globals.css`, token mappings in `tailwind.config.js`, two small pure-TS helpers in `src/lib` (unit-tested), and a refactor of the existing `StatusBadge` component. No backend, no data wiring, no charts. The dashboard widget redesign (sparklines, donut, insights, checklist, live feed) is explicitly **out of scope** — it is a separate subsystem (needs a charting dependency + live data + product decisions) and gets its own plan; see Appendix A.

**Tech Stack:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS 3.4, Vitest (node env), Lucide icons. CSS-variable-driven theming with `[data-theme="dark"]`.

---

## Context the implementer must know

- **This is Phase 2.** Phase 1 (PR #32, branch `cursor/apply-design-system-migration-8762`) already shipped the warm-stone palette, Inter Tight + JetBrains Mono fonts, the gentle radius scale, and filled status-pill colors. This plan builds on that branch. Do **not** re-litigate the Phase 1 base palette.
- **Canonical token source:** `Bika Banquet Design System-handoff.zip` → `bika-banquet-design-system/project/styles/tokens.css`. When this plan quotes token values, they come from there.
- **AGENTS.md rules apply:** surgical changes, minimum diff, match existing style. Do **not** modify anything under `server/`, `src/lib/booking-form/`, `src/app/dashboard/bookings/page.tsx`, or `@bika/booking-core`. Money-tone changes here are **display color only** — never touch amount math.
- **Test harness reality:** `vitest.config.ts` uses `environment: 'node'` and only includes `src/lib/__tests__/**/*.test.ts` and `src/lib/booking-form/__tests__/**/*.test.ts`. So **logic helpers in `src/lib` are unit-testable**, but React/DOM component rendering and CSS are **not** unit-tested here — verify those with `next build`. Do not add jsdom or change the vitest environment in this plan.
- **Test command (runs the whole included suite):** `cd bika-banquet/client && npm run test:unit:booking-form`
- **Build command (verifies CSS + TSX compile):** from repo root `bika-banquet/`, run `npm run build:shared` once, then `cd client && npm run build`.
- **Existing facts to reuse:**
  - `globals.css` already defines `.status-pill`, `.status-dot`, and `.status-{confirmed,pending,cancelled,quotation,pencil,enquiry}` (currently hardcoded hex from Phase 1) plus `[data-theme="dark"] .status-*` overrides.
  - `StatusBadge.tsx` already renders `<span class="status-pill status-{x}">` with a Lucide icon. Status keys in use across the app: `confirmed`, `pending`, `cancelled`, `quotation`, `pencil`, `enquiry`.
  - `thead th` padding is `10px 14px`; `tbody td` padding is `11px 14px`.
  - Money formatting helper already exists: `src/lib/indianAmountFormat.ts` (display only).

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `client/src/app/globals.css` | Add semantic tokens (`--accent*`, `--money-*`, `--st-*`, `--shadow-pop/sheet/menu`, `--r-*`), fixed compact density vars, rewire `.status-*` + table padding to vars | Modify |
| `client/tailwind.config.js` | Expose `money` + `status` colors and `--r-*` radii as Tailwind utilities | Modify |
| `client/src/lib/statusToken.ts` | Pure mapping `status string → {key,label,className}` | Create |
| `client/src/lib/__tests__/statusToken.test.ts` | Unit tests for `statusToken` | Create |
| `client/src/lib/moneyTone.ts` | Pure mapping `amount/kind → tone class` for `--money-*` | Create |
| `client/src/lib/__tests__/moneyTone.test.ts` | Unit tests for `moneyTone` | Create |
| `client/src/components/StatusBadge.tsx` | Use `statusToken`, render filled badge + dot | Modify |

---

## Task 1: Add semantic + density tokens to `globals.css`

**Files:**
- Modify: `client/src/app/globals.css` (the `:root {…}` block and the `[data-theme="dark"] {…}` block)

This task only **adds** new custom properties; it does not change any Phase 1 values. Tokens are copied from `styles/tokens.css`.

- [ ] **Step 1: Append the new light-theme tokens inside `:root`**

Add this block immediately before the closing `}` of the existing `:root { … }` rule in `globals.css`:

```css
  /* ── Design-system semantic tokens (handoff styles/tokens.css) ── */
  --accent:        var(--teal-700);
  --accent-soft:   var(--teal-50);
  --accent-hover:  var(--teal-800);
  --accent-text:   var(--teal-800);
  --accent-on:     #ffffff;

  --money-pos: #15803D;
  --money-neg: #B91C1C;
  --money-warn: #B45309;

  --st-confirmed-bg: #DCFCE7; --st-confirmed-fg: #14532D; --st-confirmed-dot: #16A34A;
  --st-pencil-bg:    #FEF3C7; --st-pencil-fg:    #78350F; --st-pencil-dot:    #D97706;
  --st-pending-bg:   #FEF3C7; --st-pending-fg:   #78350F; --st-pending-dot:   #D97706;
  --st-quotation-bg: #DBEAFE; --st-quotation-fg: #1E3A8A; --st-quotation-dot: #2563EB;
  --st-enquiry-bg:   #E0F2FE; --st-enquiry-fg:   #075985; --st-enquiry-dot:   #0284C7;
  --st-cancelled-bg: #FEE2E2; --st-cancelled-fg: #7F1D1D; --st-cancelled-dot: #DC2626;

  --shadow-pop:   0 1px 2px rgba(28,25,23,.04), 0 8px 24px rgba(28,25,23,.08);
  --shadow-sheet: -16px 0 48px rgba(28,25,23,.10);
  --shadow-menu:  0 8px 32px rgba(28,25,23,.12), 0 2px 4px rgba(28,25,23,.04);

  --r-sm: 4px; --r-md: 6px; --r-lg: 8px; --r-xl: 10px; --r-pill: 999px;

  /* Fixed COMPACT density (handoff density system reduced to a single fixed tier) */
  --row-h: 30px;
  --cell-py: 5px;
  --cell-px: 12px;
  --gap: 10px;
  --section-py: 14px;
```

- [ ] **Step 2: Append the new dark-theme tokens inside `[data-theme="dark"]`**

Add this block immediately before the closing `}` of the existing `[data-theme="dark"] { … }` rule:

```css
  /* ── Design-system semantic tokens — dark ── */
  --accent:       var(--teal-400);
  --accent-soft:  rgba(20,184,166,.10);
  --accent-hover: var(--teal-300);
  --accent-text:  var(--teal-300);
  --accent-on:    #0C0A09;

  --money-pos: #4ADE80;
  --money-neg: #F87171;
  --money-warn: #FBBF24;

  --st-confirmed-bg: rgba(34,197,94,.14);  --st-confirmed-fg: #86EFAC; --st-confirmed-dot: #22C55E;
  --st-pencil-bg:    rgba(245,158,11,.14); --st-pencil-fg:    #FCD34D; --st-pencil-dot:    #F59E0B;
  --st-pending-bg:   rgba(245,158,11,.14); --st-pending-fg:   #FCD34D; --st-pending-dot:   #F59E0B;
  --st-quotation-bg: rgba(59,130,246,.14); --st-quotation-fg: #93C5FD; --st-quotation-dot: #3B82F6;
  --st-enquiry-bg:   rgba(2,132,199,.14);  --st-enquiry-fg:   #7DD3FC; --st-enquiry-dot:   #0EA5E9;
  --st-cancelled-bg: rgba(220,38,38,.14);  --st-cancelled-fg: #FCA5A5; --st-cancelled-dot: #EF4444;

  --shadow-pop:   0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.5);
  --shadow-sheet: -16px 0 48px rgba(0,0,0,.5);
  --shadow-menu:  0 8px 32px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.4);
```

(`--r-*` and density vars are theme-independent, so they stay only in `:root`.)

- [ ] **Step 3: Verify the stylesheet still compiles**

Run (from `bika-banquet/`): `npm run build:shared && cd client && npm run build`
Expected: build completes, route table prints, exit code 0. (A trailing `Failed to patch lockfile` line is a known Next 14 monorepo quirk and is OK.)

- [ ] **Step 4: Commit**

```bash
git add client/src/app/globals.css
git commit -m "feat(ds): add semantic accent/money/status/shadow/radius + compact density tokens"
```

---

## Task 2: Expose money/status colors + radii in Tailwind

**Files:**
- Modify: `client/tailwind.config.js` (`theme.extend.colors` and `theme.extend.borderRadius`)

So utility classes like `text-money-neg`, `bg-st-confirmed-bg`, `rounded-r-md` are available to component code in later work.

- [ ] **Step 1: Add `money` and `status` color groups**

Inside `theme.extend.colors`, after the existing `accent: { … }` group, add:

```js
        money: {
          pos: 'var(--money-pos)',
          neg: 'var(--money-neg)',
          warn: 'var(--money-warn)',
        },
        st: {
          'confirmed-bg': 'var(--st-confirmed-bg)', 'confirmed-fg': 'var(--st-confirmed-fg)', 'confirmed-dot': 'var(--st-confirmed-dot)',
          'pencil-bg': 'var(--st-pencil-bg)', 'pencil-fg': 'var(--st-pencil-fg)', 'pencil-dot': 'var(--st-pencil-dot)',
          'quotation-bg': 'var(--st-quotation-bg)', 'quotation-fg': 'var(--st-quotation-fg)', 'quotation-dot': 'var(--st-quotation-dot)',
          'enquiry-bg': 'var(--st-enquiry-bg)', 'enquiry-fg': 'var(--st-enquiry-fg)', 'enquiry-dot': 'var(--st-enquiry-dot)',
          'cancelled-bg': 'var(--st-cancelled-bg)', 'cancelled-fg': 'var(--st-cancelled-fg)', 'cancelled-dot': 'var(--st-cancelled-dot)',
        },
```

- [ ] **Step 2: Add the `--r-*` radius aliases**

Inside `theme.extend.borderRadius`, add these keys (keep the existing `sm/DEFAULT/md/lg/xl/2xl` keys unchanged):

```js
        'r-sm': 'var(--r-sm)',
        'r-md': 'var(--r-md)',
        'r-lg': 'var(--r-lg)',
        'r-xl': 'var(--r-xl)',
        'r-pill': 'var(--r-pill)',
```

- [ ] **Step 3: Verify the build**

Run (from `bika-banquet/client`): `npm run build`
Expected: build completes, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add client/tailwind.config.js
git commit -m "feat(ds): expose money/status colors and --r-* radii as Tailwind utilities"
```

---

## Task 3: `statusToken` helper (TDD)

**Files:**
- Create: `client/src/lib/statusToken.ts`
- Test: `client/src/lib/__tests__/statusToken.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/lib/__tests__/statusToken.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { statusToken } from '../statusToken';

describe('statusToken', () => {
  it('maps a known status to label + className', () => {
    expect(statusToken('confirmed')).toEqual({
      key: 'confirmed',
      label: 'Confirmed',
      className: 'status-confirmed',
    });
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(statusToken('  PENCIL ').key).toBe('pencil');
    expect(statusToken('Quotation').label).toBe('Quotation');
  });

  it('falls back to pending for unknown or empty input', () => {
    expect(statusToken('').key).toBe('pending');
    expect(statusToken('banana').key).toBe('pending');
    // @ts-expect-error runtime guard for null
    expect(statusToken(null).key).toBe('pending');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd bika-banquet/client && npm run test:unit:booking-form`
Expected: FAIL — `Cannot find module '../statusToken'`.

- [ ] **Step 3: Write the minimal implementation**

Create `client/src/lib/statusToken.ts`:

```ts
export type StatusKey =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'quotation'
  | 'pencil'
  | 'enquiry';

export interface StatusToken {
  key: StatusKey;
  label: string;
  className: string;
}

const LABELS: Record<StatusKey, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  quotation: 'Quotation',
  pencil: 'Pencil',
  enquiry: 'Enquiry',
};

export function statusToken(status: string | null | undefined): StatusToken {
  const norm = (status ?? '').trim().toLowerCase();
  const key: StatusKey = (norm in LABELS ? norm : 'pending') as StatusKey;
  return { key, label: LABELS[key], className: `status-${key}` };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd bika-banquet/client && npm run test:unit:booking-form`
Expected: PASS (all suites green).

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/statusToken.ts client/src/lib/__tests__/statusToken.test.ts
git commit -m "feat(ds): add statusToken helper with tests"
```

---

## Task 4: Filled status badge with dot

**Files:**
- Modify: `client/src/app/globals.css` (the `.status-*` rules + dark overrides)
- Modify: `client/src/components/StatusBadge.tsx`

Goal: status badges become filled bg + colored text + a colored **dot**, driven by `--st-*` tokens, so light/dark are automatic and there is a single source of truth.

- [ ] **Step 1: Rewire the `.status-*` classes to tokens**

In `globals.css`, replace the six light `.status-*` rules (inside `@layer components`) with token-based versions:

```css
  .status-confirmed { background: var(--st-confirmed-bg); color: var(--st-confirmed-fg); }
  .status-pending   { background: var(--st-pending-bg);   color: var(--st-pending-fg); }
  .status-cancelled { background: var(--st-cancelled-bg); color: var(--st-cancelled-fg); }
  .status-quotation { background: var(--st-quotation-bg); color: var(--st-quotation-fg); }
  .status-pencil    { background: var(--st-pencil-bg);    color: var(--st-pencil-fg); }
  .status-enquiry   { background: var(--st-enquiry-bg);   color: var(--st-enquiry-fg); }
```

Then **delete** the now-redundant `[data-theme="dark"] .status-{confirmed,pending,cancelled,quotation,pencil,enquiry}` override rules (the `--st-*` dark tokens from Task 1 already handle dark mode). Leave all other `[data-theme="dark"]` rules untouched.

- [ ] **Step 2: Give the dot its own color**

The existing `.status-dot { background: currentColor; … }` already inherits the badge text color, which is correct. To use the dedicated dot hue instead, update only the `background` line of `.status-dot`:

```css
  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--st-dot, currentColor);
    flex-shrink: 0;
  }
```

(Each `.status-{x}` sets `--st-dot` — add `--st-dot: var(--st-<key>-dot);` to each of the six rules from Step 1, e.g. `.status-confirmed { … --st-dot: var(--st-confirmed-dot); }`.)

- [ ] **Step 3: Refactor `StatusBadge.tsx` to use the helper + dot**

Replace the contents of `client/src/components/StatusBadge.tsx` with:

```tsx
'use client';

import { statusToken } from '@/lib/statusToken';

type StatusBadgeProps = {
  status: string;
  size?: 'sm' | 'md';
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, className } = statusToken(status);

  return (
    <span
      className={`status-pill ${className} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''
      }`}
    >
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
```

This removes the Lucide icon imports from this file (the dot replaces the icon, matching the handoff `StatusBadge`). Per AGENTS.md, removing those now-unused imports is required cleanup.

- [ ] **Step 4: Verify build (confirms TSX + CSS compile, no orphaned imports)**

Run (from `bika-banquet/client`): `npm run build`
Expected: build completes, exit code 0, no "unused import" or type errors.

- [ ] **Step 5: Run unit suite (confirms helper still green)**

Run: `cd bika-banquet/client && npm run test:unit:booking-form`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/globals.css client/src/components/StatusBadge.tsx
git commit -m "feat(ds): filled status badge with dot driven by --st-* tokens"
```

---

## Task 5: Money-tone helper + utility classes (TDD)

**Files:**
- Create: `client/src/lib/moneyTone.ts`
- Test: `client/src/lib/__tests__/moneyTone.test.ts`
- Modify: `client/src/app/globals.css` (add `.money-pos/.money-neg/.money-warn` utilities)

This ships the money color *vocabulary* (helper + classes). Applying it across screens is deliberately **not** in this plan — wiring it into booking/payment displays is a separate, reviewable change so we never risk booking math.

- [ ] **Step 1: Write the failing test**

Create `client/src/lib/__tests__/moneyTone.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { moneyTone, moneyToneClass } from '../moneyTone';

describe('moneyTone', () => {
  it('classifies by sign', () => {
    expect(moneyTone(1000)).toBe('pos');
    expect(moneyTone(-1)).toBe('neg');
    expect(moneyTone(0)).toBe('neutral');
  });

  it('treats an outstanding balance as a warning when flagged', () => {
    expect(moneyTone(5000, { outstanding: true })).toBe('warn');
    expect(moneyTone(0, { outstanding: true })).toBe('neutral');
  });

  it('maps tone to a css class, empty for neutral', () => {
    expect(moneyToneClass(1000)).toBe('money-pos');
    expect(moneyToneClass(-5)).toBe('money-neg');
    expect(moneyToneClass(0)).toBe('');
    expect(moneyToneClass(5000, { outstanding: true })).toBe('money-warn');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd bika-banquet/client && npm run test:unit:booking-form`
Expected: FAIL — `Cannot find module '../moneyTone'`.

- [ ] **Step 3: Write the minimal implementation**

Create `client/src/lib/moneyTone.ts`:

```ts
export type MoneyTone = 'pos' | 'neg' | 'warn' | 'neutral';

export interface MoneyToneOptions {
  /** When true, a positive amount represents money still owed (a warning), not income. */
  outstanding?: boolean;
}

export function moneyTone(amount: number, opts: MoneyToneOptions = {}): MoneyTone {
  if (!Number.isFinite(amount) || amount === 0) return 'neutral';
  if (opts.outstanding) return amount > 0 ? 'warn' : 'neutral';
  return amount > 0 ? 'pos' : 'neg';
}

export function moneyToneClass(amount: number, opts: MoneyToneOptions = {}): string {
  const tone = moneyTone(amount, opts);
  return tone === 'neutral' ? '' : `money-${tone}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd bika-banquet/client && npm run test:unit:booking-form`
Expected: PASS.

- [ ] **Step 5: Add the matching utility classes to `globals.css`**

Inside the existing `@layer utilities { … }` block, add:

```css
  .money-pos { color: var(--money-pos); }
  .money-neg { color: var(--money-neg); }
  .money-warn { color: var(--money-warn); }
```

- [ ] **Step 6: Verify build**

Run (from `bika-banquet/client`): `npm run build`
Expected: build completes, exit code 0.

- [ ] **Step 7: Commit**

```bash
git add client/src/lib/moneyTone.ts client/src/lib/__tests__/moneyTone.test.ts client/src/app/globals.css
git commit -m "feat(ds): add money-tone helper + money-pos/neg/warn utilities"
```

---

## Task 6: Apply fixed compact density to tables

**Files:**
- Modify: `client/src/app/globals.css` (`thead th` and `tbody td` in `@layer base`)

The compact density vars exist after Task 1; this wires the data tables to them. Mobile touch targets are preserved by the existing `@media (pointer: coarse)` block (do not change it).

- [ ] **Step 1: Wire table cell padding to the density vars**

In `globals.css` `@layer base`, change the `thead th` padding line from `padding: 10px 14px;` to:

```css
    padding: var(--cell-py) var(--cell-px);
```

and the `tbody td` padding line from `padding: 11px 14px;` to:

```css
    padding: var(--cell-py) var(--cell-px);
```

Leave font sizes, borders, and all other declarations unchanged.

- [ ] **Step 2: Verify build**

Run (from `bika-banquet/client`): `npm run build`
Expected: build completes, exit code 0.

- [ ] **Step 3: Manual visual check (record result in the PR)**

Run `cd bika-banquet/client && npm run dev`, open `http://localhost:3000`, sign in, and confirm on a list screen (e.g. Bookings or Payments):
- Table rows are tighter than before (≈5px vertical cell padding).
- On a narrow viewport / touch emulation, inputs and buttons still meet the 44px minimum (unchanged by this task).

Expected: denser tables, no clipped text, mobile hit targets intact.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/globals.css
git commit -m "feat(ds): apply fixed compact density to data tables"
```

---

## Task 7: Remove handoff zip from the branch + update PR

**Files:**
- Delete: `Bika Banquet Design System-handoff.zip` (repo root)

The 718 KB binary was pushed only to share the handoff with the agent; it must not merge to `master`.

- [ ] **Step 1: Remove the binary**

```bash
git rm "Bika Banquet Design System-handoff.zip"
git commit -m "chore: remove design-system handoff zip from branch"
```

- [ ] **Step 2: Push and update the PR**

```bash
git push -u origin cursor/apply-design-system-migration-8762
```

Then update PR #32's description to list the Phase 2 additions (tokens, compact density, status-dot badges, money tones), or open a fresh PR if Phase 1 and Phase 2 should ship separately (recommended: separate PR off the same branch point so review stays small).

- [ ] **Step 3: Final verification gate**

Run, and confirm all green before claiming done:

```bash
cd bika-banquet && npm run build:shared && cd client && npm run build && npm run test:unit:booking-form
```

Expected: build exit 0; vitest suites all PASS (including the two new helper specs).

---

## Self-Review (completed during planning)

1. **Spec coverage** vs the handoff gap analysis "Take from redesign → codebase" list:
   - Warm stone palette + teal accent — ✅ Phase 1 (PR #32).
   - Inter Tight + JetBrains Mono — ✅ Phase 1.
   - Gentle radius scale — ✅ Phase 1; `--r-*` aliases added here (Task 1/2).
   - Filled status badges w/ bg/fg/dot — ✅ Tasks 1, 3, 4.
   - Density system — **scope-reduced per user instruction** to a single fixed *compact* tier (Tasks 1, 6); the runtime compact/balanced/comfy switch is intentionally dropped.
   - Money tones — ✅ Tasks 1, 2, 5 (vocabulary shipped; application deferred).
   - KPI sparklines, donut, insights, checklist, live activity feed, sidebar nav grouping — **out of scope → Appendix A** (separate plan).
   - "Keep from codebase" items (conflict detection, occupancy rail, pencil countdown, version tab, activity log, booking drawer) — untouched by this plan by design.
2. **Placeholder scan:** every code/CSS step contains literal content; no TBD/TODO.
3. **Type consistency:** `StatusKey`/`statusToken`/`className: status-<key>` are consistent across Tasks 3–4; `.status-<key>` CSS classes and `--st-<key>-{bg,fg,dot}` tokens match the keys defined in Task 1. `moneyTone`/`moneyToneClass` names match between Task 5 test and implementation.

---

## Appendix A — Out of scope: Dashboard widget redesign (needs its own plan)

The handoff's richer dashboard is a **separate subsystem** and should be brainstormed + planned independently because it needs decisions this plan cannot make:

- **New dependency:** a charting library (the handoff implies Recharts) for the 12-month revenue bar chart, hall-utilization donut, and KPI sparklines. Not currently installed.
- **Live data:** sparkline series, trend deltas, donut segments, insights, the live activity feed, and the today's checklist all need real API endpoints / data contracts that don't exist yet.
- **Product decisions:** whether to replace or augment the existing dashboard widgets; whether the activity feed is real-time (SSE — note `src/hooks/useSSE.ts` exists) or polled; checklist persistence.

Recommended next step after this plan lands: run the brainstorming skill on "dashboard redesign", then `writing-plans` for a `2026-..-dashboard-redesign.md` plan.

## Appendix B — Decisions folded in / open

- **Compact is fixed** (no density switch) — per user instruction this turn.
- **Quotation = blue** (`#2563EB` family) — matches the handoff's resolution of the violet-vs-blue conflict; already reflected in Phase 1 and the `--st-quotation-*` tokens here.
- **Open:** whether `.status-dot` should use the dedicated `--st-*-dot` hue (Task 4 Step 2) or simply inherit the text color. Plan uses the dedicated dot hue; trivial to revert to `currentColor` if preferred.
