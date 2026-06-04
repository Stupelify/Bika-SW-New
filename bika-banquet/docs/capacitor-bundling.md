# Capacitor — bundled (offline) build

By default the native app loads the live site (`https://banquet.bikafood.com`)
in a WebView. This document describes the **opt-in bundled build**, which ships
the UI inside the binary so it starts instantly and works offline (shell + last
cached data), hitting the network only for API/SSE.

The switch is gated behind the `CAPACITOR_BUILD=1` env flag. **With the flag
unset, nothing changes** — the web deployment and the current remote-load
Capacitor build behave exactly as before.

## What it does

| Flag unset (default) | `CAPACITOR_BUILD=1` |
|---|---|
| `next build` → server mode (`next start`) | `next build` → static export to `client/out` |
| `next/image` optimizer on | `images.unoptimized` |
| `rewrites()` proxy `/api` → backend | no rewrites; app calls the absolute API URL |
| Capacitor `server.url` = remote site, `webDir: public` | no `server.url`; `webDir: out` (local assets) |

## How to build it

```bash
cd client
# API base must be ABSOLUTE for a locally-served bundle (default: prod):
NEXT_PUBLIC_API_URL=https://banquet.bikafood.com/api npm run build:capacitor
npm run cap:sync          # copies client/out into the native projects
npx cap open android      # or: npx cap open ios  → build/run on a device
```

## Status — verified vs. remaining

**Verified in CI/dev:**
- Static export builds green (all routes emit to `client/out`).
- Server CORS already allows the native origins — `server/src/server.ts`
  `isAllowedOrigin()` permits `capacitor:` and `ionic:` protocols and
  `*.bikafood.com`, so the bundled app may call the absolute API URL.

**Remaining (need a device / native toolchain — cannot be verified in CI):**
1. **Customer detail/edit deep links.** `customers/[id]` and `[id]/edit` are
   dynamic routes; static export pre-renders only a `placeholder` param. In the
   app these screens are reached by client-side navigation from the customers
   list, which works, but a *hard load* of `/customers/<id>` (cold deep link)
   has no pre-generated file. Confirm on-device that list → detail → edit
   navigation works; if cold deep links are needed, convert these two screens to
   query-param routing (`/customers/detail?id=…`) so they are fully static.
2. **Native rebuild + device smoke test** (cold-start paint, offline shell,
   login, a booking create/edit round-trip) on Android and iOS.
3. **Deploy-model implications (important).** Once shipping the bundle, a
   frontend change is no longer live the moment `banquet.bikafood.com`
   redeploys — it requires a new app-store / APK release. Users on old binaries
   run old UI against the same API, so adopt a **minimum-supported-client / API
   versioning** policy before switching the store builds over.

## Rollback

Build without the flag (`npm run build` + the existing remote-load
`capacitor.config.ts` path). No code revert required — the flag simply selects
the old behavior.
