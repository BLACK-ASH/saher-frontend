# Plan 05-05: Finance Bill Management (Handle Queue + Bulk + Recycle) — SUMMARY

## Status: COMPLETED ✓

All tasks completed successfully (re-verified during the phase-05 re-execution).

## Deliverables

### Files Created/Modified

| File | Status | Description |
|------|--------|-------------|
| `app/(main)/reimbursement/management/page.tsx` | ✓ Verified/updated | RoleGuard + Handle Queue \| Recycle Bin tabs + filter toolbar + export slot |
| `features/reimbursement/finance-bill-table.tsx` | ✓ Verified/updated | Selectable queue table with Advance edit/delete row actions |
| `features/reimbursement/handle-bill-dialog.tsx` | ✓ Verified | Reason-required handle form; accept notes auto-created settlement (Quirk 3) |
| `features/reimbursement/bulk-action-bar.tsx` | ✓ Verified | Floating selection bar + shared-reason confirm + progress readout |
| `features/reimbursement/recycle-bin.tsx` | ✓ Verified | Deleted-bills table with Restore row action |

## Acceptance Criteria Met

- ✅ RoleGuard wrap: `can(read,'preReimbursement')` exact resource literal
- ✅ Two tabs: "Handle Queue" / "Recycle Bin" (`TabsTrigger` values `queue`/`recycle`)
- ✅ Filter builder always includes `isDeleted:"false"`; cleared filters stay guard-safe via `searchBills` (Quirk-10 verdict) with zero local workaround params
- ✅ 300ms debounce on search input (`setTimeout` pattern)
- ✅ Handle dialog: `merge` field named `reason` with zod `min(5)` "Notes must be at least 5 characters", FieldLabel reads "Notes" (D-10 wording vs backend `reason` — Quirk 4)
- ✅ Three-way RadioGroup prefilled with `initialStatus`, reset on each open
- ✅ Accept toast: "Bill accepted — settlement created automatically" (Quirk 3 education)
- ✅ D-28: onError toast only, dialog stays open with values intact
- ✅ D-26: submit `disabled={handleOne.isPending}` label-swap "Processing…"
- ✅ Bulk bar renders only when `selectedIds.size > 0`; buttons swap to "Processing {done}/{total}…" bound to `bulkProgress`; checkboxes disable mid-run
- ✅ Shared-reason bulk dialog enforces same min-5 rule
- ✅ `handleMany` strictly sequential, failure-tolerant, one summary toast (05-01 hook test pinned)
- ✅ Recycle Bin: restore mutation on each row; invalidation refetches bin + active lists

## Verification

```bash
pnpm exec vitest run tests/reimbursement-hook.test.tsx tests/reimbursement-api.test.ts  # 28/28 ✓
pnpm typecheck  # ✓ passes
pnpm lint       # ✓ 0 errors
pnpm build      # ✓ compiles
```

## Notes

### Original squash aftermath

The phase-05 files in the broken squash commit `fcbacfb` were a corrupted
rewrite that did not match the plan's plugin-verified hook API. The
re-execution restored the tested 065a2da hook logic (D-29 invalidate-only,
sequential bulk) while preserving the squash-era component-facing exports
(`useSearchBills`, `useRecycleBills`, `bills` alias, `HandleStatus`).

### Consumer wiring audit

An independent audit confirmed every consumer matches the restored hook shape
with **zero mismatches**:
- handle-bill-dialog `handleOne.mutate({billId,status,reason})` ✓
- settle-dialog `settle.mutate({settleId, input})` ✓
- advance-bill-dialog `createAdvance.mutate({userId,data})` / `updateAdvance.mutate({id,data})` ✓
- recycle-bin `restore.mutate(billId)` ✓
- create-bill-dialog `createBill.mutateAsync(UserBillCreateInput)` ✓
- my-bills page `bills.data ?? []` ✓

## Next Steps
Plan 05-06: user-bug repairs + advance bill management + export trigger.