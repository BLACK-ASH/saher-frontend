# Plan 05-04: Admin Payroll Slice — SUMMARY

## Status: COMPLETED ✓

All tasks completed successfully. This plan shipped with the broken squash
`fcbacfb` and its UI layer was **reconciled** after the 05-02 data layer was
rewritten against the verified backend contract (05-02-SUMMARY for details).

## Deliverables

### Files Created/Modified

| File | Status | Description |
|------|--------|-------------|
| `app/(main)/(admin)/payroll/page.tsx` | ✓ Reconciliated | Admin payroll page with RoleGuard, year/month filters, Run Now trigger |
| `features/payroll/payroll-table.tsx` | ✓ Rewritten | Server-paged table with progress bars, status badges, row actions |
| `features/payroll/payroll-history-dialog.tsx` | ✓ Rewritten | Per-employee payroll history dialog (per-user endpoint) |
| `features/payroll/record-payment-dialog.tsx` | ✓ Updated | Installment payment dialog with mode radio + incremental amount |
| `components/sidebar/nav-list.tsx` | ✓ Modified | Added Payroll entry to Admin sidebar group |
| `hooks/use-payroll.ts` | ✓ Rewritten | `usePayroll(filters, page)` + `usePayrollByUser(userId, page)` |
| `features/reimbursement/bill-status-badge.tsx` | ✓ Fixed | Added missing `BillStatusBadge` component export |

## Acceptance Criteria Met

- ✅ Admin can browse/filter/paginate payroll records with year/month filters
- ✅ Server-paged table displays Employee, Date, Expected ₹, Paid ₹, Progress bar, Status, Actions
- ✅ Row actions: View History (always, per employee), Record Payment (when status !== "paid")
- ✅ Per-employee payroll history dialog (History icon) opens with paginated list via `usePayrollByUser(userId, page)`
- ✅ Record Payment dialog: mode radio (cash/cheque/upi/Other), incremental installment amount, employee name via `resolveName`
- ✅ D-26: Submit button disabled with "Recording…" while pending
- ✅ D-28: On error, dialog stays open with values intact; only toast.error shown
- ✅ Run Now button: Confirmation dialog (AlertDialog), both trigger and confirm disabled with "Generating…" during synchronous cron run; success toast "Payroll calculation started — check notifications"
- ✅ Page guarded by `RoleGuard allow={(r) => can(r, "read", "payroll")}`
- ✅ Payroll appears in Admin sidebar group (Wallet icon)
- ✅ Build compiles without type errors

## Verification

```bash
pnpm typecheck                 # ✓ passes
pnpm lint                      # ✓ 0 errors
pnpm exec vitest run tests/payroll-api.test.ts tests/payroll-hook.test.tsx  # ✓ 9/9
pnpm build                     # ✓ compiles
```

## Reconcile Notes (vs original squash)

The original 05-04 commit consumed the squash-era payroll service/hook that
did not exist. Fields like `PayrollResponse.employeeId`, `month`, `year`,
`updatedAt` were invented; backend truth (verified at
`../saher-backend/src/payroll/schema.ts`) is: `user` (ObjectId), `dateOfCreation`,
`dateOfPayment?`, `mode`, `baseSalary`, `expectedSalary`, `paidSalary?`,
`bonus`, `deduction`, `status ∈ [paid, unpaid, partially-paid, approved]`; PUT
body is exactly `{mode, paidSalary}` (INCREMENTAL). All four UI files now
consume the verified contract. The history dialog opens per-employee (Plan G-05
intent) using `PayrollTable` row's `payroll.user`.

## Next Steps
05-05 verification + 05-02/05-06 SUMMARYs written during the phase-05 repair. Phase 05 complete.