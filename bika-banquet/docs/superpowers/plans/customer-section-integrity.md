# Customer Section Integrity

Living reference for customer table, create/edit forms, validation, API, and the `customer-section-integrity` agent.

## Product rules

- **Primary UI:** List + inline modal form on `/dashboard/customers` (`page.tsx`). Full-page create at `/dashboard/customers/create`, edit at `/dashboard/customers/[id]/edit`.
- **Phone:** Digits only; length per country dial code (`customerFormOptions` + server `phoneDigitsByCode.json`). Default India `+91` / 10 digits.
- **WhatsApp:** When "different from phone" unchecked, payload sends primary phone as WhatsApp; when checked, separate number required and validated.
- **PIN (India):** 6-digit PIN triggers `lookupIndianPincode`; auto-fills city/state. Client allows 4–10 digit PIN in validation; server optional pincode `^\d{4,10}$`.
- **Name:** Letters/spaces (client `NAME_REGEX`); server Unicode-aware `NAME_PATTERN`, min 2 chars.
- **Referrer:** `referredById` must not be self on update (server).
- **Permissions:** `view_customer`, `add_customer`, `edit_customer`, `delete_customer`, or `manage_customers`.
- **SSE:** `customer:` events debounce reload of customer list (300ms).
- **Command palette:** First 40 customers cached in `localStorage` key `bika_palette_customers`.

## Code map

| Concern | Location |
|---------|----------|
| Table + modal form | `client/src/app/dashboard/customers/page.tsx` |
| Create page | `client/src/app/dashboard/customers/create/page.tsx` |
| Edit page | `client/src/app/dashboard/customers/[id]/edit/client.tsx` |
| Detail view | `client/src/app/dashboard/customers/[id]/client.tsx` |
| Form helpers | `client/src/lib/customerFormOptions.ts`, `client/src/lib/customerSearch.ts` |
| Table utils | `client/src/lib/tableUtils.ts` |
| API client | `client/src/lib/api.ts` (`fetchAllCustomers`, CRUD) |
| Native parity | `native-client/lib/customerFormOptions.ts`, `native-client/lib/api.ts` |
| Server | `server/src/controllers/customer.controller.ts`, `server/src/routes/customer.routes.ts` |

## Known divergence (watch on every change)

| Area | Modal (`page.tsx`) | Full-page create/edit |
|------|-------------------|------------------------|
| Fields | Full: caste, social, referrer, rating, WhatsApp toggle, street1/2 | Reduced: name, phone, email, priority, address single field |
| Referrer | Combobox over all customers | N/A |
| WhatsApp | Toggle + separate dial code | N/A |
| Edit entry | Modal via table Edit | Dedicated `/edit` route |

Any new field must be added consistently or documented as intentional.

## Commands

```bash
cd bika-banquet/server && npm test -- --testPathPattern=phone-search
cd bika-banquet/client && npm test -- --testPathPattern=dashboardDebounce
```

Manual when no E2E:

- [ ] Load customers table — sort, global search, column filters, pagination (100/page)
- [ ] Create via modal — India PIN lookup, save, appears in table
- [ ] Edit via modal — WhatsApp same vs different, referrer, rating
- [ ] Create via `/create` — redirect to detail
- [ ] Edit via `/edit` — fields match loaded record
- [ ] Delete with confirm — row removed, SSE refresh
- [ ] Permission denied user — no leak of rows

## Agent

`.cursor/agents/customer-section-integrity.md` — invoke on any scoped change before merge. All agent prose uses **caveman full** mode unless user says `stop caveman` or `/caveman lite|ultra`.

## New features workflow

1. Ask clarifying questions (permissions, which surfaces: modal vs full-page vs native).
2. Write plan under `docs/superpowers/plans/` (dated filename).
3. Implement with TDD where tests exist or add targeted tests.
4. Run agent checklist + commands above.
5. Spec review then code quality review (subagent-driven-development).
