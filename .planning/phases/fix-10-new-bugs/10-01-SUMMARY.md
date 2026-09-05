---
phase: fix-10-new-bugs
plan: 10-01
type: SUMMARY
files_modified:
  - saher-backend/src/libs/utils/calculate-work-status.ts
  - saher-backend/src/attendance/correction/correction.schema.ts
  - saher-backend/src/leave/leave.controller.ts
  - saher-backend/src/reimbursement/bill/restore-bill.controller.ts
  - saher-backend/src/reimbursement/reimbursement.routes.ts
  - saher-backend/src/attendance/cron-job/create-attendance.cron.ts
  - saher-backend/src/attendance/cron-job/auto-checkout-attendance.cron.ts
  - saher-backend/src/worker/attendance-sync.ts (new)
  - saher-backend/src/worker/index.ts
  - saher-backend/CRON.md
  - saher-backend/tests/libs/calculate-work-status.test.ts (new)
  - saher-backend/tests/leave/leave.test.ts
  - saher-backend/tests/reimbursement/reimbursement.test.ts
  - saher-frontend/services/leave.api.ts
  - saher-frontend/features/profile/profile-info.tsx
  - saher-frontend/features/admin/account-edit.tsx
  - saher-frontend/services/admin.api.ts
  - saher-frontend/features/users/user-action.tsx
  - saher-frontend/services/reimbursement.api.ts (unchanged — read-only usage)
  - saher-frontend/hooks/use-user-map.ts
  - saher-frontend/app/(main)/reimbursement/management/page.tsx
  - saher-frontend/features/reimbursement/handle-bill-dialog.tsx
  - saher-frontend/features/reimbursement/bill-detail-dialog.tsx
  - saher-frontend/features/reimbursement/bill-table.tsx
  - saher-frontend/features/reimbursement/finance-bill-table.tsx
must_haves:
  - Negative workHours gone (clamp + out>in schema guard)
  - Leave balance returns 200 + zero synth instead of 404
  - Change-email actually calls the backend
  - Trashed bills restorable (admin route + cache clear)
  - Attendance create/auto-checkout self-scheduled in-worker (idempotent), HTTP routes unchanged
  - Admin can update a user's role
  - Advance bills show amount (not 0) and full user name, not the raw object id
tasks:
  - All backend + frontend suites green
---

# fix-10 — New Bugs & Bill UX Summary

Six reported bugs plus three follow-ups (admin role change, advance-bill amount 0,
raw user id in bill UI). All verified.

## Backend

- **Bug 1 — negative workHours:** `calculateWorkStatus` clamps both branches
  (`free` and shift) with `Math.max(0, …)`; correction schemas reject
  `outTime <= inTime` via `.refine`. New unit test
  `tests/libs/calculate-work-status.test.ts`.
- **Bug 2 — leave balance 404:** `getLeaveBalance` synthesizes a zero balance
  per active leave type with `id: null` when no `LeaveBalance` doc exists.
  Test updated to the new 200 contract.
- **Bug 3b — bill restore:** `PATCH /api/reimbursement/:billId/restore`
  (`authorize('update','preReimbursement')`) flips `isDeleted` and clears the
  owner's `mybill` cache. Test covers restore + cache/live-bill guard.
- **Bug 4 — attendance cron reliability:** extracted `createAttendanceSync` and
  `autoCheckoutSync` from the HTTP cron controllers; `src/worker/attendance-sync.ts`
  registers two BullMQ queues/workers/schedulers
  (`attendance-create-daily` 00:15 IST, `attendance-auto-checkout-daily` 23:30 IST)
  via idempotent `upsertJobScheduler`, wired into `src/worker/index.ts`. Public
  `POST /api/cron/*` + legacy `:pass` routes untouched (thin wrappers now).
  Empty auto-checkout HTTP response keeps its original "No Pending Auto Checkouts."
  message. CRON.md updated to the self-scheduled model.

## Frontend

- **Bug 3a — change-email no-op:** profile now opens a dialog posting
  `{ email }` to `/api/auth/change-email/request`.
- **Bug 5a — admin account docs:** `account-edit.tsx` gained aadhar/pan/resume
  `ImageUpload` fields; defaults omit the key when no doc exists (backing
  `objectId` validation rejects empty strings).
- **Bug 5b — role change:** `updateUserRole` (`PUT /api/admin/user/:id`,
  body `{ role }`) + "Change Role" dialog in the users directory actions.
- **Bug 2 frontend:** `LeaveBalanceT.id` nullable.
- **Advance bills show 0 in Amount:** my-bills table now renders
  `amount || advance`; handle dialog shows `amount || advance`; finance table
  renders "—" instead of `₹0`. User-said "advance stored in advance field".
- **Raw user id in bill UI:** `handle-bill-dialog` and `bill-detail-dialog` now
  resolve the full user name; `useUserMap` is hydrated from the directory
  query (`["admin","list"]`, `read:user`, 7-day server cache) that the
  management page now prefetches, so finance/recycle/handle rows and the user
  filter show names instead of `…abc123`.

## Verification

- Backend: `pnpm typecheck` PASS · `pnpm lint` 0 errors · `pnpm test` 261/261 PASS
- Frontend: `pnpm lint` 0 errors · `pnpm test` 428/428 PASS · `pnpm typecheck`
  only the 3 pre-existing test-fixture errors (untouched files)

## Notes

- One frontend api-wrapper single-flight test flaked once under load, passed on
  re-run (no code change).
- Legacy `POST /api/attendance/cron/*/:pass` routes intentionally untouched.