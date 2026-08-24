# Technology Stack

**Analysis Date:** 2026-08-24

## Languages

**Primary:**
- TypeScript ~5.9 (`typescript ^5.9.3`) - entire codebase (`app/`, `components/`, `features/`, `hooks/`, `lib/`, `services/`)
  - Strict mode enabled, target ES2017, `moduleResolution: "bundler"`, JSX `react-jsx` (`tsconfig.json`)
  - Path alias: `@/*` → project root (`tsconfig.json:25-29`)

**Secondary:**
- SCSS partials - legacy style variables/keyframes (`styles/_variables.scss`, `styles/_keyframe-animations.scss`; not imported by app entry, which uses `app/globals.css`)

## Runtime

**Environment:**
- Node.js 24 (Docker images pin `node:24-alpine` — `Dockerfile:3`, `Dockerfile.dev:1`)
- Browser runtime for all data fetching; no server-side data layer (all API calls are client-side relative-URL fetches)

**Package Manager:**
- pnpm (Corepack enabled in Dockerfiles — `Dockerfile:5`)
- Lockfile: `pnpm-lock.yaml` (present) + `pnpm-workspace.yaml` (only built deps allowlist: `msw`, `sharp`, `unrs-resolver`)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router framework (`app/` directory); request interception uses Next 16's `proxy.ts` (middleware successor) at `proxy.ts`
- React 19.2.3 / react-dom 19.2.3
- Tailwind CSS v4 via PostCSS plugin (`postcss.config.mjs`, `@tailwindcss/postcss`); theme tokens/CSS variables live in `app/globals.css`

**UI System:**
- shadcn/ui — style `"radix-nova"`, base color zinc, RSC enabled, lucide icon library (`components.json`); generated components in `components/ui/*.tsx`
- radix-ui (unified package `^1.4.3`) + `@base-ui/react ^1.2.0` - primitive layers under shadcn components
- class-variance-authority + clsx + tailwind-merge - variant/utility composition (`lib/utils.ts`)
- lucide-react - icons
- next-themes - dark/light mode (`components/theme-provider.tsx`)
- sonner - toast notifications (`components/ui/sonner.tsx`)

**Data & Forms:**
- @tanstack/react-query ^5.94.5 - all server state; single QueryClient created in `app/provider.tsx` (retry disabled globally, `refetchOnWindowFocus: false`)
- @tanstack/react-table ^8.21.3 - data tables (`features/users/data-table.tsx`, `features/attendance-correction/corrections/data-table.tsx`)
- react-hook-form ^7.71.1 + @hookform/resolvers ^5.2.2 + zod ^4.3.6 - form validation (e.g. `features/register/register-schema.ts`, `services/attendance.api.ts` schemas)

**Feature Libraries:**
- @tiptap/react + starter-kit ^3.26.0 - rich text editor (`components/tiptap/editor.tsx`, `hooks/use-tiptap-editor.ts`)
- @fullcalendar/* ^6.1.20 (core, daygrid, timegrid, list, interaction, react) - calendar page (`features/calendar/calendar.tsx`)
- recharts 3.8.0 - charts (`features/attendance/attendance-chart.tsx`, `components/ui/chart.tsx`)
- react-day-picker ^9.14.0 - date picker base for `components/ui/calendar.tsx`
- react-dropzone ^15.0.0 + react-image-crop ^11.0.10 - image upload/crop flow (`components/image-upload.tsx`)
- date-fns ^4.1.0 - date math (`lib/utils/time.ts`)
- lodash.throttle ^4.1.1 + custom `hooks/use-throttled-callback.ts`

**Testing:**
- None installed. No test runner, assertion library, or test config exists. `msw` is allowlisted in `pnpm-workspace.yaml` but not a dependency.
- Only verification available: `pnpm lint` (ESLint) and `pnpm build` (type-checks during Next build)

**Build/Dev:**
- Next.js compiler/Turbopack dev server - `pnpm dev` / `pnpm build` / `pnpm start` (`package.json:5-9`)
- ESLint 9 flat config (`eslint.config.mjs`): `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`, plus `no-console` error (allows `warn`/`error`)
- Docker multi-stage build (`Dockerfile`: deps → builder → runner, standalone-ish output copy)

## Key Dependencies

**Critical:**
- next 16.1.6 - routing, rendering, proxy/middleware layer (`proxy.ts`)
- react / react-dom 19.2.3 - UI runtime
- @tanstack/react-query - every server interaction depends on it (`app/provider.tsx`)
- zod ^4 - response validation AND form schemas shared across features/services (`lib/common-zod-schema.ts`)

**Infrastructure:**
- jwt-decode ^4.0.0 - **installed but unused** (no import found anywhere in source; candidate for removal)

## Configuration

**Environment:**
- No `.env` files committed (none present in repo root)
- Single required public env var: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web-push VAPID key, consumed at `hooks/use-push-notification.ts:28`, injected as Docker build ARG+ENV (`Dockerfile:22-23,32-33`)
- `NODE_ENV` referenced for dev-only error detail (`app/global-error.tsx:60`, `app/error.tsx:52`)

**Build:**
- `next.config.ts` - minimal; only `images.unoptimized: true` (no next/image optimization pipeline)
- `tsconfig.json` - strict TS, bundler resolution, `@/*` alias
- `eslint.config.mjs` - flat config
- `postcss.config.mjs` - Tailwind v4 plugin only
- `components.json` - shadcn CLI config (aliases: `@/components`, `@/hooks`, `@/lib`, `@/components/ui`)

## Platform Requirements

**Development:**
- Node.js 24 recommended (matches Docker), Corepack/pnpm
- Backend API reachable at same origin under `/api/*` (all fetches use relative URLs — see INTEGRATIONS.md)

**Production:**
- Docker container (`Dockerfile`), served by `next start` on port 3000
- Deployed via GitHub Actions self-hosted runner running `docker compose up -d --build frontend` on the host (`.github/workflows/dev-deploy.yml`) — compose file lives outside this repo
- A reverse proxy must route same-origin `/api/*` (and `/uploads/*` images) to the backend; none of that wiring exists in this repo's `next.config.ts`

---

*Stack analysis: 2026-08-24*
