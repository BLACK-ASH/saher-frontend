---
phase: 04-staff-self-service-mail-leave
plan: "03"
subsystem: ui
tags: [leave, react-hook-form, image-upload, pagination, tanstack-query, ist-dates]

# Dependency graph
requires:
  - phase: 04-staff-self-service-mail-leave
    plan: 01
    provides: LeaveT/applyLeaveSchema/updateLeaveApplication in services/leave.api.ts, zod response schemas
provides:
  - ApplyLeaveDialog as single create/edit dialog (leave?: LeaveT prop) with balance cards, ImageUpload proof, inline overlap errors
  - Staff leave table with pending-row edit button and PaginationFooter driven by /leave?page=N search params
  - Leave detail dialog Edit affordance flowing into the same edit state
affects: [phase-4-verifier, phase-5-reimbursement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single dialog create/edit via optional entity prop; useEffect pre-fill with dateToIstDateOnly for <input type=date>"
    - "Inline field-level API error routing: err.message.includes('overlap') -> state below fields, else toast"

key-files:
  created: []
  modified:
    - features/leave/apply-leave-dialog.tsx (renamed from apply-leave-dailog.tsx)
    - features/leave/page.tsx
    - features/leave/leave-table.tsx
    - features/leave/leave-details-dialog.tsx

key-decisions:
  - "Pre-filled date inputs with dateToIstDateOnly(new Date(...)) instead of the plan's formatIstDate — formatIstDate returns display text ('26 Aug 2026') which <input type=date> rejects"
  - "LeaveTable forwards onEdit to its internal LeaveDetailsDialog so both row Pencil and detail-dialog Edit land in the page's single editLeave state"

patterns-established:
    - "Edit-through-detail-dialog pattern: dialog action closes itself then hands the entity to a shared editor"

requirements-completed: ["LEAV-01", "LEAV-02", "LEAV-03", "LEAV-04"]

# Metrics
duration: 12min
completed: 2026-08-26
---

# Phase 4 Plan 03: Staff Leave — Balance-in-Dialog, Proof Upload, Edit, Pagination Summary

**Staff leave apply/edit dialog with live balance cards, ImageUpload proof storing URL, inline overlap errors, pending-row edit from table or detail view, and search-param-backed PaginationFooter**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-26T06:04:58Z
- **Completed:** 2026-08-26T06:17:17Z
- **Tasks:** 4
- **Files modified:** 4 (1 renamed + rewritten, 3 edited)

## Accomplishments
- `apply-leave-dailog.tsx` typo renamed to `apply-leave-dialog.tsx` (git mv); sole importer updated
- Apply dialog is now the single create/edit surface: `leave?: LeaveT` prop switches title ("Apply For Leave" / "Edit Leave Application"), button ("Apply Leave" / "Update Application"), and pre-fills all fields via useEffect using IST-correct `dateToIstDateOnly`
- Compact balance cards (`rounded-lg border p-3` + `<Badge variant="secondary">{remaining} Left</Badge>`) render at the top of the dialog body from the shared `["leave","balance"]` query
- Proof field replaced with `ImageUpload` storing `file.src` (URL string) so the details dialog's `<Image src={proof}>` keeps working
- Overlap API errors surface inline below the date grid (`overlapError` state) keeping the form open; all other errors toast via the existing apiFetch path
- LeaveTable gained `onEdit` (Pencil on pending rows only), `page`/`totalPages`/`onPageChange`, rendering PaginationFooter when totalPages > 1; pager pushes `/leave?page=N&limit=M`
- Detail dialog shows an outline "Edit" button for pending applications that closes itself and opens the apply/edit dialog pre-filled

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename file + rework apply dialog (balance cards, proof upload, edit mode)** - `0844a50` (feat)
2. **Task 2: Pending-row edit button + PaginationFooter in leave table** - `adb326a` (feat)
3. **Task 3: Edit button in leave detail dialog** - `1d6a3e8` (feat)
4. **Task 4: Wire edit state + pagination into staff leave page** - `0639e87` (feat)

## Files Created/Modified
- `features/leave/apply-leave-dialog.tsx` - Renamed from `apply-leave-dailog.tsx`; balance cards, ImageUpload proof, overlap error state, edit mode via `leave?` prop
- `features/leave/page.tsx` - `editLeave` state; dialog opens for create or edit and clears edit target on close; pager wired to router/searchParams
- `features/leave/leave-table.tsx` - `onEdit`/`page`/`totalPages`/`onPageChange` props; Pencil on pending rows; PaginationFooter below card; forwards onEdit to detail dialog
- `features/leave/leave-details-dialog.tsx` - `onEdit` prop; pending-only Edit button that closes the dialog on click

## Decisions Made
- Used `dateToIstDateOnly` over the plan's `formatIstDate` for pre-filling `<input type="date">` values (see Deviations)
- Wrapped Eye+Pencil actions in a right-aligned flex group to keep the two icon buttons aligned in the Action column
- `onPageChange` preserves the existing `limit` search param rather than hardcoding 10

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Date pre-fill used a display formatter**
- **Found during:** Task 1
- **Issue:** Plan step 8 said `formatIstDate(leave.startDate)` for pre-filling, but `formatIstDate` returns `"26 Aug 2026"` display text which `<input type="date">` silently rejects — edit mode would show empty dates
- **Fix:** `dateToIstDateOnly(new Date(leave.startDate))` → `YYYY-MM-DD`, matching what the apply flow already submits
- **Files modified:** features/leave/apply-leave-dialog.tsx
- **Verification:** tsc clean; value format matches native date-input contract
- **Committed in:** 0844a50 (Task 1 commit)

**2. [Rule 1 - Bug] ImageUpload is a default export**
- **Found during:** Task 1
- **Issue:** Plan step 4 specified `import { ImageUpload }`; the component exports default — named import would fail compilation
- **Fix:** `import ImageUpload from "@/components/image-upload"`
- **Files modified:** features/leave/apply-leave-dialog.tsx
- **Verification:** pnpm build passes
- **Committed in:** 0844a50 (Task 1 commit)

**3. [Rule 3 - Blocking] onEdit pass-through to detail dialog inside LeaveTable**
- **Found during:** Task 4
- **Issue:** Task 4 criterion requires the detail-dialog Edit button to set the page's `editLeave`, but LeaveDetailsDialog is rendered inside leave-table.tsx, not the page — the page cannot pass props to it directly
- **Fix:** LeaveTable forwards its `onEdit` into LeaveDetailsDialog (clearing `selected` first)
- **Files modified:** features/leave/leave-table.tsx
- **Verification:** tsc clean; both edit entry points route through one handler
- **Committed in:** 0639e87 (Task 4 commit)

---

**Total deviations:** 3 auto-fixed (3 × Rules 1–3; no architectural changes)
**Impact on plan:** All fixes required for compile correctness or to satisfy the plan's own acceptance criteria. No scope creep.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for 04-04/05 (admin review queue): staff edit flow shares the apply dialog, admin page untouched by this plan
- Backend returns full application arrays without server pagination meta, so `normalizeList` yields totalPages=1 until the backend adds paging — PaginationFooter renders but stays hidden at ≤1 page (per research §5 HIGH risk note)
- LEAV-01..04 acceptance paths implemented; human verification of apply/edit flows pending phase verifier

---
*Phase: 04-staff-self-service-mail-leave*
*Completed: 2026-08-26*

## Self-Check: PASSED

All 4 task commits verified in git log (0844a50, adb326a, 1d6a3e8, 0639e87); old typo filename gone (`grep apply-leave-dailog` zero results in source); `pnpm lint` exit 0 (0 errors, 51 warnings vs 52 baseline); `pnpm build` completes without type errors; tests match baseline (2 known session.test.ts failures, 340 passed).
