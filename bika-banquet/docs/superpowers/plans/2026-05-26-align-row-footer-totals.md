# Align row and footer booking totals

## Goal

Footer **Total** (pre-discount) equals the sum of enabled meal **Amount** columns plus additional requirements. Hall rate applies **once per meal pack**, not per selected hall id.

## Client

- `client/src/lib/booking-form/billing-lines.ts` — `computePackRowAmount`, `computePreDiscountTotal`, `buildBookingHallRows`
- `page.tsx` — `billingTotals.preDiscountTotal` for footer, `packRowAmount` for rows, zero-charge hall payload on save

## Server

- `sumBookingLines` — hall from pack `hallRate` when present; else legacy `booking_halls.charges`
- Create/update/recalculate pass `hallRate` into pack lines

## Tests

```bash
cd bika-banquet/client && npm run test:unit:booking-form
cd bika-banquet/server && npx jest --testPathPatterns=booking-financials
```
