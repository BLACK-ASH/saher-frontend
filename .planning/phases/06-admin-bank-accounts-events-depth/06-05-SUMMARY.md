---
phase: 06-admin-bank-accounts-events-depth
plan: 05
subsystem: events
tags: [participant, roster, attach, detach, restore, isDeleted, program, react-query, msw, populated]

# Dependency graph
requires:
  - phase: 06-admin-bank-accounts-events-depth
    provides: research-verified events contract (FREE-ENTRY participant records, attach {participantIds} $addToSet, detach DELETE $pull, populated roster on program detail, Pitfall 3 raw-id list)
  - phase: 06-admin-bank-accounts-events-depth
    plan: 03
    provides: addParticipantsInProgram body fix ({participantIds}), restoreProgram, isDeleted list param pattern
provides:
  - Contract-correct participant service (restoreParticipant PATCH, getParticipants always-sends isDeleted)
  - restore mutation in use-participant (invalidates ["participants"])
  - Participant pool list with active/trash tabs, always-on isDeleted filter, restore
  - Program detail roster rendering populated participants + attach/detach handlers
  - msw tests pinning restore route + always-on isDeleted URL param
affects: [06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PATCH restore uniform shape reused across event resources (same as 06-03/06-04)"
    - "always-on isDeleted=false default in getParticipants (Pitfall 5 — participants carry no default filter)"
    - "roster reads POPULATED participants from program detail (Pitfall 3 — never the raw ObjectId list)"
    - "restore mutation invalidates the resource queryKey"

key-files:
  created:
    - tests/participant-api.test.ts
  modified:
    - services/participant.api.ts
    - hooks/use-participant.ts
    - hooks/use-programs.ts
    - features/program/participant/all-participant.tsx
    - features/program/participant/participant-header.tsx
    - app/(main)/program/[id]/page.tsx

key-decisions:
  - "restoreParticipant hits PATCH /api/events/participants/restore/:id (uniform event-restore shape)"
  - "getParticipants defaults isDeleted=\"false\" — ALWAYS sent on the URL (Pitfall 5, never omitted)"
  - "roster renders from getSingleProgram(id).participants (populated ParticipantT[]) — not getParticipantFromProgram raw ids (Pitfall 3)"
  - "attach submits form participants array through the 06-03-corrected addParticipantsInProgram {participantIds} body"
  - "restore affordance gated to manager/admin (event:update complement) alongside admin-only delete"

patterns-established:
  - "active/trash tabs drive an explicit isDeleted query param through the service layer (mirrors 06-03/06-04)"
  - "PATCH restore uniform shape reused across ALL event resources (program/workshop/session/participant)"

requirements-completed: [EVNT-05]

# Metrics
duration: closed out post-hoc (2 commits landed during cancelled executor, summary written on continuation)
completed: 2026-08-30
---

# Phase 06 Plan 05: Participant Rosters Summary

**Participant rosters reach operational depth — free-entry CRUD with restore, always-on isDeleted filtering, program attach/detach with the corrected `{participantIds}` body, and roster rendering from the POPULATED program detail source (EVNT-05)**

## Performance

- **Duration:** Closed out on continuation (2026-08-30) — the executor committed 2 tasks, was cancelled before writing SUMMARY.md, and the orchestrator finalized per the close-out gate.
- **Completed:** 2026-08-30
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `restoreParticipant` (`PATCH /api/events/participants/restore/:id`) and a `restore` mutation in `use-participant` that invalidates `["participants"]`.
- `getParticipants` now defaults `isDeleted="false"` and always sends it on the URL — participants carry no default soft-delete filter, so omitting it showed ghost/soft-deleted rows (Pitfall 5).
- Participant pool list (`all-participant.tsx`) gained Active|Deleted tabs keyed to the explicit `isDeleted` param, restore on the Deleted tab, gated delete affordance, and search retained.
- Program detail (`app/(main)/program/[id]/page.tsx`) now renders the roster from the POPULATED `getSingleProgram(id).participants` array with attach (multiselect pooling free-entry participants) and detach — no reliance on the raw-ObjectId participant-list endpoint (Pitfall 3).
- Added `tests/participant-api.test.ts` — 3 msw tests pinning the restore PATCH route and the always-on `isDeleted=false` URL param.

## Task Commits

1. **Task 1: Participant service restore + always-on isDeleted filter + msw tests** - `a1be8e9` (feat)
2. **Task 2: Program detail roster (populated) + attach/detach + pool trash/restore tabs** - `bc2bf49` (feat)

## Files Created/Modified
- `services/participant.api.ts` - add `restoreParticipant`, default+always-send `isDeleted` list param
- `hooks/use-participant.ts` - add `restore` mutation (invalidates `["participants"]`)
- `hooks/use-programs.ts` - expose participant attach/detach mutations for roster management
- `tests/participant-api.test.ts` - 3 msw tests: restore PATCH route + isDeleted URL param
- `features/program/participant/all-participant.tsx` - Active|Deleted tabs, always-on isDeleted, restore, gated delete
- `features/program/participant/participant-header.tsx` - header consistency with pool tabs
- `app/(main)/program/[id]/page.tsx` - populated roster rendering + attach/detach

## Decisions Made
- `getParticipants` always-sends `isDeleted` (default `"false"`) rather than only when provided — the backend applies soft-delete filtering only when the param is present, so omission shows ghost rows (Pitfall 5).
- Roster must read the populated `participants` array from `GET /api/events/programs/:id`; the id-list endpoint returns raw ObjectIds without population and is never used for rendering (Pitfall 3).
- Restore uses the same `PATCH /api/events/<resource>/restore/:id` shape as programs/workshops/sessions — the event-resource trash/restore pattern is now uniform across all four event resources.

## Deviations from Plan

### Not-Required Changes

`features/program/participant/add-participant.tsx`, `update-participant.tsx`, `app/(main)/program/participants/page.tsx`, and `app/(main)/program/participants/[id]/page.tsx` were listed in the plan's `files_modified` but required no functional edit: free-entry participant CRUD forms and the participant pages already existed and complied with the verified contract. They remain on disk unchanged (present, lint-clean apart from repo-wide pre-existing warnings).

---

**Total deviations:** 0 functional; 4 planned files required no edit (already correct).

## Issues Encountered
- Closing out on continuation: executor cancelled after Task 2 commit, before writing SUMMARY.md (repeat of the recorded blocking anti-pattern). Verified plan must-haves on disk (`restoreParticipant` export, always-on `isDeleted`, populated roster usage, attach/detach) before writing this summary.
- Repo-wide pre-existing ESLint warnings (60, 0 errors) span untouched files (mail, reimbursement, calendar, tiptap-utils, data-table) — not introduced by this plan. `pnpm typecheck` clean; `tests/participant-api.test.ts` 3/3.
- Full-suite pre-existing failures in `tests/session.test.ts` (`performLogoutCleanup`) remain documented in `deferred-items.md`, out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EVNT-05 complete. `isDeleted` filtering + restore established for all event resources.
- 06-06 (attendance diff engine, depends 06-05) can read the populated roster and attach/detach flow cleanly — session attendance surface migrates off the raw-id roster query per the phase blocker.
- 06-07 (reminder/export) proceeds after 06-06.

## Self-Check: PASSED

- `services/participant.api.ts` — FOUND (`restoreParticipant` + default `isDeleted="false"` always-sent)
- `app/(main)/program/[id]/page.tsx` — FOUND (populated roster rendering + attach/detach)
- `06-05-SUMMARY.md` — FOUND
- Commits `a1be8e9`, `bc2bf49` — FOUND
- `pnpm test tests/participant-api.test.ts` — 3/3 pass; `pnpm typecheck` clean; `pnpm lint` 0 errors (repo-wide pre-existing warnings only)

---
*Phase: 06-admin-bank-accounts-events-depth*
*Completed: 2026-08-30*