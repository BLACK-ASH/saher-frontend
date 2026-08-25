# Phase 2: Shared Infrastructure & Session Reliability - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 30 (9 new, 21 modified/retrofit targets)
**Analogs found:** 28 / 30 (permissions matrix and normalizeList have no true in-repo analog; nearest conventions documented)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/date.ts` (NEW) | utility | transform | `lib/utils/time.ts` (API surface it replaces) | role-match |
| `lib/date.test.ts` (NEW) | test | transform | `lib/api-wrapper.test.ts` | exact (harness) |
| `lib/normalize-list.ts` (NEW) | utility | transform | `lib/api-wrapper.ts` (MetaResponse shape) + `lib/common-zod-schema.ts` (shared-lib-module style) | role-match |
| `lib/session.ts` (NEW) | utility | event-driven | `lib/api-wrapper.ts` (module-level singleton guard pattern) | role-match |
| `lib/permissions.ts` (NEW) | config/utility | transform (pure lookup) | `hooks/use-me.ts` (role union), `hooks/use-attendance.ts:9-14` (enum constants) | no analog (backend-mirrored) |
| `components/pagination-footer.tsx` (NEW) | component | request-response | `features/dashboard/attendance-grid/attendance-pagination.tsx` | exact |
| `lib/api-wrapper.ts` (MOD) | service | request-response | itself — refresh-failure branch rewires | self |
| `app/provider.tsx` (MOD) | provider | event-driven | itself — add `QueryCache`/`MutationCache` onError | self |
| `hooks/use-login.ts` (MOD) | hook | event-driven | itself + `hooks/use-logout.ts` | self |
| `hooks/use-logout.ts` (MOD) | hook | event-driven | itself | self |
| `hooks/use-me.ts` (MOD) | hook | request-response | itself — widen role union with `"intern"` | self |
| `features/login/components/login-form.tsx` (MOD) | component/form | request-response | itself — consume `?next=` | self |
| `components/role-guard.tsx` (MOD) | middleware (client gate) | event-driven | itself — swap to `can()` | self |
| `components/sidebar/nav-list.tsx` (MOD) | component | event-driven | itself — swap role checks to `can()` | self |
| `services/attendance.api.ts` (MOD, exemplar) | service | CRUD/request-response | itself — adopt `normalizeList` after `apiFetch`; same edit repeats in other paginated services | self (exemplar) |
| `hooks/use-{workshops,sessions,programs,participant,leave,admin-attendance-correction}.ts` (MOD ×6, D-21) | hook | CRUD | `hooks/use-admin-attendance-correction.ts` + `hooks/use-workshops.ts` (the two shapes being collapsed into one factory) | self |
| `features/attendance/attendance-table.tsx:90` (MOD) | feature/table | request-response | `corrections/data-table.tsx` prev/next block | role-match |
| `features/attendance/attendance-correction-requests.tsx:83` (MOD) | feature/table | request-response | same | role-match |
| `features/dashboard/range-attendance-table.tsx:189`, `today-attendance-table.tsx:120` (MOD) | feature/table | request-response | same | role-match |
| `features/attendance-correction/corrections/data-table.tsx:77` (MOD) | feature/data-table | request-response | itself — feed `pageCount` from normalized shape | self |
| `features/dashboard/attendance-grid/attendance-dashboard.tsx:181` (MOD) | feature/composed | request-response | sibling grid consumers | role-match |
| Date call sites ×11 (MOD, D-01/D-18 sweep) | feature components | transform | importers listed under "Retrofit Surface" below | self |
| `proxy.ts` (REFERENCE ONLY) | middleware | request-response | — | context for D-05 `?next=` interplay |

## Pattern Assignments

### `lib/date.ts` (utility, transform)

**Analog:** `lib/utils/time.ts` — the file it replaces outright (D-18). Its 8 exports define the retrofit surface every importer expects; fold equivalents in or delete deliberately:

**Replaced API surface** (`lib/utils/time.ts` lines 1-84, 8 exports):
```typescript
export const transformTime = (iso?: string | null | Date) => {   // L3 — HH:mm, browser-TZ (buggy)
export const formatDate = (dateString: string | null | Date) => { // L13 — toLocaleDateString("en-IN")
export const formatTime = (dateString: string | null | Date) => { // L23 — toLocaleTimeString("en-IN")
export const formatHours = (hours: number) => {                  // L29 — "8h 30m" (TZ-independent, keep semantics)
export const timeToDateString = (date: string | Date, time: string) => { // L35 — naive ISO build (no offset!)
export const getMonthYear = (date: string | Date) => {           // L47 — "August 2026"
export const calculateWorkHours = (checkIn, checkOut) => {       // L54 — diff math (TZ-independent, keep)
export const toLocalInput = (date: string | Date) => {           // L68 — datetime-local value builder (browser-TZ)
```

**New-module mechanics** follow the pure-lib convention of `lib/logger.ts` (lines 1-7): named function exports, no React, no side effects, brief header comment. Implementation mechanics come from RESEARCH.md Pattern 1 (`Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"` + fixed-offset parsing) — no codebase analog exists because this is precisely what's being built.

### `lib/normalize-list.ts` (utility, transform)

**Analog:** `lib/api-wrapper.ts` owns the envelope shape it normalizes:

**Envelope types** (lines 3-15):
```typescript
export type MetaResponse = {
  page: number;
  limit: number;
  count: number;
  total: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: MetaResponse;
};
```

Note: current `MetaResponse` hardcodes only `total` and omits `totalPages` — RESEARCH verified both field names carry PAGE COUNT and `count` carries records; `meta` may be absent entirely. The normalizer must absorb all of that variance (RESEARCH.md Pattern 2 has the verified-shapes table and sketch).

**Call-site convention it plugs into** — every paginated service returns the raw pair today (`services/attendance.api.ts` lines 43-55):
```typescript
export const getAttendance = async ({ sort = "desc", page = 1, limit = 7 }: DefaultProps) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/me?sort=${sort}&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return { data: res.data, meta: res.meta };
};
```
Retrofit shape: `return normalizeList<AttendanceResponse>(res)` — pure factory called by services after `apiFetch`, per D-16.

### `lib/session.ts` (utility, event-driven)

**Analog:** `lib/api-wrapper.ts` — the only existing module-level singleton guard in the repo. Copy its structure exactly:

**Module singleton + section banners** (lines 17-33):
```typescript
// ========================
// GLOBAL REFRESH STATE
// ========================
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}
```
`session.ts` follows the identical pattern: `let died = false` once-guard at module top, exported reset function, banner comments. RESEARCH.md Pattern 3 provides the sketch (`cancelQueries()` → `clear()` → single toast → `location.assign("/login?next=…")`).

**The exact branch being rewired** — refresh-failure path (lines 85-90) currently does its own toast+throw; replace those two lines with a delegation to `handleSessionDeath()`:
```typescript
const ok = await refreshPromise;

if (!ok) {
  toast.error("Session expired. Please login again.");   // ← moves into lib/session.ts (deduped)
  throw new Error("Unauthorized");                        // ← sentinel stays; QueryCache.onError filters on it
}
```

### `lib/permissions.ts` (config/utility, pure lookup) — NO IN-REPO ANALOG

No frontend permission abstraction exists. Conventions to reuse:

**Role vocabulary today** (`hooks/use-me.ts` line 12) — must gain `"intern"` per FNDT-06:
```typescript
readonly role: "user" | "manager" | "admin";
```

**Constants-with-members convention** (`hooks/use-attendance.ts` lines 9-14, per CONVENTIONS.md):
```typescript
export enum AttendanceStatus {
  NOT_CHECKED_IN = "NOT_CHECKED_IN",
  ...
}
```

The matrix content itself mirrors `../saher-backend/src` `role-permission.ts` verbatim (FOUR roles, no inheritance — admin lacks bank-write, user has notice-write). Vocabulary format `${resource}:${action}` from backend. Ground truth lives in backend source, not this repo — see No Analog table below.

### `components/pagination-footer.tsx` (component, request-response)

**Analog:** `features/dashboard/attendance-grid/attendance-pagination.tsx` — exact UX base named by RESEARCH. Copy its structure, then harden per D-20:

**Props + page math** (lines 12-28):
```typescript
type Props = {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export default function AttendancePagination({ page, total, limit, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
```
⚠️ This math treats `total` as records — the wrong interpretation (RESEARCH discovery #2). The new footer takes pre-normalized `{ page, totalPages }` instead of doing its own math.

**Button + disable pattern to keep** (lines 40-47, 58-60):
```tsx
<Button variant="outline" size="icon" disabled={page === 1} onClick={() => onPageChange(1)}>
  <ChevronsLeft className="h-4 w-4" />
</Button>
...
<div className="min-w-28 text-center text-sm font-medium">
  Page {page} of {totalPages}
</div>
```

**D-20 hardening requirement** — the crash vector this fixes (`features/dashboard/range-attendance-table.tsx` line 189, same in `today-attendance-table.tsx:120`, `attendance-table.tsx:90`, `attendance-correction-requests.tsx:83`):
```tsx
disabled={Number(data?.meta?.total) < page + 1}   // Number(undefined) < n === false → button stays ENABLED
```
Footer inputs must be defaulted numbers (from `normalizeList`) and internally re-check `Number.isFinite(totalPages) && totalPages >= 1` before enabling.

**TanStack Table consumer retrofit** (`features/attendance-correction/corrections/data-table.tsx` lines 74-77, footer block 189-206):
```typescript
manualPagination: true,
manualSorting: true,
manualFiltering: true,
pageCount: corrections?.meta?.total,   // ← undefined-able; feed normalized.totalPages instead
```
Keep `manualPagination: true`; replace raw footer Buttons with `<PaginationFooter />`.

### `lib/session.ts` wiring — `app/provider.tsx` (provider, event-driven)

**Analog:** itself (lines 6-17) — add cache constructors alongside defaultOptions:
```typescript
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      })
  );
```
RESEARCH.md Pattern 3 shows the target shape: `new QueryClient({ queryCache: new QueryCache({ onError }), mutationCache: new MutationCache({ onError }), defaultOptions })` where the handler fires `handleSessionDeath(queryClient)` only when `err.message === "Unauthorized"` (the api-fetch sentinel above).

### `hooks/use-login.ts` + `features/login/components/login-form.tsx` (hook + form, D-05 back half)

**Analog:** themselves. Two defects to fix while adding `?next=`:

**Broken invalidation** (`hooks/use-login.ts` lines 14-16):
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: [] });   // matches nothing meaningful
},
```
Target: reset the session-death once-guard (`resetSessionGuard()` per RESEARCH Pitfall 1) + seed `["user", "me"]` or invalidate it explicitly (compare `hooks/use-me.ts:43` key).

**Hardcoded redirect** (`features/login/components/login-form.tsx` lines 51-61):
```typescript
const onLoginSubmit = async (data: z.infer<typeof loginFromSchema>) => {
  mutate(data, {
    onSuccess: (res) => {
      toast.success(res.message);
      router.refresh();
      router.push("/");            // ← becomes validated `next` param
    },
    ...
```
Validation snippet from RESEARCH Code Examples (anti-open-redirect, Pitfall 3):
```typescript
const params = useSearchParams();
const raw = params.get("next") ?? "/";
const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
router.push(next);
```

**Proxy interplay context** (`proxy.ts` lines 11-25): publicRoutes already includes `/login`; logged-in users hitting `/login` bounce to `/`. The death-path redirect is safe because the backend clears all 3 cookies in the failing-refresh 401 response; only the best-effort logout network-failure path retains cookies (documented degradation, RESEARCH Pitfall 2).

### `hooks/use-logout.ts` (hook, D-08 best-effort)

**Analog:** itself (lines 9-19) — full current body:
```typescript
return useMutation({
  mutationFn: async () => {
    return await apiFetch(`/api/auth/logout`, { method: "POST" });
  },
  onSuccess: () => {
    queryClient.removeQueries({ queryKey: [] });   // broken: matches nothing
    router.push("/");
  },
});
```
Target shape (RESEARCH Code Examples): wrap the POST in try/catch (best-effort — never trap the user), then `performLogoutCleanup(queryClient)` shared with session death (cancel + clear + redirect). Note `removeQueries({ queryKey: [] })` → `queryClient.clear()` per D-07.

### `components/role-guard.tsx` + `components/sidebar/nav-list.tsx` (gating, D-14)

**RoleGuard current check** (`components/role-guard.tsx` lines 16-26):
```typescript
useEffect(() => {
  if (!isLoading && user) {
    if (!allowedRoles.includes(user.role)) {
      router.replace("/forbidden");
    }
  }
  if (!isLoading && !user) {
    router.replace("/login");
  }
}, [user, isLoading]);
```
Swap `allowedRoles.includes(user.role)` for `can(...)` predicates over the route's required permissions.

**Nav filtering — known bug to fix, not preserve** (`components/sidebar/nav-list.tsx` lines 158-179):
```typescript
{user?.role === "manager" ||
  (user?.role === "admin" && (
    <SidebarGroup>
      <SidebarGroupLabel>Manager</SidebarGroupLabel>
      ...
```
Operator precedence: admins get manager nav, managers get NOTHING (Pitfall 6). Rewrite as `managerRoutes.every/some(...) && can(...)` predicates over route→permission annotations; add render test asserting manager sees Dashboard/Users. Route arrays live at lines 27-94 (`userRoutes`, `managerRoutes`, `adminRoutes`) — annotate each with its permission pair during retrofit.

### List-hook factory (D-21) — collapse six hooks

**Two shapes being collapsed**, both fully shown:

`hooks/use-workshops.ts` (lines 13-55): list query keyed by params `["workshops", keyword, page, limit]` + detail query `enabled: !!id` + three mutations each invalidating the resource root `["workshops"]`.

`hooks/use-admin-attendance-correction.ts` (lines 23-47): hierarchical keys `["attendance", "correction", limit, page, sort]` + mutations invalidating the key PREFIX:
```typescript
const handleCorrection = useMutation({
  mutationFn: handleAttendanceCorrection,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["attendance", "correction"] });
    queryClient.invalidateQueries({ queryKey: ["attendance", "correction", correctionId] });
  },
});
```
Factory signature should cover: resource root key, list queryFn (normalized), optional detail query, mutation(s) with prefix-invalidation. Return flat object bag per CONVENTIONS.md (`{ workshops, workshop, add, update, del }` style).

## Shared Patterns

### HTTP funnel + envelope contract
**Source:** `lib/api-wrapper.ts` lines 38-52, 71-73
**Apply to:** every service touched in the retrofit; never bypass with bare fetch.
```typescript
const res = await fetch(url, {
  ...options,
  credentials: "include",
  headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
});
...
if (res.ok && json.success) { return json; }
```

### Toast-on-error via sonner; errors carry server message
**Source:** `lib/api-wrapper.ts:64,88,122` · `features/login/components/login-form.tsx:58-60`
**Apply to:** session death toast (deduped once), all mutation onError callbacks.
```typescript
onError: (err: Error) => { toast.error(err.message); }
```

### Query-key hierarchy + invalidate-prefix
**Source:** `hooks/use-admin-attendance-correction.ts:29,36` · CONVENTIONS rule
**Apply to:** list-hook factory and any retouched hook. Keys are `[resource, scope?, ...params]`; mutations invalidate the resource prefix, never `[]`.

### Zod-inferred DTOs beside endpoints
**Source:** `services/attendance.api.ts:6-24`
**Apply to:** normalizer composes with these schemas, not around them.
```typescript
export const attendanceSchema = z.object({ ... });
export type AttendanceResponse = z.infer<typeof attendanceSchema>;
```

### Phase 1 test harness (msw at apiFetch boundary)
**Sources:** `lib/api-wrapper.test.ts` lines 19-31 (inline handler pattern), `tests/setup.ts` (listen/resetHandlers/close lifecycle, `onUnhandledRequest: "error"`), `tests/render-with-providers.tsx` (fresh QueryClient per call), `tests/test-server.ts` (empty server, fixtures inline).
**Apply to:** ALL new test files this phase (`lib/date.test.ts`, `lib/normalize-list.test.ts`, `lib/session.test.ts`, `lib/permissions.test.ts`, `components/pagination-footer.test.tsx`, extended `lib/api-wrapper.test.ts`).
```typescript
server.use(
  http.get("/api/attendance/me", () =>
    HttpResponse.json({ success: true, message: "ok", data: attendance }),
  ),
);
await expect(apiFetch("/api/attendance/me")).resolves.toMatchObject({ ... });
```
Session-death redirect assertions need `vi.stubGlobal("location", {...})` (RESEARCH Pattern 5) — consider `tests/setup.ts` if multiple suites need it.

### shadcn primitives + lucide icons for new UI
**Source:** `features/dashboard/attendance-grid/attendance-pagination.tsx:10` — `import { Button } from "@/components/ui/button";` + chevron icons. Never hand-roll new ui primitives.

## Retrofit Surface (enumerated)

**Date call sites (D-01/D-18)** — 11 importer files of `@/lib/utils/time`:
- `features/calendar/add-event-dialog.tsx` (toLocalInput)
- `features/attendance/attendance-correction.tsx` (formatDate, timeToDateString, transformTime)
- `features/attendance/attendance-status.tsx` (formatDate, formatHours, transformTime)
- `features/attendance/attendance-chart.tsx` (getMonthYear)
- `features/attendance/attendance-comparision.tsx` (formatTime)
- `features/attendance/attendance-correction-requests.tsx` (formatDate)
- `features/attendance/attendance-table.tsx` (formatDate, formatHours, formatTime)
- `features/attendance-correction/corrections/column.tsx` (formatDate, formatTime)
- `features/attendance-correction/attendance-correction-view.tsx` (formatDate, timeToDateString, transformTime)
- `features/dashboard/range-attendance-table.tsx` (formatDate, formatHours, formatTime)
- `features/dashboard/today-attendance-table.tsx` (formatDate, formatHours, formatTime)

Plus ~21 more files using raw `new Date`/`toLocale*` per RESEARCH FNDT-02 row — sweep during implementation.

**Paginated consumers to move onto footer + normalizer (D-02):**
`features/attendance/attendance-table.tsx:90` · `features/attendance/attendance-correction-requests.tsx:83` · `features/dashboard/range-attendance-table.tsx:189` · `features/dashboard/today-attendance-table.tsx:120` · `features/attendance-correction/corrections/data-table.tsx:77` · `features/dashboard/attendance-grid/attendance-dashboard.tsx:181` (passes `meta.total` as records into the old footer — delete the Math.ceil interpretation entirely) · `components/data-table.tsx:157-178` (generic client-side TanStack DataTable with raw Previous/Next Buttons — sole consumer `features/holiday/holiday-table.tsx`; same client-side footer recipe as users-admin, no server meta involved) · `features/users/data-table.tsx:162-179` (users-admin client-side TanStack table, raw Previous/Next over getPaginationRowModel — D-02 names this screen explicitly) · `features/mail/data-table.tsx:167-184` (client-side TanStack; rendered twice by the mail page) · `features/program/{workshop,program,session,participant}-header.tsx` (~55-64 each; server-paged via `?page=` URL state with raw prev/next Buttons and no next-boundary guard).

**Hooks consolidated (D-21):** `use-workshops`, `use-sessions`, `use-programs`, `use-participant`, `use-leave`, `use-admin-attendance-correction`.

## No Analog Found

| File | Role | Data Flow | Reason | Planner Guidance |
|------|------|-----------|--------|------------------|
| `lib/permissions.ts` matrix | config | pure lookup | No RBAC abstraction exists client-side | Mirror `../saher-backend/src` `permission/role-permission.ts` verbatim (4 roles, no hierarchy); vocabulary `${resource}:${action}`; pin strings via D-15 probe of `GET /api/auth/me`; truth-table tests assert the verified quirks (admin no bank-write, user notice-write, intern read-event-only) |
| `lib/normalize-list.ts` | utility | transform | No normalizer exists; current code diverges per-screen | RESEARCH.md Pattern 2 is authoritative (verified backend variance table + sketch); compose with zod schemas per shared pattern above |

## Metadata

**Analog search scope:** `lib/`, `hooks/`, `services/`, `features/**`, `components/**`, `tests/`, `app/provider.tsx`, `proxy.ts`
**Files scanned:** 22 source files read in full; targeted greps across features for meta/pagination/time usage
**Pattern extraction date:** 2026-08-25
