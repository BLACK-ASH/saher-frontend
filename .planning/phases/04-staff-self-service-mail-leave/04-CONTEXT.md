# Phase 4: Staff Self-Service — Mail & Leave - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff handle daily personal workflows in-app — internal mail (inbox, outbox, compose, reply) and the full leave lifecycle (apply with balances visible, track with status badges, edit pending, manager/admin review queue, leave type management). Both modules already have partial implementations; this phase audits-and-fixes existing code to align with project patterns (zod schemas, normalizeList, PaginationFooter) and fills gaps (reply, user-search picker extraction, proof upload, filtering). No route restructuring — existing tabbed mail layout and split staff/admin leave pages stay as-is.

</domain>

<decisions>
## Implementation Decisions

### Mail — Scope & Structure
- **D-01:** Audit-fix + gap-fill scope — no rebuild. Fix code quality (zod schemas, typo in outbox-colunm.tsx filename, extract duplicated picker), add reply, add sanitized view, stay within existing tabbed layout.
- **D-02:** Mail detail stays as a Dialog overlay (keep clicking a row opens dialog). No dedicated /mail/[id] page route.
- **D-03:** Sidebar: Mail and Leave appear as separate top-level items in the staff nav section, alongside Attendance, Calendar, etc.

### Mail — Features
- **D-04:** Reply = switch to Compose tab with To field pre-filled with the original sender, body prefilled with quoted original using `> ` prefix on each line (text quote convention).
- **D-05:** Extract the To/CC/BCC user-search + chips into a shared `components/user-search-picker.tsx` component. Mail compose uses it 3x; Phase 5 advance bills reuse it.
- **D-06:** Add zod validation to mail compose: `to` required (min 1 recipient), `subject` required (min 1 char), `body` required (min 1 char).
- **D-07:** Outbox column shows first recipient name + "and N others" for multi-recipient mails (compact display).
- **D-08:** Mail body in detail dialog should be sanitized (render with line-break preservation, escape HTML). Currently renders raw.

### Leave — Scope & Structure
- **D-09:** Audit-fix + gap-fill scope — no route restructuring. Existing `/leave` (staff) and `/leave-management` (admin) routes stay as-is.
- **D-10:** Staff can update their own pending leave application via an edit dialog (pre-filled with current values). Reuse the apply dialog pattern with edit mode.

### Leave — Features
- **D-11:** Apply dialog shows balance cards at the top — staff sees remaining days for each leave type before submitting.
- **D-12:** Proof document upload reuses the existing `components/image-upload` component → uploads to `/api/upload/image` → stores returned file ID in the `proof` string field.
- **D-13:** Admin review queue gets status filter buttons (All / Pending / Approved / Rejected) above the table. Simple button group, not a dropdown.
- **D-14:** Leave overlap errors surface as inline error message below the date fields in the apply/edit dialog. Form stays open, user adjusts dates.
- **D-15:** Add PaginationFooter to both staff leave applications table and admin all-applications table.

### User-Search Picker (Shared Component)
- **D-16:** Controlled component with props: `value` (array of selected users), `onChange` (callback), `label` (string), `placeholder` (optional).
- **D-17:** Configurable multi/single select via `multiple` prop (default `true`). Mail uses multi; Phase 5 advance bill uses single.
- **D-18:** Debounced search (300ms) — as user types, dropdown appears with matching results. Clicking a user adds them as a chip. Empty input hides dropdown.
- **D-19:** Component lives at `components/user-search-picker.tsx` — used by mail compose and Phase 5 advance bills.

### Code Quality Fixes
- **D-20:** Fix `features/mail/outbox-colunm.tsx` filename → `outbox-column.tsx`.
- **D-21:** Add zod response schemas to `services/mail.api.ts` — currently has hand-written types only. Mirror backend shapes.
- **D-22:** Remove unused `import { isActive } from "@tiptap/core"` in `services/leave.api.ts`.

### the agent's Discretion
- Exact file names for feature components within `features/mail/` and `features/leave/`
- Whether mail and leave share a route group or stay separate in `app/(main)/`
- Balance card layout inside the apply dialog (grid, inline, compact)
- Filter button styling (which shadcn variants)
- Test scope beyond minimum contract verification
- How the edit dialog differentiates create vs edit mode (prop or separate components)
- Whether the shared user-search-picker goes in `components/` or `components/ui/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contract
- `../saher-backend/src/mail/mail.routes.ts` — All mail endpoints (inbox, outbox, send)
- `../saher-backend/src/leave/leave.routes.ts` — All leave endpoints (types, applications, balance, review)
- `../saher-backend/src/upload/upload.routes.ts` — Upload endpoint used for proof documents
- `.planning/codebase/INTEGRATIONS.md` §Mail & Leave — Endpoint map, RBAC guards, envelope shapes

### Prior decisions
- `.planning/phases/02-shared-infrastructure-session-reliability/02-CONTEXT.md` — D-09..D-12: IST date conventions; D-13..D-15: RBAC `can()` helper; D-16: normalizeList factory; D-20: PaginationFooter; D-21: shared list-hook factory
- `.planning/phases/03-noticeboard-pilot/03-CONTEXT.md` — D-12..D-15: Trash tabs pattern (reuse for status filter buttons); D-16..D-17: Slice Contract documentation pattern

### Requirements
- `.planning/REQUIREMENTS.md` §Mail — MAIL-01, MAIL-02, MAIL-03, MAIL-04 verbatim requirements
- `.planning/REQUIREMENTS.md` §Leave — LEAV-01, LEAV-02, LEAV-03, LEAV-04, LEAV-05, LEAV-06 verbatim requirements
- `.planning/ROADMAP.md` §Phase 4 — Success criteria 1–5 that planning must satisfy exactly

### Codebase patterns
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, state management, error handling patterns
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new code, layering rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `services/mail.api.ts` — 3 endpoints (inbox, outbox, send) + user search. Missing zod schemas (D-21).
- `hooks/use-mail.ts` — Query hooks for inbox/sent/user-search + send mutation.
- `app/(main)/mail/page.tsx` — 486-line page with Inbox/Sent/Compose tabs, detail dialog, compose form. The To/CC/BCC picker is inline 3x (extract per D-05).
- `features/mail/data-table.tsx` — TanStack Table with filter/sort/pagination/refresh. Already uses PaginationFooter.
- `services/leave.api.ts` — All leave endpoints (types, applications, balance, review). Has zod schemas for create/review. Missing response zod schemas.
- `hooks/use-leave.ts` — Complete hook with all queries/mutations. Uses `all` prop for admin vs staff views.
- `features/leave/page.tsx` — Staff leave page: balance cards + applications table + apply dialog.
- `features/leave/admin-page.tsx` — Admin page: leave types table + all-applications table with approve/reject/view.
- `features/leave/apply-leave-dailog.tsx` — Apply dialog with type/date/reason/proof fields. Proof is text input (change to upload per D-12).
- `features/leave/leave-table.tsx` — Staff applications table with status badges + detail dialog.
- `components/image-upload.tsx` — Dropzone + crop upload widget, uploads to `/api/upload/image`, returns file ID.

### Established Patterns
- Layering `features → hooks → services → lib` — new code follows this
- Zod-inferred DTOs in `services/*.api.ts` — mail needs schemas added (D-21)
- Query keys: `[resource, scope?, ...params]` — mail uses `["inbox"]`, `["sent"]`, leave uses `["leave", "types"]`, `["leave", "applications", ...]`
- Mutations invalidate query keys on success
- Forms: react-hook-form + zodResolver + Controller + FieldLabel/FieldError
- Admin pages under `app/(main)/(admin)/` or `app/(main)/(manager)/` inheriting RoleGuard

### Integration Points
- `app/(main)/mail/page.tsx` — existing mail route (tabbed layout stays)
- `app/(main)/(manager)/leave/page.tsx` — staff leave route
- `app/(main)/(manager)/leave-management/page.tsx` — admin leave route
- `components/sidebar/nav-list.tsx` — navigation entries (add mail + leave per D-03)
- `lib/date.ts` — IST date utilities for all date rendering
- `lib/permissions.ts` — `can()` RBAC helper for admin gating

</code_context>

<specifics>
## Specific Ideas

- Backend addNotice controller pattern from Phase 3 applies here: display actual stored dates, don't re-process.
- Owner directive: verify against actual backend routes + authorize() guards — docs can drift.
- Owner directive: modules delivered complete, one module per effort — no intra-module versioning.
- The user-search picker (D-16..D-19) is a key Phase 4→5 dependency — it must be designed for reuse by advance bills in Phase 5.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Staff Self-Service — Mail & Leave*
*Context gathered: 2026-08-26*
