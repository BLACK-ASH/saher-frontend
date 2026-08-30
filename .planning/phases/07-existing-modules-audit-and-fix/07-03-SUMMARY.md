---
phase: 07-existing-modules-audit-and-fix
plan: 3
subsystem: auth
tags: [auth, token-confirm, sessions, profile, react-query]

requires:
  - phase: 07-existing-modules-audit-and-fix
    provides: "audit-and-fix framework for existing modules"
provides:
  - "Profile active sessions view with revoke action (AUTH-03)"
  - "Token-confirm UX: pending/success/expired states for change-email, change-password, verify-email (AUTH-02)"
  - "All auth form submissions use useMutation (no bare apiFetch)"
affects: ["07-06-responsive", "07-07-test-coverage"]

tech-stack:
  added: []
  patterns:
    - "Consistent useMutation pattern for all auth token-confirm flows"
    - "Active sessions management via TanStack Query with revoke mutation"

key-files:
  created: []
  modified:
    - features/verify-email/components/verify-email-form.tsx
    - features/profile/profile.tsx (pre-existing in worktree)
    - features/profile/email-verification.tsx (pre-existing in worktree)

key-decisions:
  - "All three token-confirm flows (change-email, change-password, verify-email) now consistently use useMutation with pending/error/success handling"
  - "Resend verification email converted from bare apiFetch to useMutation for consistency and proper loading states"
  - "Active sessions UI was already implemented in profile page with accordion, device/IP/lastActive display, and revoke with confirmation dialog"

requirements-completed: ["AUTH-02", "AUTH-03"]

duration: 15min
completed: 2026-08-30
---

# Phase 07 Plan 03: Profile Auth Flows — Token-Confirm UX + Active Sessions Summary

**All three token-confirm flows (change-email, change-password, verify-email) now show pending/success/expired states using useMutation; profile page includes Active Sessions accordion with revoke action**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-30T12:30:00Z
- **Completed:** 2026-08-30T12:45:00Z
- **Tasks:** 7 (6 already implemented, 1 enhanced)
- **Files modified:** 1 (plus 2 pre-existing in worktree)

## Accomplishments

- **AUTH-03 Complete:** Profile page shows "Active Sessions" accordion in right sidebar listing all sessions with device, IP, last active (IST format), "Current" badge, and revoke button (disabled for current session) with confirmation dialog
- **AUTH-02 Complete:** All three token-confirm flows have proper UX states:
  - **change-email:** useMutation with "Verifying..." spinner, success toast + redirect, error handling for expired/invalid tokens
  - **change-password:** useMutation with "Changing..." spinner, success toast + redirect to login, error handling for expired/invalid tokens
  - **verify-email:** Explicit "Verify Email" button (no auto-submit), pending spinner, success toast + redirect, error with inline alert and "Resend Verification Email" button using useMutation
- **Consistency:** No bare `apiFetch` in any form submit handlers — all use `useMutation` with proper loading/error states

## Task Commits

Each task was committed atomically:

1. **Task 1: Add active sessions query + revoke mutation to useProfile** - Already implemented in `hooks/use-profile.ts` and `services/auth.api.ts`
2. **Task 2: Add Active Sessions UI to profile page** - Already implemented in `features/profile/profile.tsx`
3. **Task 3: Add pending/success/expired states to change-email flow** - Already implemented in `features/change-email/components/change-email-form.tsx`
4. **Task 4: Add pending/success/expired states to change-password flow** - Already implemented in `features/change-password/components/change-password-form.tsx`
5. **Task 5: Enhance verify-email flow with explicit states** - `14d0c01` (feat): Enhanced verify-email-form.tsx to use useMutation for resend verification
6. **Task 6: Enhance email-verification component (profile page)** - Pre-existing in worktree: shows "Verified ✓" when emailVerified=true
7. **Task 7: Run lint/typecheck/tests** - `pnpm lint` (0 errors), `pnpm build` (compiles clean), `pnpm test` (424 pass, 2 pre-existing failures in session.test.ts unrelated to this plan)

**Plan metadata:** `14d0c01` (feat: complete 07-03 plan)

## Files Created/Modified

- `features/verify-email/components/verify-email-form.tsx` - Converted resend from bare apiFetch to useMutation, added pending spinner/disabled state
- `features/profile/profile.tsx` (pre-existing) - Renders EmailVerification with emailVerified prop
- `features/profile/email-verification.tsx` (pre-existing) - Shows "Verified ✓" success state when emailVerified=true

## Decisions Made

- All token-confirm flows standardized on `useMutation` pattern with `isPending` spinner, toast success/error, and proper redirects
- Resend verification email now shows "Sending..." spinner and disables button during mutation
- Active sessions UI uses existing Accordion component with formatIstDateTime for IST timestamps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Converted bare apiFetch to useMutation in verify-email resend**
- **Found during:** Task 5 implementation review
- **Issue:** verify-email-form.tsx used bare `apiFetch` for "Resend Verification Email" button, violating "No bare apiFetch in form submit handlers — all use useMutation" must-have
- **Fix:** Added `resendMutation` using `useMutation` with proper onSuccess/onError handlers, pending spinner, and disabled state
- **Files modified:** `features/verify-email/components/verify-email-form.tsx`
- **Verification:** Lint passes (0 errors), build compiles clean, component shows loading state during resend
- **Committed in:** `14d0c01` (Task 5 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for consistency — all auth flows now uniformly use useMutation. No scope creep.

## Issues Encountered

- Pre-existing test failures in `tests/session.test.ts` (2 tests failing due to `performLogoutCleanup` using `window.location.href` instead of `location.assign` in `lib/session.ts`) — unrelated to this plan's scope, not fixed
- Most plan tasks (1-4, 6) were already implemented in the codebase/worktree; only Task 5 required enhancement

## Next Phase Readiness

- AUTH-02 and AUTH-03 complete — profile auth flows have consistent UX with proper loading/error/success states
- Active sessions management ready for use
- Ready for 07-04 (Notifications) and 07-06 (Responsive layout pass)
- 07-07 (Test coverage) should add tests for auth token-confirm flows and session revocation

---

*Phase: 07-existing-modules-audit-and-fix*
*Completed: 2026-08-30*