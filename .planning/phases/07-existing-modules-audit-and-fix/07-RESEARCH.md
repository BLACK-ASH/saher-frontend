# Phase 07: Existing Modules Audit-and-Fix — Research

**Phase:** 07 — Existing Modules Audit-and-Fix
**Date:** 2026-08-30
**Status:** Research complete

---

## Executive Summary

This phase systematically audits and fixes all pre-existing modules (attendance, calendar, users, program, dashboard, profile, notifications, auth surfaces) to align with the contract and shared patterns established in Phases 1–6. The alignment is mechanical once the factory, IST utils, shared footer, and session-death handler exist — which they now do.

---

## Module-by-Module Audit Findings

### 1. ATTENDANCE (features/attendance/, hooks/use-attendance.ts, services/attendance.api.ts)

**Status: LARGELY ALIGNED**

- **Services/Zod/Query patterns**: ✓ Uses `services/attendance.api.ts` with zod schemas (`attendanceSchema`), `hooks/use-attendance.ts` with TanStack Query
- **IST dates**: ✓ All date rendering uses `formatIstDate` from `lib/date.ts`
- **Correction request→approval loop**: ✓ Fully implemented in `features/attendance-correction/` with `useAttendanceCorrection` hook, `AttendanceCorrectionRequests` table with status badges, and `AttendanceComparision` dialog
- **Attendance grid**: ✓ `features/attendance/attendance-table.tsx` uses fast checkbox grid (built in 06-06)
- **Gap**: None critical — module is already contract-aligned

### 2. CALENDAR (features/calendar/, hooks/use-calendar.ts, services/calendar.api.ts)

**Status: PARTIALLY ALIGNED**

- **Services/Zod/Query patterns**: ✓ Uses `services/calendar.api.ts`, `hooks/use-calendar.ts`
- **IST dates**: ⚠️ `features/calendar/calendar.tsx:13` uses `new Date()` directly for initial `calendarDate` state — should use `lib/date.ts` utility
- **Custom events**: ✓ `AddEventDialog` creates custom events
- **Google sync**: Unknown — no visible Google sync integration in frontend code (backend may handle, but frontend has no UI for it)
- **Month aggregation**: FullCalendar handles rendering; need to verify data fetching matches backend contract
- **Gaps**: 
  - Raw `new Date()` usage in calendar.tsx
  - Google sync verification needed (AUDT-02)

### 3. USERS (app/(main)/users/, features/users/, features/register/, hooks/use-admin.ts)

**Status: PARTIALLY ALIGNED**

- **Services/Zod/Query patterns**: ✓ Uses `services/admin.api.ts`, `hooks/use-admin.ts` with `useAdminUsers` query
- **Admin directory**: `app/(main)/users/page.tsx` renders `UserDataTable` with pagination, search, role badges
- **Registration wizard**: `features/register/` uses multi-step zod schemas (`register-schema.ts`) with cross-field validation — modern patterns ✓
- **Gaps**: 
  - User detail page `app/(main)/users/[id]/page.tsx` has inline type casting (`// eslint-disable-next-line @typescript-eslint/no-explicit-any`)
  - Need to verify full pattern alignment for user CRUD actions

### 4. PROGRAM (app/(main)/(admin)/program/, features/program/, hooks/use-programs.ts, services/program.api.ts)

**Status: ALIGNED**

- **Services/Zod/Query patterns**: ✓ Uses `services/program.api.ts` with zod, `hooks/use-programs.ts`
- **Hierarchy**: Programs → Workshops → Sessions all have CRUD with trash/restore
- **Shared trash pattern**: ✓ Uses `TrashTabPattern` from `components/shared/` consistently across all three levels
- **IST dates**: ✓ Session datetime uses future-dated validation with IST contract
- **Gaps**: Minor — `all-programs.tsx` uses inline Dialog state; could be extracted but functional

### 5. PROFILE (features/profile/, hooks/use-profile.ts)

**Status: NEEDS WORK (AUTH-02, AUTH-03)**

- **Services/Zod/Query patterns**: ✓ Uses `hooks/use-profile.ts` with `apiFetch`
- **IST dates**: ✓ Uses `formatIstDate` from `lib/date.ts`
- **Email verification**: ✓ `EmailVerification` component shows "unverified" badge with resend cooldown — basic pending state
- **Password/email token-confirm flows**: ⚠️ `features/change-email/components/change-email-form.tsx` and `features/change-password/components/change-password-form.tsx` submit token directly but show **no explicit pending/success/expired states** — just toast success then redirect (AUTH-02)
- **Active sessions view/revoke**: ❌ **MISSING** — profile page shows account status (email verified, active, banned) but **no active sessions list or revoke action** (AUTH-03)
- **Gaps**: 
  - No pending/success/expired UI states for token-confirm flows
  - No active sessions management UI

### 6. NOTIFICATIONS (features/notification/, hooks/use-notification.ts, services/notification.api.ts)

**Status: MOSTLY ALIGNED**

- **Services/Zod/Query patterns**: ✓ Uses `services/notification.api.ts`, `hooks/use-notification.ts`
- **Action buttons**: ✓ `NotificationBox` renders download/external/navigate actions correctly; download uses `target="_blank"` (fixed in 06-07)
- **Unseen badge**: Need to verify — `useNotification` hook returns `data` array but no explicit unseen count; check backend contract
- **Gaps**: Unseen badge accuracy unverified

### 7. DASHBOARD (features/dashboard/)

**Status: ALIGNED**

- **Services/Zod/Query patterns**: Uses attendance hooks
- **IST dates**: ✓ Uses `formatIstDate`, `dateToIstDateOnly`, `istDateOnlyToDate` from `lib/date.ts`
- **Attendance grid**: ✓ Uses fast checkbox grid (06-06)
- **Gaps**: Minor — `attendance-dashboard.tsx` uses `new Date()` for "today" initialization

### 8. AUTH SURFACES (features/login/, features/register/, lib/api-wrapper.ts, proxy.ts, lib/session.ts)

**Status: PARTIALLY ALIGNED (AUDT-07, AUDT-08 gaps)**

- **Login**: ✓ `useLogin` hook with `?next=` return nav (window.location.href)
- **Logout**: ✓ `performLogoutCleanup` in `lib/session.ts`
- **Session death handler**: ✓ `handleSessionDeath` with once-guard, clears query cache, redirects to `/login?next=`
- **Refresh path**: ✓ `apiFetch` in `lib/api-wrapper.ts` implements single-flight refresh with exactly one retry
- **Token-confirm flows**: ⚠️ See PROFILE gaps above (AUTH-02)
- **Tests**: ❌ **No tests for**:
  - Money-path flows double-submit gating (AUDT-07): reimbursement handle/settle, payroll installments, bank mutations
  - Auth refresh path (AUDT-08): single retry then session-death handler
- **Gaps**: Test coverage for critical money/auth paths missing

---

## Cross-Cutting Audit

### Shared Trash UX Pattern (AUDT-05)

**Component**: `components/shared/trash-tab-pattern.tsx` — a structural placeholder expecting backend `isDeleted` filter.

**Usage found**:
- ✅ `features/noticeboard/notice-trash.tsx` — uses it (backend doesn't support listing trashed yet)
- ✅ `features/reimbursement/recycle-bin.tsx` — uses it
- ✅ `features/program/program/all-programs.tsx` — uses tabs + TrashTabPattern
- ✅ `features/program/workshop/all-workshops.tsx` — same
- ✅ `features/program/session/all-sessions.tsx` — same

**Missing usage**: Need to verify all soft-deletable resources use it (attendance-correction? users? leave? mail? payroll?)

### Responsive Layout Pass (AUDT-06)

No systematic responsive audit done. Staff-used screens: attendance tables, dashboard, leave apply, mail compose, reimbursement create, payroll table, program cards, user directory.

### Test Coverage (AUDT-07, AUDT-08)

**Existing test files** (`tests/`):
- `tests/attendance-diff.test.ts` — 06-06 diff engine
- `tests/reimbursement-hook.test.tsx`, `tests/reimbursement-api.test.ts`
- `tests/payroll-hook.test.tsx`, `tests/payroll-api.test.ts`
- `tests/admin-bank-api.test.ts`
- `tests/api-wrapper.test.ts` — tests `apiFetch` including 401 refresh retry
- `tests/session.test.ts` — tests `performLogoutCleanup` (2 known pre-existing failures)

**Missing tests**:
- Double-submit gating on money mutations (reimbursement handle/settle, payroll installments, bank mutations)
- Auth refresh path integration test (single retry → session death)

### Legacy Date Utility Cleanup

- `lib/utils/time.ts` — **DELETED** (was removed in 02-06)
- `lib/utils/html-preview.ts` — remains (utility, not date-related)
- Zero imports of `lib/utils/time` across features/hooks/services ✓
- Raw `new Date()` still found in: `calendar.tsx`, `register/basic-details.tsx`, `register/employee-details.tsx`, `attendance-dashboard.tsx`, `notice-expiry-badge.tsx`, `create-bill-dialog.tsx` — these are for UI initialization (default month/date pickers), not for display/parsing. Acceptable but could use `dateToIstDateOnly(new Date())` for consistency.

---

## Requirements Mapping

| Requirement | Status | Notes |
|-------------|--------|-------|
| AUDT-01 | ✅ Done | Attendance + correction loop aligned |
| AUDT-02 | ⚠️ Partial | Calendar: raw Date, Google sync unverified |
| AUDT-03 | ⚠️ Partial | Users: minor type issues; Program: aligned |
| AUDT-04 | ⚠️ Partial | Notifications: actions OK, unseen badge unverified |
| AUDT-05 | ⚠️ Partial | TrashTabPattern shared but not on all resources |
| AUDT-06 | ❌ Missing | No responsive pass completed |
| AUDT-07 | ❌ Missing | No money-path double-submit tests |
| AUDT-08 | ❌ Missing | No auth refresh path tests |
| AUTH-02 | ❌ Missing | Token-confirm flows lack pending/success/expired states |
| AUTH-03 | ❌ Missing | No active sessions view/revoke in profile |

---

## Recommended Plan Structure

Given the audit, Phase 07 should decompose into focused plans:

1. **07-01**: Calendar alignment (IST dates, Google sync verification)
2. **07-02**: Users/Program final alignment (clean up type casts, verify CRUD)
3. **07-03**: Profile auth flows — email/password token-confirm UX + active sessions view/revoke (AUTH-02, AUTH-03)
4. **07-04**: Notifications — verify unseen badge, ensure all action types work
5. **07-05**: Shared trash pattern enforcement — audit all soft-delete resources use TrashTabPattern
6. **07-06**: Responsive layout pass on staff screens
7. **07-07**: Test coverage — money-path double-submit + auth refresh path
8. **07-08**: Final raw-date sweep + lint/typecheck gate

MVP mode: each plan delivers a complete vertical slice.

---

## Notes

- Backend contract for session listing (active sessions) needs verification — may require new endpoint
- Google Calendar sync likely backend-only; frontend just needs verification
- `lib/date.ts` is the single source of truth for IST — all display/parsing routes through it already
- Phase 7 depends on Phases 1–6; all shared infrastructure exists