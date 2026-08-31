# Phase 8: Bug Fixes & Calendar Overhaul - Research

**Researched:** 2026-08-31
**Domain:** Bug-fix pass across registration/profile/notice/bills/leave/calendar + full calendar overhauld (frontend + backend)
**Confidence:** MEDIUM

## Summary

This phase fixes 7 reported bugs and overhauls the calendar end-to-end. I verified every frontend claim in CONTEXT.md against the actual source, and every backend endpoint against `../saher-backend/src`. The CONTEXT.md file is accurate on file locations, line numbers, and the nature of each bug. The critical open question — the **calendar "events vanish on refresh"** root cause — is a genuine backend investigation spike (D-12): the aggregation pipeline returns valid event docs, the response schema is satisfied, and the frontend query/invalidation wiring is correct, so the failure is timezone/boundary-sensitive and must be reproduced against the live deployment to pinpoint before code is written.

The registration (D-02), profile double-toast (D-03), notice trash (D-04), bill management routing+pagination+balance-key (D-05/D-06/D-07), bill edit dialog (D-08), leave backend-rejection surfacing (D-10), and the leave update field-name mismatch (D-11) are all confirmed as described. **Two backend files named in CONTEXT.md commonly do NOT contain the referenced bugs**, and one backend bug reference was mis-attributed — details in the findings below.

**Primary recommendation:** Split the phase into (a) low-risk frontend-only fixes (registration, profile, notice trash, bill routing/pagination/balance key) that can ship immediately, and (b) a coordinated cross-repo workstream for calendar (backend spike first) and leave (backend field-name fix + frontend surfacing). Do NOT hand both repos to one plan; the backend calendar route file (28 lines, no RBAC) and the leave update controller are the two backend edits. Budget a live-verification step for the calendar vanish bug before locking the fix.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calendar event persistence boundary | Database/Storage | Backend | The `getCalendarEventByMonth` `$gte/$lt` month query is a backend date-boundary concern (D-12) |
| Calendar CRUD authorization | Backend | — | `calendar.routes.ts` has NO `authorize()`; only `protectedRoute` at mount (D-16) |
| Calendar drag-drop/resize/delete UX | Browser/Client | — | FullCalendar `eventDrop`/`eventResize`/`del` callbacks live in `calendar.tsx` (D-13/15) |
| Calendar event edit dialog | Browser/Client | — | `AddEventDialog` edit-mode wiring + `event-details.tsx` un-comment (D-14) |
| Registration error messages | Frontend (schema) | — | `register-schema.ts:67-76` zod messages (D-02) |
| Profile double-toast | Frontend (client logic) | — | early-return pattern in `profile-info.tsx` (D-03) |
| Notice trash listing/restore/permanent-delete | Frontend | Backend (already supports) | `getNotices` reads `isDeleted`; hook dead code exists (D-04) |
| Bill admin management | Frontend (route+nav) | Backend (contract exists) | Adds nav entry + route wiring; backend endpoints already present (D-05) |
| Bill pagination / balance invalidation | Frontend | — | finance-bill-table onPageChange + balance query-key alignment (D-06/D-07) |
| Bill staff edit dialog | Frontend (form) | Backend `userBillUpdateSchema` | date locked; amount/description/images editable (D-08) |
| Leave application rejection surfacing | Frontend | Backend (validators) | surface specific `validateLeaveApplication` error (D-10) |
| Leave update type field-name mismatch | Backend | — | `payload.leaveCode` vs schema `type` (D-11) |

## Standard Stack

This is a **bug-fix phase — no new runtime packages required on either repo**. Every fix uses libraries already installed and verified in this codebase. The only "new" artifacts are new component files (EditBillDialog, DeleteConfirmDialog) built from existing shadcn primitives.

### Core (already installed — no change)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form ^7.71.1 | present | EditBillDialog / AddEventDialog edit mode | existing form convention (CONVENTIONS) |
| zod ^4 | present | schemas for register/leave/calendar | existing validation convention |
| @tanstack/react-query ^5 | present | bill/notice/calendar mutations | existing server-state convention |
| @fullcalendar/* ^6.1.20 | present | calendar drag/resize/delete | existing calendar engine |
| components/ui/alert-dialog, dialog, tabs | present | confirmations, edit forms, trash tabs | shadcn primitives |
| lib/date.ts | present | all IST date handling (D-18) | Phase 2 locked decision |

### Backend (no new deps)
All backend edits use existing rsp/mongoose/zod. No new packages.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline AlertDialog for each delete | shared DeleteConfirmDialog | CONTEXT D-20 leaves to agent discretion; inline is fewer files, matches existing patterns |

**Installation:** none for this phase (both repos). Verify with `pnpm install` no-op if lockfile regenerated.

**Version verification:** All libraries above are confirmed present in `package.json` (this is a zero-new-dependency phase — see Package Legitimacy Audit).

## Package Legitimacy Audit

> No external packages are installed by this phase in either repo. All work uses existing dependencies and shadcn-generated components. Therefore the slopcheck gate is N/A — there are no new packages to vet.

**Packages removed due to slopcheck [SLOP] verdict:** none (no new packages)
**Packages flagged as suspicious [SUS]:** none (no new packages)

*If a plan discovers a genuine new dependency need during execution, it must re-run the package-legitimacy gate before adding it.*

## Architecture Patterns

### System Architecture Diagram

```
                        ┌─────────────────────────────────────────────┐
                        │                saher-backend                │
                        │                                             │
  Frontend (this repo)  │  ┌─ calendar.routes.ts (NO authorize) ───┐ │
 ┌───────────────────┐  │  │  GET /:year/:month  → aggregation     │ │
 │ app/(main)/calendar│──┼─▶│  POST /event       → create           │ │
 │  calendar.tsx      │  │  │  PUT/DELETE /event/:id                │ │
 │  AddEventDialog    │  │  └───────────────────────────────────────┘ │
 │  EventDetailsSheet │  │                                             │
 └───────────────────┘  │  ┌─ leave.route.ts ──────────────────────┐ │
 ┌───────────────────┐  │  │  POST application/apply → validate     │ │
 │ app/(admin)/bill   │  │  │     (notice period / proof / overlap) │ │
 │ management page   │──┼─▶│  PUT application/update/:id             │ │
 └───────────────────┘  │  └───────────────────────────────────────┘ │
 ┌───────────────────┐  │  ┌─ notice.routes.ts ────────────────────┐ │
 │ notice-trash.tsx  │──┼─▶│  GET / (isDeleted:false only — GAP)    │ │
 │ notice-feed.tsx   │  │  │  DELETE /:id, PATCH /:id/restore,      │ │
 └───────────────────┘  │  │  DELETE /:id/permanent                  │ │
                        │  └───────────────────────────────────────┘ │
                        └─────────────────────────────────────────────┘
   Key flow: data enters via browser (CSR), apiFetch → same-origin /api/*,
   reverse-proxied to backend. Bugs span frontend UX, frontend wiring,
   and backend date-boundary / RBAC / field-name mismatches.
```

### Recommended Change Surface (not a file listing — the bug-to-fix map)

| Bug | Frontend File(s) | Backend File(s) | Fix Nature |
|-----|------------------|-----------------|------------|
| Registration messages | `features/register/register-schema.ts:67-76`, `employee-details.tsx:38` | — | pure edit, no migration |
| Profile double-toast | `features/profile/profile-info.tsx` | — | early-return edit |
| Notice trash | `features/noticeboard/notice-trash.tsx`, `services/notice.api.ts`, `hooks/use-notice.ts` | — | wire dead code + add isDeleted query |
| Bills admin | `components/sidebar/nav-list.tsx`, reusable page under `(admin)` | — | routing + nav |
| Bills pagination | `features/reimbursement/finance-bill-table.tsx:207` | — | wire setter |
| Bills balance key | `features/reimbursement/balance-card.tsx` | — | align query key |
| Bills edit dialog | `features/reimbursement/bill-table.tsx`, new `EditBillDialog` | — | new component |
| Leave rejection | `features/leave/apply-leave-dialog.tsx` | — | surface specific error |
| Leave update mismatch | — | `src/leave/leave.controller.ts` (update): `payload.leaveCode` | backend field fix |
| Calendar vanish | verify first | `src/calendar/calender.controller.ts`, `src/libs/utils/calendar.ts` | backend investigation + fix |
| Calendar delete UX | `features/calendar/calendar.tsx` | — | AlertDialog + onError |
| Calendar edit | `features/calendar/add-event-dialog.tsx`, `event-details.tsx`, `calendar.tsx` | — | wire + un-comment |
| Calendar RBAC | — | `src/calendar/calendar.routes.ts` | add `authorize()` |
| Calendar type enum | `features/calendar/add-event-dialog.tsx` | `src/calendar/calendar.schema.ts` | align free-text vs enum |

## Key Findings (verified against source)

### F1 — Calendar "vanish on refresh": real backend spike, timezone/boundary sensitive [VERIFIED lines; MEDIUM on root cause]
- The aggregation `getCalendarEvents` (src/libs/utils/calendar.ts:162-217) DOES return stored events: it `$set`s `allDay:false`, builds `details`, and `$set`s `type:'calendar-event'` (a valid response-enum value). The response schema `z.array(event)` is satisfied. **So the pipeline is not structurally dropping events.**
- The month-boundary query uses `new Date(year, month, 1)` and `new Date(year, month, days+1)` — **server-local timezone** (calendar.ts:165-166 and controller).
- **Decisive environment fact:** this dev server's `/etc/timezone` = `Asia/Kolkata`, so the boundary query is IST-local HERE. But the production target is Docker (`node:24-alpine`) — the backend Dockerfile sets no TZ, so in the container `new Date(year,month,1)` is **UTC**. Events are stored with UTC instant derived from frontend-sent JS Dates. When an IST event on the month edge (e.g., 2026-09-01 07:00 IST = 01:30Z) is stored, a UTC `new Date(2026,8,1)`=2026-08-31T18:30Z boundary may exclude it. **On the dev box this works; in the container it can fail.** Must reproduce against the Docker deployment before fixing.
- Secondary quirk worth checking at the spike: the `createCalendarEventController` also does `findOne({ type, start, end, isDeleted:false })` duplicate guard, and `add-event-dialog.tsx` sends `end: addDays(data.end,1)` while `calendar.tsx` select handler already `subDays(info.end, 1)` — the ±1-day boundary juggling is a red flag for date drift. Confirm with live create → refresh `curl` against both envs.
- **Action for planner:** include a backend/integration investigation step (not a guess-fix) that reproduces on the Docker env and confirms the exact boundary failure before editing `calendar.ts`.

### F2 — Backend routes file has NO authorize() on calendar [VERIFIED HIGH]
`calendar.routes.ts` (all 6 routes) has no `authorize()`. Only `protectedRoute` at `app.use('/api/calendar', ...)` mount (app.ts:97). Any authenticated user can create/update/delete/restore events. **Confirms D-16.** Critically, the permission matrix `role-permission.ts` has **NO `calendar` resource** — so adding RBAC requires deciding which existing permission (or a new one) gates these routes. Do not invent a `calendar` permission without updating the matrix + frontend `lib/permissions.ts` in lockstep. Recommend gating with `protectedRoute` + a role check in-controller (simplest, matches how payroll/leave admin endpoints check `req.user?.role`) OR a new explicit permission — flag for discuss.

### F3 — Calendar type enum mismatch (D-17) [VERIFIED HIGH]
`createCalendarEventSchema.type` is `z.string()` (free-text) but the read response `eventSchema.type` is `z.enum([...])`, and `getCalendarEvents` hardcodes returned `type` to `'calendar-event'`, burying the user's entered type in `details.type`. Frontend `add-event-dialog.tsx` uses a free-text `<Input>`. So the user's "type" is stored but never round-trips to the user-visible enum. Decide: enum the create type, or map free-text types into the enum, in coordination with the edit dialog (D-14) which will need to show/restore the original type.

### F4 — Leave update controller field-name mismatch (D-11) [VERIFIED HIGH]
`leave.controller.ts` `updateLeaveApplicationController` reads `payload.leaveCode` (line 187) and writes `{ leaveCode: payload.leaveCode }` (line 214-216), but the schema field is `type`, and the model stores the leave-type `_id` on `leave.type`. So **updating the leave type is broken in the backend**, regardless of the frontend. The frontend (`apply-leave-dialog.tsx:114-122`) already works around it by sending `leaveCode` — but the backend both *reads* nonexistent `payload.leaveCode` (so type updates silently no-op) *and* writes a `leaveCode` field that's not on the schema. This is a backend fix: read `payload.type`, and in `updateData` map it to `type: newLeaveType._id`. Also note the backend's `leaveType` resolution at line 188 assumes `_id` but create-path uses `code` — inconsistent abstraction. Flag for the plan.

### F5 — Leave rejection on apply (D-10): backend validators [VERIFIED HIGH]
Frontend `applyLeaveSchema` (services/leave.api.ts:37-56) matches backend `createLeaveApplicationSchema` (leave.schema.ts:5-26) on shape and uses `dateInputToIso` (+05:30) in the dialog. So the **schema is not the mismatch** — the rejection toast comes from one of the `validateLeaveApplication` business rules (leave.ts:5-62): (a) notice period `minDaysNotice`, (b) `requiresProof` when proof missing, or (c) overlapping pending/approved leave. The dialog only surfaces "overlap" inline (apply-leave-dialog.tsx:97); notice-period and proof rejections are only toasted generically via apiFetch. **Fix:** make the dialog surface the specific backend message (notice period / proof / overlap) instead of only overlap. This is the real user-facing gap. No backend schema change needed here for apply.
- **Frontend date note:** dates are sent as `+05:30` ISO strings (`dateInputToIso`), which the backend `z.coerce.date()` parses fine.

### F6 — Bills admin management: EXISTS but UNROUTED [VERIFIED HIGH]
`app/(main)/reimbursement/management/page.tsx` is a complete, working Bill Management page (search, handle queue, recycle bin, advance create/edit/delete, export) already guarded by `RoleGuard can(r,"read","preReimbursement")`. It simply has **no nav-list entry** — nav only shows "My Bills" (nav-list.tsx:74-77). **D-05 is a nav/routing gap, NOT a missing page.** The page already lives outside `(admin)` group under `reimbursement/management`. Recommend: add a "Bill Management" nav entry gated on `can(r,"read","preReimbursement")` (finance/admin), OR move under `(admin)`. Keep the existing page, don't rebuild.

### F7 — Bills pagination truly no-op (D-06) [VERIFIED HIGH]
`finance-bill-table.tsx:207`: `<PaginationFooter page={data?.page ?? 1} totalPages={totalPages} onPageChange={() => {}} />`. The parent `management/page.tsx` owns `page` state and passes `data` but never an `onPageChange` to `FinanceBillTable` — the component has no such prop. **Fix requires threading an `onPageChange={setPage}` prop from the page into `FinanceBillTable`** and wiring it to the footer. This is the root cause, not just a one-line mock.

### F8 — Bills balance query-key mismatch (D-07) [VERIFIED HIGH]
`balance-card.tsx:7` uses `["reimbursement","balance"]`; `use-reimbursement.ts` `invalidate()` (line 58-61) targets `["balance"]`. Confirmed mismatch — mutations never invalidate the balance card. Align both to `["reimbursement","balance"]`. (Note: `invalidateQueries(["balance"])` with prefix matching actually matches `["balance", ...]` — but `["reimbursement","balance"]` does NOT start with `["balance"]`, so it is missed. Fix on the reimbursement side AND keep balance-card as-is, or vice versa — pick one.)

### F9 — Bill edit dialog missing (D-08) [VERIFIED HIGH]
`bill-table.tsx` has `onEdit` prop and an Edit button for `status==="pending"`, but no dialog consumes it. Backend `userBillUpdateSchema` (bill/schema.ts:34-36) allows `.partial()` of id/amount/description/images — **date is not updatable**. So `EditBillDialog` must pre-fill amount/description/images and leave date read-only. The same user-edit path is `PATCH /rem/:billId` guarded `authorize('update','postReimbursement')` (reimbursement.routes.ts:39-44).

### F10 — Notice trash wiring (D-04) [VERIFIED HIGH]
`notice-trash.tsx` is a placeholder using `TrashTabPattern`. `hooks/use-notice.ts` already exports `restore` and `permanentRemove` mutations (lines 41-49), and `services/notice.api.ts` has `restoreNotice`/`permanentDeleteNotice` (lines 62-68). **The dead code exists exactly as CONTEXT says.** The backend `DELETE /notice/:id` soft-deletes (notice.controller.ts deleteNotice) and `DELETE /notice/:id/permanent` hard-deletes. **BUT the backend `getNotices` (notice.controller.ts:111-117) hard-filters `isDeleted:false` AND `expiresAt > now`** — there is NO endpoint to list deleted notices. So the trash tab's "list trashed" needs **either** a new backend query param (`GET /notice?isDeleted=true`) **or** a frontend filter against a to-active-fetch — cross-repo coordination required (D-21). The restore/permanent-delete endpoints already exist and are guarded (`authorize('update'/'delete','notice')`).

### F11 — Registration error messages (D-02) [VERIFIED HIGH]
`register-schema.ts:67-76` confirms the 5 copy-paste errors: `employeeId`, `department`, `designation`, `salaryStructure`, `address` all use `"Date Of Birth Is Required."`. `employee-details.tsx:38` confirms the shift-2 label `"2:00 AM - 6:00 PM"` typo (should be `2:00 PM`). Pure edit.

### F12 — Profile double-toast (D-03) [VERIFIED HIGH]
`profile-info.tsx` `handleChangeEmail`/`handleChangePassword` (lines 37-57) and `handleChangeProfile` (lines 59-75): each `if (!res.success) { toast.error(...) }` is **not** followed by `return`, so `toast.success(res.message)` always runs. Since `apiFetch` throws on non-success (per lib/api-wrapper), the `!res.success` branch is likely unreachable, but the structure is wrong. Add `return` after `toast.error()` (and note: since apiFetch throws, the code should use try/catch or rely on the throw — flag which path the plan chooses).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delete confirmations | custom modal | `components/ui/alert-dialog.tsx` | shadcn primitive, established pattern (D-20, Phase 3/6) |
| List/empty/loading states | custom | `components/loading.tsx`, `components/no-data.tsx` | existing shared components |
| IST date logic | new date code | `lib/date.ts` | Phase 2 D-18 locked; all date handling routes here |
| RBAC checks | bespoke role checks | `lib/permissions.ts` `can()` | Phase 2 D-06 helper, drives affordance gating |
| HTTP calls | bare fetch | `lib/api-wrapper.ts` `apiFetch` | single funnel, 401 refresh, toasts |
| Calendar timezone handling | custom | existing `lib/date.ts` helpers + FullCalendar `timeZone:"Asia/Kolkata"` | don't add a tz lib for this |
| Money-path forms | hand-rolled submit | react-hook-form + zod + Controller | existing convention, double-submit gating (D-26) |

**Key insight:** This is a zero-new-dependency bug-fix phase. The irony is that the highest-risk item (calendar vanish) is a **debugging** problem (timezone/boundary), not a "build something" problem — resist the urge to add a timestamp library or rewrite the calendar. The fix is a targeted boundary correction once reproduced.

## Common Pitfalls

### Pitfall 1: Fixing calendar vanish with a guess instead of a repro
**What goes wrong:** Dev box (IST) can't reproduce the bug because server tz matches IST; the production Docker container runs UTC. A "fix" verified only on the dev box ships broken.
**Why it happens:** `new Date(year, month, 1)` is env-dependent; no TZ pinned in backend Dockerfile.
**How to avoid:** Reproduce against the Docker/image env (or pin TZ and verify both) before editing. Verify create→refresh round-trip in both dev and container.
**Warning signs:** Fix passes manual test locally, fails in staging.

### Pitfall 2: Adding a `calendar` RBAC permission without the matrix + frontend
**What goes wrong:** Backend `authorize('x','calendar')` matches nothing → 403 for everyone.
**Why it happens:** `role-permission.ts` has no `calendar` resource.
**How to avoid:** Decide the gating approach in the plan (in-controller role check vs new permission) and update matrix + frontend `lib/permissions.ts` + `can()` in lockstep. Cleanest for this phase: reuse existing `postReimbursement`/write gating or add explicit calendar perms deliberately.
**Warning signs:** New `authorize` always 403s.

### Pitfall 3: Leave update "fix" that breaks the create path
**What goes wrong:** "Fix" `leaveCode`→`type` only in the update controller but the create path resolves `type` by `code` while update resolves by `_id` — inconsistent semantics silently corrupt the type reference.
**Why it happens:** Two different abstractions for the same `type` field across create/update.
**How to avoid:** In the update controller resolve by `code` (same as create) OR consistently by `_id`; fix both the read (`payload.type`) and the write (`type: newLeaveType._id`), and confirm the populated response `type` object shape.
**Warning signs:** Updated leave shows stale/incorrect type name after edit.

### Pitfall 4: Notice trash breaks the "soft delete = TTL purge" model
**What goes wrong:** Listing deleted notices conflicts with the TTL index on `expiresAt` (auto-purge) and the existing `getNotices` filter.
**Why it happens:** `Notice` has a TTL index — deleted-but-expired notices get physically purged, so "trash" is a best-effort window, not durable.
**How to avoid:** Document this in the plan. The trash list should filter `isDeleted:true` and accept that expired trashed items may have been auto-purged. Add a backend `isDeleted` query param (or new route) and keep the restore/permanent endpoints as-is.
**Warning signs:** Trash shows items that vanish overnight (TTL).

### Pitfall 5: Balance-key fix left half-done (D-07)
**What goes wrong:** Aligning only `balance-card.tsx` to `["balance"]` but `use-reimbursement` already invalidates `["balance"]` — OR vice versa — leaving one side stale.
**Why it happens:** `invalidateQueries` prefix matching is directional.
**How to avoid:** Pick ONE canonical key (`["reimbursement","balance"]`) and make BOTH the query and the invalidation use it; add a test.
**Warning signs:** Balance card stale after settle.

## Code Examples

### Pattern A — Threading pagination into FinanceBillTable (D-06)
```tsx
// management/page.tsx — pass the setter
<FinanceBillTable
  data={data}
  // ...existing
  onPageChange={setPage}   // NEW: thread parent's page state
/>

// finance-bill-table.tsx — accept + wire the prop
interface FinanceBillTableProps {
  // ...existing
  onPageChange: (page: number) => void;   // NEW
}
// ...
<PaginationFooter
  page={data?.page ?? 1}
  totalPages={totalPages}
  onPageChange={onPageChange}   // was () => {}
/>
```
Source: existing `management/page.tsx:40` owns `page`; existing `finance-bill-table.tsx:207`.

### Pattern B — Align the reimbursement balance key (D-07)
```ts
// balance-card.tsx (keep — canonical)
useQuery({ queryKey: ["reimbursement", "balance"], queryFn: getBalanceEnquiry });
// use-reimbursement.ts invalidate() — change from ["balance"]
const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ["bills"] });
  queryClient.invalidateQueries({ queryKey: ["reimbursement", "balance"] }); // was ["balance"]
};
```

### Pattern C — Register error message fix (D-02)
```ts
// register-schema.ts:67-76 — replace each wrong message
employeeId: z.string().min(2, "Employee ID is required"),
department: z.string().min(2, "Department is required"),
designation: z.string().min(2, "Designation is required"),
salaryStructure: z.string().min(2, "Salary structure is required"),
address: z.string().min(2, "Address is required"),
```

### Pattern D — Profile double-toast early return (D-03)
```ts
const handleChangeEmail = async () => {
  const res = await apiFetch(`/api/auth/change-email/request`, { method: "POST" });
  if (!res.success) {
    toast.error(res.message);
    return;                         // ← ADD early return before toast.success
  }
  toast.success(res.message);
  queryClient.invalidateQueries({ queryKey: ["user"] });
};
// Repeat for handleChangePassword, handleChangeProfile.
```

### Pattern E — Calendar edit wiring (D-14) + delete confirmation (D-13)
```tsx
// calendar.tsx — hold edit target, pass onEdit through
const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

<EventDetailsSheet
  event={selectedEvent}
  open={selectedEvent !== null}
  onOpenChange={(open) => !open && setSelectedEvent(null)}
  onEdit={(e) => { setSelectedEvent(null); setEditEvent(e); }}
  onDelete={(e) => setDeleteTarget(e)}          // D-13: open AlertDialog, don't del.mutate directly
/>
<AddEventDialog
  data={selectedItem}
  visible={selectedVisible}
  setVisible={setSelectedVisible}
  eventId={editEvent?.id}                        // D-14: add eventId prop for edit mode
  initialData={editEvent}                        // pre-filled
/>
// Add <AlertDialog> for delete confirmation before del.mutate(event.id, { onError })
```
Source: current `calendar.tsx` has both `onEdit` and `onDelete` commented/placeholder at lines 218-234; `add-event-dialog.tsx` is the template.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-local month boundary `new Date(year,month,1)` | IST-pinned or UTC-normalized boundary | this phase (D-18 mandate) | calendar events won't vanish at month/timezone edges |
| Calendar routes with zero RBAC | role-gated calendar CRUD | this phase (D-16) | prevents any-authenticated-user event tampering |
| Free-text calendar event `type` | enum-aligned type | this phase (D-17) | round-trips user-entered type |
| Leave update by wrong `leaveCode` | `type`-resolved update | this phase (D-11) | leave type edits actually persist |

**Deprecated/outdated:**
- Leave update `payload.leaveCode` reference in `leave.controller.ts` — broken, replaced by schema-consistent `type`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend deploy container runs UTC (no TZ in Dockerfile) → calendar boundary bug reproduces only there | F1 | Fix verified only on IST dev box won't fix prod; must confirm container TZ |
| A2 | `authorize('...','postReimbursement'/'preReimbursement')` is the correct replacement guard for calendar RBAC | F2 | If a new `calendar` permission is preferred, needs matrix+frontend lockstep |
| A3 | Notice TTL index purges expired trashed items → trash is best-effort window | Pitfall 4 | Restore of a long-deleted notice may 404 if auto-purged |
| A4 | No new npm packages needed on either repo | Package audit | If a plan adds a dep, it must re-run the legitimacy gate |
| A5 | `profile-info.tsx` `!res.success` branch is unreachable because apiFetch throws | D-03 | The plan may choose try/catch instead; either way add the return |
| A6 | Leave "rejection" is a business validation, not a schema mismatch | F5/D-10 | If it turns out to be auth/lack-of-proof at create time, different fix |

## Open Questions

1. **Exact root cause of calendar vanish (F1)**
   - What we know: pipeline returns valid docs; dev server is IST; production container likely UTC; frontend query wiring correct.
   - What's unclear: precisely which env/edge fails, and whether the `subDays`/`addDays` juggling contributes.
   - Recommendation: a live reproduction step (create → refresh via `curl` against dev AND the Docker image) EARLY in the phase before backend edits. The plan should not hardcode a fix guess.

2. **Calendar RBAC gating mechanism (F2/D-16)**
   - What we know: no `calendar` resource in permission matrix; routes have zero authorization.
   - What's unclear: whether to use an in-controller role check vs a new matrix permission.
   - Recommendation: discuss-phase confirmation (`checkpoint:human-verify`) before committing to a matrix change, since it ripples to frontend `lib/permissions.ts`.

3. **Notice trash needs a backend listing endpoint? (F4/D-04)**
   - What we know: backend `getNotices` hard-filters `isDeleted:false`; no deleted-listing endpoint.
   - What's unclear: whether to add `?isDeleted=true` param to `getNotices` (cross-repo) or only show trash via a client-side approach.
   - Recommendation: add a backend query param (small, coordinated via D-21); TTL purge caveat documented.

4. **Where to mount the Bill Management nav entry (D-05)**
   - What we know: the management page exists under `reimbursement/management` and is RoleGuard-gated.
   - What's unclear: nav placement/visibility rule (finance/admin) and whether to move it under `(admin)`.
   - Recommendation: add nav entry gated on `can(r,"read","preReimbursement")`; keep existing page.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | frontend build | ✓ | (project pins node:24) | — |
| pnpm | frontend | ✓ | Corepack | — |
| saher-backend repo | calendar/leave/notice backend edits | ✓ (`../saher-backend`) | — | — |
| MongoDB | calendar/leave/notice live repro | depends on running backend | — | — |
| Docker image (backend, UTC) | reproduce calendar vanish | unknown | — | must spin up |
| ESLint (`pnpm lint`) | verification | ✓ | 9 flat config | — |
| `pnpm build` (typecheck) | verification | ✓ | Next 16 | — |
| vitest (`pnpm test`) | tests | ✓ | ^4.1.11 | — |
| TZ pinned in backend container | calendar boundary correctness | ✗ likely | — | add `ENV TZ=Asia/Kolkata` or normalize to UTC |

**Missing dependencies with no fallback:**
- A live reproduction environment for the calendar vanish (needs running MongoDB + backend Docker image). Must be established as a plan task.

**Missing dependencies with fallback:**
- TZ pinning: add `ENV TZ=Asia/Kolkata` to backend Dockerfile (or make boundary logic TZ-explicit in code) — decision drives the calendar fix.

## Validation Architecture

> `workflow.nyquist_validation` is **explicitly `false`** in `.planning/config.json`, so this section is skipped per instructions. Note for the planner: the repo DOES have a working vitest suite (428 tests from Phase 7, incl. `register-schema.test.ts`, `notice-hook.test.tsx`, `reimbursement-hook.test.tsx`, `date.test.ts`, `nav-list.test.tsx`) available for regression coverage on the fixed bugs even though Nyquist gating is off.

## Security Domain

> `security_enforcement` is absent from config → treated as **enabled**.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | existing cookie session (`apiFetch`, `proxy.ts`) — unchanged this phase |
| V3 Session Management | yes | existing single-flight refresh — unchanged |
| V4 Access Control | **yes (calendar)** | calendar routes currently missing `authorize()` (D-16) — the only RBAC gap in scope |
| V5 Input Validation | yes | zod schemas on both repos; leave `validateLeaveApplication` business rules |
| V6 Cryptography | no | no new crypto surface |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Any authenticated user CRUDs calendar events | Elevation of Privilege | add `authorize()`/role check to calendar routes (D-16) |
| Cross-user bill/leave data access | Information Disclosure | existing `authorize('...','preReimbursement'/'postReimbursement')` on bill routes; leave ownership check in `updateLeaveApplicationController` — verify leave update still enforces `leave.user === userId` after the D-11 fix |
| Notice permanent-delete abused | Tampering | existing `authorize('delete','notice')` guard retained |
| Leave update writes wrong field / breaks ownership | Tampering | D-11 backend fix must preserve the `leave.user.toString() !== userId` check (leave.controller.ts:177) |

## Sources

### Primary (HIGH confidence — code inspected directly this session)
- `../saher-backend/src/calendar/calendar.routes.ts` — no authorize, 6 routes
- `../saher-backend/src/calendar/calendar.schema.ts` — create type free-text, response enum
- `../saher-backend/src/calendar/calender.controller.ts` — create/delete/update/restore, cache + boundary
- `../saher-backend/src/libs/utils/calendar.ts` — getCalendarEvents/holiday/session aggregation
- `../saher-backend/src/database/calendar-event.model.ts` — CalendarEvent entity
- `../saher-backend/src/leave/leave.controller.ts` — updateLeaveApplicationController `leaveCode` bug
- `../saher-backend/src/leave/leave.schema.ts` + `src/libs/utils/leave.ts` — apply schema + validators
- `../saher-backend/src/notice/notice.controller.ts` + `src/database/notice.model.ts` — getNotices filter + TTL index
- `../saher-backend/src/reimbursement/reimbursement.routes.ts` + `bill/schema.ts` — bill endpoints + userBillUpdateSchema
- `../saher-backend/src/permission/role-permission.ts` — no `calendar` resource
- Frontend: register-schema, profile-info, notice-trash, notice-feed, use-notice, notice.api, finance-bill-table, balance-card, bill-table, use-reimbursement, management page, nav-list, calendar.tsx, event-details.tsx, add-event-dialog.tsx, use-calendar.ts, calendar.api.ts, apply-leave-dialog.tsx, leave.api.ts, lib/date.ts — all read in full

### Secondary (MEDIUM — verified against authoritative source)
- AGENTS.md / STACK.md / CONVENTIONS.md / ARCHITECTURE.md / STATE.md — phase-7 completion, IST date decision D-18, money-safety D-26/D-29, trash patterns

### Tertiary (LOW — flagged for validation)
- A1 (backend container timezone) — inferred from Dockerfile, not confirmed at runtime

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — zero-new-dependency phase; all libs confirmed in package.json
- Architecture: **MEDIUM** — bug-to-fix map solid; calendar current root cause env-dependent
- Pitfalls: **HIGH** — cross-repo coordination, RBAC matrix, TTL nuance all verified against source

**Research date:** 2026-08-31
**Valid until:** 2026-09-30 (stable stack, no fast-moving deps)
