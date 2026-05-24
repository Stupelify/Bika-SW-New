# Booking billing ceiling (2026-05-24)

## Rule

Net / grand total must not exceed the sum of billable lines: deduped halls + pack catering/setup/extras + additional items (`totalBillBase` / server `totalAmount`).

## Implementation

| Layer | Location |
|-------|----------|
| Server resolver | `server/src/controllers/booking.helpers.ts` — `resolveBookingFinancials`, `assertFinancialsWithinCeiling` |
| Create/update | `server/src/controllers/booking.write.ts` |
| Recalc / finalize | `server/src/controllers/booking.shared.ts`, `finalizeBookingVersion` |
| Client validation | `client/src/lib/booking-form/financials.ts` |
| Form gate | `client/src/app/dashboard/bookings/page.tsx` — `doSaveBooking` |

## Tests

```bash
cd bika-banquet/server && npx jest --testPathPatterns=booking-financials
cd bika-banquet/client && npm run test:unit:booking-form
```

## Error codes

- `BOOKING_NET_EXCEEDS_BILL` (HTTP 400) — server create/update/finalize when net exceeds line sum after recalc.
