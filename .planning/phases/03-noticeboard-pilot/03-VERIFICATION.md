---
phase: 03-noticeboard-pilot
verified: 2026-08-26T05:21:18Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog)"
    reason: "Soft delete fully delivered (gated button + confirm dialog + mutation + invalidation); restore/permanent delete blocked by missing backend trash-list endpoint (GET /notice filters deleted docs, so no UI path can enumerate a deleted notice's id). Service fns + restore/permanentRemove mutations shipped and tested, ready for UI wiring. Backend dependency tracked for the Phase 7 audit-and-fix pass."
    accepted_by: "user"
    accepted_at: "2026-08-26T05:15:00Z"
re_verification:
  previous_status: gaps_found
  previous_score: 2/4
  gaps_closed:
    - "Trash tabs and pagination footer live in components/shared/ and the Slice Contract is written down with noticeboard as the living example — §9 rewritten to the per-resource 'use client' layout.tsx gating pattern matching the CR-01-fixed implementation (commit 811ece3)"
    - "Admins create and edit notices with the 7-day default expiry surfaced in the form — permission-gated Edit button added to NoticeDetail linking to /noticeboard/[id]/edit (commit 14ddfbb)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Create→feed round-trip as role 'user': open /noticeboard, click New Notice, verify 7-day default expiry date shown in form, submit, confirm redirect to feed and new card visible"
    expected: "Form shows IST-today+7 prefilled; after submit a success toast fires and the new notice appears as first card with Active badge"
    why_human: "End-to-end browser flow with live backend; form default rendering and redirect behavior not verifiable by grep"
  - test: "Edit round-trip expiry preservation (CR-02): create a notice with a chosen expiry, open /noticeboard/[id]/edit, save without changes, re-open detail"
    expected: "Expiry day shown before and after is identical (no one-day regression from UTC conversion); badges do not flip early"
    why_human: "IST boundary behavior across timezones was the exact bug class fixed in aac7700/b3ad8b6; fixer marked it requires-human-verification"
  - test: "Route guard matrix (CR-01): log in as role 'user' and visit /noticeboard/new and an edit URL; then as admin/intern visit /noticeboard/new"
    expected: "'user' passes both guards (notice:write/update); admin/intern are redirected to /forbidden"
    why_human: "RoleGuard client-side redirects under real auth cookies cannot be exercised statically"
  - test: "Soft delete flow: click Trash2 icon on a card, verify dialog shows the notice title, cancel leaves feed unchanged, confirm removes the card and fires toast"
    expected: "Dialog Cancel = no change; Delete = card disappears from active feed immediately (cache invalidation refetch)"
    why_human: "Radix dialog interaction and post-mutation cache refresh are runtime behaviors"
  - test: "Visual pass of /noticeboard and /noticeboard/[id]: grid columns at mobile/desktop widths, badge colors (green/yellow/red), IST-formatted dates, line-break preservation in detail"
    expected: "Layout matches existing shadcn conventions; dates render as e.g. '26 Aug 2026'"
    why_human: "Visual appearance and responsive layout"
---

# Phase 3: Noticeboard Pilot Verification Report

**Phase Goal:** The first complete module proves the Slice Contract end-to-end (factory, hooks, forms, trash pattern) on the smallest surface, producing the documented reference implementation every later module copies.
**Verified:** 2026-08-26T05:21:18Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

> **Process note (MVP mode):** ROADMAP declares `mode: mvp`, but the phase goal is not in User Story form (`gsd-sdk query user-story.validate` → `false`). Per protocol this is surfaced rather than silently ignored; verification proceeded goal-backward against the four roadmap Success Criteria, which are concrete and behavioral. Recommend `/gsd mvp-phase 3` if a User Story goal is wanted for future re-verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Staff browse active notices as a paginated feed and open details with expiry highlighted in IST time | ✓ VERIFIED | Regression re-checked post-closure: `notice-feed.tsx` PAGE_SIZE=10 grid + `PaginationFooter` import (line 9) + render (line 86) from `components/shared/`; `components/shared/pagination-footer.tsx` + `trash-tab-pattern.tsx` present; sidebar entry intact (`nav-list.tsx:68`); detail renders `formatIstDate`/`formatIstDateTime` + `NoticeExpiryBadge`; data flows from real `GET /api/notice` via apiFetch |
| 2 | Admins create and edit notices with the 7-day default expiry surfaced in the form | ✓ VERIFIED | **Gap 2 CLOSED** (commit 14ddfbb): `notice-detail.tsx:25` computes `canEdit = can(user?.role ?? "user", "update", "notice")`; lines 52-57 render a Pencil `Button` → `router.push(/noticeboard/${noticeId}/edit)` only when permitted. Target route exists (`app/(main)/noticeboard/[id]/edit/page.tsx`) behind its own `"use client"` layout gating `can(r,"update","notice")`. Create side unchanged and verified: `notice-form.tsx` defaults `dateToIstDateOnly(Date.now()+7d)` |
| 3 | Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog) | PASSED (override) | Override accepted (user decision): soft delete fully delivered; restore/permanent-delete service fns + hook mutations exist and are tested but have no UI because the backend lacks a trash-list endpoint — deferred to Phase 7 audit. Accepted by user at gap closure 2026-08-26 (commit fd34d15) |
| 4 | Trash tabs and pagination footer live in `components/shared/` and the Slice Contract is written down with noticeboard as the living example | ✓ VERIFIED | **Gap 1 CLOSED** (commit 811ece3): SLICE-CONTRACT.md §9 rewritten — `**See:**` now lists the four live routes under `app/(main)/noticeboard/`; step 3 states authoring routes sit with staff routes "NOT under `(admin)`"; step 4 documents the per-module `"use client"` `layout.tsx` gate on `can(r, "write"/"update", "<resource>")` with an explicit CR-01 warning against `(admin)` inheritance. Doc verified against code: both layouts are exactly that pattern (RoleGuard + can(), explanatory comments). Grep for stale `(admin)/noticeboard` references across doc + source: 0 hits |

**Score:** 4/4 truths verified (1 via accepted override)

**Note on "Admins" wording:** unchanged from initial verification — the permission matrix grants notice:write/update/delete only to role `"user"` (accurate mirror of the backend role-permission file); the frontend correctly gates on resource permission rather than role title.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `services/notice.api.ts` | 6 endpoint fns + zod schemas | ✓ VERIFIED | Unchanged since initial pass; regression clean |
| `hooks/use-notice.ts` | query + mutations w/ invalidation | ✓ VERIFIED | Shared `invalidateNotices()`; restore/permanentRemove mutations ready for Phase 7 UI wiring |
| `features/noticeboard/notice-expiry-badge.tsx` | badge + helper | ✓ VERIFIED | Unchanged |
| `tests/notice-{api,expiry,hook}.test.*` | MSW/unit coverage | ✓ VERIFIED | Re-run by verifier this session: 22/22 pass (4 files incl. pagination-footer) |
| `features/noticeboard/{notice-feed,notice-card,notice-detail}.tsx` | staff read UI | ✓ VERIFIED | notice-detail gained gated Edit affordance (gap 2 closure) — substantive, wired, real data flowing |
| `features/noticeboard/notice-form.tsx` | shared create/edit form | ✓ VERIFIED | CR-02 fix intact |
| `features/noticeboard/notice-edit.tsx` | edit cache resolver | ✓ VERIFIED | Now reachable via detail Edit button |
| `app/(main)/noticeboard/**` (5 pages + 2 layouts) | routes | ✓ VERIFIED | All files confirmed present; layouts are `"use client"` RoleGuard gates on `notice:write` / `notice:update` — matches §9 exactly |
| `components/shared/pagination-footer.tsx` | promoted footer | ✓ VERIFIED | Present; bridge re-export intact; wired in feed (lines 9, 86) |
| `components/shared/trash-tab-pattern.tsx` | reusable wrapper | ✓ VERIFIED | Present; used by notice-trash |
| `.planning/codebase/SLICE-CONTRACT.md` | module recipe | ✓ VERIFIED | §9 rewritten to implemented pattern (commit 811ece3); doc↔code cross-check passes; safe for Phase 4 mail compose to copy |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| features/noticeboard/notice-detail.tsx | app/(main)/noticeboard/[id]/edit/page.tsx | Edit button `router.push` gated on `can(...,"update","notice")` | ✓ WIRED | **NEW (gap 2)** — notice-detail.tsx:53; route + layout confirmed present |
| hooks/use-notice.ts | services/notice.api.ts | imports all 6 fns | ✓ WIRED | Unchanged |
| features/noticeboard/notice-feed.tsx | components/shared/pagination-footer | import + render | ✓ WIRED | lines 9, 86 (regression) |
| features/noticeboard/notice-card.tsx | notice-expiry-badge | NoticeExpiryBadge | ✓ WIRED | Unchanged |
| app/(main)/noticeboard/page.tsx | notice-feed / notice-trash / tabs | renders | ✓ WIRED | Unchanged |
| features/noticeboard/notice-form.tsx | lib/date.ts | dateInputToIso + dateToIstDateOnly | ✓ WIRED | Unchanged |
| features/noticeboard/notice-edit.tsx | hooks/use-notice.ts | cache resolution | ✓ WIRED | Unchanged |
| components/sidebar/nav-list.tsx | /noticeboard | Bell entry in userRoutes | ✓ WIRED | line 68 (regression) |
| app/(main)/noticeboard/new/layout.tsx + [id]/edit/layout.tsx | lib/permissions can() | `"use client"` RoleGuard allow fn | ✓ WIRED | Matches §9 step 4 — doc teaches what code does |
| hooks/use-notice.ts restore/permanentRemove | any UI consumer | mutation calls | ⚠️ DEFERRED (override) | Zero callers outside tests — backend trash-list endpoint dependency; accepted override, Phase 7 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| notice-feed.tsx | `notices.data` | `getNotices()` → apiFetch GET /api/notice → `res.data` | Yes | ✓ FLOWING |
| notice-detail.tsx / notice-edit.tsx | list find by id | same cached `["notices","active"]` entry | Yes | ✓ FLOWING |
| notice-form.tsx | `defaultExpiry` | computed at mount via `dateToIstDateOnly` | Yes (IST-correct) | ✓ FLOWING |
| notice-trash.tsx | n/a | intentional placeholder | N/A (override: backend gap, Phase 7) | ✓ INTENTIONAL |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Notice data-layer tests (verifier-run, not narrated) | `pnpm vitest run tests/notice-* tests/pagination-footer.test.tsx` | 22/22 passed, 4 files, 7.82s | ✓ PASS |
| Stale `(admin)/noticeboard` references | grep across SLICE-CONTRACT.md + features/ + app/ | 0 hits | ✓ PASS |
| Stale pagination-footer imports | grep `@/components/pagination-footer` excl. bridge (initial run) | 0 hits, no regressions since | ✓ PASS |
| Debt markers in gap-closure files | grep TBD/FIXME/XXX/PLACEHOLDER in SLICE-CONTRACT.md + notice-detail.tsx | 0 hits | ✓ PASS |
| Working tree integrity | `git status --porcelain` vs HEAD | Only unrelated STATE.md/docker-compose changes; all phase code committed | ✓ PASS |
| Lint + build | orchestrator-run: `pnpm lint` 0 errors, `pnpm build` green | matches verifier's static checks | ✓ PASS |

### Probe Execution

No probes declared in plans and none found under `scripts/` (frontend app, no conventional probe path). SKIPPED — nothing to execute.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| NOTC-01 | 03-01, 03-02 | Staff browse active notices (feed + detail, expiry highlighted, IST-aware) | ✓ SATISFIED | Feed/detail/badge/IST utilities all wired and tested |
| NOTC-02 | 03-03, 03-04 | Admins create/edit notices (7-day default expiry surfaced in form) | ✓ SATISFIED | Create complete; edit now reachable via gated detail Edit button → guarded route |
| NOTC-03 | 03-03, 03-04 | Soft-delete/restore + permanent delete with mandatory confirm dialog | ⚠️ SATISFIED (override) | Soft delete + dialog done; restore/permanent delete blocked by backend trash-list endpoint — accepted override, Phase 7 audit |

Orphaned requirements: none — REQUIREMENTS.md maps exactly NOTC-01..03 to Phase 3 and all plans claim them.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| features/noticeboard/* + .planning/codebase/SLICE-CONTRACT.md | — | No TODO/FIXME/console.log/stub markers in any phase-modified file (re-scanned post-closure) | ℹ️ Clean | — |
| notice-trash.tsx | — | Intentional placeholder (documented in SUMMARY Known Stubs + SLICE-CONTRACT §6 + override) | ℹ️ Info | Accepted structural placeholder |
| notice-detail.tsx / notice-feed.tsx | 25 / 32 | Permissive `?? "user"` role default during useMe load (review IN-03) | ⚠️ Warning | Buttons flash for unauthorized roles then vanish; cosmetic |

Debt-marker gate: no TBD/FIXME/XXX markers in phase files — pass.
Previous blocker (SLICE-CONTRACT §9 teaching dead route pattern) — RESOLVED by commit 811ece3.

## Human Verification Required

See `human_verification` frontmatter — 5 items carried forward unchanged from initial verification (per instruction), covering: create round-trip with 7-day default, edit round-trip expiry preservation (CR-02), CR-01 role-guard matrix (now including the newly reachable Edit button path), soft-delete dialog flow, and visual/responsive pass. Items 2 and 3 were explicitly flagged "requires human verification" by the review-fix run and remain unverified programmatically.

## Gaps Summary

All three gaps from the initial verification are resolved:

1. **Slice Contract §9 (CLOSED — commit 811ece3).** Rewritten to the actual implemented pattern: authoring routes at `app/(main)/<module>/new|[id]/edit` with dedicated `"use client"` layout.tsx gating on `can(r, action, resource)`. Verified doc↔code bidirectionally: every claim in §9 steps 3-4 is observable in the two layout files, and zero stale `(admin)/noticeboard` references remain anywhere. The recipe Phase 4 copies next is now correct.
2. **Edit affordance (CLOSED — commit 14ddfbb).** `NoticeDetail` renders an Edit button gated on `can(role, "update", "notice")`, pushing to `/noticeboard/[id]/edit`. The full edit path is now: feed → detail → Edit → update-gated layout → prefilled form. Wiring confirmed end-to-end.
3. **Restore/permanent-delete UI (ACCEPTED OVERRIDE — commit fd34d15).** User decision: backend lacks a trash-list endpoint so no UI path can exist; service + mutation layer is shipped and tested, formalized in frontmatter `overrides:`, deferred to the Phase 7 audit-and-fix pass.

No regressions found: truths 1 and 4 re-checked (shared components, feed wiring, nav entry, routes all intact), phase tests re-run by the verifier (22/22), lint/build green per orchestrator.

**Status is `human_needed`:** every automated must-have now verifies (4/4, one via override), but 5 runtime/browser behaviors — including the two review-flagged IST-boundary and role-guard checks — can only be confirmed by a human against the live backend. Automated checks passed; awaiting human verification.

---

_Verified: 2026-08-26T05:21:18Z_
_Verifier: the agent (gsd-verifier)_
