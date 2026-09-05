# SAHER FIX Stabilization — Roadmap & Status Tracker

> Tracks the FIX_PHASE.md stabilization effort across `saher-frontend` and `saher-backend`.
> Each phase updates its row and a FIX-STATE.md entry with root cause + verification evidence.

## Phase Map

| # | Phase | Priority | Status | Root Cause (verified) | Files | Evidence |
|---|-------|----------|--------|----------------------|-------|----------|
| 0 | Authentication & Authorization | CRITICAL | ✅ **DONE** | deadlock (no verify link + auth-gated request); no status check on guard/refresh; no session flush on admin delete | backend: account/controller, onboard-mail, user/controller, token, protected-route, auth.test | `pnpm typecheck` PASS, `pnpm lint` 0 err, `pnpm test` 257/257 |
| 1 | Soft Delete & Resource Lifecycle | CRITICAL | ✅ DONE | React Query hooks drop `isDeleted` → identical cache key for Active/Deleted | hooks/use-programs,sessions,workshops; backend program.controller | |
| 2 | Image/File Preview | HIGH | ✅ **DONE** | upload controllers return `url` not `src`; duplicated mapping; leave `proof` mis-store; Media refs not populated in GET controllers; response schemas expected `z.string()` instead of `z.object({id,src,alt})` | backend: all 6 models' GET controllers `.populate()` proof/images/image/document/aadhar/pan/resume; leave.controller (create,update,review), create-correction.ts; frontend: leave.api.ts, attendance-correction.api.ts, apply-leave-dialog.tsx, leave-details-dialog.tsx | `pnpm lint` 0 err, `pnpm typecheck` PASS |
| 3 | Global Form Validation | HIGH | ✅ **DONE** | attendance-correction enum/message mismatch; backend bill/leave validation gaps | features/attendance-correction{,view}; VALIDATION-AUDIT | |
| 4 | Bill Management | HIGH | ✅ **DONE** | `onView`/`onWithdraw` no-ops on My Bills; backend lacks `.positive()`; Select.Item empty value crash; missing `await bill.save()` on soft delete | my-bills/page; backend bill/schema, bill.model; management/page.tsx (sentinel fix); admin.controller, user.controller (await fix) | verified: `.positive()` in bill/schema, `await bill.save()` in user+admin soft-delete, onView→BillDetailDialog + onWithdraw→AlertDialog wired |
| 5 | User Registration & Profile | HIGH | ✅ **DONE** | `accountNumber` missing default; profile read breaks when Account/KYC missing; `dateToIstDateOnly` crashes on string dates (apiFetch returns strings not Date) | user-register; backend _services/account, user.controller; profile; lib/date.ts (dateToIstDateOnly accepts string) | verified: USER-01 (bankName string + accountNumber default + admin.test), USER-02 (aadhar/pan/resume `.nullish()` + fallback when no Account + null-guard in profile + manager page) |
| 6 | Notice & Leave | HIGH | ✅ **DONE** | notice `_id` vs `id` drift; proof stores URL not ObjectId; leave balance double-count; leave GET controllers missing `.populate('proof')` | backend notice/leave; frontend noticeboard, apply-leave-dialog, leave-details-dialog, leave.api.ts | proof populated on all leave controllers (get/update/review) |
| 7 | Attendance Correction | HIGH | ✅ **DONE** | `combineDateAndTimeToIso` produces unparseable datetime; message mismatch; create endpoint returns unpopulated proof | lib/date, attendance-correction; backend create-correction.ts | message min(3), counter /300, date utility fixed, proof populated on create |
| 8 | Notification UI | MEDIUM | ✅ **DONE** | frontend missing mark-seen/count + bell (backend API exists); `getUnseenCount` read count from `data` instead of `meta` | services/notification.api, hooks/use-notification, sidebar-header, features/notification/{notification-box,notification-bell} | verified: `res.meta.count`, PATCH /:id mark-seen, unread/read distinction + error state; FE lint 0 err / build pass / 430 tests, BE 258 tests |
| 9 | Full Regression Testing | CRITICAL | ⏳ Pending | needs E2E-style regression; build≠feature | REGRESSION-REPORT.md | |

## Execution Order / Dependencies

```text
PHASE 0 (DONE) ──> PHASE 1 ──> PHASE 2 ─┬─> PHASE 4 ──> PHASE 9
                                       ├─> PHASE 3
                                       └─> PHASE 6 (depends 2)
PHASE 5, 7, 8 independent
```

## Standing Verification Rule

Every phase must pass for BOTH repos before marking DONE:
- Backend: `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` (docs:build + tsc)
- Frontend: `pnpm lint` · `pnpm test` · `pnpm build`
- The complete data/request flow verified, not just compilation.

## Git Safety

- Only commit files relevant to the phase; never commit unrelated pre-existing working-tree changes.
- Existing unrelated uncommitted changes (frontend: dashboard deletion, payroll/session edits; backend: reimbursement status-filter) are tracked separately and left untouched.
