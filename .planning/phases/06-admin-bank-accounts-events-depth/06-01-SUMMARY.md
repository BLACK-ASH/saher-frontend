---
phase: 06-admin-bank-accounts-events-depth
plan: 01
subsystem: api
tags: [admin, onboarding, directory, zod, msw, react-query]

# Dependency graph
requires:
  - phase: 02
    provides: apiFetch (single HTTP funnel + 401 refresh), normalizeList, lib/permissions can()
provides:
  - services/admin.api.ts (registerAccount + getAdminUsers + adminUserResponseSchema)
  - five-value employeeType enum reconciled to backend list
  - register wizard submitting through registerAccount
  - users directory reading through typed service + Create Employee CTA
affects:
  - 06-02 (account/bank mgmt builds on services/admin.api.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "services/admin.api.ts: zod response schema → z.infer type, apiFetch only, throw-on-failure (payroll.api.ts style)"
    - "Unpaginated backend array wrapped via normalizeList for client-side table"

key-files:
  created:
    - services/admin.api.ts
    - tests/admin-api.test.ts
    - tests/register-schema.test.ts
  modified:
    - features/register/register-schema.ts
    - features/register/employee-details.tsx
    - features/register/user-register.tsx
    - features/users/page.tsx
    - hooks/use-profile.ts
    - lib/api-wrapper.ts

key-decisions:
  - "ApiResponse type exported from lib/api-wrapper.ts so registerAccount can return the success-shaped envelope"
  - "Page reconciles AdminUserResponse (nullable image) to UserT (required image) via documented cast; columns stay typed for canonical UserT"

patterns-established:
  - "Service fns mirror backend contract with zod schemas; no legacy 'if (!res.success)' success blocks"
  - "Client-side directory pagination/search since GET /admin/users is unpaginated"

requirements-completed: [ADMN-01, ADMN-02]

# Metrics
duration: 15min
completed: 2026-08-29
---

# Phase 6 Plan 1: Admin Onboarding + Directory Summary

**Atomic admin onboarding service (registerAccount + getAdminUsers + adminUserResponseSchema) wired through the register wizard and users directory, with the employeeType enum reconciled to the backend five-value list and msw-tested contract coverage.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-29T14:41:30Z
- **Completed:** 2026-08-29T14:59:26Z
- **Tasks:** 3
- **Files modified:** 5 created, 5 modified

## Accomplishments
- Reconciled `employeeType` enum (register-schema.ts, employee-details.tsx, use-profile.ts AccountT) to the backend five-value list `['free','intern','full-time','part-time','volunteer']`; the `part-time ⇒ employeeShift` refine survives (pinned by a test).
- Created `services/admin.api.ts` in the throw-on-failure payroll style: `registerAccount` (POST /api/admin/account, exact `{user,account,bank}`), `getAdminUsers` (GET /api/admin/users, normalizeList-wrapped), and `adminUserResponseSchema` mirroring backend `userSchemaFinal`.
- Rewired the 4-step register wizard onSubmit through `registerAccount`; removed the inline `apiFetch` + `if (!response.success)` success-check.
- Adopted `getAdminUsers` in the users directory `["user","list"]` queryFn (queryKey unchanged — load-bearing for wizard/user-action invalidation) and added a `can(r,'write','account')`-gated "Create Employee" CTA navigating to `/register`.
- Added 7 passing tests (3 register-schema + 4 admin-api) proving free/intern parse, the part-time refine, exact POST body shape, and the users-list contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reconcile employeeType enum to backend five-value list** - `d2050e9` (feat)
2. **Task 2: Create services/admin.api.ts + msw tests + rewire wizard** - `ce5fad1` (feat)
3. **Task 3: Adopt typed service in directory + Create Employee CTA** - `5ac5e41` (feat)

## Files Created/Modified
- `services/admin.api.ts` - registerAccount + getAdminUsers + adminUserResponseSchema (zod, throw-on-failure)
- `tests/admin-api.test.ts` - msw: users list normalizeList, register POST exact body, schema parse/reject
- `tests/register-schema.test.ts` - pins free/intern enum values + part-time refine survival
- `features/register/register-schema.ts` - employeeType enum now five-value (+ free/intern)
- `features/register/employee-details.tsx` - rendered Select list matches the five-value enum
- `features/register/user-register.tsx` - onSubmit submits through registerAccount; dropped inline apiFetch success-check
- `features/users/page.tsx` - queryFn uses getAdminUsers; Create Employee button gated by can('write','account')
- `hooks/use-profile.ts` - AccountT.employeeType union includes free|intern
- `lib/api-wrapper.ts` - exported `ApiResponse` type (for registerAccount return typing)
- `.planning/phases/06-admin-bank-accounts-events-depth/deferred-items.md` - logged pre-existing session.test.ts failures

## Decisions Made
- Exported `ApiResponse` from `lib/api-wrapper.ts` (was module-private) so `registerAccount` can return a success-shaped typed envelope for the wizard to toast `.message` — matches the plan's `Promise<ApiResponse<{id:string}>>` interface.
- Kept `["user","list"]` queryKey unchanged (load-bearing: `features/users/user-action.tsx` and the register wizard both invalidate it).
- Reconcile `AdminUserResponse` (nullable image, per backend `userSchemaFinal`) to the table's canonical `UserT` via a documented single-point cast — the columns stay typed for `UserT` and unrelated to this task.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Export ApiResponse type from api-wrapper for the plan's return type**
- **Found during:** Task 2 (creating services/admin.api.ts)
- **Issue:** The plan's interface is `Promise<ApiResponse<{id:string}>>`, but `ApiResponse` was a module-private type in `lib/api-wrapper.ts` — impossible to import into the new service.
- **Fix:** Added `export` to the `ApiResponse` type declaration (no behavior change).
- **Files modified:** lib/api-wrapper.ts
- **Verification:** typecheck + admin-api tests pass.
- **Committed in:** ce5fad1 (Task 2 commit)

**2. [Rule 1 - Bug] UserDataTable generic type friction between AdminUserResponse and UserT**
- **Found during:** Task 3 (wiring directory to getAdminUsers)
- **Issue:** `AdminUserResponse.image` is nullable (backend `userSchemaFinal` sends null for self-registered users), while the table columns are typed for the canonical `UserT` with required image — `ColumnDef<UserT>[]` was not assignable to data `AdminUserResponse[]`, so typecheck failed.
- **Fix:** Reconcile at the page boundary with a documented cast `data.items as unknown as UserT[]`; columns remain typed for `UserT` and the existing no-rebuild table contract is honored.
- **Files modified:** features/users/page.tsx
- **Verification:** `pnpm typecheck` passes.
- **Committed in:** 5ac5e41 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both are necessary for the plan's stated contract (typed return, no table rebuild) and introduce no scope creep.

## Issues Encountered
- Pre-existing `tests/session.test.ts` failures (2/2 on `performLogoutCleanup` — a `window.location.assign` mock-harness issue) are unrelated to this plan and fail on the base commit. Logged to `deferred-items.md`; out of scope per the executor scope boundary. The plan's "full suite still green" criterion counts these as a pre-existing delta (394/396 in the full suite pass; all 7 new plan tests pass).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `services/admin.api.ts` is in place for plan 06-02 to extend (account GET/PUT, bank CRUD+restore) on the same typed, tested service.
- The register wizard and directory now read the verified backend contract; onboarding of every employee type (including free/intern) works against `POST /api/admin/account`.

---
*Phase: 06-admin-bank-accounts-events-depth*
*Completed: 2026-08-29*

## Self-Check: PASSED
- FOUND: services/admin.api.ts, tests/admin-api.test.ts, tests/register-schema.test.ts, 06-01-SUMMARY.md
- FOUND: commits d2050e9, ce5fad1, 5ac5e41
