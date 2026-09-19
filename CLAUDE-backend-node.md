# CLAUDE.md

_Last updated: 2026-09-19_

A Fastify + TypeScript + Postgres API. The repo-root `CLAUDE.md` (general coding rules, git) still
applies; this file covers the backend.

## Preferred Technologies

- **Language** — TypeScript (`strict`), ESM (`module`/`moduleResolution: nodenext`, `"type": "module"`). Relative imports carry an explicit `.js` extension (required under NodeNext), e.g. `from './pool.js'`.
- **Framework** — [Fastify](https://fastify.dev) on an active Node LTS; use matching `@fastify/*` plugin majors
- **Database** — Postgres via **Kysely** (typed query builder, no ORM) on the `pg` driver. Table types are **generated** from the live schema by kysely-codegen (`npm run db:types` after any schema change). Raw SQL survives only where the builder can't express it (`sql` tagged fragments)
- **Validation** — TypeBox schemas + `@fastify/type-provider-typebox` → AJV. Mandatory per route — see [Validation](#validation-mandatory)
- **Realtime** — `@fastify/websocket`
- **Media** — `@fastify/multipart` upload + `sharp` processing, served via `@fastify/static`
- **Dev/build** — `tsx` (watch + script runner), `tsc` (build), **Vitest** (tests)
- **Docs** — `@fastify/swagger` UI at `/docs`, OpenAPI JSON at `/docs/json`

When adding a capability, prefer a first-party `@fastify/*` plugin before a third-party one — it
keeps lifecycle and encapsulation consistent.

## Architecture — feature modules + platform

Each product feature owns its HTTP endpoints, SQL and services under `src/feature/<name>/{api,db,lib}`.
What is NOT a feature (shared infrastructure, the DB core) stays put.

```
src/
  server.ts              # entry: one API instance — migrations under a lock, listen, drain on SIGTERM
  worker.ts              # entry: the background worker (minute tick, exports, purges)
  app.ts                 # buildApp(): plugins, auth gate, error handler, feature registration
  feature/<name>/        # ONE FEATURE = api + db + lib
    api/                 #   HTTP layer — ONE FILE PER ENDPOINT + an index.ts barrel
    db/                  #   the feature's queries — ONE QUERY PER FILE + index.ts + shared.ts
    lib/                 #   the feature's services (events, builders, guards)
  shared/                # cross-cutting services every feature may use
    api/                 #   platform endpoints (config, media, ws)
    db/                  #   queries and SQL fragments no single feature owns
  db/                    # DB core — stays central (one database, one schema)
    pool.ts, kysely.ts, config.ts, schema.sql, migrate.ts + migrations/
    generated/           #   kysely-codegen output — never edit by hand
    seeds/, scripts/     #   seed data + one-shot CLI runners
  test/{unit,integration}/
```

**URLs do not come from folders.** Every route file registers its FULL path itself
(`app.get('/me/export', …)`) and `app.ts` mounts every feature barrel under a version prefix — so
`/me/*` endpoints live in the feature that owns their data, and moving a file never changes the API.

### Layer responsibilities — don't cross them

- **`feature/<f>/api/`** — parse the request, call the feature's `db/` + `lib/`, shape the reply. No SQL here.
- **`feature/<f>/db/`** — owns the feature's SQL. One query per file, exported through `index.ts`; reusable predicates and selects live in `shared.ts`. Queries go through the typed Kysely instance; values are always bound, never string-interpolated. Row → wire mapping (snake_case → camelCase) happens in the query file. Routes never touch the pool directly. Cross-feature data access goes through the OTHER feature's `db/index.ts` barrel — never reach into its files.
  **Atomic multi-statement writes run in a transaction** on a single checked-out client (`pool.connect()` → `BEGIN`/`COMMIT`/`ROLLBACK` in try/finally with `client.release()`), never as separate `pool.query` calls — exposed as one query function so routes stay transaction-agnostic.
- **`src/shared/`** — platform services that belong to no single feature, and the platform endpoints under `shared/api/`. Sessions live in `feature/auth`; `app.ts` composes the gate from it.

## Routes — one file per endpoint

Each route file **default-exports a `FastifyPluginAsync`** that registers **exactly one** route. The
feature's `api/index.ts` barrel registers all of them. **Adding an endpoint = add a file + one line
in the barrel.**

```ts
// feature/items/api/createItem.ts
import type { FastifyPluginAsync } from 'fastify'
import { insertItem } from '../db/index.js'
import { requireUser } from '../../auth/lib/session.js'

export const createItem: FastifyPluginAsync = async (app) => {
  app.post('/items', async (req, reply) => {
    const user = requireUser(req)
    // …call db/ + lib/, then:
    return reply.code(201).send({ item })
  })
}

export default createItem
```

- Swagger tags are applied by an `onRoute` hook in `app.ts` (by the first path segment) — **don't** add per-route tag boilerplate.
- Public endpoints opt out of the auth gate with `config: { authorized: false }`. Default = a session is required.
- Use `requireUser(req)` for the typed, non-null authenticated user inside a gated handler.

## Validation (MANDATORY)

Every route that reads `body`, `params` or `querystring` **must declare a TypeBox schema** for it. No
hand-parsing (`req.body as Partial<T>`), no manual coercion or clamping that a schema can express.

Type the plugin `FastifyPluginAsyncTypebox` (NOT `FastifyPluginAsync`, and **no**
`app.withTypeProvider()` call); put the schema in the route options:

```ts
const Body = Type.Object({ note: Type.Optional(Type.String({ maxLength: 280 })) }, { additionalProperties: false })
const Params = Type.Object({ id: Type.String({ minLength: 1 }) })

export const updateThing: FastifyPluginAsyncTypebox = async (app) => {
  app.patch('/things/:id', { schema: { params: Params, body: Body } }, async (req) => {
    const b = req.body          // typed + validated — no cast
  })
}
```

- **Naming:** local single-endpoint schemas are named after the slot — `Body` / `Querystring` / `Params`. Reusable fragments live in a shared `schemas/common.ts` with a domain name.
- **Reject unknown fields:** bodies use `additionalProperties: false`. **Exception:** externally-shaped payloads (OAuth tokens, WebAuthn objects, push subscriptions) must allow extra and nested props — breaking login or push is worse than a lax schema.
- **Querystring and params** are AJV-coerced, so type them (`Type.Integer()`, …) and drop manual `Number()` / `parseInt` / clamping.
- **Empty strings ≠ "none" — defend at the boundary.** Coerce an empty-string id or reference to null with `field || null` (NOT `?? null`, which keeps `""`) before it reaches a column or FK: `""` otherwise hits the FK and 400s, mis-attributed.
- A **bodyless request** should be coerced to `{}` before validation by a `preValidation` hook, so an all-optional body validates on an empty request.
- **Errors:** AJV failures are mapped by the global handler to the app envelope — don't hand-roll validation 400s.
- Add a test asserting bad input → `400 { code: 'invalid' }`.

Response schemas are optional; add them per route when useful.

## Errors

- Throw to fail. One envelope shape everywhere: **`{ code, title, status, reqId }`** (`reqId` is the request id from the access log, so a client-side report can be matched to it). When you throw, set `err.statusCode` + `err.code`; the global handler maps `err.message → title`.
- **5xx are masked** (title replaced, the real error + `cause` logged server-side) so internal details never leak; deliberate 4xx keep their `code` and `title`. Never send a raw `message` field.
- For an expected 4xx, either throw an error carrying `statusCode` + `code`, or reply through a `httpReply.ts` helper (`notFound` / `badRequest` / `unauthorized` / `conflict`) — never hand-roll the envelope.
- Map known PG error codes to 4xx at the boundary in one place (`pgErrors.ts`: `23503` FK violations → 400). Don't re-inline the error-code check in routes or queries.
- **A capacity failure is not a bug.** A pool connect timeout or a lock timeout deserves **503 with `Retry-After`**, not a masked 500: one tells the client to come back, the other to give up.

## Instances and the bus

- Anything one instance does that the others must react to at once goes over a bus (`publish(event)`): session revocations, evictions, WebSocket frames for users connected elsewhere, cache drops. **The publisher applies the effect locally first**; the bus reaches the other instances only. Events carry ids, not data. Delivery is best effort: correctness must rest on the tables and cache TTLs.
- Keep the transport behind an interface (Postgres LISTEN/NOTIFY is enough to start; Redis can replace it without touching a publisher).
- **New in-memory state is a bug** unless it is per-request, a pure cache with a TTL that is also dropped over the bus, or mirrored to a table. One-shot values that span two requests (WebSocket tickets, auth challenges, provider nonces) live in a table, never in a process `Map`.
- `INSTANCE_ID` names the instance in logs, heartbeats and presence rows; divide rate limits across instances.

## Connections and locks

- Both pools are bounded (`max`, `connectionTimeoutMillis`): without a connect timeout a saturated pool queues forever and any pile-up wedges the process. With the bound, overload degrades to failed requests that recover on their own.
- **Never hold two pooled resources in sequence.** A critical section that takes a lock connection and then queues for a main-pool connection holds the first for as long as the second makes it wait, and the lock pool empties under load even though nobody is waiting for the lock. Run the section on the connection that holds the lock.
- Cross-request invariants that no constraint backs are serialized with a **transaction-scoped** advisory lock (`pg_advisory_xact_lock`), so commit, rollback or a dropped connection always releases it. Bound the wait with `set local lock_timeout`, and prefix every lock family (`user:<id>`, `job:<name>`) so unrelated sections can't collide.

## Observability

One logger for every process (pino; a module child per area). One JSON line per event, with
`service`, `instance`, `version`, `sha` and `mod` on every line.

- `msg` is a stable identifier `area.what_happened` (`bus.publish_failed`, `http.request`), no data in the text; data goes in fields with shared names (`userId`, `reqId`, `durationMs`, `code`, `err`).
- Levels: `error` = a person should look; `warn` = degraded, retried or a refused request; `info` = life cycle, business events, the access line; `debug` = frequent per-request detail, off in production.
- **No `console.*` in `src/`** (ESLint `no-console`); CLI scripts are the exception.
- One access-log line per request from `onResponse`, with the route pattern, status, duration, user and `reqId` (from the proxy's `X-Request-Id`, echoed back). Health checks are never logged. Every minute, a gauge line carries sockets, cache sizes, **pool counters**, event-loop lag and memory — the pool counters are what tell overload apart from slowness.
- **Log the real 5xx (with `cause`) server-side before masking it**, or masked errors become undebuggable. Never log secrets, tokens, cookies, emails, names, message bodies or exact coordinates; user ids are fine.

## Database workflow

```bash
npm run db:reset        # drop + recreate schema + seed
npm run db:migrate      # run pending migrations
npm run db:types        # regenerate the Kysely types from the live schema
```

- **Schema changes** go through `db/migrations/` (ordered, append-only) so existing databases upgrade; `db/schema.sql` is the from-scratch DDL a fresh database gets in one step (it records every migration as included rather than replaying them). Keep the two in sync — a fresh reset and a migrated database must produce an identical schema (a `pg_dump --schema-only` diff catches drift; column order counts).
- **A migration that rewrites a table needs VACUUM, not just ANALYZE.** After a rewrite the visibility map is empty and index-only scans stop being index-only, which can make a fast read slow without any plan changing.
- **Seed data** lives in `db/seeds/`; **operational one-shot runners** in `db/scripts/`, wired to `db:*` npm scripts. Keep these out of the data-access modules.

## Tests

- **Vitest**, against a **dedicated test database** (never the dev DB). The schema is rebuilt once per run and **every mutable table is wiped before each test**.
- `fileParallelism: false` — all files share the one test DB, so they must run serially.
- **Integration** tests drive the real app via `buildApp()` + `app.inject()` (no network) — this is the primary style. **Unit** tests cover pure helpers.
- Before pushing: `npm run typecheck` and `npm run test`.
