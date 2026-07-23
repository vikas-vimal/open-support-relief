# Airdrops for Cockroaches

A live shortage board for protest supplies.

On-site volunteers post what is running out and how much. Supporters anywhere see the list
ranked by biggest shortfall, order it themselves through a quick-commerce app to a published
drop point, upload proof of the order, and the counter drops — so the next person sees an
accurate picture instead of sending a fortieth pizza while nobody has a raincoat.

> **Status: work in progress.** The UI is complete and runs against a local fixture. There is
> no backend yet — no database, no auth, no real drop points. See [Roadmap](#roadmap).

## Why it works this way

**No quick-commerce ordering API exists.** Blinkit, Zepto, Swiggy Instamart and Zomato have no
public third-party ordering API, and deep links cannot prefill a delivery address. The app can
never place an order. Its job is: show the need → hand over the address in one tap → send you
to your own delivery app → take the proof when you come back. "Copy address" is the most
important button in the product.

**The app never touches money.** Contributors pay the delivery app directly. Pooled funds would
turn this into a regulated money-transmission and fraud-liability problem.

## Safety model

This app coordinates real supplies at real protests, so a few rules are load-bearing rather
than stylistic:

- **Drop points are login-gated.** Only a coarse area label is public. The full address and
  volunteer phone require a session, are rate-limited and audit-logged, and can be killed
  site-wide instantly via an `isFrozen` switch.
- **Two on-device allow-lists, never deny-lists.** `lib/query/query-keys.ts` gates what the
  React Query cache persists to IndexedDB; `public/sw.js` gates what the service worker caches
  and hard-rejects all `/api/*`. Either one inverted would write a volunteer's address and
  phone to disk, where it survives sign-out *and* the kill switch.
- **Order screenshots stay private.** They contain the contributor's own name, phone and home
  address. Private bucket, short-lived signed URLs, moderator-only, auto-purged.
- **Data minimisation is a safety feature.** Accounts plus screenshots plus a protest address
  is a record of who supported a protest. No IP retention, anonymous auth as the default path,
  and no third-party analytics.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 ·
TanStack Query v5 persisted to IndexedDB · Vitest · PWA with a hand-written service worker.

Every page is statically prerendered — no SSR, no server actions. The HTML shell is a plain
CDN asset so it paints immediately on a bad connection, and data arrives after.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / tsc |
| `npm run icons` | Regenerate PWA icons from the vector source |

## Customising

**`config/app.config.ts` is the single source of truth** for branding, major copy, colours and
corner radius. It is read at build time by page metadata, the PWA manifest and the injected
theme CSS — so editing that one file rebrands the web app *and* the installed PWA.

After changing any colour:

```bash
npx vitest run lib/theme/contrast.spec.ts
```

That suite fails if any pairing drops below WCAG AA. It is not decoration — it caught that
`#0099ff` measures 2.9998:1 on white and misses the 3:1 non-text threshold for graphics.

## Database

Prisma 7 with the pg driver adapter, against Supabase Postgres. `schema.prisma` is
the modelling source and drives `prisma generate` only. Connection URLs live in
`prisma.config.ts`, read from `.env`.

**Migrations are hand-written SQL, applied manually — never `prisma migrate`.** Every
schema change is a reviewed, committed `.sql` file in [`db/migrations/`](db/migrations),
applied in order against the session pooler (`DIRECT_URL`, port 5432 — pgbouncer can't
run DDL). A `_manual_migrations` table tracks what has been applied.

```bash
# Author a new migration from the schema (read-only; does NOT touch the DB):
npm run db:diff > db/migrations/NNNN_description.sql   # then review + edit by hand

# Apply, in order:
npm run db:apply db/migrations/0001_init.sql
npm run db:apply db/migrations/0002_ranking_index_and_constraints.sql

npm run db:seed        # load the demo board
```

If the database is unreachable, `GET /api/needs` serves the seed fixture **in dev only**
(never production), flagged with an `X-Data-Source: seed-fallback` response header.

## Roadmap

- [x] Board UI, search, duplicate-guarded item requests, pagination
- [x] System dark mode + toggle, offline handling, PWA, device caching
- [x] Prisma schema, `GET /api/needs` with Zod-validated contract
- [ ] Run the first migration against the live database
- [x] Auth (anonymous + Google), gated drop-point reveal with audit log
- [x] Contribution claims (idempotent), intent locks, item-request persistence
- [x] Proof-screenshot upload (private bucket, presigned PUT, EXIF stripped)
- [ ] Moderation queue (verify claims + item requests, set drop-point address, freeze)
- [ ] Contributor wall, in-app blur brush
- [ ] Hindi localisation, share cards
