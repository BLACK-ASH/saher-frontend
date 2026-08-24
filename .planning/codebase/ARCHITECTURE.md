<!-- refreshed: 2026-08-24 -->
# Architecture

**Analysis Date:** 2026-08-24

## System Overview

```text
┌───────────────────────────────────────────────────────────────────┐
│                     Route Shell (Next.js App Router)               │
│   app/(auth)/*          app/(main)/*              app/(main)/(admin)/*
│   login, password flows   dashboard, attendance      users, register,
│                           profile, calendar          program, corrections
├───────────────────────────────────────────────────────────────────┤
│                     Edge Guard                                     │
│   proxy.ts (cookie presence check → redirect /login or /forbidden) │
│   components/role-guard.tsx (client-side role check via useMe)     │
├───────────────────────────────────────────────────────────────────┤
│                     Feature Components                             │
│   features/<domain>/*.tsx                                          │
│   (attendance, users, register, profile, calendar, notification…)  │
├───────────────────────────────────────────────────────────────────┤
│                     Data Hooks (TanStack Query)                    │
│   hooks/use-*.ts                                                   │
├───────────────────────────────────────────────────────────────────┤
│                     Service Layer                                  │
│   services/*.api.ts  (typed endpoint functions + zod schemas)      │
├───────────────────────────────────────────────────────────────────┤
│                     Fetch Wrapper                                  │
│   lib/api-wrapper.ts  (credentials, JSON, 401 → refresh → retry×1) │
└───────────────────────────────┬───────────────────────────────────┘
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│  External SAHER Backend API                                        │
│  Same-origin `/api/*` paths — reverse-proxied at infra level       │
│  (docker compose; no app/api routes or rewrites exist in this repo)│
└───────────────────────────────────────────────────────────────────┘
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

**Overall:** Client-rendered Next.js App Router SPA backed by an external REST API. Layered feature-slice organization: route shells compose feature components; features consume data exclusively through hooks; hooks call typed service functions; all HTTP funnels through one fetch wrapper.

**Key Characteristics:**
- **Thin-server, fat-client:** Almost every page/component is `"use client"`. Server Components are only layouts and static shells (e.g., `app/(main)/page.tsx`, `app/(main)/attendance/page.tsx`). No server actions, no `app/api` handlers, no SSR data fetching.
- **One HTTP funnel:** Every request goes through `apiFetch()` in `lib/api-wrapper.ts`, which handles cookie credentials, content-type (skips it for FormData), error toasts via `sonner`, and a global-singleton token refresh (`refreshPromise`) with exactly one retry.
- **Server state via TanStack Query only.** No Redux/Zustand/context stores. Mutations invalidate query keys (e.g., `["attendance"]` in `hooks/use-attendance.ts`).
- **Cookie-session auth:** httpOnly cookies set by the backend; frontend never touches tokens directly except reading cookie *presence* in `proxy.ts`.

## Layers

**Route Shell (`app/`):**
- Purpose: URL structure, layouts, guard wiring
- Location: `app/`
- Contains: `layout.tsx` files, thin page files that render feature components, error boundaries (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`)
- Depends on: features, ui components
- Used by: Next.js router

Route groups:
- `(auth)/` — public pages: `change-email`, `change-password`, `forgot-password`, `login`, `verify-email` (own centered-background layout)
- `(main)/` — authenticated app: home, `attendance`, `calendar`, `profile`, `users`, `users/[id]` (sidebar + header layout)
- `(main)/(admin)/` — admin-only: `dashboard`, `register`, `program`, `attendance-correction` (wrapped in `<RoleGuard allowedRoles={["admin"]}>`)

**Feature Slice (`features/`):**
- Purpose: All UI logic for one domain
- Location: `features/<domain>/`
- Contains: composed components, forms (react-hook-form + zod), table column definitions
- Depends on: hooks, `components/ui/*`
- Used by: `app/**/page.tsx`

**Data Hooks (`hooks/`):**
- Purpose: React-query bindings, cache keys, derived business state (e.g., `AttendanceStatus` enum derivation in `hooks/use-attendance.ts`)
- Location: `hooks/use-<domain>.ts`
- Depends on: services
- Used by: features

**Service Layer (`services/`):**
- Purpose: Endpoint functions returning parsed/typed data; response schemas defined here with zod
- Location: `services/<domain>.api.ts`
- Depends on: `lib/api-wrapper.ts`, `lib/common-zod-schema.ts`
- Used by: hooks (and occasionally components directly)

**Shared UI (`components/`):**
- Purpose: Cross-feature widgets and design-system primitives
- Location: `components/` (app-level: `app-sidebar.tsx`, `role-guard.tsx`, `image-upload.tsx`, `loading.tsx`, `no-data.tsx`, `theme-provider.tsx`, `tiptap/*`) and `components/ui/*` (shadcn primitives)
- Depends on: lucide-react, radix-ui
- Used by: features and app shells

## Data Flow

### Primary Request Path (read)

1. Page renders feature component (`app/(main)/attendance/page.tsx` → `features/attendance/attendance-table.tsx`)
2. Component calls hook, e.g. `useAttendance()` (`hooks/use-attendance.ts:23`)
3. Hook declares `useQuery({ queryKey: [...], queryFn })` pointing at service fn (`hooks/use-attendance.ts:30-38`)
4. Service fn calls `apiFetch<T>("/api/...")` (`services/attendance.api.ts:42-54`)
5. `apiFetch` adds `credentials: "include"` + JSON header, parses `ApiResponse<T>` envelope `{ success, message, data, meta? }`, toasts errors, returns json (`lib/api-wrapper.ts:38-118`)
6. Component reads `{ data, isLoading }` from hook result

### Write Flow (mutation)

1. User action triggers mutation returned by hook (e.g., `checkIn.mutate()`)
2. `useMutation` calls service fn → `apiFetch` POST (`hooks/use-attendance.ts:40-52`)
3. On success, hook invalidates related query keys: `queryClient.invalidateQueries({ queryKey: ["attendance"] })`
4. Active queries refetch automatically

### Auth Flow

1. `POST /api/auth/login` via `useLogin` (`hooks/use-login.ts`); backend sets `saher_access_token` + `saher_refresh_token` httpOnly cookies
2. `proxy.ts` edge middleware checks cookie presence on every navigation; unauthenticated users are redirected to `/login`, authenticated users are kept off auth pages (`proxy.ts:9-27`)
3. On any API 401, `apiFetch` fires a single shared `refreshSession()` (`POST /api/auth/refresh-token`), then retries the original request once; failure → toast "Session expired" + throw (`lib/api-wrapper.ts:73-112`)
4. Authorization: `(admin)` group layout wraps children in `RoleGuard allowedRoles={["admin"]}` (`app/(main)/(admin)/layout.tsx`); RoleGuard reads `useMe()` (`GET /api/auth/me`) and redirects unauthorized users to `/forbidden` (`components/role-guard.tsx`)
5. Sidebar nav is filtered by role from `useMe()` (`components/sidebar/nav-list.tsx`: `userRoutes` vs `adminRoutes`)

### Push Notification Flow

1. `features/notification/register-push.tsx` checks browser subscription state
2. `registerPush()` in `hooks/use-push-notification.ts` subscribes using `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`
3. Service worker `public/sw.js` handles `push` events and shows notifications

**State Management:**
- Server state: TanStack Query cache (`app/provider.tsx` default options: `retry: false`, `refetchOnWindowFocus: false`; individual hooks override with `retry: 3` and `staleTime` 30s–60s)
- Local UI state: React `useState` within components/tables (sorting/filters in `features/users/data-table.tsx`)
- Theme: `next-themes` via `components/theme-provider.tsx`
- No global client-state library

## Key Abstractions

**`apiFetch<T>` — the HTTP gateway:**
- Purpose: All backend I/O; enforces envelope shape `ApiResponse<T> = { success, message, data, meta? }` and pagination `MetaResponse`
- Location: `lib/api-wrapper.ts`
- Pattern: wrapper function with module-level refresh-promise singleton (dedupes concurrent 401 refreshes)

**Zod-inferred DTOs:**
- Purpose: Response typing without hand-written interfaces
- Examples: `services/attendance.api.ts` (`attendanceSchema` → `AttendanceResponse`), `services/attendance-correction.api.ts`, shared fields in `lib/common-zod-schema.ts` (`userField`, `dateField`)
- Pattern: schema declared next to endpoint functions; type exported via `z.infer`

**Data hooks:**
- Purpose: Domain data + derived flags
- Examples: `hooks/use-me.ts` (current user, `["user","me"]` key), `hooks/use-attendance.ts` (queries + mutations + `AttendanceStatus` enum), `hooks/use-notification.ts`, `hooks/use-profile.ts`, `hooks/use-calendar.ts`
- Pattern: one exported hook per file returning queries/mutations/derived values

**shadcn/ui primitives:**
- Purpose: Design system
- Examples: `components/ui/button.tsx`, `components/ui/sidebar.tsx` (701 lines, largest file), `components/ui/chart.tsx`
- Pattern: generated by shadcn CLI (config in `components.json`, style `radix-nova`, alias `@/components/ui`), customized in place, CVA variants

**TanStack Table wrapper:**
- Examples: `features/users/data-table.tsx` (`UserDataTable` generic over `TData/TValue`), `features/attendance-correction/corrections/data-table.tsx`
- Pattern: columns defined in sibling `column.tsx`, table instance with sorting/pagination/filter/visibility row models

## Entry Points

**Root layout:**
- Location: `app/layout.tsx`
- Triggers: every request
- Responsibilities: fonts (Inter, Geist), metadata, provider stack: `Providers` (React Query) → `ThemeProvider` → `TooltipProvider` → Toaster

**Proxy middleware:**
- Location: `proxy.ts`
- Triggers: all matched routes (excludes `_next`, favicon, image assets)
- Responsibilities: cookie-presence route guarding

**Pages:**
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

**What happens:** Most data access goes through `services/*.api.ts`, but some components call `apiFetch` inline — e.g., admin user detail fetch in `app/(main)/users/[id]/page.tsx` and push-enable in `features/notification/register-push.tsx`.
**Why it's wrong:** Two places to look for endpoints; skips zod validation/type reuse; duplicates query-key decisions in components.
**Do this instead:** Add a function to `services/users`-adjacent `.api.ts` file and consume it via a hook, matching `services/attendance.api.ts` + `hooks/use-attendance.ts`.

### Query key collisions across features

**What happens:** Admin user-detail query uses `queryKey: ["user", "profile", "me"]` in `app/(main)/users/[id]/page.tsx` while actual current-user uses `["user", "me"]` in `hooks/use-me.ts`.
**Why it's wrong:** Key doesn't reflect the resource (`/api/admin/user/:id`); risk of wrong-cache hits when invalidating `["user"]` prefixes.
**Do this instead:** Use resource-shaped keys like `["user", "detail", id]`.

### Dead SCSS styles directory

**What happens:** `styles/_keyframe-animations.scss` and `styles/_variables.scss` exist but are imported nowhere (styling is Tailwind v4 CSS-first in `app/globals.css`).
**Why it's wrong:** Misleads contributors about styling approach; `sass` isn't even a dependency.
**Do this instead:** Delete; put custom keyframes/variables in `app/globals.css`.

## Error Handling

**Strategy:** Defense in depth — toast at the network boundary, error boundaries at the route level, console logger as Sentry placeholder.

**Patterns:**
- Network errors: `apiFetch` shows `sonner` toast with backend `message` and throws (`lib/api-wrapper.ts:117-118`)
- Route errors: `app/error.tsx` logs via `logError` (`lib/logger.ts`), toasts, offers retry/home buttons; dev mode shows stack. `app/global-error.tsx` for root failures; `app/not-found.tsx` for 404s
- Loading/empty states: `<DefaultLoader />` (`components/loading.tsx`) and `<NoData />` (`components/no-data.tsx`) rendered conditionally in features
- Logger: `logError(error, context?)` in `lib/logger.ts` — console.error today, commented Sentry upgrade path

## Cross-Cutting Concerns

**Logging:** `console.error` via `lib/logger.ts`; no external sink yet.
**Validation:** Zod for form schemas (react-hook-form `zodResolver`, e.g., `features/register/register-schema.ts`, `features/login/components/login-form.tsx`) and response DTOs in services.
**Authentication:** Cookie sessions guarded at edge (`proxy.ts`) + client role checks (`components/role-guard.tsx`) + nav filtering (`components/sidebar/nav-list.tsx`).
**Theming:** `next-themes` class strategy; OKLCH CSS variables in `app/globals.css`.
**Dates:** `date-fns` helpers centralized in `lib/utils/time.ts` (`formatDate`, `transformTime`, `formatHours`).
**Class merging:** `cn()` helper in `lib/utils.ts` (clsx + tailwind-merge).

---

*Architecture analysis: 2026-08-24*
