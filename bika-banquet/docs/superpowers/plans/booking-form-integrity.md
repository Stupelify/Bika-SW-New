# Booking Form Integrity

Living reference for the booking form workflow, regression tests, and the `booking-form-integrity` agent.

## Product rules

- **Payments:** Persisted via `POST/PATCH /bookings/:id/payments` after booking save. Form state must reload server IDs after each save.
- **Template import:** **Replace** pack menu with template items. Confirm if the pack already has selections. Fetch full template via `GET /template-menus/:id`.
- **Legacy data:** Duplicate historical payments are not auto-cleaned (fix forward only).

## Code map

| Concern | Location |
|---------|----------|
| Main UI | `client/src/app/dashboard/bookings/page.tsx` |
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
