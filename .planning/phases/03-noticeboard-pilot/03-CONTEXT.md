# Phase 3: Noticeboard Pilot - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

First complete module proving the Slice Contract end-to-end on the smallest surface — notice CRUD (create/read/update) + soft delete/restore + permanent delete + paginated feed. This module becomes the documented reference implementation every later module copies. Backend routes gated behind `underDevelopment` middleware — live verification against OpenAPI at `/docs` required before finalizing schemas.

</domain>

<decisions>
## Implementation Decisions

### Notice Feed & Detail View
- **D-01:** Active notices display as a card grid — each card shows title, description excerpt, created date, and expiry status badge. Responsive layout using existing Card component patterns.
- **D-02:** Notice detail view is a dedicated page at `/noticeboard/[id]` — shows full title, description (plain text with line breaks preserved), created date, author info, and expiry date.
- **D-03:** Expiry status badge: green (active, >3 days), yellow (expiring soon, ≤3 days), red (expired). Consistent with status badge patterns elsewhere in the app.
- **D-04:** Backend stores `description` as a plain string — no rich text. Admin form uses textarea; detail view renders with line-break preservation.

### Admin Create/Edit Form
- **D-05:** Create and edit forms live on dedicated pages: `/noticeboard/new` and `/noticeboard/[id]/edit`. Clean layout with plenty of space for the textarea.
- **D-06:** Form fields: title (text input), description (textarea, plain text), expiresAt (date picker). Backend schema: `title: string (required)`, `description: string (required)`, `expiresAt: Date (optional, defaults to 7 days)`.
- **D-07:** Expiry date picker pre-filled with 7 days from today — matches backend default. User can adjust or leave as-is.
- **D-08:** Shared `NoticeForm` component handles both create and edit modes — less code, consistent UX.
- **D-09:** Form uses react-hook-form + zod validation with inline field errors below each input — consistent with login/register forms.
- **D-10:** After successful save, redirect to noticeboard feed showing the new/updated notice.
- **D-11:** Backend addNotice controller adds 1 day to the provided expiresAt date (line 17: `setDate(getDate() + 1)`). Frontend should account for this when displaying/pre-filling.

### Trash Tabs Pattern
- **D-12:** Two tabs at top of noticeboard: "Active" and "Trash" — clicking switches the list view. This becomes the reusable trash UX template for all later modules.
- **D-13:** Trash view shows the same card grid as active notices — consistent visual pattern, just with different row actions.
- **D-14:** Row actions in trash: "Restore" button and "Permanent Delete" button on each card.
- **D-15:** Permanent delete requires explicit confirmation dialog — shows notice title, "Are you sure?" message, Cancel/Confirm buttons. Standard shadcn Dialog pattern.

### Slice Contract Documentation
- **D-16:** Full step-by-step recipe document at `.planning/codebase/SLICE-CONTRACT.md` — covers all layers (services, hooks, features, forms, trash, pagination, RBAC gating, IST dates).
- **D-17:** Document references noticeboard files as living examples (e.g., "See services/notice.api.ts for schema pattern") rather than including inline code snippets — stays in sync with the actual implementation.

### Backend Contract (verified)
- **D-18:** Notice entity shape: `{ title: string, description: string, expiresAt: Date, isDeleted: boolean }`. Endpoints: `POST /notice`, `GET /notice`, `PUT /notice/:id`, `DELETE /notice/:id` (soft), `PATCH /notice/:id/restore`, `DELETE /notice/:id/permanent`. All gated behind `underDevelopment` middleware.
- **D-19:** GET /notice returns only active notices (`isDeleted: false`, `expiresAt > now`), sorted by `createdAt` descending. No pagination in current backend — full list returned. Frontend should implement client-side pagination via the shared PaginationFooter.
- **D-20:** Backend uses `notice.schema.ts` with Zod validation — frontend schemas should mirror these shapes exactly.

### the agent's Discretion
- Exact file names for feature components within `features/noticeboard/`
- Card component variant (shadow, border, etc.) — match existing app style
- Expiry badge color的具体 shades — use tailwind status colors
- Route layout structure under `app/(main)/`
- Whether noticeboard page goes under admin route group or main route group (backend requires admin for create/edit/delete, but staff can view)
- Navigation entry placement in sidebar
- Test scope beyond minimum contract verification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contract
- `../saher-backend/src/notice/notice.routes.ts` — All 6 endpoints with `underDevelopment` middleware guard
- `../saher-backend/src/notice/notice.schema.ts` — Zod schemas: `createNoticeSchema`, `updateNoticeSchema`, `getNoticeSchema`
- `../saher-backend/src/notice/notice.controller.ts` — Business logic: expiry default, soft delete, restore, permanent delete
- `../saher-backend/src/database/notice.model.ts` — Mongoose entity shape with TTL index on `expiresAt`

### Prior decisions
- `.planning/phases/02-shared-infrastructure-session-reliability/02-CONTEXT.md` — D-09/D-10/D-11/D-12: IST date conventions; D-13/D-14/D-15: RBAC `can()` helper; D-16: `normalizeList` factory; D-20: PaginationFooter; D-21: shared list-hook factory
- `.planning/phases/01-quality-gates-test-infrastructure/01-CONTEXT.md` — D-05/D-06/D-07: test harness rules (msw at apiFetch boundary, shared QueryClient helper, co-located tests)
- `.planning/STATE.md` §Blockers/Concerns — Phase 3 entry: backend `underDevelopment` middleware flag

### Requirements
- `.planning/REQUIREMENTS.md` §Noticeboard — NOTC-01, NOTC-02, NOTC-03 verbatim requirements
- `.planning/ROADMAP.md` §Phase 3 — Success criteria 1–4 that planning must satisfy exactly

### Codebase patterns
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, state management, error handling patterns
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new code, layering rules
- `.planning/codebase/ARCHITECTURE.md` — System overview, component responsibilities, data flow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/card.tsx` — shadcn Card component for notice cards
- `components/ui/tabs.tsx` — shadcn Tabs for Active/Trash toggle (D-12)
- `components/ui/dialog.tsx` — shadcn Dialog for permanent delete confirmation (D-15)
- `components/ui/badge.tsx` — shadcn Badge for expiry status (D-03)
- `components/loading.tsx` — DefaultLoader for loading states
- `components/no-data.tsx` — NoData for empty states
- `lib/date.ts` — IST date utilities for expiry display (D-03, D-04)
- `lib/permissions.ts` — `can()` RBAC helper for admin gating (D-14)
- `lib/api-wrapper.ts` — `apiFetch` for all HTTP requests
- `hooks/use-me.ts` — Current user query for role checks

### Established Patterns
- Layering `features → hooks → services → lib` — new noticeboard code follows this
- Zod-inferred DTOs in `services/*.api.ts` — mirror backend schemas exactly
- Query keys: `[resource, scope?, ...params]` — e.g., `["notices", "list"]`
- Mutations invalidate `["notices"]` on success
- Forms: react-hook-form + zodResolver + Controller + FieldLabel/FieldError
- Admin pages under `app/(main)/(admin)/` inheriting RoleGuard

### Integration Points
- `app/(main)/noticeboard/page.tsx` — new route for noticeboard feed
- `app/(main)/noticeboard/[id]/page.tsx` — new route for notice detail
- `app/(main)/(admin)/noticeboard/` — admin routes for create/edit
- `components/sidebar/nav-list.tsx` — navigation entry for noticeboard
- `hooks/use-notice.ts` — new data hook (or extend shared list-hook factory from D-21)
- `services/notice.api.ts` — new service module

</code_context>

<specifics>
## Specific Ideas

- Backend addNotice controller adds 1 day to expiresAt (line 17 of notice.controller.ts) — frontend should display the actual stored date, not re-add the day.
- GET /notice returns full list (no pagination params) — frontend implements client-side pagination.
- Owner directive: modules delivered complete, one module per effort — no intra-module versioning.
- Owner directive: verify against actual backend routes + authorize() guards — docs can drift.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Noticeboard Pilot*
*Context gathered: 2026-08-26*
