# Phase 9: Attendance Overhaul — Admin Oversight & UX Polish - Research

**Researched:** 2026-09-01
**Domain:** Admin attendance oversight UI, async report export, self-service UX repair (Next.js 16 + TanStack Query + recharts + shadcn)
**Confidence:** HIGH (backend contracts, export path, guards, and chart root cause all verified against live source)

> **SCOPE EXPANSION (operator-authorized 2026-09-01):** The owner has expanded Phase 9 beyond
> the original CONTEXT. These additions NOW SUPERSEDE the "backend changes out of scope" claim
> in this document and REQUIREMENTS.md WITH RESPECT TO THIS PHASE. All are approved in-scope:
>
> 1. **All-employee admin export (backend + frontend)** — resolves D-15. Add a backend endpoint
>    or `userId=all` param so the export worker can produce an ALL-employees PDF/XLSX, plus the
>    frontend admin export button.
> 2. **Backend check-in/out mapping fixes** — align the frontend check-in/check-out/overtime
>    calls (`services/attendance.api.ts`) exactly to backend (`check-in`, `check-out`,
>    `overtime/check-in`, `weekoff`), incl. the D-14 `$sort`→`sort` bug.
> 3. **Overtime cron wiring** — verify/wire the existing backend cron jobs
>    (`create-attendance.cron.ts`, `auto-checkout-attendance.cron.ts`) and surface overtime
>    state (`attendance.overtime`, `overtime/check-in`) correctly in the UI.
> 4. **Admin page has THREE views: Range / Today / Monthly** — not just the single range view
>    in CONTEXT D-02. Admin can switch between a custom date-range table, a today view (all
>    employees today via `GET /today`), and a monthly view.
> 5. **Self-service export format selector** — PDF/XLSX (D-06, was already in scope).
> 6. **D-13 guard fix (backend)** — add `authorize('read','attendance')` to `GET /retrieve` and
>    `authorize('read','attendance-correction')` to `GET /admin/correction` (confirmed gap);
>    mirror-verify `lib/permissions.ts` + `tests/permissions.test.ts`.
>
> **Frontend AND backend work are both in-scope for Phase 9** per these owner directives.
> REQUIREMENTS.md's blanket "Backend changes of any kind" out-of-scope line does not apply to
> the items above for this phase. All other considerations (envelope, dates, pagination, RBAC
> mirrors) still apply. Backend tasks landing in `../saher-backend` get their own plan/tasks.

## Summary

This phase builds a dedicated admin "All Attendance" page and repairs the self-service attendance page. Every backend contract in the phase scope was verified against `saher-backend` live source, and four of the CONTEXT decisions (D-08 dead-link, D-10 chart, D-13 guard gap, D-14 `$sort` bug) are **confirmed** as real bugs. One decision, **D-15/D-07 admin all-employee export, is a genuine scope conflict**: the existing `GET /api/attendance/export/report` → BullMQ worker → `retrieveCustomAttendace(job.data.user)` path is hard-wired to a **single user** and has no `userId=all` handling anywhere. Delivering all-employee export requires either a new backend endpoint or a reworked worker — both are backend modifications, which the project's REQUIREMENTS.md explicitly puts **out of scope** ("Backend changes of any kind"). The planner must surface this to the user for an explicit call.

The chart root cause is confirmed: `useAttendance` defaults `limit = 7` and `attendancesList` (→ `GET /api/attendance/user/me`) returns only the latest 7 records, so "This Month Work Hour" actually plots 7 desc-sorted rows. The fix is to query the full month range server-side (either a dedicated month query or large limit), not to fiddle with the chart component. The `RangeAttendanceTable` in the dashboard is fully built and reusable, but it carries the `$sort` bug and only supports single-day navigation — not the date-range filter the admin page needs, so it should be **rebuilt fresh** reusing its proven date-input + table-cell patterns rather than un-commented.

**Primary recommendation:** Frontend-only phase. Build the admin page from verified contracts, fix the four confirmed bugs (D-08, D-10, D-13-guard-mirror, D-14), and gate the all-employee export (D-15/D-07) behind an explicit user decision on the backend scope conflict. Mirror any backend permission change into `lib/permissions.ts` + bump the four entry-count assertions in `tests/permissions.test.ts` (admin=47, manager=38, user=14, intern=1).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New dedicated page at `app/(main)/(admin)/attendance/page.tsx` with RoleGuard (`can('read', 'attendance')` or similar). Separate from dashboard.
- **D-02:** Filterable table layout. Columns: Employee Name, Date, Check-In, Check-Out, Status (present/absent/half-day/late/week-off/on-leave), Hours Worked. Filters: employee search/selector, date range picker. Paginated via PaginationFooter.
- **D-03:** Data source: `GET /api/attendance/retrieve` (backend `getAllUserController`) — all employees' attendance across a date range. No backend changes needed for the query itself.
- **D-04:** Employee drill-down: clicking an employee row opens their full attendance history via `GET /api/attendance/user/:id` (`allAttendanceController`). Dialog or sub-page.
- **D-05:** Sidebar nav entry: "All Attendance" under admin section in `components/sidebar/nav-list.tsx`, gated by `can()` permission check.
- **D-06:** Self-service export: add format selector (PDF / XLSX) to `features/attendance/attendance-report.tsx` — add `format` query param. Backend already supports both via BullMQ worker.
- **D-07:** Admin export: add export button on the admin attendance page that exports all employees' attendance for the selected date range. Backend `GET /api/attendance/export/report` is per-user — may need separate admin endpoint or `userId=all`. **Investigate (resolved: scope conflict, see below).**
- **D-08:** Fix the cached export dead-link bug: `export/report.ts:114-119` reads `data.result?.downloadPath` but worker returns action `{type,label,url,method}`. **Confirmed — fix reads `data.result?.url`.**
- **D-09:** Export delivers via notification action button (existing pattern). No changes to notification pipeline.
- **D-10:** Fix chart: `attendance-chart.tsx` titled "This Month Work Hour" shows only latest 7 desc records. Fix: query full month data, correct label. **Confirmed root cause = `limit=7` default in `useAttendance`.**
- **D-11:** Add date-range filter on self-service history table (`attendance-table.tsx`). Add start/end date inputs to filter by range.
- **D-12:** Improve status display in `attendance-status.tsx` — clear current state with timestamps.
- **D-13:** Add `authorize()` guard to `GET /api/attendance/retrieve` and `GET /api/attendance/admin/correction`. **Both confirmed unguarded (only `protectedRoute`). Backend change — must be justified as security gap; mirror `lib/permissions.ts` + tests.**
- **D-14:** Fix `$sort` vs `sort` query param mismatch: frontend `services/attendance.api.ts:80` sends `$sort=desc`, backend `getAllUserController` reads `req.query.sort`. **Confirmed — align frontend to `sort=`.**
- **D-15:** Investigate whether admin export needs a new backend endpoint or `userId=all` param. **Resolved: existing export is per-user only; needs backend work (out of scope).**
- **D-16:** IST date handling via `lib/date.ts` for all date rendering/parsing.
- **D-17:** PaginationFooter for all paginated tables.
- **D-18:** Follow existing admin page patterns: `app/(main)/(admin)/` with RoleGuard, consistent with Phase 6 admin pages.

### the agent's Discretion
- Exact table column widths and sorting defaults
- Whether employee drill-down is a dialog or sub-page
- Date range picker component choice (existing calendar date picker or new range picker)
- Test scope (minimum: lint/typecheck green)
- Whether to un-comment the existing `RangeAttendanceTable` or build fresh

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ATTD-01 | Admin/manager has dedicated "All Attendance" page (date-range + employee filter + paginated all-employee table) | `/api/attendance/retrieve` contract verified (get-all-user.controller.ts); reusable table/cell/date patterns identified; `$sort` bug (D-14) must be fixed for range query to sort correctly |
| ATTD-02 | Admin can drill down into any employee's full attendance history via `/user/:id` | `allAttendanceController` contract verified; returns paginated full history; guard is role-checked in-controller (admin/manager/self only) |
| ATTD-03 | Export works for both self-service and admin (all employees); XLSX option available | Self-service `format=` param verified (report.ts:28, worker format branch). **All-employee export BLOCKED on backend scope decision (D-15).** XLSX delivery path verified (worker → excel.service.ts → download) |
| ATTD-04 | Self-service page user-friendly: chart shows actual month data, date-range filter on history table, clear check-in/out status | Chart root cause = `limit=7` in `useAttendance` (D-10); table can add date-range filter (D-11); status card needs clarity (D-12) |
| ATTD-05 | All existing attendance features (check-in/out, corrections, week-off) continue working without regressions | No changes to mutation endpoints; only reads/UI touched; invalidate `["attendance"]` key family unchanged |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| All-employee attendance listing/filter | API / Backend | Browser (query params) | `GET /retrieve` is server-side date-range + pagination; frontend only builds query string + renders |
| Employee drill-down history | API / Backend | Browser | `GET /user/:id` returns paginated history server-side; frontend renders in dialog/sheet |
| Self-service chart data | API / Backend | Browser (recharts render) | Query full month via server param; recharts only visualizes returned rows |
| Report export (self-service) | API / Backend | Browser (trigger) | BullMQ async job → notification action; frontend just POSTs/GETs the report request + renders notification button |
| Admin nav + RBAC gating | Browser / Client | API (server-enforced) | `can()` gates nav/route in UI; backend `authorize()`/`protectedRoute` is the enforced source-of-truth |
| Status display / formatting | Browser / Client | — | Pure presentation via `lib/date.ts` IST formatting |

> **Tier caution:** Do NOT put "all-employee data fetching" in the frontend-today table path. `GET /today` is single-day and cached; the admin page needs `GET /retrieve` (range). They are different endpoints.

## Standard Stack

### Core
All frontend packages required by this phase are **already installed** — no new npm dependencies. Verified in `package.json` and confirmed `[OK]` via slopcheck.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router page + proxy guard | Framework (STACK) |
| react / react-dom | 19.2.3 | UI runtime | Framework |
| @tanstack/react-query | ^5.94.5 | All server state (admin + self-service) | Single QueryClient in `app/provider.tsx`; every endpoint via hook |
| @tanstack/react-table | ^8.21.3 | Admin paginated table (if using column-def pattern) | Used by `features/users/data-table.tsx` |
| zod | ^4.3.6 | Response schemas + form validation | `attendanceSchema` already defined; reuse `z.infer` |
| recharts | 3.8.0 | Work-hour bar chart | Already in `attendance-chart.tsx` + `components/ui/chart.tsx` |
| lucide-react | ^0.575.0 | Icons | Icon library |
| react-hook-form + @hookform/resolvers | ^7.71.1 | Forms (drill-down filters if reactive) | Established form stack |
| date-fns | ^4.1.0 | Date math (backing `lib/date.ts`) | Present |
| radix-ui / @radix-ui/react-popover | ^1.4.3 / popover | Dialog/sheet/popover primitives for drill-down | `components/ui/dialog.tsx`, `sheet.tsx`, `popover.tsx` exist |

### Supporting (already installed / reusable)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `lib/date.ts` | IST date-only + formatting (`dateToIstDateOnly`, `istDateOnlyToDate`, `formatIstDate`, `formatIstDateTime`, `formatHours`) | **All** date rendering and `startDate/endDate` query params — never raw `Date` on the wire |
| `lib/api-wrapper.ts` (`apiFetch`) | Single HTTP funnel (envelope, 401 refresh) | Every API call, never bare fetch |
| `lib/normalize-list.ts` (`normalizeList`) | Normalize `{data,meta}` → `{items,page,totalPages,...}` | `GET /retrieve` and `GET /user/:id` both return `meta{page,limit,count,total}` — the `count`→`totalRecords`, `total`→`totalPages` mapping is handled |
| `components/shared/pagination-footer.tsx` | Safe pagination footer | Admin + self-service tables |
| `components/ui/table.tsx`, `card.tsx`, `badge.tsx`, `sheet.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx` | Primitives | Admin page composition |
| recharts `BarChart` + `components/ui/chart.tsx` `ChartContainer` | Chart | Self-service work-hour chart |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two native `<Input type="date">` (established pattern) | shadcn `components/ui/calendar.tsx` range picker | **No `date-range-picker.tsx` exists**; `calendar.tsx` is a single-day react-day-picker. Two native date inputs is the proven pattern (`attendance-toolbar.tsx`, `range-attendance-table.tsx`). Building a range picker from `calendar.tsx` is extra work with no payoff — skip. |
| Rebuild RangeAttendanceTable fresh | Un-comment `range-attendance-table.tsx` | It has the `$sort` bug (D-14) and single-day-only nav (no true start≠end range). Un-commenting propagates the bug + limits the date-range filter. Rebuild fresh, reuse its cell/date patterns. |
| Admin export via existing `export/report` | New backend endpoint `/export/retrieve` | Existing endpoint is **per-user hard-wired**. No `userId=all`. Backend change is required (out of scope) — see D-15 conflict. |

**Installation:**
```bash
# No new packages needed for this phase. All core deps already installed.
pnpm install   # only if lockfile changes during dev
```

**Version verification:** Confirmed from `package.json` live (see table). All `[OK]` via slopcheck 0.6.1.

## Package Legitimacy Audit

> This phase introduces **zero new frontend packages**. Every dependency needed is already present and used in the codebase. Run (no new installs).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| react | npm | long-standing | high | github.com/facebook/react | [OK] | Already-installed — Approved |
| next | npm | long-standing | high | github.com/vercel/next.js | [OK] | Already-installed — Approved |
| recharts | npm | long-standing | high | github.com/recharts/recharts | [OK] | Already-installed — Approved |
| @tanstack/react-query | npm | long-standing | high | github.com/TanStack/query | [OK] | Already-installed — Approved |
| zod | npm | long-standing | high | github.com/colinhacks/zod | [OK] | Already-installed — Approved |
| lucide-react | npm | long-standing | high | github.com/lucide-icons | [OK] | Already-installed — Approved |
| react-hook-form | npm | long-standing | high | github.com/react-hook-form | [OK] | Already-installed — Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Note: All are pre-existing production dependencies (verified in `package.json`). No `checkpoint:human-verify` gates needed for new installs because there are none.*

**Backend note:** If D-15 (admin all-employee export) is approved and requires new backend code, any *new backend* package (e.g., none anticipated — reuse exceljs/puppeteer already present) must run the legitimacy gate in the backend repo, not here.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                       SAHER BACKEND (/api)                  │
                    │  (route.ts mounts all under protectedRoute middleware)      │
                    └───────────┬──────────────────────────────┬──────────────────┘
                                │                              │
   ┌──────────────────────────┐ │                              │  ┌──────────────────────────┐
   │ Self-service page         │ │   ┌──────────────────────┐   │  │ Admin "All Attendance"   │
   │ /attendance               │─┼──▶│ GET /retrieve        │◀──┼──│ /(admin)/attendance      │
   │ (staff)                   │ │   │ (all employees,      │   │  │ (admin+manager)          │
   │  ├ chart                 │ │   │  date range, page)   │   │  │  ├ date-range filter     │
   │  ├ status card           │ │   └──────────────────────┘   │  │  ├ employee filter       │
   │  ├ history table (+range)│ │   ┌──────────────────────┐   │  │  ├ paginated table       │
   │  └ export dropdown        │─┼──▶│ GET /user/me | /:id │◀──┼──│  └ drill-down → sheet    │
   └──────────────────────────┘ │   │ (single user history)│   │  └────────┬───────────────┘
                                │   └──────────────────────┘   │           │
                                │   ┌───────────────────────────┐  ┌───────▼───────────┐
                                │   │ GET /export/report        │  │ GET /user/:id     │
                                │   │ → BullMQ job → worker     │  │ (allAttendance    │
                                │   │ → notification(download)  │  │  controller)      │
                                │   └──────────┬────────────────┘  └───────────────────┘
                                │              ▼ (async)
                                │   notification feed → action button {type,label,url,method}
                                │              ▼
                                │   GET /download/:fileName → res.download(temp/*)

   Auth: protectedRoute (app.ts:92) sets req.user; authorize(action,resource) adds RBAC per-route.
   All reads client-side via TanStack Query hooks; mutations invalidate ["attendance"].
```

### Recommended Project Structure
```
app/(main)/(admin)/attendance/page.tsx      # NEW admin page (RoleGuard can('read','attendance'))
features/attendance/                        # self-service fixes in-place:
  attendance-chart.tsx                        #  fix data source (month query), keep recharts
  attendance-table.tsx                        #  add date-range filter (D-11)
  attendance-status.tsx                       #  clarity pass (D-12)
  attendance-report.tsx                       #  add format selector (D-06)
features/attendance/admin/                  # NEW — admin attendance feature (optional colocation)
  admin-attendance-page.tsx                   #  composes toolbar + table
  admin-attendance-table.tsx                  #  TanStack table (column defs)
  admin-attendance-columns.tsx                #  columns (mirror today-attendance-table)
  employee-attendance-sheet.tsx               #  drill-down via GET /user/:id
hooks/use-admin-attendance.ts               # NEW hook over /retrieve + /user/:id
services/attendance.api.ts                    #  FIX $sort → sort (D-14); add admin range fn
components/sidebar/nav-list.tsx               #  add "All Attendance" nav entry (D-05)
tests/                                        #  permissions count fix if backend mirror (D-13)
```

### Pattern 1: TanStack Table with sibling column definitions
**What:** The admin table follows `features/users/data-table.tsx` (generic `UserDataTable<TData,TValue>`) with columns in a sibling `column.tsx`, row-model: sorting/pagination/filter/visibility.
**When to use:** Any multi-column, paginated, filterable admin table.
**Example pattern (from `features/users/data-table.tsx` + `components/data-table.tsx`):** columns defined with `@tanstack/react-table` `ColumnDef[]`, `<Table>` shadcn primitives, `PaginationFooter` bound to normalized `totalPages`. Reuse this rather than hand-rolling a bespoke table loop.

### Pattern 2: Admin page role gating
**What:** Admin pages live under `app/(main)/(admin)/` whose `layout.tsx` wraps in `<RoleGuard allow={(r) => can(r, "write", "user")}>` — this gates **both admin and manager** (both have `write,user`). Individual pages add their own `RoleGuard` for tighter scoping (see `payroll/page.tsx:93` uses `can(r,"read","payroll")`).
**When to use:** The new attendance page under `(admin)/` should add `<RoleGuard allow={(r) => can(r, "read", "attendance")}>` (both admin and manager have this permission).
**Example:** `app/(main)/(admin)/payroll/page.tsx:93`.

### Pattern 3: Async report export via notification action
**What:** Report generation is a GET that enqueues a BullMQ job; the worker writes a file and calls `notification.specific.info(...)` with `action={type:'download', label:'Report', url:'/api/attendance/download/:file', method:'GET'}`. The user clicks the notification action button to download.
**When to use:** All report generation (self-service + admin).
**Frontend trigger (existing, `features/attendance/attendance-report.tsx:41-48`):** `apiFetch('/api/attendance/export/report?type=month&format=pdf')` → toast success → user waits for notification.

### Pattern 4: IST date-range via two native date inputs
**What:** `startDate`/`endDate` are `YYYY-MM-DD` IST-only strings managed with `dateToIstDateOnly`/`istDateOnlyToDate`, sent as-is in query params. Two `<Input type="date">` with min/max cross-constraints (see `attendance-toolbar.tsx:50-73`).
**When to use:** Any date-range filter (admin page, self-service history table D-11).
**Example:** `features/dashboard/attendance-grid/attendance-toolbar.tsx`.

### Anti-Patterns to Avoid
- **Copying `$sort` bug into new filters:** backend reads `req.query.sort` on `/retrieve`; always send `sort=` not `$sort=`.
- **Using `GET /today` for the admin page:** `/today` is single-day + Redis-cached with empty-day 200-null; it is NOT the range listing. Use `/retrieve`.
- **Pulling `count`/`total` naming manually:** always run responses through `normalizeList` (it maps backend `meta.total`→pages, `meta.count`→records). Don't hand-transcribe meta.
- **New chart data without server range:** extending client `limit` to a large number to "fix" the chart is fragile (thousands of rows). Query the month server-side (`type=month` range or startDate/endDate) and plot that bounded set.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Envelope/HTTP handling | Custom fetch + meta parsing | `apiFetch` + `normalizeList` | 401 refresh dedupe, toasts, page-count mapping already solved |
| IST date rendering/parsing | Manual `new Date()` math | `lib/date.ts` helpers | Day-boundary correctness, tested (FNDT-02) |
| Date-range filter | Build a custom popover range picker | Two native `<Input type="date">` (+ `dateToIstDateOnly`) | Proven pattern in `attendance-toolbar.tsx`; no range-picker primitive exists |
| Pagination controls | Custom prev/next buttons | `components/shared/pagination-footer.tsx` | Boundary-safe, tested (FNDT-05) |
| RBAC affordance gating | Hard-coded role checks in each component | `can(role, action, resource)` from `lib/permissions.ts` | Single source mirroring backend matrix |
| Report file generation | Do it client-side | Backend BullMQ worker → notification action button | Server owns file gen + temp storage; client just downloads |

**Key insight:** Every hard problem here (envelope, dates, pagination, RBAC, report files) is already solved by an existing tested utility. The genuine new work is *composition* — a new page, a new hook, and repairing three buggy reads. Don't rebuild what Phase 2 built.

## Common Pitfalls

### Pitfall 1: `$sort` vs `sort` mismatch (D-14)
**What goes wrong:** `/retrieve` silently ignores the sort param you send; backend `getAllUserController` reads `req.query.sort` (get-all-user.controller.ts:58) but frontend `getRangeAttendance` sends `$sort` (attendance.api.ts:80). When you build the admin table, rows won't sort.
**Why it happens:** Frontend used `$sort` (a mongo-style param) against an Express query.
**How to avoid:** Send `sort=desc`. Fix `attendance.api.ts:80` to `sort=${sort}`. Add a test asserting the query string.
**Warning signs:** Table rows not reordering when sort toggles.

### Pitfall 2: Chart showing 7 rows not a month (D-10)
**What goes wrong:** "This Month Work Hour" plots only the latest 7 desc records.
**Why it happens:** `useAttendance` default `limit = 7` (use-attendance.ts:27,29) feeds `attendancesList` → `GET /user/me` with `limit=7`. Only 7 items come back; the chart maps `data.items` 1:1.
**How to avoid:** Query the full month. Either add a dedicated `useMonthAttendance` hook calling `/user/me` (self) with `startDate`/`endDate` of the month (via a new month-range variant) OR reuse `GET /retrieve` scoped to the user. Prefer a month-specific query so the chart's bounded data matches its "This Month" title. **Do not** just bump limit, and **do not** rely on client-side aggregation of paginated data.
**Warning signs:** Chart X-axis has ≤7 ticks; `CardDescription` shows a single-start date's month concentrated on 7 days.

### Pitfall 3: Export dead-link on re-poll (D-08)
**What goes wrong:** Re-requesting an already-completed report creates a notification whose download action has `undefined` url → dead link.
**Why it happens:** `report.ts:114-119` builds `action.url = data.result?.downloadPath`, but the worker's return value (`job.returnvalue`) is the `action` object itself `{type, label, url, method}` — the key is `url`, not `downloadPath`.
**How to avoid:** Read `data.result?.url`. (Backend fix; the first-delivery path via the worker's own `notifyDownload` is already correct.)
**Warning signs:** Notification "Report" button 404s or does nothing for a re-requested report.

### Pitfall 4: Permissions mirror drift on D-13 (backend guard change)
**What goes wrong:** If `GET /retrieve` or `GET /admin/correction` gain an `authorize()` guard, the frontend `lib/permissions.ts` matrix and the captured counts in `tests/permissions.test.ts` (admin=47, manager=38, user=14, intern=1) drift out of sync, and the mirror test fails (T-02-03).
**Why it happens:** `lib/permissions.ts` is a verbatim mirror of `role-permission.ts`; the test asserts `.size` counts.
**How to avoid:** When the backend guard changes, confirm the *permission itself* already exists in the matrix. `read, attendance` already exists for admin/manager/user; `read, attendance-correction` exists for admin/manager. If no new permission string is added, counts **do not need to change** — only route guards. Verify counts; bump only if a permission is added/removed.
**Warning signs:** `tests/permissions.test.ts` fails after backend change.

### Pitfall 5: Self-service `getAttendance` hits `/user/me`, not `/retrieve`
**What goes wrong:** The self-service chart/table use `GET /api/attendance/user/me` (`allAttendanceController` with `id='me'`), which sorts by `createdAt` (not `date`) and supports page/limit but **no date-range filter**. Adding a "date range" filter that reuses this endpoint won't work — the endpoint ignores range params.
**Why it happens:** `allAttendanceController` (all-attendance.controller.ts:25) queries `{user:id}` with no date clause.
**How to avoid:** For the self-service history date-range filter (D-11), either (a) use `/retrieve` with `startDate/endDate` and filter to the current user client-side (or add `user` param if backend adds it), or (b) confirm backend support. **/user/me does not filter by date.** This is a real constraint the CONTEXT did not flag.

### Pitfall 6: Guard misconception on `(admin)` layout
**What goes wrong:** The `(admin)` layout `RoleGuard` uses `can(r,"write","user")` which is true for **both admin and manager** — not admin-only. Adding the page under `(admin)/` doesn't restrict to admin.
**Why it happens:** Manager has `user:write` in `role-permission.ts` (line 98).
**How to avoid:** Add an explicit page-level `RoleGuard allow={(r) => can(r,"read","attendance")}` (both admin+manager OK). If admin-only is intended, guard distinctly. Both admin and manager have `read, attendance` (intended per ROADMAP "Admin/manager").

## Code Examples

### Get all-employee attendance (range) — verified contract
```ts
// GET /api/attendance/retrieve?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&sort=desc&page=1&limit=10
// (backend get-all-user.controller.ts:12-93 — requires BOTH startDate+endDate OR type=week|month|year)
// Response envelope: ApiResponse.success → { data: AttendanceT[], meta: { page, limit, count, total: pages } }
// Frontend (corrected — D-14):
export const getRangeAttendance = async ({
  sort = "desc", page = 1, limit = 15, startDate, endDate,
}: { sort?: "asc"|"desc"; page?: number; limit?: number; startDate: string; endDate: string }) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/retrieve?startDate=${startDate}&endDate=${endDate}&sort=${sort}&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<AttendanceResponse>(res);
};
// Source: services/attendance.api.ts:72-86 (with $sort→sort fix), get-all-user.controller.ts
```

### Employee drill-down history
```ts
// GET /api/attendance/user/:id?page=1&limit=10
// (all-attendance.controller.ts:9-47 — self/admin/manager only; sorts createdAt desc; NO date-range support)
// meta: { page, limit, count, total: pages } → normalizeList
```

### Export request (self-service, with format) — verified
```ts
// GET /api/attendance/export/report?type=month&includeToday=true&format=pdf|xlsx
// (report.ts:17-29 — format defaults 'pdf'; validated pdf|xlsx)
// Returns { message, data: { jobId, dateRange } } — download arrives via notification action button.
```

### Report worker return value (what D-08 dead-link must read)
```ts
// worker attendance-report.ts:34-49 returns action object; job.returnvalue === this action
const action = { type: "download" as const, label: "Report", url: "/api/attendance/download/<jobId>.pdf", method: "GET" as const };
// Fix in report.ts:114-119: url: data.result?.url   (currently wrongly reads data.result?.downloadPath)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$sort` query param (mongo-style) | `sort` query param (Express) | Backend reads `req.query.sort` | Frontend must send `sort=` (D-14) |
| Per-user export only | (planned) all-employee export | Pending D-15 decision | Needs backend endpoint — out of scope as-is |

**Deprecated/outdated:**
- `components/pagination-footer.tsx` (root) is a thin re-export shim of `components/shared/pagination-footer.tsx`; both import paths work. Prefer `components/shared/` in new code (already what attendance uses).
- `useAttendance` `limit` default of 7 is a footgun for the chart — not deprecated, but the chart must query its own month data rather than share the 7-row list.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Manager should see the "All Attendance" page & nav entry (both admin+manager have `read, attendance`) | Architecture | If admin-only is intended, nav gating differs; low semantic risk — ROADMAP says "Admin/manager" |
| A2 | All-employee export (D-15) is genuinely out-of-scope backend work and must be deferred/separate | D-15 conflict | If the user authorizes backend changes, the phase expands to include backend tasks (new endpoint + worker branch) |
| A3 | Self-service date-range filter (D-11) must switch off `/user/me` (no date support) | Pitfall 5 | If a backend month/range param is later added to `/user/me`, the frontend could stay on that endpoint |

## Open Questions

1. **All-employee admin export (D-15/D-07/ATTD-03) — backend scope decision.**
   - What we know: `GET /export/report` → `exportReportController` → `attendanceReportQueue` job with `user: req.user.id`; worker `fetchParsed` calls `retrieveCustomAttendace(job.data.user, ...)` — strictly single-user (report.ts:19-31, attendance-report.ts:19-31). There is **no** `userId=all` handling and **no** admin/all-employee export endpoint.
   - What's unclear: Whether the user will permit a backend change (REQUIREMENTS.md lists all backend changes OUT OF SCOPE; the CONTEXT D-15 explicitly asks to investigate).
   - Recommendation: **Surface to user.** Options: (a) defer all-employee PDF/XLSX export, deliver self-service XLSX only (ATTD-03 partially); (b) approve a new backend endp/Opoint (e.g., `/export/retrieve` or `userId=all` param) + worker branch; if approved, it lands in `saher-backend` with its own plan, and the frontend admin page triggers it. Do not silently plan backend file changes.

2. **Self-service history date-range filter (D-11) — which endpoint?**
   - What we know: `/user/me` has no date-range support (all-attendance.controller.ts:25). `/retrieve` supports range but returns all employees.
   - What's unclear: Whether backend will add a `user` param to `/retrieve`, or the frontend filters `/user/me` result by date client-side, or uses `/retrieve` + client filter.
   - Recommendation: Simplest in-scope: fetch the user's records via `/user/me` with a larger limit and filter by date range client-side, OR add a dedicated month/range self-service query. Confirm exact choice with planner; server-side range for `/user/me` needs backend work (out of scope).

3. **D-13 guard change — is touching the backend mandatory?**
   - What we know: `GET /retrieve` (route.ts:48) and `GET /admin/correction` (route.ts:63) have **no** `authorize()`; any authenticated user (incl. `intern`, `user`) can call them. This is a genuine authz gap: an `intern` (only `event:read`) can list all employees' attendance.
   - What's unclear: Whether the user will authorize the backend guard fix this phase (also backend out-of-scope by default, but a security fix the objective explicitly flags as in-scope-if-genuine).
   - Recommendation: This is a **genuine** security gap (intern can read all-attendance). Recommend authorizing the guard (`authorize('read','attendance')` on `/retrieve`, `authorize('read','attendance-correction')` on `/admin/correction`). Both permissions already exist for admin/manager. If approved, mirror confirm in `lib/permissions.ts` (already has both) and re-verify `tests/permissions.test.ts` counts (likely unchanged).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | ✓ | 24.19.0 | — |
| pnpm | Install/build | ✓ | 11.22.0 | Corepack |
| Next.js build | Type-check gate | ✓ | 16.1.6 | — |
| saher-backend (sibling) | Contract source + runtime API | ✓ | present (`../saher-backend`) | — (contract read; no local proxy in repo) |
| Redis (backend) | Export BullMQ + caching | presumed | — | Backend-side; not touched by frontend |
| Chromium (backend) | PDF export worker | presumed | — | Backend-side; XLSX needs no Chromium |

**Missing dependencies with no fallback:**
- None for the frontend phase. (Backend runtime Redis/Chromium are backend concerns; frontend only consumes the API + notification feed.)

**Missing dependencies with fallback:**
- None.

## Validation Architecture

> Skipped per `.planning/config.json`: `workflow.nyquist_validation` is explicitly `false`. (Test infra exists — vitest + testing-library + msw — and lint/typecheck are the gate, but the per-phase nyquist validation section is disabled for this config.)

## Security Domain

> `security_enforcement` not disabled in config (absent = enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (proxy guard) | `proxy.ts` cookie presence + backend `protectedRoute` (session JWT) |
| V3 Session Management | yes | Protected by apiFetch 401 single-flight refresh; no new session code here |
| V4 Access Control | **yes — the D-13 gap** | `GET /retrieve` & `GET /admin/correction` lack `authorize()`; recommend `authorize('read','attendance')` / `authorize('read','attendance-correction')` |
| V5 Input Validation | yes | zod schemas (`attendanceSchema`) on frontend reads; backend `validate()` on writes |
| V6 Cryptography | no | No new crypto; downloads served by existing `res.download` |
| V8 Client-side Data Protection | low | `normalizeList` / zod guard malformed server data |

### Known Threat Patterns for Next.js + TanStack Query + attendance API

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Intern/user reads all-employee attendance via unguarded `/retrieve` | Elevation of Privilege | Add `authorize('read','attendance')` to route.ts:48 (D-13) — **confirmed missing** |
| Intern/user reads all corrections via unguarded `/admin/correction` | Elevation of Privilege | Add `authorize('read','attendance-correction')` to route.ts:63 (D-13) — **confirmed missing** |
| Export download path traversal / stale file | Tampering / Info Disclosure | Backend `path.basename` + `fs.stat` 404 on missing (report-download.ts:13-23) — no frontend action needed |

## Sources

### Primary (HIGH confidence) — verified against backend/frontend live source
- `../saher-backend/src/attendance/attendance.route.ts` — all routes + guards (`/retrieve` & `/admin/correction` unguarded)
- `../saher-backend/src/attendance/retrieve/get-all-user.controller.ts` — `/retrieve` contract, `sort` param, meta, requires startDate+endDate OR type
- `../saher-backend/src/attendance/retrieve/all-attendance.controller.ts` — `/user/:id` contract, role check, createdat sort, no date-range
- `../saher-backend/src/attendance/retrieve/today.controller.ts` — `/today` single-day, Redis-cached, admin/manager-only
- `../saher-backend/src/attendance/retrieve/me.controller.ts` — `/me` today status
- `../saher-backend/src/attendance/export/report.ts` — format validation, job enqueue, `downloadPath` dead-link bug (lines 114-119)
- `../saher-backend/src/attendance/export/report-download.ts` — download controller
- `../saher-backend/src/attendance/export/excel.service.ts` — XLSX layout (per-user rows; `data[0]?.user`)
- `../saher-backend/src/attendance/worker/attendance-report.ts` — worker return value (the `{type,label,url,method}` action), per-user fetch
- `../saher-backend/src/attendance/attendance.service.ts` — `retrieveCustomAttendace` per-user
- `../saher-backend/src/permission/authorize.ts` + `role-permission.ts` — RBAC, `read,attendance` for admin/manager/user
- `../saher-backend/src/libs/middleware/protected-route.ts` + `app.ts` — `protectedRoute` mount at `/api/attendance`
- Frontend: `services/attendance.api.ts`, `hooks/use-attendance.ts`, `features/attendance/*.tsx`, `features/dashboard/today-attendance-table.tsx`, `range-attendance-table.tsx`, `features/dashboard/attendance-grid/attendance-toolbar.tsx`, `components/sidebar/nav-list.tsx`, `app/(main)/(admin)/layout.tsx`, `payroll/page.tsx`, `components/shared/pagination-footer.tsx`, `lib/normalize-list.ts`, `lib/permissions.ts`, `tests/permissions.test.ts`, `tests/nav-list.test.tsx`

### Secondary (MEDIUM confidence)
- None needed — all critical claims verified directly against source (HIGH). No WebSearch required.

### Tertiary (LOW confidence)
- None — no unverified ecosystem claims relied upon.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all packages already installed + `[OK]` via slopcheck; versions from live `package.json`.
- Architecture: **HIGH** — every endpoint contract, guard, meta shape, and export path read from live source.
- Pitfalls: **HIGH** — bugs D-08/D-10/D-13/D-14 confirmed by direct code reading (file:line cited).

**Research date:** 2026-09-01
**Valid until:** 2026-10-01 (~30 days, stable — backend contracts are deployed/canonical).

## Corrections to 09-CONTEXT.md

1. **File paths in CONTEXT are stale.** CONTEXT and canonical_refs reference `src/attendance/controllers/*.ts`, but the real structure is `src/attendance/retrieve/*.controller.ts` (`get-all-user.controller.ts`, `all-attendance.controller.ts`, `today.controller.ts`) and `src/attendance/export/*` + `src/worker/attendance-report.ts`. The route imports confirm the `retrieve/` location (`attendance.route.ts:33-38`). Verify paths before editing.
2. **D-15 "no new endpoint needed" premise (§Domain) is FALSE.** The Domain says "No new backend endpoints needed — all data already exists." For **reads** (retrieve/user history) that's true. But **all-employee export does NOT exist** — the export is per-user hard-wired. Admin all-employee export genuinely needs a new backend endpoint/param + worker change.
3. **D-07 phrasing ("may need separate endpoint or userId=all") is understated.** Live code proves there is no `userId=all`; the worker filters on `job.data.user` (single id). It's a mandatory backend addition, not a possibility.
4. **`attendance-status.tsx` D-12 is lower-risk than implied.** The card already shows date, in/out times, work-hours, and a status chip. The "clarity" pass is cosmetic (the CONTEXT even says "existing UI is functional"). Scope it as a light improvement, not a rewrite.
5. **Nav gating nuance (D-05) not captured in CONTEXT.** `(admin)/` layout admits both admin AND manager (both `write,user`). The market nav "Admin" group renders only when `can(role,'delete','account')` (admin-only). To surface "All Attendance" to both admin+manager, add it to `managerRoutes` (which render for both) or widen admin-gating; a plain `adminRoutes` entry would be admin-only. (Best: add to `managerRoutes` since the page is gated by `read, attendance`, which manager has.) Planner must reconcile "under admin section" (D-05) with the two-group display reality.
6. **Self-service `/user/me` has NO date-range filter** — CONTEXT D-11 assumed the history table's filter can be built on the existing hook. The hook's endpoint can't range-filter. This is an unstated constraint (see Pitfall 5 / Open Q2).
