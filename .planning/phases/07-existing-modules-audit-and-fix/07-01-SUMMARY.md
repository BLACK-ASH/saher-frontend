---
phase: 07-existing-modules-audit-and-fix
plan: 01
subsystem: calendar
tags: [date-handling, ist, google-sync, fullcalendar, audit]

# Dependency graph
requires:
  - phase: 02-quality-gates-test-infrastructure
    provides: [lib/date.ts IST utilities, vitest setup]
provides:
  - Calendar module aligned to IST date contract
  - Google Calendar holiday sync endpoint wired to frontend
  - Hierarchical query keys for calendar events
affects: [07-05-trash-pattern, 07-08-final-date-sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IST date boundary helpers (dateToIstDateOnly, istDateOnlyToDate) for component state
    - Hierarchical TanStack Query keys: ["calendar", "events", year, month]
    - Backend-driven Google holiday sync via POST /api/calendar/sync-holidays

key-files:
  created: []
  modified:
    - features/calendar/calendar.tsx
    - services/calendar.api.ts
    - hooks/use-calendar.ts

key-decisions:
  - "Use dateToIstDateOnly for calendarDate state to avoid raw new Date() in component"
  - "Google sync is backend-driven; frontend only triggers POST /sync-holidays"
  - "Hierarchical query keys enable granular invalidation"

patterns-established:
  - "Calendar components use lib/date utilities for all date state and display"
  - "Sync mutations invalidate parent query key [\"calendar\"] for broad refresh"

requirements-completed:
  - AUDT-02

# Metrics
duration: 15min
completed: 2026-08-30
---

# Phase 07 Plan 01: Calendar Alignment — IST Dates + Google Sync Verification

**Calendar module aligned to IST contract: raw Date eliminated, Google holiday sync wired, hierarchical query keys established**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-30T07:21:35Z
- **Completed:** 2026-08-30T07:36:00Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments

- Eliminated raw `new Date()` usage in `calendar.tsx` — state now uses `dateToIstDateOnly`/`istDateOnlyToDate` from `lib/date`
- Added Google Calendar holiday sync via backend endpoint `POST /api/calendar/sync-holidays` with frontend mutation
- Updated TanStack Query key to hierarchical format `["calendar", "events", year, month]` for proper cache structure
- Verified month aggregation data flow: FullCalendar consumes events correctly, custom events appear after creation, navigation works without console errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix raw Date usage in calendar.tsx** - `a67c3f4` (fix)
2. **Task 2: Verify Google sync contract** - `b12a58d` (feat)
3. **Task 3: Verify month aggregation data flow** - included in Task 2 commit (verification)
4. **Task 4: Run lint/typecheck** - verified clean (0 errors, 60 pre-existing warnings only)

## Files Created/Modified

- `features/calendar/calendar.tsx` - Replaced raw Date state with IST utilities, wrapped FullCalendar date callbacks
- `services/calendar.api.ts` - Added `syncGoogleCalendar` function calling `POST /api/calendar/sync-holidays`
- `hooks/use-calendar.ts` - Added `syncGoogle` mutation, updated queryKey to hierarchical format

## Decisions Made

- Calendar date state uses string format (YYYY-MM-DD) via `dateToIstDateOnly`, converted to Date via `istDateOnlyToDate` when year/month needed
- Google sync is backend-only functionality; frontend exposes a mutation to trigger it
- Hierarchical query keys (`["calendar", "events", year, month]`) follow established pattern for list resources

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Calendar module fully aligned to IST date contract
- Google sync documented and implemented (backend endpoint exists at `/api/calendar/sync-holidays`)
- Ready for 07-05 (trash pattern enforcement) and 07-08 (final date sweep)
- No blockers for dependent plans

---
*Phase: 07-existing-modules-audit-and-fix*
*Completed: 2026-08-30*