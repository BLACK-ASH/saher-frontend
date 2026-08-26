# Phase 5: Money & Approval — Reimbursement & Payroll - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The org's full money pipeline runs in-app — bill submit→handle→settle lifecycle with advances, recycle bin, search, audit trail, plus admin payroll browsing/installments/generation. Completely greenfield frontend (no existing code), built against verified backend contracts. Money mutations are structurally protected against double-submits with no optimistic updates — server state always reflects truth.

</domain>

<decisions>
## Implementation Decisions

### Reimbursement — Navigation & Structure
- **D-01:** Two sidebar entries: "My Bills" (staff) + "Bill Management" (finance/admin). Staff sees only My Bills; finance sees both. Clean separation via `can()` RBAC.
- **D-02:** Staff "My Bills" page: net balance card on top + own bills table below with status badges, edit/withdraw actions for pending bills.
- **D-03:** Finance "Bill Management" page: two tabs — "Handle Queue" (pending bills with approve/reject/hold, bulk select, search) and "Recycle Bin" (deleted bills, restore).
- **D-04:** Bill detail shown as dialog overlay (consistent with Phase 4 mail detail pattern). Keeps user in table context.
- **D-05:** Staff "My Bills" also has a second tab: Active | Deleted — staff can see and restore their own soft-deleted bills (matches Phase 3 trash pattern).

### Reimbursement — Bill Operations
- **D-06:** Staff create new bills via floating "New Bill" button → dialog with amount, description, date, receipt image upload (up to 10 via `components/image-upload`).
- **D-07:** Staff edit pending bills via row action buttons (Edit/Withdraw). Edit opens pre-filled dialog with amount, description, images only (date locked after creation — matches backend `userBillUpdateSchema`). Withdraw requires confirmation dialog.
- **D-08:** Status badges: colored badges consistent with Phase 3 expiry pattern — pending=yellow, accepted=green, rejected=red, on-hold=blue, settled=gray. Uses existing Badge component.
- **D-09:** Balance card shows single net amount (advance minus expenses) with small breakdown (total advance, total expenses, settled amount). Calls backend `/balance-enquiry` endpoint — server is source of truth.

### Reimbursement — Finance Handle Queue
- **D-10:** Individual bill handling: row action buttons (Approve/Reject/Hold) → dialog with required notes field (minimum length enforced). Notes field serves as implicit confirmation — no separate confirmation dialog for routine actions.
- **D-11:** Bulk handling: multi-select checkboxes on each row → floating action bar appears when 1+ selected with "Approve All" / "Reject All" buttons. Sequential calls against single-bill endpoint. Progress bar with count ("Processing 3/10...") shown during operation.
- **D-12:** Real-time search bar above handle queue table (debounced 300ms) filtering by description, amount, user name. Client-side filtering for small lists, server-side for paginated results.
- **D-13:** Export button above table triggers GET `/export/report` → downloads file via notification action pattern.
- **D-14:** Audit log shown within bill detail dialog — section showing who did what and when. No separate audit log page.

### Reimbursement — Advance Bills
- **D-15:** "Create Advance" button in Bill Management opens dialog using the user-search picker (from Phase 4) to select a user, then amount/description fields. Edit/Delete via row actions on advances in the queue.

### Reimbursement — Bill Detail & Timeline
- **D-16:** Bill detail dialog shows: receipt images as thumbnail grid with lightbox (full-size overlay on click), lifecycle timeline, and audit log section.
- **D-17:** Lifecycle timeline: vertical timeline with status nodes — Submitted → (Handled: Approved/Rejected/Hold) → Settled. Each node shows timestamp, actor name, and notes **wherever the backend records them** (Amended 2026-08-26: backend records no handler/actor/timestamp for the Handled step — Quirk 9 — so those sub-lines render only when source data exists; never fabricate). Uses colored status badges.
- **D-18:** Image upload in create/edit form reuses `components/image-upload` component (dropzone + crop, uploads to `/api/upload/image`). Proven in Phase 4 leave proof upload.

### Settlement Flow
- **D-19:** After bill is accepted, "Record Settlement" button appears in bill detail dialog. Opens small dialog with payment mode (Cash/UPI/Cheque/Other as radio buttons) and description field. Matches backend `handleSettleSchema`.
- **D-20:** Recording settlement automatically marks bill as "settled" — no separate approval step. One action completes the lifecycle.
- **D-21:** Settlement status shown as colored node in the bill timeline — "Settled via UPI" (green) or "Settlement Pending" (yellow).

### Payroll — Navigation & Layout
- **D-22:** Separate "Payroll" sidebar entry in admin section. Dedicated page, not a tab under Bill Management. Admin-only via `can()` check.
- **D-23:** Payroll page: paginated table of all records (employee, date, amount, status, mode) + "Run Now" button at top.
- **D-24:** "Run Now" triggers confirmation dialog → POST `/cron` → toast with result. Simple, explicit.
- **D-25:** Installment payment: "Record Payment" row action → dialog with payment mode, amount, description. Shows paid-vs-total progress bar.

### Double-Submit & Money Mutation Safety
- **D-26:** All money mutations (handle/settle/installment/bank-affecting) gate with disabled button + loading spinner when mutation is pending. Server validates anyway — frontend prevents accidental double-click.
- **D-27:** Bulk operations show progress bar with count ("Processing 3/10...") as each item is handled sequentially. Toast on completion with success/failure summary.
- **D-28:** Failed mutations: toast error with server message + dialog stays open so user can retry without re-entering data. Server state unchanged — safe to retry.
- **D-29:** No optimistic updates on any money mutation — server state always reflects truth after any action. Hook/mutation tests verify this.

### Research Resolutions (from Plan-Phase)
- **D-30:** REIM-11 requires a new backend endpoint: `PATCH /api/reimbursement/:billId/restore` with `authorize('write', 'preReimbursement')` guard. Backend change must happen before or during Phase 5.
- **D-31:** Backend search schema needs `status` field added to `searchBillQuerySchema` to support handle queue filtering (`GET /?status=pending&isDeleted=false`).
- **D-32:** User name resolution: Build `useUserMap()` hook that caches user list from search endpoint and maps IDs to names for bill/settlement tables.

### the agent's Discretion
- Exact file names for feature components within `features/reimbursement/` and `features/payroll/`
- Bill management page route structure under `app/(main)/`
- Whether staff and finance share a route group or stay separate
- Sidebar section placement (which group My Bills and Bill Management go under)
- Table column definitions and sorting defaults
- Test scope beyond minimum contract verification
- Whether the balance card uses a grid or inline layout
- Filter button styling (which shadcn variants)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contract
- `../saher-backend/src/reimbursement/reimbursement.routes.ts` — All bill endpoints (user CRUD, admin CRUD, settlement, search, audit log, balance enquiry, export)
- `../saher-backend/src/reimbursement/bill/schema.ts` — Bill Zod schemas: `userBillCreateSchema`, `userBillUpdateSchema`, `adminBillCreatSchema`, `adminBillUpdateSchema`
- `../saher-backend/src/reimbursement/settlement/schema.ts` — Settlement Zod schemas: `handleBillSchema`, `handleSettleSchema`, `createSettleSchema`
- `../saher-backend/src/payroll/payroll.routes.ts` — All payroll endpoints (list, by user, by ID, update, approve, cron)
- `../saher-backend/src/payroll/schema.ts` — Payroll Zod schemas: `createPayrollSchema`, `payrollResponseSchema`
- `../saher-backend/src/database/bill.model.ts` — Bill entity shape with `billStatus` enum
- `../saher-backend/src/database/settlement.model.ts` — Settlement entity shape with `settleStatus` and `modes` enums
- `../saher-backend/src/database/payroll.model.ts` — Payroll entity shape with `salaryStatus` and `salaryMode` enums
- `.planning/codebase/INTEGRATIONS.md` §Reimbursement & Payroll — Endpoint map, RBAC guards, envelope shapes

### Prior decisions
- `.planning/phases/02-shared-infrastructure-session-reliability/02-CONTEXT.md` — D-09..D-12: IST date conventions; D-13..D-15: RBAC `can()` helper; D-16: normalizeList factory; D-20: PaginationFooter; D-21: shared list-hook factory
- `.planning/phases/03-noticeboard-pilot/03-CONTEXT.md` — D-12..D-15: Trash tabs pattern (reuse for Active/Deleted tabs); D-16..D-17: Slice Contract documentation pattern
- `.planning/phases/04-staff-self-service-mail-leave/04-CONTEXT.md` — D-05/D-16..D-19: User-search picker for advance bills; D-12: Proof upload via components/image-upload

### Requirements
- `.planning/REQUIREMENTS.md` §Reimbursement — REIM-01 through REIM-12 verbatim requirements
- `.planning/REQUIREMENTS.md` §Payroll — PAYR-01 through PAYR-04 verbatim requirements
- `.planning/ROADMAP.md` §Phase 5 — Success criteria 1–5 that planning must satisfy exactly

### Codebase patterns
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, state management, error handling patterns
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new code, layering rules
- `.planning/codebase/SLICE-CONTRACT.md` — Step-by-step recipe for new modules (noticeboard reference implementation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/image-upload.tsx` — Dropzone + crop upload widget, uploads to `/api/upload/image`, returns file ID. Used for bill receipt images (D-18) and proven in Phase 4 leave proof upload.
- `components/user-search-picker.tsx` — Controlled multi/single select with debounced search. Used for advance bill creation (D-15) and built in Phase 4.
- `components/ui/badge.tsx` — shadcn Badge for bill status badges (D-08). Consistent with Phase 3 expiry badges.
- `components/ui/tabs.tsx` — shadcn Tabs for Handle Queue | Recycle Bin (D-03) and Active | Deleted (D-05).
- `components/ui/dialog.tsx` — shadcn Dialog for bill detail, create/edit, handle, settle, confirmation dialogs.
- `components/loading.tsx` — DefaultLoader for loading states.
- `components/no-data.tsx` — NoData for empty states.
- `lib/date.ts` — IST date utilities for all date rendering (D-09, D-17).
- `lib/permissions.ts` — `can()` RBAC helper for admin vs staff gating (D-01, D-22). Already has `preReimbursement`, `postReimbursement`, `payroll` permissions.
- `lib/api-wrapper.ts` — `apiFetch` for all HTTP requests.

### Established Patterns
- Layering `features → hooks → services → lib` — new reimbursement/payroll code follows this
- Zod-inferred DTOs in `services/*.api.ts` — mirror backend schemas exactly
- Query keys: `[resource, scope?, ...params]` — e.g., `["bills", "list"]`, `["payroll", "list"]`
- Mutations invalidate query keys on success
- Forms: react-hook-form + zodResolver + Controller + FieldLabel/FieldError
- Admin pages under `app/(main)/(admin)/` inheriting RoleGuard
- Trash tabs: Phase 3 pattern (Active | Deleted tabs) for staff bill recycle (D-05)

### Integration Points
- `app/(main)/reimbursement/` — new routes for My Bills (staff) and Bill Management (finance)
- `app/(main)/(admin)/payroll/` — new route for payroll admin page
- `components/sidebar/nav-list.tsx` — navigation entries for My Bills, Bill Management, Payroll
- `hooks/use-reimbursement.ts` — new data hook for bills, balance, settlements
- `hooks/use-payroll.ts` — new data hook for payroll records
- `services/reimbursement.api.ts` — new service module for all bill/settlement endpoints
- `services/payroll.api.ts` — new service module for payroll endpoints

</code_context>

<specifics>
## Specific Ideas

- Backend bill statuses: `['pending', 'reject', 'accept', 'on-hold']` — frontend badges map to these exactly.
- Backend settlement statuses: `['pending', 'settle', 'expired', 'on-hold']` — settlement timeline uses these.
- Backend settlement modes: `['cash', 'upi', 'cheque', '-']` — radio buttons map to these, `'-'` displayed as "Other".
- Backend payroll statuses: `['paid', 'unpaid', 'partially-paid', 'approved']` — payroll table badges use these.
- Backend payroll modes: `['cash', 'cheque', 'upi', '-']` — same pattern as settlement modes.
- User-search picker (Phase 4 D-16..D-19) is a key dependency for advance bill creation (D-15) — must be designed for reuse.
- Owner directive: modules delivered complete, one module per effort — no intra-module versioning.
- Owner directive: verify against actual backend routes + `authorize()` guards — docs can drift.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Money & Approval — Reimbursement & Payroll*
*Context gathered: 2026-08-26*
