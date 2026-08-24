<!-- GSD:project-start source:PROJECT.md -->
## Project

**Saher Frontend Completion**

Completion of the Saher org-management frontend — a Next.js 16 + Tailwind v4 + shadcn/ui app that talks to the NestJS backend at `../saher-backend`. This milestone builds every remaining module (reimbursement, payroll, leave, mail, noticeboard, admin bank/accounts, full events depth) and systematically audits-and-fixes all existing modules (attendance, calendar, users, program, auth flows) so the whole system becomes the org's daily driver.

**Core Value:** Every backend domain has a working, reliable screen — staff and admins run their daily work (attendance, bills, payroll, leave) through this app without falling back to manual processes.

### Constraints

- **Tech stack**: Next.js + Tailwind + shadcn/ui — extend existing patterns, no new UI framework
- **Timeline**: ~1 month of focused work
- **Dates**: All date logic must be IST-aware; send `+05:30` offsets
- **Design**: Free design within shadcn conventions, visually consistent with existing pages
- **Quality**: Tests for critical flows (money, auth, forms); audit-fix approach for existing modules, not wholesale rewrites
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ~5.9 (`typescript ^5.9.3`) - entire codebase (`app/`, `components/`, `features/`, `hooks/`, `lib/`, `services/`)
- SCSS partials - legacy style variables/keyframes (`styles/_variables.scss`, `styles/_keyframe-animations.scss`; not imported by app entry, which uses `app/globals.css`)
## Runtime
- Node.js 24 (Docker images pin `node:24-alpine` — `Dockerfile:3`, `Dockerfile.dev:1`)
- Browser runtime for all data fetching; no server-side data layer (all API calls are client-side relative-URL fetches)
- pnpm (Corepack enabled in Dockerfiles — `Dockerfile:5`)
- Lockfile: `pnpm-lock.yaml` (present) + `pnpm-workspace.yaml` (only built deps allowlist: `msw`, `sharp`, `unrs-resolver`)
## Frameworks
- Next.js 16.1.6 - App Router framework (`app/` directory); request interception uses Next 16's `proxy.ts` (middleware successor) at `proxy.ts`
- React 19.2.3 / react-dom 19.2.3
- Tailwind CSS v4 via PostCSS plugin (`postcss.config.mjs`, `@tailwindcss/postcss`); theme tokens/CSS variables live in `app/globals.css`
- shadcn/ui — style `"radix-nova"`, base color zinc, RSC enabled, lucide icon library (`components.json`); generated components in `components/ui/*.tsx`
- radix-ui (unified package `^1.4.3`) + `@base-ui/react ^1.2.0` - primitive layers under shadcn components
- class-variance-authority + clsx + tailwind-merge - variant/utility composition (`lib/utils.ts`)
- lucide-react - icons
- next-themes - dark/light mode (`components/theme-provider.tsx`)
- sonner - toast notifications (`components/ui/sonner.tsx`)
- @tanstack/react-query ^5.94.5 - all server state; single QueryClient created in `app/provider.tsx` (retry disabled globally, `refetchOnWindowFocus: false`)
- @tanstack/react-table ^8.21.3 - data tables (`features/users/data-table.tsx`, `features/attendance-correction/corrections/data-table.tsx`)
- react-hook-form ^7.71.1 + @hookform/resolvers ^5.2.2 + zod ^4.3.6 - form validation (e.g. `features/register/register-schema.ts`, `services/attendance.api.ts` schemas)
- @tiptap/react + starter-kit ^3.26.0 - rich text editor (`components/tiptap/editor.tsx`, `hooks/use-tiptap-editor.ts`)
- @fullcalendar/* ^6.1.20 (core, daygrid, timegrid, list, interaction, react) - calendar page (`features/calendar/calendar.tsx`)
- recharts 3.8.0 - charts (`features/attendance/attendance-chart.tsx`, `components/ui/chart.tsx`)
- react-day-picker ^9.14.0 - date picker base for `components/ui/calendar.tsx`
- react-dropzone ^15.0.0 + react-image-crop ^11.0.10 - image upload/crop flow (`components/image-upload.tsx`)
- date-fns ^4.1.0 - date math (`lib/utils/time.ts`)
- lodash.throttle ^4.1.1 + custom `hooks/use-throttled-callback.ts`
- None installed. No test runner, assertion library, or test config exists. `msw` is allowlisted in `pnpm-workspace.yaml` but not a dependency.
- Only verification available: `pnpm lint` (ESLint) and `pnpm build` (type-checks during Next build)
- Next.js compiler/Turbopack dev server - `pnpm dev` / `pnpm build` / `pnpm start` (`package.json:5-9`)
- ESLint 9 flat config (`eslint.config.mjs`): `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`, plus `no-console` error (allows `warn`/`error`)
- Docker multi-stage build (`Dockerfile`: deps → builder → runner, standalone-ish output copy)
## Key Dependencies
- next 16.1.6 - routing, rendering, proxy/middleware layer (`proxy.ts`)
- react / react-dom 19.2.3 - UI runtime
- @tanstack/react-query - every server interaction depends on it (`app/provider.tsx`)
- zod ^4 - response validation AND form schemas shared across features/services (`lib/common-zod-schema.ts`)
- jwt-decode ^4.0.0 - **installed but unused** (no import found anywhere in source; candidate for removal)
## Configuration
- No `.env` files committed (none present in repo root)
- Single required public env var: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web-push VAPID key, consumed at `hooks/use-push-notification.ts:28`, injected as Docker build ARG+ENV (`Dockerfile:22-23,32-33`)
- `NODE_ENV` referenced for dev-only error detail (`app/global-error.tsx:60`, `app/error.tsx:52`)
- `next.config.ts` - minimal; only `images.unoptimized: true` (no next/image optimization pipeline)
- `tsconfig.json` - strict TS, bundler resolution, `@/*` alias
- `eslint.config.mjs` - flat config
- `postcss.config.mjs` - Tailwind v4 plugin only
- `components.json` - shadcn CLI config (aliases: `@/components`, `@/hooks`, `@/lib`, `@/components/ui`)
## Platform Requirements
- Node.js 24 recommended (matches Docker), Corepack/pnpm
- Backend API reachable at same origin under `/api/*` (all fetches use relative URLs — see INTEGRATIONS.md)
- Docker container (`Dockerfile`), served by `next start` on port 3000
- Deployed via GitHub Actions self-hosted runner running `docker compose up -d --build frontend` on the host (`.github/workflows/dev-deploy.yml`) — compose file lives outside this repo
- A reverse proxy must route same-origin `/api/*` (and `/uploads/*` images) to the backend; none of that wiring exists in this repo's `next.config.ts`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- kebab-case for everything: `use-login.ts`, `login-form.tsx`, `register-schema.ts`
- Custom hooks: `use-*.ts` prefix in `hooks/`
- API service modules: `*.api.ts` suffix in `services/`
- Zod schema modules: `*-schema.ts`
- Next.js reserved files keep framework casing: `layout.tsx`, `page.tsx`, `error.tsx`, `provider.tsx`
- React hooks: `useCamelCase` arrow-function consts — `export const useLogin = () => {}` (`hooks/use-login.ts:4`)
- Service functions: `get<Resource>` / `<verb><Resource>` async arrow consts — `getAttendanceStatus`, `checkInApi`, `checkOutApi` (`services/attendance.api.ts:25-84`)
- Components: PascalCase named functions — `LoginForm`, `Providers`; pages/providers use `export default`, feature components use named exports
- Generic helpers: camelCase — `cn`, `logError`, `apiFetch`
- camelCase for locals and props
- Constants/enums: PascalCase enum name with SCREAMING_SNAKE members — `AttendanceStatus.NOT_CHECKED_IN` (`hooks/use-attendance.ts:9-14`)
- Mixed but two dominant patterns:
- **New code:** pick one per module and stay consistent; prefer plain PascalCase (`FooResponse`, `FooProps`) for new modules
- Response object props typed `readonly` with explicit `| undefined` instead of `?` (`services/notification.api.ts:4-21`)
- Derive types from Zod: `export type AttendanceResponse = z.infer<typeof attendanceSchema>` (`services/attendance.api.ts:23`) — prefer this over hand-written types when a schema exists
## Code Style
- No Prettier config file; two de-facto styles coexist:
- **Do not reformat** `components/ui/*` — they are generated by the shadcn CLI and get overwritten on regeneration. Match the surrounding style when editing any other file: 2-space indent, double quotes, semicolons, trailing commas.
- ESLint 9 flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- One custom rule: `"no-console": ["error", { allow: ["warn", "error"] }]` — never ship `console.log`; route diagnostics through `logError()` in `lib/logger.ts`
- Run: `pnpm lint`
- `strict: true` (`tsconfig.json:11`)
- Path alias: `@/*` → repo root (`tsconfig.json:25-29`)
- Occasional `any` is quarantined behind an inline disable with a comment above it — follow that pattern if you must: `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (`app/(main)/users/[id]/page.tsx:196`, `features/register/user-register.tsx:106`)
- `@ts-expect-error` requires a short reason comment (`components/image-upload.tsx:120`, `features/attendance-correction/attendance-correction-view.tsx:221`)
## Import Organization
- `@/*` maps to project root — always use it, never relative paths like `../../lib/utils`
## State & Data-Fetching Conventions
- Queries live in `hooks/use-*.ts`, never inline in components:
- queryKey convention: hierarchical array `[resource, scope?, ...params]` — `["attendance", "list", page, limit, sort]` (`hooks/use-attendance.ts:36`)
- Mutations call `queryClient.invalidateQueries({ queryKey: ["<resource>"] })` on success (`hooks/use-attendance.ts:40-52`)
- Hook returns a flat object bag: `{ today, attendancesList, status, checkIn, checkOut }` (`hooks/use-attendance.ts:72-82`)
- Schema defined (co-located or in `*-schema.ts`), wired via `zodResolver`, fields rendered through `<Controller>` with `FieldLabel`/`FieldError` and `aria-invalid`:
- Multi-step forms split into per-step schema fragments in one file: `features/register/register-schema.ts` (`bankDetailSchema`, `userSchema`, `accountSchema`, composed into `registerFormSchema`)
- Cross-field rules via `.refine(...)` with `path:` targeting (`features/register/register-schema.ts:82-93`)
- Normalize input with `.trim()`, `.transform()` inside schemas (uppercase IFSC, strip +91 prefix) — `features/register/register-schema.ts:14-28`
- Submit handlers are `on<Noun>Submit` — `onLoginSubmit` (`login-form.tsx:51`)
## Error Handling
- All HTTP traffic goes through `apiFetch<T>()` in `lib/api-wrapper.ts` — never call bare `fetch` for API calls. It handles: JSON parse failures, 401 → single-flight session refresh → one retry, and toasts every failure via sonner before throwing (`lib/api-wrapper.ts:38-119`)
- Mutation/query errors surface in component callbacks: `onError: (err: Error) => { toast.error(err.message) }` (`login-form.tsx:58-60`)
- Unknown errors funnel to `logError(error, context?)` (`lib/logger.ts`) — console-based today, Sentry-shaped for later swap
- Route-level boundaries: `app/error.tsx` logs + toasts + offers reset; dev-only detail block gated on `process.env.NODE_ENV === "development"` (`app/error.tsx:52-56`); `app/global-error.tsx` for root failures
- Toasts are user-facing feedback everywhere (`sonner`); thrown Errors carry the server `message` string
## Logging
- Call `logError(err, { context })` in effect bodies/boundaries; rely on `apiFetch` toasts for request failures
- `console.log/info/debug` are lint errors; `warn`/`error` allowed
## Comments
- Section banners inside long files: `// ======================== // GLOBAL REFRESH STATE // ========================` (`lib/api-wrapper.ts:17-19`)
- Emoji-flagged notes: `// 🔥 derive status` (`hooks/use-attendance.ts:54`), `// 🔹 Common ObjectId validator` (`features/register/register-schema.ts:3`) — existing quirk, don't propagate deliberately
- JSX region labels: `{/* Icon */}`, `{/* Actions */}` (`app/error.tsx:27-51`)
- No TODO/FIXME debt except one stray (`lib/tiptap-utils.ts:254`)
- Rare; only on vendored-style util files (`lib/tiptap-utils.ts:282`). Don't add ceremony JSDoc for self-evident functions.
## Function Design
## Module Design
- `services/*.api.ts`: pure fetch + type/schema definitions, no React
- `hooks/use-*.ts`: TanStack Query wiring over services
- `features/<domain>/`: domain UI, may import hooks + ui components
- `components/`: cross-feature shared UI (`role-guard.tsx`, `image-upload.tsx`, `loading.tsx`, `no-data.tsx`)
- `components/ui/`: shadcn primitives — generate via `shadcn` CLI, don't hand-roll new ones
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Fonts, providers nesting (QueryClient → Theme → Tooltip → Toaster) | `app/layout.tsx` |
| Providers | Creates singleton `QueryClient` (retry: false, no refetchOnWindowFocus) | `app/provider.tsx` |
| Proxy (middleware) | Edge route guard based on `saher_access_token` / `saher_refresh_token` cookies | `proxy.ts` |
| RoleGuard | Client-side role authorization; redirects to `/forbidden` or `/login` | `components/role-guard.tsx` |
| Feature components | Domain UI per screen section | `features/<domain>/*.tsx` |
| Data hooks | React-query query/mutation wrappers + derived status | `hooks/use-*.ts` |
| Service functions | One function per endpoint; types via zod inference | `services/*.api.ts` |
| apiFetch | Single fetch wrapper: JSON headers, credentials, error toasts, 401 refresh+retry-once | `lib/api-wrapper.ts` |
| UI kit | shadcn/ui (radix-nova style) primitives, generated via shadcn CLI | `components/ui/*` |
## Pattern Overview
- **Thin-server, fat-client:** Almost every page/component is `"use client"`. Server Components are only layouts and static shells (e.g., `app/(main)/page.tsx`, `app/(main)/attendance/page.tsx`). No server actions, no `app/api` handlers, no SSR data fetching.
- **One HTTP funnel:** Every request goes through `apiFetch()` in `lib/api-wrapper.ts`, which handles cookie credentials, content-type (skips it for FormData), error toasts via `sonner`, and a global-singleton token refresh (`refreshPromise`) with exactly one retry.
- **Server state via TanStack Query only.** No Redux/Zustand/context stores. Mutations invalidate query keys (e.g., `["attendance"]` in `hooks/use-attendance.ts`).
- **Cookie-session auth:** httpOnly cookies set by the backend; frontend never touches tokens directly except reading cookie *presence* in `proxy.ts`.
## Layers
- Purpose: URL structure, layouts, guard wiring
- Location: `app/`
- Contains: `layout.tsx` files, thin page files that render feature components, error boundaries (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`)
- Depends on: features, ui components
- Used by: Next.js router
- `(auth)/` — public pages: `change-email`, `change-password`, `forgot-password`, `login`, `verify-email` (own centered-background layout)
- `(main)/` — authenticated app: home, `attendance`, `calendar`, `profile`, `users`, `users/[id]` (sidebar + header layout)
- `(main)/(admin)/` — admin-only: `dashboard`, `register`, `program`, `attendance-correction` (wrapped in `<RoleGuard allowedRoles={["admin"]}>`)
- Purpose: All UI logic for one domain
- Location: `features/<domain>/`
- Contains: composed components, forms (react-hook-form + zod), table column definitions
- Depends on: hooks, `components/ui/*`
- Used by: `app/**/page.tsx`
- Purpose: React-query bindings, cache keys, derived business state (e.g., `AttendanceStatus` enum derivation in `hooks/use-attendance.ts`)
- Location: `hooks/use-<domain>.ts`
- Depends on: services
- Used by: features
- Purpose: Endpoint functions returning parsed/typed data; response schemas defined here with zod
- Location: `services/<domain>.api.ts`
- Depends on: `lib/api-wrapper.ts`, `lib/common-zod-schema.ts`
- Used by: hooks (and occasionally components directly)
- Purpose: Cross-feature widgets and design-system primitives
- Location: `components/` (app-level: `app-sidebar.tsx`, `role-guard.tsx`, `image-upload.tsx`, `loading.tsx`, `no-data.tsx`, `theme-provider.tsx`, `tiptap/*`) and `components/ui/*` (shadcn primitives)
- Depends on: lucide-react, radix-ui
- Used by: features and app shells
## Data Flow
### Primary Request Path (read)
### Write Flow (mutation)
### Auth Flow
### Push Notification Flow
- Server state: TanStack Query cache (`app/provider.tsx` default options: `retry: false`, `refetchOnWindowFocus: false`; individual hooks override with `retry: 3` and `staleTime` 30s–60s)
- Local UI state: React `useState` within components/tables (sorting/filters in `features/users/data-table.tsx`)
- Theme: `next-themes` via `components/theme-provider.tsx`
- No global client-state library
## Key Abstractions
- Purpose: All backend I/O; enforces envelope shape `ApiResponse<T> = { success, message, data, meta? }` and pagination `MetaResponse`
- Location: `lib/api-wrapper.ts`
- Pattern: wrapper function with module-level refresh-promise singleton (dedupes concurrent 401 refreshes)
- Purpose: Response typing without hand-written interfaces
- Examples: `services/attendance.api.ts` (`attendanceSchema` → `AttendanceResponse`), `services/attendance-correction.api.ts`, shared fields in `lib/common-zod-schema.ts` (`userField`, `dateField`)
- Pattern: schema declared next to endpoint functions; type exported via `z.infer`
- Purpose: Domain data + derived flags
- Examples: `hooks/use-me.ts` (current user, `["user","me"]` key), `hooks/use-attendance.ts` (queries + mutations + `AttendanceStatus` enum), `hooks/use-notification.ts`, `hooks/use-profile.ts`, `hooks/use-calendar.ts`
- Pattern: one exported hook per file returning queries/mutations/derived values
- Purpose: Design system
- Examples: `components/ui/button.tsx`, `components/ui/sidebar.tsx` (701 lines, largest file), `components/ui/chart.tsx`
- Pattern: generated by shadcn CLI (config in `components.json`, style `radix-nova`, alias `@/components/ui`), customized in place, CVA variants
- Examples: `features/users/data-table.tsx` (`UserDataTable` generic over `TData/TValue`), `features/attendance-correction/corrections/data-table.tsx`
- Pattern: columns defined in sibling `column.tsx`, table instance with sorting/pagination/filter/visibility row models
## Entry Points
- Location: `app/layout.tsx`
- Triggers: every request
- Responsibilities: fonts (Inter, Geist), metadata, provider stack: `Providers` (React Query) → `ThemeProvider` → `TooltipProvider` → Toaster
- Location: `proxy.ts`
- Triggers: all matched routes (excludes `_next`, favicon, image assets)
- Responsibilities: cookie-presence route guarding
- Location: `app/**/page.tsx`
- Triggers: navigation
- Responsibilities: compose feature components into screens; most delegate entirely (e.g., `app/(auth)/login/page.tsx` renders `features/login/components/login-form.tsx` inside `<Suspense>`)
## Architectural Constraints
- **Rendering model:** Effectively CSR. Pages are client components; do NOT add server-side data fetching assumptions without checking how `apiFetch` cookies work (they rely on browser `credentials: "include"`).
- **Backend coupling:** All `/api/*` paths must be reverse-proxied to the SAHER backend by deployment infrastructure (see `Dockerfile` + `.github/workflows/dev-deploy.yml` — docker compose on self-hosted runner). There is no local mock/proxy config in this repo.
- **Auth depends on cookies:** Token names `saher_access_token` / `saher_refresh_token` are load-bearing in `proxy.ts`. Renaming them requires updating middleware.
- **Envelope contract:** Every backend response must match `{ success, message, data, meta? }` or `apiFetch` throws "Invalid server response".
- **Global mutable state:** `refreshPromise` module singleton in `lib/api-wrapper.ts` (intentional dedupe).
- **Circular imports:** None detected. Import graph is strictly downward: app → features → hooks/services → lib.
- **Env vars:** Only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (build arg in Dockerfile). No `.env*` files present.
## Anti-Patterns
### Inconsistent service-layer usage
### Query key collisions across features
### Dead SCSS styles directory
## Error Handling
- Network errors: `apiFetch` shows `sonner` toast with backend `message` and throws (`lib/api-wrapper.ts:117-118`)
- Route errors: `app/error.tsx` logs via `logError` (`lib/logger.ts`), toasts, offers retry/home buttons; dev mode shows stack. `app/global-error.tsx` for root failures; `app/not-found.tsx` for 404s
- Loading/empty states: `<DefaultLoader />` (`components/loading.tsx`) and `<NoData />` (`components/no-data.tsx`) rendered conditionally in features
- Logger: `logError(error, context?)` in `lib/logger.ts` — console.error today, commented Sentry upgrade path
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
