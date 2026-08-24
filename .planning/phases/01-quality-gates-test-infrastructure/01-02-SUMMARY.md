---
phase: 01-quality-gates-test-infrastructure
plan: 02
subsystem: testing
tags: [vitest, msw, testing-library, jsdom, react-query, api-fetch]

# Dependency graph
requires:
  - phase: 01-quality-gates-test-infrastructure (plan 01)
    provides: vitest 4 + jsdom toolchain, @/* alias mirroring in vitest.config.ts, green lint/typecheck baseline, typecheck/test scripts
provides:
  - tests/setup.ts wiring jest-dom matchers, RTL cleanup, and msw server lifecycle into every test run
  - tests/render-with-providers.tsx helper replicating app/provider.tsx QueryClient defaults with a fresh client per call
  - LoginForm reference component-render test (only next/navigation mocked)
  - lib/api-wrapper.test.ts reference msw-at-the-boundary suite proving envelope + meta passthrough through the REAL apiFetch
affects: [01-03 CI gates consuming pnpm test, Phases 2-7 module work copying these test patterns]

# Tech tracking
tech-stack:
  added: []
  patterns: [fresh QueryClient inside renderWithProviders body per call, vi.mock only at framework boundaries (next/navigation), full { success, message, data, meta? } envelopes via HttpResponse.json, inline server.use() handler registration beside assertions]

key-files:
  created:
    - tests/setup.ts
    - tests/render-with-providers.tsx
    - tests/test-server.ts
    - features/login/components/login-form.test.tsx
    - lib/api-wrapper.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "Test harness proven by two durable reference tests: LoginForm render through a fresh-per-call QueryClientProvider helper, and real apiFetch driven through msw-intercepted fetch with full envelope + meta assertions"
  - "msw lifecycle lives in tests/setup.ts (listen onUnhandledRequest:error / resetHandlers / close) over a shared no-default-handler setupServer; handlers registered inline per test"

patterns-established:
  - "Reference render test: renderWithProviders(<Component />) + getByLabelText/getByRole assertions, router stubbed at module boundary"
  - "Reference integration test: register http.get handler with HttpResponse.json envelope -> drive real apiFetch -> assert resolved ApiResponse"
  - "onUnhandledRequest: \"error\" makes any stray fetch a loud failure in every future suite"

requirements-completed: [FNDT-01]

# Metrics
duration: 7min
completed: 2026-08-24
---

# Phase 1 Plan 2: Provider-Aware Render & msw Boundary Reference Tests Summary

**Two durable reference suites proving the harness end-to-end: the real LoginForm rendered under a provider-replicating wrapper in jsdom, and the real `apiFetch` envelope contract driven through msw-intercepted fetch**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-24T14:10:33Z
- **Completed:** 2026-08-24T14:18:04Z
- **Tasks:** 2 (1 auto + 1 tdd with test→feat gate pair)
- **Files modified:** 6

## Accomplishments
- Success criterion 2 met: a real feature component (LoginForm) renders under a QueryClientProvider test wrapper whose client mirrors app/provider.tsx defaults exactly, with visible-output assertions on labels and button
- Success criterion 3 met: msw handlers serve full `{ success, message, data, meta? }` envelopes through the unmocked `apiFetch`, including the edge where a missing `success:true` rejects even on HTTP 200
- Full gate trio green with zero skipped tests: `pnpm lint && pnpm typecheck && pnpm test` all exit 0; `pnpm build` re-run confirming co-located tests leak nothing into the bundle

## Task Commits

Each task was committed atomically:

1. **Task 1: Provider-aware render slice** - `0d1d9d1` (feat)
2. **Task 2 (RED): failing msw-at-boundary envelope tests** - `cf27354` (test)
3. **Task 2 (GREEN): wire msw lifecycle into test setup** - `452dde9` (feat)

## Files Created/Modified
- `tests/setup.ts` - jest-dom matchers, RTL cleanup, msw listen/resetHandlers/close lifecycle
- `tests/render-with-providers.tsx` - RTL render wrapper building a fresh retry:false / refetchOnWindowFocus:false QueryClient per call
- `tests/test-server.ts` - shared bare `setupServer()` with no default handlers; fixtures stay beside assertions
- `features/login/components/login-form.test.tsx` - reference component-render test (`vi.mock("next/navigation")` only)
- `lib/api-wrapper.test.ts` - reference integration test: success envelope parse, meta passthrough deep-equal, missing-success rejection
- `vitest.config.ts` - added `test.setupFiles: ["./tests/setup.ts"]`

## Decisions Made
- Kept the render test render-level per D-08 — it is the copyable pattern for later phases, not a form-behavior suite
- Registered msw handlers inline per test instead of default handlers on the shared server, keeping fixtures visible next to their assertions
- No refresh/retry scenario written — explicitly deferred to Phase 7 per D-08

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Before the msw lifecycle exists, Node's fetch cannot parse the relative URLs `apiFetch` uses (`ERR_INVALID_URL`) — this made the TDD RED run fail loudly as expected; once `server.listen()` is active, msw resolves those relative paths against the jsdom location and everything matches
- Pre-existing 53 ESLint warnings (0 errors) remain out-of-scope debt carried from plan 01-01; no warnings originate in the new files

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01-03 can wire `pnpm lint && pnpm typecheck && pnpm test` into CI knowing all three exit 0 locally and `pnpm build` proves bundle cleanliness
- Phases 2-7 have both copyable patterns in place: `renderWithProviders` for component work and envelope-shaped `http.get` + real `apiFetch` for service work
- Nothing pushed to any remote during this plan; `main` frozen as required

---
*Phase: 01-quality-gates-test-infrastructure*
*Completed: 2026-08-24*
---
## Self-Check: PASSED

All 7 key files exist on disk; all 4 commits (`0d1d9d1`, `cf27354`, `452dde9`, `d2859b4`) present in git log. Gate trio re-verified at plan end: `pnpm lint` / `pnpm typecheck` / `pnpm test` exit 0, `pnpm build` exit 0.
