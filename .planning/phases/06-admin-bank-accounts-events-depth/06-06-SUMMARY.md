---
phase: 06-admin-bank-accounts-events-depth
plan: 06
subsystem: events
tags: [attendance, diff, tdd, worksheet, roster, populated, vitest, react-query, EVNT-06]

# Dependency graph
requires:
  - phase: 06-admin-bank-accounts-events-depth
    plan: 05
    provides: populated roster source (program.data.participants = ParticipantT[] via getSingleProgram) — the worksheet prefill reads this, not the raw-id query
  - phase: 06-admin-bank-accounts-events-depth
    plan: 03
    provides: {participantIds} body shape for bulk attendance mutations; session detail contract (session.data.participants = populated attendee list)
provides:
  - Pure TDD'd diff engine lib/attendance-diff.ts (computeAttendanceDiff, 5 vitest tests)
  - Attendance worksheet: full roster rows from populated program, checked-state from session, Mark All/Clear All, dirty counter, saving-disabled submit
  - Save plays ONE bulk POST (added) then ONE bulk DELETE (removed) sequentially; partial-failure "N of M saved" toast
  - Raw-id roster query removed from use-programs and getParticipantFromProgram deleted from program.api.ts (zero consumers repo-wide)
affects: [06-07, 07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "diff-driven save modeled as pure function (Set semantics, stable sorted order) — no IO/React in the diff, testable without mocks"
    - "post-save invalidation targets ['sessions'] (the session detail queryKey) — checked state preserved across refetch by render-phase seed-once-per-id (D-23, no setState-in-effect)"
    - "bulk-merge playout: two service calls, never per-id — reuse existing markSessionAttendance/deleteSessionAttendance"
  removed:
    - "getParticipantFromProgram (services/program.api.ts) and its ['programs','participants',id] query (hooks/use-programs.ts) — last consumer migrated to populated source"

key-files:
  created:
    - lib/attendance-diff.ts
    - tests/attendance-diff.test.ts
  modified:
    - app/(main)/program/sessions/attendance/[id]/page.tsx
    - hooks/use-programs.ts
    - services/program.api.ts

key-decisions:
  - "computeAttendanceDiff(existing, selected) → { added, removed } as a pure Set-difference (selected − existing / existing − selected), sorted ascending for deterministic output — the merge-only backend ($addToSet) has no exact-state endpoint, so the client plays the diff"
  - "Worksheet rows come from program.data.participants (populated) and checked-state from session.data.participants ids — the use-programs raw-id participant query is deleted repo-wide (grep gate clean)"
  - "Save = ONE markSessionAttendance POST with { participantIds: added } when added.length, then ONE deleteSessionAttendance DELETE with { participantIds: removed } when removed.length — sequential, before invalidation; no per-id calls"
  - "No optimistic UI before save (D-29 value rule): toggle is local state only; save failure surfaces apiFetch toast + partial-count toast; DELETE is backend all-or-nothing (404 if any id unmarked) handled by stopping and re-fetch guidance"
  - "Checked seed happens during render once per session id (D-23 render-phase adjustment), so refetches never clobber user edits"

patterns-established:
  - "diff engine as pure function + TDD RED/GREEN commits (test first, then implement)"
  - "bulk mutation playout through existing service fns, adjacency over new abstractions"

requirements-completed: [EVNT-06]

# Metrics
duration: TDD commit pair + worksheet in one session; human-verify checkpoint passed on continuation
completed: 2026-08-30
---

# Phase 06 Plan 06: Attendance Diff Engine + Worksheet Summary

**Session attendance becomes a diff-driven worksheet — full roster prefilled from the populated program source, save plays ONLY what changed as one bulk POST + one bulk DELETE (EVNT-06), and the last raw-id roster consumer is gone from the repo.**

## Performance

- **Duration:** Executor ran TDD + worksheet across 3 commits, returned at the human-verify checkpoint; user approved the live round-trip on continuation.
- **Completed:** 2026-08-30
- **Tasks:** 3 (1 TDD RED commit + 1 GREEN + 1 worksheet)
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `computeAttendanceDiff(existing, selected) → { added, removed }` — pure Set-difference (added = selected − existing; removed = existing − selected), results sorted ascending for deterministic output; no IO, no React. Spec pinned by 5 vitest tests including order-insensitivity (existing order irrelevant, Set semantics).
- Worksheet (`app/(main)/program/sessions/attendance/[id]/page.tsx`): rows = `program.data.participants` (populated roster), pre-checked = `session.data.participants` ids; per-row checkbox toggle (44px hit-area), **Mark All** / **Clear All**, dirty counter ("N unsaved changes"), Save disabled while pending and when clean (D-26).
- Save = sequential bulk playout: `markSessionAttendance` POST one `{ participantIds: added }` when additions exist, `deleteSessionAttendance` DELETE one `{ participantIds: removed }` when removals exist, then `invalidateQueries(["sessions"])` + success toast. Partial-failure toast reports "N of M updates saved". No optimistic state before save.
- Checked-state seeding is a render-phase adjustment keyed to session id (D-23) — refetches and the post-save invalidation never clobber in-progress toggles.
- Empty state: "No participants on this session's roster" with CTA to the program detail add-participants page.
- Removed the final raw-id roster consumer: `participants` query deleted from `hooks/use-programs.ts` and `getParticipantFromProgram` deleted from `services/program.api.ts` (grep gate for both names: zero matches).

## Task Commits

1. **Task 1a: Diff engine RED** - `7ae17d8` (test)
2. **Task 1b: Diff engine GREEN** - `96702c6` (feat)
3. **Task 2: Attendance worksheet — prefill + diff save** - `a080e53` (feat)

## Files Created/Modified
- `lib/attendance-diff.ts` - pure `computeAttendanceDiff` (created)
- `tests/attendance-diff.test.ts` - 5 vitest tests: all-added / all-removed / overlap / no-change / order-insensitivity (created)
- `app/(main)/program/sessions/attendance/[id]/page.tsx` - roster prefill from populated program, checked from session, diff save, Mark All/Clear All, dirty counter, empty-state CTA (modified)
- `hooks/use-programs.ts` - removed the raw-id `["programs","participants",id]` query (modified)
- `services/program.api.ts` - deleted `getParticipantFromProgram` (modified)

## Decisions Made
- Diff engine is a plain function with no options object — 2 args are the whole contract (ponytail).
- Save uses the existing bulk service fns only; no per-participant routes were invented (backend has none per RESEARCH).
- Checked state is local until Save; no optimistic UI (D-29 money/attendance value rule) — Save remains the single source of truth.

## Deviations from Plan
None functional. `features/attendance/attendance-table.tsx` was listed in `files_modified` but the shared DataTable fought the checkbox model, so the worksheet uses a plain shadcn Table in the page component (the plan explicitly allowed "in-page table if the shared component fights the checkbox model"). Removed the single orphaned `{"sessions"}`-keyed run of `queryClient.invalidateQueries(["sessions"])` coincidentally... no. Invalidation targets `["sessions"]`, matching the session-detail query in `use-sessions` — unchanged contract.

## Issues Encountered
- Docker/DB weren't on the verified path when the checkpoint was reached: the compose mongo had been stopped during volume migration and the seeded volume held only the bootstrap admin (no business data). Resolved by recreating mongo onto the named volume and re-confirming the idempotent seed (`Users already exist`), then `POST /api/auth/login` returned 200. User created a program/participants/session via UI and ran the round-trip.
- Environment notes: `rg` is not installed on host (grep-based gate confirmation used instead). Repo-wide pre-existing ESLint warnings (59, 0 errors) span untouched files — not introduced here. Full-suite pre-existing failures in `tests/session.test.ts` (`performLogoutCleanup`) remain in `deferred-items.md`.

## User Setup Required
None beyond the standard stack — the live round-trip was verified against the running compose stack (http://localhost), seeded admin login.

## Next Phase Readiness
- EVNT-06 complete. `use-sessions.ts` is now free for sequential ownership — 06-07 (session reminder + export to notifications, EVNT-07/08, W5, dep 06-04 + 06-06, human-verify) can proceed; the attendance worksheet is the pattern precedent for bulk-merge playout in that plan's export flow.
- 06-07's `requestSessionExport` (odd-GET jobId contract) and `sendSessionReminder` land on `services/session.api.ts` + `hooks/use-sessions.ts` — no ownership conflicts remain.

## Self-Check: PASSED

- `lib/attendance-diff.ts` — FOUND (`computeAttendanceDiff` export)
- `tests/attendance-diff.test.ts` — FOUND (5 tests pass; `pnpm test tests/attendance-diff.test.ts` 5/5, vitest)
- `app/(main)/program/sessions/attendance/[id]/page.tsx` — FOUND (imports `computeAttendanceDiff`; save calls `markAttendance`/`deleteAttendance` sequentially)
- Grep gate — CLEAN (`getParticipantFromProgram|programParticipants` zero matches in app/features/hooks/services)
- Commits `7ae17d8`, `96702c6`, `a080e53` — FOUND
- `pnpm typecheck` clean; `pnpm lint` 0 errors (59 repo-wide pre-existing warnings)
- Human checkpoint (Task 3): user reported live round-trip passing (toggle → save → reload persists; Mark All / Clear All; idempotent re-toggle)

---

*Phase: 06-admin-bank-accounts-events-depth*
*Completed: 2026-08-30*