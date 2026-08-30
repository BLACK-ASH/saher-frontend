---
phase: 07-existing-modules-audit-and-fix
plan: 2
subsystem: ui
tags: [nextjs, react-query, typescript, zod, audit]

# Dependency graph
requires:
  - phase: 07-existing-modules-audit-and-fix
    plan: 1
    provides: [attendance, calendar, users, program modules audited]
provides:
  - Users page uses useAdminUsers hook instead of inline useQuery
  - User detail page uses useAdminAccount hook instead of inline useQuery
  - Program/Workshop/Session service functions no longer have inline toast.error (apiFetch handles it)
  - useWorkshops mutations invalidate programs query key
  - useSessions mutations invalidate workshops and programs query keys
affects: [users, program, workshop, session features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Feature components use hook layer (useAdminUsers, useAdminAccount) not direct service calls
    - Service functions return raw responses; error toasting centralized in apiFetch
    - Mutation invalidation cascades up hierarchy (sessions → workshops → programs)

key-files:
  created: []
  modified:
    - app/(main)/(manager)/users/[id]/page.tsx
    - features/users/page.tsx
    - hooks/use-workshops.ts
    - hooks/use-sessions.ts
    - services/program.api.ts
    - services/workshop.api.ts
    - services/session.api.ts

key-decisions:
  - "Removed redundant toast.error calls from service layer; apiFetch already toasts on failure"
  - "Wrapped base mutations in useWorkshops/useSessions to invalidate parent query keys"
  - "Cast AdminUserResponse[] to UserT[] at component boundary since columns only use common fields"

patterns-established:
  - "All feature data fetching goes through hooks (useAdminUsers, useAdminAccount, useWorkshops, useSessions)"
  - "Service layer is pure fetch + types; no side effects like toasting"
  - "Hierarchical invalidation: child mutations invalidate parent query keys"

requirements-completed: ["AUDT-03"]

# Metrics
duration: 33 min
completed: 2026-08-30
---

# Phase 07 Plan 02: Users & Program Final Alignment Summary

**Users detail & directory pages now use hook layer; program/workshop/session CRUD uses hierarchical invalidation and centralized error handling**

## Performance

- **Duration:** 33 min
- **Started:** 2026-08-30T07:35:22Z
- **Completed:** 2026-08-30T08:08:55Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- User detail page (`app/(main)/(manager)/users/[id]/page.tsx`) now uses `useAdminAccount` hook instead of inline `useQuery` + `apiFetch`
- Users directory (`features/users/page.tsx`) now uses `useAdminUsers` hook with proper type casting at boundary
- All program/workshop/session service functions stripped of inline `toast.error` — `apiFetch` handles error toasting centrally
- `useWorkshops` mutations now invalidate both `["workshops"]` and `["programs"]` query keys
- `useSessions` mutations now invalidate `["sessions"]`, `["workshops"]`, and `["programs"]` query keys
- Session attendance page verified to use diff engine from `lib/attendance-diff.ts` (06-06)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix inline any in user detail page** - `41a9b8e` (fix)
2. **Task 2: Verify users data-table pattern alignment** - `12b8a9e` (fix)
3. **Task 3: Verify program/workshop/session CRUD alignment** - `df12abb` (fix)
4. **Task 4: Run lint/typecheck** - verified in CI (no separate commit)

## Files Created/Modified

- `app/(main)/(manager)/users/[id]/page.tsx` - Replaced inline useQuery with useAdminAccount hook
- `features/users/page.tsx` - Replaced inline useQuery with useAdminUsers hook; cast AdminUserResponse[] to UserT[]
- `hooks/use-workshops.ts` - Wrapped base mutations to invalidate programs query key
- `hooks/use-sessions.ts` - Wrapped base mutations to invalidate workshops and programs query keys; fixed mutationFn signatures
- `services/program.api.ts` - Removed all inline toast.error calls (9 occurrences)
- `services/workshop.api.ts` - Removed all inline toast.error calls (7 occurrences)
- `services/session.api.ts` - Removed all inline toast.error calls (13 occurrences)

## Decisions Made

- Removed redundant toast.error calls from service layer; apiFetch already toasts on failure
- Wrapped base mutations in useWorkshops/useSessions to invalidate parent query keys
- Cast AdminUserResponse[] to UserT[] at component boundary since columns only use common fields

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Wrapped base mutations with proper mutationFn signatures**
- **Found during:** Task 3 (useWorkshops/useSessions hook updates)
- **Issue:** Direct assignment of `base.add.mutateAsync` to `mutationFn` caused TypeScript error (signature mismatch)
- **Fix:** Wrapped in arrow function `(vars: unknown) => base.add.mutateAsync(vars)` for proper typing
- **Files modified:** hooks/use-workshops.ts, hooks/use-sessions.ts
- **Verification:** Build passes, TypeScript compiles clean
- **Committed in:** df12abb (part of Task 3 commit)

**2. [Rule 1 - Bug] Removed unused toast import from session.api.ts**
- **Found during:** Task 3 (removing toast.error from service functions)
- **Issue:** After removing all toast.error calls, the `toast` import from sonner was unused
- **Fix:** Removed the import statement
- **Files modified:** services/session.api.ts
- **Verification:** Build passes, no unused import warnings
- **Committed in:** df12abb (part of Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- TypeScript signature mismatch when wrapping TanStack Query mutations — fixed by using arrow function wrapper
- Column type mismatch between AdminUserResponse (from admin API) and UserT (used by columns) — resolved with boundary cast since columns only access common fields

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Users module fully aligned with hook/service pattern
- Program/Workshop/Session CRUD uses hierarchical invalidation
- All three event levels use Tabs pattern for active/deleted (TrashTabPattern available for future use)
- Ready for next audit/fix plan or new feature development

---
*Phase: 07-existing-modules-audit-and-fix*
*Completed: 2026-08-30*

## Self-Check: PASSED
- All 7 modified files exist on disk
- All 3 task commits found in git history
- Build compiles clean (pnpm build)
- Lint passes with 0 errors (pnpm lint)