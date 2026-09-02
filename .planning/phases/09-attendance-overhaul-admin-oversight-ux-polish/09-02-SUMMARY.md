---
phase: 09-attendance-overhaul-admin-oversight-ux-polish
plan: 02
subsystem: ui
tags: [attendance, admin, table, export, drill-down]

requires:
  - phase: 09-01
    provides: authorized /retrieve, /today, /user/:id backend, all-employees export (?userId=all), getRangeAttendance/getTodayAttendance/getAttendanceByUserId, "All Attendance" nav entry
provides:
  - Admin/manager "All Attendance" page at /attendance/all with Range/Today/Monthly views
  - Client-side employee filter (UserSearchPicker single-select) across all views
  - Paginated all-employees table (employee/date/in/out/hours/status/late/overtime columns)
  - Employee drill-down Sheet via /user/:id
  - Admin export dropdown (PDF/XLSX) wired to GET /api/attendance/export/report?userId=all
affects: [09-attendance-overhaul-admin-oversight-ux-polish]

tech-stack:
  added: []
  patterns:
    - "Admin query hooks collapsed into hooks/use-admin-attendance.ts (range/today/monthly/user-history) with 60s staleTime"
    - "D-23 render-phase page reset on view change (handleViewChange), not useEffect"
    - "react-table useReactTable with getCoreRowModel (no sort/filter models — server sides sort)"

key-files:
  created:
    - app/(main)/(admin)/attendance/all/page.tsx
    - features/attendance/admin/admin-attendance-page.tsx
    - features/attendance/admin/admin-attendance-table.tsx
    - features/attendance/admin/admin-attendance-columns.tsx
    - hooks/use-admin-attendance.ts
    - features/attendance/admin/employee-attendance-sheet.tsx
  modified: []

key-decisions:
  - "Employee filter is client-side (attendance.user.id) — /retrieve has no server per-user param"
  - "All-employees export uses type=month+format+userId=all, admin/manager-only backend gate (09-01)"
  - "Export format is a checkbox pair + Generate action inside a DropdownMenu"
  - "View switcher labels are literal strings (Range/Today/Monthly) for greppable contract check"

patterns-established:
  - "Admin oversight table: plain react-table over normalizeList data, no client-side row models"

requirements-completed: [ATTD-01, ATTD-02]

duration: 25 min
completed: 2026-09-02
---

# Phase 9 Plan 2: Admin "All Attendance" Page Summary

**Built the admin/manager "All Attendance" page at /attendance/all with Range/Today/Monthly views, a client-side employee filter across all views, a paginated all-employees table, employee history Sheet drill-down, and a PDF/XLSX export dropdown driving the all-employees backend endpoint (?userId=all).**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-02
- **Completed:** 2026-09-02
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

1. **Route page** (`app/(main)/(admin)/attendance/all/page.tsx`) — `RoleGuard allow={(r) => can(r, "read", "attendance")}`, renders `AdminAttendancePage`. Lives at `/attendance/all` to avoid URL collision with the self-service page. The `(admin)/layout.tsx` already guards `can(r, "write", "user")` (both admin+manager pass).
2. **Query hooks** (`hooks/use-admin-attendance.ts`) — `useAdminAttendance` (range via `/retrieve`), `useTodayAttendance` (`/today`), `useMonthlyAttendance` (computes IST month start/end via `dateToIstDateOnly` then `/retrieve`), `useEmployeeAttendance` (`/user/:id`, disabled when no userId). All 60s staleTime.
3. **Admin table** (`admin-attendance-table.tsx`) — react-table instance (`getCoreRowModel`), Card with refresh + `PaginationFooter`, columns: employee (avatar+name+email), date, check-in/out, work hours, status badge, late badge, overtime badge. Loading `<DefaultLoader>`, empty `<NoData>`. Clickable rows.
4. **Columns** (`admin-attendance-columns.tsx`) — `getAdminAttendanceColumns(onRowClick)`, `verify` variant for overtime badge, `--` muted when no overtime, status via `attendanceStatusVariant`.
5. **Admin page** (`admin-attendance-page.tsx`) — view switcher (Range/Today/Monthly), Range/monthly toolbar with date inputs (or month/year Selects), employee `UserSearchPicker` (single-select), Apply/Reset, all-employees export DropdownMenu (PDF/XLSX checkboxes + Generate), drill-down Sheet wiring. Page reset handled in `handleViewChange` (D-23).
6. **Employee drill-down Sheet** (`employee-attendance-sheet.tsx`) — `useEmployeeAttendance(userId, page)`, tabular history, `PaginationFooter`, page reset on userId change (with set-state-in-effect disable per D-23 pattern).

## Key Decisions

- Client-side employee filter because `/retrieve` returns all employees with no per-user server param.
- Export dropdown with checkbox format toggle + explicit Generate (matches D-26 disable/isGenerating pattern).
- View labels as literal strings for greppable contract verification.

## Verification

- `pnpm lint` — 0 errors.
- `npx tsc --noEmit` — no errors in the 6 new files (2 pre-existing test-file errors in handle-bill/record-payment dialogs remain, unrelated to this plan).
- `pnpm test` — 428/428 pass.
- Greps confirm: RoleGuard + `read,attendance`, all 4 hooks, Range/Today/Monthly literal labels, startDate filter, UserSearchPicker employee filter, employeeId wiring, `userId=all` export endpoint, PaginationFooter.

## Open Follow-ups

- Plan 09-03 (self-service UX fixes) is independent (mainly `features/attendance/*` + `hooks/use-attendance.ts`) and does not depend on this plan's page.
