# Phase 1: Quality Gates & Test Infrastructure - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 8 (5 new, 3 modified)
**Analogs found:** 8 / 8 (structural/partial matches only — codebase has zero tests, configs are their own best analogs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `vitest.config.ts` (new) | config | transform/build | `tsconfig.json` (alias source), `eslint.config.mjs` (flat-root-config precedent) | partial |
| `tests/setup.ts` (new, name at discretion) | test-setup | — | `app/provider.tsx` (QueryClient defaults) | partial |
| Shared test render helper (new, location at discretion) | hook/test-utility | render | `app/provider.tsx` | role-match |
| `lib/api-wrapper.test.ts` (new) | test (integration) | request-response | `services/attendance.api.ts` (envelope consumer) + `lib/api-wrapper.ts` (subject under test) | role-match |
| `features/login/components/login-form.test.tsx` (new, component choice discretionary) | test (component render) | render | `features/login/components/login-form.tsx` (subject) wrapped by `app/provider.tsx` pattern | role-match |
| `package.json` (modify) | config | — | self (`scripts` block, dep sections) | exact (self) |
| `.github/workflows/dev-deploy.yml` (modify) | ci-config | event-driven (push) | self | exact (self) |
| `pnpm-workspace.yaml` (modify/verify) | config | — | self (`allowBuilds` already lists msw) | exact (self) |

---

## Pattern Assignments

### `vitest.config.ts` (config, new)

**Analog:** `tsconfig.json` (the alias vitest MUST mirror) — there is no existing bundler/test config to copy wholesale.

**Alias to mirror** (`tsconfig.json:25-29`):
```json
"paths": {
  "@/*": [
    "./*"
  ]
}
```
→ Vitest equivalent: `resolve: { alias: { "@": path.resolve(__dirname, ".") } }` (file lives at repo root, alias points to root, same as `@/* → ./*`). If strict-mode complaints arise, a minimal `/// <reference types="vitest/config" />` header suffices — do not fork a second tsconfig.

**Flat-root-config precedent** (`eslint.config.mjs:1-5`) — root-level `*.config.mjs/ts` with ESM imports is the established convention:
```typescript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
```
→ Same shape: ESM default-export config object at repo root, kebab/snake naming (`vitest.config.ts`).

**Required config surface** (from D-05/D-07/D-09): `environment: "jsdom"`, one `setupFiles` entry, `coverage: { provider: "v8", ... }` report-only with **no thresholds**, include `*.test.{ts,tsx}` discovery (default glob covers co-located tests — no custom include needed).

---

### Test setup file (test-setup, new)

**Analog:** `app/provider.tsx` — the defaults any test-render helper must replicate.

**QueryClient defaults** (`app/provider.tsx:7-17`):
```tsx
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    })
);
```
→ In the test helper this becomes a fresh `new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } })` **per render** (no `useState` needed outside React; the singleton-per-test avoids cross-test cache bleed). Tests may additionally set `gcTime: Infinity` if isolation issues appear — start without it.

**MSW lifecycle belongs in the setup file too**: `setupServer(...)` imported once, `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())` — standard msw 2.x pattern; no codebase precedent exists (see No Analog Found).

---

### Shared test render helper (hook/test-utility, new)

**Analog:** `app/provider.tsx` (whole file, 24 lines — copy the provider stack, swap `useState` for a per-call factory).

**Provider stack being replicated** (`app/provider.tsx:19-23`):
```tsx
return (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```
→ Helper shape: `renderWithProviders(ui, options)` → `render(ui, { wrapper: () => <QueryClientProvider client={client}>{ui}</QueryClientProvider> })`. Do **not** pull in ThemeProvider/TooltipProvider unless a rendered component crashes without them — `login-form.tsx` uses neither directly.

**Consumer requiring this wrapper:** `hooks/use-login.ts:4-13` calls `useMutation` → any component rendering `LoginForm` throws without a QueryClientProvider:
```typescript
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiFetch(`/api/auth/login`, {
```

⚠️ **Render-test gotcha for `LoginForm`:** `features/login/components/login-form.tsx:35-36` also calls `useRouter()`:
```tsx
const { mutate, isPending } = useLogin();
const router = useRouter();
```
Plain jsdom has no Next router context — the sample render test must `vi.mock("next/navigation")` (stub `useRouter`) or pick a different feature component (explicitly discretionary per D-08). `next/image` (line 74) renders fine in jsdom.

---

### `lib/api-wrapper.test.ts` (test/integration, request-response)

**Subject under test:** `lib/api-wrapper.ts` — drive the REAL `apiFetch` through msw-intercepted `fetch`. Never mock the wrapper or TanStack Query.

**The envelope every msw handler must serve** (`lib/api-wrapper.ts:10-15`):
```typescript
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: MetaResponse;
};
```
Deviations hit the failure path (`lib/api-wrapper.ts:56-61`): malformed JSON → `toast.error("Invalid server response")` + throw. Handlers return `HttpResponse.json({ success: true, message: "...", data: {...} })`.

**Call signature the test exercises** (`lib/api-wrapper.ts:38-42`):
```typescript
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  _retried = false,
): Promise<ApiResponse<T>> {
```
→ Integration test asserts the full returned envelope: `await expect(apiFetch<T>("/api/test")).resolves.toMatchObject({ success: true })`.

**Valid fixture shapes — copy from real consumers** (`services/attendance.api.ts:25-30,47-53`):
```typescript
export const getAttendanceStatus = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/me", {
    method: "GET",
  });
  return res.data;
};
// ...
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/me?sort=${sort}&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return { data: res.data, meta: res.meta };
```
→ Single-resource handler serves `{ success, message, data: <object> }`; list handler adds `meta: { page, limit, count, total }` (`MetaResponse`, `lib/api-wrapper.ts:3-8`).

**Error-path contract for handler fixtures** (`lib/api-wrapper.ts:117-118`): non-success responses → toast + `throw new Error(json.message || \`HTTP ${res.status}\`)`. A 401-first-then-ok pair of handlers is the natural second scenario but is explicitly deferred to Phase 2 (D-08) — starter test covers happy path only.

**Test-file conventions inherited from the codebase:**
- ESLint applies to tests: `eslint.config.mjs:18` — `"no-console": ["error", { allow: ["warn", "error"] }]`. Use `console.warn/error` only; never bare `console.log` inside test files.
- `sonner` toasts fire inside `apiFetch` on error paths — harmless in jsdom; optionally spy/assert via `vi.spyOn` on sonner rather than silencing globally.

---

### Sample component render test (test/component, render)

**Subject:** `features/login/components/login-form.tsx` (candidate; final choice discretionary per D-08).

**What makes it a good reference test subject** — minimal external surface, real zod+RHF wiring (`login-form.tsx:43-49`):
```tsx
const form = useForm<z.infer<typeof loginFromSchema>>({
  resolver: zodResolver(loginFromSchema),
  defaultValues: {
    email: "",
    password: "",
  },
});
```

**Named export convention** the test imports (`login-form.tsx:30-33`):
```tsx
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
```
→ Renders with zero required props — `renderWithProviders(<LoginForm />)`.

**Assertion targets visible in markup** (`login-form.tsx:96-103`): labels `"Email"`/`"Password"`, submit button text `"Login"` (line 152-154, disabled when `isPending`). Use `getByLabelText`/`getByRole` per testing-library idiom — no precedent exists in-repo yet; this test sets it.

---

### `package.json` (modify, config)

**Self-analog — scripts block** (`package.json:5-10`):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
},
```
→ Add exactly two keys (D-04): `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`. Keep alphabetical-ish grouping; `lint` stays untouched.

**Hygiene targets** (locked by FNDT-07):
- Move `"react-hook-form": "^7.71.1"` from `devDependencies` (line 57) → `dependencies` (runtime dep — imported by `login-form.tsx:22`, `user-register.tsx`).
- Delete `"jwt-decode": "^4.0.0"` (line 31) — zero imports anywhere in source.
- New devDependencies (versions discretionary): `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `msw`, `@vitejs/plugin-react` (needed for JSX in tests).
- Delete `styles/` directory (`styles/_variables.scss`, `styles/_keyframe-animations.scss`) — grep confirmed **zero importers** (`_variables|_keyframe-animations|styles/` matches nothing in ts/tsx/css/mjs/json); `sass` was never installed.

---

### `.github/workflows/dev-deploy.yml` (modify, ci-config, event-driven)

**Self-analog — current trigger + reset to retarget** (lines 3-8, 18-22):
```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
...
      - name: Dev Deploy app
        run: |
          cd /home/saher/Test/saher-frontend
          git fetch origin
          git reset --hard origin/main
```
→ Per D-02: `main` → `dev` in trigger AND `origin/main` → `origin/dev` in reset. Nothing else in the job changes shape.

**Gate insertion point — before the compose step** (D-03), i.e. between the reset and `docker compose up` inside/preceding the "Dev Deploy app" run block (lines 19-25):
```yaml
          cd /home/saher/Test/
          docker compose up -d --build frontend
```
→ New pre-step runs `pnpm install && pnpm lint && pnpm typecheck && pnpm test` against `/home/saher/Test/saher-frontend` after the reset; non-zero exit aborts before compose (shell default behavior — keep steps separate or chain with `&&`). Runner already has docker; confirm pnpm availability on the self-hosted runner during execution (Corepack, matching `Dockerfile:5`).

---

### `pnpm-workspace.yaml` (modify/verify, config)

**Self-analog — already correct** (lines 1-4):
```yaml
allowBuilds:
  msw: true
  sharp: true
  unrs-resolver: true
```
→ msw postinstall builds are pre-allowlisted; verify the key name still matches installed pnpm version semantics when msw actually installs (it currently sits unused). No other change expected.

---

## Shared Patterns

### Response envelope contract
**Source:** `lib/api-wrapper.ts:10-15` (+ `MetaResponse` :3-8)
**Apply to:** Every msw handler in the integration test and all future test fixtures
```typescript
{ success: boolean; message: string; data: T; meta?: MetaResponse }
```
Handlers that omit `success: true` fail the wrapper's check (`res.ok && json.success`, line 66) even on HTTP 200.

### One HTTP funnel — mock at the boundary, never above or below it
**Source:** `lib/api-wrapper.ts:38` / rule from TESTING.md:44
**Apply to:** All tests touching network
msw patches global `fetch`; `apiFetch` runs for real (headers, credentials, JSON parse, toast, throw). Services (`services/*.api.ts`) run for real too. Only the socket is faked.

### QueryClient defaults replication
**Source:** `app/provider.tsx:7-17`
**Apply to:** Shared render helper and any test creating its own QueryClient
`retry: false, refetchOnWindowFocus: false`, fresh instance per test.

### Path alias fidelity
**Source:** `tsconfig.json:25-29`
**Apply to:** `vitest.config.ts` resolve.alias — `@` → repo root. Tests importing `@/lib/api-wrapper` must resolve to the same file the app compiles, or tests validate a shadow project.

### Lint rules apply inside tests
**Source:** `eslint.config.mjs:18` (`no-console` error, warn/error allowed)
**Apply to:** All new `*.test.ts(x)` files — no exceptions, no eslint-disable for console.

### Co-location & naming
**Source:** CONVENTIONS.md / D-07 — `<name>.test.ts(x)` beside source, kebab-case throughout. `lib/api-wrapper.test.ts`, `features/login/components/login-form.test.tsx`.

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md-equivalents — here `.planning/codebase/TESTING.md` §Recommended Baseline — plus standard library docs):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `vitest.config.ts` | config | transform | No runner/bundler config exists except `tsconfig.json` (alias source) and `eslint.config.mjs` (flat-style precedent) |
| Test setup file (`server.listen/reset/close` lifecycle) | test-setup | — | Zero prior test infrastructure in repo |
| MSW handler modules | test-fixture | request-response | No fixtures/mocks of any kind exist; envelope shapes come from `services/*.api.ts` usage instead |

## Metadata

**Analog search scope:** repo root configs (`tsconfig.json`, `eslint.config.mjs`, `package.json`, `pnpm-workspace.yaml`), `.github/workflows/`, `lib/`, `app/provider.tsx`, `services/`, `hooks/`, `features/login/`, `styles/` (deletion verification)
**Files scanned:** 14
**Pattern extraction date:** 2026-08-24
**Canonical refs honored:** CONTEXT.md decisions D-01…D-09; `.planning/codebase/TESTING.md` recommended baseline
