---
phase: 01-quality-gates-test-infrastructure
plan: 03
subsystem: infra
tags: [github-actions, ci, self-hosted-runner, pnpm, corepack, quality-gates, dev-branch]

# Dependency graph
requires:
  - phase: 01-quality-gates-test-infrastructure (plan 01)
    provides: typecheck/test npm scripts, green lint baseline, local dev branch synced with origin/dev
  - phase: 01-quality-gates-test-infrastructure (plan 02)
    provides: two reference test suites so `pnpm test` is a meaningful gate (4 passing tests)
provides:
  - Deploy Dev workflow repointed to the dev line end-to-end: trigger `- dev`, reset `origin/dev` (D-02)
  - Blocking `Quality gates` step before docker compose: corepack enable → pnpm --version → pnpm install --frozen-lockfile → lint && typecheck && test (D-03); any failure aborts deployment
  - Locally rehearsed, exit-0 proof of the exact CI command chain on dev
affects: [every later phase's push-to-dev deploy path, Phase 2+ module work relying on gated Test environment]

# Tech tracking
tech-stack:
  added: []
  patterns: [gates as a separate workflow step ahead of compose so shell-default non-zero exits abort the job, frozen-lockfile installs on the runner to pin what was tested locally, Corepack pnpm bootstrap mirroring Dockerfile:5]

key-files:
  created: []
  modified:
    - .github/workflows/dev-deploy.yml

key-decisions:
  - "Split the single 'Dev Deploy app' run block into reset-only + 'Quality gates' + 'Docker Compose rebuild' steps — required so gates physically execute between reset and compose and can abort the job by default shell behavior"
  - "pnpm bootstrap on runner mirrors Dockerfile Corepack precedent exactly (corepack enable, then version visibility check) rather than assuming preinstalled pnpm"

requirements-completed: []  # FNDT-07 already marked Complete by plan 01-01; no new requirement IDs completed by this plan

# Metrics
duration: 4min
completed: 2026-08-24
---

# Phase 1 Plan 3: Dev-Retargeted Gated Deploy Workflow Summary

**Deploy Dev workflow now fires only on `dev` and blocks docker compose behind lint/typecheck/test quality gates — gate trio proven green locally on dev (4/4 tests), first gated deploy awaiting push approval at Task 3 checkpoint**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-24T14:25:24Z
- **Completed:** 2026-08-24T14:29:37Z (through Task 2; Task 3 checkpoint pending user approval — plan completion deferred until approved push succeeds)
- **Tasks:** 2 of 3 complete (Task 3 = blocking human checkpoint reached, not executed)
- **Files modified:** 1

## Accomplishments
- D-02 honored in the workflow file: trigger lists only `- dev` (`workflow_dispatch` retained), checkout resets to `origin/dev`, zero occurrences of `origin/main`
- D-03 implemented: new `Quality gates` step sits between the reset and compose; runs `corepack enable` → `pnpm --version` → `pnpm install --frozen-lockfile` → `pnpm lint && pnpm typecheck && pnpm test`; non-zero exit aborts the job before compose ever runs
- Success criterion 1 locally proven: full rehearsal chain `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test` exited 0 in one run — vitest reported **4 passed across 2 files, 0 skipped, 0 todo**
- Cleanup old images / Verify containers steps untouched

## Task Commits

1. **Task 1: Retarget workflow to dev + insert quality gates (D-02, D-03)** - `01553d9` (feat)
2. **Task 2: Local full-gate rehearsal** - verification-only, zero file changes → nothing to commit (chain exit-0 evidence above)

## Files Created/Modified
- `.github/workflows/dev-deploy.yml` - dev-only trigger + origin/dev reset; Quality gates step inserted ahead of Docker Compose rebuild step

## Decisions Made
- Split the former single "Dev Deploy app" run block into three steps (reset / Quality gates / Docker Compose rebuild): a separate step is the only way gates run after the reset but before compose AND abort the job via default shell semantics, as the plan requires
- Gate step bootstraps pnpm via `corepack enable` exactly as `Dockerfile:5` does, with `pnpm --version` as a visible sanity line — makes the known first-run risk (missing Corepack/pnpm on the self-hosted runner) fail loudly and diagnosably

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Verify command used `rg`, which is not installed in the execution shell**
- **Found during:** Task 1 verification
- **Issue:** The plan's automated verify chains `rg -n ...`; `rg` is not on PATH, so the verify could not run as written
- **Fix:** Ran grep-equivalent checks producing identical assertions: `branches:` block contains `- dev`; `origin/dev|frozen-lockfile|pnpm typecheck && pnpm test` all present; `grep -c 'origin/main'` = 0
- **Files modified:** none (verification tooling substitution only)
- **Verification:** all checks passed (see acceptance criteria below)
- **Committed in:** n/a

---

**Total deviations:** 1 auto-fixed (blocking, tooling-only).
**Impact on plan:** None on content — same assertions verified via grep.

### Acceptance criteria re-run (all PASS)
- `on.push.branches` lists only `- dev`; `workflow_dispatch` retained ✓
- Reset reads `git reset --hard origin/dev`; zero `origin/main` in file ✓
- `Quality gates` step between reset and compose; runs `pnpm install --frozen-lockfile` then `pnpm lint && pnpm typecheck && pnpm test` ✓
- Script names match package.json (`lint`, `typecheck`, `test`) ✓
- Cleanup/Verify unchanged ✓
- Rehearsal chain exits 0; vitest 4 passed / 0 skipped / 0 todo ✓

## Issues Encountered
None beyond the rg-not-installed substitution documented above.

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **BLOCKED ON HUMAN ACTION (Task 3 checkpoint):** `git push origin dev` requires explicit user approval; until pushed, GitHub still runs the old main-triggered workflow and the Test env is not yet gated
- After approval: executor pushes dev (never main), monitors the "Deploy Dev" Actions run through Quality gates → compose rebuild → healthy container; fix-forward on dev if the runner lacks Corepack/pnpm
- Local dev is 24 commits ahead of origin/dev (branch-sync merge + all Phase 1 work incl. `01553d9`)
- Nothing has been pushed during this plan; main remains untouched (`git log origin/main..main` still shows local-only commits)

---
*Phase: 01-quality-gates-test-infrastructure*
*Completed: 2026-08-24 (pending Task 3 checkpoint resolution)*

---
## Self-Check: PASSED

Key file exists on disk: `.github/workflows/dev-deploy.yml` ✓. Commit `01553d9` present in git log ✓. Plan-level verification items 1–3 verified (workflow dev-exclusive, gates precede compose verbatim, local rehearsal exit-0); item 4 (post-push Actions run green) is intrinsically pending the Task 3 human checkpoint and cannot be claimed yet.
