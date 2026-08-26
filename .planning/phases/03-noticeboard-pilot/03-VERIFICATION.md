---
phase: 03-noticeboard-pilot
verified: 2026-08-26T10:45:00Z
status: gaps_found
score: 2/4 must-haves verified
overrides_applied: 1
gaps:
  - truth: "Trash tabs and pagination footer live in components/shared/ and the Slice Contract is written down with noticeboard as the living example"
    status: partial
    reason: "SLICE-CONTRACT.md §9 Route Structure still documents the PRE-CR-01 pattern: it points at app/(main)/(admin)/noticeboard/new|edit and says authoring routes 'inherit RoleGuard from the (admin) layout'. Those paths no longer exist — commit b447cd1 moved both routes to app/(main)/noticeboard/ with per-route client layouts gated on can(r,'write'/'update','notice') because the (admin) user:write gate breaks authoring for every role. The document every later module copies currently teaches the exact bug CR-01 proved fatal; Phase 4 (mail compose routes) copies this recipe next."
    artifacts:
      - path: ".planning/codebase/SLICE-CONTRACT.md"
        issue: "§9 lines 122+127 reference deleted paths app/(main)/(admin)/noticeboard/new/page.tsx and [id]/edit/page.tsx and instruct inheriting the (admin) RoleGuard instead of per-resource notice:write/update gates"
    missing:
      - "Update SLICE-CONTRACT.md §9 to the actual implemented pattern: authoring routes at app/(main)/<module>/new and /[id]/edit with dedicated \"use client\" layout.tsx gating on can(r, action, resource)"
  - truth: "Admins create and edit notices with the 7-day default expiry surfaced in the form"
    status: partial
    reason: "Edit is fully implemented (route + NoticeEdit + prefilled form) but has ZERO UI affordance: neither NoticeCard nor NoticeDetail offers an Edit button/link, so /noticeboard/[id]/edit is reachable only by typing the URL. Review WR-02, deferred by the fix run. The edit capability cannot be exercised through the interface."
    artifacts:
      - path: "features/noticeboard/notice-card.tsx"
        issue: "no Edit affordance even for roles holding notice:update"
      - path: "features/noticeboard/notice-detail.tsx"
        issue: "no Edit affordance even for roles holding notice:update"
    missing:
      - "Conditionally rendered Edit button (can(role,'update','notice')) on NoticeDetail or card footer linking to /noticeboard/[id]/edit"
  - truth: "Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog)"
    status: override_accepted
    reason: "ACCEPTED OVERRIDE (user decision, gap closure 2026-08-26): restore/permanent-delete services and hook mutations exist and are tested, but no UI is built because the backend has no trash-list endpoint (GET /notice filters deleted docs) — there is no way to enumerate a deleted notice's id. Backend dependency: trash-list endpoint required before this slice can complete; tracked for the Phase 7 audit-and-fix pass."
    artifacts:
      - path: "hooks/use-notice.ts"
        issue: "restore and permanentRemove mutations have zero UI consumers"
      - path: "features/noticeboard/notice-trash.tsx"
        issue: "placeholder only — backend cannot list trashed notices"
    missing:
      - "Restore + permanent-delete UI (with its own destructive confirm dialog) once a backend trash-list endpoint exists, OR an accepted override recording the backend constraint"
deferred: []
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
**Verified:** 2026-08-26T10:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

> **Process note (MVP mode):** ROADMAP declares `mode: mvp`, but the phase goal is not in User Story form (`gsd-sdk query user-story.validate` → `false`). Per protocol this is surfaced rather than silently ignored; verification proceeded goal-backward against the four roadmap Success Criteria, which are concrete and behavioral. Recommend `/gsd mvp-phase 3` if a User Story goal is wanted for re-verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Staff browse active notices as a paginated feed and open details with expiry highlighted in IST time | ✓ VERIFIED | `notice-feed.tsx` PAGE_SIZE=10 grid + `PaginationFooter` from `components/shared/`; `notice-card.tsx` click→`router.push(/noticeboard/${_id})`; `notice-detail.tsx` resolves from cached list, `whitespace-pre-line` body, `formatIstDate`/`formatIstDateTime` + `NoticeExpiryBadge`; sidebar entry `nav-list.tsx:66-70` in userRoutes; data flows from real `GET /api/notice` via apiFetch (`res.data` raw array) |
| 2 | Admins create and edit notices with the 7-day default expiry surfaced in the form | ⚠️ PARTIAL | Create ✓: `notice-form.tsx:36-40` defaults `dateToIstDateOnly(Date.now()+7d)` in useState initializer; `dateInputToIso` on submit; toast+redirect; route `/noticeboard/new` gated `can(r,"write","notice")`. Edit ✓ implemented (`notice-edit.tsx` prefills from cache; gate `can(r,"update","notice")`) but **zero UI affordance** to reach it (WR-02) |
| 3 | Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog) | ⚠️ PARTIAL | Soft delete ✓: gated Trash2 button on cards → shadcn Dialog with title + Cancel/destructive → `removeNotice.mutate` → invalidation. Restore ✗/permanent delete ✗: service fns + `restore`/`permanentRemove` mutations exist and are tested, but **no component calls them** — backend has no trash-list endpoint so no UI path can exist yet |
| 4 | Trash tabs and pagination footer live in `components/shared/` and the Slice Contract is written down with noticeboard as the living example | ✓ VERIFIED | `components/shared/pagination-footer.tsx` (real impl) + one-line re-export bridge at old path, zero stale imports (grep clean incl. `(admin)/noticeboard`); `components/shared/trash-tab-pattern.tsx` used by `notice-trash.tsx`; `.planning/codebase/SLICE-CONTRACT.md` exists, 10 sections each with `**See:**` noticeboard file references — caveat: §9 drifted stale after the CR-01 fix (see Gaps) |

**Score:** 2/4 truths verified (2 partial)

**Note on "Admins" wording:** the permission matrix (`lib/permissions.ts:112-127`) grants notice:write/update/delete **only to role `"user"`** — confirmed during review as an accurate mirror of `../saher-backend/src/permission/role-permission.ts`. The frontend correctly gates on the resource permission rather than role title; the SC wording is loose but the capability exists for the authorized role.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `services/notice.api.ts` | 6 endpoint fns + zod schemas | ✓ VERIFIED | All 6 endpoints correct methods/URLs; no `normalizeList`; schemas exported |
| `hooks/use-notice.ts` | query + mutations w/ invalidation | ✓ VERIFIED | Shared `invalidateNotices()` on all 5 mutations; WR-01 fix applied (detail query removed, `{id}` param gone) |
| `features/noticeboard/notice-expiry-badge.tsx` | badge + helper | ✓ VERIFIED | `getExpiryStatus` thresholds (>3/≤3/expired) match D-03; variants exist |
| `tests/notice-{api,expiry,hook}.test.*` | MSW/unit coverage | ✓ VERIFIED | Exist; 22/22 pass in verification run |
| `features/noticeboard/{notice-feed,notice-card,notice-detail}.tsx` | staff read UI | ✓ VERIFIED | Substantive, wired, real data flowing |
| `features/noticeboard/notice-form.tsx` | shared create/edit form | ✓ VERIFIED | CR-02 fix present: `dateToIstDateOnly` both branches (lines 36-40); no `toISOString().split` remnants |
| `features/noticeboard/notice-edit.tsx` | edit cache resolver | ✓ VERIFIED | Resolves from shared `["notices","active"]` cache; loading/not-found states |
| `app/(main)/noticeboard/**` (5 pages + 2 layouts) | routes | ✓ VERIFIED | Thin shells; CR-01 fix confirmed — routes OUT of `(admin)`, own client layouts gating `notice:write`/`notice:update`; old `(admin)` paths deleted |
| `components/shared/pagination-footer.tsx` | promoted footer | ✓ VERIFIED | Real implementation moved; bridge re-export at old path |
| `components/shared/trash-tab-pattern.tsx` | reusable wrapper | ✓ VERIFIED | Used by notice-trash; children slot for future trash endpoints |
| `.planning/codebase/SLICE-CONTRACT.md` | module recipe | ⚠️ PARTIAL | Exists, 10 sections, living-example references — §9 stale post-CR-01 (gap) |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| hooks/use-notice.ts | services/notice.api.ts | imports all 6 fns | ✓ WIRED | lines 2-10 |
| features/noticeboard/notice-feed.tsx | hooks/use-notice.ts | useNotices() | ✓ WIRED | line 4, 30 |
| features/noticeboard/notice-feed.tsx | components/shared/pagination-footer | import | ✓ WIRED | line 9 |
| features/noticeboard/notice-card.tsx | notice-expiry-badge | NoticeExpiryBadge | ✓ WIRED | lines 3, 46 |
| app/(main)/noticeboard/page.tsx | notice-feed / notice-trash / tabs | renders | ✓ WIRED | lines 1-3, 13, 16 |
| features/noticeboard/notice-form.tsx | lib/date.ts | dateInputToIso + dateToIstDateOnly | ✓ WIRED | lines 19, 38-39, 56 |
| features/noticeboard/notice-edit.tsx | hooks/use-notice.ts | cache resolution | ✓ WIRED | line 10, 16 |
| components/sidebar/nav-list.tsx | /noticeboard | Bell entry in userRoutes | ✓ WIRED | lines 66-70 |
| hooks/use-notice.ts restore/permanentRemove | any UI consumer | mutation calls | ✗ NOT_WIRED | zero callers outside tests (backend-constrained) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| notice-feed.tsx | `notices.data` | `getNotices()` → apiFetch GET /api/notice → `res.data` | Yes (live endpoint array) | ✓ FLOWING |
| notice-detail.tsx / notice-edit.tsx | list find by id | same cached `["notices","active"]` entry | Yes — one fetch, no duplicate traffic (WR-01 fixed) | ✓ FLOWING |
| notice-form.tsx | `defaultExpiry` | computed at mount via `dateToIstDateOnly` | Yes (IST-correct) | ✓ FLOWING |
| notice-trash.tsx | n/a | intentional placeholder | N/A (documented backend gap) | ✓ INTENTIONAL |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Notice data-layer tests | `pnpm vitest run tests/notice-* tests/pagination-footer.test.tsx` | 22/22 passed (4 files) | ✓ PASS |
| Stale pagination-footer imports | grep `from.*@/components/pagination-footer` excl. bridge | 0 hits | ✓ PASS |
| Stale (admin) noticeboard routes | grep `(admin)/noticeboard` in source | 0 hits | ✓ PASS |
| UTC conversion remnants (CR-02) | grep `toISOString().split` in features/noticeboard | 0 hits | ✓ PASS |
| Full suite baseline | orchestrator-run: vitest 340 passed / 2 failed | matches known pre-existing session.test.ts baseline | ✓ PASS |
| Build | orchestrator-run: `pnpm build` green incl. /register | all 28 routes prerender | ✓ PASS |

### Probe Execution

No probes declared in plans and none found under `scripts/` (frontend app, no conventional probe path). SKIPPED — nothing to execute.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| NOTC-01 | 03-01, 03-02 | Staff browse active notices (feed + detail, expiry highlighted, IST-aware) | ✓ SATISFIED | Feed/detail/badge/IST utilities all wired and tested |
| NOTC-02 | 03-03 | Admins create/edit notices (7-day default expiry surfaced in form) | ⚠️ PARTIAL | Create complete; edit implemented but unreachable via UI (WR-02) |
| NOTC-03 | 03-03 | Soft-delete/restore + permanent delete with mandatory confirm dialog | ⚠️ PARTIAL | Soft delete + dialog done; restore/permanent delete have no UI path (backend gap) |

Orphaned requirements: none — REQUIREMENTS.md maps exactly NOTC-01..03 to Phase 3 and all three plans claim them.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| .planning/codebase/SLICE-CONTRACT.md | 122, 127 | Docs reference deleted `(admin)/noticeboard` paths and teach the (admin)-layout gate that CR-01 proved breaks authoring | 🛑 Blocker (for the doc-as-contract goal) | Phase 4 copies this recipe next — would reintroduce CR-01 |
| features/noticeboard/* | — | No TODO/FIXME/console.log/stub markers in any phase-modified file | ℹ️ Clean | — |
| notice-trash.tsx | — | Intentional placeholder (documented in SUMMARY Known Stubs + SLICE-CONTRACT §6) | ℹ️ Info | Accepted structural placeholder |
| notice-feed.tsx:32 | 32 | Permissive `?? "user"` role default during useMe load (review IN-03) | ⚠️ Warning | Buttons flash for unauthorized roles then vanish |

Debt-marker gate: no TBD/FIXME/XXX markers in phase files — pass.

## Human Verification Required

See `human_verification` frontmatter — 5 items covering: create round-trip with 7-day default, edit round-trip expiry preservation (CR-02), CR-01 role-guard matrix, soft-delete dialog flow, and visual/responsive pass. Items 2 and 3 were explicitly flagged "requires human verification" by the review-fix run and remain unverified programmatically.

## Gaps Summary

The phase substantially achieves its goal: the noticeboard slice is complete end-to-end at the code level — service layer mirroring the backend contract, TanStack Query hook, staff feed/detail with IST-expiry highlighting, create/edit forms with the 7-day IST default, confirmed soft delete, Active/Trash tabs, PaginationFooter + TrashTabPattern promoted to `components/shared/`, and a 10-section Slice Contract. Both critical review findings are genuinely fixed in code (CR-01: routes relocated with per-resource layouts; CR-02: `dateToIstDateOnly` everywhere, no UTC remnants). All 22 phase-specific tests pass; lint/build gates green per orchestrator.

Three gaps keep this from `passed`:

1. **Slice Contract teaches a dead route pattern (actionable now).** §9 still documents `(admin)/noticeboard/new|[id]/edit` inheriting the `(admin)` RoleGuard — paths deleted by the CR-01 fix committed *after* the doc. Since the phase's whole point is "the documented reference implementation every later module copies", and Phase 4 builds mail compose routes from this recipe next, this drift directly undermines the meta-goal. Small doc fix.
2. **No Edit affordance (WR-02, actionable).** Editing works but is URL-only; no card/detail button for roles holding `notice:update`.
3. **Restore/permanent delete have no UI path (externally constrained).** Service + hook mutations exist and are tested but nothing can call them until the backend ships a trash-list endpoint — outside this repo's control. This looks intentional/documented; suggest either accepting via an override or filing the backend dependency explicitly:

```yaml
overrides:
  - must_have: "Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog)"
    reason: "Soft delete fully delivered; restore/permanent delete blocked by missing backend trash-list endpoint (documented in RESEARCH/SUMMARY); service+hook layer shipped and tested ready for UI wiring"
    accepted_by: "<developer>"
    accepted_at: "<ISO timestamp>"
```

Status is `gaps_found` rather than `human_needed` because gaps 1–2 are concrete, in-repo, and cheap; human verification items above apply regardless.

---

_Verified: 2026-08-26T10:45:00Z_
_Verifier: the agent (gsd-verifier)_
