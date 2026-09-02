---
phase: 09-attendance-overhaul-admin-oversight-ux-polish
plan: 03
subsystem: ui
tags: [attendance, chart, filter, export, status]

requires:
  - phase: 09-01
    provides: getMonthAttendance (month-bounded /user/me), /user/:id & /user/me date-range support
provides:
  - Self-service chart plots actual calendar-month data (via useMonthAttendance)
  - History table date-range filter spanning a range-scoped (limit=100) dataset
  - Self-service export dropdown with PDF/XLSX format selector + loading state
  - Status card uses Badge with clear labels + surfaces overtime state
affects: [09-attendance-overhaul-admin-oversight-ux-polish]

tech-stack:
  added: []
  patterns:
    - "useMonthAttendance standalone query on ["attendance","month"] (60s stale), chart consumes it instead of the 7-row list"
    - "Client-side date-range filter over a larger server fetch (limit=100), not just the visible page (RESEARCH Pitfall 5)"

key-files:
  created: []
  modified:
    - hooks/use-attendance.ts
    - features/attendance/attendance-chart.tsx
    - features/attendance/attendance-table.tsx
    - features/attendance/attendance-report.tsx
    - features/attendance/attendance-status.tsx

key-decisions:
  - "History fetch limit bumped 7→100 (bounded range-scoped window; not 9999) so the date filter spans real history"
  - "Export format selector added at the top of the report dropdown (PDF/XLSX) with generate wrapper passing format to every range"
  - "AttendanceStatusEnum imported with alias to avoid collision with the local AttendanceStatus component name"
  - "Overtime surfaced as an independent verify Badge when today record has attendance.overtime === true"

patterns-established:
  - "Range-scoped list fetch + client-side date filter for date-range UX when the server has no range param on the full history"

requirements-completed: [ATTD-03, ATTD-04, ATTD-05]

duration: 20 min
completed: 2026-09-02
---

# Phase 9 Plan 3: Self-Service Attendance UX Fixes Summary

**Fixed the four self-service attendance UX gaps: the chart now plots the actual calendar month via a month-bounded /user/me query, the history table's date-range filter spans a range-scoped (limit=100) dataset instead of just the visible page, the export dropdown offers PDF/XLSX with a loading guard, and the status card uses a clear Badge label plus an overtime indicator.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-02
- **Completed:** 2026-09-02
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

1. **Chart calendar-month fix (Task 1, D-10)** — Added standalone `useMonthAttendance` hook (`["attendance","month"]`, 60s stale, calls `getMonthAttendance` → `/user/me?startDate=<month-start>&endDate=<month-end>&sort=asc&limit=31` from Plan 01). `attendance-chart.tsx` now consumes `useMonthAttendance()` instead of `useAttendance().attendancesList` (the 7-row list), so its data aligns with the "This Month Work Hour" title.
2. **History date-range filter (Task 1, D-11)** — `attendance-table.tsx` now requests `limit: 100` (bounded range-scoped window, not 9999). Added `filterStartDate`/`filterEndDate`/`appliedStart`/`appliedEnd` state, two date inputs + Apply/Reset in CardAction, and a `filteredItems` client-side filter applied across the fetched dataset (not the page). Added a "Filtered: … to …" status and an empty-message row when the filter matches nothing. Preserved the existing `AttendanceReportDropdown`, refresh, and `PaginationFooter`.
3. **Export format selector (Task 2, D-06)** — `attendance-report.tsx` gains `format` ("pdf"|"xlsx"), `isGenerating`, a `handleGenerate` wrapper that threads `format` into every range call, top-of-menu PDF/XLSX selector items with Check icon + Separator, and a disabled trigger with `Loader2` while generating.
4. **Status card clarity + overtime (Task 2, D-12)** — `attendance-status.tsx` replaces the raw `status.replaceAll("_"," ")` span with a `Badge` mapping to "Not Checked In" / "Checked In" / Late" / "Checked Out" (variant per status), and shows a `verify` Overtime Badge when `data.overtime === true`. Imported the enum as `AttendanceStatusEnum` to avoid the local component-name collision.

## Key Decisions

- Bounded `limit=100` for the range-scoped history window — a predictable fetch; the full server-side range filter isn't available for whole history this phase.
- Overtime surfaced as an independent verify Badge rather than a status variant, since the enum doesn't represent overtime.
- Export format threads through a single `handleGenerate` so every range respects the selected format.

## Verification

- `pnpm lint` — 0 errors.
- `npx tsc --noEmit` — no errors in the 5 modified files (2 pre-existing test-file errors remain, unrelated).
- `pnpm test` — 428/428 pass.
- Greps confirm: `useMonthAttendance` in hook+chart, `getMonthAttendance` import, `filterStartDate`/`appliedStart`/`filteredItems`/`limit:100`/date inputs in the table, `xlsx`/`format`/`handleGenerate`/`isGenerating`/`Check` in the report, `Badge`/clear labels/`overtime`/`verify` in the status card.

## Open Follow-ups

- Phase 09 now complete (Plans 01, 02, 03 all finished). Remaining: STATE.md/ROADMAP finalization and the two pre-existing test TS errors outside this phase's scope.
