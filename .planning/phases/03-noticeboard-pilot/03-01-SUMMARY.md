---
phase: 03-noticeboard-pilot
plan: 01
subsystem: data-layer
tags: [noticeboard, tanstack-query, msw, zod, tdd, vitest, react-query]

# Dependency graph
requires:
  - phase: 01-quality-gates-test-infrastructure
    provides: vitest + @testing-library/msw harness (tests/test-server.ts, tests/setup.ts, tests/render-with-providers.tsx)
  - phase: 02-shared-infrastructure-session-reliability
    provides: apiFetch envelope wrapper, IST date utilities (lib/date.ts), shadcn Badge status variants
provides:
  - services/notice.api.ts — 6 endpoint functions + zod schemas mirroring backend notice contract
  - hooks/use-notice.ts — useNotices hook (active list query, id-resolved detail query, 5 mutations with cache invalidation)
  - features/noticeboard/notice-expiry-badge.tsx — NoticeExpiryBadge + getExpiryStatus helper (active/expiring/expired, 3-day threshold)
affects: [03-02 noticeboard UI plans, 03-03 SLICE-CONTRACT documentation]

# Tech tracking
tech-stack:
  added: [] # none — all packages pre-installed
  patterns: [raw-array service responses without normalizeList for meta-less endpoints, shared invalidation helper across mutations, detail-from-list resolution when no single-resource endpoint exists]

key-files:
  created:
    - services/notice.api.ts
    - hooks/use-notice.ts
    - features/noticeboard/notice-expiry-badge.tsx
    - tests/notice-expiry.test.tsx
    - tests/notice-api.test.ts
    - tests/notice-hook.test.tsx
  modified: []

key-decisions:
  - "Expiry boundary semantics: expiry instant == now returns 'expired' (expiry <= now), matching the plan-specified implementation logic; the Task 1 bullet suggesting 'exactly today → active' was internally inconsistent and resolved toward the implementation spec"
  - "Detail query resolves a single notice by finding it in the full GET /notice list — backend has no GET /notice/:id endpoint (per RESEARCH resolved question)"
  - "One shared invalidateNotices() onSuccess helper for all 5 mutations instead of 5 inline copies"

patterns-established:
  - "Meta-less list endpoints return res.data raw array; normalizeList is only for envelopes carrying pagination meta"
  - "TDD RED/GREEN commit gates per plan type: tdd"

requirements-completed: [] # NOTC-01 intentionally left open — this plan delivers the data foundation; feed/detail UI lands in later plans of this phase

# Metrics
duration: 7 min
completed: 2026-08-26
---

# Phase 3 Plan 1: Notice Data Foundation Summary

**TDD-built notice data layer: 6-endpoint service mirroring the backend contract, useNotices hook with 5 cache-invalidating mutations, and expiry badge with 3-day-threshold status derivation — all proven by 13 MSW-backed tests.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-26T03:58:34Z
- **Completed:** 2026-08-26T04:05:13Z
- **Tasks:** 2 (RED + GREEN, TDD gates honored)
- **Files modified:** 6 created

## Accomplishments
- Service layer (`services/notice.api.ts`) covering POST/GET/PUT/DELETE/PATCH-restore/DELETE-permanent on `/api/notice`, with zod schemas mirroring the backend entity shape (`_id`, optional `isDeleted`/timestamps) and NO normalizeList on the meta-less GET
- `useNotices` hook exposing `{ notices, notice, addNotice, editNotice, removeNotice, restore, permanentRemove }` — every mutation invalidates `["notices"]`
- `getExpiryStatus` + `NoticeExpiryBadge`: >3 days → active/outline-success, ≤3 days → expiring/outline-warn, past expiry → expired/destructive
- TDD discipline held: failing-test commit (`d303416`) precedes implementation commit (`1d638e7`); all 13 new tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — failing tests for badge, services, hook** - `d303416` (test)
2. **Task 2: GREEN — implement service layer, hook, badge** - `1d638e7` (feat)

## Files Created/Modified
- `services/notice.api.ts` — 6 endpoint functions + `noticeSchema`/`createNoticeSchema` zod definitions
- `hooks/use-notice.ts` — TanStack Query wiring: active list, id-resolved detail, 5 mutations
- `features/noticeboard/notice-expiry-badge.tsx` — expiry status helper + badge component ("use client")
- `tests/notice-expiry.test.tsx` — 6 threshold/boundary cases with fake timers
- `tests/notice-api.test.ts` — 6 MSW tests asserting URL, method, body, and envelope unwrapping
- `tests/notice-hook.test.tsx` — hook integration test (list fetch + mutation shape)

## Decisions Made
- Boundary test written as same-instant-expiry → "expired": the plan's Task 1 bullet ("exactly today → active") contradicted its own `<behavior>` block and implementation snippet (`if (expiry <= now) return "expired"`). Tests were made consistent with the specified implementation.
- Detail query finds by id from the full list rather than calling a nonexistent endpoint.
- Shared `invalidateNotices` helper keeps the five `onSuccess` handlers to one line each.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan-internal inconsistency on the exact-today expiry case**
- **Found during:** Task 1 (writing RED tests)
- **Issue:** Action bullet claimed "expiry date exactly today → status 'active'", but the plan's own implementation logic (`expiry <= now → expired`) and `<behavior>` block imply the opposite
- **Fix:** Wrote the boundary test as same-instant → "expired", consistent with the mandated implementation; added a 4-days-out case to pin the other side of the 3-day window
- **Files modified:** tests/notice-expiry.test.tsx
- **Verification:** All 6 expiry tests pass against the implemented logic
- **Committed in:** d303416 / 1d638e7

---

**Total deviations:** 1 auto-fixed (1 bug/inconsistency)
**Impact on plan:** Cosmetic spec conflict resolved toward the plan's own code spec. No scope creep.

## Issues Encountered
- **Pre-existing `tests/session.test.ts` failures (2 of 7):** `performLogoutCleanup` never calls mocked `location.assign`. Fails identically without any of this plan's changes (last touched by fafb9c4). Out of scope — logged to `.planning/phases/03-noticeboard-pilot/deferred-items.md`.
- **Pre-existing `/register` prerender build failure:** anticipated explicitly by the plan's verification notes ("build may fail on pre-existing register issue"). TypeScript compilation passes cleanly. Logged to deferred-items.md.

## Verification Results
- `pnpm vitest run tests/notice-*.test.*` → 13/13 pass ✓
- Full suite: 340 passed, 2 failed (both pre-existing session.test.ts, unrelated) 
- `pnpm lint` → 0 errors (55 pre-existing warnings, unchanged)
- `pnpm build` → TypeScript check passes; fails only at the known pre-existing `/register` prerender step
- Acceptance greps: `normalizeList` count = 0 ✓ · `invalidateQueries` ≥ 1 ✓ · `"use client"` = 1 ✓ · required exports present ✓

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Ready for 03-02 (noticeboard feed/detail/forms UI) — service, hook, and badge are importable as-is
- NOTC-01 stays open until the feed/detail plans deliver their UI; requirement marking is left to the orchestrator's end-of-phase traceability pass
- Trash-tab work (NOTC-03) remains blocked on a backend endpoint to list deleted notices (documented in RESEARCH)

## Self-Check: PASSED

- All 6 key files exist on disk ✓
- Commit d303416 present in history ✓
- Commit 1d638e7 present in history ✓
- RED→GREEN gate order verified (test commit precedes feat commit) ✓

---
*Phase: 03-noticeboard-pilot*
*Completed: 2026-08-26*
