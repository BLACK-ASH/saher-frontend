---
phase: 04-staff-self-service-mail-leave
plan: "04"
subsystem: ui
tags: [leave, filtering, pagination, zod, react-hook-form, tanstack-query]

# Dependency graph
requires:
  - phase: 04-staff-self-service-mail-leave
    plan: 01
    provides: leaveApplicationSchema/normalizeList-backed applications query shape (items/page/totalPages)
  - phase: 04-staff-self-service-mail-leave
    plan: 03
    provides: search-param pagination pattern on /leave reused for /leave-management pager wiring
provides:
  - Admin leave queue with All/Pending/Approved/Rejected status filter buttons above the applications table
  - PaginationFooter on admin all-applications table wired to /leave-management?page=N&limit=M
  - Leave type form schema carrying the backend's maxCarryForwardDays <= allocatedDays refine
affects: [phase-4-verifier]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side status filter over full server list via useState<string | null> + variant-swapping Button group"
    - "Frontend form schema mirrors backend refine so validation errors surface pre-submit instead of as API rejections"

key-files:
  created: []
  modified:
    - features/leave/admin-page.tsx
    - services/leave.api.ts
    - features/leave/leave-type-dialog.tsx

key-decisions:
  - "Empty-filter state renders as a colSpan=5 table row inside the card rather than swapping the whole card out, keeping the filter buttons visible while filtered"
  - "Admin pager pushes /leave-management search params (router.push) mirroring the staff page pattern instead of local page state"

patterns-established:
  - "Status filter button group: active variant=default / inactive outline, null value = 'All'"

requirements-completed: ["LEAV-05", "LEAV-06"]

# Metrics
duration: 6min
completed: 2026-08-26
---

# Phase 4 Plan 04: Admin Leave — Status Filter, Pagination, Type CRUD Verification Summary

**Admin leave queue gains All/Pending/Approved/Rejected client-side status filters plus PaginationFooter, card title corrected to "Leave Requests", and leave-type CRUD verified against the backend contract with two validation bugs fixed**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-26T06:19:51Z
- **Completed:** 2026-08-26T06:26:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Status filter button group (All/Pending/Approved/Rejected) renders above the admin applications table; active button uses `variant="default"`, inactive `variant="outline"`; filtering is client-side over the full items array via `statusFilter: string | null`
- Empty filter results show a "No leave applications found." row while keeping filter buttons visible
- `PaginationFooter` renders below the table card when `totalPages > 1`, pushing `/leave-management?page=N&limit=M` (mirrors staff-page pattern)
- Card title corrected from "Pending Leave Requests" to "Leave Requests" (the table shows all statuses)
- Leave type CRUD verified end-to-end against `../saher-backend/src/leave/` routes: POST `/api/leave/type` (`write` guard) and PUT `/api/leave/type/:id` (`update` guard) match `createLeaveType`/`updateLeaveType`; create/update toast on success and invalidate `["leave", "types"]`
- Two contract mismatches fixed: frontend schema now carries the backend's carry-forward refine; edit pre-fill no longer hardcodes `isActive: true`

## Task Commits

Each task was committed atomically:

1. **Task 1: Status filter buttons + PaginationFooter + title fix** - `e7ebab3` (feat)
2. **Task 2: Verify leave type CRUD — fix schema refine + isActive pre-fill** - `66f547b` (fix)

## Files Created/Modified
- `features/leave/admin-page.tsx` - statusFilter state, filter Button group, filteredItems data source, empty-state row, PaginationFooter, title fix
- `services/leave.api.ts` - `createLeaveTypeSchema` gained `.refine(maxCarryForwardDays <= allocatedDays)` with path targeting (mirrors backend `leave.schema.ts`)
- `features/leave/leave-type-dialog.tsx` - edit pre-fill uses `leaveType.isActive` instead of hardcoded `true`

## Decisions Made
- Rendered the empty-filter message as a colSpan=5 row inside the existing table (filter controls stay reachable) rather than replacing the card body
- Wired the admin pager through `router.push("/leave-management?...")` for consistency with the staff leave page, preserving `limit`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing carry-forward refine in frontend leave-type schema**
- **Found during:** Task 2 (CRUD verification)
- **Issue:** Backend `createLeaveTypeSchema`/`updateLeaveTypeSchema` both enforce `maxCarryForwardDays <= allocatedDays` (path `['maxCarryForwardDays']`, verified in `../saher-backend/src/leave/leave.schema.ts`), but the frontend form schema lacked it — invalid input would only fail server-side after submit; acceptance criteria explicitly require this refine
- **Fix:** Added `.refine((data) => data.maxCarryForwardDays <= data.allocatedDays, { message, path: ["maxCarryForwardDays"] })` to `createLeaveTypeSchema`
- **Files modified:** services/leave.api.ts
- **Verification:** tsc clean; zodResolver accepts refined schema (output type unchanged)
- **Committed in:** 66f547b (Task 2 commit)

**2. [Rule 1 - Bug] Edit dialog hardcoded `isActive: true` during pre-fill**
- **Found during:** Task 2 (CRUD verification)
- **Issue:** `useEffect` pre-fill set `isActive: true` regardless of the entity's stored value, so editing any disabled leave type silently re-enabled it on save
- **Fix:** Pre-fill `isActive: leaveType.isActive`
- **Files modified:** features/leave/leave-type-dialog.tsx
- **Verification:** tsc clean; matches `leaveTypeSchema.isActive` response field
- **Committed in:** 66f547b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 × Rule 1 bugs found during the plan's own verify-and-fix step)
**Impact on plan:** Both fixes were required to satisfy the plan's acceptance criteria (schema refine is listed verbatim; silent re-enable breaks correct CRUD behavior). No scope creep.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- LEAV-05/LEAV-06 acceptance paths implemented; human verification of the filter buttons and leave-type create/edit flows pending phase verifier (end-of-phase human-check harvest)
- Backend still returns full application arrays without pagination meta, so `totalPages` stays 1 and the admin PaginationFooter remains hidden until backend paging lands (per research §5 HIGH risk note) — same known limitation as the staff table
- Plan 04-05 (integration/polish wave) can proceed; admin page untouched otherwise

---
*Phase: 04-staff-self-service-mail-leave*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both task commits verified in git log (e7ebab3, 66f547b); all three modified files exist on disk with expected content (grep: statusFilter/filter group/PaginationFooter/"Leave Requests" in admin-page.tsx; refine in leave.api.ts); `pnpm lint` exit 0 (0 errors, 51 warnings = baseline); `pnpm build` exit 0 with no type errors; working tree contains only pre-existing orchestrator-owned changes (.planning/STATE.md, docker-compose.dev.yml deletion present at execution start).
