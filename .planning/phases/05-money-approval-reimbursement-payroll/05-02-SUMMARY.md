# Plan 05-02: Payroll Data Layer + useUserMap — SUMMARY

## Status: COMPLETED ✓

All tasks completed successfully.

## Execution Context

Plan 05-02 was originally committed as part of the broken squash commit `fcbacfb`
("feat(money-pipeline): Complete Phase 5") which corrupted the reimbursement
hook and shipped an unverified payroll service. This plan was **re-executed**:
the payroll service and both hooks were rewritten against the live backend
contract and pinned with fresh tests.

## Deliverables

### Files Created/Modified

| File | Status | Description |
|------|--------|-------------|
| `services/payroll.api.ts` | ✓ Rewritten | Verified contract mirror with `payrollSchema`, `payrollUpdateInputSchema`, `getPayrollList`, `getPayrollByUser`, `updatePayroll`, `runPayrollCron` |
| `hooks/use-payroll.ts` | ✓ Rewritten | `usePayroll(filters, page)` + `usePayrollByUser(userId, page)`, invalidate-only money-safe mutations |
| `hooks/use-user-map.ts` | ✓ Rewritten | Builds `Map<id,name>` by merging all cached `["users",...]` searches; `resolveName` with short-id fallback |
| `tests/payroll-api.test.ts` | ✓ Rewritten | 7 contract tests: incremental PUT body, empty-body cron, enum exactness |
| `tests/payroll-hook.test.tsx` | ✓ Updated | 2 tests for new `{list, payInstallment, runCron}` shape |
| `tests/user-map.test.tsx` | ✓ Written | 2 tests: map merge dedupe, fallback resolution |

## Acceptance Criteria Met

- ✅ Live contract verified against `../saher-backend/src/payroll/payroll.routes.ts` + `schema.ts`
- ✅ `payrollSchema` mirrors backend exactly: `mode` enum `["cash","cheque","upi","-"]`, `status` enum `["paid","unpaid","partially-paid","approved"]`, `paidSalary`/`dateOfPayment` optional
- ✅ `updatePayroll` sends body exactly `{mode, paidSalary}` — the INCREMENTAL installment, never cumulative (Quirk 8)
- ✅ `runPayrollCron` sends POST `/api/payroll/cron` with NO body (Quirk 7, synchronous)
- ✅ Omitted year/month produce no query params
- ✅ Both mutations invalidate `["payroll"]`, zero `setQueryData` (D-29 money rule)
- ✅ `resolveName("abc123456789")` on empty cache → `"…456789"` fallback
- ✅ Merging overlapping cached searches yields one record per id
- ✅ `pnpm typecheck && pnpm lint` exit 0; payroll-api 7/7, payroll-hook 2/2, user-map 2/2

## Notes

### UsePayroll interface deviation (plan vs implementation)

The plan specified `usePayroll` returning `{list, byUser, payInstallment, runCron}`
where `list`/`byUser` were query-returning functions. Calling `useQuery` from
within a returned function violates `react-hooks/rules-of-hooks` when invoked
in component render. Implemented instead:
- `usePayroll(filters: {year?, month?}, page = 1)` → `{ list, payInstallment, runCron }`
- `usePayrollByUser(userId: string | null, page = 1)` → `{ list }` (enabled gated)

`payrollUpdateInputSchema` namespaces the installment input (single-page
`payInstallmentSchema`/`PayInstallmentInput` were not imported anywhere).

### Deliberately not exposed

- `GET /api/payroll/:id` — returns a `Payroll[]` array even for a single record (Quirk 6); no requirement consumes it
- `POST /api/payroll/approve/:id` — no frontend requirement

Both documented in `services/payroll.api.ts` file header.

### useUserMap incremental limitation (D-32)

Backend `/api/user/:keyword` has NO list-all mode (verified against
`user.controller.ts`). The map therefore merges only IDs that appear in the
cache from past searches/picker usage — a fallback `"…{last6}"` renders
unknown IDs deterministically. Full coverage would require a backend list-all
endpoint (no such plan).

## Verification

```bash
pnpm exec vitest run tests/payroll-api.test.ts   # 7/7 ✓
pnpm exec vitest run tests/payroll-hook.test.tsx tests/user-map.test.tsx  # 4/4 ✓
pnpm typecheck  # ✓ passes
pnpm lint       # ✓ 0 errors
```

## Next Steps
Plan 05-04 UI reconcile (payroll page/table/dialogs to corrected hooks) was
completed after this plan; proceed to 05-05 verification.