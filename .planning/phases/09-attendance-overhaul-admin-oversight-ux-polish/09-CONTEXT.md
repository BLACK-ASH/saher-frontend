# Phase 9: Attendance Overhaul — Admin Oversight & UX Polish - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin/manager gets a dedicated "All Attendance" page (filterable table of all employees' attendance records), export works for both self-service and admin (PDF/XLSX), and the self-service attendance page becomes genuinely user-friendly — correct chart, working filters, clean layout. No new backend endpoints needed — all data already exists in the API.

</domain>

<decisions>
## Implementation Decisions

### Admin Attendance Page — Structure
- **D-01:** New dedicated page at `app/(main)/(admin)/attendance/page.tsx` with RoleGuard (`can('read', 'attendance')` or similar). Separate from the dashboard — clean navigation, dedicated to attendance oversight.
- **D-02:** Filterable table layout. Columns: Employee Name, Date, Check-In, Check-Out, Status (present/absent/half-day/late/week-off/on-leave), Hours Worked. Filters: employee search/selector, date range picker. Paginated via PaginationFooter.
- **D-03:** Data source: `GET /api/attendance/retrieve` (backend `getAllUserController`) — returns all employees' attendance across a date range. Already exists, no backend changes needed for the query itself.
- **D-04:** Employee drill-down: clicking an employee row opens their full attendance history via `GET /api/attendance/user/:id` (backend `allAttendanceController`). This can be a dialog or a sub-page.
- **D-05:** Sidebar nav entry: "All Attendance" under admin section in `components/sidebar/nav-list.tsx`, gated by `can()` permission check.

### Export — Self-Service + Admin
- **D-06:** Self-service export: add format selector (PDF / XLSX) to `features/attendance/attendance-report.tsx`. Currently only sends PDF — add `format` query param to the export request. Backend already supports both via BullMQ worker.
- **D-07:** Admin export: add export button on the admin attendance page that exports all employees' attendance for the selected date range. Backend `GET /api/attendance/export/report` is per-user — may need a separate admin export endpoint or a `userId=all` parameter. Investigate backend contract.
- **D-08:** Fix the cached export dead-link bug: `export/report.ts:114-119` reads `data.result?.downloadPath` but the worker returns an action object `{type, label, url, method}`. The `downloadPath` key doesn't exist — fix to read the correct field from the job return value.
- **D-09:** Export delivers via notification action button (existing pattern). No changes to the notification delivery pipeline.

### Self-Service UX Fixes
- **D-10:** Fix chart: `attendance-chart.tsx` is titled "This Month Work Hour" but shows only the latest 7 desc records. Fix: query full month data (change limit/offset), correct the label to match actual data range.
- **D-11:** Add date-range filter on the self-service history table (`attendance-table.tsx`). Currently shows paginated list with no filter — add start/end date inputs to filter by range.
- **D-12:** Improve status display: ensure the check-in/out status card (`attendance-status.tsx`) clearly shows current state with timestamps. The existing UI is functional but could be clearer.

### Backend Fixes (saher-backend)
- **D-13:** Add `authorize()` guard to `GET /api/attendance/retrieve` (all employees) and `GET /api/attendance/admin/correction` (all corrections). Currently these rely only on `protectedRoute` — any authenticated user can hit admin endpoints directly.
- **D-14:** Fix `$sort` vs `sort` query param mismatch: frontend `services/attendance.api.ts:80` sends `$sort=desc` but backend `getAllUserController` reads `req.query.sort`. Align frontend to send `sort=desc`.
- **D-15:** Investigate whether admin export (all employees) needs a new backend endpoint or if the existing `GET /api/attendance/export/report` can accept a `userId=all` parameter.

### Cross-Cutting
- **D-16:** IST date handling via `lib/date.ts` for all date rendering/parsing (Phase 2 decision).
- **D-17:** PaginationFooter for all paginated tables (Phase 2 decision D-20).
- **D-18:** Follow existing admin page patterns: `app/(main)/(admin)/` with RoleGuard, consistent with Phase 6 admin pages.

### the agent's Discretion
- Exact table column widths and sorting defaults
- Whether employee drill-down is a dialog or sub-page
- Date range picker component choice (existing calendar date picker or new range picker)
- Test scope (minimum: lint/typecheck green)
- Whether to un-comment the existing `RangeAttendanceTable` or build fresh

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contracts (saher-backend)
- `../saher-backend/src/attendance/attendance.route.ts` — All attendance endpoints, guards, validation
- `../saher-backend/src/attendance/controllers/get-all-user.ts` — `GET /retrieve` controller (all employees, date/type range)
- `../saher-backend/src/attendance/controllers/all-attendance.ts` — `GET /user/:id` controller (single user history)
- `../saher-backend/src/attendance/controllers/today.controller.ts` — `GET /today` controller (all employees today)
- `../saher-backend/src/attendance/controllers/export/report.ts` — Export job creation (BullMQ)
- `../saher-backend/src/attendance/controllers/export/report-download.ts` — Export file download
- `../saher-backend/src/attendance/controllers/export/excel.service.ts` — XLSX layout
- `../saher-backend/src/attendance/worker/attendance-report.ts` — PDF/XLSX generation worker
- `../saher-backend/src/permission/role-permission.ts` — Permission matrix (attendance resource)

### Frontend code (this repo)
- `app/(main)/attendance/page.tsx` — Self-service attendance page (renders 4 components)
- `features/attendance/attendance-status.tsx` — Check-in/out card
- `features/attendance/attendance-table.tsx` — Own history paginated table
- `features/attendance/attendance-chart.tsx` — Work-hour bar chart (misleading, needs fix)
- `features/attendance/attendance-report.tsx` — Export dropdown (per-user only, no format selector)
- `features/attendance/attendance-correction.tsx` — Correction request sheet
- `features/attendance/attendance-correction-requests.tsx` — Own correction requests list
- `features/dashboard/today-attendance-table.tsx` — All employees today (exists, used on dashboard)
- `features/dashboard/range-attendance-table.tsx` — All employees by range (exists but COMMENTED OUT)
- `features/dashboard/attendance-grid/*` — Users×dates matrix (exists on dashboard)
- `hooks/use-attendance.ts` — React-query hooks for self-service attendance
- `services/attendance.api.ts` — Service layer + schemas (note: `$sort` bug at line 80)
- `components/sidebar/nav-list.tsx` — Navigation entries (needs admin "All Attendance" entry)

### Prior decisions
- `.planning/phases/02-shared-infrastructure-session-reliability/02-CONTEXT.md` — D-18: IST dates, D-20: PaginationFooter
- `.planning/phases/08-bug-fixes-calendar-overhaul/08-CONTEXT.md` — Bug fix patterns (AlertDialog, error handling)

### Requirements
- `.planning/ROADMAP.md` §Phase 9 — Success criteria 1–5

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `features/dashboard/today-attendance-table.tsx` — All-employee today table (can reuse column definitions and status rendering for admin page)
- `features/dashboard/range-attendance-table.tsx` — All-employee range table (built but commented out — evaluate for reuse or rebuild)
- `features/dashboard/attendance-grid/*` — Attendance matrix (toolbar with date-range picker, summary stats — reuse date picker pattern)
- `hooks/use-attendance.ts` — Self-service hooks (extend with admin queries or create `use-admin-attendance.ts`)
- `services/attendance.api.ts` — Service layer (add admin endpoints, fix `$sort` bug)
- `components/ui/table.tsx` — shadcn Table for admin table layout
- `components/ui/date-range-picker.tsx` — If exists, reuse for filters; otherwise use two `components/ui/calendar.tsx`
- `components/pagination-footer.tsx` — PaginationFooter for admin table

### Established Patterns
- Admin routes: `app/(main)/(admin)/` with RoleGuard
- Tables: TanStack Table with column definitions in sibling `column.tsx` (see `features/users/data-table.tsx`)
- Filters: client-side state, debounced search, date range via calendar pickers
- Export: async via BullMQ → notification action button → download link
- IST dates: all rendering through `lib/date.ts`

### Integration Points
- `app/(main)/(admin)/attendance/page.tsx` — New admin attendance page
- `components/sidebar/nav-list.tsx` — Add "All Attendance" nav entry for admin
- `features/attendance/attendance-chart.tsx` — Fix data range and label
- `features/attendance/attendance-table.tsx` — Add date-range filter
- `features/attendance/attendance-report.tsx` — Add format selector (PDF/XLSX)
- `services/attendance.api.ts` — Fix `$sort` bug, add admin export if needed

</code_context>

<specifics>
## Specific Ideas

- The `RangeAttendanceTable` is fully built but commented out on the dashboard. It might be reusable for the admin page — evaluate before building fresh.
- Export is async (BullMQ job → notification → download). Admin export for all employees may need a new backend endpoint since the current export is per-user.
- The attendance grid on the dashboard has a nice date-range toolbar — reuse its date picker pattern for the admin table filters.
- Backend auth gap on `GET /retrieve` and `GET /admin/correction` — security fix, not just UX.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Attendance Overhaul — Admin Oversight & UX Polish*
*Context gathered: 2026-08-31*
