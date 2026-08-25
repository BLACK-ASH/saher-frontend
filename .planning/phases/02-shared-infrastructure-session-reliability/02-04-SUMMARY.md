---
phase: 02-shared-infrastructure-session-reliability
plan: 04
subsystem: auth
tags: [auth, session, login, logout, refresh, open-redirect]

# Dependency graph
requires: ["02-01"]
provides:
  - "hooks/use-login.ts — resetSessionGuard + ['user','me'] invalidation"
  - "hooks/use-logout.ts — try/catch best-effort + performLogoutCleanup"
  - "features/login/components/login-form.tsx — ?next= with anti-open-redirect guard"
  - "lib/api-wrapper.test.ts — D-19 refresh single-flight/retry-once/death-sentinel tests"
affects: [02-06, 02-07, all future auth flows]

# Tech tracking
tech-stack:
  added: []
  patterns: [open-redirect guard, best-effort logout, single-flight refresh]

key-files:
  created: []
  modified:
    - hooks/use-login.ts
    - hooks/use-logout.ts
    - features/login/components/login-form.tsx
    - features/login/components/login-form.test.tsx
    - lib/api-wrapper.test.ts

key-decisions:
  - "Logout is best-effort: empty catch block, performLogoutCleanup always runs"
  - "?next= guard: startsWith('/') && !startsWith('//') — blocks protocol-relative URLs"
  - "D-19 tests assert toast.error NOT called on death path — dedupe in lib/session.ts"

patterns-established:
  - "Auth hooks route cleanup through lib/session.ts — no scattered redirect logic"

requirements-completed: [AUTH-01]

# Metrics
duration: 12min
completed: 2026-08-25
---

# Plan 02-04: Auth Hook Repair Summary

**Auth hooks repaired onto session module, ?next= return navigation, D-19 refresh integration tests**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-25T13:08:00Z
- **Completed:** 2026-08-25T13:20:00Z
- **Tasks:** 3 (all auto)
- **Files modified:** 5

## Accomplishments
- use-login: resetSessionGuard + ['user','me'] invalidation
- use-logout: try/catch best-effort + performLogoutCleanup
- login-form: ?next= consumption with anti-open-redirect guard
- D-19: 4 integration tests through real apiFetch + msw

## Task Commits

1. **Task 1-3: Auth hooks + ?next= + D-19 tests** - `c279eb5` (fix)

## Files Created/Modified
- `hooks/use-login.ts` — resetSessionGuard + real queryKey
- `hooks/use-logout.ts` — try/catch + performLogoutCleanup
- `features/login/components/login-form.tsx` — ?next= guard
- `features/login/components/login-form.test.tsx` — useSearchParams mock
- `lib/api-wrapper.test.ts` — 4 D-19 tests

## Decisions Made
- Logout best-effort: empty catch, always cleanup
- ?next= guard: startsWith('/') && !startsWith('//')

## Deviations from Plan
None

## Issues Encountered
- login-form.test.tsx needed useSearchParams mock added

## User Setup Required
None

## Next Phase Readiness
- Plan 02-05 can proceed independently

---
*Phase: 02-shared-infrastructure-session-reliability*
*Completed: 2026-08-25*
