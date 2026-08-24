# Phase 2: Shared Infrastructure & Session Reliability - Research

**Researched:** 2026-08-24
**Domain:** IST date utilities, response-envelope normalization, TanStack Query session lifecycle, pagination UI, frontend RBAC — Next.js 16 + React 19 + TanStack Query v5 client app against an Express/Mongo backend
**Confidence:** HIGH (backend contract verified directly in `../saher-backend/src` source; library APIs verified via Context7/official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Adoption Sweep**
- **D-01:** Full retrofit inside Phase 2 — every existing date rendering/parsing call site and every paginated list (attendance, corrections, users admin table, notifications, …) migrates to the new utilities/factory/footer in this phase. Not just new modules.
- **D-02:** All list screens swap to the shared pagination footer — one consistent pagination UX everywhere, including TanStack Table screens (users admin, corrections).
- **D-03:** Retrofit regression safety at agent's discretion ("do what will be ok"). Default: render tests via the Phase 1 helper where user-visible output changes (attendance times, calendar, users list); lint/typecheck/test gates everywhere else.
- **D-04:** Scope guard: if the retrofit uncovers breakage beyond what these utilities touch, log it to STATE.md blockers/deferred — do not fix here. Audit-and-fix is Phase 7.

**Session Death & Logout Contract**
- **D-05:** On confirmed session death (401 even after refresh attempt): redirect once to `/login?next=<current-path>`; after re-login the user lands back where they were.
- **D-06:** Exactly one deduped "Session expired" toast at death time — never a toast storm across concurrently failing queries.
- **D-07:** Clear-all on BOTH session death and logout: `queryClient.clear()` + cancel in-flight queries so nothing refetches into a dead session and nothing of the old session survives the redirect.
- **D-08:** Best-effort logout: if `POST /api/auth/logout` fails (network, already-dead session), still clear cache + redirect. The user is never trapped by a failing logout call.

**IST Date Conventions**
- **D-09:** Two canonical display formats, one source of truth: date-only `DD MMM YYYY` and datetime `DD MMM YYYY, hh:mm A` (IST). Existing `formatDate`/`formatTime` behavior folds into this set; screens stop inventing formats.
- **D-10:** Form input strategy is mixed but IST-bound: native `<input type="date">` / `datetime-local` for entry plus shadcn Calendar popover where a month view helps (events/calendar); ALL values round-trip through the IST utils to `+05:30` ISO before hitting the API.
- **D-11:** Absolute times only — no relative times anywhere, notification feed included.
- **D-12:** Libraries that own a clock (FullCalendar, react-day-picker) are configured to fixed `+05:30` timeZone where supported, and every value crossing their boundary flows through the IST utils. No silent exceptions — success criterion #1 (identical rendering regardless of browser timezone) holds on calendar surfaces too.

**RBAC Helper**
- **D-13:** `can(action, resource)` reads a hardcoded frontend role→permissions matrix (e.g., `lib/permissions.ts`) mirroring the backend's actual `authorize()` guards; the matrix vocabulary is pinned during this phase's contract check.
- **D-14:** `can()` unifies ALL gating: RoleGuard route checks, sidebar nav filtering, and button/row-action affordances derive from it; existing inline `role ===` comparisons are swept in the retrofit.
- **D-15:** Manager role strings are MEDIUM confidence today — resolve with ONE live probe of `GET /api/auth/me` during the contract check; matrix + tests assert against the exact strings observed.

**Module Placement & Auth Test Depth**
- **D-16:** Envelope normalization is an explicit pure factory in `lib/` (e.g., `normalizeList(res)`) that services call after `apiFetch`; `apiFetch` stays a dumb envelope parser. Normalized shape handles both meta field names (`total`, `totalPages`) and nullable `data`.
- **D-17:** One shared session module in `lib/` owns the D-05..D-08 contract; both the 401-after-refresh path (`lib/api-wrapper.ts`) and the logout hook call into it — one behavior, two triggers.
- **D-18:** The new IST utilities REPLACE `lib/utils/time.ts` outright (helpers folded in or deleted); every importer migrates during this phase's retrofit. One home for dates.
- **D-19:** AUTH-01 verification = msw-driven integration tests through the REAL `lib/api-wrapper.ts`: concurrent 401s trigger exactly one refresh call, original requests retried exactly once, refresh failure fires the D-05..D-07 contract. These are the durable money-path tests AUDT-08 later relies on.

**Pagination Footer Behavior**
- **D-20:** Footer renders prev/next buttons + "Page N of M" readout; controls DISABLED (never hidden/crashing) when meta is missing/malformed or already at first/last page.

### the agent's Discretion
Exact file names for new lib/ modules and the footer component, factory signature details, which shadcn primitives back the footer, test case lists beyond D-19's minimum, internal structure of the permissions matrix, how `next=` interacts with proxy.ts cookie redirects.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (Breakage discovered during retrofit gets logged per D-04, not fixed.)
</user_constraints>

## Project Constraints (from AGENTS.md)

- Tech stack: Next.js + Tailwind + shadcn/ui — extend existing patterns, no new UI framework.
- All date logic must be IST-aware; send `+05:30` offsets.
- Tests for critical flows (money, auth, forms); audit-fix approach for existing modules, not wholesale rewrites.
- All HTTP through `apiFetch`; queries live in `hooks/use-*`; services are pure fetch+zod; new shared logic belongs in `lib/`.
- ESLint `no-console` (allow warn/error); strict TS; `@/*` alias only.
- Do not reformat `components/ui/*` (shadcn-generated).
- GSD workflow: work lands via plans/tasks; Phase 1 test rules apply (msw at apiFetch boundary, co-located `<name>.test.ts(x)`, shared `renderWithProviders`).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FNDT-02 | IST-safe datetime utilities (fixed-offset formatting/parsing, ISO with +05:30), unit-tested; all date rendering/parsing routes through them | Native `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"` + native Date fixed-offset parsing; backend emits UTC `Z` strings (verified in `normalizeDoc`); day-boundary cases enumerated below; D-18 replacement surface = 8 exports × 11 importer files (+21 files using raw `new Date`/`toLocale*`) |
| FNDT-03 | Envelope normalization factory handling both page-count field names and nullable data | Backend ground truth: BOTH `total` and `totalPages` carry **page counts** (`Math.ceil(count/limit)`); `count` is the record count; `data: data ?? null`; meta may be absent entirely (`GET /api/admin/users`); normalizer design below |
| FNDT-04 | Central session-death handler + logout cache clearing without refetch storms | Verified `queryClient.clear()` (wipes query+mutation cache), `cancelQueries()`, `QueryCache.onError` semantics (v5 official docs); wiring pattern for `app/provider.tsx` + `lib/api-wrapper.ts` below |
| FNDT-05 | Safe pagination footer that never crashes on missing/malformed meta | Existing `attendance-pagination.tsx` as UX base; D-20 disabled-not-hidden rule; found live crash vector `Number(undefined) < n === false` (next stays enabled on empty meta) and TanStack `pageCount: undefined` case |
| FNDT-06 | Permission helper `can(action, resource)` | Backend vocabulary pinned by source read: actions `read/write/update/delete` × resources list, permission string format `` `${resource}:${action}` ``; FOUR roles exist (`intern`, `user`, `manager`, `admin`) — not three; matrix must mirror sets exactly (no hierarchy inheritance — verified counterexamples) |
| AUTH-01 | Login/logout/refresh verified per contract (single refresh retry on `Invalid Session`, cookies untouched by JS) | Full 401 message inventory from `protected-route.ts` + refresh controller; refresh failure clears all 3 cookies server-side; logout revokes Redis session then clears cookies; D-19 test plan maps to real wrapper |
</phase_requirements>

## Summary

This phase replaces ad-hoc date handling, pagination plumbing, role checks, and session-failure behavior with four small `lib/` modules plus one shared footer component — then retrofits every existing call site. The backend contract was verified directly against `../saher-backend/src` source, resolving the phase's flagged MEDIUM-confidence items statically and surfacing three discoveries that change what the planner should assume:

1. **The backend has FOUR roles, not three** — `['intern', 'user', 'manager', 'admin']` (`user.model.ts:3`). The frontend's `"user" | "manager" | "admin"` type is incomplete. Permissions use explicit per-role sets with NO hierarchy (admin lacks `write bank` while manager has it; `user` has full `notice` CRUD while admin/manager have none). A naive "role ≥ other roles" matrix would gate wrongly; the matrix must mirror `role-permission.ts` verbatim.
2. **Both meta field names mean PAGE COUNT, not record count.** Every inspected paginated endpoint emits either `total: Math.ceil(count/limit)` or `totalPages: Math.ceil(count/limit)`. The record count is always `count`. The frontend currently interprets the same field both ways (`attendance-dashboard.tsx` treats `meta.total` as records → passes to `Math.ceil(total/limit)`; `attendance-table.tsx:90` and `corrections/data-table.tsx:77` treat it as pages). The normalizer should derive `{ items, page, limit, totalPages, totalRecords }` from `count` and tolerate `totalPages: 0` (verified emitted for empty results) and absent meta entirely (`GET /api/admin/users` returns a bare array with no meta).
3. **Session death is cookie-safe for redirect.** On refresh failure the backend itself clears all three httpOnly cookies (`saher_access_token`, `saher_refresh_token`, `saher_session_id`) in the same 401 response, so a hard redirect to `/login?next=…` will not bounce off `proxy.ts`. The bounce risk exists only in the best-effort *logout network failure* path (cookies still present → proxy redirects `/login` → `/`), which is acceptable/degradable and noted as a pitfall.

No new npm packages are required: formatting/parsing uses native `Intl` + `Date` (date-fns v4 already installed as a fallback formatter), cache/session APIs are TanStack Query v5 (installed), the footer reuses existing shadcn `Button` + lucide icons, and `can()` is plain TypeScript. react-day-picker 9.14 (installed) already supports a `timeZone` prop; FullCalendar needs zero plugins if fed pre-shifted IST wall-clock strings (documented UTC-coercion behavior).

**Primary recommendation:** Build four pure modules — `lib/date.ts` (Intl-based IST format/parse, replaces `lib/utils/time.ts`), `lib/normalize-list.ts`, `lib/session.ts` (single-flight-aware death handler + deduped toast + clear-and-redirect), `lib/permissions.ts` (4-role mirrored matrix + `can()`) — plus `components/pagination-footer.tsx`; wire `session.ts` into `apiFetch`'s refresh-failure branch and a global `QueryCache`/`MutationCache` onError in `app/provider.tsx`; retrofit all consumers per D-01/D-02/D-14; prove AUTH-01 with msw integration tests through the real wrapper (D-19).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| IST display formatting / parsing | Browser/Client (`lib/date.ts`) | — | App is effectively CSR; all rendering happens client-side; utils are pure functions over ISO strings |
| Envelope normalization | Client (`lib/normalize-list.ts`, called by services layer) | API tier (backend already sends envelope) | Backend is frozen (out-of-scope directive); frontend adapts at the service boundary per D-16 |
| Session death detection & recovery | Client (`lib/session.ts` via `apiFetch` + QueryCache onError) | Backend (401 emission, cookie clearing) | Backend already does its part (refresh endpoint, cookie clear); frontend owns UX recovery |
| Pagination controls | Browser/Client (`components/pagination-footer.tsx`) | — | Pure presentation over normalized meta |
| RBAC affordance gating | Browser/Client (`lib/permissions.ts` + RoleGuard/nav/buttons) | API tier (real enforcement) | Client matrix is UX-only; every endpoint enforces server-side via `authorize()` — never treat `can()` as a security boundary |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `Intl.DateTimeFormat` | ES2020+ (Node 24, all evergreen browsers) | IST display formatting via `timeZone: "Asia/Kolkata"` | Platform-native, TZ-independent output guaranteed; zero deps; India has no DST so named zone ≡ fixed `+05:30` [VERIFIED: MDN/ECMAScript i18n spec — see Sources] |
| Native `Date` parsing | ES2015+ | Parse `"...+05:30"` fixed-offset strings and emit `.toISOString()` | Spec-defined fixed-offset parsing; converts IST wall-clock input → UTC Z for the API [CITED: ECMAScript Date Time String Format] |
| @tanstack/react-query | ^5.94.5 (installed) | `queryClient.clear()`, `cancelQueries()`, `QueryCache({ onError })`, `MutationCache({ onError })` | Already the server-state layer; APIs verified against v5 docs [VERIFIED: Context7 /tanstack/query + tanstack.com QueryCache reference] |
| zod | ^4.3.6 (installed) | Normalizer composes with existing service schemas; validates meta shape defensively | Project convention: DTOs derived from zod |
| vitest + @testing-library/react + msw | installed Phase 1 | Unit + render + integration tests through real `apiFetch` | Phase 1 harness rules (01-CONTEXT D-05..D-08) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (installed) | Optional token formatting helpers on shifted dates | Only if Intl `formatToParts` assembly proves awkward; NOT required |
| lucide-react + shadcn `Button` | installed | Footer chevron buttons | Reuse existing primitives (ponytail rung 2) |
| react-day-picker | ^9.14.0 (installed) | Calendar popover with `timeZone="Asia/Kolkata"` prop | D-10 month-view surfaces; prop exists in the pinned version [VERIFIED: daypicker.dev v9 docs] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Intl IST utils | `@date-fns/tz` (`TZDate`) or `date-fns-tz` | New dependency for capability the platform already has; only worth it if many date-fns-format-in-zone call sites appear later |
| FullCalendar wall-clock feeding (no plugin) | `@fullcalendar/moment-timezone` plugin | Extra dep + moment runtime; UTC-coercion documented behavior covers fixed-IST display without it |
| Module-level boolean toast guard | sonner `toast.error(msg, { id })` | `id` replaces content rather than suppressing repeats across concurrent failures; explicit once-guard in `lib/session.ts` is deterministic (either acceptable — discretion area) |
| `window.location.assign()` redirect | Next.js router singleton injection | Router outside components requires custom context/hack; hard navigation also guarantees fresh React tree + empty cache state, matching "exactly once" cleanly |

**Installation:**
```bash
# No installs required — everything needed is already in dependencies (verified package.json:13-50)
```

## Package Legitimacy Audit

> No external packages are introduced by this phase. All capabilities come from: platform natives (Intl, Date, URLSearchParams), already-installed dependencies (@tanstack/react-query ^5.94.5, zod ^4.3.6, date-fns ^4.1.0, react-day-picker ^9.14.0, sonner ^2.0.7, lucide-react), and Phase 1 dev tooling (vitest, @testing-library/react, msw).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none — no new installs) | — | — | — | — | — | — |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
**Deliberately avoided:** `jest-location-mock`, `vitest-location-mock` (test-location mocking packages) — jsdom's built-in stubbing patterns (`vi.stubGlobal("location", …)`) cover the need without a dependency; `@fullcalendar/moment-timezone` — avoidable via wall-clock digit convention (below).

## Architecture Patterns

### System Architecture Diagram

```
                        ┌──────────────────────────────┐
                        │   Backend (../saher-backend) │
                        │  401s · refresh clears all   │
                        │  3 cookies on failure        │
                        │  envelope {success,message,  │
                        │  data?,meta?}                │
                        └──────────▲─────────┬─────────┘
                                   │         │
                     fetch (credentials:include)
                                   │         │
┌──────────────────────────────────┼─────────▼──────────────────────────┐
│ Browser (Next.js client)         │                                    │
│                                  │                                    │
│  features/*.tsx ──► hooks/use-* ──► services/*.api.ts ──► apiFetch ───┘
│       ▲                  │                    │              │
│       │                  │ query cache        │ res          │ 401-after-refresh?
│       │                  ▼                    ▼              ▼
│  ┌──────────┐   ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐
│  │ can()    │   │ TanStack Query   │  │ normalizeList│  │ lib/        │
│  │ (perms)  │   │ QueryClient      │  │ (lib/) items │  │ session.ts  │
│  └────┬─────┘   │ provider.tsx     │  └──────┬───────┘  │  ·dedupe    │
│       │         │  QueryCache.onError ──────┼──────────►  ·clear()+   │
│       │         └──────────────────┘        │           │   cancel()  │
│       ▼                                     ▼           │  ·1× toast  │
│  RoleGuard / nav-list / row buttons   pagination-footer│  ·redirect  │
│  (gating consumers)                   (disabled-safe)  └──────┬──────┘
│                                                               │
│   lib/date.ts ◄── every date display/input boundary           ▼
│   (Intl IST format/parse)                        window.location → /login?next=…
└──────────────────────────────────────────────────────────────────────────────┘
```

Trace of the primary failure case (success criterion #3): any number of concurrent queries hit 401 → single-flight refresh runs exactly once → refresh fails → each apiFetch throws but calls `session.handleSessionDeath()` → once-guard lets exactly ONE toast fire and ONE redirect schedule → `cancelQueries()` + `clear()` wipe cache → hard navigation to `/login?next=<path>` drops the whole React tree → re-login reads `next` and returns the user.

### Recommended Project Structure
```
lib/
├── date.ts                 # NEW — replaces lib/utils/time.ts outright (D-18); Intl-based
├── normalize-list.ts       # NEW — pure factory (D-16): ApiResponse<T[]> → NormalizedList<T>
├── normalize-list.test.ts
├── permissions.ts          # NEW — ROLE_PERMISSIONS mirror + can(action, resource) (D-13)
├── permissions.test.ts
├── session.ts              # NEW — handleSessionDeath() / performLogoutCleanup() (D-17)
├── session.test.ts
└── api-wrapper.ts          # MODIFIED — refresh-failure branch delegates to lib/session.ts
components/
└── pagination-footer.tsx   # NEW — D-20 safe footer (name at planner discretion)
tests/
├── setup.ts                # EXISTS — add window.location stub here if session tests need it globally
└── render-with-providers.tsx  # EXISTS — reused for footer/gating render tests (D-03)
```

### Pattern 1: Fixed-offset IST formatting (no tz library)
**What:** Convert any ISO instant to IST wall-clock text using Intl's zone support; convert IST wall-clock input back to UTC ISO.
**When to use:** Every display and form-input boundary (D-09/D-10).
**Example:**
```typescript
// lib/date.ts — core mechanics (naming/signatures at planner discretion)
const IST_ZONE = "Asia/Kolkata"; // ≡ fixed +05:30, no DST since 1945 [ASSUMED: common-knowledge fact]

export const formatIstDateTime = (iso?: string | null | Date): string => {
  if (!iso) return "--";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "--";
  // en-IN gives "24 Aug 2026" parts; formatToParts assembles exact D-09 shape
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_ZONE,
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(d);
};

// datetime-local value ("2026-08-24T09:00") IS an IST wall clock by convention:
export const istInputToIso = (inputValue: string): string =>
  new Date(`${inputValue}:00+05:30`).toISOString();      // → UTC Z string for API

// ISO from API → datetime-local value:
export const isoToIstInput = (iso: string): string => {
  const p = new Intl.DateTimeFormat("en-CA", {           // en-CA = ISO-like ordering
    timeZone: IST_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};
```

### Pattern 2: List normalization factory (D-16)
**What:** One pure function absorbing every observed meta variance.
**When to use:** Every service returning a list, immediately after `apiFetch`.
**Verified backend variance it must absorb:**
| Endpoint behavior | Evidence |
|---|---|
| `total: Math.ceil(count/limit)` (page count under name `total`) | attendance retrieve/correction/today controllers [VERIFIED: ../saher-backend/src] |
| `totalPages: Math.ceil(count/limit)` | payroll, reimbursement controllers [VERIFIED: ibid.] |
| `count` = record count, always present in paging metas | ibid. |
| Empty result emits `totalPages: 0` | today.controller.ts:60 |
| Meta entirely absent (bare array payload) | admin/user/controller.ts getAllUsersController |
| Meta with ONLY `count` (non-paging meta: unread badge) | notification.controllers.ts:138 |
| `data` nullable (`data: data ?? null`) | libs/class/api-response.ts |

```typescript
// Source: shapes verified in ../saher-backend/src (table above)
export type NormalizedList<T> = {
  items: T[];
  page: number;          // 1-based; 1 when un-paged
  limit: number;
  totalPages: number;    // 1 minimum for non-empty un-paged lists; 0 allowed for empty pages meta
  totalRecords: number;  // from `count`
};

export function normalizeList<T>(res: { data?: T[] | null; meta?: unknown }): NormalizedList<T> {
  const items = Array.isArray(res.data) ? res.data : [];
  const m = (typeof res.meta === "object" && res.meta !== null ? res.meta : {}) as Record<string, unknown>;
  const num = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fb);
  const totalRecords = num(m.count, items.length);
  // total AND totalPages both carry page counts in this backend — treat identically:
  const rawPages = num(m.totalPages, num(m.total, NaN));
  const totalPages = Number.isFinite(rawPages) ? rawPages : items.length > 0 ? 1 : 0;
  return { items, page: Math.max(1, num(m.page, 1)), limit: num(m.limit, items.length || 10), totalPages, totalRecords };
}
```

### Pattern 3: Central session-death module wired twice (D-17)
**What:** One `handleSessionDeath()` owning dedupe + clear + redirect; called from `apiFetch`'s refresh-failure branch and from logout cleanup.
**When to use:** FNDT-04/D-05..D-08 implementation.
**Example:**
```typescript
// lib/session.ts (sketch)
let died = false; // once-guard: one toast, one redirect per dead session

export function resetSessionGuard() { died = false; } // call after successful login

export async function handleSessionDeath(queryClient: QueryClient) {
  if (died) return;
  died = true;
  await queryClient.cancelQueries();     // stop in-flight refetches into dead session (D-07)
  queryClient.clear();                   // wipes query + mutation caches [VERIFIED: Context7]
  toast.error("Session expired");        // fires exactly once (D-06)
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`); // hard nav = fresh tree, empty cache (D-05)
}
```
```tsx
// app/provider.tsx — belt-and-suspenders: even errors escaping apiFetch funnel here
new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: { /* unchanged */ },
});
// handleError: if err.message === "Unauthorized" (apiFetch's sentinel throw) → handleSessionDeath(queryClient)
```
Note: `QueryCache.onError` fires for EVERY query error and rethrows downstream [VERIFIED: Context7 query-core source]; the handler must filter on the specific sentinel (`Unauthorized`) rather than treating all errors as session death. Mutations currently bypass apiFetch's 401-retry in some hooks — decide whether logout cleanup triggers from the sentinel alone (recommended).

### Pattern 4: Feeding clocks IST digits (D-12)
**What:** FullCalendar (named zone, no plugin) renders "the literal digits given": it strips offsets and displays wall-clock digits via UTC getters. So hand it IST wall-clock strings produced by `lib/date.ts`; read `arg.date` back through the same utils.
**When to use:** calendar feature retrofit.
```tsx
// Source: https://fullcalendar.io/docs/timeZone (UTC-coercion section, verified via Context7)
<FullCalendar
  timeZone="Asia/Kolkata"                                  // replace current timeZone="local"
  events={events.map((e) => ({ ...e, start: isoToIstWallClock(e.start) }))} // digits preserved
/>
```
react-day-picker (shadcn Calendar popover) simply takes `timeZone="Asia/Kolkata"` in the installed v9.14 [VERIFIED: daypicker.dev].

### Pattern 5: Redirect testing in jsdom (AUTH-01/D-19 support)
```typescript
// In session tests (or tests/setup.ts if global):
beforeEach(() => {
  vi.stubGlobal("location", { ...window.location, assign: vi.fn(), pathname: "/attendance", search: "?page=2" });
});
afterEach(() => vi.unstubAllGlobals());
// Then assert: expect(location.assign).toHaveBeenCalledWith("/login?next=%2Fattendance%3Fpage%3D2")
```
[VERIFIED: vitest discussion #2213 + community docs — `vi.stubGlobal('location', …)` / `vi.spyOn(window,'location','get')` are the supported jsdom patterns; newer jsdom makes Location unforgeable via defineProperty on the instance]

### Anti-Patterns to Avoid
- **Interpreting `meta.total` as record count:** every current consumer that does (`attendance-dashboard.tsx:181`) is computing wrong page math today; the normalizer kills this class of bug — do not preserve old interpretations during retrofit.
- **Assuming role hierarchy in the matrix:** admin/manager/user/intern sets overlap irregularly (verified counterexamples above). Mirror the sets; don't derive.
- **Refreshing inside the death path:** after refresh fails once, calling `/auth/refresh-token` again just burns a round trip; backend has already cleared cookies. Death path goes straight to clear+redirect.
- **`router.push("/login")` from lib code:** needs component context; hard `location.assign` is simpler and guarantees the "exactly once, clean tree" semantics.
- **Client-side `can()` treated as security:** it gates pixels, not access. Never hide a flow whose endpoint the user could hit anyway without noting server enforcement is the real boundary.
- **`new Date("2026-08-24")` for date-only inputs:** parses as UTC midnight → renders previous day in negative-offset browsers. Route date-only values through utils (parse as `T00:00:00+05:30` or keep as string until submit).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone-correct formatting | Manual offset arithmetic + `toLocaleString` chains (current `lib/utils/time.ts`) | `Intl.DateTimeFormat` with `timeZone` | Locale part-ordering, padding, AM/PM handled by platform; browser-TZ-independent by construction |
| Cache invalidation semantics | Manual key enumeration + `removeQueries` loops (current `use-logout.ts:16`) | `queryClient.cancelQueries()` + `queryClient.clear()` | Clear() atomically wipes query AND mutation caches [VERIFIED: Context7 query-client source]; manual sweeps miss keys |
| Concurrent-error dedupe | Per-hook flags, toast counters in components | Once-guard in one module (Pattern 3) | Single choke point; component-level dedupe cannot see sibling failures |
| Page-count math | Each screen computing `Math.ceil(total/limit)` with guessed field semantics | `normalizeList` output consumed directly | Field-name/semantics drift is exactly the bug being eliminated (FNDT-03) |
| Permission vocabulary | Ad-hoc `role === "manager"` strings scattered in JSX (nav-list.tsx:158,180) | `can()` over mirrored matrix | Single place to update when backend guards change; testable |

**Key insight:** Every one of these was already "handled" somewhere in the codebase — incorrectly and inconsistently. The value of this phase is collapsing N divergent implementations into one tested one, not inventing new machinery.

## Runtime State Inventory

> Included because D-18 makes this a replacement/refactor phase (delete `lib/utils/time.ts`, sweep importers). Categories audited 2026-08-24:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — frontend repo holds no datastore; backend owns all persistence and is out of scope | None |
| Live service config | None — no external service dashboards/config reference frontend internals | None |
| OS-registered state | None — no scheduled tasks/pm2/launchd entries for this repo | None |
| Secrets/env vars | None touched — only env var is `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (push, unrelated) | None |
| Build artifacts | None — `lib/utils/time.ts` is plain TS compiled per-build; deleting it + updating importers leaves no stale artifact (`.next/` rebuilds on `pnpm build`; tests run from source) | Run `pnpm build` after deletion to confirm |

## Common Pitfalls

### Pitfall 1: Toast storm / redirect loop on session death
**What goes wrong:** N concurrent failing queries each fire "Session expired" and each attempt redirect; or cleared-but-mounted queries refetch, 401 again, loop.
**Why it happens:** `QueryCache.onError` fires per errored query; `invalidateQueries`/mounted observers retry independently.
**How to avoid:** Once-guard in `lib/session.ts` (module-level, set-before-work); `cancelQueries()` BEFORE `clear()`; hard navigation unmounts everything. Reset guard on successful login (`useLogin.onSuccess`) so the next session death still notifies.
**Warning signs:** Multiple toasts in test; `assign` called >1 time in D-19 tests.

### Pitfall 2: proxy.ts bouncing the post-logout redirect
**What goes wrong:** Logout POST fails at network level (D-08 path) → cookies still present → redirect to `/login` hits proxy rule `(access || refresh) && isPublicRoute → "/"` → user lands home, seemingly "not logged out".
**Why it happens:** proxy checks cookie *presence*; JS cannot clear httpOnly cookies.
**How to avoid:** Acceptable degradation — landing on `/` still shows logged-out UI once requests 401 → death path fires (cookies now cleared by failed-refresh response). Alternatively redirect best-effort-logout to `/` instead of `/login`. Decide explicitly; document in plan (discretion area explicitly includes next/proxy interplay).
**Warning signs:** E2E/manual: logout with devtools offline toggle lands back on dashboard shell.

### Pitfall 3: `next=` open-redirect
**What goes wrong:** `/login?next=https://evil.example` redirects off-site after re-login.
**How to avoid:** Validate `next` starts with `"/"` and not `"//"` before using; default to `"/"`.
**Warning signs:** Security review of login-form changes.

### Pitfall 4: Day-boundary off-by-one in IST conversion
**What goes wrong:** `2026-08-24T18:30:00Z` must render as `25 Aug 2026, 12:00 am` IST; naive `getHours()`-based code (current `transformTime`) renders browser-local time — wrong for any non-IST device.
**How to avoid:** All conversions through Intl with explicit zone; unit-test the canonical boundary pairs (see Validation Architecture).
**Warning signs:** Tests pass only when machine TZ = Asia/Kolkata. Pin `process.env.TZ` in test config or rely on zone-explicit code paths (utils as designed are TZ-independent).

### Pitfall 5: TanStack Table `pageCount: undefined` regression during swap
**What goes wrong:** `corrections/data-table.tsx:77` feeds `pageCount: corrections?.meta?.total` — during migration to normalized shape, a missing field silently disables next-page logic or throws on `pageIndex >= pageCount` math.
**How to avoid:** Feed tables `normalized.totalPages` (number, defaulted); keep `manualPagination: true`.
**Warning signs:** Typecheck error on pageCount union, or table showing page 1 of NaN.

### Pitfall 6: Sidebar manager-section bug masked instead of fixed
**What goes wrong:** `nav-list.tsx:158` — `user?.role === "manager" || (user?.role === "admin" && (<JSX/>))` evaluates JSX only for admins; managers currently get NO manager nav. Retrofitting onto `can("read","user")` etc. fixes this naturally — but a mechanical sweep that preserves boolean structure would preserve the bug.
**How to avoid:** Rewrite conditions as `managerRoutes.some(...) && can(...)` style predicates; add a render test asserting manager sees Dashboard/Users.
**Warning signs:** Render test with mocked `useMe` role="manager".

### Pitfall 7: Refresh endpoint returns success-shape user data — don't conflate with /me
**What goes wrong:** `POST /refresh-token` success returns `{ data: result.user }` (same envelope). Code assuming only /me carries user might mis-wire cache seeding or tests.
**How to avoid:** Keep refresh as opaque ok/not-ok in apiFetch (current behavior); don't seed `["user","me"]` from refresh responses without schema validation.
**Warning signs:** Stale role after role change; test asserting envelope of refresh.

## Code Examples

### Login `?next=` consumption (D-05 back half)
```tsx
// features/login/components/login-form.tsx (onLoginSubmit onSuccess)
import { useSearchParams } from "next/navigation";
const params = useSearchParams();
const raw = params.get("next") ?? "/";
const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/"; // anti-open-redirect
router.push(next);
```

### Best-effort logout (D-08)
```typescript
// hooks/use-logout.ts — rewrite sketch
mutationFn: async () => {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); }
  catch { /* best-effort: fall through (D-08) */ }
},
onSuccess: () => performLogoutCleanup(queryClient), // cancel + clear + redirect (shared with session death)
```

### Footer consuming normalized list (D-20)
```tsx
<PaginationFooter
  page={list.page}
  totalPages={list.totalPages}   // number always — 0/NaN-safe defaults from normalizeList
  onPageChange={(p) => setPage(p)}
/>                                 // internal: disabled={page<=1||!Number.isFinite(totalPages)||totalPages<1} etc.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `date-fns-tz` for any zoned formatting | Native `Intl.DateTimeFormat(timeZone)`; `@date-fns/tz` only for heavy zoned math | Ongoing (Intl universal since ~2017; date-fns v3+ leans on it) | Zero-dep IST utilities viable [CITED: date-fns/tz README positions itself for tz-class needs] |
| react-day-picker "no tz support" | `timeZone` prop + exported `TZDate` (v9.1+) | Nov 2024 | Installed 9.14 already satisfies D-12 for pickers [VERIFIED: changelog + docs] |
| v4 `onError` per-useQuery options | Global `QueryCache({ onError })` / `MutationCache({ onError })` | v5 GA Oct 2024 | Correct hook point for central session-death [VERIFIED: tanstack.com QueryCache reference] |

**Deprecated/outdated:**
- `lib/utils/time.ts` `toLocaleDateString("en-IN")` family — browser-TZ dependent, replaced wholesale (D-18).
- `proxy.ts`-era `middleware.ts` naming — N/A here (repo already on Next 16 `proxy.ts`); no action.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GET /api/auth/me` returns `role` spelled exactly `intern`/`user`/`manager`/`admin` (inferred from model + controller returning raw user doc; D-15 mandates live confirmation) | Standard Stack / RBAC | Matrix keys mismatched → all gating fails closed/open; caught instantly by D-15 probe |
| A2 | India has no DST; `Asia/Kolkata` ≡ `+05:30` for all relevant dates | Pattern 1 | None realistic; historical second-offset dates irrelevant to org data |
| A3 | Hard `window.location.assign` is acceptable (vs SPA nav) for death/logout redirects — full reload cost accepted for guaranteed clean state | Pattern 3 | Slightly slower transition; no functional risk |
| A4 | `vi.stubGlobal("location", …)` works under installed vitest/jsdom versions for redirect assertions | Pattern 5 | Test friction only; fallback patterns documented (spyOn getter / descriptors clone) |
| A5 | Every backend paginated endpoint emits page-count semantics under `total`/`totalPages` (verified in ALL endpoints found by grep today; future endpoints could differ) | Pattern 2 | Normalizer mislabels counts; mitigated because normalizer derives from `count` and both fields are read as pages uniformly |
| A6 | "Invalid Session." sentinel (CONTEXT wording) matches backend string `Invalid Session` (no trailing period, `protected-route.ts:13,31`) — frontend never string-matches it anyway (behavior keyed on 401 status + failed refresh) | AUTH-01 | None — frontend keys on HTTP status, not message text; noted for doc accuracy |

## Open Questions

1. **Live probe logistics for D-15**
   - What we know: Roles verified statically (`intern`,`user`,`manager`,`admin`). No backend running locally right now (ports 3000/4000 checked — down); backend default port 4000, started via its own dev command; production instance reachable only behind deployment.
   - What's unclear: Whether the executor will run `../saher-backend` locally or probe the deployed origin for the ONE `/api/auth/me` call.
   - Recommendation: Plan a checkpoint task "start backend locally (port 4000), curl /api/auth/me with seeded credentials, assert role strings vs matrix" — static evidence means even skipping the probe degrades gracefully.

2. **Should mutations route through the death handler too?**
   - What we know: `MutationCache.onError` verified; some mutations call `apiFetch` (which throws `Unauthorized` sentinel on death) but others may swallow differently.
   - What's unclear: Whether any mutation paths bypass `apiFetch` (grep says no bare-fetch API calls exist; INTEGRATIONS confirms single funnel).
   - Recommendation: Wire both caches to the same sentinel filter; covered by D-19 tests.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | all builds/tests | ✓ | 24.19.0 | — |
| pnpm | package ops | ✓ | 11.22.0 | — |
| vitest/@testing-library/msw | FNDT-02..06, AUTH-01 tests | ✓ | installed Phase 1 | — |
| Backend running locally (port 4000) | D-15 live probe only | ✗ (checked — not running) | — | Start via ../saher-backend dev command; or rely on static verification (A1) |
| Deployed frontend/backend pair | none in-phase | n/a | — | — |

**Missing dependencies with no fallback:** none blocking — the probe has a documented fallback (static role verification already complete).
**Missing dependencies with fallback:** local backend instance (fallback above).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom) + @testing-library/react + msw (Phase 1 install) |
| Config file | `vitest.config.ts` (exists; `@` alias via `import.meta.dirname`) |
| Quick run command | `pnpm test lib/normalize-list.test.ts` (script `test: vitest run`, path acts as filter) |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FNDT-02 | Day-boundary pairs: `2026-08-24T18:29:00Z`→`24 Aug 2026`; `2026-08-24T18:30:00Z`→`25 Aug 2026`; midnight IST; null/invalid → `--`; round-trip input↔ISO | unit | `pnpm test lib/date.test.ts` | ❌ created with module (co-location D-07) |
| FNDT-03 | meta variants: `total`(page-count) / `totalPages` / absent meta / `totalPages:0` / meta-with-only-count / null data / malformed numbers | unit | `pnpm test lib/normalize-list.test.ts` | ❌ created with module |
| FNDT-04 | Death path: cancel+clear called, exactly 1 toast, 1 redirect with encoded `next`; guard resets after login | integration (msw→real wrapper→fake QueryClient) | `pnpm test lib/session.test.ts` | ❌ created with module |
| FNDT-05 | Footer: missing/NaN/0 meta → rendered, disabled, no crash; boundary enable/disable | render | `pnpm test components/pagination-footer.test.tsx` | ❌ created with component |
| FNDT-06 | `can()` truth-table vs mirrored matrix incl. verified quirks (admin no bank-write; user notice-write; intern read-event only); manager-nav render test | unit + render | `pnpm test lib/permissions.test.ts` | ❌ created with module |
| AUTH-01 | Concurrent 401s → exactly ONE `/refresh-token` call; originals retried once each; refresh failure → death contract (extends `lib/api-wrapper.test.ts` pattern) | integration | `pnpm test lib/api-wrapper.test.ts` | ✅ extends existing file |
| D-03 spot-checks | Attendance time cell renders IST string regardless of TZ | render | `pnpm test features/attendance` | ❌ optional per D-03 default |

### Sampling Rate
- **Per task commit:** `pnpm lint && pnpm test <touched-file>.test.*`
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm test`
- **Phase gate:** full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- None — framework/config/helpers all exist (Phase 1). New test files arrive co-located with their modules per established convention (not Wave 0 blockers).
- Optional: add global `window.location` stub to `tests/setup.ts` only if multiple suites need it.

*(If no gaps: existing infrastructure covers tooling; content gaps listed above are per-task deliverables.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes (indirect) | Backend-owned cookie sessions; frontend never touches tokens; refresh single-flight already in apiFetch |
| V3 Session Management | yes | Central death handler: clear-on-death/logout prevents cross-session cache bleed (D-07); cookies remain httpOnly, untouched by JS |
| V4 Access Control | yes | `can()` mirrors server `authorize()` for UX only; real enforcement server-side (verify note below); RoleGuard remains convenience layer |
| V5 Input Validation | yes | Zod schemas at service boundaries; normalizer defensively coerces meta; `next` param validated (open-redirect guard) |
| V6 Cryptography | no | No crypto in scope |
| V7 Error Handling/Logging | yes | Errors via `logError`/toasts; death handler logs once; no console.log (lint-enforced) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via `?next=` | Tampering/Elevation | Validate `next` startsWith `"/"` and not `"//"`; whitelist-default `/` |
| Cross-session data leakage via cached queries after logout/login-as-other | Information Disclosure | `queryClient.clear()` (not just invalidate) on BOTH death and logout (D-07); login also clears (currently only invalidates — tighten) |
| Client-side gating treated as authorization | Elevation of Privilege | Document `can()` as UX-only; server `authorize()` is the boundary (backend verified to guard routes) |
| Expired-cookie purgatory (access dead, refresh alive) | DoS (UX) | Existing single-flight refresh handles; death path only after refresh failure — no infinite loop possible (`_retried` flag) |
| Push/service-worker vectors | — | Out of phase scope (existing `sw.js` concern already logged in CONCERNS.md) |

## Sources

### Primary (HIGH confidence)
- `../saher-backend/src` — auth.routes.ts, protected-route.ts, refresh/logout/me controllers, permission/{permission,role-permission}.ts, database/user.model.ts, api-response.ts, all paginated controllers (grep-audited) — **direct source read, ground truth for contract check**
- Frontend source — lib/api-wrapper.ts(+test), lib/utils/time.ts, proxy.ts, app/provider.tsx, components/role-guard.tsx, components/sidebar/nav-list.tsx, hooks/use-{login,logout,me}.ts, services/attendance.api.ts, features consumers, tests/, vitest.config.ts, package.json — direct read
- Context7 `/tanstack/query` — queryClient.clear()/cancelQueries()/QueryCache.onError semantics (docs + query-core source snippets)
- https://tanstack.com/query/latest/docs/framework/react/reference/QueryCache — onError signature
- https://fullcalendar.io/docs/timeZone (via Context7 /fullcalendar/fullcalendar-docs) — UTC-coercion behavior for named zones without plugin
- https://daypicker.dev/v9/localization/setting-time-zone + v9 changelog — `timeZone` prop + `TZDate` in installed 9.14

### Secondary (MEDIUM confidence)
- Vitest discussions #2213/#10622 + benmvp.com + jest-location-mock README — jsdom location-mocking patterns cross-agreed across 4 sources

### Tertiary (LOW confidence)
- None material remaining (A1/A2/A4 assumptions logged above)

## Metadata

**Confidence breakdown:**
- Backend contract (roles, meta semantics, auth flows): **HIGH** — read directly from canonical source files, multiple cross-confirming controllers
- Library APIs (Query v5, FullCalendar, day-picker): **HIGH** — Context7/official docs, version-pinned matches
- Architecture/patterns: **HIGH** — follows existing layered conventions; placement fixed by D-16..D-18
- Test approach details (jsdom location stubbing): **MEDIUM** — community-verified patterns, minor version-drift risk with fallbacks documented

**Research date:** 2026-08-24
**Valid until:** 2026-09-23 (stable domain; backend source is canonical and deployed)
