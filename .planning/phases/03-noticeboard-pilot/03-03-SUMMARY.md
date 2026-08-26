---
phase: 03-noticeboard-pilot
plan: 03
subsystem: ui
tags: [noticeboard, react-hook-form, zod, shadcn-dialog, tabs, soft-delete, shared-components, documentation]

# Dependency graph
requires:
  - phase: 03-noticeboard-pilot
    provides: services/notice.api.ts + hooks/use-notice.ts (Plan 1), NoticeFeed/NoticeCard/detail routes (Plan 2)
  - phase: 02-shared-infrastructure-session-reliability
    provides: lib/date.ts IST converters, lib/permissions.ts can() helper, PaginationFooter, RoleGuard
provides:
  - features/noticeboard/notice-form.tsx — shared create/edit NoticeForm (mode-based, zodResolver, dateInputToIso)
  - app/(main)/(admin)/noticeboard/new/page.tsx + [id]/edit/page.tsx — admin routes under RoleGuard layout
  - Active/Trash Tabs on the feed page with confirmed soft delete on cards
  - components/shared/pagination-footer.tsx — promoted component + re-export bridge at old path
  - components/shared/trash-tab-pattern.tsx — reusable trash tab wrapper with NoData fallback
  - .planning/codebase/SLICE-CONTRACT.md — 10-section module recipe referencing noticeboard files
affects: [04-staff-self-service-mail-leave and later modules following SLICE-CONTRACT]

# Tech tracking
tech-stack:
  added: [] # none — all packages pre-installed
  patterns: [shared form component over mode prop, client-side pagination via promoted PaginationFooter, TrashTabPattern wrapper for endpoint-less trash tabs, client-component layouts to keep callback props serializable]

key-files:
  created:
    - features/noticeboard/notice-form.tsx
    - features/noticeboard/notice-edit.tsx
    - features/noticeboard/notice-trash.tsx
    - app/(main)/(admin)/noticeboard/new/page.tsx
    - "app/(main)/(admin)/noticeboard/[id]/edit/page.tsx"
    - components/shared/pagination-footer.tsx
    - components/shared/trash-tab-pattern.tsx
    - .planning/codebase/SLICE-CONTRACT.md
  modified:
    - features/noticeboard/notice-feed.tsx
    - features/noticeboard/notice-card.tsx
    - app/(main)/noticeboard/page.tsx
    - components/pagination-footer.tsx
    - "app/(main)/(admin)/layout.tsx"
    - "app/(main)/(manager)/layout.tsx"
    - tests/pagination-footer.test.tsx
    - components/data-table.tsx
    - features/mail/data-table.tsx
    - features/attendance/attendance-correction-requests.tsx
    - features/attendance/attendance-table.tsx
    - features/attendance-correction/corrections/data-table.tsx
    - features/dashboard/attendance-grid/attendance-dashboard.tsx
    - features/dashboard/range-attendance-table.tsx
    - features/dashboard/today-attendance-table.tsx
    - features/users/data-table.tsx

key-decisions:
  - "Edit route uses a thin async server shell + NoticeEdit client feature component (Plan 02 detail-route precedent) so the page stays ≤20 lines while still handling cache lookup/loading/not-found"
  - "(admin) and (manager) layouts marked \"use client\" — the allow(role) callback cannot cross the server→client serialization boundary during prerender; this also fixes the long-standing /register build failure"

patterns-established:
  - "Shared <X>Form component driven by a mode prop for create/edit pairs"
  - "TrashTabPattern from components/shared/ wraps any module's trash tab until its backend lists trashed items"

requirements-completed: [NOTC-02, NOTC-03]

# Metrics
duration: 15 min
completed: 2026-08-26
---

# Phase 3 Plan 3: Admin CRUD, Shared Patterns & Slice Contract Summary

**Admin notice lifecycle (create/edit forms with 7-day default expiry, confirmed soft delete, Active/Trash tabs), PaginationFooter + TrashTabPattern promoted to components/shared/, and the 10-section Slice Contract recipe — plus a prerender fix that unblocked static builds of every guarded route.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-26T04:14:47Z
- **Completed:** 2026-08-26T04:29:47Z
- **Tasks:** 4 (+1 blocking deviation fix)
- **Files modified:** 24 (8 created, 16 modified)

## Accomplishments
- `NoticeForm` handles both modes: 7-day expiry default on create (D-07), stored-date pre-fill on edit, `dateInputToIso` conversion, toast + redirect to `/noticeboard`, never trusting the backend's old-doc PUT response
- Feed page now has Active/Trash tabs (D-12); active cards carry a permission-gated delete button (`can(role, "delete", "notice")`) opening a shadcn confirmation dialog; trash tab renders the documented backend-gap placeholder via `TrashTabPattern`
- `PaginationFooter` lives at `components/shared/pagination-footer.tsx` with a one-line re-export bridge at the old path; all 11 consumers (10 tables + notice feed) updated; zero stale imports
- `.planning/codebase/SLICE-CONTRACT.md` documents all 10 recipe layers referencing real noticeboard files as living examples (D-16/D-17)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build shared NoticeForm component and admin create/edit routes** - `25d262a` (feat)
2. **Task 2: Add TrashTab pattern, soft delete, and permanent delete confirmation** - `77924a3` (feat)
3. **Task 3: Promote PaginationFooter to components/shared/ and create TrashTabPattern** - `d4b9b0a` (refactor)
4. **Task 4: Write SLICE-CONTRACT.md** - `1358b08` (docs)
5. **Deviation fix: client layouts for serializable allow() callbacks** - `acd1fa9` (fix)

## Files Created/Modified

**Created**
- `features/noticeboard/notice-form.tsx` — shared create/edit form (react-hook-form + zod + Controller)
- `features/noticeboard/notice-edit.tsx` — client wrapper resolving the notice from cache for edit mode
- `features/noticeboard/notice-trash.tsx` — trash placeholder composing TrashTabPattern
- `app/(main)/(admin)/noticeboard/new/page.tsx` — create route (thin server shell + Suspense)
- `app/(main)/(admin)/noticeboard/[id]/edit/page.tsx` — edit route (thin async server shell)
- `components/shared/pagination-footer.tsx` — promoted pagination component
- `components/shared/trash-tab-pattern.tsx` — reusable trash tab wrapper with NoData fallback
- `.planning/codebase/SLICE-CONTRACT.md` — module recipe document

**Modified (highlights)**
- `app/(main)/noticeboard/page.tsx` — Tabs (Active/Trash) wrapper
- `features/noticeboard/notice-feed.tsx` — deleteTarget state, removeNotice wiring, confirmation dialog
- `features/noticeboard/notice-card.tsx` — optional onDelete ghost button with stopPropagation
- `components/pagination-footer.tsx` — now a one-line re-export bridge
- `app/(main)/(admin)/layout.tsx`, `app/(main)/(manager)/layout.tsx` — `"use client"` for prerender-safe callback props
- 9 table/feed consumers + test file — import path updated to shared PaginationFooter

## Decisions Made
- Edit page split into thin async shell + `NoticeEdit` client component to satisfy both the ≤20-line shell criterion and in-page hooks/loading/not-found requirements; matches Plan 02's `[id]` route pattern.
- Permission check for delete runs once per feed (`canDelete`) rather than per card; card stays presentational.
- Layouts fixed at the root (client component) instead of per-route `force-dynamic` escape hatches — smallest diff that fixes every guarded route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Edit page could not satisfy ≤20-line shell and inline hooks simultaneously**
- **Found during:** Task 1
- **Issue:** The plan required the edit page itself to be `"use client"` with useNotices, loading and not-found branches — impossible within the ≤20-line thin-shell acceptance criterion (first attempt was 49 lines)
- **Fix:** Extracted the client logic into `features/noticeboard/notice-edit.tsx`; the page is a 10-line async server shell awaiting Promise params, matching the sibling `[id]` detail route from Plan 02
- **Files modified:** `app/(main)/(admin)/noticeboard/[id]/edit/page.tsx`, `features/noticeboard/notice-edit.tsx`
- **Verification:** Both pages ≤20 lines; tsc --noEmit clean
- **Committed in:** 25d262a

**2. [Rule 3 - Blocking] Soft-delete UI spans files outside the plan's two-file task list**
- **Found during:** Task 2
- **Issue:** Delete button belongs on each card footer and the dialog needs mutation state where cards render — but the plan's file list only contained `notice-trash.tsx` and the feed page
- **Fix:** Added the onDelete prop/dialog to `features/noticeboard/notice-feed.tsx` and `features/noticeboard/notice-card.tsx`; feed page hosts only the Tabs wrapper
- **Files modified:** notice-feed.tsx, notice-card.tsx, `app/(main)/noticeboard/page.tsx`, notice-trash.tsx
- **Verification:** lint exit 0; acceptance greps (Tabs ≥3, Dialog ≥1) pass
- **Committed in:** 77924a3

**3. [Rule 1 - Bug] Prerender crash: function props across server→client boundary**
- **Found during:** Plan-level verification (`pnpm build`)
- **Issue:** `/noticeboard/new` failed static generation — `(admin)`/`(manager)` layouts passed an `allow()` callback from Server Components into the client RoleGuard, which Next cannot serialize ("Functions cannot be passed directly to Client Components"). Same root cause as the known pre-existing `/register` failure
- **Fix:** Marked both group layouts `"use client"` so the callback stays client-side; all 28 pages now prerender successfully, including `/register`
- **Files modified:** `app/(main)/(admin)/layout.tsx`, `app/(main)/(manager)/layout.tsx`
- **Verification:** `pnpm build` exits 0 with full static/dynamic route table
- **Committed in:** acd1fa9

---

**Total deviations:** 3 auto-fixed (2 missing-from-file-list structural, 1 bug)
**Impact on plan:** All fixes were required for the tasks to meet their own acceptance criteria or build. No scope creep.

## Issues Encountered
- Pre-existing `tests/session.test.ts` failures (2 of 342) reproduce identically without this plan's changes; already logged to deferred-items.md by Plan 01.

## Known Stubs
- `features/noticeboard/notice-trash.tsx` — intentional placeholder: backend has no endpoint listing deleted notices, so the trash tab shows a NoData message via TrashTabPattern. Wire real trash data when the backend ships a trashed-list endpoint (documented in SLICE-CONTRACT §6).

## User Setup Required

None - no external service configuration required.

## Verification Results
- `pnpm lint --quiet` → exit 0 ✓
- `pnpm test -- --run` → 340 passed / 2 pre-existing session failures (unchanged baseline) ✓
- `pnpm build` → compiles, type-checks, and prerenders all 28 routes ✓ (register failure resolved as a side effect)
- Stale-import grep `from.*@/components/pagination-footer` outside the bridge → 0 hits ✓
- Acceptance greps: Tabs ≥3 ✓ · Dialog ≥1 ✓ · SLICE-CONTRACT 10 sections each with `**See:**` file references ✓

## Next Phase Readiness
- Noticeboard pilot complete end-to-end; NOTC-02/NOTC-03 delivered
- Phase 4+ modules copy `.planning/codebase/SLICE-CONTRACT.md`; shared PaginationFooter and TrashTabPattern are importable from `components/shared/`
- Backend gaps carried forward: no trash-list endpoint, no authorize() middleware on notice routes (frontend-only RBAC), +1 day expiresAt quirk compensated in form defaults

---
*Phase: 03-noticeboard-pilot*
*Completed: 2026-08-26*
