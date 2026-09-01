# Phase 9: Attendance Overhaul — Admin Oversight & UX Polish - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 14 (8 modified, 6 new)
**Analogs found:** 14 / 14

## Note on scope

Per RESEARCH (owner-authorized scope expansion), **backend** work in `../saher-backend`
(D-08 dead-link, D-13 guards, D-15 admin export, check-in/out mapping, overtime cron) is
in-scope for this phase and gets its own plans. This PATTERNS.md maps the **frontend**
files (this repo) against frontend analogs. Backend changes follow the `saher-backend`
repo's own patterns (NestJS controllers/guards — reference `attendance.route.ts`,
`get-all-user.controller.ts`, `all-attendance.controller.ts`, `export/report.ts` there).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(main)/(admin)/attendance/page.tsx` (new) | route/controller | request-response | `app/(main)/(admin)/payroll/page.tsx` | exact |
| `features/attendance/admin/admin-attendance-page.tsx` (new) | component | request-response | `app/(main)/(admin)/payroll/page.tsx` (filter selectors) + `features/dashboard/attendance-grid/attendance-toolbar.tsx` (date range) | role-match |
| `features/attendance/admin/admin-attendance-table.tsx` (new) | component | CRUD (read) | `features/dashboard/range-attendance-table.tsx` | exact |
| `features/attendance/admin/admin-attendance-columns.tsx` (new) | component | CRUD (read) | `features/users/data-table.tsx` + `range-attendance-table.tsx` cell/date patterns | role-match |
| `features/attendance/admin/employee-attendance-sheet.tsx` (new) | component | request-response | `features/attendance/attendance-correction.tsx` (Sheet pattern) + `features/attendance/attendance-table.tsx` (rows) | role-match |
| `hooks/use-admin-attendance.ts` (new) | hook | CRUD (read) | `hooks/use-payroll.ts` (list+page) / `hooks/use-attendance.ts` | exact |
| `services/attendance.api.ts` (modify) | service | CRUD | itself (existing fns) | exact |
| `hooks/use-attendance.ts` (modify) | hook | CRUD | itself (chart data fix) | exact |
| `features/attendance/attendance-chart.tsx` (modify) | component | request-response | itself (`ChartContainer`+`BarChart`) | exact |
| `features/attendance/attendance-table.tsx` (modify) | component | request-response | itself (+ date inputs from `attendance-toolbar.tsx`) | exact |
| `features/attendance/attendance-status.tsx` (modify) | component | request-response | itself | exact |
| `features/attendance/attendance-report.tsx` (modify) | component | event-driven (async export trigger) | itself | exact |
| `components/sidebar/nav-list.tsx` (modify) | component | request-response | itself (`managerRoutes`/`adminRoutes` arrays) | exact |
| `tests/permissions.test.ts`, `tests/nav-list.test.tsx` (modify) | test | — | themselves | exact |

## Pattern Assignments

### `app/(main)/(admin)/attendance/page.tsx` (route/controller, request-response)

**Analog:** `app/(main)/(admin)/payroll/page.tsx`

**Imports + RoleGuard pattern** (`app/(main)/(admin)/payroll/page.tsx:1-33, 92-100`):
```tsx
"use client";
import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";
// ... ui primitives ...
export default function AdminAttendancePage() {
  const [page, setPage] = useState<number>(1);
  // filters, handlers ...
  return (
    <RoleGuard allow={(r) => can(r, "read", "attendance")}>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">...</h1>
          <p className="text-muted-foreground">...</p>
        </div>
        {/* toolbar + table compose here */}
      </div>
    </RoleGuard>
  );
}
```
> **IMPORTANT (Pitfall 6):** The `(admin)/layout.tsx` guard is `can(r, "write", "user")` (true for both admin AND manager). Add an **explicit page-level** `<RoleGuard allow={(r) => can(r, "read", "attendance")}>` to scope to admin+manager (both have `read, attendance`). See `lib/permissions.ts:32-33,81-82,121`.

**Filter reset on change** (`payroll/page.tsx:68-72`):
```tsx
useEffect(() => {
  setPage(1); // reset page when filters change
}, [year, month]);
```

**Dashboard composition with three views** (Today / Range / Monthly per RESEARCH scope expansion): page holds tab/view state, delegates table + toolbar to feature components (mirror how payroll page delegates to `PayrollTable`).

### `features/attendance/admin/admin-attendance-page.tsx` (component, request-response)

**Analog (date-range toolbar):** `features/dashboard/attendance-grid/attendance-toolbar.tsx`

**Two native date inputs, IST-only** (`attendance-toolbar.tsx:50-73` — the proven pattern; no range-picker primitive exists):
```tsx
<Field>
  <FieldLabel htmlFor="start-date">Start Date</FieldLabel>
  <Input id="start-date" type="date" value={startDate} max={endDate}
    onChange={(e) => setStartDate(e.target.value)} />
</Field>
<Field>
  <FieldLabel htmlFor="end-date">End Date</FieldLabel>
  <Input id="end-date" type="date" value={endDate} min={startDate}
    onChange={(e) => setEndDate(e.target.value)} />
</Field>
```
Manage `startDate`/`endDate` as `YYYY-MM-DD` IST strings via `dateToIstDateOnly` / `istDateOnlyToDate` from `lib/date.ts` (see `range-attendance-table.tsx:65-71` for the init pattern).

**Analog (view/filter selectors):** `app/(main)/(admin)/payroll/page.tsx:102-131` — `<Select>` year/month filters. Reuse for the view tab switch (Range/Today/Monthly) and employee filter.

### `features/attendance/admin/admin-attendance-table.tsx` (component, CRUD read)

**Analog:** `features/dashboard/range-attendance-table.tsx` (all-employee, per-user rows + status + actions)

**Ranking note:** `range-attendance-table.tsx` is the closest all-employee table but carries the `$sort` bug (D-14) and only single-day nav. RESEARCH says **rebuild fresh** reusing its cell/row/date patterns. The `today-attendance-table.tsx` (lines 133-185) shows the same columns/status rendering.

**Core table pattern** (`range-attendance-table.tsx:119-190` — Header/columns; `191-308` rows):
```tsx
<CardHeader className="flex items-center justify-between flex-wrap">
  <CardTitle>Users Attendances</CardTitle>
  <CardAction className="flex gap-2">
    <Button variant="outline" disabled={isRefetching} onClick={() => refetch()}>
      <RotateCw />
    </Button>
    <PaginationFooter page={data?.page ?? page} totalPages={data?.totalPages ?? 0}
      onPageChange={setPage} />
  </CardAction>
</CardHeader>
<CardContent>
  <Table>
    {/* TableHead: User / Date / Check In / Check Out / Work Hours / Status / Late / Action */}
    {/* TableCell: Avatar+name+email (lines 136-153), formatIstDate (154), formatIstDateTime (157-162), formatHours (163), status Badge (166-173), late Badge (174-182) */}
  </Table>
</CardContent>
```

**Status badge variant map** (`features/attendance/attendance-table.tsx:34-43` — exported `attendanceStatusVariant`):
```tsx
export const attendanceStatusVariant: Record<
  "half-day" | "present" | "absent" | "week-off" | "on-leave",
  "outline-warn" | "outline-success" | "destructive" | "default"
> = {
  "half-day": "outline-warn", present: "outline-success", absent: "destructive",
  "week-off": "default", "on-leave": "default",
};
```

**Data hook wiring** — use the corrected `getRangeAttendance` via the new `use-admin-attendance` hook (NOT raw `useQuery`):
```tsx
// queryKey pattern (range-attendance-table.tsx:75-86), but send sort= per D-14 fix:
queryKey: ["attendance", "range", limit, page, dateType, startDate, endDate],
queryFn: () => getRangeAttendance({ startDate, endDate, limit, page, sort }),
```
> Today view uses `getTodayAttendance` (`/today`, `today-attendance-table.tsx:64-67`); Monthly view fits the `type=week|month|year` param on `/retrieve` (get-all-user.controller requires `startDate+endDate` **OR** `type`).

### `features/attendance/admin/admin-attendance-columns.tsx` (component, CRUD read)

**Analog:** `features/users/data-table.tsx` (TanStack `ColumnDef[]`) + cell renderers from `range-attendance-table.tsx`.

**Column model** (`features/users/data-table.tsx:3-14` imports; `52-67` `useReactTable`):
```tsx
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
```
**Note:** column definition can be simpler than `UserDataTable`. The all-employee attendance table needs columns: Employee Name (custom Avatar cell), Date, Check-In, Check-Out, Status, Hours Worked. Reuse the Avatar+status cell JSX from `range-attendance-table.tsx` rather than a generic templated `UserDataTable` (which is user-specific). Employee Name cell click → opens `employee-attendance-sheet` (drill-down D-04).

**Pagination bound to `normalizeList`** (`data-table.tsx:163-169`):
```tsx
<PaginationFooter page={table.getState().pagination.pageIndex + 1}
  totalPages={table.getPageCount()} onPageChange={(p) => table.setPageIndex(p - 1)} />
```

### `features/attendance/admin/employee-attendance-sheet.tsx` (component, request-response)

**Analog (Sheet shell):** `features/attendance/attendance-correction.tsx:105-120, 223-231`

**Drill-down via `GET /api/attendance/user/:id`** — new service fn needed (see service section). Sheet pattern:
```tsx
<Sheet open={visible} onOpenChange={setVisible}>
  <SheetTrigger asChild><Button variant="ghost">...</Button></SheetTrigger>
  <SheetContent className="overflow-scroll">
    <SheetHeader>
      <SheetTitle>{employee.name}</SheetTitle>
      <SheetDescription>{employee.email}</SheetDescription>
    </SheetHeader>
    {/* table of attendance-history rows, rows reuse attendance-table.tsx:104-136 body */}
    <SheetFooter>...</SheetFooter>
  </SheetContent>
</Sheet>
```
Table body reuse: `features/attendance/attendance-table.tsx:104-136` (Date / Check In / Check Out / Work Hours / Status / Late).

### `hooks/use-admin-attendance.ts` (hook, CRUD read)

**Analog:** `hooks/use-payroll.ts` (filtered list + page) and `hooks/use-attendance.ts` (query wiring).

**Hook shape** (`use-payroll.ts:13-40` — list query keyed by filters + page; `use-attendance.ts:25-100`):
```ts
export const useAdminAttendance = (
  filters: { startDate?: string; endDate?: string; type?: "today"|"week"|"month"|"year"; userId?: string },
  page = 1,
  limit = 10,
) => {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["attendance", "admin", filters, page],   // distinct key family from self-service ["attendance","list",...]
    queryFn: () => getRangeAttendance({ ...filters, page, limit }),  // corrected sort= (D-14)
    staleTime: 60 * 60 * 4,
  });
  return { list };
};
// separate drill-down query (mirror usePayrollByUser at use-payroll.ts:42-47, enabled: !!id)
export const useEmployeeAttendance = (userId: string | null, page = 1) =>
  useQuery({ queryKey: ["attendance", "user-history", userId, page],
    queryFn: () => getAttendanceByUserId(userId ?? "", page), enabled: !!userId });
```
> Anti-pattern: do NOT reuse self-service `["attendance","list",...]` key (collision + different endpoint).

### `services/attendance.api.ts` (modify, service)

**Fix D-14** (`attendance.api.ts:72-86`, change `$sort` → `sort`):
```ts
export const getRangeAttendance = async ({
  sort = "desc", page = 1, limit = 15, startDate, endDate,
}: DefaultProps & { startDate: string; endDate: string }) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/retrieve?startDate=${startDate}&endDate=${endDate}&sort=${sort}&page=${page}&limit=${limit}`,  // ← sort= not $sort=
    { method: "GET" },
  );
  return normalizeList<AttendanceResponse>(res);
};
```

**Add drill-down fn** (mirrors `getAttendance` at `attendance.api.ts:44-56`, but `/user/:id` not `/user/me`):
```ts
export const getAttendanceByUserId = async (id: string, page = 1, limit = 10) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/${id}?sort=desc&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<AttendanceResponse>(res);
};
```
> Reuse existing `attendanceSchema` (lines 7-17) + `AttendanceResponse` (`z.infer`, line 25) for both. All calls go through `apiFetch` (lines 1, 29-56) + `normalizeList` (line 3, 55) — never bare fetch.

**Self-service month chart query (D-10)** — add a month variant surfaced by `useAttendance` so the chart's data is bounded (see Pitfall 2); do not just bump `limit=7`.

### `hooks/use-attendance.ts` (modify, hook)

**Chart data fix (D-10 root cause)** (`use-attendance.ts:25-40`): default `limit = 7` (line 26) feeds `GET /user/me` → only 7 rows. The chart needs a **full-month** query. Add a distinct query (e.g. `monthlyList`) keyed `["attendance","month",startDate,endDate]` calling a month-scoped service fn, so the chart maps that bounded set. Keep the existing `attendancesList` (7-row) for other cards. Do not change the mutation/invalidate behavior (lines 42-67, invalidate `["attendance"]`).

### `features/attendance/attendance-chart.tsx` (modify, component)

**Analog:** itself. Keep recharts `BarChart` + `ChartContainer` (lines 63-89). Change data source from `useAttendance().attendancesList` (line 36) to the new month query; fix the title/label (lines 59-60) to match actual range. `formatIstDate`/`getMonthYear` already imported (line 19).

### `features/attendance/attendance-table.tsx` (modify, component)

**Add date-range filter (D-11) + PaginationFooter** (already present at lines 83-87). Two native date inputs (pattern from `attendance-toolbar.tsx:50-73`) in the `CardHeader` actio/area, feeding new `startDate`/`endDate` state. **Constraint (Pitfall 5):** `useAttendance`/`/user/me` has NO date-range support. Simplest in-scope: fetch a larger limit and filter client-side, OR use `/retrieve` scoped to current user — confirm exact choice with planner (Open Q2). Rows/status rendering unchanged (lines 104-136; the `attendanceStatusVariant` map at 34-43 stays).

### `features/attendance/attendance-status.tsx` (modify, component)

**Analog:** itself. D-12 is a **light clarity pass** (RESEARCH correction #4 — already functional). Keep `Card` structure + `formatIstDate`/`istTime`/`formatHours` (lines 69-87). Pin the check-in/out timestamp display (`istTime(data.inTime)` line 69, `istTime(data.outTime)` line 78) and status chip (lines 55-59). No structural rewrite.

### `features/attendance/attendance-report.tsx` (modify, component, event-driven trigger)

**Add format selector (D-06).** Current `generateReport(query)` builds `URLSearchParams` and GETs `/api/attendance/export/report` (lines 32-49). Add `format` to the query (backend validates `pdf|xlsx`, defaults pdf — RESEARCH verified). Extend `generateReport` calls (lines 62-96) to include `format: "pdf" | "xlsx"`. Backend delivery stays via notification action button (Pattern 3) — no delivery-pipeline change.

### `components/sidebar/nav-list.tsx` (modify, component)

**Add "All Attendance" nav entry (D-05).** The scriptural reality (RESEARCH correction #5 + Pitfall 6): "Manager" group renders when `canSeeManagerGroup` is true (both admin+manager), and the `(admin)/` page is gated by `read, attendance` (which **manager** has). To surface to both admin AND manager, add the entry to `managerRoutes` (lines 85-106) — NOT the admin-only `adminRoutes` (gated by `can(role,"delete","account")`, line 132-134, admin-only). Add a `canSeeManagerGroup` case (lines 121-130):
```ts
if (r.url === "/attendance") return can(role, "read", "attendance");
```
Use an attendance icon already imported (e.g. `CalendarCheck` or a new `ClipboardCheck` import from lucide).

### `tests/permissions.test.ts` + `tests/nav-list.test.tsx` (modify, test)

**Permissions mirror (D-13):** The frontend matrix in `lib/permissions.ts` already has `read, attendance` (line 32-33) and `read, attendance-correction` (line 33). Backend guard change (D-13) adds **no new permission string**, so `ROLE_PERMISSIONS.*.size` counts (admin=47, manager=38, user=14, intern=1 — `permissions.test.ts:6-20`) **do not change** unless a string is added. Verify, bump only if needed (Pitfall 4).

**Nav test:** `tests/nav-list.test.tsx:62-105` asserts group visibility per role. Add assertions that manager/admin see the "All Attendance" link (it lives in `managerRoutes`). The test mocking pattern (mock `@/hooks/use-me` + `@/components/ui/sidebar`, lines 10-49) and `wrapper` with QueryClient (lines 51-60) stays.

## Pattern Assignments — Backend (`../saher-backend`, for reference)

These are in-scope per owner expansion but map to **backend** analogs (not this repo). Planner should reference:
- **D-08 dead-link** (`src/attendance/export/report.ts:114-119`): read `data.result?.url` (worker return is the `{type,label,url,method}` action — RESEARCH source confirms worker `attendance-report.ts:34-49`).
- **D-13 guards** (`src/attendance/attendance.route.ts:48,63`): add `authorize('read','attendance')` / `authorize('read','attendance-correction')`.
- **D-15 admin export**: new endpoint or `userId=all` + worker branch (per-user hard-wired today).
- Mirror any **permission-string** change into `lib/permissions.ts` + assert counts in `tests/permissions.test.ts`.

## Shared Patterns

### Definition of a Database of shared cross-cutting concerns
**Source:** all files above
These are already-solved utilities (Phase 2) — **never rebuild**:

| Concern | Source | Apply to |
|---------|--------|----------|
| HTTP envelope + 401 refresh + toasts | `lib/api-wrapper.ts` (`apiFetch`) | All new service fns |
| List normalization `{data,meta}→{items,page,totalPages,...}` | `lib/normalize-list.ts` (`normalizeList`) | All list/query fns (`/retrieve`, `/user/:id`) |
| IST date formatting/parsing | `lib/date.ts` (`formatIstDate`, `formatIstDateTime`, `formatHours`, `dateToIstDateOnly`, `istDateOnlyToDate`, `getMonthYear`) | All date rendering + query params |
| Pagination | `components/shared/pagination-footer.tsx` (`PaginationFooter`) | All paginated tables |
| RBAC affordances | `lib/permissions.ts` (`can`) + `components/role-guard.tsx` | Admin page + nav gating |
| Response typing | `attendanceSchema` + `z.infer` (`services/attendance.api.ts:7-25`) | New service fns |

### Authentication / Authorization
**Source:** `components/role-guard.tsx:13-32` + `lib/permissions.ts`
**Apply to:** `app/(main)/(admin)/attendance/page.tsx`
```tsx
<RoleGuard allow={(r) => can(r, "read", "attendance")}>{children}</RoleGuard>
```
Every admin page adds its own explicit `RoleGuard` on top of the `(admin)/` layout guard (Pitfall 6: layout guard admits manager too).

### Error Handling
**Source:** `attendance-report.tsx:41-49` + `range-attendance-table.tsx` 
**Apply to:** All export triggers + admin table feedback
```tsx
const res = await apiFetch<...>(url, { method: "GET" });
if (!res.success) toast.error(res.message);
toast.success(res.message);
```
Mutations: `onError: (err: Error) => toast.error(err.message)` / `onSuccess` invalidate + toast (`attendance-correction.tsx:95-102`, `use-attendance.ts:42-67`).

### Loading / Empty states
**Source:** `components/loading.tsx` (`DefaultLoader`), `components/no-data.tsx` (`NoData`)
**Apply to:** Admin table, self-service tables, drill-down sheet
```tsx
if (isLoading) return <DefaultLoader className={className} />;
if (!attendances || attendances.length === 0) return <NoData ... />;  // range-attendance-table.tsx:115, today-attendance-table.tsx:71-79
```

### Data flow anti-patterns to avoid (RESEARCH)
- Always send `sort=` not `$sort=` (D-14).
- Use `/retrieve` (range) for the admin page, NOT `/today` (single-day + cached).
- Always run list responses through `normalizeList` (don't hand-map `count`/`total`).
- Month chart must query server-side bounded set, never `limit=9999` client aggregation.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All 14 frontend files have an exact or role-match analog in-repo |

## Metadata

**Analog search scope:** `app/(main)/(admin)/`, `app/(main)/attendance/`, `features/attendance/*`, `features/dashboard/*`, `features/payroll/*`, `features/users/*`, `hooks/*`, `services/*`, `components/sidebar/*`, `components/shared/*`, `lib/*`, `tests/*`
**Files scanned:** ~25
**Pattern extraction date:** 2026-09-01
