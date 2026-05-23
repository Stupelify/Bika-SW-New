# Native client — booking form integrity

When adding or changing booking/payment flows in `lib/api.ts` or future booking screens:

1. **Never** `POST` the same payment twice because local state lacks a server `id`.
2. After `addPayment`, reload the booking (or merge returned payment `id` into local state).
3. Template menu import must **merge** item IDs (see `client/src/lib/booking-form/menu-template.ts`).

Run the web integrity suite before merge:

```bash
cd bika-banquet/client && npm run test:unit:booking-form
```

Agent: `.cursor/agents/booking-form-integrity.md`
