---
phase: 06-admin-bank-accounts-events-depth
plan: 04
subsystem: events
tags: [workshop, session, trash, restore, isDeleted, IST, datetime, react-query, msw, drill-down]

# Dependency graph
requires:
  - phase: 06-admin-bank-accounts-events-depth
    provides: research-verified events contract (workshop/session restore routes, isDeleted list param, IST future-dated session datetime, Pitfall 7 auto-create)
provides:
  - Contract-correct workshop/session services (restoreWorkshop/restoreSession PATCH, explicit isDeleted list param)
  - restore mutations in use-workshops/use-sessions (invalidate ["workshops"] / ["sessions"])
  - Workshop/session lists with active/trash tabs, parent drill-down by keyword=<parentId>, IST-correct future-dated session editor
  - Session editor IST contract: isoToIstInput prefill + combineDateAndTimeToIso submit + explicit workshop (no Pitfall 7 auto-create)
  - msw test pinning restore routes + isDeleted URL params
affects: [06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PATCH restore uniform shape reused across event resources (same as 06-03 programs)"
    - "explicit isDeleted=true|false list param (Pitfall 10 — never omit)"
    - "IST datetime: isoToIstInput prefill + combineDateAndTimeToIso submit (never raw Date)"
    - "always pass explicit workshop to session create (Pitfall 7 auto-create avoidance)"

key-files:
  created:
    - tests/workshop-session-api.test.ts
  modified:
    - services/workshop.api.ts
    - services/session.api.ts
    - hooks/use-workshops.ts
    - hooks/use-sessions.ts
    - features/program/workshop/all-workshops.tsx
    - features/program/workshop/add-workshop.tsx
    - features/program/workshop/workshop-editor.tsx
    - features/program/workshop/workshop-header.tsx
    - features/program/session/all-sessions.tsx
    - features/program/session/add-session.tsx
    - features/program/session/session-editor.tsx
    - features/program/session/session-header.tsx
    - app/(main)/program/workshops/page.tsx
    - app/(main)/program/workshops/[id]/page.tsx
    - app/(main)/program/sessions/page.tsx
    - app/(main)/program/sessions/[id]/page.tsx

key-decisions:
  - "restoreWorkshop/restoreSession hit PATCH /api/events/workshops|sessions/restore/:id (uniform event-restore shape, gated server-side)"
  - "getWorkshops/getSessions send explicit isDeleted=false|true per tab (Pitfall 10 — never omit)"
  - "session editor prefills date via isoToIstInput(session.date).split('T')[0] and startTime/endTime via isoToIstInput(...).split('T')[1]"
  - "session submit sends startTime/endTime through combineDateAndTimeToIso (IST +05:30 aware, lib/date.ts) and always includes explicit workshop"
  - "workshop/session list + detail pages brought off /program redirect stubs to real parent-filtered routes (drill-down EVNT-03/EVNT-04 substrate from 06-03)"

patterns-established:
  - "active/trash tabs drive explicit isDeleted query param through the service layer (mirrors 06-03 programs)"
  - "PATCH restore uniform shape reused across all event resources"

requirements-completed: [EVNT-03, EVNT-04]

# Metrics
duration: closed out post-hoc (3 commits landed 2026-08-29, summary written on resume 2026-08-30)
completed: 2026-08-30
---

# Phase 06 Plan 04: Workshop + Session Depth Summary

**Workshop and session services/hooks/lists/editors reconciled to the verified events contract — restore + isDeleted list params, parent filter drill-down, and the IST-correct future-dated session editor with explicit workshop (EVNT-03, EVNT-04)**

## Performance

- **Duration:** Closed out on resume session (2026-08-30) — the 3 feature commits landed during the paused session on 2026-08-29; SUMMARY.md was written on resume per the phase continue-here checklist and structured handoff.
- **Started:** 2026-08-29
- **Completed:** 2026-08-30
- **Tasks:** 3
- **Files modified:** 14 (4 headers/list-route files required no functional change — see Deviations)

## Accomplishments
- Added `restoreWorkshop` (`PATCH /api/events/workshops/restore/:id`) and `restoreSession` (`PATCH /api/events/sessions/restore/:id`) plus `restore` mutations in `use-workshops`/`use-sessions` that invalidate `["workshops"]` / `["sessions"]` — the trash/restore wave of 06-03's program pattern extended to workshop/session.
- Extended `getWorkshops`/`getSessions` with explicit `isDeleted` list params (Pitfall 10), feeding active|trash tab states that actually refetch.
- Workshop list/detail brought off the `/program` redirect stub: active|trash tabs, keyword search, parent-filtered drill-down via `keyword=<programId>` (EVNT-03), create/edit/detail pages on dedicated routes with breadcrumbs.
- Session list/detail brought off the stub: parent-filtered drill-down by `keyword=<workshopId>` (EVNT-04), trash/restore, IST-correct editor.
- Session editor now fully satisfies the IST datetime contract: prefills `date`/`startTime`/`endTime` from `isoToIstInput` (IST date part / time part split) and submits `combineDateAndTimeToIso(istDate, istTime)` — no raw `Date` — and always sends an explicit `workshop`, avoiding the backend's auto-create shallow-workshop behavior (Pitfall 7).
- Added `tests/workshop-session-api.test.ts` — 5 msw tests pinning restore PATCH routes and `isDeleted=true|false` URL params for both resources.

## Task Commits

1. **Task 1: Shared service layer — restore + isDeleted list params + hooks + msw tests** - `5fbe31f` (feat)
2. **Task 2: Workshop CRUD + trash/restore + drill-down (EVNT-03)** - `5e3cad8` (feat)
3. **Task 3: Session CRUD reconcile + IST datetime contract + trash/restore (EVNT-04)** - `5ffde63` (feat)

## Files Created/Modified
- `services/workshop.api.ts` - add `restoreWorkshop`, `isDeleted` list param
- `services/session.api.ts` - add `restoreSession`, `isDeleted` list param
- `hooks/use-workshops.ts` / `hooks/use-sessions.ts` - `restore` mutations invalidating the resource key
- `tests/workshop-session-api.test.ts` - 5 msw tests: restore PATCH routes + isDeleted URL params
- `features/program/workshop/all-workshops.tsx` - active|trash tabs, keyword search, gated delete/restore, empty states
- `features/program/workshop/add-workshop.tsx` + `workshop-editor.tsx` - create/edit reconciled
- `features/program/workshop/workshop-header.tsx` - create CTA consistent with programs
- `app/(main)/program/workshops/[id]/page.tsx` - real detail page (was redirect stub) with breadcrumb + edit
- `features/program/session/all-sessions.tsx` - active|trash tabs, parent filter, gated delete/restore
- `features/program/session/add-session.tsx` + `session-editor.tsx` - IST datetime contract + explicit workshop
- `features/program/session/session-header.tsx` - actions consistent with workshops
- `app/(main)/program/sessions/[id]/page.tsx` - real detail page (was redirect stub) with breadcrumb + edit

## Decisions Made
- Restore uses the uniform event-resource shape `PATCH /api/events/<resource>/restore/:id`, mirroring 06-03 programs; UI restore affordance gated by the same permission as the delete-affordance complement.
- `getWorkshops`/`getSessions` always send explicit `isDeleted=false|true` per tab (Pitfall 10 — avoids sloppy-cast ghost rows); same queryKey behavior established in resource-list-factory by 06-03.
- Session editor respects the plan's `key_links` mandate — IST conversion goes exclusively through `lib/date.ts` helpers; a past-date submission surfaces the backend's future-only 400 via apiFetch toast.
- `workshop` is always provided on session create/update to prevent the backend auto-creating a shallow workshop when the field is omitted (Pitfall 7).

## Deviations from Plan

### Not-Required Changes

The plan listed `workshop-header.tsx`, `session-header.tsx`, `app/(main)/program/workshops/page.tsx`, and `app/(main)/program/sessions/page.tsx` in `files_modified`, but those list-route shells already composed header+view safely per the 06-03 pattern and needed no functional edit. The create CTAs live in the header/editor components and were confirmed present. No new public API introduced; these files exist unchanged on disk (listed for completeness).

---

**Total deviations:** 0 functional; 4 files in the plan's `files_modified` required no edit (already correct).

## Issues Encountered
- Closing out this plan on resume: the executor was cancelled before writing the SUMMARY (recorded blocking anti-pattern), leaving 3 feature commits without a SUMMARY.md or STATE/ROADMAP progress. Verified all plan must-haves exist on disk (`restoreWorkshop`/`restoreSession` exports, `isDeleted` params, IST `combineDateAndTimeToIso`/`isoToIstInput` usage, real drill-down pages) before writing this summary.
- Full-suite `pnpm test` still reports the 2 pre-existing failures in `tests/session.test.ts` (`performLogoutCleanup`) — documented in `deferred-items.md` by 06-01, unrelated to this plan's files. `tests/workshop-session-api.test.ts` passes 5/5.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EVNT-03 (workshop CRUD) and EVNT-04 (session CRUD + IST contract) substrate complete — drill-down pages are real routes, no longer `/program` stubs.
- 06-02 (account/bank) and 06-05 (participant rosters) can proceed: this plan's service patterns (restore + isDeleted) are the established shape to mirror.
- 06-06 (attendance diff, depends 06-05) consumes session attendance mutations and the populated roster; 06-07 (reminder/export, depends 06-04 + 06-06) owns further `services/session.api.ts` edits (session.api.ts ownership transfers to 06-07 next).

## Self-Check: PASSED

- `services/workshop.api.ts` — FOUND (`restoreWorkshop`)
- `services/session.api.ts` — FOUND (`restoreSession`)
- `features/program/session/session-editor.tsx` — FOUND (`combineDateAndTimeToIso` + `isoToIstInput` imports from `@/lib/date`)
- `06-04-SUMMARY.md` — FOUND
- Commits `5fbe31f`, `5e3cad8`, `5ffde63` — all FOUND
- `pnpm test tests/workshop-session-api.test.ts` — 5/5 pass; `pnpm lint`/`pnpm typecheck` reported clean at pause time (full-suite session.test.ts failures are pre-existing/out-of-scope)

---
*Phase: 06-admin-bank-accounts-events-depth*
*Completed: 2026-08-30*