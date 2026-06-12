# Frontend Rebuild — Design

Date: 2026-06-13
Scope: `client/` only. `server/` and `shared/booking-core/` untouched. All API endpoints unchanged.

## Goals

Professional, fast, pleasant on mobile + desktop. Specifically:

1. Decompose monolith pages (`bookings/page.tsx` 5,181 lines; `menu` 2,646; `customers` 1,883; `settings` 1,746).
2. Single source of truth for server-state caching (React Query) — remove the custom 2-minute axios memCache that fights it.
3. Type safety in the API layer — replace `any` with domain types derived from the Prisma schema.
4. Reusable UI primitive kit so buttons/inputs/modals/tables stop being hand-built per page.
5. Split `globals.css` (3,563 lines) into layered modules.
6. Interactive charts (Recharts) replacing static custom SVG.
7. Visible feedback everywhere: skeletons, transitions, optimistic updates, toasts (sonner already present).

## Decisions

| Area | Choice | Why |
|------|--------|-----|
| Component library | Hand-rolled primitives in `src/components/ui/` on Tailwind + existing CSS vars | Codebase already has a token system (`--surface`, `--text-1..4`, teal scale) wired into Tailwind. Radix/shadcn adds deps and churn; the patterns needed (Dialog, Sheet, Combobox) already exist as one-offs — consolidate them instead. Capacitor build stays lean. |
| Charts | Recharts 3.x | Declarative, responsive, tooltips/legends free; team already knows it. |
| Server state | React Query only. `staleTime` 120s default (matches old TTL), invalidation via existing `queryKeys`. | Two caches caused stale-after-mutation bugs. |
| Client state | Zustand (already present) for auth/UI only. | No change needed. |
| Types | Hand-written `src/types/api.ts` mirroring Prisma models + API envelopes | No codegen pipeline to maintain; the API surface is stable. |
| File structure | Route-private folders: `app/dashboard/<page>/_components/`, `_hooks/`, `_lib/` | Next.js idiom; keeps feature code beside its route. |
| CSS | `globals.css` becomes an import manifest for `styles/{tokens,base,layout,components,pages}.css`. No class renames. | Zero visual risk; navigable files. |

## Booking page — special handling

`AGENTS.md` billing invariants are absolute. The split is **mechanical extraction only**:

- All totals continue to flow through `@bika/booking-core` (`formPacksToSumBookingInput` → `sumBookingLines`).
- No changes to save payload shape, payment credit logic, or version-history helpers.
- Extraction order: list view → filters/toolbar → form sections → payments panel → PDF actions. State stays in one `useBookingForm`-style hook per concern; props down, callbacks up.
- After every extraction batch: `npm run test:unit:booking-form` (client) + `npx jest --testPathPatterns=booking` (server) must stay green (baseline: 151 client tests, all server suites pass).

## Phases

1. **Foundation** — cache unification, typed API, UI kit, CSS split. (Tasks 2–5)
2. **Exemplar** — customers page refactor proving the pattern. (Task 6)
3. **Bookings split** — guarded by tests. (Task 7)
4. **Polish** — Recharts dashboards, loading/transition passes. (Task 8)
5. **Verification** — build + suites + AGENTS.md manual smoke list. (Task 9)

Menu/settings/enquiries pages follow the exemplar pattern in follow-up passes (same recipe, lower risk).

## Error handling

- API errors surface via sonner toasts at the mutation hook level (pattern already in `lib/query/hooks.ts`).
- React Query `retry: 1` for queries, `retry: 0` for mutations.
- 401 redirect interceptor in `api.ts` retained as-is.

## Testing

- Existing vitest unit suites must stay green throughout.
- `next build` after each phase (type errors = regression gate).
- Booking suites after any booking-adjacent change (hard constraint).
