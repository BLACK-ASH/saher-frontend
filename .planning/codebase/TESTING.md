# Testing Patterns

**Analysis Date:** 2026-08-24

## Test Framework

**Runner:**
- **None.** No test runner is installed or configured.
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files exist
- No test script in `package.json:5-10` (only `dev`, `build`, `start`, `lint`)
- Zero test files in the repo (`*.test.*`, `*.spec.*`, `__tests__/` — all absent)
- No testing libraries in dependencies (`package.json:49-60`) — note `react-hook-form` sits in `devDependencies` but is a runtime dep

**Assertion Library:** Not applicable

**Run Commands:**
```bash
pnpm lint        # ESLint — the only automated quality gate today
pnpm build       # next build — type-checks via tsc, catches compile breaks
```

## Test File Organization

Not applicable — no tests exist.

## Current Quality Gates

The only checks that run today:

1. **ESLint** (`pnpm lint`, config `eslint.config.mjs`) — Next core-web-vitals + TS rules + `no-console`
2. **TypeScript strict mode** during `pnpm build` (`tsconfig.json:11` `"strict": true`)
3. **CI**: `.github/workflows/dev-deploy.yml` does NOT run lint or tests — it only hard-resets a self-hosted checkout to `origin/main` and rebuilds the Docker image on push to `main`. Nothing gates merges except manual review.

## Mocking / Fixtures / Coverage

Not applicable — nothing to mock, no fixtures directory, no coverage tooling or thresholds.

## Recommended Baseline (when adding tests)

If a phase introduces tests, use this setup — it fits the existing stack (Next 16 App Router, React 19, TanStack Query v5, react-hook-form/Zod):

1. **Runner:** Vitest (fastest path with existing TS/ESM/alias config). Add `vitest.config.ts` mirroring the `@/*` alias from `tsconfig.json:25-29`.
2. **Component/DOM tests:** `@testing-library/react` + `jsdom`; wrap renders in a shared `QueryClientProvider` test helper replicating `app/provider.tsx:7-17` defaults (`retry: false`, `refetchOnWindowFocus: false`).
3. **Network mocking:** MSW intercepting `fetch` at the `apiFetch` boundary (`lib/api-wrapper.ts:38`) — this also exercises 401-refresh/retry logic; do not mock TanStack Query internals.
4. **Highest-value first targets** (untested logic that carries real behavior):
   - `lib/api-wrapper.ts` — refresh single-flight, one-retry-only, FormData header handling
   - Zod schemas — `features/register/register-schema.ts` (regexes, `.refine()` cross-field rules, transforms) and `services/attendance.api.ts:6-15`
   - Status derivation — `hooks/use-attendance.ts:54-67` (pure branching over query data)
   - Form validation flows — `features/login/components/login-form.tsx`, `features/register/user-register.tsx`
5. **Placement:** co-locate as `<name>.test.ts(x)` beside the source file (matches flat kebab-case layout); keep `services/` and `lib/` tests framework-free where possible.
6. **CI:** extend `.github/workflows/dev-deploy.yml` (or add a PR workflow) to run `pnpm lint && vitest run` before the deploy job — currently deploys are ungated.

---

*Testing analysis: 2026-08-24*
