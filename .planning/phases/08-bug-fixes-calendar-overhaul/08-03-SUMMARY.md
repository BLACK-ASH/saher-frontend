---
phase: 08-bug-fixes-calendar-overhaul
plan: 03
subsystem: ui
tags: [reimbursement, bill-management, pagination, react-query, dialog]

# Dependency graph
requires:
  - phase: 08-bug-fixes-calendar-overhaul
    provides: 08-01 registration error fixes; reimbursement data layer (05-01/05-05/05-06)
provides:
  - Bill Management sidebar nav entry gated on can(r, "read", "preReimbursement")
  - Working pagination threading in the finance bill management table
  - Fixed balance query-key invalidation (["reimbursement","balance"])
  - EditBillDialog for staff pending-bill edits with date locked (D-08)
affects: [08-bug-fixes-calendar-overhaul]

# Tech tracking
tech-stack:
  added: []
  patterns: [render-time nav gating via filter on can(); dialog prefill via form.reset effect]

key-files:
  created:
    - features/reimbursement/edit-bill-dialog.tsx
  modified:
    - components/sidebar/nav-list.tsx
    - features/reimbursement/finance-bill-table.tsx
    - app/(main)/reimbursement/management/page.tsx
    - hooks/use-reimbursement.ts
    - app/(main)/reimbursement/my-bills/page.tsx

key-decisions:
  - "Staff edit dialog maps the single bill.image string into the update schema's images[] array on prefill, since BillResponse.image is singular"
  - "Skipped the optional advance-bill vitest test (Task 3) — not trivial, source assertions are the primary gate per plan"

patterns-established:
  - "Nav entries under the user section use render-time filter() with can() to gate visibility (Bill Management) rather than a separate group"

requirements-completed: [BUGF-04]

# Metrics
duration: 4min
completed: 2026-08-31
---

# Phase 8 Plan 3: Bill Management Usability Summary

**Bill lifecycle made usable end-to-end: Bill Management nav entry for finance/admin, pagination that actually changes pages, corrected balance-key invalidation after mutations, and a staff EditBillDialog (date locked) wired into My Bills.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-31T12:09:36Z
- **Completed:** 2026-08-31T12:14:13Z
- **Tasks:** 3 (Task 3 is verification-only, no code change)
- **Files modified:** 5 (4 modified + 1 created)

## Accomplishments
- Added "Bill Management" nav entry to the sidebar, gated at render time so only finance/admin roles (`can(r, "read", "preReimbursement")`) see it.
- Wired pagination end-to-end: added `onPageChange` to `FinanceBillTable`, wired it into `PaginationFooter`, and passed `setPage` from the management page so page buttons now trigger refetch.
- Fixed the balance-card staleness bug: `invalidate()` now targets `["reimbursement", "balance"]` (matching the canonical key in `balance-card.tsx`) instead of the non-existent `["balance"]`, so the card refreshes after settle/handle/update mutations.
- Created `EditBillDialog` mirroring `create-bill-dialog.tsx` — pre-fills amount/description/images, renders the date read-only (backend locks it), submits only editable fields via the existing `updateBill` mutation with double-submit protection, closes on success, stays open on error (D-28).
- Wired the edit dialog into My Bills via `onEdit` → `setEditBill`.
- Verified the admin advance-bill dialog (D-09): `AdvanceBillDialog` is imported/reachable from the management page and its `UserSearchPicker` calls the live `/api/user/{keyword}` endpoint and populates `selectedUser`.

## Task Commits

1. **Task 1: Nav entry + pagination threading + balance key** - `f7e979e` (fix)
2. **Task 2: EditBillDialog + My Bills wiring** - `58037c6` (feat)
3. **Task 3: Verify advance-bill dialog + user-search picker** - no commit (source-assertion verification only, no code change)

**Plan metadata:** summary commit (docs)

## Files Created/Modified
- `components/sidebar/nav-list.tsx` - Added "Bill Management" entry to `userRoutes` with a render-time `can()` filter gate.
- `features/reimbursement/finance-bill-table.tsx` - Added `onPageChange` prop, wired `PaginationFooter` to it.
- `app/(main)/reimbursement/management/page.tsx` - Passed `onPageChange={setPage}` to `FinanceBillTable`.
- `hooks/use-reimbursement.ts` - Fixed `invalidate()` balance key to `["reimbursement", "balance"]`.
- `features/reimbursement/edit-bill-dialog.tsx` (new) - Staff edit dialog for pending bills.
- `app/(main)/reimbursement/my-bills/page.tsx` - Added edit state + passed `onEdit` to `BillTable`, rendered `EditBillDialog`.

## Decisions Made
- **Singular→plural image mapping:** `BillResponse` exposes a single `image?: string`, but the update schema needs `images: string[]`. Prefill maps `bill.image` into `[bill.image]` (or `[]` when absent) to satisfy the schema — noted deviation from the plan's interface which referenced `bill.images`.
- **No trivial test for Task 3:** The advance-bill dialog verification relies on source assertions (all pass); a render test was not trivial (requires many msw handlers) and the plan marked it optional. Manual verification route documented below.

## Deviations from Plan

None of substance — executed as written, with one interface correction (Rule 1, benign):

### Auto-fixed Issues

**1. [Rule 1 - Bug] `BillResponse.image` is singular, not `bill.images`**
- **Found during:** Task 2 (EditBillDialog creation)
- **Issue:** The plan's `<interfaces>` block referenced `bill.images`, but the actual `privy` schema (`services/reimbursement.api.ts:13`) defines `image?: string` (singular). Prefilling `form.reset({ images: bill.images })` caused a type error (`Property 'images' does not exist`).
- **Fix:** Prefill maps `bill.image ? [bill.image] : []` to satisfy the update schema's `images: string[]`.
- **Files modified:** `features/reimbursement/edit-bill-dialog.tsx`
- **Verification:** `pnpm typecheck` green for the file.
- **Committed in:** `58037c6` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The interface fix was necessary for the update schema to typecheck. No scope creep.

## Issues Encountered
- Pre-existing typecheck failures in unrelated test files (`tests/record-payment-dialog.test.tsx`, `tests/admin-api.test.ts`, etc.) — out of scope, not touched (logged to deferred-items per scope boundary).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Bill management is now reachable and paginated; balance stays fresh after mutations.
- Staff can edit pending bills with the date locked.
- Admin advance-bill creation dialog and its user-search picker confirmed wired (manual route: `/reimbursement/management` → "Create Advance" → dialog opens with working user-search returning backend users).
- Ready for 08-04 (leave fixes).

---
*Phase: 08-bug-fixes-calendar-overhaul*
*Completed: 2026-08-31*

## Self-Check: PASSED

- SUMMARY.md exists on disk at `.planning/phases/08-bug-fixes-calendar-overhaul/08-03-SUMMARY.md`
- Commit `f7e979e` (Task 1) present in git log
- Commit `58037c6` (Task 2) present in git log

