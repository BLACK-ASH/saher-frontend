---
phase: 08-bug-fixes-calendar-overhaul
plan: 05
subsystem: api
tags: [calendar, rbac, timezone, zod, express, ist]

# Dependency graph
requires:
  - phase: 08-bug-fixes-calendar-overhaul
    provides: RBAC 'event' permission matrix and authorize middleware used by calendar routes
provides:
  - "IST-aware month boundaries for calendar queries (events/holidays/sessions no longer vanish across server timezone mismatch)"
  - "RBAC authorize() guards on calendar mutating routes (POST/PUT/DELETE/PATCH restore/sync-holidays)"
  - "createCalendarEventSchema.type aligned to z.enum(eventType) matching response schema"
affects: [08-06-calendar-frontend-overhaul]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IST-explicit Date.UTC month boundaries: new Date(Date.UTC(year, month, 1, -5, -30, 0, 0))"
    - "RBAC via authorize(action, resource) middleware from ../permission/authorize.js"

key-files:
  created: []
  modified:
    - "../saher-backend/src/libs/utils/calendar.ts"
    - "../saher-backend/src/calendar/calendar.routes.ts"
    - "../saher-backend/src/calendar/calendar.schema.ts"

key-decisions:
  - "D-12: Use IST-explicit Date.UTC boundaries (18:30 UTC prev-day = IST midnight) instead of server-local new Date(year, month, 1), fixing events disappearing in UTC Docker container vs IST dev"
  - "D-16: Use existing 'event' resource (not a new 'calendar' permission) for authorize() on calendar routes"
  - "D-16: GET /:year/:month stays unguarded (read access for all authenticated); POST /sync-holidays gated with authorize('write', 'event') since it writes org-wide data"

patterns-established:
  - "Month-boundary calendar queries compute boundaries in IST explicitly regardless of server TZ"

requirements-completed: [BUGF-07, CAL-01]

# Metrics
duration: 8min
completed: 2026-09-01
---

# Phase 08 Plan 05: Backend Calendar Fixes Summary

**Calendar month boundaries made IST-explicit (Date.UTC at 18:30 UT+5:30), calendar mutating routes RBAC-guarded via the existing 'event' permission, and create schema `type` aligned to the response `z.enum(eventType)`.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-01T13:28:59Z
- **Completed:** 2026-09-01T13:37:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Calendar queries (`getCalendarEvents`, plus sibling `getCalendarHoliday`/`getCalendarSession`) now use IST-explicit `Date.UTC` boundaries, so events created with IST dates persist across refresh/month boundaries even when the server runs in UTC (Docker) vs IST (dev box)
- Calendar routes enforce RBAC: `authorize('write'|'update'|'delete', 'event')` on POST /event, PUT /event/:id, DELETE /event/:id, PATCH /event/restore/:id, and POST /sync-holidays; GET /:year/:month remains read-only for all authenticated users
- `createCalendarEventSchema.type` changed from `z.string()` to `z.enum(eventType)`, restricting creation to the 5 valid types and aligning with the response schema

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend — fix calendar month boundary, add RBAC, align type enum** - `f551dcd` (fix)

**Plan metadata:** Committed in frontend repo with this SUMMARY.

## Files Created/Modified
- `../saher-backend/src/libs/utils/calendar.ts` - IST `Date.UTC` month boundaries in all three calendar queries (getCalendarEvents/getCalendarHoliday/getCalendarSession)
- `../saher-backend/src/calendar/calendar.routes.ts` - `authorize` import + guards on all mutating routes and sync-holidays
- `../saher-backend/src/calendar/calendar.schema.ts` - `createCalendarEventSchema.type` now `z.enum(eventType)`

## Decisions Made
- **D-12 (month boundary):** Applied IST-explicit `Date.UTC(year, month, 1, -5, -30, 0, 0)` boundaries. Extended the fix to the sibling `getCalendarHoliday` and `getCalendarSession` functions, which shared the identical server-local bug — fixing only `getCalendarEvents` would have left holidays/sessions still vanishing (consistent root-cause fix).
- **D-16 (RBAC):** Reused the existing `'event'` resource from the permission matrix (verified present in `role-permission.ts` for admin/manager/user/intern) rather than inventing a `'calendar'` permission. `POST /sync-holidays` gated with `authorize('write', 'event')` because it writes org-wide holiday data.
- **D-17 (type enum):** Reused the existing `eventType` array; response schema and array unchanged.

## Deviations from Plan

**None - plan executed exactly as written,** with one expansion:

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Applied IST boundary fix to sibling calendar queries**
- **Found during:** Task 1 (month boundary fix)
- **Issue:** Only `getCalendarEvents` was specified, but `getCalendarHoliday` and `getCalendarSession` in the same file had the identical server-local `new Date(year, month, 1)` bug. Fixing only events would leave holidays/sessions vanishing in the same way.
- **Fix:** Applied the same IST `Date.UTC` boundary computation to all three functions.
- **Files modified:** `../saher-backend/src/libs/utils/calendar.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** f551dcd (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix necessary for correctness consistency. No scope creep.

## Issues Encountered
- None. Backend compiled cleanly on first pass; unrelated dirty files (`.env.example`, `src/app.ts`) in the backend worktree were left untouched and uncommitted as required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Calendar routes are RBAC-guarded and month queries are IST-correct, ready for the frontend calendar overhaul (08-06). Frontend already sends `+05:30` ISO dates via `dateInputToIso` and calls the same GET `/api/calendar/:year/:month` — no frontend changes required for this plan.
- Note for 08-06: POST `/api/calendar/sync-holidays` is now RBAC-guarded, so only admin/manager (with `event:write`) can trigger it.

---

## Self-Check: PASSED

- FOUND: `.planning/phases/08-bug-fixes-calendar-overhaul/08-05-SUMMARY.md`
- FOUND: frontend commit `3a3c633` (docs)
- FOUND: backend commit `f551dcd` (fix)
- FOUND: backend `src/libs/utils/calendar.ts` (IST boundaries verified via grep)

---

*Phase: 08-bug-fixes-calendar-overhaul*
*Completed: 2026-09-01*
