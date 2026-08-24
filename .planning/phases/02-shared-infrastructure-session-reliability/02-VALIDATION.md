---
phase: 2
slug: shared-infrastructure-session-reliability
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| (filled by planner per plan) | | | FNDT-02…06, AUTH-01 | T-2-* / — | session death clears cache exactly once; refresh retries exactly once | unit/integration | `pnpm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test files for new lib/ modules (IST utils day-boundary cases, `normalizeList`, permissions matrix, session-death contract per D-19)
- [ ] msw handlers for auth refresh/logout flows (extend Phase 1 pattern in `lib/api-wrapper.test.ts`)

*Existing infrastructure (vitest + msw + QueryClient helper from Phase 1) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live `/auth/me` role strings probe (D-15) | AUTH-01 | Requires running backend on :4000 | Start backend, curl `GET /api/auth/me` for each role; assert matrix keys match observed strings |
| Calendar surfaces render IST identically across timezones (D-12) | FNDT-02 | Browser timezone emulation beyond jsdom | Set OS/browser TZ to non-IST, open calendar page, compare rendered dates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
