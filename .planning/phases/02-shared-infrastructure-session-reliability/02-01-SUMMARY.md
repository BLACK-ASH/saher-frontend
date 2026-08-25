---
phase: 02-shared-infrastructure-session-reliability
plan: 01
subsystem: auth
tags: [session, react-query, cache, toast, redirect]

# Dependency graph
requires: []
provides:
  - "lib/session.ts — handleSessionDeath, performLogoutCleanup, resetSessionGuard"
  - "Provider wiring — QueryCache/MutationCache onError sentinel filter"
  - "api-wrapper refresh-failure sends 'Unauthorized' sentinel (no toast)"
affects: [02-04, auth, session]

# Tech tracking
tech-stack:
  added: []
  patterns: [module-level once-guard for session death dedup, sentinel-string coupling between lib layers]

key-files:
  created:
    - lib/session.ts
    - lib/session.test.ts
  modified:
    - lib/api-wrapper.ts
    - app/provider.tsx

key-decisions:
  - "Module-level once-guard (died flag) over context/ref — simplest path to exactly-once across concurrent queries"
  - "Sentinel string coupling (lib/api-wrapper → provider filter → lib/session) — no lib-to-lib import, keeps apiFetch a dumb parser"

patterns-established:
  - "Session death: toast+redirect+cache-clear lives in lib/session.ts, triggered by 'Unauthorized' sentinel from api-wrapper"

requirements-completed: [FNDT-04, AUTH-01]

# Metrics
duration: 10min
completed: 2026-08-25
---

# Plan 02-01: Session Death Module Summary

**Once-guarded session-death handler with deduped toast, cache cancel+clear, and /login?next= redirect wired to provider onError sentinel filter**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-25T12:30:00Z
- **Completed:** 2026-08-25T12:40:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `lib/session.ts` with handleSessionDeath (once-guarded), performLogoutCleanup, resetSessionGuard
- 7 unit tests covering once-guard dedup, redirect encoding, cancel-before-clear ordering, guard reset, logout cleanup
- Provider wired: QueryCache + MutationCache onError filter on "Unauthorized" sentinel
- api-wrapper refresh-failure sends sentinel only (toast delegated to session module)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/session.ts + tests** - `c78018d` (feat)
2. **Task 2: Rewire api-wrapper refresh-failure** - `3402e1a` (refactor)
3. **Task 3: Wire provider onError** - `51ac396` (feat)

## Files Created/Modified
- `lib/session.ts` — Central session-death handler (once-guard, toast dedup, cache clear, redirect)
- `lib/session.test.ts` — 7 tests: once-guard, redirect encoding, cancel-before-clear, guard reset, logout cleanup
- `lib/api-wrapper.ts` — Removed session-expired toast from refresh-failure branch
- `app/provider.tsx` — QueryCache + MutationCache onError wired to handleSessionDeath

## Decisions Made
- Module-level once-guard (`died` flag) for simplicity — no external coordination needed
- Sentinel string coupling between layers — api-wrapper throws "Unauthorized", provider catches, session module handles

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
- ESLint `no-use-before-define` caught closure referencing useState variable — solved with module-level ref

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02-04 (auth hooks) can consume handleSessionDeath/performLogoutCleanup/resetSessionGuard exports

---
*Phase: 02-shared-infrastructure-session-reliability*
*Completed: 2026-08-25*
