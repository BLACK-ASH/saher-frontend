# Plan 05-06: Bill Detail Depth + Settlement + Advance Management + Export — SUMMARY

## Status: COMPLETED ✓

All tasks completed successfully (re-executed during the phase-05 repair).

## Execution Context

Plan 05-06 was committed inside the broken squash `fcbacfb` which left
`advance-bill-dialog.tsx` with an invalid `onSelect` prop (TS2322/TS7006,
blocking `tsc`), `create-bill-dialog.tsx` silently failing to submit (no image
picker although `images: min(1)` is required, plus unrecoverable `any`
types), and unresolved `react-hooks/set-state-in-effect` lint errors in the
management page. The plan was re-executed to completion with all gates green.

## Deliverables

### Files Created/Modified

| File | Status | Description |
|------|--------|-------------|
| `features/reimbursement/lifecycle-timeline.tsx` | ✓ Rewritten | Settlement-prop-driven timeline, data-honest nodes (D-17 amended) |
| `tests/lifecycle-timeline.test.tsx` | ✓ Created | 5 tests: minimalism/status/mode/terminal coverage |
| `features/reimbursement/bill-detail-dialog.tsx` | ✓ Upgraded | `viewerCanAudit` gating, settlement fetch, audit-log pagination, Receipt lightbox |
| `features/reimbursement/advance-bill-dialog.tsx` | ✓ Fixed | `UserSearchPicker` `value`/`onChange`, render-phase resync (no setState-in-effect), date only in create mode |
| `features/reimbursement/create-bill-dialog.tsx` | ✓ Fixed | Image picker (root-cause silent-fail), `FieldError` rendering, date field, `any` removed |
| `features/reimbursement/finance-bill-table.tsx` | ✓ Updated | Advance Edit/Delete row actions gated on `bill.advance > 0` |
| `app/(main)/reimbursement/management/page.tsx` | ✓ Updated | Create Advance + Export toolbar buttons, advance dialog + delete-confirm wiring, render-phase page/selection reset, `viewerCanAudit` |

## Acceptance Criteria Met

- ✅ Timeline renders ONLY backend-recorded nodes (submitted-only minimalism asserted in test)
- ✅ Handled node only when `bill.status !== "pending"`, with reason text, no fabricated actor/timestamps (D-17 amended)
- ✅ Settled node colored green, mode label "Settled via UPI/Cash/Cheque/Other"; pending settlement renders yellow "Settlement Pending" (D-21)
- ✅ Detail dialog fetches settlement + audit ONLY when `viewerCanAudit` is true (`enabled` references the prop); staff callers do zero extra fetches
- ✅ Audit Log section paginated (PAGE_SIZE 5) with PaginationFooter, no unbounded render
- ✅ Record Settlement button only when `settlement.status === "pending"`; opens SettleDialog (matches plan Task 2: mode radio, fixed status "settle", D-26/D-28)
- ✅ Create-bill dialog: images submitted through form state, `images: min(1)` now satisfiable → submit fires and closes on success (root-cause fix for the user bug)
- ✅ Advance dialog: picker single-select via `value`/`onChange`; edit mode hides picker and date field; D-26 disabled submit
- ✅ Advance rows (advance > 0) gain Edit/Delete; delete gates behind AlertDialog confirm before `deleteAdvance`
- ✅ Export fires async `exportReport("xlsx")` with exact toast "Report generation started — check notifications for download" (Pitfall 7 — no direct download attempt)
- ✅ `pnpm typecheck && pnpm lint` exit 0; lifecycle-timeline tests 5/5; full suite green except 2 pre-existing out-of-scope `session.test.ts` failures

## Notes

### UI wiring not reachable

`advance-bill-dialog.tsx`, `settle-dialog.tsx`, `lifecycle-timeline.tsx`,
`finance-bill-table.tsx` (and its advance row actions) are now wired and
type-checked, but a **live end-to-end manual check against the backend is not
possible in this environment** (no running API). The verify step is limited to
typecheck/lint/tests/build.

### Root-cause register (user-visible bugs fixed)

- **Silent create-bill failure**: `userBillCreateSchema.images` requires `min(1)` but the dialog had no image field → `handleSubmit` never validated → silent no-op. Fixed by rendering `ImageUpload` bound to the form's `images` field.
- **Admin advance flow broken**: `UserSearchPicker` has no `onSelect` prop; the dialog passed one. Fixed to `value`/`onChange` with `MailUser[]`.
- **3 `set-state-in-effect` lint errors**: replaced query-filter-triggered page reset and selection-clear effects with React's render-phase state adjustment pattern.

### Original squash debt still open (acknowledged, not fixable client-side)

- **D-30**: backend `restore` endpoint is guarded — "Staff Restore" UI could still 403.
- **D-31**: backend `searchBillQuerySchema` needs a `status` field for `isDeleted=false` filtering; search currently passes `isDeleted` in query params only.
- 2 pre-existing `tests/session.test.ts` failures (untouched, unrelated to phase 05).

## Verification

```bash
pnpm exec tsc --noEmit        # ✓ passes
pnpm lint                     # ✓ 0 errors
pnpm exec vitest run          # ✓ 385 pass, 2 pre-existing session.test failures
pnpm build                    # ✓ compiles
```

## Next Steps
Phase 05 complete. Proceed to Phase 6 (Admin Bank/Accounts & Events Depth) or run `/gsd-verify` for a goal-backward check.