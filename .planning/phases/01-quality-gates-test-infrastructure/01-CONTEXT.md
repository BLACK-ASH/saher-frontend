# Phase 1: Quality Gates & Test Infrastructure - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Lint/typecheck/test gates and a working test harness (vitest + testing-library + msw wired at the `apiFetch` boundary) exist before any module work begins; package hygiene debt is cleared. Proven by real sample tests: one component render through jsdom, one msw-intercepted call flowing through the actual `lib/api-wrapper.ts`. No backend contract check needed — no new API consumers are built here.
</domain>

<decisions>
## Implementation Decisions

### Branch & Deploy Policy (user directive)
- **D-01:** All development happens on the `dev` branch. Nothing is pushed to `main` during this milestone. Note for planning: local `main` carries 6 unpushed planning-doc commits; `origin/dev` is main + 19 feature commits (leave/workshop/session/participant work). First execution step is syncing dev with local main's docs, then continuing on dev.
- **D-02:** `.github/workflows/dev-deploy.yml` ("Deploy Dev", targets `/home/saher/Test/`) repoints to the dev line: trigger changes `main` → `dev`, and checkout resets to `origin/dev` instead of `origin/main`. This keeps the test environment live under the dev-only policy; `main` stays frozen as the stable snapshot. Activates when the updated workflow file is pushed to dev (GitHub reads the workflow from the pushed ref).

### Quality Gates
- **D-03:** Gate steps (`pnpm lint && pnpm typecheck && pnpm test`) run as pre-steps inside the existing Deploy Dev job, before `docker compose up -d --build frontend`. Failing checks abort deployment — that IS the gate. No separate PR workflow for now; add one if a PR-based flow appears.
- **D-04:** New package scripts: `"typecheck": "tsc --noEmit"` and `"test": "vitest run"`. Success criterion #1 (lint + typecheck + test green on fresh checkout) runs against these.

### Test Harness (locked by prior decisions, refined here)
- **D-05:** vitest + @testing-library/react + jsdom. Vitest config mirrors the `@/*` path alias from tsconfig. A shared render/test helper wraps components in QueryClientProvider replicating `app/provider.tsx` defaults (`retry: false`, `refetchOnWindowFocus: false`).
- **D-06:** msw intercepts at the `apiFetch` boundary — handlers serve full `{ success, message, data }` envelopes through the real wrapper (never mock TanStack Query internals or services directly).
- **D-07:** Tests co-locate as `<name>.test.ts(x)` beside the source file.

### Starter Test Scope
- **D-08:** Exactly what success criteria #2–3 demand, but implemented as durable reference tests (later phases copy their patterns): one component render test on a real feature component, one msw→apiFetch integration test exercising envelope parsing via `lib/api-wrapper.ts`. Deep suites (refresh single-flight, register-schema rules) defer to Phase 2 / Phase 7 where that code actually changes.

### Coverage Policy
- **D-09:** Coverage report-only (vitest built-in v8 provider), no thresholds. Thresholds arrive in Phase 7 when money/auth coverage completes.

### Package Hygiene (locked by FNDT-07 text)
- Move `react-hook-form` from devDependencies → dependencies (runtime dep).
- Remove `jwt-decode` (installed, zero imports anywhere).
- Delete dead SCSS in `styles/` (not imported; `sass` not even installed).

### Agent's Discretion
User delegated implementation choices ("do what will be good"): exact dependency version pins, which feature component the sample test renders, setup-file organization, coverage reporter output format, vitest config file details.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing baseline
- `.planning/codebase/TESTING.md` — Recommended baseline this phase implements: runner choice, QueryClientProvider test helper, MSW-at-boundary rule, co-location convention, first-value targets list.
- `.planning/codebase/CONVENTIONS.md` — Naming/co-location rules tests must follow; lint rules (no-console) that apply inside test files too.

### Scope definitions
- `.planning/REQUIREMENTS.md` §Foundation — FNDT-01 (test infra) and FNDT-07 (lint/typecheck baseline + hygiene) verbatim requirements.
- `.planning/ROADMAP.md` §Phase 1 — Success criteria 1–4 that planning must satisfy exactly.

### Files being modified
- `.github/workflows/dev-deploy.yml` — Trigger/reset retarget + gate pre-steps (D-02, D-03).
- `package.json` — New scripts + dependency moves (D-04, hygiene).
- `pnpm-workspace.yaml` — Already allow-lists msw builds; verify it stays correct when msw installs.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/api-wrapper.ts` (`apiFetch`) — the mock boundary; sample integration test drives it directly with an msw server.
- `app/provider.tsx` — QueryClient defaults (`retry: false`, `refetchOnWindowFocus: false`) that the shared test helper must replicate.
- `features/login/components/login-form.tsx` — candidate real component for the render-test sample (small, has zod resolver wiring).
- `services/attendance.api.ts` — reference for valid `{ success, message, data }` envelope shapes msw handlers must serve.

### Established Patterns
- Strict TS + `@/*` alias everywhere — vitest config must resolve identically or tests lie about compile health.
- Layering `components/features → hooks → services → lib` — tests sit beside each layer's files, framework-free in `services/`+`lib/` where possible.
- ESLint flat config applies to test files (no-console error; warn/error allowed).

### Integration Points
- `package.json` scripts consumed by deploy-job gate steps (D-03/D-04 chain).
- `styles/` deletion — maps confirm zero importers; verify with one grep during execution before removing.
- Local git state: branch `main` ahead 6 of `origin/main`; `origin/dev` exists and is strictly ahead of origin/main by 19 commits — see D-01.
</code_context>

<specifics>
## Specific Ideas

- User directive (verbatim intent): "do what will be good and don't push anything on main branch, use dev branch." Everything technical delegated; branch policy is hard law.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Deep api-wrapper/schema test suites intentionally deferred to Phases 2 and 7 per roadmap, recorded in D-08.)
</deferred>

---

*Phase: 1-Quality Gates & Test Infrastructure*
*Context gathered: 2026-08-24*
