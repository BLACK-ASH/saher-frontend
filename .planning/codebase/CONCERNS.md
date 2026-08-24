# Codebase Concerns

**Analysis Date:** 2026-08-24

## Tech Debt

**Lint baseline is red (29 errors / 43 warnings):**
- Issue: `pnpm lint` fails with exit code 1. The codebase is being developed against a broken lint gate, so new violations are indistinguishable from existing ones.
- Files: `eslint.config.mjs` defines `no-console: ["error", { allow: ["warn", "error"] }]`, but violations exist across many files (see Known Bugs for the worst offenders). Additional errors: `react-hooks/rules-of-hooks`, `@typescript-eslint/no-explicit-any`, `no-non-null-asserted-optional-chain`, `{}` empty-object types, `<a>` instead of `<Link>` in `app/forbidden/page.tsx:26`.
- Impact: No quality gate can be enforced until the baseline is green; real regressions hide among pre-existing errors.
- Fix approach: Fix or suppress all current errors in one dedicated cleanup pass (most are mechanical: remove debug logs, replace `any`, fix optional chains), then wire lint into CI as a blocking step.

**Debug console.log statements committed:**
- Issue: Debug logging left in feature code despite the eslint `no-console` rule.
- Files: `features/calendar/calendar.tsx:143,154,165,175`, `features/calendar/add-event-dialog.tsx:39,43`, `features/program/program-editor.tsx:16`
- Impact: Lint failures; noisy browser consoles in production.
- Fix approach: Delete the statements (they are clearly leftover debugging of form/event data).

**Runtime dependency mis-categorized as devDependency:**
- Issue: `react-hook-form` (used by every form via `@hookform/resolvers`) is listed under `devDependencies` in `package.json:57`.
- Impact: Currently works only because the production Docker stage runs full `pnpm ci` (installs dev deps too). Breaks under any `pnpm install --prod` / pruning optimization; misleading for tooling.
- Fix approach: Move `react-hook-form` to `dependencies`.

**Unused dependency:**
- Issue: `jwt-decode` (`package.json:31`) is declared but never imported anywhere in `app/`, `components/`, `features/`, `hooks/`, `lib/`, or `services/`.
- Impact: Dead weight; implies an abandoned client-side JWT parsing approach.
- Fix approach: Remove from dependencies (re-add intentionally if client-side token inspection is ever needed).

**Dead scaffold component:**
- Issue: `components/example.tsx` (55 lines) is referenced by no other file — shadcn-style example scaffolding left in place.
- Impact: Confuses "where do I put this" navigation; adds noise.
- Fix approach: Delete it.

**Duplicated stat-card/action types with `icon: any`:**
- Issue: Near-identical local types declaring `icon: any` and `variant: any` are copy-pasted across three files instead of one shared typed module.
- Files: `app/(main)/page.tsx:55`, `app/(main)/users/[id]/page.tsx:197,203,224`, `features/profile/profile.tsx:204,210,231`
- Impact: Type drift between dashboards; `any` defeats typing on icon/variant props.
- Fix approach: Extract a shared `StatCard`/page-action type (e.g., `lib/types.ts` or alongside `components/`) using `LucideIcon` and the shadcn button variant union.

**Error logger is a console stub:**
- Issue: `lib/logger.ts` just wraps `console.error` with a "// 👉 Replace this with Sentry later" note. Only used by `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.
- Impact: No visibility into production errors; boundary errors vanish into container stdout.
- Fix approach: Either accept console-only (self-hosted Docker) and document it, or wire a real sink (Sentry/GlitchTip) at this single choke point — all call sites already route through `logError`.

## Known Bugs

**Conditional hook call in rich-text menu bar:**
- Symptoms: Latent crash — React throws "Rendered more hooks than during the previous render" when the editor transitions between null/non-null across renders of the same mounted component.
- Files: `components/tiptap/menu-bar.tsx:33-38` — `if (!editor) return null;` executes before the `useEditorState(...)` hook call.
- Trigger: Any parent that renders `<MenuBar>` while `editor` is initially `null` then becomes set (the common tiptap init pattern) flips hook order.
- Workaround: None currently; works by luck where parents remount MenuBar after editor creation.
- Fix: Move the early return below the hook, or split into wrapper (null check) + inner component (hooks).

**Unsafe pagination comparison `?.meta?.total! <`:**
- Symptoms: When `meta` is undefined (loading/error/empty response), `undefined < page+1` is `false`, so the "next page" button stays enabled and users can paginate past the end into empty pages.
- Files: `features/attendance/attendance-table.tsx:88`, `features/attendance/attendance-correction-requests.tsx:83`, `features/dashboard/today-attendance-table.tsx:120`
- Trigger: Open any paginated table before data resolves; click next.
- Workaround: None.
- Fix: `(attendances?.meta?.total ?? 0) <= (page + 1) * limit` style guard, or disable buttons while `!meta`.

**Non-null asserted env var for push notifications:**
- Symptoms: If `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is absent at build time, push subscription silently fails (invalid key passed to `pushManager.subscribe`), caught only by a bare `console.error`.
- Files: `hooks/use-push-notification.ts:28` (`process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!`)
- Trigger: Deploy pipeline forgets the build ARG (`Dockerfile:22-23` requires it be passed explicitly).
- Workaround: None; feature silently degrades.
- Fix: Early-return with a warning when the env var is empty, and assert presence at build time in CI.

## Security Considerations

**Middleware auth is existence-check only:**
- Risk: `proxy.ts:5-27` redirects based solely on whether `saher_access_token`/`saher_refresh_token` cookies exist — expired, tampered, or forged cookies pass. Admin route protection happens client-side after render via `components/role-guard.tsx` (redirects once `/api/auth/me` returns role mismatch), so protected page shells/data requests fire before redirect.
- Files: `proxy.ts`, `components/role-guard.tsx`, `app/(main)/(admin)/layout.tsx`
- Current mitigation: All actual authorization is enforced server-side by the API (401s handled by `lib/api-wrapper.ts` refresh flow); tokens live in cookies (`credentials: "include"` throughout), not localStorage — good.
- Recommendations: Acceptable for a frontend if (and only if) the backend authorizes every endpoint — verify that. Optionally decode-and-check expiry in `proxy.ts` for cleaner UX; keep RoleGuard as defense-in-depth UX, never as the security boundary.

**Service worker opens arbitrary URL from push payload:**
- Risk: `public/sw.js` notificationclick handler calls `clients.openWindow(event.notification.data.url)` without validating the origin — a malicious/compromised push payload could open arbitrary URLs.
- Files: `public/sw.js:15-18`
- Current mitigation: Payload originates from your own push server (server-controlled), so exploitability requires server compromise.
- Recommendations: Whitelist relative paths or same-origin URLs before `openWindow`.

**No security headers configured:**
- Risk: `next.config.ts` sets only `images.unoptimized`; no `headers()` config for CSP, X-Frame-Options, etc.
- Files: `next.config.ts`
- Current mitigation: Whatever reverse proxy in front of the container provides.
- Recommendations: Add basic headers in `next.config.ts` unless the edge proxy already owns this.

## Performance Bottlenecks

**Next.js image optimization disabled globally:**
- Problem: `images: { unoptimized: true }` means every `next/image` ships raw source bytes; user profile photos and uploaded documents have no resizing/modern formats.
- Files: `next.config.ts:5-7`, consumers: `components/image-upload.tsx`, `lib/image-url.ts`, avatar renders in `features/profile/*`, `features/users/*`
- Cause: Likely a workaround for self-hosted deployment (sharp/on-demand optimization) — verify intent.
- Improvement path: Re-enable optimization, or at minimum enforce sized uploads at upload time.

**Minor: query retry interplay:**
- Problem: Global `retry: false` in `app/provider.tsx:12` except `use-me.ts` overrides with `retry: 3` — combined with `apiFetch`'s 401-refresh-retry, a dead session can trigger refresh + up to 3 refetches per query.
- Files: `hooks/use-me.ts:52`, `app/provider.tsx`, `lib/api-wrapper.ts:73-112`
- Improvement path: Set `retry: (count, error) => error.message !== "Unauthorized"` semantics if noise appears.

## Fragile Areas

**API wrapper refresh logic:**
- Files: `lib/api-wrapper.ts:20-33,73-112`
- Why fragile: Module-level `refreshPromise` singleton coordinates single-flight token refresh — correct pattern, but any future code path that throws between fetch start and 401 handling bypasses it; `_retried` positional boolean param is easy to misuse when calling directly.
- Safe modification: Keep changes inside `apiFetch`; don't add callers that pass the third argument.
- Test coverage: None (zero tests in repo).

**tiptap utilities:**
- Files: `lib/tiptap-utils.ts` (640 lines), `components/tiptap/menu-bar.tsx` (284 lines)
- Why fragile: Largest hand-written module in the repo, direct ProseMirror position manipulation, two stale `eslint-disable` directives (`lib/tiptap-utils.ts:410,445`), plus the conditional-hook bug above.
- Safe modification: Change incrementally with manual editor testing; positions/schema logic has no safety net.
- Test coverage: None.

**Attendance correction flows:**
- Files: `features/attendance-correction/attendance-correction-view.tsx` (400 lines, three inline mutation error handlers at lines 368/379/389), `features/attendance-correction/corrections/*`, `hooks/use-admin-attendance-correction.ts`, `hooks/use-attendance-correction.ts`
- Why fragile: Largest feature component mixes list/detail/approve-reject actions; error handling duplicated per-mutation rather than centralized.
- Safe modification: Follow the existing per-mutation onError toast pattern when extending.
- Test coverage: None.

## Scaling Limits

Not applicable — standard stateless Next.js container behind Docker Compose (`.github/workflows/deploy-dev.yml`, `Dockerfile`). Scaling path: run more containers behind the proxy; no local session state exists (auth is cookie-based against the API).

## Dependencies at Risk

**`shadcn` declared as runtime dependency:**
- Risk: `shadcn` (`package.json:43`) is a CLI/generator, not a runtime library; components are vendored under `components/ui/`.
- Impact: Inflates production install; confusion about upgrade paths.
- Migration plan: Move to devDependencies (or omit — CLI can run via `pnpm dlx`).

**Pinned exact versions for major libs:**
- Risk: `next: 16.1.6`, `react: 19.2.3`, `recharts: 3.8.0` pinned exactly while everything else floats with `^`.
- Impact: Mixed strategy makes updates unpredictable; security patches require deliberate bumps.
- Migration plan: Pick one strategy (recommend caret ranges) in a single housekeeping change.

## Missing Critical Features

**Zero test infrastructure:**
- Problem: No test runner (`package.json` scripts contain only dev/build/start/lint), zero `*.test.*`/`*.spec.*` files, no test config anywhere.
- Blocks: Any regression confidence for the auth refresh flow (`lib/api-wrapper.ts`), pagination logic, attendance mutations, and zod schemas in `services/*.api.ts`.
- Priority: High — introduce Vitest with a handful of tests around `api-wrapper.ts` refresh single-flight and one zod schema round-trip first.

**No CI quality gates:**
- Problem: The only GitHub workflow (`.github/workflows/deploy-dev.yml`) deploys on push to main via self-hosted runner (`git reset --hard` + docker compose) — no lint, typecheck, or build verification step before deploy. Combined with the failing lint baseline, nothing prevents shipping broken code.
- Blocks: Safe iteration velocity.
- Priority: High — add lint + `tsc --noEmit` + `next build` job that must pass before the deploy job.

## Test Coverage Gaps

**Everything (repo-wide gap):**
- What's not tested: All logic. Highest-value targets in order: `lib/api-wrapper.ts` (token refresh/retry state machine), `services/*.api.ts` zod schemas vs real API payloads, pagination guards, `hooks/use-push-notification.ts` VAPID key handling.
- Files: repo-wide; start with `lib/api-wrapper.ts`, `lib/common-zod-schema.ts`, `services/attendance.api.ts`
- Risk: Regressions ship straight to the dev environment on every merge to main.
- Priority: High

---

*Concerns audit: 2026-08-24*
