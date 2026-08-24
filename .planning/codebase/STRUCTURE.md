# Codebase Structure

**Analysis Date:** 2026-08-24

## Directory Layout

```
saher-frontend/
├── app/                      # Next.js App Router: routes, layouts, error boundaries
│   ├── (auth)/               # Public route group (login, password/email flows)
│   ├── (main)/               # Authenticated route group
│   │   └── (admin)/          # Admin-only nested route group (RoleGuard)
│   ├── error.tsx             # Route error boundary
│   ├── global-error.tsx      # Root error boundary
│   ├── not-found.tsx         # 404 page
│   ├── layout.tsx            # Root layout (fonts, providers, toaster)
│   ├── provider.tsx          # QueryClientProvider setup
│   └── globals.css           # Tailwind v4 entry + OKLCH theme variables
├── features/                 # Domain feature slices (UI components per screen)
│   ├── attendance/
│   ├── attendance-correction/
│   ├── calendar/
│   ├── change-email/components/
│   ├── change-password/components/
│   ├── dashboard/
│   ├── forgot-password/components/
│   ├── login/components/
│   ├── notification/
│   ├── profile/
│   ├── program/
│   ├── register/             # Multi-step form + register-schema.ts
│   ├── users/
│   └── verify-email/components/
├── components/               # Shared widgets + shadcn design system
│   ├── ui/                   # ~35 shadcn/ui primitives (button, dialog, table…)
│   ├── sidebar/              # Sidebar composition (nav-list, nav-user, header)
│   ├── tiptap/               # Rich-text editor wrapper
│   ├── role-guard.tsx        # Client-side RBAC wrapper
│   ├── app-sidebar.tsx       # App shell sidebar
│   ├── image-upload.tsx      # Dropzone + crop upload widget
│   ├── loading.tsx / no-data.tsx  # Loading/empty state components
│   └── theme-provider.tsx / theme-toggle.tsx
├── hooks/                    # TanStack Query data hooks + UI hooks (use-*.ts)
├── services/                 # API layer: <domain>.api.ts endpoint functions
├── lib/                      # Core utilities
│   ├── api-wrapper.ts        # apiFetch: envelope, toasts, 401 refresh/retry
│   ├── common-zod-schema.ts  # Shared zod fields (userField, dateField)
│   ├── utils.ts              # cn() class merger
│   ├── utils/time.ts         # date-fns formatting helpers
│   ├── logger.ts             # logError (Sentry placeholder)
│   ├── image-url.ts          # imageUrl() normalizer
│   └── tiptap-utils.ts       # Editor helpers
├── styles/                   # ⚠ Dead SCSS files (not imported anywhere)
├── public/                   # Static assets + sw.js service worker
├── .github/workflows/dev-deploy.yml  # Self-hosted deploy on push to main
├── proxy.ts                  # Edge middleware (Next 16): cookie route guard
├── next.config.ts            # Minimal (images unoptimized)
├── tsconfig.json             # Strict TS, path alias @/* → repo root
├── components.json           # shadcn CLI config (radix-nova style)
├── Dockerfile                # Multi-stage build (node:24-alpine, pnpm)
└── eslint.config.mjs         # Flat ESLint config
```

## Directory Purposes

**`app/`:**
- Purpose: Routing only. Pages are thin shells composing feature components.
- Contains: layouts, pages, error boundaries, root providers
- Key files: `app/layout.tsx`, `app/provider.tsx`, `app/(main)/(admin)/layout.tsx`

**`features/`:**
- Purpose: All screen-level UI for one business domain. This is where new screens' logic lives.
- Contains: composed components, forms, table column defs, feature-local zod schemas (`features/register/register-schema.ts`)
- Key files: `features/attendance/attendance-status.tsx`, `features/users/data-table.tsx`, `features/register/user-register.tsx`
- Convention: flat `.tsx` files for most domains; auth-related domains nest under a `components/` subfolder (e.g., `features/login/components/login-form.tsx`)

**`components/ui/`:**
- Purpose: Generated shadcn primitives — treat as design-system output, edit sparingly.
- Generated: Yes (shadcn CLI; config in `components.json`, aliases map to this layout)

**`hooks/`:**
- Purpose: Data-access hooks wrapping react-query, plus generic UI hooks (`use-mobile.ts`, `use-window-size.ts`, `use-throttled-callback.ts`)
- Naming: strictly `use-<kebab-case>.ts`, one hook per file

**`services/`:**
- Purpose: One file per backend domain (`attendance.api.ts`, `attendance-correction.api.ts`, `calendar.api.ts`, `notification.api.ts`). Endpoint functions + response schemas/types.
- Convention: `<domain>.api.ts` suffix

**`lib/`:**
- Purpose: Framework-agnostic utilities shared across layers. `api-wrapper.ts` is the single HTTP gateway.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout — fonts, provider stack, Toaster
- `proxy.ts`: Edge middleware — auth redirect guard
- `app/(auth)/login/page.tsx`: Login entry (renders `features/login/components/login-form.tsx` in Suspense)
- `app/(main)/page.tsx`: Authenticated home screen

**Configuration:**
- `next.config.ts`: Next config (images unoptimized)
- `tsconfig.json`: strict mode, alias `@/*` → repo root (all imports use `@/`)
- `components.json`: shadcn generator config
- `eslint.config.mjs`, `postcss.config.mjs`: lint/style tooling
- `Dockerfile` / `Dockerfile.dev`: container builds
- `.github/workflows/dev-deploy.yml`: deploy pipeline (push to main → self-hosted docker compose)

**Core Logic:**
- `lib/api-wrapper.ts`: fetch wrapper, refresh-retry, response envelope
- `hooks/use-me.ts`: current-user session query (`UserT` type lives here)
- `lib/common-zod-schema.ts`: shared DTO fields
- `components/role-guard.tsx`: RBAC gate

**Testing:**
- None present. No test files, no test runner/config in the repo.

## Naming Conventions

**Files:**
- kebab-case everywhere: `attendance-correction-table.tsx`, `use-push-notification.ts`
- Services: `<domain>.api.ts` (e.g., `services/calendar.api.ts`)
- Hooks: `use-<thing>.ts` (e.g., `hooks/use-login.ts`)
- shadcn primitives: plain noun names in `components/ui/` (`button.tsx`, `dialog.tsx`)
- Column/table pairs: `column.tsx` + `data-table.tsx` colocated in feature dir

**Directories:**
- Features named by domain in kebab-case: `features/attendance-correction/`
- Optional `components/` subfolder inside auth-flow features only

**Exports:**
- Named exports for hooks/services/components (`export const useAttendance`, `export function AppSidebar`)
- Page/layout default exports only (Next.js requirement)
- Types suffixed `T` when hand-written (`UserT`, `NotificationResponseT`) or inferred from zod (`z.infer<typeof schema>`)

**Components:**
- Function declarations/arrow consts, PascalCase names
- Props type inline or named `Props`; tables use generics `<TData, TValue>`

## Where to Add New Code

**New page/screen:**
1. Feature components → `features/<domain>/<component>.tsx` (mark `"use client"` if it uses hooks/state)
2. Data access → `services/<domain>.api.ts` (endpoint fn + zod schema) and/or `hooks/use-<domain>.ts`
3. Route → `app/(main)/<route>/page.tsx` returning the feature component
4. Admin-only? Put it under `app/(main)/(admin)/<route>/page.tsx` (inherits RoleGuard automatically) and add nav entry in `components/sidebar/nav-list.tsx` (`adminRoutes`)
5. Tests → no existing convention; co-locate `*.test.tsx` beside source if introducing tests

**New API integration:**
- Follow `services/attendance.api.ts`: import `apiFetch` from `@/lib/api-wrapper`, define zod schema, export typed async functions returning `res.data` (and `{ data, meta }` for paginated lists)
- Consume via a hook in `hooks/use-<domain>.ts` with query keys prefixed by domain (`["attendance", ...]` style)

**New UI primitive:**
- Prefer `pnpm dlx shadcn@latest add <component>` — config in `components.json` places it in `components/ui/` automatically

**New shared widget:**
- `components/<widget-name>.tsx` (only if used by ≥2 features; otherwise keep in `features/<domain>/`)

**New hook (non-data):**
- `hooks/use-<name>.ts`, following existing generic hooks like `hooks/use-mobile.ts`

## Special Directories

**`styles/`:**
- Purpose: Legacy SCSS partials (`_variables.scss`, `_keyframe-animations.scss`)
- Generated: No
- Committed: Yes — but dead code: not imported anywhere, and `sass` is not a dependency. Do not add SCSS here; extend `app/globals.css`.

**`public/`:**
- Purpose: Static assets (logos, placeholder image) + `sw.js` push-notification service worker
- Generated: No; committed

**`.planning/codebase/`:**
- Purpose: GSD analysis documents (this directory)

**`node_modules/`:**
- pnpm-managed; `pnpm-workspace.yaml` lists `allowBuilds` for msw/sharp/unrs-resolver. Note: `msw` is allow-listed but not installed — no mocking infra exists yet.

---

*Structure analysis: 2026-08-24*
