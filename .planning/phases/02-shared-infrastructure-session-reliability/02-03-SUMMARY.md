---
phase: 02-shared-infrastructure-session-reliability
plan: 03
subsystem: rbac
tags: [permissions, role-guard, sidebar, role-access, can]

# Dependency graph
requires: []
provides:
  - "lib/permissions.ts — UserRole union, ROLE_PERMISSIONS matrix, can() lookup"
  - "components/role-guard.tsx — allow predicate contract"
  - "components/role-access.tsx — allow predicate contract (stale Role union deleted)"
  - "components/sidebar/nav-list.tsx — can()-based visibility (manager-nav bug fixed)"
affects: [02-06, 02-07, all future modules]

# Tech tracking
tech-stack:
  added: []
  patterns: [verbatim backend matrix mirror, allow predicate for UI gating]

key-files:
  created:
    - lib/permissions.ts
    - lib/permissions.test.ts
    - components/sidebar/nav-list.test.tsx
    - components/role-access.test.tsx
  modified:
    - hooks/use-me.ts
    - components/role-guard.tsx
    - components/role-access.tsx
    - components/sidebar/nav-list.tsx
    - app/(main)/(admin)/layout.tsx
    - app/(main)/(manager)/layout.tsx
    - features/program/workshop/workshop-header.tsx
    - features/program/program/program-header.tsx
    - features/program/session/session-header.tsx
    - features/program/workshop/all-workshops.tsx
    - features/program/session/all-sessions.tsx
    - features/program/program/all-programs.tsx
    - features/program/participant/all-participant.tsx

key-decisions:
  - "Admin sidebar visibility uses can(role,'delete','account') — admin-only in matrix"
  - "RoleAccess call sites use role-set predicates (no can()) — backend has no workshop/session/program/participant resources"
  - "A1 assumption: role strings 'intern'|'user'|'manager'|'admin' accepted from static evidence"

patterns-established:
  - "All UI gating through can()/allow() predicates over UserRole — no scattered role===string"

requirements-completed: [FNDT-06]

# Metrics
duration: 15min
completed: 2026-08-25
---

# Plan 02-03: Role Permissions Matrix Summary

**Verbatim backend role→permissions matrix (admin 42, manager 36, user 14, intern 1) with can() lookup, unified RoleGuard/RoleAccess/nav-list gating, manager-nav bug fixed**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-25T12:52:00Z
- **Completed:** 2026-08-25T13:07:00Z
- **Tasks:** 3 (2 auto + 1 human checkpoint)
- **Files modified:** 19

## Accomplishments
- `lib/permissions.ts` with 4-role matrix mirroring backend verbatim
- 257 tests including 4 no-inheritance counterexamples + exhaustive smoke
- RoleGuard/RoleAccess rewritten to allow predicate contract
- Manager-nav bug fixed (operator precedence: `role==="manager" || (role==="admin" && ...)` → `canSeeManagerGroup()`)
- 10 RoleAccess call sites migrated from `roles={[]}` to `allow={(r)=>...}`
- Intern denial proven by render test

## Task Commits

1. **Task 1: Mirror backend matrix** - `abb7b38` (feat)
2. **Task 2: Unify gating** - `9b2fbe1` (refactor)
3. **Task 3: D-15 probe** - approved (A1 assumption recorded)

## Files Created/Modified
- `lib/permissions.ts` — UserRole, ROLE_PERMISSIONS, can()
- `lib/permissions.test.ts` — 257 tests
- `hooks/use-me.ts` — UserRole widened to include intern
- `components/role-guard.tsx` — allow predicate
- `components/role-access.tsx` — allow predicate, stale Role union removed
- `components/sidebar/nav-list.tsx` — can()-based visibility
- `components/sidebar/nav-list.test.tsx` — manager-nav regression test
- `components/role-access.test.tsx` — intern-denial render proof
- 2 layout files + 7 program files migrated

## Decisions Made
- Admin sidebar visibility: `can(role, "delete", "account")` — admin-only
- Program-family RoleAccess sites: role-set predicates (no can() — backend has no matching resources)

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
- Nav-list tests needed SidebarProvider mock
- Role-access tests needed vi.fn() mock pattern instead of vi.doMock

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plans 02-06/02-07 consume lib/permissions.ts for remaining module gating

---
*Phase: 02-shared-infrastructure-session-reliability*
*Completed: 2026-08-25*
