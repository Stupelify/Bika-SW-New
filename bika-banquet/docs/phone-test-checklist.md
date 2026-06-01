# 📱 Phone Test Checklist — Server-Side Pagination

Use this after deploying branch `claude/serene-darwin-33jtn`. Open the app **on your actual phone** (that was the whole point — speed). Tick each box. If anything fails, note it and you can instantly revert that one list with the kill switch at the bottom — nothing else is affected.

> Tip: the lists only show multiple pages when there's enough data. On a fresh/empty test database, run `cd server && npm run seed && npm run stress-test` first.

---

## 1. Customers list
- [ ] The page opens **quickly** (no long freeze while loading).
- [ ] You see **numbered pages** and a "Showing X–Y of N" total at the bottom.
- [ ] Tapping page **2, 3, …** loads the next set fast.
- [ ] Flipping back and forth between pages shows the **same rows in the same order** (nothing reshuffles).
- [ ] **Search a name** → the right people show up, including ones not on page 1.
- [ ] **Search a phone number** (with or without spaces) → finds the customer.
- [ ] **Search a city/state** → matching customers appear.
- [ ] Clearing the search returns to the normal list.
- [ ] Tapping a **column header sorts**, and the sort holds when you change pages.

## 2. The customer picker (when adding/editing a booking) — most important
- [ ] Open the customer field → a **list appears that you can scroll**.
- [ ] **Keep scrolling down** → more customers **load automatically** (a brief "Loading more…" shows).
- [ ] **Type a name** → it searches **everyone**, even customers far down the list.
- [ ] **Type a phone number** → finds the right person.
- [ ] Pick a customer → it's selected correctly.
- [ ] **Edit an existing booking** → the **already-chosen customer is shown** in the field (never blank), even if they're an old/far-down record.

## 3. Bookings list
- [ ] Opens quickly; numbered pages + total work.
- [ ] Search by function name, customer name, phone, or status → correct results.
- [ ] Sorting by date/columns works and stays stable across pages.

## 4. Payments
- [ ] Opens quickly; pages + total work.
- [ ] **"Add Payment" booking picker**: scroll to browse, type to find any booking, and the selected booking stays shown.
- [ ] Received / balance columns sort correctly.

## 5. Enquiries
- [ ] Opens quickly; pages + total work.
- [ ] Search (function name, customer, status) → correct results.
- [ ] Opening an enquiry to edit works even if it's not on the current page.

## 6. General / safety
- [ ] Nothing in the **calendar** changed (it still shows bookings by date as before).
- [ ] Small lists (menu items, halls, vendors, users) are unchanged.
- [ ] Turn on airplane mode briefly mid-scroll → the current page **stays on screen** (no blank screen), and a retry option appears. Turn network back on → it recovers.
- [ ] Creating / editing / deleting a record updates the list as expected.

---

## 🛑 Kill switch — instant revert per list (no code change)

If one list misbehaves, open the browser console (or have a developer do it) and run **one** of these, then reload. That list goes back to the old behavior; everything else stays on the new behavior.

```js
localStorage.setItem('bika_ff_server_pagination_customers','off')  // customers
localStorage.setItem('bika_ff_server_pagination_bookings','off')   // bookings
localStorage.setItem('bika_ff_server_pagination_payments','off')   // payments
localStorage.setItem('bika_ff_server_pagination_enquiries','off')  // enquiries
```

To turn it back on, set the value to `'on'` (or remove the key) and reload.

Server-wide default (for a deploy) can also be set via env vars:
`NEXT_PUBLIC_SERVER_PAGINATION_CUSTOMERS=off` (and `_BOOKINGS`, `_PAYMENTS`, `_ENQUIRIES`).
</content>
