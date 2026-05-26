# Booking Form Integrity

Living reference for the booking form workflow, regression tests, and the `booking-form-integrity` agent.

## Product rules

- **Payments:** Persisted via `POST/PATCH /bookings/:id/payments` after booking save. Form state must reload server IDs after each save.
- **Template import:** **Replace** pack menu with template items. Confirm if the pack already has selections. Fetch full template via `GET /template-menus/:id`.
- **Legacy data:** Duplicate historical payments are not auto-cleaned (fix forward only).
- **Billing ceiling:** Net / grand total must not exceed `totalBillBase` (deduped halls + pack lines + additional items). Enforced on save and finalize in the dashboard form; server caps discount/net on create/update and re-validates on finalize (`BOOKING_NET_EXCEEDS_BILL`).
- **Catering toggle:** Minimum rate per plate ₹200 when catering is on (client + server). Untick clears menu/pax/rate after one confirm. Edit load sets catering on only when persisted rate ≥ 200. Bill-base changes on edit still reset discount (do not preserve).

## Code map

| Concern | Location |
|---------|----------|
| Main UI | `client/src/app/dashboard/bookings/page.tsx` |
| Pure helpers | `client/src/lib/booking-form/` (`financials.ts`, `pack-catering.ts`) |
| Server catering | `server/src/controllers/booking.pack-catering.ts` |
| Payments UI | `client/src/components/BookingPaymentsLedger.tsx` |
| Native API | `native-client/lib/api.ts` |
| Server | `server/src/controllers/booking.write.ts`, `booking.payments.ts` |

## Commands

```bash
cd bika-banquet/client && npm run test:unit:booking-form
cd bika-banquet/client && npm run test:e2e:booking-form
cd bika-banquet/server && npm test -- --testPathPattern=booking
```

## CI

Workflow: `.github/workflows/booking-form-integrity.yml` (blocking on scoped path changes).

## Agent

`.cursor/agents/booking-form-integrity.md` — invoke on any scoped change before merge.
