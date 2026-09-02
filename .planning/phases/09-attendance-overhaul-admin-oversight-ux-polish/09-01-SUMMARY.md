---
phase: 09-attendance-overhaul-admin-oversight-ux-polish
plan: 01
subsystem: api
tags: [attendance, backend-guards, export, authorization, nav]

requires: []
provides:
  - Backend guards on GET /retrieve (attendance:read) and GET /admin/correction (attendance-correction:read)
  - Export dead-link fix (data.result.url, not downloadPath)
  - All-employees export GET /export/report?userId=all admin/manager-only
  - Month-bounded /user/:id & /user/me range query for the self-service chart
  - getRangeAttendance $sort→sort fix, getMonthAttendance, getAttendanceByUserId
  - "All Attendance" nav entry for admin+manager
  - Verified check-in/out/overtime/weekoff mapping + overtime cron routes
affects: [09-attendance-overhaul-admin-oversight-ux-polish]

tech-stack:
  added: []
  patterns:
    - "authorize(action, resource) guards on previously-open attendance list endpoints"
    - "userId=all mode extended onto the existing export/report endpoint (cache-key + worker branch), avoiding a second endpoint"

key-files:
  created: []
  modified:
    - ../saher-backend/src/attendance/attendance.route.ts
    - ../saher-backend/src/attendance/export/report.ts
    - ../saher-backend/src/worker/attendance-report.ts
    - ../saher-backend/src/attendance/retrieve/all-attendance.controller.ts
    - services/attendance.api.ts
    - components/sidebar/nav-list.tsx
    - tests/nav-list.test.tsx

key-decisions:
  - "userId=all export scoped cache key to the requesting admin (all:{req.user.id}) so two admins don't collide"
  - "All Attendance nav gate is role-based (admin||manager), NOT can(read, attendance) — users have attendance:read and would otherwise expose the Manager group"
  - "For an 'all' job, notifyDownload keeps [job.data.user] (the admin) — fan-out to every employee is out of scope"
  - "Month-range /user/:id sorts ascending by date when a range is present, desc createdAt by default"

patterns-established:
  - "All-employees export extension: optional userId=all on an existing single-user export endpoint, with a role gate and distinct cache region"
  - "Month-bounded chart query via startDate/endDate range on /user/me"

requirements-completed: [ATTD-01, ATTD-03, ATTD-04, ATTD-05]

duration: 22 min
completed: 2026-09-02
---

# Phase 9 Plan 1: Attendance Backend Hardening & Export Backend Summary

**Secured the two open attendance list endpoints, fixed the export dead-link, delivered the admin/manager all-employees export (userId=all), added month-bounded self-service chart queries and the /user/:id drill-down, fixed the $sort→sort service bug, and added the "All Attendance" nav entry — the foundation wave that unblocks Plans 09-02/09-03.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-02
- **Completed:** 2026-09-02
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

1. **Backend security guards (Task 1, D-13)** — Added `authorize('read', 'attendance')` to `GET /retrieve` (backend route line 48) and `authorize('read', 'attendance-correction')` to `GET /admin/correction` (line 63). No new permission strings — both already exist for admin/manager in the mirrored matrix, so ROLE_PERMISSIONS counts (admin=47/manager=38/user=14/intern=1) are unchanged and `tests/permissions.test.ts` stays green.
2. **Export dead-link fix (Task 1, D-08)** — `data.result?.downloadPath` → `data.result?.url` in `src/attendance/export/report.ts:125`. The worker returns the action `{ type, label, url, method }` at `notifyDownload`, so `url` is the correct key.
3. **All-employees export (Task 2, D-15/ATTD-03)** — Extended the existing `GET /export/report` with an optional `userId` param. `userId=all` queues an ALL-employees report; cache key scoped `all:{req.user.id}`; role gate rejects non-admin/manager with 403. Worker `fetchParsed` branches to an all-employees `Attendance.find({ date: { $gte, $lte } })` populate+lean+`attendanceListSchema.parse` for the range. Per-user default preserved (userId falls back to `req.user?.id`). No new packages.
4. **Month-bounded query (Task 3, D-10)** — `all-attendance.controller.ts` accepts optional `startDate`/`endDate`; builds a `date: { $gte, $lte }` filter, sorts ascending by date when a range is present, desc createdAt otherwise; countDocuments uses the same filter.
5. **Service-layer fixes (Task 3, D-14)** — `getRangeAttendance` `$sort=`→`sort=`; added `getMonthAttendance` (month-bounded `/user/me` chart query via `dateToIstDateOnly`) and `getAttendanceByUserId` (drill-down for Plan 09-02).
6. **Nav entry (Task 3, D-05)** — "All Attendance" → `/attendance/all` added to `managerRoutes` (renders in Manager group, visible to admin+manager), gated `role === "admin" || role === "manager"` (see decision — users hold `attendance:read` so `can()` would wrongly expose the group).
7. **Endpoint mapping & cron verification (scope-exp #2/#3)** — Confirmed `check-in`/`check-out`/`overtime/check-in`/`weekoff` service calls match backend routes exactly (no change needed); verified both cron routes `/cron/create/:pass` and `/cron/auto-checkout/:pass` exist. `attendance.overtime` already modeled in the frontend schema.

## Key Decisions

- **All-employees export = extension of existing endpoint, not a new one** — minimal surface, per-user default preserved, backward compatible.
- **Role-based nav gate for "All Attendance"** — a `can(role, "read", "attendance")` gate would render the Manager group (and this entry) for regular users, contradicting admin/manager-only intent. Used an explicit admin||manager role check instead.
- **Cache-key isolation for all-employees exports** — keyed on `all:{req.user.id}` so concurrent admin exports don't collide.

## Verification

- Backend: `grep authorize` on `/retrieve` + `/admin/correction`; `grep data.result` shows `.url`; `grep userId` (+ `all:` in cache key); `grep "=== 'all'"` in worker; `npx tsc --noEmit` **passes**.
- Frontend: `grep sort=` in service (no `$sort`); `grep getMonthAttendance`/`getAttendanceByUserId`; `grep All Attendance`/`attendance/all`/`ClipboardCheck` in nav-list; cron routes present in backend route file.
- Tests: `pnpm test -- --filter=nav-list` and `--filter=permissions` — **428/428 pass**.
- Lint: `pnpm lint` — 0 errors (pre-existing warnings only).

## Open Follow-ups

- Plan 09-02 consumes: all-employees export `userId=all`, `getAttendanceByUserId` drill-down, `getRangeAttendance` + `/user/me` month range for the admin page.
- Plan 09-03 consumes: `getMonthAttendance` chart query, range-scoped history filter, export format selector, overtime surfacing.
