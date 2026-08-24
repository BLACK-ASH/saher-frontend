---
status: issues_found
---

Phase 01 review — `git diff c05801c..HEAD -- ':!.planning'`

## lib/api-wrapper.ts
- `lib/api-wrapper.ts:56-58` — warn — 204 branch returns `null` cast past the declared `Promise<ApiResponse<T>>` via `@ts-expect-error`, so every caller's `res.data` access becomes a latent TypeError on a real 204 while types claim it can't happen. Fix: widen the signature to `Promise<ApiResponse<T> | null>` and let tsc force call sites to narrow, or drop the branch until an endpoint actually returns 204 (introduced in-range via e696526, hardened by 90f7617).

## .github/workflows/dev-deploy.yml
- `.github/workflows/dev-deploy.yml:27-29` — warn — `corepack enable` with no `packageManager` field in package.json leaves the gate toolchain (pnpm major) floating with corepack defaults/host state; a drift can change lockfile/install behavior between local, gate, and the Docker builder stage. Fix: add `"packageManager": "pnpm@x.y.z"` to package.json.
- Gate ordering is sound: reset → gates → compose is fail-closed (`&&` chain, GH default `bash -e`, no pipes, no `${{ }}` interpolation of untrusted input), and deleting a script or all test files still fails the gate (`vitest run` without `passWithNoTests`). No bypass found short of editing the workflow itself.

## features/login/components/login-form.test.tsx
- `features/login/components/login-form.test.tsx:17-25` — nit — reference test asserts render presence only; zero behavioral coverage on an auth flow the project constraints call critical (add one invalid-email submit assertion on the inline FieldError when auth flows get their pass). Not theater: assertions are tied to real label associations and the router mock covers exactly what login-form imports.

## lib/api-wrapper.test.ts
- Clean — three tests assert real envelope behavior through msw at the module boundary, including the missing-`success:true` rejection path. No `.skip`/`.only` anywhere in suites.

## vitest.config.ts / tests/*
- `vitest.config.ts:15` — nit — `@vitest/coverage-v8` installed and configured but nothing invokes coverage; fine if Phase 7 lands, otherwise YAGNI until then.
- `tests/setup.ts:9` — good strictness (`onUnhandledRequest: "error"`) that will catch un-mocked network in future tests.

## Pagination buttons (lint sweep)
- `features/dashboard/range-attendance-table.tsx:189`, `features/dashboard/today-attendance-table.tsx:120`, `features/attendance/attendance-table.tsx:90`, `features/attendance/attendance-correction-requests.tsx:83` — nit — `Number(meta?.total) < page + 1` preserves old behavior exactly (missing meta ⇒ NaN ⇒ button enabled ⇒ paging past last page); `(meta?.total ?? 0) < page + 1` would actually close it while satisfying the same lint rule.

## components/tiptap/menu-bar-state.ts
- `components/tiptap/menu-bar-state.ts:10-31` — nit — `?? false` fallbacks are dead now that the selector guard guarantees a defined `Editor`; optional cleanup. The menu-bar.tsx hook hoist itself is a correct rules-of-hooks fix.

## app/(main)/calendar/page.tsx
- `app/(main)/calendar/page.tsx:4` — nit — lowercase `page` component survived the sweep that renamed only users/[id]; conventions call for PascalCase named functions.

## package.json / pnpm-workspace.yaml
- Clean — react-hook-form devDeps→deps is correct (runtime import), jwt-decode removal verified (zero imports), allowBuilds key honored by installed pnpm per author verification. Missing `packageManager` tracked under workflow finding above.

Verdict: APPROVE WITH NITS
