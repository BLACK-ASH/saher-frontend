# Phase 8: Bug Fixes & Calendar Overhaul - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 7 reported bugs across the app and overhaul the calendar module end-to-end (frontend + backend). This is a systematic fix pass — no new features, no new modules. Every fix must work with the existing backend contract or fix the backend contract where it's broken.

**Bugs in scope:**
1. Calendar drag-and-drop not working (events created but vanish on refresh)
2. Calendar delete event not working (no error handling, no confirmation)
3. Registration: employee ID field shows "Date Of Birth Is Required" (copy-paste bug on 5 fields)
4. Profile page double-toast on error (shows error + success toast on failure)
5. Leave validation: backend rejects application (frontend/backend schema mismatch)
6. Notice delete: trash tab is placeholder, restore/permanent-delete are dead code
7. Bill lifecycle: nothing works except creation (no admin panel, broken pagination, missing edit dialog)

**Calendar overhaul:** Full frontend + backend fix — events persist across refresh, drag-drop works, delete has confirmation, edit is un-commented and functional.

</domain>

<decisions>
## Implementation Decisions

### Bug Priority & Order
- **D-01:** Fix bugs in dependency order: (1) Registration error messages — trivial copy-paste fix, no dependencies; (2) Profile double-toast — simple early-return fix; (3) Notice trash — wire existing dead code to UI; (4) Bills — route/panel + pagination + edit + balance key; (5) Leave — investigate backend rejection, fix schema mismatch; (6) Calendar — both frontend and backend, deepest investigation needed.

### Registration — Error Messages
- **D-02:** Fix the 5 wrong error messages in `register-schema.ts:67-76`. Each field gets its own correct message: employeeId → "Employee ID is required", department → "Department is required", designation → "Designation is required", salaryStructure → "Salary structure is required", address → "Address is required". Also fix the shift-2 typo ("2:00 AM" → "2:00 PM") in `employee-details.tsx:38`.

### Profile — Double Toast
- **D-03:** Fix `profile-info.tsx` double-toast pattern. The `handleChangeEmail`, `handleChangePassword`, and `handleChangeProfile` functions show both error and success toasts on failure. Fix: add early return after `toast.error()` so `toast.success()` only runs on success. The `apiFetch` wrapper already throws on failure, so the `res.success === false` path may be unreachable — but the code structure must be correct regardless.

### Notice — Trash Tab & Delete
- **D-04:** Wire the existing dead code to the UI. The hook already has `restoreNotice` and `permanentRemoveNotice` mutations. The trash tab (`notice-trash.tsx`) is a placeholder. Fix: implement trash tab to list trashed notices (add `isDeleted=true` query to service), add restore and permanent-delete buttons with confirmation dialogs. Follow the Phase 3 trash pattern (Active | Deleted tabs).

### Bills — Admin Panel & Lifecycle
- **D-05:** The finance bill management page (`finance-bill-table.tsx`) exists in code but has no route. The user sees only "My Bills" even as admin. Fix: add the admin bill management route under `app/(main)/(admin)/` with RoleGuard, wire the finance bill table to it. The sidebar nav needs a "Bill Management" entry for admin/finance roles.
- **D-06:** Fix pagination in `finance-bill-table.tsx:207` — `onPageChange={() => {}}` is a no-op. Wire it to actual page state.
- **D-07:** Fix balance card query key mismatch — `balance-card.tsx` uses `["reimbursement", "balance"]` but `use-reimbursement.ts` invalidation targets `["balance"]`. Align to `["reimbursement", "balance"]` in both places.
- **D-08:** Staff bill edit dialog is missing. The `bill-table.tsx` has an `onEdit` prop and edit button for pending bills, but no dialog component exists. Create an `EditBillDialog` that mirrors `CreateBillDialog` with pre-filled fields (amount, description, images — date locked per backend `userBillUpdateSchema`).
- **D-09:** Admin advance bill creation works (`advance-bill-dialog.tsx`). Verify it renders in the admin panel and the user-search picker works.

### Leave — Backend Validation Mismatch
- **D-10:** The frontend `applyLeaveSchema` sends `type` as a leave type code string (e.g., "CL"). The backend `createLeaveApplicationSchema` also expects `type` as a string and resolves it via `LeaveType.findOne({ code: payload.type })`. The schema fields match, but the backend has additional validation in `validateLeaveApplication()`: notice period check (startDate must be N days in future), proof requirement check, and overlap check. The rejection toast likely comes from one of these — investigate which one fails and fix the frontend to surface the specific error message.
- **D-11:** Backend has a field name mismatch in the update controller: `payload.leaveCode` (line 187) vs schema field `type`. This breaks leave type updates. Fix in backend.

### Calendar — Frontend + Backend Overhaul
- **D-12:** Events are created successfully (POST succeeds) but vanish on refresh (GET returns nothing). Root cause investigation needed in both repos. Suspected issues: (a) Backend date boundary query uses server-local timezone (`new Date(year, month, 1)`) — if server runs UTC and events are stored with IST dates, month boundaries may miss events; (b) The `GET` endpoint merges holidays, sessions, and calendar events — need to verify the calendar event aggregation pipeline actually returns stored events; (c) Frontend may be sending dates in a format the backend stores but can't query back.
- **D-13:** Fix calendar delete: add confirmation dialog before `del.mutate()`, add `onError` handler. The delete endpoint exists and works (`DELETE /api/calendar/event/:id`) — the frontend just needs proper UX.
- **D-14:** Un-comment the edit functionality in `event-details.tsx` and `calendar.tsx`. The `onEdit` callback is commented out. Wire it to open `AddEventDialog` in edit mode with pre-filled fields. The backend `PUT /api/calendar/event/:id` accepts partial updates.
- **D-15:** Add `onError` handlers to `eventDrop` and `eventResize` mutations in `calendar.tsx`. Currently only `onSuccess` exists — failed drag/drop silently fails.
- **D-16:** Backend calendar routes have NO `authorize()` middleware — any authenticated user can CRUD events. Add appropriate guards (at minimum `protectedRoute` is already there, but consider role-based access for create/update/delete).
- **D-17:** Backend `createCalendarEventSchema` accepts free-text `type` field, but the response schema restricts to `z.enum(['holiday', 'session', 'task', 'meeting', 'calendar-event'])`. Align: either make the response schema accept any string, or make the create schema an enum. The frontend `add-event-dialog.tsx` currently uses a free-text input for type.

### Cross-Cutting
- **D-18:** All fixes must use IST date handling via `lib/date.ts` (Phase 2 decision D-18).
- **D-19:** All mutations follow the no-optimistic-writes pattern (Phase 5 decision D-29).
- **D-20:** Delete confirmations use AlertDialog pattern (consistent with Phase 3 trash and Phase 6 user delete).
- **D-21:** Backend fixes go in `../saher-backend` repo. Frontend fixes go in this repo. Both must be coordinated — plan them together.

### the agent's Discretion
- Exact file names for new components (e.g., EditBillDialog placement)
- Whether to create a shared `DeleteConfirmDialog` or use inline AlertDialog each time
- Test coverage scope for each fix (minimum: lint/typecheck green, manual verification notes)
- Whether to add tests for the fixes (recommended for money paths per AUDT-07)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contracts (saher-backend)
- `../saher-backend/src/calendar/calendar.routes.ts` — All calendar endpoints, guards (none), validation
- `../saher-backend/src/calendar/calendar.schema.ts` — Create/update/response Zod schemas
- `../saher-backend/src/calendar/calender.controller.ts` — Controller logic, date handling
- `../saher-backend/src/libs/utils/calendar.ts` — Calendar aggregation pipeline (holidays + sessions + events)
- `../saher-backend/src/database/calendar-event.model.ts` — CalendarEvent entity shape
- `../saher-backend/src/reimbursement/reimbursement.routes.ts` — All bill endpoints, guards, validation
- `../saher-backend/src/reimbursement/bill/schema.ts` — Bill Zod schemas (user create/update, admin create/update)
- `../saher-backend/src/reimbursement/settlement/schema.ts` — Handle/settle Zod schemas
- `../saher-backend/src/leave/leave.route.ts` — All leave endpoints, guards
- `../saher-backend/src/leave/leave.schema.ts` — Leave application/review/update Zod schemas
- `../saher-backend/src/leave/leave.controller.ts` — Leave validation logic (notice period, overlap, proof)
- `../saher-backend/src/notice/notice.routes.ts` — Notice CRUD + restore + permanent delete endpoints
- `../saher-backend/src/notice/notice.controller.ts` — Notice controller logic
- `../saher-backend/src/database/notice.model.ts` — Notice entity shape (no timestamps)
- `../saher-backend/src/permission/role-permission.ts` — Permission matrix for all resources

### Frontend code (this repo)
- `features/register/register-schema.ts:67-76` — Copy-paste bug: 5 fields with wrong error messages
- `features/register/employee-details.tsx:38` — Shift-2 time label typo
- `features/profile/profile-info.tsx:37-75` — Double-toast pattern on error
- `features/noticeboard/notice-trash.tsx` — Placeholder trash tab
- `features/noticeboard/notice-feed.tsx` — Soft-delete with no undo/redirect to trash
- `hooks/use-notice.ts:41-49` — Dead code: restoreNotice and permanentRemoveNotice mutations
- `features/reimbursement/finance-bill-table.tsx:207` — Broken pagination (no-op onPageChange)
- `features/reimbursement/balance-card.tsx` — Query key mismatch with invalidation
- `features/reimbursement/bill-table.tsx` — Edit button wired but no dialog component
- `features/calendar/calendar.tsx` — Drag-drop/delete with no error handling
- `features/calendar/event-details.tsx` — Edit functionality commented out
- `features/calendar/add-event-dialog.tsx` — Free-text event type, loose zod schema
- `features/leave/apply-leave-dialog.tsx` — Apply form (schema in services/leave.api.ts)

### Prior decisions
- `.planning/phases/02-shared-infrastructure-session-reliability/02-CONTEXT.md` — D-18: IST date handling via lib/date.ts
- `.planning/phases/05-money-approval-reimbursement-payroll/05-CONTEXT.md` — D-26: money mutation safety, D-29: no optimistic writes
- `.planning/phases/03-noticeboard-pilot/03-CONTEXT.md` — Trash tabs pattern (Active | Deleted)

### Requirements
- `.planning/REQUIREMENTS.md` — All existing requirements (Phase 8 is bug fixes, not new requirements)
- `.planning/ROADMAP.md` §Phase 8 — Success criteria 1–7

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/alert-dialog.tsx` — AlertDialog for delete confirmations (calendar delete, notice permanent delete)
- `components/ui/dialog.tsx` — Dialog for edit forms (bill edit, calendar edit)
- `components/ui/tabs.tsx` — Tabs for trash pattern (Active | Deleted)
- `components/loading.tsx` — DefaultLoader for loading states
- `components/no-data.tsx` — NoData for empty states
- `lib/date.ts` — IST date utilities (must be used for all date handling)
- `lib/permissions.ts` — `can()` RBAC helper for admin/staff gating
- `lib/api-wrapper.ts` — `apiFetch` for all HTTP requests
- `hooks/use-reimbursement.ts` — Existing mutations (add, update, handle, settle, etc.)
- `hooks/use-notice.ts` — Existing dead mutations (restoreNotice, permanentRemoveNotice)
- `features/reimbursement/create-bill-dialog.tsx` — Template for EditBillDialog
- `features/calendar/add-event-dialog.tsx` — Template for edit mode (add `eventId` prop)

### Established Patterns
- Trash pattern: Phase 3 Active | Deleted tabs with restore/permanent-delete
- Delete confirmation: AlertDialog before any destructive action
- Money mutations: disabled button + spinner while pending, no optimistic writes
- Forms: react-hook-form + zodResolver + Controller + FieldLabel/FieldError
- Admin routes: `app/(main)/(admin)/` with RoleGuard
- IST dates: all date rendering/parsing through `lib/date.ts`

### Integration Points
- `app/(main)/(admin)/` — Add bill management route here
- `components/sidebar/nav-list.tsx` — Add "Bill Management" nav entry for admin/finance
- `features/calendar/calendar.tsx` — Fix drag-drop, delete, wire edit
- `features/noticeboard/notice-trash.tsx` — Replace placeholder with real trash list
- `features/reimbursement/finance-bill-table.tsx` — Fix pagination, add to admin route
- `features/reimbursement/balance-card.tsx` — Fix query key
- `features/register/register-schema.ts` — Fix error messages
- `features/profile/profile-info.tsx` — Fix double-toast

</code_context>

<specifics>
## Specific Ideas

- Calendar events vanish on refresh — this is the highest-priority bug. User creates an event, sees it, refreshes, it's gone. Backend investigation is critical.
- "Nothing works except creating bill" — the admin bill management route doesn't exist in the app router. The component exists but is unrouted.
- Leave validation rejection comes from the backend (toast shows backend error message). Need to surface the specific backend error to the user.
- Notice trash is a placeholder with text "Deleted notices will appear here once the backend supports listing trashed items." — but the backend DOES support it (DELETE sets isDeleted=true, GET could filter by isDeleted=true). The frontend just never wired the query.
- User wants calendar fixed in BOTH frontend and backend — this requires access to `../saher-backend` repo.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. All 7 bugs + calendar overhaul are the complete scope.

</deferred>

---

*Phase: 8-Bug Fixes & Calendar Overhaul*
*Context gathered: 2026-08-31*
