# Booking Form Integrity

Living reference for the booking form workflow, regression tests, and the `booking-form-integrity` agent.

## Product rules

- **Payments:** Persisted via `POST/PATCH /bookings/:id/payments` after booking save. Form state must reload server IDs after each save.
- **Template import:** **Replace** pack menu with template items. Confirm if the pack already has selections. Fetch full template via `GET /template-menus/:id`.
- **Legacy data:** Duplicate historical payments are not auto-cleaned (fix forward only).
- **Billing ceiling:** Net / grand total must not exceed `totalBillBase` (sum of enabled meal row amounts + additional items). Enforced on save and finalize in the dashboard form; server caps discount/net on create/update and re-validates on finalize (`BOOKING_NET_EXCEEDS_BILL`).
- **Row vs footer total:** Each enabled pack **Amount** = catering + **one** `hallRate` (never × `hallIds.length`). Footer **Total** (pre-discount) = sum of those row amounts + extras. Hall money is stored on pack `hallRate`; `booking_halls.charges` is `0` (association only). See `billing-lines.ts` and plan `2026-05-26-align-row-footer-totals.md`.

## Code map

| Concern | Location |
|---------|----------|
| Main UI | `client/src/app/dashboard/bookings/page.tsx` |
| Finalized history | `client/src/components/booking/FinalizedVersionHistory.tsx` |
| Billing engine | `@bika/booking-core` (`billing-engine.ts`, `formPacksToSumBookingInput`) |
| Pure helpers | `client/src/lib/booking-form/` |
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
