---
phase: 06-admin-bank-accounts-events-depth
plan: 03
subsystem: events
tags: [program, trash, restore, events, isDeleted, react-query, msw, drill-down]

# Dependency graph
requires:
  - phase: 06-admin-bank-accounts-events-depth
    provides: research-verified events contract (program attach body, restore routes, isDeleted list param)
provides:
  - Contract-correct program service (addParticipantsInProgram {participantIds}, restoreProgram, isDeleted list filter)
  - restore mutation in use-programs (invalidates ["programs"])
  - Programs list with active/trash tabs, search, create CTA, admin-gated delete, restore
  - Program detail breadcrumb + workshop/session drill-down links (EVNT-01 substrate)
affects: [06-04, 06-05, 06-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "resource-list-factory queryKey now includes isDeleted so tab switches refetch"
    - "TrashTabPattern-style active/deleted tab state keyed to explicit isDeleted list param"
    - "msw test pinning exact POST body shape ({participantIds})"

key-files:
  created:
    - tests/program-api.test.ts
  modified:
    - services/program.api.ts
    - hooks/use-programs.ts
    - hooks/resource-list-factory.ts
    - features/program/program/all-programs.tsx
    - features/program/program/program-header.tsx
    - features/program/program/add-program.tsx
    - app/(main)/program/[id]/page.tsx

key-decisions:
  - "fix addParticipantsInProgram to POST {participantIds} (verified schema) pinned by msw test"
  - "restoreProgram hits PATCH /api/events/programs/restore/:id (gated event:update server-side)"
  - "getPrograms sends explicit isDeleted=false|true (Pitfall 10 — never omit)"
  - "added isDeleted to resource-list-factory queryKey so Active|Deleted tab switch triggers a refetch"
  - "delete affordance gated can(r,delete,event) (admin only); create/edit/restore gated can(r,write|update,event) (admin+manager)"

patterns-established:
  - "active/deleted tab state drives an explicit isDeleted query param through the service layer"
  - "PATCH restore uniform shape reused across event resources"

requirements-completed: [EVNT-01, EVNT-02]

# Metrics
duration: 8min
completed: 2026-08-29
---

# Phase 06 Plan 03: Programs Depth Summary

**Program service contract-fixed (participantIds attach body, restore PATCH, explicit isDeleted list filter) plus Active/Trash tabs with admin-gated delete/restore and drill-down breadcrumb + workshop/session links**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-29T20:30:00+0530
- **Completed:** 2026-08-29T20:38:00+0530
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Fixed `addParticipantsInProgram` to send `{ participantIds: [...] }` (was raw array OF the verified schema) — EVNT-05/06 attach substrate is now correct, pinned by an msw test asserting the exact JSON shape.
- Added `restoreProgram` (`PATCH /api/events/programs/restore/:id`) + `restore` mutation in `use-programs` that invalidates `["programs"]`.
- Extended `getPrograms` with an explicit `isDeleted` param (Pitfall 10) and threaded it through the resource-list factory's queryKey so the Active|Deleted tab switch actually refetches.
- Programs list now has Active|Deleted tabs, keyword search retained, "Create Program" accent CTA (admin+manager), admin-only AlertDialog-confirmed delete, and restore on the Deleted tab.
- Program detail gained a breadcrumb (Home › Programs › {title}) and Workshops/Sessions drill-down buttons filtered by `keyword=<programId>`.

## Task Commits

1. **Task 1: Fix program service contract + hook restore mutation + tests** - `96ec0dc` (fix)
2. **Task 2: Programs list — active/trash tabs, create CTA, search, restore** - `904f73f` (feat)
3. **Task 3: Program detail drill-down navigation** - `390c581` (feat)

## Files Created/Modified
- `services/program.api.ts` - fix attach body to `{participantIds}`, add `restoreProgram`, add `isDeleted` to `getPrograms`
- `hooks/use-programs.ts` - add `restore` mutation returning in hook bag
- `hooks/resource-list-factory.ts` - include `isDeleted` in list queryKey (Rule 3 deviation, see below)
- `tests/program-api.test.ts` - msw tests: participantIds body shape, restore PATCH route, isDeleted=true/false URL
- `features/program/program/all-programs.tsx` - Active|Deleted tabs, gated delete/restore, empty states
- `features/program/program/program-header.tsx` - create CTA gated `can(r,write,event)` (admin+manager)
- `features/program/program/add-program.tsx` - "Create Program" accent CTA
- `app/(main)/program/[id]/page.tsx` - breadcrumb + workshop/session drill-down links

## Decisions Made
- Fix `addParticipantsInProgram` body to the verified `{participantIds}` schema; keep signature `{ id, participants: string[] }`.
- Restore is `PATCH /api/events/programs/restore/:id`, gated server-side by `event:update` (admin+manager); UI restore affordance mirrors this with `can(r,update,event)`.
- `getPrograms` always sends an explicit `isDeleted=false|true` per tab (Pitfall 10 — avoids sloppy-cast ghost rows).
- Programs list tabs live inside `all-programs.tsx` (the plan's Task 2 target); the `app/(main)/program/page.tsx` shell was left unchanged because it already composes header+view.
- Program edit uses the existing inline dialog in `all-programs.tsx` (update mutation); `program-editor.tsx` remains the create-form component used by `add-program.tsx` and needed no change (plan listed it as files_modified but no functional edit was required).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] resource-list-factory queryKey did not include `isDeleted`**
- **Found during:** Task 2 (programs list tabs)
- **Issue:** The list's React Query key was built from `keyword/page/limit` only. Passing `isDeleted` through to `getPrograms` changed the request URL but not the queryKey, so switching Active|Deleted tabs would render the same cached query and never refetch — breaking the trash-tab behavior the plan requires (a behavior assertion in Task 2).
- **Fix:** Added `isDeleted` to the factory's local `QueryProps` type and included it in the list queryKey.
- **Files modified:** hooks/resource-list-factory.ts (not in plan's files_modified, added for correctness)
- **Verification:** `pnpm typecheck` + `pnpm lint` pass; behavior now fires a new query per tab.
- **Committed in:** Task 1 (`96ec0dc`)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The factory change was necessary for the plan's own success criteria (tab switch must visibly refetch). No scope creep or new public API.

## Issues Encountered
- `pnpm test` (full suite) reports 2 failures in `tests/session.test.ts` (`performLogoutCleanup`). This is a pre-existing failure already logged in `deferred-items.md` by plan 06-01 — it touches `lib/session.ts`, imports only `lib/session` + `sonner`, and is unrelated to this plan's files. All 4 new `tests/program-api.test.ts` tests pass; the full-suite failure is out of scope per the executor scope boundary.
- `app/(main)/program/workshops` and `app/(main)/program/sessions` currently `redirect("/program")` (route stubs). The drill-down links point at these dedicated routes with `keyword=<programId>` per the plan's DRIVING requirement; the actual per-program filtered workshop/session pages are built in plan 06-04.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EVNT-02 (program CRUD + trash/restore) and EVNT-01 (drill-down nav) substrate complete.
- `addParticipantsInProgram` now sends the correct `{participantIds}` body — plan 06-05 (participant rosters) can rely on attach working.
- `restoreProgram` + `isDeleted` list filtering established the event-resource trash/restore service pattern that 06-04 (workshop/session) should mirror (restore routes already verified identical shape).
- Deferred: workshop/session drill-down target pages are stubs redirecting to `/program` — 06-04 must build them out.

## Self-Check: PASSED

- `tests/program-api.test.ts` — FOUND
- `features/program/program/all-programs.tsx` — FOUND
- `app/(main)/program/[id]/page.tsx` — FOUND
- `06-03-SUMMARY.md` — FOUND
- Commits `96ec0dc`, `904f73f`, `390c581` — all FOUND
- `pnpm lint` 0 errors, `pnpm typecheck` clean, `pnpm test tests/program-api.test.ts` 4/4 pass (full-suite session failure is pre-existing/out-of-scope)

---
*Phase: 06-admin-bank-accounts-events-depth*
*Completed: 2026-08-29*
