---
phase: 03-noticeboard-pilot
fixed_at: 2026-08-26T05:04:35Z
review_path: .planning/phases/03-noticeboard-pilot/03-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-08-26T05:04:35Z
**Source review:** `.planning/phases/03-noticeboard-pilot/03-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (CR-01, CR-02, WR-01 — per orchestrator scope)
- Fixed: 3 (CR-01 and CR-02 flagged "requires human verification" — logic-class fixes)
- Skipped: 0 in scope; WR-02, WR-03 (pre-existing), WR-04, IN-01–IN-05 out of scope this run

## Fixed Issues

### CR-01: Noticeboard create/edit routes gated by wrong permission — authoring flow broken for every role

**Files modified:** `app/(main)/noticeboard/new/page.tsx` (moved), `app/(main)/noticeboard/[id]/edit/page.tsx` (moved), `app/(main)/noticeboard/new/layout.tsx` (new), `app/(main)/noticeboard/[id]/edit/layout.tsx` (new)
**Commit:** b447cd1
**Status:** fixed — requires human verification
**Applied fix:** Verified against `../saher-backend/src/permission/role-permission.ts`: only role `"user"` holds `notice:write/update/delete`. Nested guards under `(admin)` could not fix the contradiction (layouts compose conjunctively — the parent `user:write` gate would still block role `"user"`), so both routes were moved out of the `(admin)` group into `(main)` at **unchanged URLs** (`/noticeboard/new`, `/noticeboard/[id]/edit` — confirmed present in the build manifest). Two new client layouts gate each route by the resource it touches: `can(r, "write", "notice")` for new, `can(r, "update", "notice")` for edit. Page bodies untouched (git detected 100% renames). `(admin)/layout.tsx` left as-is — its remaining child (`register`) legitimately needs `user:write`.

### CR-02: Edit form shifts expiry back one day via UTC conversion; violates IST constraint

**Files modified:** `features/noticeboard/notice-form.tsx`
**Commits:** aac7700 + b3ad8b6
**Status:** fixed — requires human verification
**Applied fix:** Replaced both UTC conversions (`toISOString().split("T")[0]`) with `dateToIstDateOnly` from `lib/date.ts` — edit prefill now shows the stored IST calendar day, create default is IST-today+7. Follow-up commit b3ad8b6 moved the computation into a `useState` lazy initializer because `pnpm lint` (React Compiler purity rule) errored on `Date.now()` during render; the initializer runs once at mount, which also matches react-hook-form's read-once consumption of `defaultValues`.

### WR-01: Detail query resolves `undefined` → errored query; duplicate caching strategy for the same endpoint

**Files modified:** `hooks/use-notice.ts`, `features/noticeboard/notice-edit.tsx`, `features/noticeboard/notice-detail.tsx`
**Commit:** ffe71ad
**Status:** fixed
**Applied fix:** Confirmed the hazard: `queryFn: async () => (await getNotices()).find(...)` returns `undefined` on miss → React Query v5 throws ("Query data cannot be undefined"). Deleted the detail query and the now-unused `{ id }` hook parameter (sole consumer was `notice-edit.tsx`; test suite exercises only the bare hook). `NoticeEdit` now resolves from the shared `["notices","active"]` cache exactly like `NoticeDetail` — one fetch, one cache entry. Also removed the IN-06 `TODO` comment, which the reviewer tied to this consolidation.

## Skipped Issues

None within the requested scope.

## Not Addressed (out of scope this run)

### WR-03: Status-mark actions leave range view stale and reject unhandled — **pre-existing**
**File:** `features/dashboard/range-attendance-table.tsx:117-133`, `features/dashboard/today-attendance-table.tsx:81-97`
**Reason:** Marked pre-existing by the reviewer; this phase only swapped the footer import. Noted per orchestrator instruction, not fixed. Suggested fix stands: invalidate `{ queryKey: ["attendance"] }` prefix once + `.catch((e) => logError(e, { context: "mark-attendance" }))` on the onClick call.

### WR-02 / WR-04 / IN-01–IN-05
Not included in this run's scope (blockers + WR-01 only). WR-02 (no Edit affordance) becomes safely actionable after CR-01's route fix; recommend addressing next iteration together with IN-03 (restrictive role default during `useMe` load).

## Verification

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` (after each fix) | clean |
| `pnpm lint` | **0 errors**, 55 warnings (all pre-existing) |
| `pnpm vitest run` | 340 passed, 2 failed — failures are exactly the known `tests/session.test.ts` baseline; no new failures |
| `pnpm build` | passes; all `/noticeboard/*` URLs present in route manifest |

---

_Fixed: 2026-08-26T05:04:35Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
