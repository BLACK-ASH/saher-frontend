---
phase: 05-money-approval-reimbursement-payroll
plan: 01
subsystem: api
tags: [zod, tanstack-query, msw, reimbursement, money-safety, tdd]

# Dependency graph
requires:
  - phase: 02-shared-infrastructure-session-reliability
    provides: apiFetch envelope wrapper, normalizeList, IST date lib, vitest+msw harness
provides:
  - services/reimbursement.api.ts — typed service for every reimbursement endpoint (quirk-encoded)
  - hooks/use-reimbursement.ts — queries, nine invalidation-only mutations, sequential bulk engine with progress + summary toast
  - msw contract tests pinning D-30/D-31/Quirk-5/Quirk-10 behavior
affects: [05-02-my-bills-ui, 05-03-bill-management-ui, 05-04-payroll, 05-06-audit-export, reimbursement features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quirk-encoding comments above each endpoint function (notice.api.ts style)"
    - "Invalidation-only money mutations — setQueryData forbidden (D-29), spy-enforced"
    - "Sequential bulk loop with {done,total} progress state and single summary toast (D-11/D-27)"

key-files:
  created:
    - services/reimbursement.api.ts
    - hooks/use-reimbursement.ts
    - tests/reimbursement-api.test.ts
    - tests/reimbursement-hook.test.tsx
    - .planning/phases/05-money-approval-reimbursement-payroll/deferred-items.md
  modified: []

key-decisions:
  - "Mirrored live-backend description constraints (min 5 / max 50) instead of plan's 'min 1' — the module's job is encoding verified backend reality"
  - "searchBills appends benign description= when every filter is cleared — Step-0 verdict: isDeleted does NOT count toward the Quirk-10 empty-query guard"
  - "Settle requests coalesce blank description to '' — backend validates description as required string"

patterns-established:
  - "Money mutation rule: every onSuccess routes through one invalidate() helper; no optimistic writes anywhere"
  - "Bulk engine shape: useState progress + for-loop over single-item API + failures array + one summary toast"

requirements-completed: [REIM-01, REIM-02, REIM-03, REIM-04, REIM-05, REIM-06, REIM-07, REIM-08, REIM-09, REIM-10, REIM-11, REIM-12]

# Metrics
duration: 46min
completed: 2026-08-26
---

# Phase 5 Plan 1: Reimbursement Data Layer Summary

**Zod-mirrored reimbursement service (all six quirks encoded) plus useReimbursement hook with invalidation-only mutations, spy-proven no-optimistic-write safety, and a failure-tolerant sequential bulk engine — 28 green tests.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-08-26T13:07:17Z
- **Completed:** 2026-08-26T13:53:21Z
- **Tasks:** 2 (both TDD: RED → GREEN)
- **Files modified:** 5 created

## Accomplishments
- Complete data layer: one typed function per verified backend route (16 endpoints) with response/request zod schemas inferred for downstream UI plans
- D-29 proven structurally: `setQueryData` spy shows zero cache writes across all nine mutations; a gated-refetch test proves cache changes only after server refetch completes
- Bulk engine (D-11/D-27): strictly sequential handleMany, per-item failure tolerance, observable `{done,total}` progress, exactly one summary toast

## Live Backend Findings (Step 0, required by verification)

| Finding | Verdict | Consequence |
|---------|---------|-------------|
| **D-30 restore route** | **MISSING** — `grep restore` on `reimbursement.routes.ts` returns nothing | `restoreBill` built against the locked D-30 contract (`PATCH /:billId/restore`); backend deploy dependency |
| **D-31 status query field** | **MISSING** — `searchBillQuerySchema` has description/amount/user/date/isDeleted/page/limit only, no `status` | `searchBills({status})` sends the param anyway (locked contract); backend deploy dependency |
| **Quirk-10 empty-guard verdict** | `search-bill.controller.ts:17`: `if (!description && !amount && !date && !user) throw 400` — **isDeleted does NOT count** toward the ≥1-search-param rule | `searchBills` always emits `isDeleted=false` and appends benign `description=` when every filter is cleared; pinned by msw test |
| **D-05/D-30 staff-Restore conflict** | Restore endpoint not yet deployed; per D-30 it will carry `authorize('write','preReimbursement')`, which pure-staff roles lack (user has update-only on preReimbursement) | Staff Restore will receive 403 until the backend owner adjusts the guard. **User sign-off 2026-08-26: ship UI per locked D-05, record caveat.** Logged as backend deploy dependency |

Nuance recorded: today's guard evaluates truthiness after parse (`!description` also catches `""`), so a bare `description=` would still 400 against the *current* backend. Real runtime protection arrives with the D-31 deployment (handle queue always sends `status=pending`). Cleared-filters full-list browsing remains a known backend limitation until a list-all path exists.

## Task Commits

Each task was committed atomically (TDD RED → GREEN per task):

1. **Task 1: Live backend check + services/reimbursement.api.ts**
   - `dfff709` (test): failing contract tests
   - `fa97f90` (feat): implement service module
2. **Task 2: hooks/use-reimbursement.ts**
   - `b402c7e` (test): failing hook tests
   - `065a2da` (feat): implement hook with bulk engine

## Files Created/Modified
- `services/reimbursement.api.ts` — bill/settlement/balance/audit-log schema mirrors + 16 endpoint functions (Total: z.string(), raw-array meta-less reads, always-isDeleted search, D-30 restore PATCH)
- `hooks/use-reimbursement.ts` — five queries keyed `["bills",…]/["balance"]/["audit-log"]`, nine invalidation-only mutations, handleMany bulk engine returning flat bag incl. `bulkProgress`
- `tests/reimbursement-api.test.ts` — 24 msw contract tests (quirks pinned)
- `tests/reimbursement-hook.test.tsx` — 4 behavior tests (D-29 structural proof, sequencing, toast-once, progress lifecycle)

## Decisions Made
- Mirrored live-backend `description` validation (min 5 / max 50) over the plan's "min 1" — see deviation below
- `settleBill` coalesces blank description to `""` because backend validates the key as required
- Exposed `getSettlementByBill` as the documented recovery path for the post-accept settlement id (Pitfall 2); `GET /bills` intentionally unused (Quirk 1 trap)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Request-schema description lengths mirrored to live backend**
- **Found during:** Task 1 (Step 0 read of `../saher-backend/src/reimbursement/bill/schema.ts`)
- **Issue:** Plan specified "description min 1", but the live `billSchema` enforces `.min(5).max(50)` ("Description Is Required." / max-length message) — a min-1 frontend schema would let users submit descriptions the backend always rejects
- **Fix:** Shared `descriptionField = z.string().trim().min(5).max(50)` used by userBillCreate/userBillUpdate/adminBillCreate/adminBillUpdate schemas
- **Files modified:** services/reimbursement.api.ts
- **Verification:** adminBillCreateSchema test asserts parse success/failure around the constraint
- **Committed in:** fa97f90

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Single correction aligning the module with its stated purpose (mirror verified backend contracts). No scope creep.

## Issues Encountered
- Pre-existing `tests/session.test.ts` failures (2 tests, location.assign spy) verified failing at base commit 0c26740 before any 05-01 work — out of scope, logged to `deferred-items.md`
- Test-harness race: polling React state inside an open `act()` scope never observed flushed renders; restructured to poll outside act (deterministic gated-handler pattern)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Downstream UI plans (05-02 my-bills, 05-03 management) can consume `useReimbursement` without reading backend source; all quirks are encoded in schemas/comments/tests
- Two backend deploy dependencies must be tracked before recycle-bin/status-filter surfaces go live: D-30 restore endpoint, D-31 search status field (+ eventual guard adjustment for staff Restore)

## Self-Check: PASSED

- Files exist: services/reimbursement.api.ts, hooks/use-reimbursement.ts, tests/reimbursement-api.test.ts, tests/reimbursement-hook.test.tsx — all FOUND
- Commits exist: dfff709, fa97f90, b402c7e, 065a2da — all FOUND in git log
- Acceptance criteria re-run: `grep -c "Total: z.string()"` = 1; vitest 28/28 pass across both files; PATCH "/restore" present; zero GET "/api/reimbursement/bills"; lint exit 0; typecheck exit 0

---
*Phase: 05-money-approval-reimbursement-payroll*
*Completed: 2026-08-26*
