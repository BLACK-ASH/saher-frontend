---
phase: 08-bug-fixes-calendar-overhaul
plan: 04
subsystem: api
tags: [leave, validation, error-handling, field-name-fix]

# Dependency graph
requires:
  - phase: 08-01
    provides: bug-fix foundation patterns and cross-repo commit conventions
provides:
  - Backend leave update controller reads payload.type and writes type: leaveType._id
  - Frontend apply dialog surfaces notice/proof/overlap validation errors inline
  - Frontend update sends type field (not leaveCode)
affects: [leave module]

# Tech tracking
tech-stack:
  added: []
  patterns: [backend $or findOne for code-or-_id fallback, frontend validation error surfacing via shared state]

key-files:
  created: []
  modified:
    - ../saher-backend/src/leave/leave.controller.ts
    - features/leave/apply-leave-dialog.tsx
    - services/leave.api.ts

key-decisions:
  - "Reused overlapError state for all validation errors to avoid adding new state + JSX — rename deferred"
  - "$or findOne ({ code }, { _id }) handles both payload.type (code string) and leave.type (ObjectId fallback)"

patterns-established:
  - "Backend leave update reads payload.type consistently with create endpoint"
  - "Frontend surfaces backend business-rule errors inline via keyword matching"

requirements-completed: [BUGF-05]

# Metrics
duration: 2min
completed: 2026-09-01
---

# Phase 08 Plan 04: Leave Field-Name Fix + Validation Error Surfacing Summary

**Leave update controller writes type field (not nonexistent leaveCode); apply dialog surfaces notice/proof/overlap errors inline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-01T13:24:10Z
- **Completed:** 2026-09-01T13:26:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishes
- Backend leave update now writes `type: leaveType._id` instead of nonexistent `leaveCode` field
- Frontend apply dialog surfaces specific backend rejection messages (notice period, proof required, overlap) inline instead of generic toast
- Frontend update sends `type` field matching backend expectation

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend — fix leave update controller field-name mismatch** - `54c2831` (fix)
2. **Task 2: Frontend — surface all leave validation errors + fix update field name** - `fc7f4d9` (fix)

## Files Created/Modified
- `../saher-backend/src/leave/leave.controller.ts` - Changed updateData spread from `leaveCode` to `type: leaveType._id`
- `features/leave/apply-leave-dialog.tsx` - Broadened handleError for notice/proof/before; removed leaveCode lookup, sends type
- `services/leave.api.ts` - Updated UpdateLeavePayload type: `type?` replaces `leaveCode?`

## Decisions Made
- Reused existing `overlapError` state for all validation errors rather than adding a new `validationError` state and renaming all references. The state name is slightly misleading but avoids touching 8+ lines of JSX for a rename.
- `$or: [{ code }, { _id }]` in the backend findOne handles both code strings from `payload.type` and ObjectId fallback from `leave.type`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Leave module update flow is now correct end-to-end (backend reads correct field, frontend sends correct field)
- Validation errors surface inline for user correction

---
*Phase: 08-bug-fixes-calendar-overhaul*
*Completed: 2026-09-01*
