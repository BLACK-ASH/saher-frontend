# SAHER FIX Stabilization — Roadmap & Status Tracker

> Tracks the FIX_PHASE.md stabilization effort across `saher-frontend` and `saher-backend`.
> Each phase updates its row and a FIX-STATE.md entry with root cause + verification evidence.

## Phase Map

| # | Phase | Priority | Status | Root Cause (verified) | Files | Evidence |
|---|-------|----------|--------|----------------------|-------|----------|
| 0 | Authentication & Authorization | CRITICAL | ✅ **DONE** | deadlock (no verify link + auth-gated request); no status check on guard/refresh; no session flush on admin delete | backend: account/controller, onboard-mail, user/controller, token, protected-route, auth.test | `pnpm typecheck` PASS, `pnpm lint` 0 err, `pnpm test` 257/257 |
| 1 | Soft Delete & Resource Lifecycle | CRITICAL | ⏳ Pending | React Query hooks drop `isDeleted` → identical cache key for Active/Deleted | hooks/use-programs,sessions,workshops; backend program.controller | |
| 2 | Image/File Preview | HIGH | ⏳ Pending | upload controllers return `url` not `src`; duplicated mapping; leave `proof` mis-store | backend upload controllers + openapi; frontend image-upload, leave, register, profile, program | |
| 3 | Global Form Validation | HIGH | ⏳ Pending | attendance-correction enum/message mismatch; backend bill/leave validation gaps | features/attendance-correction{,view}; VALIDATION-AUDIT | |
| 4 | Bill Management | HIGH | ⏳ Pending | `onView`/`onWithdraw` no-ops on My Bills; backend lacks `.positive()` | my-bills/page; backend bill/schema, bill.model | |
| 5 | User Registration & Profile | HIGH | ⏳ Pending | `accountNumber` missing default; profile read breaks when Account/KYC missing | user-register; backend _services/account, user.controller; profile | |
| 6 | Notice & Leave | HIGH | ⏳ Pending | notice `_id` vs `id` drift; proof stores URL not ObjectId; leave balance double-count | backend notice/leave; frontend noticeboard, apply-leave-dialog | |
| 7 | Attendance Correction | HIGH | ⏳ Pending | `combineDateAndTimeToIso` produces unparseable datetime; message mismatch | lib/date, attendance-correction | |
| 8 | Notification UI | MEDIUM | ⏳ Pending | frontend missing mark-seen/count + bell (backend API exists) | services/notification.api, hooks/use-notification, sidebar-header | |
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
