---
phase: 08-bug-fixes-calendar-overhaul
plan: 06
subsystem: calendar
tags: [frontend, calendar, delete-confirm, edit-mode, select-dropdown, error-handling]
dependency_graph:
  requires: [08-05]
  provides: [delete-confirmation, edit-wiring, drag-resize-error-toast, type-dropdown]
  affects: [features/calendar/calendar.tsx, features/calendar/event-details.tsx, features/calendar/add-event-dialog.tsx]
tech_stack:
  added: []
  patterns: [alert-dialog-delete-confirm, pre-fill-useEffect, select-dropdown-enum]
key_files:
  - features/calendar/calendar.tsx
  - features/calendar/event-details.tsx
  - features/calendar/add-event-dialog.tsx
decisions:
  - "Delete uses AlertDialog confirmation pattern matching reimbursement module"
  - "Edit mode reuses AddEventDialog with eventId/initialData props (not a separate dialog)"
  - "Type field uses Select dropdown with hardcoded 5 options matching backend enum"
metrics:
  duration: ~5min
  completed: 2026-09-01
---

# Phase 8 Plan 06: Calendar Frontend Overhaul Summary

Delete confirmation dialog, edit wiring with pre-fill, drag/resize error toasts, and event type Select dropdown matching backend enum.

## Tasks Completed

### Task 1: Calendar delete confirmation, drag/resize error handling, edit wiring
- Added `deleteTarget` and `editEvent` state to `calendar.tsx`
- Replaced direct `del.mutate` in onDelete with `setDeleteTarget` pattern
- Added AlertDialog with "Delete event?" confirmation, onCancel/onConfirm with del.mutate
- Added `onError` handlers to eventDrop and eventResize mutations (toast.error)
- Wired edit state: onEdit passed to EventDetailsSheet, editEvent state passed to AddEventDialog
- In event-details.tsx: uncommented onEdit prop, added Pencil import already present, rendered Edit button

### Task 2: AddEventDialog edit mode + type Select dropdown
- Extended Props type with `eventId?: string` and `initialData?: { title, type, start, end, description? }`
- Added useEffect pre-fill: `form.reset(initialData)` when initialData changes
- Branch submit handler: if eventId → update.mutate (edit), else → add.mutate (create)
- Updated button label: "Update Event" vs "Create Event"
- Replaced type field Input with Select dropdown (5 options: holiday, session, task, meeting, calendar-event)
- Added form.reset() on dialog close (visible→false)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data wired to real mutations.

## Verification

- `pnpm lint`: 0 errors (57 pre-existing warnings)
- `pnpm typecheck`: 0 new errors (2 pre-existing test type mismatches in unrelated files)
- All acceptance criteria met per plan
