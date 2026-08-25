---
phase: 2
slug: shared-infrastructure-session-reliability
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (installed Phase 1) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --changed` |
| **Full suite command** | `pnpm test && pnpm typecheck && pnpm lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --changed`
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | FNDT-04 | T-2-01..03 | death dedupes toast+redirect; cancel→clear order | unit (vi.stubGlobal location) | `pnpm test lib/session.test.ts` | ❌ co-located w/ task | ⬜ pending |
| 02-01-T2 | 01 | 1 | AUTH-01 | T-2-03 | wrapper throws "Unauthorized" sentinel, no toast | existing suite regression | `pnpm test lib/api-wrapper.test.ts` | ✅ | ⬜ pending |
| 02-01-T3 | 01 | 1 | FNDT-04 | T-2-02/03 | cache onError filters sentinel strictly | suite + build | `pnpm test && pnpm build` | ✅ | ⬜ pending |
| 02-02-T1 | 02 | 1 | FNDT-02 | T-2-04 | day-boundary pairs; null→"--"; round-trips | unit | `pnpm test lib/date.test.ts` | ❌ co-located | ⬜ pending |
| 02-02-T2 | 02 | 1 | FNDT-02 | — | IST cell render independent of TZ (D-03 default) | render | `pnpm test features/attendance/attendance-status.test.tsx` | ❌ co-located | ⬜ pending |
| 02-02-T3 | 02 | 1 | FNDT-02 | — | calendar IST digits; input round-trip | gates + build | `pnpm test && pnpm build` | ✅ | ⬜ pending |
| 02-03-T1 | 03 | 1 | FNDT-06 | T-2-07 | truth-table pins no-inheritance quirks | unit | `pnpm test lib/permissions.test.ts` | ❌ co-located | ⬜ pending |
| 02-03-T2 | 03 | 1 | FNDT-06 | T-2-06 | manager-nav fix; can()-only gating | render + typecheck | `pnpm test components/sidebar/nav-list.test.tsx` | ❌ co-located | ⬜ pending |
| 02-04-T1 | 04 | 2 | D-07/D-08/D-21-fixes | T-2-10/11 | real keys; best-effort logout via session module | typecheck + suite | `pnpm typecheck && pnpm test` | ✅ | ⬜ pending |
| 02-04-T2 | 04 | 2 | AUTH-01 | T-2-09 | ?next= open-redirect guard chain | lint + render suite | `pnpm lint && pnpm test features/login` | ✅ | ⬜ pending |
| 02-04-T3 | 04 | 2 | AUTH-01 (D-19) | T-2-09/10 | single-flight refresh ×1; retry ×1; sentinel | msw integration | `pnpm test lib/api-wrapper.test.ts` | ✅ extends | ⬜ pending |
| 02-05-T1 | 05 | 2 | FNDT-03 | T-2-12 | meta variance absorbed; nullable data → [] | unit | `pnpm test lib/normalize-list.test.ts` | ❌ co-located | ⬜ pending |
| 02-05-T2 | 05 | 2 | FNDT-05 | T-2-12/13 | footer disabled on missing/NaN meta; boundaries | render | `pnpm test components/pagination-footer.test.tsx` | ❌ co-located | ⬜ pending |
| 02-05-T3 | 05 | 2 | FNDT-03/05/02 | — | screens on normalized shape + footer + IST dates | full gates | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | ✅ | ⬜ pending |
| 02-06-T1 | 06 | 3 | FNDT-05/02 | T-2-15 | TanStack pageCount normalized; footer wired | full gates | `pnpm test && pnpm build` | ✅ | ⬜ pending |
| 02-06-T2 | 06 | 3 | FNDT-03 (D-21) | T-2-15/16 | six hooks → one factory; prefix invalidation | full gates | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | ✅ | ⬜ pending |
| 02-06-T3 | 06 | 3 | FNDT-02 (D-18) | T-2-17 | time.ts deleted; zero stale imports | grep + build | repo grep + `pnpm build` | n/a (deletion) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test files for new lib/ modules — arrive CO-LOCATED with their modules per Phase 1 convention (research Validation Architecture: "not Wave 0 blockers"); each module task is tdd-flagged with behavior blocks
- [x] msw handlers for auth refresh/logout flows — extend the existing `lib/api-wrapper.test.ts` (Plan 02-04 Task 3); no new harness needed

*Existing infrastructure (vitest + msw + QueryClient helper from Phase 1) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live `/auth/me` role strings probe (D-15) | AUTH-01 | Requires running backend on :4000 | Start backend, curl `GET /api/auth/me` for each role; assert matrix keys match observed strings |
| Calendar surfaces render IST identically across timezones (D-12) | FNDT-02 | Browser timezone emulation beyond jsdom | Set OS/browser TZ to non-IST, open calendar page, compare rendered dates |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are blocking-human checkpoints (02-03-T3 probe only)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every auto task has one)
- [x] Wave 0 covers all MISSING references (none — co-location per Phase 1 convention)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (`pnpm test <file>` per task; full chain ~30s per wave merge)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-complete (pending execution sampling)
