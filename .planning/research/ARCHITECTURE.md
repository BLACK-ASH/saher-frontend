# Architecture Research

**Domain:** Org-management frontend completion — 7+ list+lifecycle feature slices integrating into an established Next.js App Router feature-slice architecture
**Researched:** 2026-08-24
**Confidence:** HIGH (codebase-anchored; every claim verified against source or the backend's binding contract docs)

## Standard Architecture

This is NOT a greenfield architecture decision. The architecture exists, works, and has a strictly downward import graph (`app → features → hooks → services → lib`). The research question is: what minimal shared infrastructure must land first so seven new domains slot in identically, without either copy-paste drift or a premature generic CRUD framework.

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      Route Shell (app/) — thin, unchanged                 │
│   app/(main)/{reimbursement,leave,mail,notice}/…      ← staff pages       │
│   app/(main)/(admin)/{payroll,bills,bank,accounts,events}/…               │
│   Every page = RoleGuard wiring + one feature component. No logic.        │
├──────────────────────────────────────────────────────────────────────────┤
│   Guards: proxy.ts (cookie presence) · RoleGuard (role array check)       │
│   NEW: pass ["admin","manager"] where backend authorizes managers         │
├──────────────────────────────────────────────────────────────────────────┤
│                      Feature Slices (features/<domain>/)                  │
│   <domain>-view.tsx + forms + column defs — one folder per domain         │
│   Shared leaves promoted here ONLY on second concrete use:                │
│   trash-tabs, pagination footer guard, status badge, restore button       │
├──────────────────────────────────────────────────────────────────────────┤
│                      Data Hooks (hooks/use-<domain>.ts)                   │
│   TanStack Query v5. queryKey grammar: [domain, scope, …params]           │
│   Mutations invalidate at [domain] prefix                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                      Service Layer (services/<domain>.api.ts)             │
│   One fn per endpoint · zod schema beside it                              │
│   ┌──────────────────────────────────────────────────────┐   ★ NEW       │
│   │ lib/api-list.ts — envelope normalization factory     │               │
│   │ zod-parses data, normalizes meta total|totalPages    │               │
│   └──────────────────────────────────────────────────────┘               │
├──────────────────────────────────────────────────────────────────────────┤
│   lib/api-wrapper.ts (apiFetch: envelope, toasts, 401 refresh×1)          │
│   lib/utils/time.ts ★ EXTEND: IST-aware formatters + offset builders      │
│   Session death ★ NEW: apiFetch throws "Unauthorized" sentinel            │
│   → provider QueryCache.onError → cache.clear() + redirect /login         │
└───────────────────────────────────────┬──────────────────────────────────┘
                                        ▼
              SAHER Backend (/api, cookie-session, {success,message,data,meta})
```

★ = new shared infrastructure this milestone adds. Everything else exists today.

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `app/(main)/<domain>/page.tsx` | URL + guard wiring only | ~10 lines rendering one feature component |
| `app/(main)/(admin)/<domain>/page.tsx` | Same, inside `(admin)` layout RoleGuard | Existing layout wraps children automatically |
| `features/<domain>/<domain>-view.tsx` | Screen composition: filters, tabs, tables, dialogs | react-hook-form + zod forms, TanStack Table lists |
| `hooks/use-<domain>.ts` | All queries/mutations/cache invalidation for the domain | Flat return bag `{ list, create, update, … }` per existing convention |
| `services/<domain>.api.ts` | Endpoint functions + zod schemas; zero React imports | Calls `apiFetch` via the list factory |
| `lib/api-list.ts` (NEW) | Turns `{ success, message, data, meta }` into validated `{ items, page }` with normalized pagination | ~30 lines, used by every paginated service fn |
| `lib/utils/time.ts` (EXTEND) | IST display formatting + `+05:30` offset ISO building + datetime-local input conversion | Native `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"` |
| `lib/api-wrapper.ts` (MINOR EDIT) | Keeps throwing `"Unauthorized"` after failed refresh — becomes the session-death sentinel | No behavior change, only contract documentation |
| Provider `QueryCache.onError` (NEW) | Single central reaction to session death: clear cache, cancel queries, hard-redirect `/login` | Idempotent (guard against N parallel queries firing) |
| Trash UX components (promoted) | Active/trash tab switcher bound to `isDeleted` param + Restore mutation button | Extracted after the pilot domain proves them |

## Recommended Project Structure

Per-domain slice layout — identical shape for all seven modules:

```text
features/reimbursement/            # example slice (largest domain)
├── reimbursement-view.tsx         # staff view: my bills, balance enquiry, create bill
├── bill-form.tsx                  # react-hook-form + zod, image receipts via components/image-upload.tsx
├── columns.tsx                    # TanStack Table column definitions
└── admin/                         # admin-only sub-slices live INSIDE the domain folder
    ├── bills-review.tsx           # handle: approve/reject/hold
    ├── settlement.tsx             # settle flow
    └── recycle-bin.tsx            # isDeleted=true listing + restore

hooks/use-reimbursement.ts         # queries: mybills, balance, search, recycle · mutations: create/update/delete/handle/settle
services/reimbursement.api.ts      # schemas + endpoint fns over lib/api-list.ts + apiFetch

app/(main)/reimbursement/page.tsx            # staff routes
app/(main)/(admin)/reimbursement/*/page.tsx  # admin routes inherit RoleGuard
```

Same skeleton repeated for: `leave` (+`types-admin/`), `payroll`, `mail` (`inbox`/`outbox` are scopes, not folders), `notice`, `bank`+`accounts` (one `admin-bank-accounts` slice is fine — they share `/api/admin` prefix and admin-only audience), `events` (nested: `programs/ workshops/ sessions/ participants/` sub-folders).

### Structure Rationale

- **Domain folder owns its admin UI** (`features/x/admin/`): the route groups already gate access; splitting admin UI into a separate top-level feature folder would orphan it from its schemas/columns. Backend confirms this split is by audience, not resource — reimbursement staff and admin endpoints share one resource.
- **Scopes in query keys, not folders:** mail inbox/outbox, bills mine/recycle/search are the same resource at different query scopes — `["mail","inbox"]` vs `["mail","outbox"]`. Folder-per-scope would explode.
- **No barrels, no index.ts** — matches existing convention (direct imports everywhere).

## Architectural Patterns

### Pattern 1: The Slice Contract (consistency without abstraction)

**What:** A written convention every domain follows — file names, query-key grammar, mutation-invalidation rule, error handling. Conventions scale across 7 domains; a generic `CrudModule<T>` engine does not.

**Why not a CRUD framework:** The domains differ structurally where it matters — reimbursement has a three-stage lifecycle with a separate settlement sub-resource and dual staff/admin schemas; events is a four-level nested hierarchy (program→workshop→session→participant); mail has two read scopes and no edit; notice is flat CRUD with expiry. Any generic engine covering these becomes configuration soup with escape hatches everywhere — more code than seven hand-written slices.

**The contract (each line verifiable in existing code):**

```text
1. Page renders ONE feature component. Zero data logic in app/.
2. All server reads/writes via hooks/use-<domain>.ts — never inline apiFetch in
   features/pages (this is also the #1 audit finding to fix in old modules).
3. queryKey = [domain, scope?, ...params]:
     ["mail", "inbox", page]            ["bills", "recycle"]
     ["leave", "applications", "me"]    ["events", "sessions", workshopId]
4. Mutations invalidate the domain prefix: invalidateQueries({ queryKey: ["bills" ] })
5. Service fns return parsed res.data (single) or { items, page } (list) from the factory.
6. Forms: zodResolver + Controller + FieldError, submit handler named on<Noun>Submit.
7. Errors: apiFetch toasts at the boundary; components add onError only for side
   effects (form state reset, dialog close) — never a second toast.
8. Trash = scope "recycle"/query param isDeleted:true + PATCH restore/{id} mutation.
```

**Trade-offs:** Requires discipline (no compiler-enforced). Mitigated by the pilot domain serving as the living reference implementation and by tests on the factory/hooks.

**Example — the entire hook layer for mail (shows how little ceremony the contract needs):**

```typescript
// hooks/use-mail.ts
export const useMail = ({ box = "inbox", page = 1 }: UseMailProps = {}) => {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["mail", box, page],
    queryFn: () => getMail({ box, page }),        // services/mail.api.ts
  });
  const send = useMutation({
    mutationFn: sendMailApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mail"] }),
  });
  return { list, send };
};
```

### Pattern 2: Envelope Normalization Factory (`lib/api-list.ts`)

**What:** One function that every paginated/list endpoint goes through. Solves three real, documented problems in one place:
1. **Meta inconsistency** — handbook §3: events paginate with `total`, reimbursement with `totalPages`. Both mean "page count". Normalize once.
2. **Schemas declared but dead** — `services/attendance.api.ts` exports `attendanceSchema` yet `getAttendanceStatus()` returns `res.data` unparsed. Types lie at runtime. The factory makes `.parse()` load-bearing.
3. **Boilerplate** — 7 domains × ~4 list endpoints × unwrap-and-validate lines each.

**When to use:** every list GET returning `data: T[]` + optional `meta`. Single-object endpoints keep calling `apiFetch` directly — don't force them through.

**Example:**

```typescript
// lib/api-list.ts
import { apiFetch, type MetaResponse } from "@/lib/api-wrapper";
import type { z } from "zod";

export type PageMeta = { page: number; limit: number; count: number; pageCount: number };

export async function fetchList<T extends z.ZodType>(
  schema: T,
  url: string,
): Promise<{ items: z.infer<T>[]; page?: PageMeta }> {
  const res = await apiFetch<z.infer<T>[]>(url);
  // ponytail: trusts meta shape; if a third pagination spelling appears, widen here only
  const page: PageMeta | undefined = res.meta && {
    page: res.meta.page,
    limit: res.meta.limit,
    count: res.meta.count,
    pageCount: ("totalPages" in res.meta ? res.meta.totalPages : res.meta.total) ?? 0,
  };
  return { items: res.data?.map((d) => schema.parse(d)) ?? [], page };
}
```

**Trade-offs:** A parse failure now throws instead of rendering garbage — desirable (fail fast at integration time, during the audit especially), but schemas must be written tolerantly (`nullable()`/`optional()` where the OpenAPI allows null; handbook says `data` can be `null`).

### Pattern 3: Session-Death Central Handler

**What happens today:** `apiFetch` refreshes once on 401; if refresh fails it toasts "Session expired", throws `Error("Unauthorized")` — and then nothing. The user sits on a dead page; every parallel in-flight query independently retries and re-toasts; `use-me`'s `retry: 3` multiplies refresh noise (documented in CONCERNS.md).

**Fix — one choke point, no library:** the provider already owns the QueryClient. Add a `QueryCache`/`MutationCache` `onError` that reacts only to the sentinel:

```typescript
// app/provider.tsx
let sessionDead = false;
new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error.message !== "Unauthorized" || sessionDead) return;
      sessionDead = true;
      queryClient.clear();                       // drop cached private data
      window.location.href = "/login";           // full reload resets sessionDead too
    },
  }),
  …
});
```

Hard navigation (`window.location`) beats `router.push` here deliberately: it also kills in-flight mutations, timers, and the push-subscription state, and resets the module-level `sessionDead` flag for free. `retry` noise disappears because nothing retries past a cleared cache.

**Trade-offs:** Sentinel-string coupling between wrapper and provider — acceptable at this distance (same repo, one producer, one consumer); document it in both files.

### Pattern 4: IST Datetime Utilities (extend `lib/utils/time.ts`, zero new deps)

**What:** The org runs in `Asia/Kolkata` (handbook §7); day-window math must not depend on the viewer's browser timezone. The lazy-correct ladder lands on **native `Intl`**, not `date-fns-tz`: IST is a fixed UTC+05:30 with no DST, so a constant-offset approach is exact, and `Intl.DateTimeFormat` handles all display formatting:

```typescript
const IST = "Asia/Kolkata";
const istParts = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: IST, ...opts }).format(d);

// display: off-by-one-day-proof
formatDateIST(iso); formatTimeIST(iso);

// send: build "+05:30"-offset ISO from a wall-clock input
toIstOffsetIso(wallClockString);            // "2026-09-01T10:00:00+05:30"

// forms: <input type="datetime-local"> ↔ IST wall clock round-trip
istToInputValue(iso); inputValueToIst(value);
```

**Why not `date-fns-tz`:** it earns its keep with DST conversion tables — irrelevant for a fixed-offset zone. `date-fns` stays for interval/arithmetic helpers it's already used for. Delete the current naive `toLocaleDateString("en-IN")` calls (they render in the *browser's* timezone — the exact off-by-one-day bug class the handbook warns about) during the audit pass.

### Pattern 5: Rule-of-Three Promotion for Shared UI

**What:** Write the first domain's table toolbar/pagination footer/status badge/trash-tabs inline. When a *second* domain needs the same widget, extract to `components/shared/` (not `components/ui/` — that's shadcn-generated territory). Never pre-extract.

Predicted promotions (based on backend contract, confirm against real usage):
| Widget | Domains needing it | Trigger |
|--------|--------------------|---------|
| Pagination footer with safe next-page guard | all 7+ (also fixes the known `?.meta!.total <` bug in 3 old files) | pilot domain, immediately — bug fix motivates it |
| Trash tabs (active/deleted) + Restore button | reimbursement, notice, events, bank, users-audit | second trash consumer |
| Lifecycle StatusBadge (pending/approved/rejected/hold/settled) → shadcn Badge variant | reimbursement, payroll, leave, corrections-audit | second lifecycle consumer |
| Export-progress toast + download action | attendance-audit, events | reuse existing `notification-box.tsx` action rendering — it already renders `<a href>` for `type:"download"`; same-origin cookies make the plain anchor sufficient, no blob machinery |

## Data Flow

### Read Flow (every domain, unchanged shape)

```text
page.tsx → <FeatureView> → useXxx() → getXxxApi() → fetchList(schema, url)
                                                        ↓
                              apiFetch (credentials, envelope, 401-refresh-once, toast)
                                                        ↓
              backend /api → { success, message, data[], meta{total|totalPages} }
                                                        ↓
              zod .parse per item → normalized { items, page } → TanStack cache
                                                        ↓
              component reads { isLoading, data: { items, page } }
```

### Write Flow

```text
form onSubmit → mutation.mutate(payload) → service fn → apiFetch POST/PUT/PATCH/DELETE
    → onSuccess: invalidateQueries([domain]) → active scoped queries refetch
    → onError: component side-effects only (dialog open, form reset); toast already fired
```

### Key Data Flows

1. **Lifecycle flow (reimbursement/payroll/leave):** one domain key prefix, multiple scopes (`mine`, `review`, `settlements`). Admin approve mutation invalidates `["bills"]` → both admin review list and staff my-bills refetch. No cross-domain wiring needed.
2. **Trash flow:** tab switch changes query scope to deleted listing; Restore mutation invalidates domain prefix → record vanishes from trash, appears in active list. Restore of a non-deleted id → 404 → toast shows backend message (correct, expected).
3. **Export flow:** call `GET .../export/report` → returns immediately → toast "report will arrive in notifications" → notification feed renders the `action.url` as a plain link (existing `notification-box.tsx` behavior, reused verbatim).
4. **Upload flow:** `components/image-upload.tsx` (exists) → `/api/upload/image` → Media id embedded in bill/session payloads. Leave proofs may need a document variant — extend the existing component, same pattern.
5. **Session death:** any query/mutation error `message === "Unauthorized"` (post-refresh-failure) → cache cleared → hard redirect `/login`.

## Build Order (dependency-driven)

```text
Phase 0 ─ Quality gates: lint baseline green + CI (lint, tsc, vitest run) blocking deploy
          Test infra: vitest + @testing-library/react + jsdom + MSW (msw is allow-listed
          in config but uninstalled — install and wire to intercept at apiFetch boundary)
          First tests: api-wrapper single-flight refresh, time.ts round-trips
                 │  (gates exist BEFORE mass changes, or regressions hide in lint noise)
                 ▼
Phase 1 ─ Shared infrastructure (all in lib/, provider):
          ① time.ts IST extensions      ② lib/api-list.ts factory
          ③ session-death handler       ④ pagination-footer guard util
          Tests for each — these are the load-bearing, highest-fan-out modules
                 │
                 ▼
Phase 2 ─ Pilot slice: NOTICEBOARD (smallest surface, has soft-delete+restore,
          exercises factory + trash pattern end-to-end). Written fully by hand;
          promotes trash-tabs + pagination footer into components/shared/.
          Output: documented reference implementation = the Slice Contract.
                 │
                 ▼
Phase 3 ─ Staff self-service group: MAIL (inbox/outbox), LEAVE (apply + balances),
          REIMBURSEMENT staff half (create/my-bills/balance). Reuse promoted widgets.
                 │
                 ▼
Phase 4 ─ Money & approval group: REIMBURSEMENT admin half (handle/settle/recycle/
          search/audit-log), PAYROLL (review/approve/installments), LEAVE admin
          (types + application review). Money flows get form + mutation tests.
                 │
                 ▼
Phase 5 ─ BANK/ACCOUNTS admin + EVENTS DEPTH (nested program→workshop→session→
          participant, session attendance, reminders, exports — last because most
          complex, depends on uploads and on proven slice patterns)
                 │
                 ▼
Phase 6 ─ Audit-and-fix EXISTING modules (attendance, calendar, users, register,
          profile): migrate services to factory + parsed schemas, replace naive date
          calls with IST utils, fix inline-apiFetch violations, kill the known
          pagination bug via the shared footer, wire session-death handler benefits.
          Runs LAST among build phases: alignment is mechanical once infra exists.
```

**Ordering rationale:**
- Gates/tests/shared-lib precede all feature mass — retrofitting the factory into 25 fresh endpoints costs more than writing them onto it.
- Pilot before fleet: one cheap domain de-risks the contract every other domain copies.
- Events last: highest complexity × lowest pattern risk (patterns proven by then).
- Audit after infra: "align old modules" is only mechanical when the target utilities exist.

## Scaling Considerations

Internal org tool (staff of hundreds, not millions) — user-scale is a non-issue (stateless container behind Docker Compose, cookie auth, no server sessions in the frontend). Real pressure points are data-shape scale:

| Concern | Now (10s of records) | Growth path |
|---------|----------------------|-------------|
| List size | Server-side pagination everywhere (`meta` on every list) — keep client dumb | Already correct; just never fetch unpaginated |
| Export generation | Async job → notification link (backend-owned) | Nothing to do frontend-side |
| Cache growth | TanStack cache holds pages indefinitely | If memory complaints appear, set `gcTime` per domain hook — one-line change |
| Concurrent admins | Redis-cached lists server-side (mybills, calendar) | Backend concern; frontend just invalidates normally |

## Anti-Patterns

### Anti-Pattern 1: Generic CRUD engine over the seven domains
**What people do:** `createResourceSlice(config)` generating hooks/components from a schema object.
**Why it's wrong:** reimbursement (dual-schema lifecycle + settlement), events (4-level nesting), mail (dual read scope) share almost no shape; the engine grows flags until it's harder than handwriting. Seven small slices beat one big framework.
**Do this instead:** enforce the Slice Contract (Pattern 1) via the pilot as reference; promote shared *widgets* only on second use.

### Anti-Pattern 2: Inline `apiFetch` in pages/features
**What people do:** fetch-in-component like `app/(main)/users/[id]/page.tsx` does today.
**Why it's wrong:** documented anti-pattern — skips zod validation, duplicates query-key decisions, two places to hunt endpoints.
**Do this instead:** every new endpoint gets a service fn + hook. Audit phase migrates the violators.

### Anti-Pattern 3: Browser-timezone date handling
**What people do:** `new Date(iso).toLocaleDateString(...)` (current `time.ts`) — renders in the *viewer's* timezone; an IST midnight timestamp shows as the previous day for any non-IST browser.
**Why it's wrong:** handbook §7 explicitly warns off-by-one-day bugs; attendance/payroll/leave boundaries are day-shaped — wrong-day display corrupts trust in money-adjacent screens.
**Do this instead:** Pattern 4's `timeZone: "Asia/Kolkata"` formatters, exclusively.

### Anti-Pattern 4: Trusting declared types without runtime validation
**What people do:** `attendanceSchema` exported, `res.data` returned raw (status quo in several services).
**Why it's wrong:** backend drift surfaces as `undefined.foo` deep in a table cell instead of a named parse error; audit-alignment becomes guesswork.
**Do this instead:** factory parses; schemas written tolerantly per OpenAPI (`nullable` where `data: null` is legal).

### Anti-Pattern 5: Per-mutation duplicated toast/error handlers
**What people do:** three inline `onError` blocks doing the same thing in one 400-line view (attendance-correction today).
**Why it's wrong:** `apiFetch` already toasts; duplication adds nothing and diverges over time.
**Do this instead:** components use `onError` only for state side-effects. Also delete the dead `if (!res.success) toast.error(...)` lines inside service fns — `apiFetch` throws before those can ever run.

### Anti-Pattern 6: Treating client RBAC as security
**What people do:** hiding buttons and assuming safety.
**Why it's wrong:** proxy.ts checks cookie existence only; authorization is backend-side (good). Client guards are UX.
**Do this instead:** render affordances from the RBAC matrix (§4 handbook) but expect 403s to be possible; let the toast show the backend message.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| New domain slice ↔ existing shell | Route groups + sidebar nav entries only | Nav needs a `managerRoutes` tier alongside `userRoutes`/`adminRoutes` — backend authorizes managers for event writes and bank write/update |
| Reimbursement ↔ Uploads | Media ids embedded in payloads | Reuse `components/image-upload.tsx`; add document variant for leave proof |
| Events/Attendance exports ↔ Notifications | Notification `action` object | Existing renderer reused; plain `<a href>` suffices (same-origin cookies) |
| Payroll/Leave/Bills admin ↔ RoleGuard | `allowedRoles={["admin"]}` (or `+"manager"` per matrix) | `RoleGuard` already accepts arbitrary string arrays — zero code change, verify `useMe().role` values against backend enum (MEDIUM confidence, one API call to confirm) |
| Calendar ↔ Events depth | None directly | Calendar aggregates server-side; events depth doesn't touch calendar keys |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| SAHER backend (all domains) | `apiFetch` over same-origin `/api` | Binding contract: `../saher-backend/FRONTEND-HANDBOOK.md` + Redoc `/docs`; notice routes flagged `underDevelopment` — verify live payloads before finalizing schemas |
| Web Push | Existing sw.js + VAPID flow | New domains need zero push work — backend pushes; frontend already renders |
| Google Calendar sync | Backend-owned | Out of scope frontend-side |

## Sources

- `../saher-backend/FRONTEND-HANDBOOK.md` — binding integration contract (envelope, soft delete/restore, IST, RBAC matrix, exports) — HIGH
- `../saher-backend/MODULE_ROUTES.md` — complete route/permission surface for all 14 modules — HIGH
- `lib/api-wrapper.ts`, `hooks/use-attendance.ts`, `services/attendance.api.ts`, `components/role-guard.tsx`, `features/notification/notification-box.tsx`, `package.json` — direct source reads — HIGH
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, `TESTING.md` — prior codebase analysis, cross-checked against source — HIGH
- Gaps requiring phase-specific verification: exact payload fields for unbuilt domains (resolve against Redoc/OpenAPI at each phase start); `useMe` role string values for manager gating; notice module stability (`underDevelopment` middleware)

---
*Architecture research for: Saher frontend completion — feature-slice integration*
*Researched: 2026-08-24*
