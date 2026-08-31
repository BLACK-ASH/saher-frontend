---
phase: 08-bug-fixes-calendar-overhaul
plan: 02
subsystem: noticeboard
tags: [notice, trash, isDeleted, alert-dialog, soft-delete]

# Dependency graph
requires:
  - phase: 08-bug-fixes-calendar-overhaul
    provides: 08-01 registration/profile bug fixes (BUGF-01/02)
provides:
  - Backend getNotices reads isDeleted query param (default active)
  - Frontend notice trash tab lists real trashed notices
  - Restore and permanent-delete with AlertDialog confirmations
affects: 08-bug-fixes-calendar-overhaul (noticeboard module audit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TrashTabPattern wrapper with real data children (replaces NoData placeholder)
    - AlertDialog confirmation for restore and irrecoverable delete (D-20)

key-files:
  created: []
  modified:
    - ../saher-backend/src/notice/notice.controller.ts
    - services/notice.api.ts
    - hooks/use-notice.ts
    - features/noticeboard/notice-trash.tsx

key-decisions:
  - "Backend getNotices takes isDeleted query param (not a new route); controller reads req.query directly, route unchanged"
  - "getNotices(false) preserves existing active-listing behavior exactly; getNotices(true) drops expiresAt filter so recently-deleted-but-expired items still show (best-effort, TTL may purge)"

requirements-completed: [BUGF-03, BUGF-06]

# Metrics
duration: 3min
completed: 2026-08-31
---

# Phase 8 Plan 2: Notice Trash Tab Summary

**Backend getNotices gains an isDeleted query param; frontend notice trash tab wires to real deleted-notice list with AlertDialog-confirmed restore and permanent delete.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-08-31T12:04:07Z
- **Completed:** 2026-08-31T12:08:06Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Backend `getNotices` reads `req.query.isDeleted`; with `?isDeleted=true` it lists soft-deleted notices (dropping the expiresAt filter so recently-deleted items appear even if expired), default preserves the active-only behavior.
- `services/notice.api.ts` `getNotices` now accepts an `isDeleted` param (default `false`) and encodes it in the query string.
- `hooks/use-notice.ts` adds a `trashedNotices` query (`["notices", "trash"]` → `getNotices(true)`); existing `restore`/`permanentRemove` mutations remain.
- `features/noticeboard/notice-trash.tsx` replaced the dead placeholder with a real trash table (title, expiry via `formatIstDate`, Restore + Delete-Permanently buttons), each behind an AlertDialog confirmation (D-20), with loading/empty states and success toasts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend isDeleted query param** - `d4cfea7` (feat) — committed in `../saher-backend` (separate repo)
2. **Task 2: Frontend service + hook + trash component** - `2c8662f` (feat)

**Plan metadata:** see below final commit.

## Files Created/Modified
- `../saher-backend/src/notice/notice.controller.ts` - getNotices builds filter from isDeleted param
- `services/notice.api.ts` - getNotices(isDeleted=false) passes param in URL
- `hooks/use-notice.ts` - trashedNotices query added to return bag
- `features/noticeboard/notice-trash.tsx` - real trash list + restore/delete confirmations

## Decisions Made
- Used the `isDeleted` query param on the existing GET route (no new route); controller reads `req.query` directly, `noticeRouter.get('/', getNotices)` unchanged (plan D-04).
- `expiresAt` filter is dropped when listing trash (per RESEARCH Pitfall 4) so deleted-but-expired items are visible best-effort; TTL index may still purge them later.
- Activity of restore/permanent-delete is confirmed via AlertDialog (D-20), not direct action on row click.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getNotices signature broke the active query's TanStack queryFn typing**
- **Found during:** Task 2 (hooks wiring)
- **Issue:** Changing `getNotices` to take an `isDeleted` parameter made `queryFn: getNotices` fail typecheck — TanStack Query passes a context object as the arg, which no longer matched `(isDeleted?: boolean) => ...`.
- **Fix:** Wrapped the active query as `queryFn: () => getNotices(false)`.
- **Files modified:** hooks/use-notice.ts
- **Verification:** `pnpm typecheck` no longer reports notice-hook errors; `tests/notice-hook.test.tsx` passes (1/1).
- **Committed in:** 2c8662f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Single correctness fix required to keep the active-notices query type-safe after adding the trash query. No scope creep.

## Issues Encountered
- `pnpm typecheck` does not exit 0 due to **two pre-existing** errors in unrelated test files — `tests/handle-bill-dialog.test.tsx(76,9)` and `tests/record-payment-dialog.test.tsx(63,28)` (reimbursement/payroll `status`/`dateOfCreation` typing). Verified present on the base commit (`84bbb42`) via `git stash` before any of this plan's changes. Out of scope for this notice task (scope boundary); **deferred** — the orchestrator or a module-owning plan should resolve them. My files (`notice-trash.tsx`, `use-notice.ts`, `notice.api.ts`) are typeclean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Notice trash flow complete: backend lists deleted notices, frontend shows/restores/permanently-deletes them with confirmation.
- Pre-existing unrelated typecheck failures in reimbursement/payroll test files remain (deferred).
- Ready for 08-03 (bill management), 08-04 (leave), 08-05 (calendar backend).

## Self-Check: PASSED

- Backend commit `d4cfea7` exists; controller contains isDeleted logic ✓
- Frontend commit `2c8662f` exists; service/hook/trash component present ✓
- All 4 modified files exist on disk ✓
- SUMMARY.md exists ✓

---
*Phase: 08-bug-fixes-calendar-overhaul*
*Completed: 2026-08-31*
