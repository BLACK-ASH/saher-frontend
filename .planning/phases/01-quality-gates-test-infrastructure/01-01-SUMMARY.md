---
phase: 01-quality-gates-test-infrastructure
plan: 01
subsystem: infra
tags: [vitest, testing-library, msw, jsdom, eslint, pnpm, quality-gates]

# Dependency graph
requires:
  - phase: none
    provides: existing Next.js 16 app with @/* tsconfig alias and flat ESLint config
provides:
  - local dev branch synced with planning docs (D-01 branch policy active)
  - green lint + typecheck baseline (`pnpm lint`, `pnpm typecheck`)
  - typecheck/test npm scripts (D-04)
  - installed vitest 4 toolchain behind human-approved legitimacy gate
  - vitest.config.ts mirroring @/* alias, jsdom env, report-only v8 coverage (D-05/D-09)
affects: [01-02 starter tests, 01-03 CI gates, all later module phases relying on test harness]

# Tech tracking
tech-stack:
  added: [vitest@^4.1.11, "@testing-library/react@^16.3.2", "@testing-library/dom@^10.4.1", "@testing-library/jest-dom@^7.0.1", jsdom@^30.0.1, msw@^2.15.0, "@vitejs/plugin-react@^6.1.0", "@vitest/coverage-v8@^4.1.11"]
  patterns: [flat-root vitest config like eslint.config.mjs, import.meta.dirname alias resolution, co-located *.test.ts(x) discovery via default glob]

key-files:
  created:
    - vitest.config.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - components/tiptap/menu-bar.tsx
    - components/tiptap/menu-bar-state.ts
    - lib/api-wrapper.ts

key-decisions:
  - "Lint baseline repaired by fixing all 42 errors in place (13 empty-Props types deleted, jsx keys added, Link swap, NaN-safe pagination guards) — config untouched so gate strictness is preserved"
  - "React Compiler rule hits on established SSR-safe/derived-sync patterns disabled inline with reasons, not by weakening global policy"
  - "MenuBar useEditorState hoisted unconditionally — fixed a genuine conditional-hook violation, selector now null-tolerant"

patterns-established:
  - "Quality gates: `pnpm lint && pnpm typecheck` must stay exit-0 on every future task"
  - "Test tooling is devDependencies-only; production bundle verified unaffected by pnpm build"

requirements-completed: [FNDT-01, FNDT-07]

# Metrics
duration: 25min
completed: 2026-08-24
---

# Phase 1 Plan 1: Quality Gates & Test Infrastructure Foundation Summary

**Green lint/typecheck gates plus a legitimacy-gated vitest 4 + jsdom harness whose config mirrors the `@/*` alias — on a fresh local `dev` branch with package hygiene debt cleared**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-24T13:38:27Z
- **Completed:** 2026-08-24T14:03:52Z
- **Tasks:** 4 (3 auto + 1 blocking-human checkpoint)
- **Files modified:** 42

## Accomplishments
- Local `dev` branch = `origin/dev` + all 13 unpushed main doc commits; nothing pushed anywhere (D-01)
- FNDT-07 hygiene complete: typecheck/test scripts added, react-hook-form moved to dependencies, jwt-decode removed, dead `styles/` SCSS deleted after re-verifying zero importers
- All eight test-toolchain packages installed as devDependencies only after explicit user approval at the blocking-human legitimacy gate; @vitest/coverage-v8 major-matched to vitest 4
- `pnpm exec vitest run --passWithNoTests` exits 0; scratch spec proved `@/lib/api-wrapper` resolves to the real module through the alias; `pnpm build` stays green
- Lint baseline went from 42 errors to zero without touching eslint.config.mjs rules

## Task Commits

Each task was committed atomically:

1. **Task 1: Sync dev branch with local main (D-01)** - `9a20f97` (merge) + `c05801c` (docs pre-commit of orchestrator state that was blocking checkout)
2. **Task 2: Package hygiene + gate scripts (FNDT-07, D-04)** - `90f7617` (feat)
3. **Task 3a: Package legitimacy gate** - checkpoint, user replied "approved" for all 8 packages exactly as proposed
4. **Task 3b: Install test toolchain + vitest config (FNDT-01, D-05, D-09)** - `546ccae` (feat)

**Plan metadata:** committed after SUMMARY (docs)

_Note: Task 2's lint-baseline repair rode its own feat commit._

## Files Created/Modified
- `vitest.config.ts` - jsdom environment, `@` alias via `import.meta.dirname`, v8 coverage report-only, no setup entries yet
- `package.json` - `typecheck` + `test` scripts; react-hook-form promoted to dependencies; jwt-decode removed; 8 new devDeps
- `pnpm-lock.yaml` - regenerated via pnpm install (never hand-edited); jwt-decode absent
- `styles/_variables.scss`, `styles/_keyframe-animations.scss` - deleted (zero importers, double-checked)
- 38 source files across `app/`, `components/`, `features/`, `hooks/`, `lib/` - minimal lint-error repairs (see Deviations)

## Decisions Made
- Fixed all 42 pre-existing lint errors individually instead of relaxing eslint config — FNDT-07 demands a green baseline against the existing strictness; gutting rules would have gamed the gate
- Empty `type Props = {}` declarations deleted outright (dead code) rather than retyped to `object`
- Pagination guards rewritten as `Number(x?.meta?.total) < page + 1` — preserves the original `undefined < n` → false semantics exactly
- React Compiler-era rule findings (`set-state-in-effect`, `immutability`, `refs`) disabled per-site with reason comments where the flagged pattern is deliberate (SSR-safe media-query init, derived-sync, vendored react-dropzone util) — global policy unchanged
- `useUnmount` ref assignment moved into an effect (proper fix, no disable needed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Orchestrator state files were dirty on main before Task 1's branch operations**
- **Found during:** Task 1
- **Issue:** `.planning/STATE.md` + `.planning/config.json` had uncommitted modifications; git refuses checkout to a ref where those tracked files don't exist (origin/dev has no `.planning/`)
- **Fix:** Committed them on main as `c05801c docs(state)` before creating dev
- **Files modified:** .planning/STATE.md, .planning/config.json
- **Verification:** branch switch + merge succeeded cleanly
- **Committed in:** c05801c

**2. [Rule 1 - Bug] MenuBar called useEditorState conditionally**
- **Found during:** Task 2 lint-baseline repair
- **Issue:** `components/tiptap/menu-bar.tsx` early-returned before calling `useEditorState` when editor was null — hook count changed between renders exactly when the tiptap editor initializes (null → instance), a real rules-of-hooks violation that can crash the editor UI
- **Fix:** Hoisted the hook call unconditionally; selector now returns null until `ctx.editor` exists and render guards on `!editor || !editorState`; `menuBarStateSelector` signature simplified to take `Editor` directly
- **Files modified:** components/tiptap/menu-bar.tsx, components/tiptap/menu-bar-state.ts
- **Verification:** pnpm lint + pnpm typecheck green; build succeeds
- **Committed in:** 90f7617

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug). The 42-error lint repair itself was planned work per Task 2's acceptance criteria ("if pre-existing baseline errors surface, fix them minimally"), not a deviation.
**Impact on plan:** Both fixes required to reach the plan's stated ground truth (green gates on a clean branch). No scope creep; eslint policy untouched.

## Issues Encountered
- Dev's 19 feature commits had never been run against the current eslint config — 42 errors surfaced (empty-object types, missing jsx keys, console statements, non-null-asserted optional chains, React Compiler rule findings). All resolved minimally in the Task 2 commit; warnings (52) intentionally left as out-of-scope debt.
- pnpm 11.22 still accepts the `allowBuilds` key in pnpm-workspace.yaml — no rename needed; install ran warning-free with msw present.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01-02 can wire `tests/setup.ts` into vitest.config.ts and write the starter tests (msw handlers, shared QueryClientProvider render helper) against a green baseline
- Plan 01-03 will add the CI gate steps consuming the new scripts; remember the only permitted push (dev, post-approval) happens there
- Nothing pushed to any remote during this plan; `main` frozen as required

---
*Phase: 01-quality-gates-test-infrastructure*
*Completed: 2026-08-24*
