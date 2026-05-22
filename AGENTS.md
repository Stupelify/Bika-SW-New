# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

Bika Banquet is a full-stack banquet management platform inside `bika-banquet/`. It uses npm workspaces with two packages: `server/` (Express + TypeScript + Prisma) and `client/` (Next.js 14). See `bika-banquet/README.md` for full docs.

### Prerequisites (already in snapshot)

- **Docker** is required for PostgreSQL (and optionally Redis). Docker daemon must be started with `sudo dockerd &>/dev/null &` and socket permissions fixed with `sudo chmod 666 /var/run/docker.sock`.
- **PostgreSQL client** (`psql`) is needed to apply raw SQL migrations via `npm run db:apply-raw` in the server directory.

### Starting services

1. **PostgreSQL**: Start a container if one isn't already running:
   ```
   docker start bika-postgres 2>/dev/null || \
     docker run -d --name bika-postgres \
       -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=devpassword \
       -e POSTGRES_DB=bika_banquet -p 5432:5432 postgres:15-alpine
   ```
   A second test-database container on port 5433 is needed for `npm test`:
   ```
   docker start bika-postgres-test 2>/dev/null || \
     docker run -d --name bika-postgres-test \
       -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secure_password_change_me \
       -e POSTGRES_DB=bika_banquet -p 5433:5432 postgres:15-alpine
   ```

2. **Backend**: `cd bika-banquet/server && npx tsx watch src/server.ts` (port 5000). Note: the `npm run dev` script references `src/dev.ts` which does not exist; use `npx tsx watch src/server.ts` directly.

3. **Frontend**: `cd bika-banquet/client && npm run dev` (port 3000).

4. **Redis** is optional. The server falls back to in-memory rate limiting when `REDIS_URL` is not set.

### Environment files

- `bika-banquet/server/.env` — must contain `DATABASE_URL` pointing to the dev PostgreSQL, plus `JWT_SECRET`, `CLIENT_URL=http://localhost:3000`, etc.
- `bika-banquet/client/.env.local` — must contain `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

### Database setup

After starting PostgreSQL, run from `bika-banquet/server/`:
```
npx prisma generate
npx prisma migrate dev
npm run seed
npm run db:apply-raw     # applies raw SQL files (pg_trgm index, etc.)
```
For the test database, also apply migrations:
```
DATABASE_URL="postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet?schema=public" npx tsx src/scripts/applyRawMigrations.ts
```

### Linting & testing

- **Lint**: `cd bika-banquet/client && npm run lint` (requires ESLint v8 + `eslint-config-next`; an `.eslintrc.json` with `"extends": "next/core-web-vitals"` is needed).
- **Type-check server**: `cd bika-banquet/server && npx tsc --noEmit`
- **Server tests**: `cd bika-banquet/server && npm test` (Jest, requires test DB on port 5433).
- **Client E2E**: `cd bika-banquet/client && npm run test:e2e` (Playwright).

### Default credentials

- Login: `admin@bikabanquet.com` / `admin123`

### Gotchas

- The server dev script (`npm run dev` in server/) references `src/dev.ts` which does not exist. Use `npx tsx watch src/server.ts` instead.
- Raw SQL migrations in `server/prisma/*.sql` are not tracked by Prisma's normal migration system. They must be applied separately with `npm run db:apply-raw`. Tests that check for `pg_trgm` indexes will fail if these are not applied to the test DB.
- The `btree_gist` and `pg_trgm` PostgreSQL extensions must be installed on both dev and test databases for all features/tests to work.
