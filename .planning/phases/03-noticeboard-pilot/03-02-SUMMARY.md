---
phase: 03-noticeboard-pilot
plan: 02
subsystem: ui
tags: [noticeboard, react, client-side-pagination, ist-dates, sidebar, next-app-router]

# Dependency graph
requires:
  - phase: 03-noticeboard-pilot
    provides: services/notice.api.ts + hooks/use-notice.ts (useNotices) + NoticeExpiryBadge from Plan 1
  - phase: 02-shared-infrastructure-session-reliability
    provides: PaginationFooter component, lib/date.ts IST formatters, lib/permissions.ts can() helper
provides:
  - features/noticeboard/notice-feed.tsx — paginated card-grid feed (PAGE_SIZE=10) with role-gated New Notice button
  - features/noticeboard/notice-card.tsx — clickable notice card with excerpt, IST dates, expiry badge
  - features/noticeboard/notice-detail.tsx — full detail view with line-break preservation
  - app/(main)/noticeboard/page.tsx + app/(main)/noticeboard/[id]/page.tsx — thin server shells
  - Sidebar "Noticeboard" entry with Bell icon for all authenticated users
affects: [03-03+ admin form/trash plans, SLICE-CONTRACT documentation]

# Tech tracking
tech-stack:
  added: [] # none — all packages pre-installed
  patterns: [render-time page clamp for shrinking lists, thin server page shells composing client feature components, detail-from-list resolution]

key-files:
  created:
    - features/noticeboard/notice-card.tsx
    - features/noticeboard/notice-feed.tsx
    - features/noticeboard/notice-detail.tsx
    - app/(main)/noticeboard/page.tsx
    - app/(main)/noticeboard/[id]/page.tsx
  modified:
    - components/sidebar/nav-list.tsx

key-decisions:
  - "Page clamp runs during render (`if (page > totalPages && totalPages > 0) setPage(totalPages)`) — the React-sanctioned derived-state adjustment; covers data-shrink after deletes without effects"
  - "[id] page is an async server shell awaiting Promise params (Next.js 16 pattern), while sibling dynamic pages in the codebase use client useParams — chose the server-shell pattern per this plan's thin-shell mandate"
  - "NoticeCard puts onClick directly on the shadcn Card (matches program participants card pattern) instead of an extra wrapper element"

patterns-established:
  - "Thin server page shells (≤10 lines) composing \"use client\" feature components"
  - "Client-side pagination over meta-less arrays with PAGE_SIZE constant + PaginationFooter"

requirements-completed: [NOTC-01]

# Metrics
duration: 6 min
completed: 2026-08-26
---

# Phase 3 Plan 2: Noticeboard Feed & Detail Summary

**Staff-facing noticeboard: paginated 3-column card grid at /noticeboard with expiry badges, line-break-preserving detail view at /noticeboard/[id], and a Bell-icon sidebar entry for all authenticated users.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-26T04:07:17Z
- **Completed:** 2026-08-26T04:12:53Z
- **Tasks:** 2
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments
- NoticeFeed renders active notices as a responsive grid (1/2/3 columns) with client-side pagination (PAGE_SIZE=10) via the shared PaginationFooter; page auto-clamps when the list shrinks after deletes
- NoticeCard shows title, 150-char description excerpt (whitespace-pre-line), created date in IST, NoticeExpiryBadge, and expiry date; entire card click-navigates to detail
- NoticeDetail resolves the notice from the cached list (no backend single-fetch endpoint), preserves line breaks, shows created/expiry dates in IST with badge, plus a back button
- Both routes wired as thin server shells; sidebar gains "Noticeboard" (Bell icon) in userRoutes so every authenticated staff member sees it

## Task Commits

Each task was committed atomically:

1. **Task 1: Build NoticeCard component and NoticeFeed with client-side pagination** - `d8af8ff` (feat)
2. **Task 2: Build NoticeDetail component, wire routes, and add sidebar entry** - `10df049` (feat)

## Files Created/Modified
- `features/noticeboard/notice-card.tsx` — clickable notice card with excerpt, IST dates, expiry badge
- `features/noticeboard/notice-feed.tsx` — paginated card grid, role-gated New Notice button, loading/empty states
- `features/noticeboard/notice-detail.tsx` — full notice view with line-break preservation and back navigation
- `app/(main)/noticeboard/page.tsx` — thin shell rendering `<NoticeFeed />`
- `app/(main)/noticeboard/[id]/page.tsx` — thin shell (Next 16 async params) rendering `<NoticeDetail noticeId={id} />`
- `components/sidebar/nav-list.tsx` — added Bell import + Noticeboard entry in userRoutes

## Decisions Made
- Page clamp implemented as render-time derived-state adjustment rather than an effect — smallest correct fix for pagination after list shrink.
- Detail `[id]` route uses Next.js 16 async `params` in a server component; the feature component itself stays client-side.
- Card click handler placed on the Card element itself (existing codebase pattern from program participants) instead of a separate clickable wrapper div.
- NoData requires `title` + `description` props (component signature differs from plan's single-message sketch); passed both accordingly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `/register` prerender build failure reproduces identically (documented in 03-01 and deferred-items); TypeScript compilation passes cleanly (`tsc --noEmit` exit 0, Next compile ✓).
- Pre-existing `tests/session.test.ts` failures (2) reproduce identically without this plan's changes; out of scope, already logged to deferred-items.md by Plan 1.
- Browser-level navigation checks were not run live (no dev server/backend session); verified via lint, type-check, unit tests, and acceptance greps instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for the remaining phase plans (admin create/edit forms at /noticeboard/new + /[id]/edit, trash tabs) — the "New Notice" button already routes to /noticeboard/new, which those plans will create
- NOTC-01 delivered by this plan; requirement-file marking left to the orchestrator's end-of-phase traceability pass (per Plan 1 precedent)

## Self-Check: PASSED

- All 5 created key files exist on disk ✓
- Commit d8af8ff present in history ✓
- Commit 10df049 present in history ✓
- Acceptance greps: `grep -c "noticeboard" components/sidebar/nav-list.tsx` = 1 ✓ · both page shells ≤15 lines ✓ · named exports present ✓
- `pnpm lint` exit 0 ✓ · `tsc --noEmit` exit 0 ✓ · notice test suite 13/13 ✓ · full suite 340 passed / 2 pre-existing failures ✓

---
*Phase: 03-noticeboard-pilot*
*Completed: 2026-08-26*
